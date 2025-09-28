import { SarvamAIClient } from "sarvamai";

// Test configuration
const API_KEY = process.env.SARVAM_API_KEY || "YOUR_SARVAM_API_KEY";

const client = new SarvamAIClient({
    apiSubscriptionKey: API_KEY
});

// Test Text-to-Speech
export async function testTTS() {
    try {
        console.log('Testing Sarvam TTS...');
        
        const response = await client.textToSpeech.convert({
            text: "Hello, how are you? This is a test of Sarvam AI text to speech.",
            target_language_code: "en-IN",
            speaker: "meera",
            pitch: 0,
            pace: 1.0,
            loudness: 1.0,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: "bulbul:v1"
        });
        
        console.log('TTS Response:', response);
        return response;
        
    } catch (error) {
        console.error('TTS Test Error:', error);
        throw error;
    }
}

// Test Speech-to-Text (requires audio file)
export async function testSTT(audioFile) {
    try {
        console.log('Testing Sarvam STT...');
        
        const response = await client.speechToText.translate(audioFile, {
            model: "saaras:v2.5"
        });
        
        console.log('STT Response:', response);
        return response;
        
    } catch (error) {
        console.error('STT Test Error:', error);
        throw error;
    }
}

// Example usage:
// testTTS().then(response => {
//     console.log('TTS test completed');
// });

export { client };
export default { testTTS, testSTT, client };
