import { Suspense, useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { InteractiveModelPrimitive } from './InteractiveModelPrimitive';
import { DisassemblyUI } from './DisassemblyUI';
import { useLayerManager } from './LayerManager';
import { AnimationController } from './AnimationController';
import Three21Bot from './Three21Bot';
import { useModelInfo } from './ModelInfoContext';
import { Toast } from './Toast';
import { HighlightManager } from './HighlightManager';
import { ScreenshotManager } from './ScreenshotManager';
import { DEMO_CONFIG } from '@/pages/model';

import html2canvas from 'html2canvas';

export default forwardRef(function AnyModelViewer({ url, type, isDemoMode = false, demoConfig = null, onModelLoad }, ref) {
    const modelRef = useRef();
    const canvasRef = useRef();
    const highlightManagerRef = useRef(null);
    const screenshotManagerRef = useRef(null);
    const orbitControlsRef = useRef();
    
    // Separation distance state for disassembly
    const [separationDistance, setSeparationDistance] = useState(80);  // Better demo value
    
    // Highlight settings state
    const [highlightColor, setHighlightColor] = useState('#00ffff');
    const [highlightOpacity, setHighlightOpacity] = useState(0.7);
    
    // Auto-screenshot state
    const [autoScreenshotTaken, setAutoScreenshotTaken] = useState(false);
    
    // Model scale state - user controllable
    const [modelScale, setModelScale] = useState({
        originalSize: null,
        currentScale: 1,
        boundingBox: null,
        userScale: 1  // User-controlled scale multiplier
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

    // Expose functions to parent via ref
    useImperativeHandle(ref, () => ({
        expandModel: () => {
            console.log('🎯 AnyModelViewer: Expanding model');
            if (currentLayer < totalLayers - 1) {
                updateAnimation(currentLayer + 1);
                setToast({ message: 'Model expanded', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        assembleModel: () => {
            console.log('🎯 AnyModelViewer: Assembling model');
            if (currentLayer > 0) {
                updateAnimation(0);
                setToast({ message: 'Model assembled', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        rotateModel: () => {
            console.log('🎯 AnyModelViewer: Rotating model');
            if (orbitControlsRef.current) {
                // Rotate the model by updating the azimuth angle
                orbitControlsRef.current.setAzimuthalAngle(orbitControlsRef.current.getAzimuthalAngle() + Math.PI / 4);
                orbitControlsRef.current.update();
                setToast({ message: 'Model rotated', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        zoomIn: () => {
            console.log('🎯 AnyModelViewer: Zooming in');
            if (orbitControlsRef.current) {
                const camera = orbitControlsRef.current.object;
                const distance = orbitControlsRef.current.getDistance();
                orbitControlsRef.current.dollyIn(0.8);
                orbitControlsRef.current.update();
                setToast({ message: 'Zoomed in', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        zoomOut: () => {
            console.log('🎯 AnyModelViewer: Zooming out');
            if (orbitControlsRef.current) {
                orbitControlsRef.current.dollyOut(1.25);
                orbitControlsRef.current.update();
                setToast({ message: 'Zoomed out', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        resetView: () => {
            console.log('🎯 AnyModelViewer: Resetting view');
            if (orbitControlsRef.current) {
                orbitControlsRef.current.reset();
                setToast({ message: 'View reset', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        },
        takeScreenshot: () => {
            console.log('🎯 AnyModelViewer: Taking screenshot');
            takeScreenshot();
        }
    }), [currentLayer, totalLayers, updateAnimation]);

    // AI Voice Command Event Listeners
    useEffect(() => {
        const handleModelExpand = (event) => {
            console.log('📢 AnyModelViewer: Received expand event');
            if (currentLayer < totalLayers - 1) {
                updateAnimation(currentLayer + 1);
                setToast({ message: 'Model expanded via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleModelAssemble = (event) => {
            console.log('📢 AnyModelViewer: Received assemble event');
            if (currentLayer > 0) {
                updateAnimation(0);
                setToast({ message: 'Model assembled via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleRotateModel = (event) => {
            console.log('📢 AnyModelViewer: Received rotate event');
            if (orbitControlsRef.current) {
                const direction = event.detail?.direction || 'right';
                const angle = direction === 'left' ? -Math.PI / 4 : Math.PI / 4;
                orbitControlsRef.current.setAzimuthalAngle(orbitControlsRef.current.getAzimuthalAngle() + angle);
                orbitControlsRef.current.update();
                setToast({ message: `Model rotated ${direction}`, isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleZoomIn = (event) => {
            console.log('📢 AnyModelViewer: Received zoom in event');
            if (orbitControlsRef.current) {
                orbitControlsRef.current.dollyIn(0.8);
                orbitControlsRef.current.update();
                setToast({ message: 'Zoomed in via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleZoomOut = (event) => {
            console.log('📢 AnyModelViewer: Received zoom out event');
            if (orbitControlsRef.current) {
                orbitControlsRef.current.dollyOut(1.25);
                orbitControlsRef.current.update();
                setToast({ message: 'Zoomed out via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleResetView = (event) => {
            console.log('📢 AnyModelViewer: Received reset view event');
            if (orbitControlsRef.current) {
                orbitControlsRef.current.reset();
                setToast({ message: 'View reset via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleTakeScreenshot = (event) => {
            console.log('📢 AnyModelViewer: Received screenshot event');
            takeScreenshot();
            setToast({ message: 'Screenshot taken via voice', isVisible: true });
            setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
        };

        const handleToggleChat = (event) => {
            console.log('📢 AnyModelViewer: Received toggle chat event');
            if (setIsAIOpen) {
                setIsAIOpen(!isAIOpen);
                setToast({ message: isAIOpen ? 'Chat closed' : 'Chat opened', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleOpenChat = (event) => {
            console.log('📢 AnyModelViewer: Received open chat event');
            if (setIsAIOpen) {
                setIsAIOpen(true);
                setToast({ message: 'Chat opened via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        const handleCloseChat = (event) => {
            console.log('📢 AnyModelViewer: Received close chat event');
            if (setIsAIOpen) {
                setIsAIOpen(false);
                setToast({ message: 'Chat closed via voice', isVisible: true });
                setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
            }
        };

        // Listen for AI voice command events
        window.addEventListener('modelExpand', handleModelExpand);
        window.addEventListener('modelAssemble', handleModelAssemble);
        window.addEventListener('rotateModel', handleRotateModel);
        window.addEventListener('zoomIn', handleZoomIn);
        window.addEventListener('zoomOut', handleZoomOut);
        window.addEventListener('resetView', handleResetView);
        window.addEventListener('takeScreenshot', handleTakeScreenshot);
        window.addEventListener('toggleChat', handleToggleChat);
        window.addEventListener('openChat', handleOpenChat);
        window.addEventListener('closeChat', handleCloseChat);

        // Cleanup event listeners
        return () => {
            window.removeEventListener('modelExpand', handleModelExpand);
            window.removeEventListener('modelAssemble', handleModelAssemble);
            window.removeEventListener('rotateModel', handleRotateModel);
            window.removeEventListener('zoomIn', handleZoomIn);
            window.removeEventListener('zoomOut', handleZoomOut);
            window.removeEventListener('resetView', handleResetView);
            window.removeEventListener('takeScreenshot', handleTakeScreenshot);
            window.removeEventListener('toggleChat', handleToggleChat);
            window.removeEventListener('openChat', handleOpenChat);
            window.removeEventListener('closeChat', handleCloseChat);
        };
    }, [currentLayer, totalLayers, updateAnimation, isAIOpen, setIsAIOpen]);
    
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
        
        // Store original scale information without normalization
        if (scaleInfo) {
            setModelScale(prev => ({
                originalSize: scaleInfo.originalSize,
                currentScale: 1,  // Keep original scale
                boundingBox: scaleInfo.boundingBox,
                userScale: prev.userScale  // Preserve user's scale setting
            }));
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

        // Notify parent component that model is loaded
        if (onModelLoad) {
            onModelLoad(scene, scaleInfo);
        }
    }, [initializeLayers, isDemoMode, extractModelStructure, autoScreenshotTaken, modelInfo, setIsAIOpen, onModelLoad]);

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

    const handleScaleChange = useCallback((newScale) => {
        setModelScale(prev => ({
            ...prev,
            userScale: newScale
        }));
        
        // Apply scale to model if it's loaded
        if (modelRef.current) {
            modelRef.current.scale.set(newScale, newScale, newScale);
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
                    distance={100}
                    decay={1}
                />
                <pointLight 
                    position={[-10, 0, 0]} 
                    intensity={1.2} 
                    color="#ffffff"
                    distance={100}
                    decay={1}
                />
                <pointLight 
                    position={[0, -5, 0]} 
                    intensity={1.0} 
                    color="#ffffff"
                    distance={80}
                    decay={1}
                />
                <Suspense fallback={null}>
                    <InteractiveModelPrimitive 
                        ref={modelRef}
                        url={url} 
                        type={type} 
                        userScale={modelScale.userScale}
                        enableAutoScale={false}
                        onModelLoad={handleModelLoad}
                        onObjectClick={handleObjectClick}
                    />
                </Suspense>
                <OrbitControls ref={orbitControlsRef} enableDamping dampingFactor={0.1} />
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
                onScaleChange={handleScaleChange}
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
                enableTTS={toast.message.includes('via voice')} // Enable TTS for voice commands
            />
        </div>
    );
});
