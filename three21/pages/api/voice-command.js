import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

const VOICE_COMMAND_SYSTEM_PROMPT = `You are Three21Bot's Voice Command Processor, specialized in interpreting natural language voice commands for 3D model platform navigation and control.

**Your Role**: Parse voice input and determine the appropriate action/function to execute.

**Available Commands & Functions**:
1. **Navigation Commands**:
   - "start demo", "go to demo", "open demo", "show demo" → Function: navigateToDemo()
   - "upload model", "import model", "add model" → Function: navigateToUpload()
   - "go home", "homepage", "main page" → Function: navigateToHome()

2. **Model Control Commands**:
   - "expand model", "disassemble", "explode model", "open model", "break apart" → Function: expandModel()
   - "assemble model", "collapse model", "chota kardo", "close model", "put together" → Function: assembleModel()
   - "rotate model", "spin model", "turn model" → Function: rotateModel()
   - "zoom in", "magnify", "bigger", "closer" → Function: zoomIn()
   - "zoom out", "smaller", "zoom back", "farther" → Function: zoomOut()
   - "reset view", "original position", "default view", "center model" → Function: resetView()

3. **Interface Commands**:
   - "open chat", "chat interface", "talk to bot", "start chat" → Function: openChat()
   - "close chat", "end chat", "hide chat" → Function: closeChat()
   - "toggle chat", "switch chat", "chat on off" → Function: toggleChat()
   - "take screenshot", "capture screen", "save image" → Function: takeScreenshot()

4. **Voice/Audio Commands**:
   - "test voice", "test audio", "voice test" → Function: testVoice()

**Response Format**: Respond ONLY with a JSON object in this exact format:
{
  "function": "functionName",
  "confidence": 0.95,
  "parameters": {},
  "fallback": "chatQuery"
}

**Rules**:
1. If confidence < 0.7, set function to "chatQuery" and put the query in fallback
2. Always include confidence score (0.0 to 1.0)
3. Only use functions listed above
4. For ambiguous commands, choose the most likely function
5. Support mixed language (English + Hindi)
6. Handle casual/colloquial speech patterns

**Examples**:
Input: "hey three two one bot start demo"
Output: {"function": "navigateToDemo", "confidence": 0.95, "parameters": {}, "fallback": null}

Input: "expand the model please"
Output: {"function": "expandModel", "confidence": 0.90, "parameters": {}, "fallback": null}

Input: "what is the material of this part?"
Output: {"function": "chatQuery", "confidence": 0.85, "parameters": {}, "fallback": "what is the material of this part?"}`;

export async function POST(req) {
    try {
        const { voiceInput, language = 'en-IN' } = await req.json();

        if (!voiceInput || voiceInput.trim().length === 0) {
            return Response.json({ 
                error: 'Voice input is required',
                function: 'chatQuery',
                confidence: 0.0,
                fallback: voiceInput 
            }, { status: 400 });
        }

        console.log('🎤 Voice Command Processing:', voiceInput);

        // Generate AI response using Gemini
        const { text } = await generateText({
            model: google('gemini-1.5-pro-002'),
            messages: [
                { 
                    role: 'system', 
                    content: VOICE_COMMAND_SYSTEM_PROMPT 
                },
                { 
                    role: 'user', 
                    content: `Voice Input (${language}): "${voiceInput}"` 
                }
            ],
            temperature: 0.1, // Low temperature for consistent function detection
            maxTokens: 200
        });

        console.log('🤖 AI Response:', text);

        // Parse the AI response
        let result;
        try {
            result = JSON.parse(text.trim());
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            // Fallback to chat query if parsing fails
            result = {
                function: 'chatQuery',
                confidence: 0.5,
                parameters: {},
                fallback: voiceInput
            };
        }

        // Validate result structure
        if (!result.function || typeof result.confidence !== 'number') {
            result = {
                function: 'chatQuery',
                confidence: 0.5,
                parameters: {},
                fallback: voiceInput
            };
        }

        // Ensure confidence is within bounds
        result.confidence = Math.max(0, Math.min(1, result.confidence));

        console.log('✅ Processed Voice Command:', result);

        return Response.json(result);

    } catch (error) {
        console.error('❌ Voice Command API Error:', error);
        
        return Response.json({ 
            error: 'Failed to process voice command',
            function: 'chatQuery',
            confidence: 0.0,
            fallback: voiceInput || 'Sorry, I could not understand that command'
        }, { status: 500 });
    }
}
