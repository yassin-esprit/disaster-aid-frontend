import React, { useEffect, useRef } from 'react';
import { useVoiceCall } from './hooks/useVoiceCall';
import { VoiceCallControls } from './components/VoiceCallControls';

interface ChatConversationProps {
  currentUserId: number;
  peerUserId: number;
  conversationId: number;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  currentUserId,
  peerUserId,
  conversationId,
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const voice = useVoiceCall({
    currentUserId,
    peerUserId,
    conversationId,
    wsEndpoint: '/ws-chat',
    onIncomingCall: (fromUserId, callId) => {
      console.info('Incoming call', { fromUserId, callId });
    },
    onRemoteStream: (stream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    },
    onCallEnded: () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    },
    onError: (error) => {
      console.error('Voice call error:', error.message);
    },
  });

  useEffect(() => {
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <section>
      {/* Chat content */}
      <VoiceCallControls
        status={voice.status}
        isMuted={voice.isMuted}
        hasIncomingCall={voice.hasIncomingCall}
        onStartCall={voice.startCall}
        onAccept={voice.acceptCall}
        onReject={voice.rejectCall}
        onHangup={voice.endCall}
        onToggleMute={voice.toggleMute}
      />
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </section>
  );
};
