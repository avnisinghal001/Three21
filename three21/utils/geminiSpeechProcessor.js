// Gemini AI Speech Processor for professional and creative speech enhancement
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiSpeechProcessor {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    // Enhanced speech processing with Gemini AI
    async enhanceSpeechContent(originalText, context = {}) {
        try {
            const prompt = `Transform the following technical content into professional, engaging speech suitable for text-to-speech.

REQUIREMENTS:
- Make it conversational and professional
- Use clear, concise paragraphs (max 10,000 characters total)
- Maintain all technical accuracy
- Add natural speech patterns and transitions
- Make it sound like an expert AI assistant explaining complex topics
- Remove markdown formatting but keep structure through natural speech flow
- Use appropriate pauses and emphasis words

CONTEXT: ${context.topic || 'Technical Analysis'}
AUDIENCE: ${context.audience || 'Technical professionals'}

ORIGINAL CONTENT:
${originalText}

ENHANCED SPEECH VERSION:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const enhancedText = response.text();

            // Ensure we don't exceed 10,000 characters
            const truncatedText = enhancedText.length > 10000 
                ? enhancedText.substring(0, 9950) + "... and that concludes our analysis."
                : enhancedText;

            return {
                success: true,
                originalLength: originalText.length,
                enhancedLength: truncatedText.length,
                enhancedText: truncatedText,
                processingTime: Date.now()
            };
        } catch (error) {
            console.error('Gemini speech enhancement failed:', error);
            
            // Fallback to original with basic cleanup
            const fallbackText = originalText
                .replace(/[*_`#]/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            return {
                success: false,
                error: error.message,
                enhancedText: fallbackText.substring(0, 10000),
                originalLength: originalText.length,
                enhancedLength: Math.min(fallbackText.length, 10000)
            };
        }
    }

    // Generate speech summary for very long content
    async generateSpeechSummary(longContent, maxLength = 5000) {
        try {
            const prompt = `Create a comprehensive yet concise speech version of this content.

REQUIREMENTS:
- Maximum ${maxLength} characters
- Professional, conversational tone
- Maintain key technical points
- Smooth speech flow with natural transitions
- Emphasize most important insights
- End with a clear conclusion

CONTENT TO SUMMARIZE:
${longContent}

CONCISE SPEECH VERSION:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const summaryText = response.text();

            return {
                success: true,
                summary: summaryText.substring(0, maxLength),
                compressionRatio: (longContent.length / summaryText.length).toFixed(2)
            };
        } catch (error) {
            console.error('Gemini summary generation failed:', error);
            return {
                success: false,
                error: error.message,
                summary: longContent.substring(0, maxLength)
            };
        }
    }

    // Context-aware speech enhancement
    async contextualSpeechEnhancement(text, context) {
        const contextPrompts = {
            technical: "Explain with technical precision but accessible language",
            creative: "Use engaging, creative language while maintaining accuracy",
            educational: "Structure as a clear educational explanation with examples",
            professional: "Maintain formal professional tone with clear insights",
            conversational: "Make it sound like a natural conversation with an expert"
        };

        const selectedContext = contextPrompts[context.style] || contextPrompts.professional;
        
        return await this.enhanceSpeechContent(text, {
            ...context,
            additionalInstructions: selectedContext
        });
    }
}

export default new GeminiSpeechProcessor();
