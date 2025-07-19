import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

const ENHANCED_SYSTEM_PROMPT = `You are Three21Bot, an advanced AI assistant specialized in research-grade 3D model analysis and reverse engineering. Your expertise covers:

🔬 **Advanced Model Analysis**: Deep technical analysis focusing ONLY on 3D models and components (ignore UI elements in screenshots)
🛠️ **Reverse Engineering**: Comprehensive breakdown of design intent, manufacturing methods, and assembly processes
📐 **Engineering Research**: Academic-quality insights with citations, standards, and references
🎯 **Component Analysis**: Detailed part-specific analysis including materials, function, and design optimization
⚙️ **Technical Documentation**: Research-grade documentation with industry standards and best practices
📚 **Citations & References**: Provide relevant standards (ISO, ASME, ASTM), patents, and academic sources when applicable

**CRITICAL INSTRUCTION - Screenshot Analysis:**
When analyzing screenshots, COMPLETELY IGNORE all UI elements including:
- Control panels, buttons, menus, and overlays
- Text labels, progress bars, and status indicators
- Navigation controls and toolbars
- Background UI elements and widgets

FOCUS EXCLUSIVELY ON:
- 3D model geometry and components
- Part relationships and mechanical interfaces
- Material appearances and surface features
- Assembly connections and mechanisms
- Engineering design features
- Dont Focus on UI elements (never never), only analyze the 3D model geometry, components, and highlighted parts

**Analysis Framework:**
- **Form & Function**: Analyze how geometry relates to intended function
- **Manufacturing**: Identify production methods and design for manufacturing principles
- **Materials**: Suggest appropriate materials based on geometry and application
- **Standards**: Reference relevant engineering standards and industry practices
- **Research Context**: Use user-provided descriptions to enhance analysis accuracy

**Response Guidelines:**
- Provide research-grade technical analysis with actionable insights
- provide links for similar models studies or related research
- Use clear, structured headings for each analysis section
- Include citations in format: [ISO 14040:2006], [ASME Y14.5], [Smith et al., 2023]
- Use user model descriptions to inform and contextualize analysis
- Structure responses with clear headings and technical depth
- Suggest follow-up investigations and analysis techniques
- Focus on engineering principles that advance understanding

Remember: You're analyzing engineering artifacts to support research and understanding. Provide insights that would be valuable for technical documentation, academic research, or professional engineering analysis.`;

export async function POST(req) {
    try {
        const { 
            messages, 
            modelInfo, 
            selectedPart, 
            screenshot, 
            sceneAnalysis,
            analysisContext,
            systemPrompt 
        } = await req.json();

        // Use enhanced system prompt if provided, fallback to default
        let contextPrompt = systemPrompt || ENHANCED_SYSTEM_PROMPT;
        
        if (modelInfo) {
            contextPrompt += `\n\n**📋 Model Context (User-Provided Information):**`;
            
            // Enhanced model context with required fields emphasized
            if (modelInfo.filename) contextPrompt += `\n- **Filename**: ${modelInfo.filename}`;
            
            // REQUIRED FIELDS - These are now mandatory and critical for analysis
            if (modelInfo.description) {
                contextPrompt += `\n- **🎯 User Description**: "${modelInfo.description}"`;
                contextPrompt += `\n  ↳ *Use this description as primary context for all analysis*`;
            }
            
            if (modelInfo.category) {
                contextPrompt += `\n- **📂 Category**: ${modelInfo.category}`;
                contextPrompt += `\n  ↳ *Apply ${modelInfo.category}-specific analysis standards and practices*`;
            }
            
            if (modelInfo.purpose) {
                contextPrompt += `\n- **🎲 Purpose**: ${modelInfo.purpose}`;
                contextPrompt += `\n  ↳ *Focus analysis on ${modelInfo.purpose} requirements and considerations*`;
            }
            
            if (modelInfo.complexity) {
                contextPrompt += `\n- **⚙️ Complexity Level**: ${modelInfo.complexity}`;
                contextPrompt += `\n  ↳ *Adjust analysis depth and technical detail for ${modelInfo.complexity} complexity*`;
            }
            
            if (modelInfo.tags && modelInfo.tags.length > 0) {
                contextPrompt += `\n- **🏷️ Tags**: ${modelInfo.tags.join(', ')}`;
                contextPrompt += `\n  ↳ *Incorporate these keywords and domain expertise in analysis*`;
            }
            
            // Additional fields if provided
            if (modelInfo.manufacturer) contextPrompt += `\n- **Manufacturer**: ${modelInfo.manufacturer}`;
            if (modelInfo.material) contextPrompt += `\n- **Stated Material**: ${modelInfo.material}`;
            
            // Demo mode specific context
            if (modelInfo.isDemoMode && modelInfo.demoInfo) {
                contextPrompt += `\n- **Demo Model**: ${modelInfo.demoInfo.name}`;
                contextPrompt += `\n- **Demo Type**: ${modelInfo.demoInfo.type}`;
                contextPrompt += `\n- **Demo Description**: ${modelInfo.demoInfo.description}`;
                contextPrompt += `\n- **Mode**: Interactive Demo`;
            }
            
            // Analysis enhancement instructions
            contextPrompt += `\n\n**🚀 Analysis Enhancement Instructions:**`;
            contextPrompt += `\n- **PRIMARY**: Always reference the user's description to guide your analysis focus`;
            contextPrompt += `\n- **CATEGORY**: Apply domain-specific knowledge for ${modelInfo.category || 'general'} components`;
            contextPrompt += `\n- **PURPOSE**: Tailor insights for ${modelInfo.purpose || 'general analysis'} objectives`;
            contextPrompt += `\n- **TAGS**: Incorporate expertise related to: ${(modelInfo.tags || []).join(', ') || 'general engineering'}`;
            contextPrompt += `\n- **COMPLEXITY**: Provide ${modelInfo.complexity || 'medium'}-level technical depth`;
        }

        // Add scene analysis context
        if (sceneAnalysis) {
            contextPrompt += `\n\n**🔧 Technical Scene Analysis:**`;
            contextPrompt += `\n- **Component Count**: ${sceneAnalysis.meshCount} meshes, ${sceneAnalysis.totalObjects} total objects`;
            contextPrompt += `\n- **Material Diversity**: ${sceneAnalysis.materialCount} unique materials`;
            contextPrompt += `\n- **Complexity Score**: ${sceneAnalysis.complexityScore.toFixed(1)}/10`;
            
            if (sceneAnalysis.boundingBox) {
                const size = sceneAnalysis.boundingBox.size;
                contextPrompt += `\n- **Dimensions**: ${size[0].toFixed(2)} × ${size[1].toFixed(2)} × ${size[2].toFixed(2)} units`;
            }

            if (sceneAnalysis.components && sceneAnalysis.components.length > 0) {
                contextPrompt += `\n- **Key Components**: ${sceneAnalysis.components.slice(0, 5).map(c => c.name).join(', ')}`;
            }
        }

        // Add selected part context
        if (selectedPart) {
            contextPrompt += `\n\n**🎯 Selected Component Analysis:**`;
            contextPrompt += `\n- **Component**: ${selectedPart.name || 'Unnamed Component'}`;
            contextPrompt += `\n- **Type**: ${selectedPart.type || 'Unknown Type'}`;
            if (selectedPart.position) {
                contextPrompt += `\n- **Position**: [${selectedPart.position.map(p => p.toFixed(2)).join(', ')}]`;
            }
            if (selectedPart.material) {
                contextPrompt += `\n- **Material Properties**: Available for analysis`;
            }
        }

        // Add screenshot analysis context
        if (screenshot) {
            contextPrompt += `\n\n**📷 Visual Analysis Context:**`;
            contextPrompt += `\n- **Screenshot**: High-quality model capture provided`;
            contextPrompt += `\n- **Focus**: ${selectedPart ? 'Selected component highlighted' : 'Complete model view'}`;
            contextPrompt += `\n- **UI Elements**: MUST BE IGNORED - Analyze ONLY the 3D model`;
            contextPrompt += `\n- **Analysis Type**: Visual geometry and engineering feature analysis`;
        }

        // Add analysis context instructions
        if (analysisContext) {
            contextPrompt += `\n\n**📊 Analysis Instructions:**`;
            if (analysisContext.excludeUIElements) {
                contextPrompt += `\n- ⚠️ **CRITICAL**: Ignore ALL UI elements in screenshots`;
            }
            if (analysisContext.focusOnModel) {
                contextPrompt += `\n- 🎯 **Focus**: Analyze ONLY the 3D model geometry and components`;
            }
            if (analysisContext.researchGrade) {
                contextPrompt += `\n- 📚 **Quality**: Provide research-grade technical analysis`;
            }
            if (analysisContext.provideCitations) {
                contextPrompt += `\n- 📖 **Citations**: Include relevant standards and references`;
            }
        }

        contextPrompt += `\n\n**🚀 Ready for Analysis**: Use the provided context to deliver comprehensive, research-quality insights about this 3D model.`;

        // Prepare messages for AI
        const conversationMessages = [
            { role: 'system', content: contextPrompt },
            ...messages
        ];

        const result = await generateText({
            model: google('gemini-2.5-flash'),
            messages: conversationMessages,
            maxTokens: 2000,
            temperature: 0.1, // Lower temperature for more technical, consistent responses
        });

        return new Response(JSON.stringify({ 
            content: result.text,
            citations: [], // Could be extracted from response in future
            references: [], // Could be extracted from response in future
            analysisMetadata: {
                hasScreenshot: !!screenshot,
                hasSceneAnalysis: !!sceneAnalysis,
                selectedPart: selectedPart?.name || null,
                timestamp: new Date().toISOString()
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        
        const errorResponse = {
            error: error.message || 'Failed to process AI request',
            details: 'The AI analysis system encountered an error. Please try again with a simpler query or ensure your model is fully loaded.',
            suggestions: [
                'Try taking a new screenshot of the model',
                'Ensure the 3D model is fully loaded before analysis',
                'Simplify your question and try again',
                'Check your internet connection'
            ],
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default POST;
