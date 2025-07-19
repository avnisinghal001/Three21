/**
 * Enhanced AI prompt generator for comprehensive 3D model analysis
 * Focuses on research-grade insights with citations and references
 */
export class AIPromptGenerator {
    constructor() {
        this.systemPrompt = this.generateSystemPrompt();
    }

    generateSystemPrompt() {
        return `You are Three21Bot, an advanced 3D model analysis and reverse engineering assistant. You specialize in providing detailed, research-grade analysis of 3D models, mechanical components, and assemblies.

## Your Core Capabilities:
1. **Visual Analysis**: Analyze 3D models from screenshots and geometric data
2. **Reverse Engineering**: Provide insights into design intent, manufacturing methods, and assembly processes
3. **Technical Documentation**: Generate detailed component descriptions and functional analysis
4. **Research Support**: Provide citations, references, and industry standards when applicable
5. **Educational Guidance**: Explain complex mechanical and engineering concepts

## Analysis Framework:
- **Form & Function**: Analyze how component geometry relates to intended function
- **Materials & Manufacturing**: Identify likely materials and production methods
- **Assembly & Mechanisms**: Explain how components interact and move
- **Design Intent**: Infer engineering decisions and design constraints
- **Standards & References**: Cite relevant industry standards, patents, or design principles

## Response Guidelines:
- Always focus ONLY on the 3D model/components, ignore any UI elements in screenshots
- Provide specific, actionable insights rather than generic observations
- Include relevant citations, standards, or reference materials when possible
- Use user-provided model descriptions and metadata to enhance analysis
- Structure responses with clear headings and bullet points for readability
- Suggest further investigation areas or additional analysis techniques

## Citation Format:
When providing references, use this format:
- **Standards**: [ISO 14040:2006] for lifecycle assessment standards
- **Literature**: [Smith et al., 2023] for academic papers
- **Industry**: [ASME Y14.5] for engineering standards
- **Patents**: [US Patent 1,234,567] for relevant patents

Remember: You are analyzing engineering artifacts to help users understand design, function, and manufacturing. Focus on actionable insights that advance understanding and research goals.`;
    }

    /**
     * Generate comprehensive model analysis prompt
     */
    generateModelAnalysisPrompt(modelInfo, sceneAnalysis, screenshot = null, selectedPart = null) {
        const sections = [];

        // Header
        sections.push(`# 🔍 3D Model Analysis Request`);
        sections.push(`**Analysis Type**: ${selectedPart ? 'Part-Specific Analysis' : 'Complete Model Analysis'}`);
        sections.push(`**Timestamp**: ${new Date().toISOString()}`);
        sections.push(``);

        // Model Information
        if (modelInfo) {
            sections.push(`## 📋 Model Information`);
            if (modelInfo.filename) sections.push(`**Filename**: ${modelInfo.filename}`);
            if (modelInfo.description) sections.push(`**User Description**: "${modelInfo.description}"`);
            if (modelInfo.category) sections.push(`**Category**: ${modelInfo.category}`);
            if (modelInfo.manufacturer) sections.push(`**Manufacturer**: ${modelInfo.manufacturer}`);
            if (modelInfo.material) sections.push(`**Stated Material**: ${modelInfo.material}`);
            if (modelInfo.purpose) sections.push(`**Intended Purpose**: ${modelInfo.purpose}`);
            if (modelInfo.tags && modelInfo.tags.length > 0) {
                sections.push(`**Tags**: ${modelInfo.tags.join(', ')}`);
            }
            sections.push(``);
        }

        // Scene Analysis
        if (sceneAnalysis) {
            sections.push(`## 🔧 Technical Analysis`);
            sections.push(`**Component Count**: ${sceneAnalysis.meshCount} meshes, ${sceneAnalysis.totalObjects} total objects`);
            sections.push(`**Material Diversity**: ${sceneAnalysis.materialCount} unique materials`);
            sections.push(`**Complexity Score**: ${sceneAnalysis.complexityScore.toFixed(1)}/10`);
            
            if (sceneAnalysis.boundingBox) {
                const size = sceneAnalysis.boundingBox.size;
                sections.push(`**Dimensions**: ${size[0].toFixed(2)} × ${size[1].toFixed(2)} × ${size[2].toFixed(2)} units`);
            }

            if (sceneAnalysis.components.length > 0) {
                sections.push(`**Key Components**:`);
                sceneAnalysis.components
                    .filter(comp => comp.name && !comp.name.includes('Scene') && !comp.name.includes('default'))
                    .slice(0, 10) // Limit to top 10 components
                    .forEach(comp => {
                        sections.push(`  - ${comp.name} (${comp.type}, ${comp.vertexCount} vertices)`);
                    });
            }
            sections.push(``);
        }

        // Selected Part Analysis
        if (selectedPart) {
            sections.push(`## 🎯 Selected Component Analysis`);
            sections.push(`**Component Name**: ${selectedPart.name || 'Unnamed Component'}`);
            sections.push(`**Component Type**: ${selectedPart.type || 'Unknown Type'}`);
            if (selectedPart.position) {
                sections.push(`**Position**: [${selectedPart.position.map(p => p.toFixed(2)).join(', ')}]`);
            }
            if (selectedPart.material) {
                sections.push(`**Material Properties**: ${JSON.stringify(selectedPart.material, null, 2)}`);
            }
            sections.push(``);
        }

        // Screenshot Analysis
        if (screenshot) {
            sections.push(`## 📷 Visual Analysis`);
            sections.push(`**Screenshot Provided**: Yes (captured at ${new Date().toISOString()})`);
            sections.push(`**Focus Area**: ${selectedPart ? 'Selected component highlighted' : 'Complete model view'}`);
            sections.push(`**UI Elements**: Excluded from analysis (focus only on 3D model)`);
            sections.push(``);
        }

        // Analysis Request
        sections.push(`## 🎯 Analysis Request`);
        
        if (selectedPart) {
            sections.push(`Please provide a detailed analysis of the selected component "${selectedPart.name || 'selected part'}" including:`);
            sections.push(`1. **Functional Analysis**: What is this component's likely purpose and function?`);
            sections.push(`2. **Design Features**: What geometric features indicate its intended use?`);
            sections.push(`3. **Manufacturing**: How might this component be manufactured?`);
            sections.push(`4. **Materials**: What materials would be suitable for this component?`);
            sections.push(`5. **Assembly Role**: How does this component interface with other parts?`);
            sections.push(`6. **Design Optimization**: Are there any apparent design optimizations or constraints?`);
        } else {
            sections.push(`Please provide a comprehensive analysis of this 3D model including:`);
            sections.push(`1. **Overall Function**: What is this device/assembly designed to do?`);
            sections.push(`2. **Key Mechanisms**: What are the primary mechanical systems or mechanisms?`);
            sections.push(`3. **Design Philosophy**: What engineering principles are evident in the design?`);
            sections.push(`4. **Manufacturing Analysis**: How would this be manufactured and assembled?`);
            sections.push(`5. **Materials & Standards**: What materials and industry standards are likely relevant?`);
            sections.push(`6. **Performance Factors**: What performance requirements shaped this design?`);
            sections.push(`7. **Reverse Engineering**: What can we learn about the design process and decisions?`);
        }

        sections.push(``);
        sections.push(`## 📚 Additional Requirements`);
        sections.push(`- Provide specific citations or references where applicable`);
        sections.push(`- Suggest related standards, patents, or literature for further research`);
        sections.push(`- Focus on actionable insights for engineering understanding`);
        sections.push(`- Use the provided user description to inform your analysis`);
        sections.push(`- Ignore any UI elements visible in screenshots - analyze ONLY the 3D model`);

        return sections.join('\n');
    }

    /**
     * Generate research-focused follow-up questions
     */
    generateResearchPrompts(modelInfo, analysisContext) {
        const prompts = [];

        if (modelInfo?.category) {
            prompts.push(`What are the key design standards for ${modelInfo.category} components?`);
        }

        if (modelInfo?.manufacturer) {
            prompts.push(`What design philosophies or methodologies does ${modelInfo.manufacturer} typically employ?`);
        }

        if (modelInfo?.material) {
            prompts.push(`What are the material properties and manufacturing considerations for ${modelInfo.material}?`);
        }

        if (analysisContext?.complexity === 'high') {
            prompts.push(`What advanced manufacturing techniques might be required for this complex geometry?`);
        }

        // General research prompts
        prompts.push(`What patents or prior art might be relevant to this design?`);
        prompts.push(`What industry standards should I reference for similar components?`);
        prompts.push(`How might this design be optimized for different performance criteria?`);
        prompts.push(`What failure modes should be considered for this type of component?`);

        return prompts;
    }

    /**
     * Generate context-aware analysis prompt based on user interaction
     */
    generateContextualPrompt(userQuery, modelInfo, selectedPart, recentAnalysis) {
        const sections = [];

        sections.push(`# 🤖 Contextual Analysis Request`);
        sections.push(`**User Query**: "${userQuery}"`);
        sections.push(``);

        // Add relevant context
        if (modelInfo?.description) {
            sections.push(`**Model Context**: ${modelInfo.description}`);
        }

        if (selectedPart) {
            sections.push(`**Selected Component**: ${selectedPart.name || 'Current selection'}`);
        }

        if (recentAnalysis) {
            sections.push(`**Previous Analysis Available**: Building on previous insights`);
        }

        sections.push(``);
        sections.push(`## 📋 Response Guidelines`);
        sections.push(`- Reference the user's specific model description and metadata`);
        sections.push(`- Build upon any previous analysis in this session`);
        sections.push(`- Provide citations and references where relevant`);
        sections.push(`- Focus on research-grade insights and actionable information`);
        sections.push(`- Suggest follow-up investigations or analysis techniques`);

        return sections.join('\n');
    }

    /**
     * Generate system prompt for screenshot analysis
     */
    generateScreenshotAnalysisPrompt(metadata) {
        return `## 📷 Screenshot Analysis Instructions

**Important**: The provided screenshot shows a 3D model in a web-based viewer. IGNORE all UI elements including:
- Control panels, buttons, and menus
- Text overlays and labels
- Progress bars and status indicators  
- Navigation controls
- Background UI elements

**Focus ONLY on**:
- The 3D model geometry and components
- Part relationships and assembly
- Material appearances and surface features
- Mechanical interfaces and connections
- Design features and engineering details

**Analysis Metadata**:
${JSON.stringify(metadata, null, 2)}

Analyze the 3D model visible in the screenshot and provide insights based on the geometric and mechanical features you can observe. Reference the provided metadata to understand the context and user-provided information about this model.`;
    }

    /**
     * Generate citation and reference suggestions
     */
    generateCitationPrompt(domain, topic) {
        const citationAreas = {
            mechanical: [
                'ASME Y14.5 - Geometric Dimensioning and Tolerancing',
                'ISO 14040 - Life Cycle Assessment',
                'ASTM standards for materials testing',
                'Shigley\'s Mechanical Engineering Design textbook'
            ],
            manufacturing: [
                'ASM Handbook for materials and processes',
                'Manufacturing Engineering & Technology (Kalpakjian)',
                'ISO 9000 quality management standards',
                'Industry-specific manufacturing standards'
            ],
            design: [
                'Pahl & Beitz - Engineering Design methodology',
                'Ulrich & Eppinger - Product Design and Development',
                'DFMA (Design for Manufacturing and Assembly) principles',
                'Patent databases for prior art research'
            ]
        };

        return `## 📚 Suggested References for ${topic}

Consider referencing these sources for deeper research:
${(citationAreas[domain] || []).map(ref => `- ${ref}`).join('\n')}

For academic research, also consider:
- Google Scholar for recent publications
- USPTO/WIPO patent databases
- Industry-specific technical journals
- Professional engineering society publications`;
    }
}

export default AIPromptGenerator;
