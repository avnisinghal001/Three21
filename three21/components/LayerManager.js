import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

export function useLayerManager(modelRef, separationDistance = 0.2) {
    const [currentLayer, setCurrentLayer] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Storage for layer hierarchy and original positions
    const layersRef = useRef([]);
    const originalPositionsRef = useRef(new Map());
    const positionStackRef = useRef([]);
    const animationRef = useRef({
        isActive: false,
        startTime: 0,
        duration: 500, // 1 second
        targets: [],
        type: 'none' // 'disassemble', 'reassemble'
    });

    const disassembleDistance = separationDistance;

    // Initialize layers using BFS - improved to catch all objects
    const initializeLayers = useCallback((object) => {
        if (!object) return;

        const layers = [];
        const visited = new Set();
        const queue = [{ obj: object, depth: 0 }];
        
        // First, collect ALL objects in the hierarchy
        const allObjects = [];
        const collectObjects = (obj) => {
            allObjects.push(obj);
            obj.children.forEach(child => collectObjects(child));
        };
        collectObjects(object);

        // Group objects by their distance from root (better layering)
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
            if (!layers[depth]) layers[depth] = [];
            
            // Only add objects that are actual mesh/geometry containers
            if (obj.type === 'Mesh' || obj.type === 'Group' || 
                obj.type === 'Object3D' || obj.children.length > 0) {
                layers[depth].push(obj);
            }
        });

        // Remove empty layers and ensure we have content
        layersRef.current = layers.filter(layer => layer && layer.length > 0);
        
        // Store original positions for all objects
        const originalPositions = new Map();
        allObjects.forEach(obj => {
            originalPositions.set(obj.uuid, {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            });
        });
        originalPositionsRef.current = originalPositions;

        console.log(`Initialized ${layersRef.current.length} layers with objects:`, 
                   layersRef.current.map(layer => layer.length));
    }, []);

    // Calculate group center for a set of objects
    const calculateGroupCenter = useCallback((objects, useWorldPosition = false) => {
        if (objects.length === 0) return new THREE.Vector3();
        
        const center = new THREE.Vector3();
        objects.forEach(obj => {
            const pos = useWorldPosition ? obj.getWorldPosition(new THREE.Vector3()) : obj.position;
            center.add(pos);
        });
        center.divideScalar(objects.length);
        return center;
    }, []);

    // Group objects by their parent
    const groupByParent = useCallback((objects) => {
        const groups = new Map();
        const orphans = [];

        objects.forEach(obj => {
            if (obj.parent) {
                const parentId = obj.parent.uuid;
                if (!groups.has(parentId)) {
                    groups.set(parentId, []);
                }
                groups.get(parentId).push(obj);
            } else {
                orphans.push(obj);
            }
        });

        return { groups: Array.from(groups.values()), orphans };
    }, []);

    // Improved disassembly logic - Iron Man style
    const disassembleNextLayer = useCallback(() => {
        if (currentLayer >= layersRef.current.length || isAnimating) return;

        const layer = layersRef.current[currentLayer];
        if (!layer || layer.length === 0) return;

        setIsAnimating(true);
        console.log(`Disassembling layer ${currentLayer} with ${layer.length} objects`);
        
        // Group objects by their immediate parent
        const parentGroups = new Map();
        const rootObjects = [];

        layer.forEach(obj => {
            if (obj.parent && obj.parent !== modelRef.current) {
                const parentId = obj.parent.uuid;
                if (!parentGroups.has(parentId)) {
                    parentGroups.set(parentId, {
                        parent: obj.parent,
                        children: []
                    });
                }
                parentGroups.get(parentId).children.push(obj);
            } else {
                rootObjects.push(obj);
            }
        });

        const animationTargets = [];

        // Process each parent group separately
        parentGroups.forEach(({ parent, children }) => {
            // Calculate the bounding box center of the parent
            const parentBox = new THREE.Box3();
            parentBox.setFromObject(parent);
            const parentCenter = parentBox.getCenter(new THREE.Vector3());

            children.forEach(obj => {
                // Get object's world position
                const objWorldPos = obj.getWorldPosition(new THREE.Vector3());
                
                // Calculate direction from parent center to object center
                const direction = new THREE.Vector3()
                    .subVectors(objWorldPos, parentCenter)
                    .normalize();

                // If direction is zero (object at parent center), use a default direction
                if (direction.length() === 0) {
                    // Use object's local position relative to parent as fallback
                    direction.copy(obj.position).normalize();
                    
                    // If still zero, use a random outward direction
                    if (direction.length() === 0) {
                        const angle = Math.random() * Math.PI * 2;
                        const inclination = Math.random() * Math.PI;
                        direction.set(
                            Math.sin(inclination) * Math.cos(angle),
                            Math.cos(inclination),
                            Math.sin(inclination) * Math.sin(angle)
                        );
                    }
                }

                // Convert world direction to local direction
                const parentWorldMatrix = parent.matrixWorld;
                const parentWorldMatrixInverse = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                direction.transformDirection(parentWorldMatrixInverse);

                // Calculate target position
                const targetPosition = obj.position.clone()
                    .add(direction.multiplyScalar(disassembleDistance));

                animationTargets.push({
                    object: obj,
                    startPosition: obj.position.clone(),
                    targetPosition: targetPosition
                });
            });
        });

        // Handle root-level objects (no parent grouping)
        if (rootObjects.length > 0) {
            // Calculate center of all root objects
            const rootCenter = new THREE.Vector3();
            rootObjects.forEach(obj => {
                rootCenter.add(obj.getWorldPosition(new THREE.Vector3()));
            });
            rootCenter.divideScalar(rootObjects.length);

            rootObjects.forEach(obj => {
                const objWorldPos = obj.getWorldPosition(new THREE.Vector3());
                const direction = new THREE.Vector3()
                    .subVectors(objWorldPos, rootCenter)
                    .normalize();

                if (direction.length() === 0) {
                    // Radial distribution for objects at center
                    const angle = (rootObjects.indexOf(obj) / rootObjects.length) * Math.PI * 2;
                    direction.set(Math.cos(angle), 0, Math.sin(angle));
                }

                const targetPosition = obj.position.clone()
                    .add(direction.multiplyScalar(disassembleDistance));

                animationTargets.push({
                    object: obj,
                    startPosition: obj.position.clone(),
                    targetPosition: targetPosition
                });
            });
        }

        // Save current positions to stack for reassembly
        const layerPositions = new Map();
        layer.forEach(obj => {
            layerPositions.set(obj.uuid, obj.position.clone());
        });
        positionStackRef.current.push(layerPositions);

        // Start animation
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 500, // Slightly longer for smoother motion
            targets: animationTargets,
            type: 'disassemble'
        };

        setCurrentLayer(prev => prev + 1);
    }, [currentLayer, isAnimating, modelRef]);

    // Improved reassembly function
    const reassemblePreviousLayer = useCallback(() => {
        if (currentLayer <= 0 || isAnimating || positionStackRef.current.length === 0) return;

        setIsAnimating(true);
        console.log(`Reassembling layer ${currentLayer - 1}`);
        
        // Get saved positions from stack
        const layerPositions = positionStackRef.current.pop();
        const animationTargets = [];

        layerPositions.forEach((savedPosition, uuid) => {
            // Find object in the entire model hierarchy
            let foundObject = null;
            modelRef.current?.traverse((obj) => {
                if (obj.uuid === uuid) {
                    foundObject = obj;
                }
            });

            if (foundObject) {
                animationTargets.push({
                    object: foundObject,
                    startPosition: foundObject.position.clone(),
                    targetPosition: savedPosition
                });
            }
        });

        // Start animation
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 500, // Slightly longer for smooth reassembly
            targets: animationTargets,
            type: 'reassemble'
        };

        setCurrentLayer(prev => prev - 1);
    }, [currentLayer, isAnimating, modelRef]);

    // Improved smooth step easing function with better curve
    const smoothStep = useCallback((t) => {
        // Smoothstep with more dramatic easing for Iron Man effect
        return t * t * t * (t * (t * 6 - 15) + 10);
    }, []);

    // Animation update function (to be called from useFrame)
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
        }
    }, [smoothStep]);

    // Keyboard event handlers
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
    }, [isAnimating, currentLayer, disassembleNextLayer, reassemblePreviousLayer]);

    return {
        initializeLayers,
        currentLayer,
        isAnimating,
        totalLayers: layersRef.current.length,
        updateAnimation
    };
}
