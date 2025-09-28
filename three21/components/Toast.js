import { useState, useEffect } from 'react';
import sarvam from '@/utils/sarvam';

export function Toast({ message, isVisible, onHide, duration = 3000, enableTTS = false }) {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Speak the toast message if TTS is enabled
            if (enableTTS && message) {
                speakToastMessage(message);
            }
            
            const timer = setTimeout(() => {
                onHide();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onHide, enableTTS, message]);

    const speakToastMessage = async (text) => {
        if (isPlaying) return;
        
        try {
            setIsPlaying(true);
            
            // Get voice preferences from localStorage
            const preferences = localStorage.getItem('voicePreferences');
            let language = 'en-IN';
            let audioEnabled = false;
            
            if (preferences) {
                const parsed = JSON.parse(preferences);
                language = parsed.language || 'en-IN';
                audioEnabled = parsed.audioEnabled;
            }
            
            if (!audioEnabled) {
                setIsPlaying(false);
                return;
            }
            
            // Clean text for TTS
            const cleanText = text.replace(/[^\w\s]/g, '').trim();
            if (cleanText.length === 0) {
                setIsPlaying(false);
                return;
            }
            
            console.log('🔊 Speaking toast with Sarvam:', cleanText);
            
            // Use Sarvam TTS with proper format
            const responseTTS = await sarvam.textToSpeech.convert({
                text: cleanText,
                speaker: "karun",
                model: "bulbul:v2",
                enable_preprocessing: true,
                target_language_code: language,
            });
            
            if (responseTTS && responseTTS.audios && responseTTS.audios[0]) {
                const audioBase64 = responseTTS.audios[0];
                const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
                
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => setIsPlaying(false);
                
                await audio.play();
            } else {
                setIsPlaying(false);
            }
        } catch (error) {
            console.error('Sarvam Toast TTS failed:', error);
            setIsPlaying(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="toast-container">
            <div className="toast-content">
                <div className="toast-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="toast-message">{message}</span>
                <button 
                    className="toast-close"
                    onClick={onHide}
                    aria-label="Close toast"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <style jsx>{`
                .toast-container {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    z-index: 10000;
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    pointer-events: auto;
                }

                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    box-shadow: 
                        0 10px 25px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(12px);
                    min-width: 300px;
                    max-width: 400px;
                    color: var(--foreground);
                }

                .toast-icon {
                    width: 2rem;
                    height: 2rem;
                    background: var(--gradient-primary);
                    color: var(--primary-foreground);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px var(--primary-shadow);
                }

                .toast-message {
                    flex: 1;
                    font-size: 0.875rem;
                    font-weight: 500;
                    line-height: 1.4;
                    color: var(--foreground);
                }

                .toast-close {
                    background: transparent;
                    border: none;
                    color: var(--muted-foreground);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toast-close:hover {
                    background: var(--muted);
                    color: var(--foreground);
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                @media (max-width: 768px) {
                    .toast-container {
                        top: 1rem;
                        left: 1rem;
                        right: 1rem;
                    }

                    .toast-content {
                        min-width: auto;
                    }
                }
            `}</style>
        </div>
    );
}
