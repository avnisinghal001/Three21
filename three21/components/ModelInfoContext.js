import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { set as idbSet, get as idbGet } from 'idb-keyval';

const ModelInfoContext = createContext();

export const useModelInfo = () => {
    const context = useContext(ModelInfoContext);
    if (!context) {
        console.warn('useModelInfo used outside ModelInfoProvider, returning null');
        return null;
    }
    return context;
};

export function ModelInfoProvider({ children, demoConfig = null }) {
    // Initialize modelInfo with demoConfig if in demo mode
    const [modelInfo, setModelInfo] = useState(demoConfig ? {
        name: demoConfig.name,
        description: demoConfig.description,
        category: demoConfig.category,
        manufacturer: demoConfig.manufacturer,
        purpose: demoConfig.purpose,
        complexity: demoConfig.complexity,
        tags: demoConfig.tags,
        components: demoConfig.components,
        isDemoMode: true,
        uploadTime: new Date().toISOString(),
        id: 'demo-model'
    } : null);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [modelStructure, setModelStructure] = useState(null);

    // Update modelInfo when demoConfig changes
    useEffect(() => {
        if (demoConfig && !modelInfo?.isDemoMode) {
            console.log('Initializing demo mode with config:', demoConfig);
            setModelInfo({
                name: demoConfig.name,
                description: demoConfig.description,
                category: demoConfig.category,
                manufacturer: demoConfig.manufacturer,
                purpose: demoConfig.purpose,
                complexity: demoConfig.complexity,
                tags: demoConfig.tags,
                components: demoConfig.components,
                isDemoMode: true,
                uploadTime: new Date().toISOString(),
                id: 'demo-model'
            });
        }
    }, [demoConfig, modelInfo?.isDemoMode]);

    // Extract model structure for AI reference
    const extractModelStructure = useCallback((scene) => {
        const structure = {
            name: demoConfig?.name || 'Model',
            description: demoConfig?.description || '',
            category: demoConfig?.category || '',
            manufacturer: demoConfig?.manufacturer || '',
            material: demoConfig?.material || '',
            purpose: demoConfig?.purpose || '',
            complexity: demoConfig?.complexity || 'medium',
            tags: demoConfig?.tags || [],
            components: demoConfig?.components || {},
            technicalSpecs: demoConfig?.technicalSpecs || {},
            hierarchy: {},
            meshComponents: []
        };

        const traverseObject = (object, path = '') => {
            const currentPath = path ? `${path}/${object.name}` : object.name;
            
            if (object.name) {
                structure.meshComponents.push({
                    name: object.name,
                    path: currentPath,
                    type: object.type,
                    visible: object.visible,
                    material: object.material?.name || null,
                    geometry: object.geometry?.type || null,
                    position: object.position ? [
                        Number(object.position.x.toFixed(3)),
                        Number(object.position.y.toFixed(3)),
                        Number(object.position.z.toFixed(3))
                    ] : null,
                    rotation: object.rotation ? [
                        Number(object.rotation.x.toFixed(3)),
                        Number(object.rotation.y.toFixed(3)),
                        Number(object.rotation.z.toFixed(3))
                    ] : null
                });
            }

            if (object.children && object.children.length > 0) {
                structure.hierarchy[currentPath] = object.children.map(child => child.name).filter(Boolean);
                object.children.forEach(child => traverseObject(child, currentPath));
            }
        };

        if (scene) {
            traverseObject(scene);
        }

        setModelStructure(structure);
        return structure;
    }, [demoConfig]);

    // Handle part selection for AI integration
    const selectPart = useCallback((partName, object) => {
        const partInfo = {
            name: partName,
            path: partName,
            type: object?.type || 'Unknown',
            material: object?.material?.name || 'Unknown',
            geometry: object?.geometry?.type || 'Unknown',
            position: object?.position ? [
                Number(object.position.x.toFixed(3)),
                Number(object.position.y.toFixed(3)),
                Number(object.position.z.toFixed(3))
            ] : null,
            boundingBox: object?.geometry?.boundingBox || null
        };
        
        setSelectedPart(partInfo);
        
        // Auto-open AI chat when part is selected in demo mode
        if (demoConfig) {
            setIsAIOpen(true);
        }
        
        return partInfo;
    }, [demoConfig]);

    // Save model info to IndexedDB and state
    const saveModelInfo = useCallback(async (info) => {
        const modelData = {
            ...info,
            uploadTime: new Date().toISOString(),
            id: Date.now().toString()
        };
        
        await idbSet('currentModelInfo', modelData);
        setModelInfo(modelData);
        return modelData;
    }, []);

    // Load model info from IndexedDB
    const loadModelInfo = useCallback(async () => {
        try {
            const savedInfo = await idbGet('currentModelInfo');
            if (savedInfo) {
                setModelInfo(savedInfo);
                return savedInfo;
            }
        } catch (error) {
            console.error('Failed to load model info:', error);
        }
        return null;
    }, []);

    // Generate AI analysis of the model
    const generateModelAnalysis = useCallback(async (screenshot, modelData) => {
        try {
            // Include demo configuration and model structure in AI context
            const contextData = {
                ...modelData,
                isDemoMode: !!demoConfig,
                demoInfo: demoConfig,
                modelStructure: modelStructure,
                selectedPart: selectedPart
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: demoConfig 
                            ? `Analyze this ${demoConfig.name}. Here's the description: ${demoConfig.description}. Focus on the technical components and their functions.`
                            : 'Provide a comprehensive analysis of this 3D model. Include component identification, likely purpose, engineering insights, and reverse engineering observations.'
                    }],
                    modelInfo: contextData,
                    screenshot: screenshot
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate analysis');
            }

            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('AI analysis failed:', error);
            return null;
        }
    }, [demoConfig, modelStructure, selectedPart]);

    // Update model info with AI analysis
    const updateModelAnalysis = useCallback(async (analysis) => {
        if (!modelInfo) return;

        const updatedInfo = {
            ...modelInfo,
            aiAnalysis: analysis,
            analysisTime: new Date().toISOString()
        };

        await idbSet('currentModelInfo', updatedInfo);
        setModelInfo(updatedInfo);
    }, [modelInfo]);

    // Open AI chat with specific part selected
    const openAIForPart = useCallback((partName) => {
        setSelectedPart(partName);
        setIsAIOpen(true);
    }, []);

    // Close AI chat
    const closeAI = useCallback(() => {
        setIsAIOpen(false);
        setSelectedPart(null);
    }, []);

    const value = {
        modelInfo,
        isAIOpen,
        selectedPart,
        modelStructure,
        demoConfig,
        saveModelInfo,
        loadModelInfo,
        generateModelAnalysis,
        updateModelAnalysis,
        openAIForPart,
        closeAI,
        setIsAIOpen,
        setSelectedPart,
        selectPart,
        extractModelStructure
    };

    return (
        <ModelInfoContext.Provider value={value}>
            {children}
        </ModelInfoContext.Provider>
    );
}
