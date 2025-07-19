import { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { InteractiveModelPrimitive } from './InteractiveModelPrimitive';
import { DisassemblyUI } from './DisassemblyUI';
import { useLayerManager } from './LayerManager';
import { AnimationController } from './AnimationController';
import { Three21Bot } from './Three21Bot';
import { useModelInfo } from './ModelInfoContext';
import { Toast } from './Toast';
import { HighlightManager } from './HighlightManager';
import { ScreenshotManager } from './ScreenshotManager';
import { DEMO_CONFIG } from '@/pages/model';

import html2canvas from 'html2canvas';

export default function AnyModelViewer({ url, type, isDemoMode = false, demoConfig = null }) {
    const modelRef = useRef();
    const canvasRef = useRef();
    const highlightManagerRef = useRef(null);
    const screenshotManagerRef = useRef(null);
    
    // Separation distance state for disassembly
    const [separationDistance, setSeparationDistance] = useState(40);  // Better demo value
    
    // Highlight settings state
    const [highlightColor, setHighlightColor] = useState('#00ffff');
    const [highlightOpacity, setHighlightOpacity] = useState(0.7);
    
    // Auto-screenshot state
    const [autoScreenshotTaken, setAutoScreenshotTaken] = useState(false);
    
    // Model scale and normalization state
    const [modelScale, setModelScale] = useState({
        originalSize: null,
        normalizedScale: 1,
        boundingBox: null,
        targetSize: 100,
        autoScale: true
    });
    
    const { initializeLayers, currentLayer, isAnimating, totalLayers, updateAnimation } = useLayerManager(modelRef, separationDistance);
    
    // Toast state for object clicking
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    // Use optional chaining to prevent context errors
    const modelInfoContext = useModelInfo();
    const { 
        modelInfo, 
        isAIOpen, 
        selectedPart, 
        closeAI, 
        setIsAIOpen, 
        loadModelInfo,
        selectPart,
        extractModelStructure,
        demoConfig: contextDemoConfig
    } = modelInfoContext || {};
    
    // Use demo config from props or context
    const activeDemoConfig = demoConfig || contextDemoConfig;
    
    // Load model info when component mounts
    useEffect(() => {
        if (loadModelInfo && !isDemoMode) {
            loadModelInfo();
        }
        
        // Initialize managers
        if (!highlightManagerRef.current) {
            highlightManagerRef.current = new HighlightManager();
        }
        
        if (!screenshotManagerRef.current) {
            screenshotManagerRef.current = new ScreenshotManager(canvasRef);
        }
    }, [loadModelInfo, isDemoMode]);

    // Update highlight settings
    useEffect(() => {
        if (highlightManagerRef.current) {
            highlightManagerRef.current.setHighlightProperties(
                highlightColor,
                highlightOpacity,
                1.0, // intensity
                true, // pulse animation
                2.0 // pulse speed
            );
        }
    }, [highlightColor, highlightOpacity]);

    const handleModelLoad = useCallback((scene, scaleInfo) => {
        console.log('Model loaded, scene:', scene);
        console.log('Scale info:', scaleInfo);
        
        // Store scale information
        if (scaleInfo) {
            setModelScale({
                originalSize: scaleInfo.originalSize,
                normalizedScale: scaleInfo.scale,
                boundingBox: scaleInfo.boundingBox,
                targetSize: 100,
                autoScale: true
            });
        }
        if (modelRef.current) {
            // Initialize layer system after model loads
            setTimeout(() => {
                initializeLayers(modelRef.current);
                
                // Extract model structure for AI reference (for both demo and regular modes)
                if (extractModelStructure) {
                    const structure = extractModelStructure(scene);
                    console.log('Model structure extracted:', structure);
                    
                    // In demo mode, this is used for AI reference
                    if (isDemoMode) {
                        console.log('Demo mode: Model structure ready for AI');
                    }
                }

                // Auto-capture screenshot for AI analysis if not already taken
                if (!autoScreenshotTaken && screenshotManagerRef.current) {
                    setTimeout(async () => {
                        try {
                            const screenshot = await screenshotManagerRef.current.captureModelOnly({
                                width: 1024,
                                height: 768,
                                backgroundColor: '#000000'
                            });
                            
                            if (screenshot) {
                                console.log('Auto-screenshot captured for AI analysis');
                                setAutoScreenshotTaken(true);
                                
                                // Store screenshot for AI reference
                                if (setIsAIOpen && modelInfo) {
                                    // You can optionally auto-open AI with the screenshot
                                    // setIsAIOpen(true);
                                }
                            }
                        } catch (error) {
                            console.error('Auto-screenshot failed:', error);
                        }
                    }, 2000); // Wait 2 seconds for model to fully render
                }
            }, 100);
        }
    }, [initializeLayers, isDemoMode, extractModelStructure, autoScreenshotTaken, modelInfo, setIsAIOpen]);

    // Handle object click with part selection and highlighting
    const handleObjectClick = useCallback((objectName, clickedObject) => {
        console.log('Object clicked:', objectName, clickedObject);
        console.log('isDemoMode:', isDemoMode, 'selectPart available:', !!selectPart);
        
        // Clear previous highlights
        if (highlightManagerRef.current) {
            highlightManagerRef.current.clearAllHighlights();
        }
        
        // Highlight the clicked object
        if (clickedObject && highlightManagerRef.current) {
            const highlighted = highlightManagerRef.current.highlightObject(clickedObject);
            if (highlighted) {
                console.log('Object highlighted:', objectName);
            }
        }
        
        // Try to select part if selectPart function is available
        if (selectPart) {
            try {
                const partInfo = selectPart(objectName, clickedObject);
                console.log('Part selected:', partInfo);
                
                setToast({ 
                    message: `Selected: ${objectName}${isDemoMode && activeDemoConfig ? ' - AI chat opened!' : ''}`, 
                    isVisible: true 
                });
                
                // Auto-hide toast after 3 seconds
                setTimeout(() => {
                    setToast({ message: '', isVisible: false });
                }, 3000);
                
                return;
            } catch (error) {
                console.error('Error selecting part:', error);
            }
        }
        
        // Fallback: Show toast with object name only
        console.log('Fallback: showing toast only');
        setToast({
            message: `Clicked: ${objectName}`,
            isVisible: true
        });
        
        // Auto-hide toast after 2 seconds
        setTimeout(() => {
            setToast({ message: '', isVisible: false });
        }, 2000);
    }, [isDemoMode, selectPart, activeDemoConfig]);

    // Animation loop for highlight updates
    useEffect(() => {
        let animationId;
        
        const animate = () => {
            if (highlightManagerRef.current) {
                highlightManagerRef.current.updateHighlights();
            }
            animationId = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    // Hide toast
    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    // Enhanced screenshot functionality
    const handleScreenshot = useCallback(async () => {
        try {
            if (!screenshotManagerRef.current) {
                screenshotManagerRef.current = new ScreenshotManager(canvasRef);
            }

            // Capture model-only screenshot
            const screenshot = await screenshotManagerRef.current.captureModelOnly({
                width: 1024,
                height: 768,
                backgroundColor: '#000000',
                quality: 0.9
            });
            
            if (!screenshot) {
                throw new Error('Screenshot capture failed');
            }
            
            return screenshot;
        } catch (error) {
            console.error('Screenshot failed:', error);
            
            // Fallback to original method
            const canvas = canvasRef.current?.querySelector('canvas');
            if (!canvas) {
                throw new Error('Canvas not found');
            }

            // Use html2canvas to capture the entire viewer area
            const screenshot = await html2canvas(canvasRef.current, {
                backgroundColor: null,
                allowTaint: true,
                useCORS: true,
                scale: 1
            });
            
            return screenshot.toDataURL('image/png');
        }
    }, []);

    const handleOpenAI = useCallback(() => {
        if (setIsAIOpen) {
            setIsAIOpen(true);
        }
    }, [setIsAIOpen]);

    return (
        <div ref={canvasRef} className="dark-theme" style={{ 
            width: '100vw', 
            height: '100vh', 
            background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%, #000000 100%)', 
            position: 'relative' 
        }}>
            <Canvas 
                camera={{ position: [0, 200, 400], fov: 60 }} 
                shadows
                gl={{ 
                    antialias: true, 
                    alpha: true,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true,
                    failIfMajorPerformanceCaveat: false
                }}
                onCreated={({ gl }) => {
                    // Handle WebGL context loss
                    gl.domElement.addEventListener('webglcontextlost', (event) => {
                        console.warn('WebGL context lost, preventing default behavior');
                        event.preventDefault();
                    }, false);

                    gl.domElement.addEventListener('webglcontextrestored', (event) => {
                        console.log('WebGL context restored');
                        // Context will be automatically restored by Three.js
                    }, false);
                }}
            >
                {/* Enhanced lighting for maximum model visibility */}
                <ambientLight intensity={0.8} color="#ffffff" />
                <directionalLight 
                    position={[10, 10, 5]} 
                    intensity={1.5} 
                    castShadow 
                    color="#ffffff"
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <directionalLight 
                    position={[-10, 10, 5]} 
                    intensity={1.2} 
                    color="#ffffff"
                />
                <directionalLight 
                    position={[0, -10, 5]} 
                    intensity={1.0} 
                    color="#ffffff"
                />
                <directionalLight 
                    position={[0, 0, -10]} 
                    intensity={1.0} 
                    color="#ffffff"
                />
                {/* Multiple point lights for comprehensive illumination */}
                <pointLight 
                    position={[0, 5, 10]} 
                    intensity={1.5} 
                    color="#ffffff"
                    distance={50}
                    decay={1}
                />
                <pointLight 
                    position={[10, 0, 0]} 
                    intensity={1.2} 
                    color="#ffffff"
                    distance={40}
                    decay={1}
                />
                <pointLight 
                    position={[-10, 0, 0]} 
                    intensity={1.2} 
                    color="#ffffff"
                    distance={40}
                    decay={1}
                />
                <pointLight 
                    position={[0, -5, 0]} 
                    intensity={1.0} 
                    color="#ffffff"
                    distance={40}
                    decay={1}
                />
                <Suspense fallback={null}>
                    <InteractiveModelPrimitive 
                        ref={modelRef}
                        url={url} 
                        type={type} 
                        targetSize={modelScale.targetSize}
                        enableAutoScale={modelScale.autoScale}
                        onModelLoad={handleModelLoad}
                        onObjectClick={handleObjectClick}
                    />
                </Suspense>
                <OrbitControls enableDamping dampingFactor={0.1} />
                <Environment preset="night" background={false} />
                <AnimationController updateAnimation={updateAnimation} />
            </Canvas>
            
            <DisassemblyUI 
                currentLayer={currentLayer}
                totalLayers={totalLayers}
                isAnimating={isAnimating}
                onOpenAI={handleOpenAI}
                separationDistance={separationDistance}
                onSeparationDistanceChange={setSeparationDistance}
                highlightColor={highlightColor}
                highlightOpacity={highlightOpacity}
                onHighlightColorChange={setHighlightColor}
                onHighlightOpacityChange={setHighlightOpacity}
                modelScale={modelScale}
            />

            {isAIOpen && closeAI && (
                <Three21Bot
                    isOpen={isAIOpen}
                    onClose={closeAI}
                    modelInfo={modelInfo}
                    demoConfig={activeDemoConfig}
                    selectedPart={selectedPart}
                    onScreenshot={handleScreenshot}
                    sceneAnalysis={screenshotManagerRef.current?.analyzeScene ? 
                        screenshotManagerRef.current.analyzeScene(modelRef.current) : null}
                    autoScreenshot={screenshotManagerRef.current?.getLastScreenshot()?.dataURL}
                />
            )}

            <Toast 
                message={toast.message}
                isVisible={toast.isVisible}
                onHide={hideToast}
            />
        </div>
    );
}
