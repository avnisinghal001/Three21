import { useRef, useEffect, forwardRef, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

export const InteractiveModelPrimitive = forwardRef(({ url, type, onModelLoad, onObjectClick, userScale = 1, enableAutoScale = false }, ref) => {
    // Load the model
    const object = useLoader(type === 'fbx' ? FBXLoader : GLTFLoader, url);
    const scene = type === 'fbx' ? object : object.scene;
    const [modelInfo, setModelInfo] = useState({ originalSize: null, scale: 1, boundingBox: null });
    
    // Calculate model information without normalization
    const calculateModelScale = (scene) => {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        const modelInfo = {
            originalSize: {
                width: size.x,
                height: size.y,
                depth: size.z,
                maxDimension: maxDimension
            },
            boundingBox: {
                min: box.min.toArray(),
                max: box.max.toArray(),
                center: box.getCenter(new THREE.Vector3()).toArray(),
                size: size.toArray()
            },
            scale: 1  // Keep original scale, let user control it
        };
        
        console.log('Model Info (Original Scale):', {
            originalSize: `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
            maxDimension: maxDimension.toFixed(2),
            userScale: userScale,
            autoScaleDisabled: !enableAutoScale
        });
        
        return modelInfo;
    };
    
    // Simple lighting setup to make model visible
    useEffect(() => {
        if (scene) {
            try {
                // Calculate scale first
                const scaleInfo = calculateModelScale(scene);
                setModelInfo(scaleInfo);
                
                // Apply user-controlled scale (no auto-normalization)
                scene.scale.set(userScale, userScale, userScale);
                
                // Center the model
                const box = new THREE.Box3().setFromObject(scene);
                const center = box.getCenter(new THREE.Vector3());
                scene.position.copy(center).multiplyScalar(-1);
                
                scene.traverse((child) => {
                    if (child.isMesh) {
                        // Handle material (could be single material or array of materials)
                        const handleMaterial = (material) => {
                            if (!material) {
                                console.warn('Found mesh with null/undefined material, creating default');
                                return new THREE.MeshBasicMaterial({ color: 0x808080 });
                            }
                            
                            // Check if it's a proper Three.js material
                            if (material.isMaterial && typeof material.clone === 'function') {
                                try {
                                    return material.clone();
                                } catch (cloneError) {
                                    console.warn('Material clone failed, creating fallback:', cloneError);
                                    return new THREE.MeshBasicMaterial({ 
                                        color: material.color || 0x808080,
                                        transparent: material.transparent || false,
                                        opacity: material.opacity !== undefined ? material.opacity : 1
                                    });
                                }
                            } else {
                                // If material doesn't have clone method or isn't a proper Material, create a basic copy
                                console.warn('Material lacks clone method, creating fallback material');
                                return new THREE.MeshBasicMaterial({ 
                                    color: (material && material.color) || 0x808080,
                                    transparent: (material && material.transparent) || false,
                                    opacity: (material && material.opacity !== undefined) ? material.opacity : 1
                                });
                            }
                        };

                        try {
                            if (child.material) {
                                // Store original material for reference
                                if (!child.userData.originalMaterial) {
                                    if (Array.isArray(child.material)) {
                                        child.userData.originalMaterial = child.material.map(handleMaterial);
                                    } else {
                                        child.userData.originalMaterial = handleMaterial(child.material);
                                    }
                                }
                                
                                // Keep the original material completely unchanged
                                if (Array.isArray(child.userData.originalMaterial)) {
                                    child.material = child.userData.originalMaterial.map(mat => {
                                        if (mat && typeof mat.clone === 'function') {
                                            try {
                                                return mat.clone();
                                            } catch (e) {
                                                console.warn('Failed to clone material in array:', e);
                                                return mat;
                                            }
                                        }
                                        return mat;
                                    });
                                } else if (child.userData.originalMaterial && typeof child.userData.originalMaterial.clone === 'function') {
                                    try {
                                        child.material = child.userData.originalMaterial.clone();
                                    } catch (e) {
                                        console.warn('Failed to clone single material:', e);
                                        child.material = child.userData.originalMaterial;
                                    }
                                }
                            } else {
                                // Create a default material if none exists
                                const defaultMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
                                child.material = defaultMaterial;
                                child.userData.originalMaterial = defaultMaterial;
                                console.warn('Mesh had no material, assigned default gray material');
                            }
                        } catch (materialError) {
                            console.error('Error handling material for mesh:', materialError);
                            // Fallback: assign a basic material
                            const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red to indicate error
                            child.material = fallbackMaterial;
                            child.userData.originalMaterial = fallbackMaterial;
                        }
                        
                        // No additional effects - just preserve original material
                    }
                });
            } catch (traverseError) {
                console.error('Error traversing scene:', traverseError);
            }
        }
    }, [scene]);
    
    // No dynamic lighting effects needed - using global scene lighting only
    // Model will be visible through the global lighting setup in AnyModelViewer
    
    // Notify parent when model is loaded with scale information
    useEffect(() => {
        if (scene && onModelLoad) {
            onModelLoad(scene, modelInfo);
        }
    }, [scene, onModelLoad, modelInfo]);

    // Update model scale when userScale prop changes
    useEffect(() => {
        if (scene) {
            scene.scale.set(userScale, userScale, userScale);
            console.log('Applied user scale:', userScale);
        }
    }, [scene, userScale]);

    // Cleanup function to dispose of materials and geometries
    useEffect(() => {
        return () => {
            if (scene) {
                try {
                    scene.traverse((child) => {
                        if (child.isMesh) {
                            // Dispose geometry
                            if (child.geometry) {
                                child.geometry.dispose();
                            }
                            
                            // Dispose materials
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        if (mat && typeof mat.dispose === 'function') {
                                            mat.dispose();
                                        }
                                    });
                                } else if (typeof child.material.dispose === 'function') {
                                    child.material.dispose();
                                }
                            }
                            
                            // Dispose userData materials too
                            if (child.userData.originalMaterial) {
                                if (Array.isArray(child.userData.originalMaterial)) {
                                    child.userData.originalMaterial.forEach(mat => {
                                        if (mat && typeof mat.dispose === 'function') {
                                            mat.dispose();
                                        }
                                    });
                                } else if (typeof child.userData.originalMaterial.dispose === 'function') {
                                    child.userData.originalMaterial.dispose();
                                }
                            }
                        }
                    });
                } catch (disposeError) {
                    console.warn('Error during cleanup:', disposeError);
                }
            }
        };
    }, [scene]);
    
    // Handle click events
    const handleClick = (event) => {
        console.log('InteractiveModelPrimitive: Click event triggered', event);
        event.stopPropagation();
        const clickedObject = event.object;
        
        console.log('Clicked object:', clickedObject);
        console.log('Object name:', clickedObject?.name);
        console.log('Object type:', clickedObject?.type);
        console.log('Object userData:', clickedObject?.userData);
        
        if (clickedObject && onObjectClick) {
            // Get the name of the clicked object or generate one
            const objectName = clickedObject.name || 
                              clickedObject.userData.name || 
                              clickedObject.type || 
                              `${clickedObject.type}_${clickedObject.id}`;
            
            console.log('Calling onObjectClick with:', objectName, clickedObject);
            onObjectClick(objectName, clickedObject);
        } else {
            console.log('No clickedObject or onObjectClick callback');
        }
    };
    
    return <primitive ref={ref} object={scene} onClick={handleClick} />;
});

InteractiveModelPrimitive.displayName = 'InteractiveModelPrimitive';
