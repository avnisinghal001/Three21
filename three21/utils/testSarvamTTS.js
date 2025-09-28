import client from './sarvam';

/**
 * Test function for Sarvam AI TTS with proper user interaction handling
 * @param {string} text - Text to convert to speech
 * @param {string} targetLanguage - Target language code (e.g., 'hi-IN')
 * @param {boolean} autoPlay - Whether to try auto-playing (requires user interaction)
 * @returns {Promise<{audioUrl: string, audioBlob: Blob, success: boolean}>}
 */
export async function testSarvamTTS(text = "Hi, My Name is Vinayak.", targetLanguage = "hi-IN", autoPlay = true) {
    try {
        console.log('🎤 Starting Sarvam TTS test...');
        
        // Step 1: Optional translation
        let textToSpeak = text;
        if (targetLanguage !== 'en-IN') {
            try {
                console.log('🔄 Translating text...');
                const translateResponse = await client.text.translate({
                    input: text,
                    source_language_code: "en-IN",
                    target_language_code: targetLanguage,
                    speaker_gender: "Male"
                });
                textToSpeak = translateResponse.translated_text || text;
                console.log('✅ Translation:', textToSpeak);
            } catch (translateError) {
                console.warn('⚠️ Translation failed, using original text:', translateError);
            }
        }

        // Step 2: Text to Speech conversion
        console.log('🗣️ Converting text to speech...');
        const ttsResponse = await client.textToSpeech.convert({
            text: textToSpeak,
            target_language_code: targetLanguage,
        });
        
        if (!ttsResponse.audios || ttsResponse.audios.length === 0) {
            throw new Error('No audio data received from Sarvam TTS API');
        }

        // Step 3: Process audio data
        console.log('🔊 Processing audio data...');
        const base64Audio = ttsResponse.audios[0];
        
        // Convert Base64 to Blob
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/wav" });
        
        // Create URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);

        // Step 4: Handle playback
        if (autoPlay) {
            try {
                const audio = new Audio(audioUrl);
                await audio.play();
                console.log('🎵 Audio played successfully');
            } catch (playError) {
                if (playError.name === 'NotAllowedError') {
                    console.warn('🚫 Auto-play blocked by browser. User interaction required.');
                    showPlayButton(audioUrl, textToSpeak);
                } else {
                    console.error('❌ Audio playback failed:', playError);
                }
            }
        }

        console.log('✅ Sarvam TTS test completed successfully');
        
        return {
            audioUrl,
            audioBlob,
            success: true,
            originalText: text,
            processedText: textToSpeak,
            language: targetLanguage
        };

    } catch (error) {
        console.error('❌ Sarvam TTS test failed:', error);
        return {
            audioUrl: null,
            audioBlob: null,
            success: false,
            error: error.message,
            originalText: text
        };
    }
}

/**
 * Show a temporary play button when auto-play is blocked
 * @param {string} audioUrl - The audio URL to play
 * @param {string} text - The text that was converted to speech
 */
function showPlayButton(audioUrl, text) {
    // Remove any existing play button
    const existingButton = document.getElementById('sarvam-play-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create play button
    const playButton = document.createElement('button');
    playButton.id = 'sarvam-play-button';
    playButton.innerHTML = `🔊 Play: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`;
    playButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(45deg, #007bff, #0056b3);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        transition: all 0.3s ease;
        max-width: 300px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    `;
    
    // Add hover effect
    playButton.addEventListener('mouseenter', () => {
        playButton.style.transform = 'translateY(-2px)';
        playButton.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
    });
    
    playButton.addEventListener('mouseleave', () => {
        playButton.style.transform = 'translateY(0)';
        playButton.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
    });
    
    // Handle click
    playButton.onclick = async () => {
        try {
            playButton.innerHTML = '🔄 Playing...';
            playButton.disabled = true;
            
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                playButton.remove();
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = () => {
                playButton.innerHTML = '❌ Play Failed';
                setTimeout(() => playButton.remove(), 2000);
            };
            
            await audio.play();
            
        } catch (error) {
            console.error('Manual audio play failed:', error);
            playButton.innerHTML = '❌ Play Failed';
            setTimeout(() => playButton.remove(), 2000);
        }
    };
    
    // Add to page
    document.body.appendChild(playButton);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (document.getElementById('sarvam-play-button')) {
            playButton.remove();
            URL.revokeObjectURL(audioUrl);
        }
    }, 15000);
}

/**
 * Create a download link for the audio
 * @param {Blob} audioBlob - The audio blob to download
 * @param {string} filename - Optional filename
 */
export function downloadAudio(audioBlob, filename = `sarvam-tts-${Date.now()}.wav`) {
    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL after download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Quick test function that can be called from browser console
 */
window.testSarvamQuick = () => {
    testSarvamTTS("Hello! This is a test of Sarvam AI text to speech.", "en-IN")
        .then(result => {
            console.log('Test result:', result);
            if (result.success) {
                console.log('✅ Test passed! Audio should play or show play button.');
            } else {
                console.error('❌ Test failed:', result.error);
            }
        });
};

// Export for use in components
export default testSarvamTTS;
