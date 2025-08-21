import client from "./sarvam";

class SarvamTTSManager {
    constructor() {
        this.isInitialized = false;
        this.supportedLanguages = {
            'en-IN': 'English (India)',
            'hi-IN': 'Hindi',
            'bn-IN': 'Bengali',
            'ta-IN': 'Tamil',
            'te-IN': 'Telugu',
            'gu-IN': 'Gujarati',
            'kn-IN': 'Kannada',
            'ml-IN': 'Malayalam',
            'mr-IN': 'Marathi',
            'or-IN': 'Odia',
            'pa-IN': 'Punjabi'
        };
        this.defaultSpeaker = 'meera';
        this.speakers = {
            'meera': 'Female voice (clear and professional)',
            'manish': 'Male voice (warm and friendly)'
        };
    }

    async textToSpeech(text, options = {}) {
        const defaultOptions = {
            target_language_code: 'en-IN',
            speaker: this.defaultSpeaker,
            pitch: 0,
            pace: 1.0,
            loudness: 1.0,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: 'bulbul:v1'
        };

        const finalOptions = { ...defaultOptions, ...options, text };

        try {
            console.log('Converting text to speech with Sarvam:', { text: text.substring(0, 50) + '...', options: finalOptions });
            
            const response = await client.textToSpeech.convert(finalOptions);
            
            if (response && response.audio_data) {
                return {
                    success: true,
                    audio_data: response.audio_data,
                    format: response.format || 'base64',
                    sample_rate: response.sample_rate || finalOptions.speech_sample_rate
                };
            } else {
                throw new Error('No audio data received from Sarvam TTS');
            }
            
        } catch (error) {
            console.error('Sarvam TTS Error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    async speechToText(audioBuffer, options = {}) {
        const defaultOptions = {
            model: 'saaras:v2.5',
            language_code: 'en-IN'
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            console.log('Converting speech to text with Sarvam STT');
            
            // Create a File object from the audio buffer
            const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
            
            const response = await client.speechToText.translate(file, finalOptions);
            
            if (response && response.transcript) {
                return {
                    success: true,
                    transcript: response.transcript,
                    confidence: response.confidence || 0.8,
                    language: response.language || finalOptions.language_code
                };
            } else {
                throw new Error('No transcript received from Sarvam STT');
            }
            
        } catch (error) {
            console.error('Sarvam STT Error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getSupportedSpeakers() {
        return this.speakers;
    }

    // Utility method to check if Sarvam TTS is available
    async checkAvailability() {
        try {
            const testResponse = await this.textToSpeech("test", { 
                target_language_code: 'en-IN' 
            });
            this.isInitialized = testResponse.success;
            return this.isInitialized;
        } catch (error) {
            console.warn('Sarvam TTS not available:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    // Process response for conversational AI
    async processConversationalResponse(text, language = 'en-IN') {
        // Clean text for better TTS
        const cleanText = this.cleanTextForTTS(text);
        
        if (cleanText.length < 10) {
            console.log('Text too short for TTS, skipping');
            return null;
        }

        return await this.textToSpeech(cleanText, {
            target_language_code: language,
            enable_preprocessing: true,
            pace: 0.9, // Slightly slower for better comprehension
            loudness: 1.2
        });
    }

    // Clean text for TTS (remove markdown, emojis, etc.)
    cleanTextForTTS(text) {
        return text
            .replace(/[#*_`~]/g, '') // Remove markdown
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text only
            .replace(/[🤖🔬📷🔍⚙️📐🎯📊✅📷👆🔧💡❌]/g, '') // Remove common emojis
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
}

// Export singleton instance
const sarvamTTSManager = new SarvamTTSManager();

export default sarvamTTSManager;

// Legacy support - maintain backward compatibility
export const convertToSpeech = async (text, targetLanguage = 'en-IN') => {
    const response = await sarvamTTSManager.textToSpeech(text, {
        target_language_code: targetLanguage
    });
    return response;
};