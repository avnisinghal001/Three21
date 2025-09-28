# Three21 Voice AI Integration

A comprehensive conversational AI system with voice controls for 3D model interaction, powered by Sarvam AI for STT/TTS and Google Gemini for intelligent responses.

## 🎤 Features

### Voice Recognition & Synthesis
- **Speech-to-Text (STT)**: Powered by Sarvam AI for accurate voice recognition
- **Text-to-Speech (TTS)**: Natural voice responses using Sarvam AI
- **Multi-language Support**: English, Hindi, and 9 regional Indian languages
- **Fallback Support**: Browser Web Speech API as backup

### Voice Commands
- **Model Manipulation**: "Expand the model", "Collapse parts"
- **Part Selection**: "Select the wing", "Choose the engine"  
- **Camera Control**: "Rotate left 45 degrees", "Zoom in 2 times"
- **Analysis**: "Analyze the model", "Take a screenshot"
- **Navigation**: "Reset view", "Show all parts"

### Conversational AI
- **Natural Language Processing**: Understanding complex voice queries
- **Context Awareness**: AI remembers conversation history
- **Voice Responses**: AI explanations spoken aloud
- **Model Analysis**: Intelligent 3D model insights

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install sarvamai@latest
```

### 2. Environment Configuration
Create `.env.local`:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Get API Keys
- **Sarvam AI**: Visit [Sarvam AI Console](https://www.sarvam.ai/console) to get API key
- **Google Gemini**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

## 📁 Project Structure

### Core Voice Components
```
utils/
├── voiceManager.js           # Main voice handling (STT/TTS)
├── voiceCommandProcessor.js  # NLP command processing
├── sarvamTTS.js             # Sarvam AI integration
└── sarvam.js                # Sarvam client setup

components/
├── VoiceEnabledChat.js      # Voice UI component
├── ModelInteractions.js     # 3D model voice controls
└── Three21Bot.js           # Enhanced with voice

hooks/
└── useModelInteractions.js  # Voice integration hook
```

### Voice Files Storage
```
recordings/                   # Temporary audio files
├── recording-2025-01-19.webm
├── recording-2025-01-19.webm
└── ... (auto-cleanup after 10 files)
```

## 🎯 Usage

### Basic Integration
```jsx
import VoiceEnabledChat from '@/components/VoiceEnabledChat';
import { useModelInteractions } from '@/hooks/useModelInteractions';

function MyComponent() {
    const { modelInteractions } = useModelInteractions();
    
    return (
        <VoiceEnabledChat
            onSendMessage={(text) => console.log('Voice message:', text)}
            onVoiceCommand={(cmd) => console.log('Voice command:', cmd)}
            modelInteractions={modelInteractions}
            isLoading={false}
        />
    );
}
```

### Voice Commands Examples

#### Model Manipulation
```
"Expand the model"          → Disassembles the 3D model
"Collapse all parts"        → Reassembles the model
"Reset the view"           → Returns to original position
```

#### Part Selection
```
"Select the wing"          → Highlights wing component
"Choose the engine"        → Focuses on engine part
"Highlight landing gear"   → Selects landing gear
```

#### Camera Controls
```
"Rotate left 45 degrees"   → Rotates model left
"Zoom in 2 times"         → Magnifies view
"Turn clockwise"          → Rotates right
```

#### AI Queries
```
"Analyze this part"        → Opens AI analysis
"Take a screenshot"        → Captures current view
"What is this component?"  → Asks AI about selection
```

### Complex Commands
```
"Select the wing and analyze it"     → Multi-step command
"Expand the model and take photo"    → Sequential actions
"Show me the engine details"         → Context-aware query
```

## 🤖 AI Integration

### Sarvam AI Configuration
```javascript
// utils/sarvam.js
import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY,
});
```

### Voice Response Processing
```javascript
// Automatic voice response for AI answers
const handleAIResponse = async (text) => {
    const cleanText = text
        .replace(/[#*_`~]/g, '')      // Remove markdown
        .replace(/[🤖📷🔍]/g, '');    // Remove emojis
    
    await voiceManager.textToSpeech(cleanText, 'en-IN');
};
```

## 🎪 Demo Page

Visit `/voice-demo` to see the complete voice AI integration:

### Features Demonstrated
- ✅ Voice command recognition
- ✅ 3D model manipulation via voice
- ✅ AI chat with voice responses  
- ✅ Real-time voice feedback
- ✅ Multi-language support
- ✅ Command suggestions
- ✅ Statistics tracking

### Demo Commands to Try
```
"Expand the aircraft model"
"Select the propeller"
"Rotate the view left"
"Take a screenshot"
"Tell me about this aircraft"
"Zoom in on the engine"
"Reset everything"
```

## 🛠️ Technical Details

### Voice Manager Architecture
```javascript
class VoiceManager {
    // Dual STT approach
    startListening() {
        // 1. Sarvam AI STT (primary)
        // 2. Browser Web Speech API (fallback)
    }
    
    // Enhanced TTS with cleanup
    async textToSpeech(text) {
        // Clean text → Sarvam TTS → Audio playback
    }
    
    // Recording management
    saveRecording() {
        // Temporary storage in /recordings
        // Auto-cleanup old files
    }
}
```

### Command Processing Pipeline
```
Voice Input → STT → NLP Processing → Command Classification → 3D Action → Feedback
     ↓           ↓         ↓              ↓                    ↓           ↓
  Sarvam AI → Text → Parse Intent → Select/Expand/Rotate → Model Update → TTS
```

### Model Interactions
```javascript
class ModelInteractions {
    // Voice command handlers
    expandModel(target, params)     // "expand the wing"
    selectPart(partName)           // "select engine"  
    rotateModel(direction, degrees) // "rotate left 90"
    analyzeModel(target)           // "analyze this part"
    
    // Smart part finding
    findPart(name) {
        // Fuzzy matching for part names
        // Traverses 3D scene graph
    }
}
```

## 🔧 Configuration

### Sarvam TTS Options
```javascript
const ttsOptions = {
    target_language_code: 'en-IN',  // Language
    speaker: 'meera',               // Voice type
    pitch: 0,                       // Pitch adjustment
    pace: 1.0,                      // Speaking speed
    loudness: 1.0,                  // Volume level
    model: 'bulbul:v1'             // TTS model
};
```

### Voice Command Patterns
```javascript
const commands = {
    'expand': ['expand', 'open up', 'disassemble', 'explode'],
    'select': ['select', 'choose', 'pick', 'highlight', 'focus on'],
    'rotate': ['rotate', 'turn', 'spin', 'revolve'],
    'analyze': ['analyze', 'examine', 'inspect', 'study'],
    // ... more patterns
};
```

### Recording Settings
```javascript
const audioConfig = {
    audio: {
        sampleRate: 16000,          // Optimal for STT
        channelCount: 1,            // Mono audio
        echoCancellation: true,     // Noise reduction
        noiseSuppression: true,     // Clean audio
        autoGainControl: true       // Volume normalization
    }
};
```

## 🚨 Troubleshooting

### Common Issues

#### Voice Not Working
```
1. Check microphone permissions
2. Verify HTTPS connection (required for voice APIs)
3. Test with different browsers
4. Check console for API key errors
```

#### Sarvam API Errors
```
1. Verify API key in environment variables
2. Check API quota/limits
3. Test network connectivity
4. Fallback to browser APIs automatically
```

#### Command Not Recognized
```
1. Speak clearly and slowly
2. Use supported command patterns
3. Check available part names
4. Try rephrasing the command
```

### Debug Mode
```javascript
// Enable detailed voice logging
localStorage.setItem('voice_debug', 'true');

// Check voice manager status
console.log(voiceManager.isListening);
console.log(voiceManager.recordingFiles);
```

## 📚 API Reference

### VoiceManager Methods
```javascript
// Start voice recognition
await voiceManager.startListening(onTranscript, onResult);

// Convert text to speech
await voiceManager.textToSpeech(text, language);

// Stop all voice activities
voiceManager.stopListening();

// Cleanup resources
voiceManager.cleanup();
```

### VoiceCommandProcessor Methods  
```javascript
// Process voice input
const command = processor.processVoiceCommand(transcript);

// Get available commands
const suggestions = processor.getCommandSuggestions();

// Check command validity
const isValid = processor.isValidCommand(text);
```

### ModelInteractions Methods
```javascript
// Initialize with model reference
interactions.initialize(modelRef, sceneRef, layerManager);

// Execute voice commands
interactions.expandModel(targetPart, parameters);
interactions.selectPart(partName);
interactions.rotateModel(direction, degrees);

// Get model information
const parts = interactions.getAvailableParts();
```

## 🎨 Customization

### Custom Voice Commands
```javascript
// Add new command patterns
processor.commands.custom = ['custom', 'special', 'unique'];

// Handle custom commands
processor.executeSingleCommand = (command) => {
    if (command.type === 'custom') {
        // Your custom logic here
    }
};
```

### Custom TTS Voices
```javascript
// Add new Sarvam speakers
const customOptions = {
    speaker: 'manish',           // Male voice
    target_language_code: 'hi-IN', // Hindi
    pace: 0.8                    // Slower speech
};
```

### UI Customization
```javascript
// Custom voice button styles
<VoiceEnabledChat
    className="my-custom-voice-chat"
    micButtonStyle={{
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        borderRadius: '50%'
    }}
/>
```

## 📈 Performance

### Optimization Tips
- Audio files are automatically compressed
- Old recordings cleaned up (max 10 files)
- TTS responses limited to 500 characters
- Voice commands processed locally first
- Fallback mechanisms prevent blocking

### Memory Management
- Voice managers use singleton pattern
- Audio URLs properly revoked
- Event listeners cleaned up
- Recording buffers cleared after processing

## 🌟 Future Enhancements

### Planned Features
- [ ] Multi-language voice commands
- [ ] Voice emotion recognition  
- [ ] Advanced NLP with context
- [ ] Voice shortcuts/macros
- [ ] Real-time collaboration voice
- [ ] Voice-guided tutorials

### Integration Ideas
- Voice-controlled VR/AR
- Multi-user voice sessions
- Voice analytics dashboard  
- Custom voice training
- Industry-specific vocabularies

---

**Powered by:**
- 🎤 Sarvam AI (STT/TTS)
- 🧠 Google Gemini (AI)
- 🎮 Three.js (3D)
- ⚛️ React (UI)
- 🔥 Next.js (Framework)
