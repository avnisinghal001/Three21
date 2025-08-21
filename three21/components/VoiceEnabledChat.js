import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader } from 'react-feather';
import VoiceManager from '../utils/voiceManager';
import VoiceCommandProcessor from '../utils/voiceCommandProcessor';

export default function VoiceEnabledChat({ 
    onSendMessage, 
    onVoiceCommand, 
    modelInteractions,
    isLoading 
}) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [commandMode, setCommandMode] = useState(false);
    
    const voiceManagerRef = useRef(null);
    const commandProcessorRef = useRef(null);
    const transcriptTimeoutRef = useRef(null);

    useEffect(() => {
        // Initialize voice manager and command processor
        voiceManagerRef.current = new VoiceManager();
        commandProcessorRef.current = new VoiceCommandProcessor();
        
        if (modelInteractions) {
            commandProcessorRef.current.setModelInteractions(modelInteractions);
        }
        
        commandProcessorRef.current.setCommandCallback((command) => {
            if (onVoiceCommand) {
                onVoiceCommand(command);
            }
        });

        return () => {
            if (voiceManagerRef.current) {
                voiceManagerRef.current.cleanup();
            }
        };
    }, [modelInteractions, onVoiceCommand]);

    const handleStartListening = async () => {
        if (!voiceManagerRef.current || isListening) return;
        
        const success = await voiceManagerRef.current.startListening(
            (finalTranscript, interim) => {
                setTranscript(finalTranscript);
                setInterimTranscript(interim);
                
                // Clear timeout if exists
                if (transcriptTimeoutRef.current) {
                    clearTimeout(transcriptTimeoutRef.current);
                }
                
                // Set timeout to process transcript after silence
                if (finalTranscript) {
                    transcriptTimeoutRef.current = setTimeout(() => {
                        processTranscript(finalTranscript);
                    }, 1500);
                }
            },
            (voiceResult) => {
                processTranscript(voiceResult);
            }
        );
        
        if (success) {
            setIsListening(true);
        }
    };

    const handleStopListening = () => {
        if (voiceManagerRef.current) {
            voiceManagerRef.current.stopListening();
        }
        setIsListening(false);
        setInterimTranscript('');
        
        if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current);
        }
    };

    const processTranscript = (text) => {
        if (!text.trim()) return;
        
        // Check if it's a voice command
        const command = commandProcessorRef.current?.processVoiceCommand(text);
        
        if (command) {
            setCommandMode(true);
            setTranscript(`🎤 Command: ${text}`);
            
            // Clear command mode after a moment
            setTimeout(() => {
                setCommandMode(false);
                setTranscript('');
            }, 2000);
        } else {
            // It's a regular message
            setTranscript(text);
            if (onSendMessage) {
                onSendMessage(text);
            }
            
            // Clear transcript after sending
            setTimeout(() => {
                setTranscript('');
            }, 1000);
        }
        
        handleStopListening();
    };

    const handleTextToSpeech = async (text) => {
        if (!voiceManagerRef.current || !voiceEnabled) return;
        
        setIsSpeaking(true);
        try {
            await voiceManagerRef.current.textToSpeech(text);
        } catch (error) {
            console.error('TTS error:', error);
        } finally {
            setIsSpeaking(false);
        }
    };

    const toggleVoice = () => {
        setVoiceEnabled(!voiceEnabled);
        if (isListening) {
            handleStopListening();
        }
    };

    const getCommandSuggestions = () => {
        return commandProcessorRef.current?.getCommandSuggestions() || [];
    };

    return (
        <div className="voice-chat-controls bg-gray-50 border-t p-4">
            {/* Voice Control Buttons */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={isListening ? handleStopListening : handleStartListening}
                        disabled={!voiceEnabled || isLoading}
                        className={`
                            p-3 rounded-full transition-all duration-200 shadow-lg
                            ${isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }
                            ${(!voiceEnabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={isListening ? "Stop listening" : "Start voice input"}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                        onClick={toggleVoice}
                        className={`
                            p-2 rounded-lg transition-all duration-200
                            ${voiceEnabled 
                                ? 'text-blue-500 hover:bg-blue-50' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }
                        `}
                        title={voiceEnabled ? "Disable voice" : "Enable voice"}
                    >
                        {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>

                    {isSpeaking && (
                        <div className="flex items-center space-x-1 text-green-500">
                            <Loader className="animate-spin" size={16} />
                            <span className="text-sm">Speaking...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2 text-sm">
                    {commandMode && (
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-lg">
                            🎯 Command Mode
                        </span>
                    )}
                    {isListening && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg">
                            🎤 Listening...
                        </span>
                    )}
                </div>
            </div>

            {/* Transcript Display */}
            {(transcript || interimTranscript) && (
                <div className="mb-3 p-3 bg-white rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">
                        {commandMode ? "🎯 Voice Command:" : "🎤 You said:"}
                    </div>
                    <div className={`${commandMode ? 'text-green-600 font-medium' : 'text-gray-800'}`}>
                        {transcript}
                        {interimTranscript && (
                            <span className="text-gray-400 italic">
                                {interimTranscript}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Voice Command Help */}
            {isListening && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-2">
                        💡 Voice Commands Available:
                    </div>
                    <div className="text-xs text-blue-600 space-y-1">
                        {getCommandSuggestions().slice(0, 3).map((suggestion, index) => (
                            <div key={index}>• {suggestion}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Indicators */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span className={`flex items-center space-x-1 ${voiceEnabled ? 'text-green-500' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${voiceEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>Voice {voiceEnabled ? 'Enabled' : 'Disabled'}</span>
                    </span>
                    
                    <span className={`flex items-center space-x-1 ${isListening ? 'text-red-500' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span>Listening {isListening ? 'Active' : 'Inactive'}</span>
                    </span>
                </div>
                
                <div className="text-gray-400">
                    Click mic to start • Voice commands supported
                </div>
            </div>
        </div>
    );
}

// Export the TTS function for use in other components
export { VoiceManager };
