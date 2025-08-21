import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Settings, X, Check, Globe, Loader, ArrowRight } from 'react-feather';

// Supported languages with proper codes and display names
export const SUPPORTED_LANGUAGES = {
  'bn-IN': { name: 'Bengali (বাংলা)', native: 'বাংলা' },
  'en-IN': { name: 'English (India)', native: 'English' },
  'gu-IN': { name: 'Gujarati (ગુજરાતી)', native: 'ગુજરાતી' },
  'hi-IN': { name: 'Hindi (हिन्दी)', native: 'हिन्दी' },
  'kn-IN': { name: 'Kannada (ಕನ್ನಡ)', native: 'ಕನ್ನಡ' },
  'ml-IN': { name: 'Malayalam (മലയാളം)', native: 'മലയാളം' },
  'mr-IN': { name: 'Marathi (मराठी)', native: 'मराठी' },
  'od-IN': { name: 'Odia (ଓଡ଼ିଆ)', native: 'ଓଡ଼ିଆ' },
  'pa-IN': { name: 'Punjabi (ਪੰਜਾਬੀ)', native: 'ਪੰਜਾਬੀ' },
  'ta-IN': { name: 'Tamil (தமிழ்)', native: 'தமிழ்' },
  'te-IN': { name: 'Telugu (తెలుగు)', native: 'తెలుగు' },
  'as-IN': { name: 'Assamese (অসমীয়া)', native: 'অসমীয়া' },
  'brx-IN': { name: 'Bodo (बर\')', native: 'बर\'' },
  'doi-IN': { name: 'Dogri (डोगरी)', native: 'डोगरी' },
  'kok-IN': { name: 'Konkani (कोंकणी)', native: 'कोंकणी' },
  'ks-IN': { name: 'Kashmiri (كٲشُر)', native: 'कॉशुर' },
  'mai-IN': { name: 'Maithili (मैथिली)', native: 'मैथिली' },
  'mni-IN': { name: 'Manipuri (মৈতৈলোন্)', native: 'ꯃꯩꯇꯩꯂꯣꯟ' },
  'ne-IN': { name: 'Nepali (नेपाली)', native: 'नेपाली' },
  'sa-IN': { name: 'Sanskrit (संस्कृत)', native: 'संस्कृत' },
  'sat-IN': { name: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  'sd-IN': { name: 'Sindhi (سنڌي)', native: 'सिन्धी' },
  'ur-IN': { name: 'Urdu (اردو)', native: 'اردو' }
};

export default function VoiceOnboardingModal({ 
  isOpen, 
  onClose, 
  onComplete 
}) {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const TOTAL_STEPS = 3;

  const playWelcomeAudio = async () => {
    if (!audioEnabled) return;
    
    setIsPlaying(true);
    try {
      // Import the voice manager here to avoid circular dependencies
      const { default: testSarvamTTS } = await import('@/utils/testSarvamTTS');
      
      const welcomeText = selectedLanguage === 'en-IN' 
        ? "Welcome to Three two one! Your voice-controlled Three Dee AI assistant is ready. Say 'Hey Three Two One Bot' to get started."
        : "Three two one में आपका स्वागत है! आपका वॉइस-कंट्रोल्ड three dee AI असिस्टेंट तैयार है।";
      
      await testSarvamTTS(welcomeText, selectedLanguage, true);
      
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
      
    } catch (error) {
      console.error('Welcome audio failed:', error);
      setIsPlaying(false);
    }
  };

  const handleComplete = () => {
    const preferences = {
      language: selectedLanguage,
      voiceEnabled,
      audioEnabled,
      voiceCommands,
      timestamp: Date.now()
    };
    
    // Store preferences in localStorage
    localStorage.setItem('three21_voice_preferences', JSON.stringify(preferences));
    
    // Play welcome audio after 3 seconds
    setTimeout(() => {
      playWelcomeAudio();
    }, 3000);
    
    onComplete(preferences);
    onClose();
  };

  const nextStep = () => {
    console.log('Next step clicked, current step:', step, 'TOTAL_STEPS:', TOTAL_STEPS);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      console.log('Moving to step:', step + 1);
    } else {
      console.log('Completing setup');
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-onboarding-overlay">
      <div className="voice-onboarding-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="voice-icon">
                <Mic size={24} />
              </div>
              <h2>Three21 Voice Setup</h2>
            </div>
            <div className="step-indicator">
              <span>Step {step} of {TOTAL_STEPS}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="modal-content">
          {step === 1 && (
            <div className="step-content">
              <div className="step-icon">
                <Globe size={48} />
              </div>
              <h3>Choose Your Preferred Language</h3>
              <p>Select the language for voice commands and responses</p>
              
              <div className="language-grid">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => {
                      console.log('Language selected:', code, lang);
                      setSelectedLanguage(code);
                    }}
                    className={`language-option ${selectedLanguage === code ? 'selected' : ''}`}
                  >
                    <span className="language-native">{lang.native}</span>
                    <span className="language-english">{lang.name}</span>
                    {selectedLanguage === code && (
                      <Check className="selected-icon" size={16} />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Debug info */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.5rem', 
                background: '#f0f4ff', 
                borderRadius: '8px', 
                fontSize: '0.875rem',
                color: '#667eea'
              }}>
                Selected: {selectedLanguage} | Step: {step} of {TOTAL_STEPS}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="step-icon">
                <Settings size={48} />
              </div>
              <h3>Voice & Audio Preferences</h3>
              <p>Customize your voice interaction experience</p>
              
              <div className="preferences-list">
                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-icon">
                      {voiceEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                    </div>
                    <div>
                      <h4>Voice Input</h4>
                      <p>Enable microphone for voice commands</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`toggle-button ${voiceEnabled ? 'active' : ''}`}
                  >
                    <div className="toggle-slider" />
                  </button>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-icon">
                      {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </div>
                    <div>
                      <h4>Audio Responses</h4>
                      <p>Hear AI responses through text-to-speech</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`toggle-button ${audioEnabled ? 'active' : ''}`}
                  >
                    <div className="toggle-slider" />
                  </button>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-icon">
                      <Mic size={20} />
                    </div>
                    <div>
                      <h4>Website Voice Control</h4>
                      <p>Control the website with voice commands</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVoiceCommands(!voiceCommands)}
                    className={`toggle-button ${voiceCommands ? 'active' : ''}`}
                  >
                    <div className="toggle-slider" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="step-icon">
                <Check size={48} />
              </div>
              <h3>Ready to Start!</h3>
              <p>Your voice AI assistant is configured and ready to use</p>
              
              <div className="summary-card">
                <h4>Your Settings:</h4>
                <div className="summary-list">
                  <div className="summary-item">
                    <Globe size={16} />
                    <span>Language: {SUPPORTED_LANGUAGES[selectedLanguage].name}</span>
                  </div>
                  <div className="summary-item">
                    {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    <span>Voice Input: {voiceEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="summary-item">
                    {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span>Audio Responses: {audioEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="summary-item">
                    <Mic size={16} />
                    <span>Voice Commands: {voiceCommands ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="voice-commands-preview">
                <h4>Try these voice commands:</h4>
                <div className="commands-list">
                  <span>"Hey Three Two One Bot, start demo"</span>
                  <span>"Expand the model"</span>
                  <span>"Assemble karo" / "Chota kardo"</span>
                  <span>"Open chat interface"</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-buttons">
            {step > 1 && (
              <button 
                onClick={() => {
                  console.log('PREVIOUS CLICKED!', step);
                  prevStep();
                }} 
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            
            <button 
              onClick={() => {
                console.log('NEXT CLICKED!', step, TOTAL_STEPS);
                nextStep();
              }} 
              className="btn-primary"
              disabled={isPlaying}
            >
              {isPlaying ? (
                <>
                  <Loader size={16} />
                  Loading...
                </>
              ) : step === TOTAL_STEPS ? (
                <>
                  <Check size={16} />
                  Finish Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .voice-onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 15, 19, 0.9);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: overlayFadeIn 0.3s ease;
          pointer-events: auto;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .voice-onboarding-modal {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          width: 100%;
          max-width: 37.5rem;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);
          animation: modalSlideIn 0.4s ease;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(50px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 2rem 2rem 1rem;
          color: #fafafa;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .voice-icon {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fafafa;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .modal-body {
          background: rgba(15, 15, 19, 0.95);
          padding: 2rem;
          flex: 1;
          overflow-y: auto;
        }
          align-items: center;
          justify-content: center;
        }

        .logo-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .step-indicator {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .modal-content {
          background: white;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          min-height: 400px;
        }

        .step-content {
          padding: 2rem;
          text-align: center;
          width: 100%;
        }

        .step-icon {
          margin-bottom: 1.5rem;
          color: #667eea;
        }

        .step-content h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .step-content p {
          color: #6b7280;
          font-size: 1rem;
          margin-bottom: 2rem;
        }

        .language-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .language-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .language-option:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .language-option.selected {
          border-color: #667eea;
          background: #f0f4ff;
          transform: scale(1.02);
        }

        .language-native {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .language-english {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .selected-icon {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: #667eea;
        }

        .preferences-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preference-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
        }

        .preference-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
        }

        .preference-icon {
          background: #667eea;
          color: white;
          padding: 0.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preference-info h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .preference-info p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .toggle-button {
          width: 60px;
          height: 32px;
          border-radius: 16px;
          border: none;
          background: #d1d5db;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-button.active {
          background: #667eea;
        }

        .toggle-slider {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 4px;
          left: 4px;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-button.active .toggle-slider {
          transform: translateX(28px);
        }

        .summary-card {
          background: #f0f4ff;
          border: 2px solid #667eea;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .summary-card h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #374151;
        }

        .voice-commands-preview {
          text-align: left;
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .voice-commands-preview h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .commands-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .commands-list span {
          background: #e5e7eb;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #374151;
          font-style: italic;
        }

        .modal-footer {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .footer-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          align-items: center;
        }

        .btn-secondary, .btn-primary {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: 2px solid transparent;
          min-width: 120px;
          position: relative;
          z-index: 9999;
        }

        .btn-secondary {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-color: #667eea;
        }

        .btn-secondary:hover {
          background: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: #667eea;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #5a67d8, #6b46c1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        @media (max-width: 768px) {
          .voice-onboarding-modal {
            margin: 1rem;
            width: calc(100% - 2rem);
          }

          .modal-header, .step-content, .modal-footer {
            padding: 1.5rem;
          }

          .language-grid {
            grid-template-columns: 1fr;
            max-height: 250px;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .footer-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
