'use client'
import React, { useState, useEffect } from 'react';
import { ModelInfoProvider } from '@/components/ModelInfoContext';
import AnyModelViewer from '@/components/AnyModelViewer';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Settings } from 'react-feather';

const VOICE_DEMO_CONFIG = {
    name: "Voice-Controlled Aircraft Model",
    description: "Demonstrate voice commands for 3D model interaction. Say commands like 'expand the model', 'select the wing', 'rotate left', 'take screenshot', etc.",
    category: "Voice Demo",
    manufacturer: "Three21 Demo",
    material: "Digital",
    purpose: "Voice interaction demonstration",
    complexity: "Advanced",
    tags: ["voice", "demo", "interactive", "ai", "stt", "tts"],
    voiceEnabled: true,
    supportedCommands: [
        "Expand the model / Disassemble",
        "Collapse the model / Assemble", 
        "Select [part name] (e.g., 'select the wing')",
        "Rotate [direction] [degrees] (e.g., 'rotate left 45 degrees')",
        "Zoom in/out [amount] (e.g., 'zoom in 2 times')",
        "Take a screenshot",
        "Analyze the model",
        "Reset view",
        "Ask any question about the model"
    ]
};

export default function VoiceDemoPage() {
    const [isVoiceSupported, setIsVoiceSupported] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [demoStats, setDemoStats] = useState({
        commandsExecuted: 0,
        voiceInteractions: 0,
        partsSelected: 0,
        aiQueries: 0
    });

    useEffect(() => {
        // Check for voice support
        const checkVoiceSupport = () => {
            const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
            const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
            const hasSpeechSynthesis = 'speechSynthesis' in window;
            
            setIsVoiceSupported(hasWebkitSpeech && hasGetUserMedia && hasSpeechSynthesis);
        };

        checkVoiceSupport();
    }, []);

    const handleVoiceCommand = (command) => {
        setDemoStats(prev => ({
            ...prev,
            commandsExecuted: prev.commandsExecuted + 1,
            voiceInteractions: prev.voiceInteractions + 1
        }));
    };

    const handlePartSelected = () => {
        setDemoStats(prev => ({
            ...prev,
            partsSelected: prev.partsSelected + 1
        }));
    };

    const handleAIQuery = () => {
        setDemoStats(prev => ({
            ...prev,
            aiQueries: prev.aiQueries + 1
        }));
    };

    return (
        <ModelInfoProvider>
            <div className="voice-demo-page">
                {/* Header */}
                <div className="demo-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1 className="demo-title">
                                🎤 Three21 Voice AI Demo
                            </h1>
                            <p className="demo-subtitle">
                                Experience conversational AI with voice commands for 3D model interaction
                            </p>
                        </div>
                        
                        <div className="status-section">
                            <div className={`status-badge ${isVoiceSupported ? 'supported' : 'not-supported'}`}>
                                {isVoiceSupported ? (
                                    <>
                                        <Mic size={16} />
                                        Voice Ready
                                    </>
                                ) : (
                                    <>
                                        <MicOff size={16} />
                                        Voice Not Available
                                    </>
                                )}
                            </div>
                            
                            <button 
                                className="instructions-toggle"
                                onClick={() => setShowInstructions(!showInstructions)}
                            >
                                <Settings size={16} />
                                {showInstructions ? 'Hide' : 'Show'} Instructions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Instructions Panel */}
                {showInstructions && (
                    <div className="instructions-panel">
                        <div className="instructions-content">
                            <div className="instruction-section">
                                <h3>🎯 Voice Commands</h3>
                                <div className="command-grid">
                                    {VOICE_DEMO_CONFIG.supportedCommands.map((command, index) => (
                                        <div key={index} className="command-item">
                                            <code>"{command}"</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="instruction-section">
                                <h3>🤖 AI Features</h3>
                                <ul className="feature-list">
                                    <li><strong>Speech-to-Text:</strong> Powered by Sarvam AI for accurate voice recognition</li>
                                    <li><strong>Text-to-Speech:</strong> AI responses spoken aloud with natural voice</li>
                                    <li><strong>Voice Commands:</strong> Control model interactions through natural language</li>
                                    <li><strong>Conversational AI:</strong> Chat with Three21Bot using voice or text</li>
                                    <li><strong>Smart Recognition:</strong> Understands part names and model commands</li>
                                </ul>
                            </div>
                            
                            <div className="instruction-section">
                                <h3>📊 Demo Stats</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-value">{demoStats.commandsExecuted}</span>
                                        <span className="stat-label">Voice Commands</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{demoStats.voiceInteractions}</span>
                                        <span className="stat-label">Voice Interactions</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{demoStats.partsSelected}</span>
                                        <span className="stat-label">Parts Selected</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{demoStats.aiQueries}</span>
                                        <span className="stat-label">AI Queries</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3D Model Viewer */}
                <div className="viewer-container">
                    <AnyModelViewer 
                        url="/demo.fbx"
                        type="fbx"
                        isDemoMode={true}
                        demoConfig={VOICE_DEMO_CONFIG}
                        onVoiceCommand={handleVoiceCommand}
                        onPartSelected={handlePartSelected}
                        onAIQuery={handleAIQuery}
                    />
                </div>

                {/* Footer */}
                <div className="demo-footer">
                    <div className="footer-content">
                        <div className="tech-info">
                            <h4>🔧 Technology Stack</h4>
                            <div className="tech-badges">
                                <span className="tech-badge">Sarvam AI STT/TTS</span>
                                <span className="tech-badge">Google Gemini</span>
                                <span className="tech-badge">Three.js</span>
                                <span className="tech-badge">React Three Fiber</span>
                                <span className="tech-badge">Next.js</span>
                                <span className="tech-badge">Web Speech API</span>
                            </div>
                        </div>
                        
                        <div className="demo-info">
                            <p>
                                This demo showcases the integration of voice AI technologies with 3D model visualization. 
                                Use voice commands to interact with the model, or open the AI chat to have conversations 
                                about the 3D model with voice responses.
                            </p>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .voice-demo-page {
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }

                    .demo-header {
                        padding: 2rem;
                        background: rgba(0, 0, 0, 0.1);
                        backdrop-filter: blur(10px);
                    }

                    .header-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 1rem;
                    }

                    .demo-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        margin: 0 0 0.5rem 0;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .demo-subtitle {
                        font-size: 1.1rem;
                        opacity: 0.9;
                        margin: 0;
                    }

                    .status-section {
                        display: flex;
                        gap: 1rem;
                        align-items: center;
                    }

                    .status-badge {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        border-radius: 25px;
                        font-weight: 500;
                        font-size: 0.9rem;
                    }

                    .status-badge.supported {
                        background: rgba(34, 197, 94, 0.2);
                        border: 2px solid rgba(34, 197, 94, 0.5);
                        color: #22c55e;
                    }

                    .status-badge.not-supported {
                        background: rgba(239, 68, 68, 0.2);
                        border: 2px solid rgba(239, 68, 68, 0.5);
                        color: #ef4444;
                    }

                    .instructions-toggle {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        border-radius: 25px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .instructions-toggle:hover {
                        background: rgba(255, 255, 255, 0.2);
                        border-color: rgba(255, 255, 255, 0.4);
                    }

                    .instructions-panel {
                        background: rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(10px);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .instructions-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 2rem;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2rem;
                    }

                    .instruction-section h3 {
                        font-size: 1.3rem;
                        margin-bottom: 1rem;
                        color: #fbbf24;
                    }

                    .command-grid {
                        display: grid;
                        gap: 0.5rem;
                    }

                    .command-item code {
                        display: block;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 0.5rem;
                        border-radius: 5px;
                        font-size: 0.9rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .feature-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .feature-list li {
                        padding: 0.5rem 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .feature-list li:last-child {
                        border-bottom: none;
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 1rem;
                    }

                    .stat-item {
                        text-align: center;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }

                    .stat-value {
                        display: block;
                        font-size: 2rem;
                        font-weight: bold;
                        color: #fbbf24;
                    }

                    .stat-label {
                        font-size: 0.8rem;
                        opacity: 0.8;
                    }

                    .viewer-container {
                        height: 70vh;
                        position: relative;
                        margin: 0 2rem;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    }

                    .demo-footer {
                        padding: 2rem;
                        background: rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(10px);
                        margin-top: 2rem;
                    }

                    .footer-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: grid;
                        grid-template-columns: 1fr 2fr;
                        gap: 2rem;
                        align-items: start;
                    }

                    .tech-info h4 {
                        color: #fbbf24;
                        margin-bottom: 1rem;
                    }

                    .tech-badges {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }

                    .tech-badge {
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 0.3rem 0.8rem;
                        border-radius: 15px;
                        font-size: 0.8rem;
                        font-weight: 500;
                    }

                    .demo-info p {
                        line-height: 1.6;
                        opacity: 0.9;
                    }

                    @media (max-width: 768px) {
                        .header-content {
                            flex-direction: column;
                            text-align: center;
                        }

                        .demo-title {
                            font-size: 2rem;
                        }

                        .instructions-content {
                            grid-template-columns: 1fr;
                            padding: 1rem;
                        }

                        .viewer-container {
                            margin: 0 1rem;
                            height: 60vh;
                        }

                        .footer-content {
                            grid-template-columns: 1fr;
                            gap: 1rem;
                        }
                    }
                `}</style>
            </div>
        </ModelInfoProvider>
    );
}
