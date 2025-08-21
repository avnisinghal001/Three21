import React, { useState, useEffect } from 'react';
import { CheckCircle, Mic, Volume2, Globe, X, Settings } from 'react-feather';
import sarvam from '@/utils/sarvam';

export default function VoiceStatusPopup({ 
  preferences, 
  isVisible, 
  onClose,
  onOpenSettings 
}) {
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);

  useEffect(() => {
    if (isVisible) {
      // Speak the status when popup appears
      if (preferences?.audioEnabled) {
        const statusMessage = `Voice control ready. Audio feedback is ${preferences.audioEnabled ? 'enabled' : 'disabled'}. Language is ${getLanguageDisplayName(preferences.language || 'en-IN')}.`;
        speakStatusMessage(statusMessage, preferences.language || 'en-IN');
      }
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);
      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [isVisible, preferences]);

  if (!isVisible) return null;

  const getLanguageDisplayName = (code) => {
    const languageNames = {
      'en-IN': 'English (India)',
      'hi-IN': 'Hindi',
      'bn-IN': 'Bengali',
      'ta-IN': 'Tamil',
      'te-IN': 'Telugu',
      'mr-IN': 'Marathi',
      'gu-IN': 'Gujarati',
      'kn-IN': 'Kannada',
      'or-IN': 'Odia',
      'pa-IN': 'Punjabi'
    };
    return languageNames[code] || code;
  };

  const speakStatusMessage = async (text, language) => {
    try {
      console.log('🔊 Speaking status with Sarvam:', text);
      
      const responseTTS = await sarvam.textToSpeech.convert({
        text: text,
        speaker: "karun",
        model: "bulbul:v2",
        enable_preprocessing: true,
        target_language_code: language,
      });
      
      if (responseTTS && responseTTS.audios && responseTTS.audios[0]) {
        const audioBase64 = responseTTS.audios[0];
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        
        audio.onerror = () => console.error('Status audio playback failed');
        
        await audio.play();
      }
    } catch (error) {
      console.error('Sarvam status TTS failed:', error);
    }
  };

  return (
    <div className="voice-status-popup">
      <div className="popup-header">
        <div className="popup-title">
          <CheckCircle size={16} className="success-icon" />
          Voice Control Ready!
        </div>
        <button onClick={onClose} className="close-btn">
          <X size={14} />
        </button>
      </div>

      <div className="popup-content">
        <div className="status-grid">
          <div className="status-item">
            <Mic size={14} />
            <div className="status-text">
              <div className="status-label">Voice Commands</div>
              <div className="status-value">
                {preferences?.voiceCommands ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="status-item">
            <Volume2 size={14} />
            <div className="status-text">
              <div className="status-label">Audio Feedback</div>
              <div className="status-value">
                {preferences?.audioEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="status-item">
            <Globe size={14} />
            <div className="status-text">
              <div className="status-label">Language</div>
              <div className="status-value">
                {getLanguageDisplayName(preferences?.language || 'en-IN')}
              </div>
            </div>
          </div>
        </div>

        <div className="quick-tips">
          <div className="tips-title">Quick Commands:</div>
          <div className="tips-list">
            <div className="tip">"Hey Three21 Bot" - Start conversation</div>
            <div className="tip">"Expand model" - Disassemble 3D model</div>
            <div className="tip">"Start demo" - Open demo page</div>
          </div>
        </div>

        <div className="popup-actions">
          <button onClick={onOpenSettings} className="settings-btn">
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>

      <style jsx>{`
        .voice-status-popup {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 9998;
          font-family: system-ui, -apple-system, sans-serif;
          animation: slideInUp 0.3s ease-out;
          overflow: hidden;
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .popup-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .success-icon {
          color: #d1fae5;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .popup-content {
          padding: 1rem;
        }

        .status-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .status-item svg {
          color: #10b981;
          flex-shrink: 0;
        }

        .status-text {
          flex: 1;
        }

        .status-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .status-value {
          font-size: 0.8rem;
          color: #374151;
          font-weight: 600;
        }

        .quick-tips {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .tips-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 0.5rem;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .tip {
          font-size: 0.75rem;
          color: #0284c7;
          padding-left: 0.5rem;
          position: relative;
        }

        .tip:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #0284c7;
        }

        .popup-actions {
          display: flex;
          justify-content: center;
        }

        .settings-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .settings-btn:hover {
          background: #e5e7eb;
        }

        @media (max-width: 768px) {
          .voice-status-popup {
            width: 280px;
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
}
