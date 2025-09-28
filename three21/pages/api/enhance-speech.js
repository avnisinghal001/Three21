import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, topic = 'Technical Analysis', audience = 'Technical professionals' } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Limit input text to prevent excessive API usage
        const inputText = text.length > 10000 ? text.substring(0, 10000) + '...' : text;

        const enhancementPrompt = `Transform the following technical content into professional, engaging speech optimized for text-to-speech:

REQUIREMENTS:
- Make it conversational and professional
- Break down complex concepts into digestible segments
- Use natural speech patterns and transitions
- Keep technical accuracy while making it accessible
- Maximum 2400 characters for optimal TTS processing
- Add natural pauses with punctuation
- Make it sound like an expert explaining to ${audience}

TOPIC CONTEXT: ${topic}

ORIGINAL TEXT:
${inputText}

ENHANCED SPEECH VERSION:`;

        const result = await generateText({
            model: google('gemini-1.5-flash-latest'),
            prompt: enhancementPrompt,
            maxTokens: 800, // Limit to keep response concise
            temperature: 0.7,
        });

        const enhancedText = result.text;

        // Ensure the response isn't too long for TTS
        const finalText = enhancedText.length > 2400 
            ? enhancedText.substring(0, 2400).trim() + '.'
            : enhancedText;

        return res.status(200).json({
            success: true,
            original: inputText,
            enhanced: finalText,
            originalLength: inputText.length,
            enhancedLength: finalText.length
        });

    } catch (error) {
        console.error('Speech enhancement failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to enhance speech',
            details: error.message
        });
    }
}
