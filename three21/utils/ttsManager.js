import sarvam from './sarvam';

class TTSManager {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.preferences = null;
        this.loadPreferences();
        
        // Listen for preference updates
        this.setupPreferenceListener();
    }

    setupPreferenceListener() {
        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'voicePreferences') {
                this.loadPreferences();
            }
        });
        
        // Listen for custom events
        document.addEventListener('voicePreferencesUpdated', () => {
            this.loadPreferences();
        });
    }

    loadPreferences() {
        try {
            const stored = localStorage.getItem('voicePreferences');
            this.preferences = stored ? JSON.parse(stored) : {
                language: 'en-IN',
                audioEnabled: false,
                voiceCommands: false
            };
        } catch (error) {
            console.error('Failed to load TTS preferences:', error);
            this.preferences = {
                language: 'en-IN',
                audioEnabled: false,
                voiceCommands: false
            };
        }
    }

    isEnabled() {
        return this.preferences?.audioEnabled === true;
    }

    getLanguage() {
        return this.preferences?.language || 'en-IN';
    }

    async speak(text, options = {}) {
        if (!this.isEnabled() || this.isPlaying) {
            return false;
        }

        try {
            this.isPlaying = true;
            
            // Clean text for TTS
            const cleanText = this.cleanTextForTTS(text);
            if (!cleanText) {
                this.isPlaying = false;
                return false;
            }

            const language = options.language || this.getLanguage();
            
            console.log('🔊 TTS Speaking:', cleanText);
            
            // Use Sarvam TTS
            const response = await sarvam.textToSpeech(cleanText, language);
            
            if (response && response.audios && response.audios[0]) {
                return await this.playAudioFromBase64(response.audios[0]);
            } else {
                throw new Error('No audio data received from Sarvam');
            }
            
        } catch (error) {
            console.error('TTS failed:', error);
            this.isPlaying = false;
            
            // Fallback to browser TTS if available
            if (options.fallbackToBrowserTTS !== false) {
                return this.fallbackTTS(text);
            }
            
            return false;
        }
    }

    async playAudioFromBase64(audioBase64) {
        return new Promise((resolve, reject) => {
            try {
                const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
                this.currentAudio = audio;
                
                audio.onended = () => {
                    this.isPlaying = false;
                    this.currentAudio = null;
                    resolve(true);
                };
                
                audio.onerror = (error) => {
                    this.isPlaying = false;
                    this.currentAudio = null;
                    reject(error);
                };
                
                audio.play()
                    .then(() => {
                        console.log('🔊 TTS audio playback started');
                    })
                    .catch(reject);
                    
            } catch (error) {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(error);
            }
        });
    }

    fallbackTTS(text) {
        if ('speechSynthesis' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = this.getLanguage().replace('-', '_');
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                
                utterance.onend = () => {
                    this.isPlaying = false;
                };
                
                utterance.onerror = () => {
                    this.isPlaying = false;
                };
                
                speechSynthesis.speak(utterance);
                console.log('🔊 Using browser TTS fallback');
                return true;
            } catch (error) {
                console.error('Browser TTS fallback failed:', error);
                this.isPlaying = false;
                return false;
            }
        }
        
        this.isPlaying = false;
        return false;
    }

    cleanTextForTTS(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            // Remove markdown syntax
            .replace(/[*_`#\[\]()]/g, '')
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Replace emojis and special characters with text
            .replace(/🔊/g, 'speaking')
            .replace(/📢/g, 'announcing')
            .replace(/✅/g, 'success')
            .replace(/❌/g, 'error')
            .replace(/🎯/g, '')
            .replace(/🤖/g, 'bot')
            // Replace multiple spaces and newlines
            .replace(/\s+/g, ' ')
            .trim();
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.isPlaying = false;
    }

    // Convenience methods for different types of content
    async speakCommand(command) {
        return this.speak(`Command: ${command}`, { priority: 'high' });
    }

    async speakNotification(message) {
        return this.speak(message, { priority: 'medium' });
    }

    async speakError(error) {
        return this.speak(`Error: ${error}`, { priority: 'high' });
    }

    async speakSuccess(message) {
        return this.speak(`Success: ${message}`, { priority: 'medium' });
    }

    // Status methods
    getStatus() {
        return {
            isEnabled: this.isEnabled(),
            isPlaying: this.isPlaying,
            language: this.getLanguage(),
            preferences: this.preferences
        };
    }
}

// Create singleton instance
const ttsManager = new TTSManager();

export default ttsManager;
