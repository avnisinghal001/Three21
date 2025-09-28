import client from './sarvam';

class VoiceManager {
    constructor() {
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recognition = null;
        this.audioContext = null;
        this.recordingFiles = [];
        this.onTranscriptCallback = null;
        this.onVoiceResultCallback = null;
        this.pendingAudio = null;
        this.audioPlayButton = null;
        this.userInteracted = false;
        
        // Initialize browser speech recognition as fallback
        this.initializeBrowserSpeechRecognition();
        
        // Set up user interaction detection
        this.setupUserInteractionDetection();
    }

    setupUserInteractionDetection() {
        // Listen for any user interaction to enable audio
        const enableAudio = () => {
            this.enableAudioContext();
            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }

    initializeBrowserSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
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
                
                if (this.onTranscriptCallback) {
                    this.onTranscriptCallback(finalTranscript, interimTranscript);
                }
                
                if (finalTranscript && this.onVoiceResultCallback) {
                    this.onVoiceResultCallback(finalTranscript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }
    }

    async startListening(onTranscript, onVoiceResult) {
        this.onTranscriptCallback = onTranscript;
        this.onVoiceResultCallback = onVoiceResult;
        
        try {
            // Start audio recording for Sarvam STT
            await this.startAudioRecording();
            
            // Start browser speech recognition as backup
            if (this.recognition) {
                this.recognition.start();
            }
            
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Failed to start listening:', error);
            return false;
        }
    }

    async startAudioRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
            await this.processSarvamSTT(audioBlob);
        };
        
        this.mediaRecorder.start();
    }

    async processSarvamSTT(audioBlob) {
        try {
            // Save recording temporarily
            const recordingUrl = await this.saveRecording(audioBlob);
            
            // Create a File object from the audio blob
            const file = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
            
            // Use Sarvam STT API
            const response = await client.speechToText.translate(file, {
                model: "saaras:v2.5"
            });
            
            if (response.transcript && this.onVoiceResultCallback) {
                this.onVoiceResultCallback(response.transcript);
            }
            
        } catch (error) {
            console.error('Sarvam STT error:', error);
            // Browser speech recognition will handle as fallback
        }
    }

    async saveRecording(audioBlob) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `recording-${timestamp}.webm`;
            
            // Create URL for the blob
            const url = URL.createObjectURL(audioBlob);
            
            // Save to temporary files list for cleanup
            this.recordingFiles.push({ url, filename, blob: audioBlob });
            
            // Automatically cleanup old recordings (keep only last 10)
            if (this.recordingFiles.length > 10) {
                const oldRecording = this.recordingFiles.shift();
                URL.revokeObjectURL(oldRecording.url);
            }
            
            return url;
        } catch (error) {
            console.error('Failed to save recording:', error);
            return null;
        }
    }

    stopListening() {
        this.isListening = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    async textToSpeech(text, language = 'en-IN') {
        try {
            const responseTTS = await client.textToSpeech.convert({
                text: text,
                speaker: "karun",
                model: "bulbul:v2",
                enable_preprocessing: true,
                target_language_code: language,
            });
            
            if (responseTTS.audios && responseTTS.audios.length > 0) {
                await this.playAudio(responseTTS.audios[0], 'base64');
            }
            
        } catch (error) {
            console.error('TTS error:', error);
            // Fallback to browser TTS
            this.fallbackTTS(text);
        }
    }

    async playAudio(audioData, format = 'buffer') {
        try {
            let audioBlob;
            
            if (format === 'base64') {
                // Convert base64 to blob
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                audioBlob = new Blob([bytes], { type: 'audio/wav' });
            } else {
                // Handle other formats
                audioBlob = this.convertToAudioBlob(audioData);
            }
            
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(error);
                };
                
                // Handle the "NotAllowedError: play() failed because the user didn't interact with the document first"
                audio.play().catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('Audio autoplay blocked. User interaction required.');
                        // Store audio for later playback when user interacts
                        this.pendingAudio = audio;
                        this.showAudioPlayButton(audioUrl);
                        reject(new Error('User interaction required for audio playback'));
                    } else {
                        URL.revokeObjectURL(audioUrl);
                        reject(error);
                    }
                });
            });
            
        } catch (error) {
            console.error('Audio playback error:', error);
            throw error;
        }
    }

    convertToAudioBlob(audioData) {
        if (typeof audioData === 'string') {
            // Assume base64 encoded audio
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new Blob([bytes], { type: 'audio/mpeg' });
        } else if (audioData instanceof ArrayBuffer) {
            return new Blob([audioData], { type: 'audio/mpeg' });
        } else {
            throw new Error('Unsupported audio data format');
        }
    }

    fallbackTTS(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    showAudioPlayButton(audioUrl) {
        // Create a temporary play button for user interaction
        if (this.audioPlayButton) {
            this.audioPlayButton.remove();
        }
        
        this.audioPlayButton = document.createElement('button');
        this.audioPlayButton.innerHTML = '🔊 Play AI Response';
        this.audioPlayButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        this.audioPlayButton.onclick = async () => {
            try {
                if (this.pendingAudio) {
                    await this.pendingAudio.play();
                    this.audioPlayButton.remove();
                    this.pendingAudio = null;
                }
            } catch (error) {
                console.error('Manual audio play failed:', error);
            }
        };
        
        document.body.appendChild(this.audioPlayButton);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (this.audioPlayButton) {
                this.audioPlayButton.remove();
                this.audioPlayButton = null;
            }
        }, 10000);
    }

    // Enable audio context after user interaction
    enableAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.userInteracted = true;
    }

    cleanup() {
        this.stopListening();
        
        // Clean up recording URLs
        this.recordingFiles.forEach(recording => {
            URL.revokeObjectURL(recording.url);
        });
        this.recordingFiles = [];
        
        // Clean up audio elements
        if (this.pendingAudio) {
            this.pendingAudio.pause();
            this.pendingAudio = null;
        }
        
        if (this.audioPlayButton) {
            this.audioPlayButton.remove();
            this.audioPlayButton = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export default VoiceManager;
