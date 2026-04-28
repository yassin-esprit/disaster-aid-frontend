import React from 'react';
import type { VoiceCallStatus } from '../hooks/useVoiceCall';

interface VoiceCallControlsProps {
  status: VoiceCallStatus;
  isMuted: boolean;
  hasIncomingCall: boolean;
  onStartCall: () => void;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
}

export const VoiceCallControls: React.FC<VoiceCallControlsProps> = ({
  status,
  isMuted,
  hasIncomingCall,
  onStartCall,
  onAccept,
  onReject,
  onHangup,
  onToggleMute,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {status === 'idle' && !hasIncomingCall && (
        <button type="button" onClick={onStartCall}>
          Appeler
        </button>
      )}

      {(status === 'calling' || status === 'ringing') && (
        <>
          <span>{status === 'calling' ? 'Appel en cours...' : 'Ca sonne...'}</span>
          <button type="button" onClick={onHangup}>
            Raccrocher
          </button>
        </>
      )}

      {hasIncomingCall && (
        <>
          <span>Appel entrant</span>
          <button type="button" onClick={onAccept}>
            Accepter
          </button>
          <button type="button" onClick={onReject}>
            Refuser
          </button>
        </>
      )}

      {status === 'in-call' && (
        <>
          <span>En appel</span>
          <button type="button" onClick={onToggleMute}>
            {isMuted ? 'Activer micro' : 'Couper micro'}
          </button>
          <button type="button" onClick={onHangup}>
            Raccrocher
          </button>
        </>
      )}

      {status === 'rejected' && <span>Appel refuse</span>}
      {status === 'ended' && <span>Appel termine</span>}
      {status === 'error' && <span>Erreur voice call</span>}
    </div>
  );
};
