// Speech Recognition Manager for fast speech-to-text input
class SpeechRecognitionManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.callbacks = {
            onResult: null,
            onError: null,
            onStart: null,
            onEnd: null
        };
        this.initializeRecognition();
    }

    initializeRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings for fast, accurate transcription
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Setup event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('🎤 Speech recognition started');
            if (this.callbacks.onStart) this.callbacks.onStart();
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.callbacks.onResult) {
                this.callbacks.onResult({
                    final: finalTranscript,
                    interim: interimTranscript,
                    confidence: event.results[event.results.length - 1][0].confidence
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            if (this.callbacks.onError) {
                this.callbacks.onError({
                    error: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('🎤 Speech recognition ended');
            if (this.callbacks.onEnd) this.callbacks.onEnd();
        };
    }

    getErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Audio capture failed. Check microphone permissions.',
            'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
            'network': 'Network error occurred. Check internet connection.',
            'service-not-allowed': 'Speech recognition service not available.'
        };
        return errorMessages[error] || 'Speech recognition error occurred.';
    }

    startListening(callbacks = {}) {
        if (!this.recognition) {
            console.error('Speech recognition not available');
            return false;
        }

        if (this.isListening) {
            console.warn('Speech recognition already active');
            return false;
        }

        // Set callbacks
        this.callbacks = { ...this.callbacks, ...callbacks };

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            return false;
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) {
            return false;
        }

        try {
            this.recognition.stop();
            return true;
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
            return false;
        }
    }

    toggleListening(callbacks = {}) {
        if (this.isListening) {
            return this.stopListening();
        } else {
            return this.startListening(callbacks);
        }
    }

    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    getCurrentState() {
        return {
            isListening: this.isListening,
            isSupported: this.isSupported()
        };
    }
}

export default new SpeechRecognitionManager();
