export interface VoiceCallManagerCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onError: (error: Error) => void;
}

export interface VoiceCallManagerConfig {
  iceServers?: RTCIceServer[];
}

export class VoiceCallManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor(
    private readonly callbacks: VoiceCallManagerCallbacks,
    private readonly config: VoiceCallManagerConfig = {}
  ) {}

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async initLocalAudio(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch {
      throw new Error('Microphone access denied or unavailable');
    }
  }

  createPeer(onIceCandidate: (candidate: RTCIceCandidate) => void): RTCPeerConnection {
    const peer = new RTCPeerConnection({
      iceServers: this.config.iceServers ?? [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.remoteStream = new MediaStream();

    peer.ontrack = (event) => {
      const firstStream = event.streams[0];
      if (firstStream) {
        this.callbacks.onRemoteStream(firstStream);
        return;
      }

      event.track && this.remoteStream?.addTrack(event.track);
      if (this.remoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        this.callbacks.onError(new Error(`Peer connection state: ${peer.connectionState}`));
      }
    };

    this.peerConnection = peer;
    return peer;
  }

  attachLocalTracks(): void {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    if (!this.localStream) {
      throw new Error('Local audio stream not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream as MediaStream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({ offerToReceiveAudio: true });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(remoteOffer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async applyRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  cleanup(): void {
    this.peerConnection?.getSenders().forEach((sender) => sender.track?.stop());
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());
    this.peerConnection?.close();

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
  }
}
