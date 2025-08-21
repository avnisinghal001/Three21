import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X, Settings } from 'react-feather';
import VoiceManager from '../utils/voiceManager';

export default function PersistentVoiceControl({ 
  preferences, 
  onToggleListening,
  onVoiceCommand,
  setShowVoiceOnboarding
}) {
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  
  const voiceManagerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Initialize voice manager
  useEffect(() => {
    if (preferences?.voiceEnabled) {
      voiceManagerRef.current = new VoiceManager();
    }
    return () => {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.cleanup();
      }
    };
  }, [preferences?.voiceEnabled]);

  // Website navigation voice commands
  const WEBSITE_COMMANDS = {
    // Navigation commands
    'start_demo': {
      patterns: ['hey three two one bot start demo', 'start demo', 'open demo', 'show demo'],
      action: () => navigateToPage('/model?type=demo')
    },
    'upload_model': {
      patterns: ['upload model', 'import model', 'upload file', 'add model'],
      action: () => navigateToPage('/import-model')
    },
    'voice_demo': {
      patterns: ['voice demo', 'voice control demo', 'show voice demo'],
      action: () => navigateToPage('/voice-demo')
    },
    'test_sarvam': {
      patterns: ['test voice', 'test sarvam', 'test audio', 'voice test'],
      action: () => navigateToPage('/sarvam-test')
    },
    'home': {
      patterns: ['go home', 'homepage', 'main page', 'home page'],
      action: () => navigateToPage('/')
    },
    
    // Model control commands
    'expand_model': {
      patterns: ['expand model', 'expand the model', 'disassemble', 'open model'],
      action: () => triggerModelAction('expand')
    },
    'collapse_model': {
      patterns: ['collapse model', 'assemble', 'chota kardo', 'close model', 'put together'],
      action: () => triggerModelAction('collapse')
    },
    'rotate_left': {
      patterns: ['rotate left', 'turn left', 'left rotation'],
      action: () => triggerModelAction('rotate_left')
    },
    'rotate_right': {
      patterns: ['rotate right', 'turn right', 'right rotation'],
      action: () => triggerModelAction('rotate_right')
    },
    'zoom_in': {
      patterns: ['zoom in', 'magnify', 'bigger', 'zoom closer'],
      action: () => triggerModelAction('zoom_in')
    },
    'zoom_out': {
      patterns: ['zoom out', 'smaller', 'zoom back', 'zoom away'],
      action: () => triggerModelAction('zoom_out')
    },
    
    // Chat interface commands
    'open_chat': {
      patterns: ['open chat', 'chat interface', 'hey three two one bot', 'start chatting', 'talk to bot'],
      action: () => openChatInterface()
    },
    'close_chat': {
      patterns: ['close chat', 'end chat', 'stop chatting'],
      action: () => closeChatInterface()
    },
    
    // General commands
    'screenshot': {
      patterns: ['take screenshot', 'capture screen', 'screenshot', 'take picture'],
      action: () => triggerScreenshot()
    },
    'reset_view': {
      patterns: ['reset view', 'reset', 'default view', 'original position'],
      action: () => triggerModelAction('reset')
    }
  };

  const navigateToPage = (path) => {
    if (typeof window !== 'undefined') {
      // Dispatch specific event for demo navigation
      if (path.includes('demo')) {
        window.dispatchEvent(new CustomEvent('voiceNavigateDemo', { 
          detail: { path, timestamp: Date.now() } 
        }));
      } else {
        window.location.href = path;
      }
      
      speakResponse(`Navigating to ${path.includes('demo') ? 'demo page' : path === '/' ? 'homepage' : path.replace('/', '').replace('-', ' ')}`);
    }
  };

  const triggerModelAction = (action) => {
    // Dispatch custom event for model interactions
    window.dispatchEvent(new CustomEvent('voiceModelAction', { 
      detail: { action, timestamp: Date.now() } 
    }));
    
    const actionMessages = {
      expand: 'Expanding the model',
      collapse: 'Assembling the model',
      rotate_left: 'Rotating left',
      rotate_right: 'Rotating right', 
      zoom_in: 'Zooming in',
      zoom_out: 'Zooming out',
      reset: 'Resetting view'
    };
    
    speakResponse(actionMessages[action] || `Executing ${action}`);
    setLastCommand(actionMessages[action]);
  };

  const openChatInterface = () => {
    // Trigger chat opening
    window.dispatchEvent(new CustomEvent('voiceOpenChat', { 
      detail: { timestamp: Date.now() } 
    }));
    speakResponse('Opening chat interface. How can I help you?');
    setLastCommand('Chat opened');
  };

  const closeChatInterface = () => {
    window.dispatchEvent(new CustomEvent('voiceCloseChat', { 
      detail: { timestamp: Date.now() } 
    }));
    speakResponse('Closing chat interface');
    setLastCommand('Chat closed');
  };

  const triggerScreenshot = () => {
    window.dispatchEvent(new CustomEvent('voiceScreenshot', { 
      detail: { timestamp: Date.now() } 
    }));
    speakResponse('Taking screenshot');
    setLastCommand('Screenshot taken');
  };

  const speakResponse = async (text) => {
    if (preferences?.audioEnabled && voiceManagerRef.current) {
      try {
        await voiceManagerRef.current.textToSpeech(text, preferences.language || 'en-IN');
      } catch (error) {
        console.error('TTS failed:', error);
      }
    }
  };

  const processVoiceCommand = async (transcript) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    setTranscript(lowerTranscript);
    setIsProcessing(true);
    
    try {
      console.log('🎤 Processing voice command with AI:', transcript);
      
      // Call AI-powered voice command API
      const response = await fetch('/api/voice-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceInput: transcript,
          language: preferences?.language || 'en-IN'
        }),
      });

      const result = await response.json();
      console.log('🤖 AI Command Result:', result);

      // Execute the determined function
      if (result.confidence >= 0.7 && result.function !== 'chatQuery') {
        await executeVoiceFunction(result.function, result.parameters || {});
        setLastCommand(`Executed: ${result.function}`);
      } else {
        // Low confidence or chat query - handle as chat
        console.log('🗣️ Treating as chat query:', result.fallback || transcript);
        openChatInterface();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('voiceChatQuery', { 
            detail: { query: result.fallback || transcript, timestamp: Date.now() } 
          }));
        }, 1000);
        setLastCommand('Chat query sent');
      }
      
    } catch (error) {
      console.error('❌ Voice command processing failed:', error);
      // Fallback to old pattern matching
      processVoiceCommandFallback(lowerTranscript);
    }
    
    setIsProcessing(false);
    setTimeout(() => {
      setTranscript('');
      setLastCommand('');
    }, 3000);
  };

  const executeVoiceFunction = async (functionName, parameters) => {
    const functionMap = {
      // Navigation functions - dispatch events to main page
      navigateToDemo: () => {
        window.dispatchEvent(new CustomEvent('voiceNavigateDemo', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Opening demo page');
      },
      navigateToUpload: () => {
        window.dispatchEvent(new CustomEvent('voiceNavigateUpload', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Opening upload page');
      },
      navigateToHome: () => {
        window.dispatchEvent(new CustomEvent('voiceNavigateHome', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Going to homepage');
      },
      
      // Model control functions - dispatch events to model page
      expandModel: () => {
        window.dispatchEvent(new CustomEvent('ai-expand-model', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Expanding the model');
      },
      assembleModel: () => {
        window.dispatchEvent(new CustomEvent('ai-assemble-model', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Assembling the model');
      },
      rotateModel: () => {
        window.dispatchEvent(new CustomEvent('ai-rotate-model', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Rotating the model');
      },
      zoomIn: () => {
        window.dispatchEvent(new CustomEvent('ai-zoom-in', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Zooming in');
      },
      zoomOut: () => {
        window.dispatchEvent(new CustomEvent('ai-zoom-out', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Zooming out');
      },
      resetView: () => {
        window.dispatchEvent(new CustomEvent('ai-reset-view', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Resetting view to default');
      },
      
      // Interface functions - dispatch events to model page
      openChat: () => {
        window.dispatchEvent(new CustomEvent('ai-open-chat', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Opening chat interface');
      },
      closeChat: () => {
        window.dispatchEvent(new CustomEvent('ai-close-chat', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Closing chat interface');
      },
      toggleChat: () => {
        window.dispatchEvent(new CustomEvent('ai-toggle-chat', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Toggling chat interface');
      },
      takeScreenshot: () => {
        window.dispatchEvent(new CustomEvent('ai-screenshot', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Taking screenshot');
      },
      testVoice: () => {
        window.dispatchEvent(new CustomEvent('voiceTestFunction', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Testing voice functionality');
      },
      
      // Legacy support for old function names
      collapseModel: () => {
        window.dispatchEvent(new CustomEvent('ai-assemble-model', { 
          detail: { timestamp: Date.now() } 
        }));
        speakResponse('Assembling the model');
      },
      rotateLeft: () => {
        window.dispatchEvent(new CustomEvent('ai-rotate-model', { 
          detail: { timestamp: Date.now(), direction: 'left' } 
        }));
        speakResponse('Rotating left');
      },
      rotateRight: () => {
        window.dispatchEvent(new CustomEvent('ai-rotate-model', { 
          detail: { timestamp: Date.now(), direction: 'right' } 
        }));
        speakResponse('Rotating right');
      }
    };

    const func = functionMap[functionName];
    if (func) {
      console.log('✅ Executing function:', functionName);
      func();
    } else {
      console.warn('⚠️ Unknown function:', functionName);
    }
  };

  const testVoiceFunction = () => {
    speakResponse('Voice test successful! Three21 bot is listening and ready to help.');
    setLastCommand('Voice test completed');
  };

  // Fallback pattern matching (original implementation)
  const processVoiceCommandFallback = (lowerTranscript) => {
    console.log('🔄 Using fallback pattern matching');
    
    // Find matching command (original logic)
    for (const [commandKey, command] of Object.entries(WEBSITE_COMMANDS)) {
      for (const pattern of command.patterns) {
        if (lowerTranscript.includes(pattern.toLowerCase())) {
          console.log('Voice command matched:', commandKey, pattern);
          command.action();
          setIsProcessing(false);
          
          setTimeout(() => {
            setTranscript('');
            setLastCommand('');
          }, 3000);
          
          return;
        }
      }
    }
    
    // If no command matched, treat as chat query
    if (lowerTranscript.length > 5) {
      openChatInterface();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('voiceChatQuery', { 
          detail: { query: transcript, timestamp: Date.now() } 
        }));
      }, 1000);
    }
  };

  const startListening = async () => {
    if (!voiceManagerRef.current || !preferences?.voiceEnabled) return;
    
    const success = await voiceManagerRef.current.startListening(
      (finalTranscript, interim) => {
        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      },
      (voiceResult) => {
        processVoiceCommand(voiceResult);
      }
    );
    
    if (success) {
      setIsListening(true);
      onToggleListening?.(true);
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    }
  };

  const stopListening = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopListening();
    }
    setIsListening(false);
    onToggleListening?.(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!preferences?.voiceCommands) {
    return (
      <div className="voice-control-widget minimized">
        <button 
          className="voice-toggle-minimized setup-required"
          onClick={() => {
            if (setShowVoiceOnboarding) {
              setShowVoiceOnboarding(true);
            } else {
              alert('Voice control setup required. Please check your settings.');
            }
          }}
          title="Click to setup voice control"
        >
          <Mic size={24} />
          <div className="setup-indicator">!</div>
        </button>
        
        <style jsx>{`
          .voice-control-widget {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .voice-control-widget.minimized {
            width: 64px;
            height: 64px;
          }

          .voice-toggle-minimized.setup-required {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          }

          .voice-toggle-minimized.setup-required:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
          }

          .setup-indicator {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 20px;
            height: 20px;
            background: #ff6b6b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`voice-control-widget ${isMinimized ? 'minimized' : 'expanded'}`}>
      {/* Minimized State - Floating Mic Button */}
      {isMinimized && (
        <button 
          className={`mic-button ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={toggleListening}
          onMouseEnter={() => !isListening && setIsMinimized(false)} // Don't auto-expand while listening
          title={isListening ? "Listening... Click to stop" : "Click to start voice control"}
        >
          {isListening ? (
            <MicOff size={24} />
          ) : (
            <Mic size={24} />
          )}
          
          {isListening && (
            <div className="listening-indicator">
              <div className="wave wave1" />
              <div className="wave wave2" />
              <div className="wave wave3" />
            </div>
          )}
          
          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner" />
            </div>
          )}
        </button>
      )}

      {/* Expanded State - Full Widget */}
      {!isMinimized && (
        <div className="voice-widget-expanded">
          <div className="widget-header">
            <div className="widget-title">
              <Mic size={16} />
              Voice Control
            </div>
            <div className="widget-controls">
              <button 
                onClick={() => setIsMinimized(true)}
                className="minimize-btn"
                title="Minimize"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="widget-content">
            <div className="status-section">
              <div className={`status-indicator ${isListening ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}>
                {isProcessing ? '🤖 Processing...' : isListening ? '🎤 Listening...' : '✅ Ready to listen'}
              </div>
              
              {transcript && (
                <div className="transcript">
                  <span className="transcript-label">You said:</span>
                  <span className="transcript-text">"{transcript}"</span>
                </div>
              )}
              
              {lastCommand && !isProcessing && (
                <div className="last-command">
                  <span className="command-icon">✅</span>
                  <span className="command-text">{lastCommand}</span>
                </div>
              )}

              {!isListening && !transcript && (
                <div className="help-text">
                  Click the mic button and say a command like:
                  <br />
                </div>
              )}
            </div>

            <div className="controls-section">
              <button 
                onClick={toggleListening}
                className={`voice-toggle ${isListening ? 'active' : ''}`}
              >
                {isListening ? (
                  <>
                    <MicOff size={16} />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    Start Listening
                  </>
                )}
              </button>
            </div>

            <div className="commands-section">
              <div className="commands-title">Quick Commands:</div>
              <div className="commands-list">
                <span>"Start demo"</span>
                <span>"Expand model"</span>
                <span>"Open chat"</span>
                <span>"Take screenshot"</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .voice-control-widget {
          position: fixed;
          bottom: 1.5rem;
          left: 1.5rem;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .voice-control-widget.minimized {
          width: 4rem;
          height: 4rem;
        }

        .voice-control-widget.expanded {
          width: 20rem;
          background: rgba(15, 15, 19, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 1rem;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mic-button {
          width: 4rem;
          height: 4rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 15, 19, 0.8);
          color: #fafafa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
        }

        .mic-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.1);
        }

        .mic-button.listening {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          animation: pulse-listening 2s infinite;
        }

        .mic-button.processing {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
        }

        @keyframes pulse-listening {
          0%, 100% { 
            transform: translateY(-2px) scale(1); 
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
          }
          50% { 
            transform: translateY(-2px) scale(1.05); 
            box-shadow: 0 12px 40px rgba(16, 185, 129, 0.4);
          }
        }

        .listening-indicator {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wave {
          width: 4px;
          height: 16px;
          background: rgba(255, 255, 255, 0.8);
          margin: 0 2px;
          border-radius: 2px;
          animation: wave 1.2s infinite ease-in-out;
        }

        .wave1 { animation-delay: 0s; }
        .wave2 { animation-delay: 0.2s; }
        .wave3 { animation-delay: 0.4s; }

        @keyframes wave {
          0%, 60%, 100% { transform: scaleY(1); }
          30% { transform: scaleY(2); }
        }

        .voice-widget-expanded {
          width: 100%;
          background: rgba(15, 15, 19, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 1rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #fafafa;
        }

        .widget-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: #fafafa;
        }

        .widget-controls button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fafafa;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .widget-controls button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .widget-content {
          padding: 1rem;
        }

        .status-section {
          margin-bottom: 1rem;
        }

        .status-indicator {
          font-size: 0.875rem;
          font-weight: 500;
          color: #bed9fe;
          margin-bottom: 0.5rem;
        }

        .status-indicator.active {
          color: #10b981;
        }

        .transcript {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          color: #a1a1aa;
          font-style: italic;
          margin-bottom: 0.5rem;
        }

        .last-command {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .controls-section {
          margin-bottom: 1rem;
        }

        .voice-toggle {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          color: #fafafa;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .voice-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .voice-toggle.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .commands-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }

        .commands-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #bed9fe;
          margin-bottom: 0.5rem;
        }

        .commands-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .commands-list span {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a1a1aa;
          padding: 0.25rem 0.5rem;
          border-radius: 0.75rem;
          font-size: 0.7rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .voice-control-widget.expanded {
            width: 280px;
            bottom: 10px;
            left: 10px;
          }

          .mic-button {
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </div>
  );
}
