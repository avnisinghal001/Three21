'use client'
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Play, Download, Volume2, Loader } from 'react-feather';

// Import our Sarvam client
import client from '@/utils/sarvam';

export default function SarvamTestPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [testText, setTestText] = useState("Hi, My Name is Vinayak.");
    const [targetLanguage, setTargetLanguage] = useState("hi-IN");

    // Enable audio context on first user interaction
    useEffect(() => {
        const enableAudio = () => {
            setUserInteracted(true);
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        
        return () => {
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
        };
    }, []);

    const sarvamRun = async () => {
        if (!userInteracted) {
            alert('Please click anywhere on the page first to enable audio!');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        
        try {
            console.log('Starting Sarvam API test...');
            
            // 1. Translate text (optional step)
            console.log('Step 1: Translating text...');
            const translateResponse = await client.text.translate({
                input: testText,
                source_language_code: "en-IN",
                target_language_code: targetLanguage,
                speaker_gender: "Male"
            });
            console.log("Translation Response:", translateResponse);

            // 2. Convert text to speech
            console.log('Step 2: Converting to speech...');
            const ttsResponse = await client.textToSpeech.convert({
                text: translateResponse.translated_text || testText,
                target_language_code: targetLanguage,
            });
            console.log("TTS Response:", ttsResponse);

            // 3. Handle audio response
            if (ttsResponse.audios && ttsResponse.audios.length > 0) {
                const base64Audio = ttsResponse.audios[0];
                
                // Convert Base64 to Blob
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: "audio/wav" });
                
                // Create URL for playback
                const newAudioUrl = URL.createObjectURL(audioBlob);
                setAudioUrl(newAudioUrl);
                
                // Auto-play if user has interacted
                const audio = new Audio(newAudioUrl);
                try {
                    await audio.play();
                    console.log('Audio played successfully');
                } catch (playError) {
                    console.warn('Autoplay failed, user can play manually:', playError.message);
                }
                
                setResult({
                    original: testText,
                    translated: translateResponse.translated_text || testText,
                    audioGenerated: true,
                    language: targetLanguage
                });
            } else {
                throw new Error('No audio data received from TTS API');
            }

        } catch (err) {
            console.error("Error in sarvamRun:", err);
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = async () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            try {
                await audio.play();
            } catch (err) {
                console.error('Manual play failed:', err);
                alert('Audio playback failed. This might be due to browser restrictions.');
            }
        }
    };

    const downloadAudio = () => {
        if (audioUrl) {
            const link = document.createElement("a");
            link.href = audioUrl;
            link.download = `tts_output_${Date.now()}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    return (
        <div className="sarvam-test-page">
            <div className="container">
                <header className="test-header">
                    <h1>🎤 Sarvam AI Test Page</h1>
                    <p>Test the Sarvam AI Text-to-Speech and Translation APIs</p>
                    
                    {!userInteracted && (
                        <div className="interaction-warning">
                            ⚠️ Click anywhere on this page to enable audio playback
                        </div>
                    )}
                </header>

                <div className="test-controls">
                    <div className="input-group">
                        <label htmlFor="testText">Text to Convert:</label>
                        <input
                            id="testText"
                            type="text"
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            placeholder="Enter text to convert to speech..."
                            className="text-input"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="language">Target Language:</label>
                        <select
                            id="language"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="language-select"
                        >
                            <option value="hi-IN">Hindi (hi-IN)</option>
                            <option value="en-IN">English India (en-IN)</option>
                            <option value="gu-IN">Gujarati (gu-IN)</option>
                            <option value="bn-IN">Bengali (bn-IN)</option>
                            <option value="ta-IN">Tamil (ta-IN)</option>
                            <option value="te-IN">Telugu (te-IN)</option>
                            <option value="kn-IN">Kannada (kn-IN)</option>
                            <option value="ml-IN">Malayalam (ml-IN)</option>
                            <option value="mr-IN">Marathi (mr-IN)</option>
                            <option value="or-IN">Odia (or-IN)</option>
                            <option value="pa-IN">Punjabi (pa-IN)</option>
                        </select>
                    </div>

                    <button
                        onClick={sarvamRun}
                        disabled={isLoading || !testText.trim()}
                        className="run-button"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="spinner" size={18} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Volume2 size={18} />
                                Run Sarvam TTS Test
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="error-panel">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className="result-panel">
                        <h3>✅ Success</h3>
                        <div className="result-details">
                            <p><strong>Original:</strong> {result.original}</p>
                            <p><strong>Translated:</strong> {result.translated}</p>
                            <p><strong>Language:</strong> {result.language}</p>
                            <p><strong>Audio Generated:</strong> {result.audioGenerated ? 'Yes' : 'No'}</p>
                        </div>

                        {audioUrl && (
                            <div className="audio-controls">
                                <button onClick={playAudio} className="play-button">
                                    <Play size={16} />
                                    Play Audio
                                </button>
                                <button onClick={downloadAudio} className="download-button">
                                    <Download size={16} />
                                    Download Audio
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="info-panel">
                    <h3>📋 Test Information</h3>
                    <ul>
                        <li><strong>Translation API:</strong> Translates text between languages</li>
                        <li><strong>Text-to-Speech API:</strong> Converts text to natural speech</li>
                        <li><strong>Audio Format:</strong> WAV (Base64 encoded)</li>
                        <li><strong>User Interaction:</strong> Required for audio playback in browsers</li>
                        <li><strong>Supported Languages:</strong> Hindi, English, and 9 regional Indian languages</li>
                    </ul>
                </div>
            </div>

            <style jsx>{`
                .sarvam-test-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem;
                    color: white;
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .test-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .test-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }

                .interaction-warning {
                    background: rgba(255, 193, 7, 0.2);
                    border: 2px solid rgba(255, 193, 7, 0.5);
                    color: #ffc107;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                    text-align: center;
                    font-weight: bold;
                }

                .test-controls {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 2rem;
                    border-radius: 15px;
                    margin-bottom: 2rem;
                }

                .input-group {
                    margin-bottom: 1.5rem;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                .text-input, .language-select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 1rem;
                }

                .text-input::placeholder {
                    color: rgba(255, 255, 255, 0.7);
                }

                .run-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                    width: 100%;
                    justify-content: center;
                }

                .run-button:hover:not(:disabled) {
                    background: #218838;
                }

                .run-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .error-panel, .result-panel, .info-panel {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                }

                .error-panel {
                    border: 2px solid rgba(220, 53, 69, 0.5);
                    background: rgba(220, 53, 69, 0.1);
                }

                .result-panel {
                    border: 2px solid rgba(40, 167, 69, 0.5);
                    background: rgba(40, 167, 69, 0.1);
                }

                .result-details {
                    margin: 1rem 0;
                }

                .result-details p {
                    margin: 0.5rem 0;
                }

                .audio-controls {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .play-button, .download-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .play-button {
                    background: #007bff;
                    color: white;
                }

                .play-button:hover {
                    background: #0056b3;
                }

                .download-button {
                    background: #6c757d;
                    color: white;
                }

                .download-button:hover {
                    background: #545b62;
                }

                .info-panel ul {
                    margin: 1rem 0;
                    padding-left: 1.5rem;
                }

                .info-panel li {
                    margin: 0.5rem 0;
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .sarvam-test-page {
                        padding: 1rem;
                    }

                    .test-header h1 {
                        font-size: 2rem;
                    }

                    .audio-controls {
                        flex-direction: column;
                    }

                    .play-button, .download-button {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
