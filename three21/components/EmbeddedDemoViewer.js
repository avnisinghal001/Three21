'use client';

import { Suspense, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { InteractiveModelPrimitive } from './InteractiveModelPrimitive';
import { AnimationController } from './AnimationController';
import { Toast } from './Toast';
import * as THREE from 'three';

// Optimized Layer Manager Hook with memoized calculations
function useOptimizedLayerManager(modelRef, disassembleDistance = 80) {
    const [currentLayer, setCurrentLayer] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isAssembled, setIsAssembled] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Memoized layer data - only recalculates when distance changes
    const layerData = useMemo(() => {
        console.log('Creating new layer data with distance:', disassembleDistance);
        return {
            layers: [],
            originalPositions: new Map(),
            disassemblyTargets: new Map(),
            initialized: false
        };
    }, [disassembleDistance]);

    const animationRef = useRef({
        isActive: false,
        startTime: 0,
        duration: 200,
        targets: [],
        type: 'none'
    });

    // Memoized initialization function to prevent multiple initializations
    const initializeLayers = useCallback((object) => {
        if (!object || layerData.initialized || isInitialized) {
            console.log('Skipping initialization - already done or invalid object');
            return;
        }

        console.log('Initializing optimized layer system for the first time...');

        // Clear previous data
        layerData.layers.length = 0;
        layerData.originalPositions.clear();
        layerData.disassemblyTargets.clear();

        // Collect all objects in hierarchy
        const allObjects = [];
        const collectObjects = (obj) => {
            if (obj) {
                allObjects.push(obj);
                obj.children.forEach(child => collectObjects(child));
            }
        };
        collectObjects(object);

        console.log(`Found ${allObjects.length} total objects in model`);

        // Group objects by hierarchy depth for better layering
        const getDepth = (obj, root) => {
            let depth = 0;
            let current = obj;
            while (current && current !== root && current.parent) {
                depth++;
                current = current.parent;
            }
            return depth;
        };

        // Create layers based on hierarchy depth
        allObjects.forEach(obj => {
            if (obj === object) return; // Skip root object

            const depth = getDepth(obj, object);
            if (!layerData.layers[depth]) layerData.layers[depth] = [];

            // Only add objects that are actual mesh/geometry containers
            if (obj.type === 'Mesh' || obj.type === 'Group' ||
                obj.type === 'Object3D' || obj.children.length > 0) {
                layerData.layers[depth].push(obj);
            }
        });

        // Remove empty layers
        layerData.layers = layerData.layers.filter(layer => layer && layer.length > 0);

        // Pre-calculate original positions and disassembly targets
        allObjects.forEach(obj => {
            // Store original position
            layerData.originalPositions.set(obj.uuid, {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            });

            // Pre-calculate disassembly target positions
            if (obj !== object && (obj.type === 'Mesh' || obj.type === 'Group' || obj.type === 'Object3D')) {
                try {
                    // Get world position
                    const worldPos = obj.getWorldPosition(new THREE.Vector3());

                    // Calculate bounding box of the entire model
                    const boundingBox = new THREE.Box3();
                    boundingBox.setFromObject(object);
                    const center = boundingBox.getCenter(new THREE.Vector3());

                    // Calculate direction from center to object
                    let direction = new THREE.Vector3()
                        .subVectors(worldPos, center)
                        .normalize();

                    // If direction is zero, use a radial distribution
                    if (direction.length() === 0) {
                        const meshObjects = allObjects.filter(o =>
                            o !== object &&
                            (o.type === 'Mesh' || o.type === 'Group' || o.type === 'Object3D')
                        );
                        const index = meshObjects.indexOf(obj);
                        const angle = (index / Math.max(meshObjects.length, 1)) * Math.PI * 2;
                        direction.set(Math.cos(angle), Math.sin(angle) * 0.5, Math.sin(angle));
                        direction.normalize();
                    }

                    // Convert to local space if object has a parent
                    if (obj.parent && obj.parent !== object) {
                        const parentWorldMatrix = obj.parent.matrixWorld;
                        const parentWorldMatrixInverse = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                        direction.transformDirection(parentWorldMatrixInverse);
                    }

                    // Calculate target position
                    const targetPosition = obj.position.clone()
                        .add(direction.multiplyScalar(disassembleDistance));

                    layerData.disassemblyTargets.set(obj.uuid, targetPosition);
                } catch (error) {
                    console.warn('Failed to calculate disassembly target for object:', obj.name || obj.uuid, error);
                    // Fallback to a random direction
                    const angle = Math.random() * Math.PI * 2;
                    const direction = new THREE.Vector3(
                        Math.cos(angle),
                        Math.random() * 0.5,
                        Math.sin(angle)
                    );
                    const targetPosition = obj.position.clone()
                        .add(direction.multiplyScalar(disassembleDistance));
                    layerData.disassemblyTargets.set(obj.uuid, targetPosition);
                }
            }
        });

        layerData.initialized = true;
        setIsInitialized(true);
        console.log(`✅ Initialized ${layerData.layers.length} layers with ${layerData.disassemblyTargets.size} disassembly targets`);
    }, [layerData, disassembleDistance, isInitialized]);    // Layer-wise disassemble function - disassembles next layer
    const disassembleNextLayer = useCallback(() => {
        if (isAnimating || !layerData.initialized || currentLayer >= layerData.layers.length) {
            console.log('Cannot disassemble next layer:', { 
                isAnimating, 
                initialized: layerData.initialized, 
                currentLayer, 
                totalLayers: layerData.layers.length 
            });
            return;
        }

        const layer = layerData.layers[currentLayer];
        if (!layer || layer.length === 0) {
            console.log('No objects in current layer:', currentLayer);
            return;
        }

        console.log(`🔧 Disassembling layer ${currentLayer} with ${layer.length} objects...`);
        setIsAnimating(true);

        const animationTargets = [];
        
        // Only animate objects in the current layer
        layer.forEach(obj => {
            const targetPosition = layerData.disassemblyTargets.get(obj.uuid);
            if (targetPosition) {
                animationTargets.push({
                    object: obj,
                    startPosition: obj.position.clone(),
                    targetPosition: targetPosition.clone()
                });
            }
        });

        console.log(`🎯 Animating ${animationTargets.length} objects in layer ${currentLayer}`);

        // Start animation
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 250,
            targets: animationTargets,
            type: 'disassemble'
        };

        setCurrentLayer(prev => prev + 1);
        
        // Update assembled state
        if (currentLayer + 1 >= layerData.layers.length) {
            setIsAssembled(false);
        }
    }, [isAnimating, layerData.initialized, layerData.layers, layerData.disassemblyTargets, currentLayer]);

    // Layer-wise reassemble function - reassembles previous layer
    const reassemblePreviousLayer = useCallback(() => {
        if (isAnimating || !layerData.initialized || currentLayer <= 0) {
            console.log('Cannot reassemble previous layer:', { 
                isAnimating, 
                initialized: layerData.initialized, 
                currentLayer 
            });
            return;
        }

        const layerIndex = currentLayer - 1;
        const layer = layerData.layers[layerIndex];
        if (!layer || layer.length === 0) {
            console.log('No objects in layer to reassemble:', layerIndex);
            return;
        }

        console.log(`🔧 Reassembling layer ${layerIndex} with ${layer.length} objects...`);
        setIsAnimating(true);

        const animationTargets = [];

        // Only animate objects in the target layer
        layer.forEach(obj => {
            const originalData = layerData.originalPositions.get(obj.uuid);
            if (originalData) {
                animationTargets.push({
                    object: obj,
                    startPosition: obj.position.clone(),
                    targetPosition: originalData.position.clone()
                });
            }
        });

        console.log(`🎯 Reassembling ${animationTargets.length} objects in layer ${layerIndex}`);

        // Start animation
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 250,
            targets: animationTargets,
            type: 'assemble'
        };

        setCurrentLayer(prev => prev - 1);
        
        // Update assembled state
        if (currentLayer - 1 <= 0) {
            setIsAssembled(true);
        }
    }, [isAnimating, layerData.initialized, layerData.layers, layerData.originalPositions, currentLayer]);

    // Main disassemble function - disassembles all remaining layers
    const disassemble = useCallback(() => {
        if (isAnimating || !layerData.initialized || currentLayer >= layerData.layers.length) {
            return;
        }
        
        // Start disassembling from current layer
        disassembleNextLayer();
    }, [isAnimating, layerData.initialized, layerData.layers.length, currentLayer, disassembleNextLayer]);

    // Main assemble function - reassembles all layers back to assembled state
    const assemble = useCallback(() => {
        if (isAnimating || !layerData.initialized || currentLayer <= 0) {
            return;
        }
        
        // Start reassembling from current layer back to 0
        reassemblePreviousLayer();
    }, [isAnimating, layerData.initialized, currentLayer, reassemblePreviousLayer]);

    // Memoized smooth step function
    const smoothStep = useCallback((t) => {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }, []);

    // Animation update function
    const updateAnimation = useCallback(() => {
        if (!animationRef.current.isActive) return;

        const elapsed = Date.now() - animationRef.current.startTime;
        const progress = Math.min(elapsed / animationRef.current.duration, 1);
        const easedProgress = smoothStep(progress);

        // Update positions
        animationRef.current.targets.forEach(({ object, startPosition, targetPosition }) => {
            object.position.lerpVectors(startPosition, targetPosition, easedProgress);
        });

        // Check if animation is complete
        if (progress >= 1) {
            animationRef.current.isActive = false;
            setIsAnimating(false);
            console.log(`✅ ${animationRef.current.type} animation completed`);
            
            // Auto-continue layer animations for smoother experience
            if (animationRef.current.type === 'disassemble' && currentLayer < layerData.layers.length) {
                // Continue to next layer after a short delay
                setTimeout(() => {
                    if (currentLayer < layerData.layers.length) {
                        disassembleNextLayer();
                    }
                }, 300);
            } else if (animationRef.current.type === 'assemble' && currentLayer > 0) {
                // Continue to previous layer after a short delay
                setTimeout(() => {
                    if (currentLayer > 0) {
                        reassemblePreviousLayer();
                    }
                }, 300);
            }
        }
    }, [smoothStep, currentLayer, layerData.layers.length, disassembleNextLayer, reassemblePreviousLayer]);

    // Keyboard event handlers for layer control
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (isAnimating) return;

            switch (event.key.toLowerCase()) {
                case 'e':
                    disassembleNextLayer();
                    break;
                case 'q':
                    reassemblePreviousLayer();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAnimating, disassembleNextLayer, reassemblePreviousLayer]);

    return {
        initializeLayers,
        assemble,
        disassemble,
        disassembleNextLayer,
        reassemblePreviousLayer,
        isAssembled,
        isAnimating,
        updateAnimation,
        currentLayer,
        totalLayers: layerData.layers.length,
        isInitialized
    };
}

export default function EmbeddedDemoViewer({
    isAssembled,
    onAssembleChange,
    className = ""
}) {
    const modelRef = useRef();
    const canvasRef = useRef();

    // Use optimized layer manager
    const {
        initializeLayers,
        assemble,
        disassemble,
        disassembleNextLayer,
        reassemblePreviousLayer,
        isAssembled: internalIsAssembled,
        isAnimating,
        updateAnimation,
        currentLayer,
        totalLayers,
        isInitialized
    } = useOptimizedLayerManager(modelRef, 80); // Increased distance for better visibility

    // Toast state for object clicking
    const [toast, setToast] = useState({ message: '', isVisible: false });

    // Sync internal state with external prop
    useEffect(() => {
        if (onAssembleChange && internalIsAssembled !== isAssembled) {
            onAssembleChange(internalIsAssembled);
        }
    }, [internalIsAssembled, isAssembled, onAssembleChange]);

    // Handle model load - ensure single initialization
    const handleModelLoad = useCallback((scene) => {
        if (modelRef.current && !isInitialized) {
            console.log('Model loaded, initializing layers...');
            // Small delay to ensure model is fully loaded
            setTimeout(() => {
                initializeLayers(modelRef.current);
            }, 200);
        }
    }, [initializeLayers, isInitialized]);

    // Handle object click
    const handleObjectClick = useCallback((objectName, clickedObject) => {
        console.log('Object clicked:', objectName, clickedObject);

        // Show toast with object name
        setToast({
            message: `Clicked: ${objectName}`,
            isVisible: true
        });
    }, []);

    // Hide toast
    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    return (
        <div className={`embedded-demo-viewer ${className}`}>
            {/* 3D Model Viewer */}
            <div
                ref={canvasRef}
                className="model-canvas-container"
            >
                <Canvas
                    camera={{ position: [305, 450, 300], fov: 60 }}
                    shadows
                    gl={{
                        antialias: true,
                        alpha: true, // Enable transparency
                        powerPreference: "high-performance",
                        preserveDrawingBuffer: true
                    }}
                    style={{ background: 'transparent' }} // Make canvas background transparent
                >
                    {/* Optimized lighting setup */}
                    <ambientLight intensity={0.9} color="#ffffff" />
                    <directionalLight
                        position={[20, 15, 10]}
                        intensity={2.0}
                        color="#ffffff"
                    />
                    <directionalLight
                        position={[-10, 10, 5]}
                        intensity={0.8}
                        color="#ffffff"
                    />
                    <pointLight
                        position={[0, 5, 10]}
                        intensity={0.8}
                        color="#ffffff"
                        distance={100}
                    />

                    <Suspense fallback={null}>
                        <InteractiveModelPrimitive
                            ref={modelRef}
                            url="/demo.fbx"
                            type="fbx"
                            onModelLoad={handleModelLoad}
                            onObjectClick={handleObjectClick}
                            position={[0, -50, 0]}
                        />
                    </Suspense>

                    <OrbitControls
                        enableDamping
                        dampingFactor={0.1}
                        enableZoom={true}
                        enablePan={true}
                        maxDistance={400}
                        minDistance={50}
                    />
                    <Environment preset="studio" background={false} />
                    <AnimationController updateAnimation={updateAnimation} />
                </Canvas>

                {/* Animation indicator */}
                {isAnimating && (
                    <div className="animation-indicator">
                        <div className="animation-spinner">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="31.416"
                                    strokeDashoffset="31.416"
                                >
                                    <animate
                                        attributeName="stroke-dasharray"
                                        dur="1s"
                                        values="0 31.416;15.708 15.708;0 31.416;0 31.416"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="stroke-dashoffset"
                                        dur="1s"
                                        values="0;-15.708;-31.416;-31.416"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Buttons - Absolute Positioned */}
            <div className="demo-controls">
                <button
                    className={`btn-demo ${internalIsAssembled ? 'btn-demo-active' : 'btn-demo-secondary'}`}
                    onClick={assemble}
                    disabled={internalIsAssembled || isAnimating}
                >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="btn-text">Assemble</span>
                </button>
                <button
                    className={`btn-demo ${!internalIsAssembled ? 'btn-demo-active' : 'btn-demo-secondary'}`}
                    onClick={disassemble}
                    disabled={!internalIsAssembled || isAnimating}
                >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    <span className="btn-text">Disassemble</span>
                </button>
            </div>

            {/* Layer Progress Indicator - Absolute Positioned */}
            {/* {totalLayers > 0 && (
                <div className="layer-progress">
                    <div className="progress-info">
                        <span className="progress-text">Layer {currentLayer} of {totalLayers}</span>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${(currentLayer / totalLayers) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )} */}

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onHide={hideToast}
            />

            <style jsx>{`
                .embedded-demo-viewer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border-radius: var(--radius);
                    overflow: hidden;
                }

                .model-canvas-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border-radius: var(--radius);
                    border: 1px solid var(--border);
                }

                .animation-indicator {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    z-index: 100;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    padding: 0.5rem;
                    backdrop-filter: var(--backdrop-blur);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .animation-spinner {
                    color: var(--primary-accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Demo Control Buttons - Absolute Positioned with Glass Blur */
                .demo-controls {
                    position: absolute;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    min-width: 280px;
                }

                .btn-demo {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    height: 2.75rem;
                    padding: 0 1rem;
                    border: 1px solid var(--border);
                    background: var(--card);
                    color: var(--foreground);
                    border-radius: var(--radius);
                    font-size: 0.875rem;
                    font-weight: 500;
                    font-family: inherit;
                    text-decoration: none;
                    outline: none;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    user-select: none;
                    white-space: nowrap;
                    width: 100%;
                }

                .btn-demo:focus-visible {
                    outline: 2px solid var(--ring);
                    outline-offset: 2px;
                }

                .btn-demo::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    transition: left 0.5s ease;
                    z-index: 1;
                }

                .btn-demo:hover:not(:disabled) {
                    background: var(--accent);
                    color: var(--accent-foreground);
                    border-color: var(--primary-accent);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
                }

                .btn-demo:hover:not(:disabled)::before {
                    left: 100%;
                }

                .btn-demo-active {
                    background: var(--gradient-primary);
                    color: var(--primary-foreground);
                    border-color: var(--primary-accent);
                    box-shadow: 0 4px 14px var(--primary-shadow);
                    transform: translateY(-1px);
                }

                .btn-demo-active:hover:not(:disabled) {
                    background: linear-gradient(135deg, var(--primary-hover) 0%, #1d4ed8 100%);
                    box-shadow: 0 6px 20px var(--primary-shadow);
                    transform: translateY(-2px);
                }

                .btn-demo-secondary {
                    background: var(--secondary);
                    color: var(--secondary-foreground);
                    border-color: var(--border);
                }

                .btn-demo-secondary:hover:not(:disabled) {
                    background: var(--primary-accent);
                    color: var(--primary-foreground);
                    border-color: var(--primary-accent);
                    box-shadow: 0 4px 14px var(--primary-shadow);
                }

                .btn-demo:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background: var(--muted);
                    color: var(--muted-foreground);
                    border-color: var(--border);
                    transform: none;
                    box-shadow: none;
                    pointer-events: none;
                }

                .btn-demo:disabled::before {
                    display: none;
                }

                .btn-icon {
                    width: 1rem;
                    height: 1rem;
                    stroke-width: 2;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 2;
                }

                .btn-text {
                    font-weight: 600;
                    letter-spacing: 0.025em;
                    position: relative;
                    z-index: 2;
                }

                /* Layer Progress Indicator - Absolute Positioned with Glass Blur */
                .layer-progress {
                    position: absolute;
                    top: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    min-width: 200px;
                }

                .progress-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .progress-text {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--muted-foreground);
                    text-align: center;
                }

                .progress-bar {
                    height: 4px;
                    background: var(--muted);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--gradient-primary);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                /* Tablet Responsive Design */
                @media (max-width: 1024px) {
                    .demo-controls {
                        min-width: 260px;
                        padding: 0.875rem;
                        gap: 0.875rem;
                        bottom: 1rem;
                    }

                    .btn-demo {
                        height: 2.5rem;
                        font-size: 0.875rem;
                        gap: 0.5rem;
                    }

                    .btn-icon {
                        width: 1rem;
                        height: 1rem;
                    }

                    .layer-progress {
                        top: 1rem;
                        min-width: 180px;
                        padding: 0.625rem 0.875rem;
                    }
                }

                /* Mobile Responsive Design */
                @media (max-width: 768px) {
                    .demo-controls {
                        bottom: 1rem;
                        left: 1rem;
                        right: 1rem;
                        transform: none;
                        min-width: auto;
                        max-width: none;
                    }

                    .btn-demo {
                        height: 2.75rem;
                        font-size: 0.9rem;
                        gap: 0.6rem;
                    }

                    .btn-icon {
                        width: 1.1rem;
                        height: 1.1rem;
                    }

                    .btn-text {
                        font-size: 0.9rem;
                        font-weight: 600;
                    }

                    .layer-progress {
                        top: 1rem;
                        left: 1rem;
                        right: 1rem;
                        transform: none;
                        min-width: auto;
                    }

                    .progress-text {
                        font-size: 0.8rem;
                    }
                }

                /* Small Mobile Responsive Design */
                @media (max-width: 480px) {
                    .demo-controls {
                        gap: 0.75rem;
                        padding: 0.875rem;
                        bottom: 0.75rem;
                        left: 0.75rem;
                        right: 0.75rem;
                    }

                    .btn-demo {
                        height: 2.5rem;
                        font-size: 0.8rem;
                        gap: 0.5rem;
                    }

                    .btn-icon {
                        width: 1rem;
                        height: 1rem;
                    }

                    .btn-text {
                        font-size: 0.8rem;
                        font-weight: 700;
                    }

                    .layer-progress {
                        top: 0.75rem;
                        left: 0.75rem;
                        right: 0.75rem;
                        padding: 0.625rem;
                    }

                    .progress-text {
                        font-size: 0.75rem;
                    }
                }

                /* Ensure canvas takes full size with transparency */
                .embedded-demo-viewer canvas {
                    width: 100% !important;
                    height: 100% !important;
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}

