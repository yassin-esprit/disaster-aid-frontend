import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VoiceSocket, type VoiceSignalMessage, type VoiceSignalType } from '../../../realtime/voiceSocket';
import { VoiceCallManager } from '../../../webrtc/voiceCallManager';

export type VoiceCallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'incoming'
  | 'in-call'
  | 'rejected'
  | 'ended'
  | 'error';

interface UseVoiceCallParams {
  conversationId: number;
  currentUserId: number;
  peerUserId: number;
  wsEndpoint: string;
  onIncomingCall?: (fromUserId: number, callId: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnded?: () => void;
  onError?: (error: Error) => void;
}

interface PendingIncomingCall {
  callId: string;
  fromUserId: number;
  offer: RTCSessionDescriptionInit;
}

interface UseVoiceCallResult {
  status: VoiceCallStatus;
  isMuted: boolean;
  hasIncomingCall: boolean;
  startCall: () => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const parsePayload = <T,>(payload?: string): T | null => {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
};

export function useVoiceCall(params: UseVoiceCallParams): UseVoiceCallResult {
  const {
    conversationId,
    currentUserId,
    peerUserId,
    wsEndpoint,
    onIncomingCall,
    onRemoteStream,
    onCallEnded,
    onError,
  } = params;

  const [status, setStatus] = useState<VoiceCallStatus>('idle');
  const [callId, setCallId] = useState<string | null>(null);
  const [pendingIncomingCall, setPendingIncomingCall] = useState<PendingIncomingCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<VoiceSocket | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const managerRef = useRef<VoiceCallManager | null>(null);

  const emitError = useCallback(
    (error: Error) => {
      setStatus('error');
      onError?.(error);
    },
    [onError]
  );

  const cleanupCall = useCallback(
    (notifyEnd: boolean) => {
      managerRef.current?.cleanup();
      managerRef.current = null;
      setPendingIncomingCall(null);
      setCallId(null);
      setIsMuted(false);
      setStatus('idle');
      if (notifyEnd) onCallEnded?.();
    },
    [onCallEnded]
  );

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new VoiceCallManager({
        onRemoteStream: (stream) => onRemoteStream?.(stream),
        onError: emitError,
      });
    }
    return managerRef.current;
  }, [emitError, onRemoteStream]);

  const sendSignal = useCallback(
    (type: VoiceSignalType, payload?: unknown, toUserId?: number, explicitCallId?: string): string => {
      const socket = socketRef.current;
      if (!socket) {
        throw new Error('Voice socket not initialized');
      }

      const resolvedCallId = explicitCallId ?? callId ?? crypto.randomUUID();
      const message: VoiceSignalMessage = {
        conversationId,
        fromUserId: currentUserId,
        toUserId,
        callId: resolvedCallId,
        type,
        payload: payload ? JSON.stringify(payload) : undefined,
      };
      socket.sendSignal(message);
      return resolvedCallId;
    },
    [callId, conversationId, currentUserId]
  );

  const handleSignal = useCallback(
    async (message: VoiceSignalMessage) => {
      if (message.fromUserId === currentUserId) return;
      if (message.toUserId && message.toUserId !== currentUserId) return;

      try {
        switch (message.type) {
          case 'CALL_INIT': {
            if (status === 'in-call' || status === 'calling' || status === 'ringing') {
              sendSignal('CALL_REJECTED', { reason: 'busy' }, message.fromUserId, message.callId);
              return;
            }
            setStatus('incoming');
            setCallId(message.callId);
            onIncomingCall?.(message.fromUserId, message.callId);
            sendSignal('CALL_RINGING', undefined, message.fromUserId, message.callId);
            return;
          }

          case 'CALL_RINGING':
            setStatus('ringing');
            return;

          case 'CALL_ACCEPTED':
            setStatus('in-call');
            return;

          case 'CALL_REJECTED':
            setStatus('rejected');
            managerRef.current?.cleanup();
            managerRef.current = null;
            return;

          case 'WEBRTC_OFFER': {
            const offer = parsePayload<RTCSessionDescriptionInit>(message.payload);
            if (!offer) throw new Error('Invalid offer payload');
            setPendingIncomingCall({
              callId: message.callId,
              fromUserId: message.fromUserId,
              offer,
            });
            return;
          }

          case 'WEBRTC_ANSWER': {
            const answer = parsePayload<RTCSessionDescriptionInit>(message.payload);
            if (!answer || !managerRef.current) return;
            await managerRef.current.applyRemoteAnswer(answer);
            setStatus('in-call');
            return;
          }

          case 'ICE_CANDIDATE': {
            const candidate = parsePayload<RTCIceCandidateInit>(message.payload);
            if (!candidate || !managerRef.current) return;
            await managerRef.current.addIceCandidate(candidate);
            return;
          }

          case 'CALL_ENDED':
            cleanupCall(true);
            setStatus('ended');
            return;
        }
      } catch (error) {
        emitError(error instanceof Error ? error : new Error('Voice signaling failed'));
      }
    },
    [cleanupCall, currentUserId, emitError, onIncomingCall, sendSignal, status]
  );

  useEffect(() => {
    const socket = new VoiceSocket({
      wsEndpoint,
      publishDestination: '/app/voicecall.signal',
      topicPrefix: '/topic/voicecall',
    });
    socketRef.current = socket;

    void socket
      .connect(emitError)
      .then(() => {
        unsubscribeRef.current = socket.subscribeConversation(conversationId, (message) => {
          void handleSignal(message);
        }, emitError);
      })
      .catch(emitError);

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      socket.disconnect();
      cleanupCall(false);
    };
  }, [cleanupCall, conversationId, emitError, handleSignal, wsEndpoint]);

  const startCall = useCallback(async () => {
    try {
      const manager = getManager();
      await manager.initLocalAudio();

      const currentCallId = crypto.randomUUID();
      setCallId(currentCallId);
      setStatus('calling');

      sendSignal('CALL_INIT', undefined, peerUserId, currentCallId);

      manager.createPeer((candidate) => {
        sendSignal('ICE_CANDIDATE', candidate.toJSON(), peerUserId, currentCallId);
      });
      manager.attachLocalTracks();

      const offer = await manager.createOffer();
      sendSignal('WEBRTC_OFFER', offer, peerUserId, currentCallId);
    } catch (error) {
      emitError(error instanceof Error ? error : new Error('Unable to start call'));
    }
  }, [emitError, getManager, peerUserId, sendSignal]);

  const acceptCall = useCallback(async () => {
    if (!pendingIncomingCall) return;
    try {
      const manager = getManager();
      await manager.initLocalAudio();

      const activeCallId = pendingIncomingCall.callId;
      setCallId(activeCallId);

      manager.createPeer((candidate) => {
        sendSignal('ICE_CANDIDATE', candidate.toJSON(), pendingIncomingCall.fromUserId, activeCallId);
      });
      manager.attachLocalTracks();

      sendSignal('CALL_ACCEPTED', undefined, pendingIncomingCall.fromUserId, activeCallId);
      const answer = await manager.createAnswer(pendingIncomingCall.offer);
      sendSignal('WEBRTC_ANSWER', answer, pendingIncomingCall.fromUserId, activeCallId);

      setPendingIncomingCall(null);
      setStatus('in-call');
    } catch (error) {
      emitError(error instanceof Error ? error : new Error('Unable to accept call'));
    }
  }, [emitError, getManager, pendingIncomingCall, sendSignal]);

  const rejectCall = useCallback(() => {
    if (!pendingIncomingCall) return;
    sendSignal('CALL_REJECTED', { reason: 'user-rejected' }, pendingIncomingCall.fromUserId, pendingIncomingCall.callId);
    setPendingIncomingCall(null);
    setCallId(null);
    setStatus('idle');
  }, [pendingIncomingCall, sendSignal]);

  const endCall = useCallback(() => {
    if (callId) {
      sendSignal('CALL_ENDED', undefined, peerUserId, callId);
    }
    cleanupCall(true);
  }, [callId, cleanupCall, peerUserId, sendSignal]);

  const toggleMute = useCallback(() => {
    const local = managerRef.current?.getLocalStream();
    if (!local) return;
    local.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  }, []);

  return useMemo(
    () => ({
      status,
      isMuted,
      hasIncomingCall: Boolean(pendingIncomingCall),
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
    }),
    [acceptCall, endCall, isMuted, pendingIncomingCall, rejectCall, startCall, status, toggleMute]
  );
}
