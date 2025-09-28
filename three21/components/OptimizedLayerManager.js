import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';

export function useOptimizedLayerManager(modelRef) {
    const [currentLayer, setCurrentLayer] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [disassembleDistance, setDisassembleDistance] = useState(0.3);
    const [modelInitialized, setModelInitialized] = useState(false);
    
    // Refs for persistent data
    const layersRef = useRef([]);
    const originalPositionsRef = useRef(new Map());
    const positionStackRef = useRef([]);
    const nodeMapRef = useRef(new Map());
    const parentGroupsRef = useRef(new Map());
    
    const animationRef = useRef({
        isActive: false,
        startTime: 0,
        duration: 1000,
        targets: [],
        type: 'none'
    });

    // Memoized node collection and hierarchy analysis
    const nodeHierarchy = useMemo(() => {
        if (!modelRef.current || !modelInitialized) return { allNodes: [], layerGroups: [], nodeMap: new Map() };
        
        console.log('Computing node hierarchy...');
        
        const allNodes = [];
        const nodeMap = new Map();
        const layerGroups = [];
        
        // Collect all nodes in the hierarchy
        const collectNodes = (obj, depth = 0) => {
            if (!obj) return;
            
            allNodes.push(obj);
            nodeMap.set(obj.uuid, {
                object: obj,
                depth,
                parent: obj.parent,
                children: [...obj.children],
                originalPosition: obj.position.clone(),
                originalRotation: obj.rotation.clone(),
                originalScale: obj.scale.clone()
            });
            
            obj.children.forEach(child => collectNodes(child, depth + 1));
        };
        
        collectNodes(modelRef.current);
        
        // Group nodes by depth for layered disassembly
        const depthGroups = new Map();
        allNodes.forEach(node => {
            const nodeData = nodeMap.get(node.uuid);
            if (nodeData && nodeData.depth > 0) { // Skip root object
                if (!depthGroups.has(nodeData.depth)) {
                    depthGroups.set(nodeData.depth, []);
                }
                
                // Only include meshes and meaningful groups
                if (node.type === 'Mesh' || 
                    node.type === 'Group' || 
                    (node.type === 'Object3D' && node.children.length > 0)) {
                    depthGroups.get(nodeData.depth).push(node);
                }
            }
        });
        
        // Convert to array and filter empty layers
        const layers = Array.from(depthGroups.values()).filter(layer => layer.length > 0);
        
        console.log(`Found ${allNodes.length} nodes in ${layers.length} layers`);
        
        return { allNodes, layerGroups: layers, nodeMap };
    }, [modelRef.current, modelInitialized, disassembleDistance]);

    // Memoized parent groupings for optimized disassembly
    const parentGroupings = useMemo(() => {
        if (!nodeHierarchy.layerGroups.length) return new Map();
        
        console.log('Computing parent groupings...');
        
        const groupings = new Map();
        
        nodeHierarchy.layerGroups.forEach((layer, layerIndex) => {
            const layerGroupings = new Map();
            const rootObjects = [];
            
            layer.forEach(obj => {
                if (obj.parent && obj.parent !== modelRef.current) {
                    const parentId = obj.parent.uuid;
                    if (!layerGroupings.has(parentId)) {
                        layerGroupings.set(parentId, {
                            parent: obj.parent,
                            children: []
                        });
                    }
                    layerGroupings.get(parentId).children.push(obj);
                } else {
                    rootObjects.push(obj);
                }
            });
            
            groupings.set(layerIndex, { parentGroups: layerGroupings, rootObjects });
        });
        
        return groupings;
    }, [nodeHierarchy.layerGroups, modelRef.current]);

    // Memoized disassembly targets calculation
    const disassemblyTargets = useMemo(() => {
        if (!nodeHierarchy.layerGroups.length || !parentGroupings.size) return new Map();
        
        console.log('Computing disassembly targets...');
        
        const targets = new Map();
        
        parentGroupings.forEach((grouping, layerIndex) => {
            const layerTargets = [];
            
            // Process parent groups
            grouping.parentGroups.forEach(({ parent, children }) => {
                const parentBox = new THREE.Box3();
                parentBox.setFromObject(parent);
                const parentCenter = parentBox.getCenter(new THREE.Vector3());
                
                children.forEach(obj => {
                    const objWorldPos = obj.getWorldPosition(new THREE.Vector3());
                    let direction = new THREE.Vector3()
                        .subVectors(objWorldPos, parentCenter)
                        .normalize();
                    
                    // Fallback direction if at center
                    if (direction.length() === 0) {
                        direction.copy(obj.position).normalize();
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
                    
                    // Transform to local direction
                    const parentWorldMatrix = parent.matrixWorld;
                    const parentWorldMatrixInverse = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                    direction.transformDirection(parentWorldMatrixInverse);
                    
                    const targetPosition = obj.position.clone()
                        .add(direction.multiplyScalar(disassembleDistance));
                    
                    layerTargets.push({
                        object: obj,
                        originalPosition: obj.position.clone(),
                        targetPosition
                    });
                });
            });
            
            // Process root objects
            if (grouping.rootObjects.length > 0) {
                const rootCenter = new THREE.Vector3();
                grouping.rootObjects.forEach(obj => {
                    rootCenter.add(obj.getWorldPosition(new THREE.Vector3()));
                });
                rootCenter.divideScalar(grouping.rootObjects.length);
                
                grouping.rootObjects.forEach((obj, index) => {
                    const objWorldPos = obj.getWorldPosition(new THREE.Vector3());
                    let direction = new THREE.Vector3()
                        .subVectors(objWorldPos, rootCenter)
                        .normalize();
                    
                    if (direction.length() === 0) {
                        const angle = (index / grouping.rootObjects.length) * Math.PI * 2;
                        direction.set(Math.cos(angle), 0, Math.sin(angle));
                    }
                    
                    const targetPosition = obj.position.clone()
                        .add(direction.multiplyScalar(disassembleDistance));
                    
                    layerTargets.push({
                        object: obj,
                        originalPosition: obj.position.clone(),
                        targetPosition
                    });
                });
            }
            
            targets.set(layerIndex, layerTargets);
        });
        
        return targets;
    }, [parentGroupings, disassembleDistance]);

    // Initialize layers - only called once per model
    const initializeLayers = useCallback((object) => {
        if (!object || modelInitialized) return;
        
        console.log('Initializing layers for model...');
        setModelInitialized(true);
        setCurrentLayer(0);
        positionStackRef.current = [];
        
        // Store original positions
        const originalPositions = new Map();
        object.traverse((obj) => {
            originalPositions.set(obj.uuid, {
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
                scale: obj.scale.clone()
            });
        });
        originalPositionsRef.current = originalPositions;
        
    }, [modelInitialized]);

    // Optimized disassemble function
    const disassembleNextLayer = useCallback(() => {
        if (currentLayer >= nodeHierarchy.layerGroups.length || isAnimating) return;
        
        const layerTargets = disassemblyTargets.get(currentLayer);
        if (!layerTargets || layerTargets.length === 0) return;
        
        console.log(`Disassembling layer ${currentLayer} with ${layerTargets.length} objects`);
        
        setIsAnimating(true);
        
        // Save current positions for reassembly
        const layerPositions = new Map();
        layerTargets.forEach(({ object }) => {
            layerPositions.set(object.uuid, object.position.clone());
        });
        positionStackRef.current.push(layerPositions);
        
        // Start animation
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 1200,
            targets: layerTargets.map(({ object, targetPosition }) => ({
                object,
                startPosition: object.position.clone(),
                targetPosition
            })),
            type: 'disassemble'
        };
        
        setCurrentLayer(prev => prev + 1);
    }, [currentLayer, isAnimating, nodeHierarchy.layerGroups.length, disassemblyTargets]);

    // Optimized reassemble function
    const reassemblePreviousLayer = useCallback(() => {
        if (currentLayer <= 0 || isAnimating || positionStackRef.current.length === 0) return;
        
        setIsAnimating(true);
        console.log(`Reassembling layer ${currentLayer - 1}`);
        
        const layerPositions = positionStackRef.current.pop();
        const animationTargets = [];
        
        layerPositions.forEach((savedPosition, uuid) => {
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
        
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 1000,
            targets: animationTargets,
            type: 'reassemble'
        };
        
        setCurrentLayer(prev => prev - 1);
    }, [currentLayer, isAnimating]);

    // Assemble entire model at once
    const assembleModel = useCallback(() => {
        if (isAnimating || currentLayer === 0) return;
        
        setIsAnimating(true);
        console.log('Assembling entire model');
        
        const animationTargets = [];
        
        // Reset all objects to original positions
        originalPositionsRef.current.forEach((originalData, uuid) => {
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
                    targetPosition: originalData.position
                });
            }
        });
        
        animationRef.current = {
            isActive: true,
            startTime: Date.now(),
            duration: 1500,
            targets: animationTargets,
            type: 'assemble'
        };
        
        setCurrentLayer(0);
        positionStackRef.current = [];
    }, [isAnimating, currentLayer]);

    // Smooth easing function
    const smoothStep = useCallback((t) => {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }, []);

    // Animation update function
    const updateAnimation = useCallback(() => {
        if (!animationRef.current.isActive) return;
        
        const elapsed = Date.now() - animationRef.current.startTime;
        const progress = Math.min(elapsed / animationRef.current.duration, 1);
        const easedProgress = smoothStep(progress);
        
        animationRef.current.targets.forEach(({ object, startPosition, targetPosition }) => {
            object.position.lerpVectors(startPosition, targetPosition, easedProgress);
        });
        
        if (progress >= 1) {
            animationRef.current.isActive = false;
            setIsAnimating(false);
        }
    }, [smoothStep]);

    // Computed states
    const isFullyAssembled = currentLayer === 0;
    const isFullyDisassembled = currentLayer >= nodeHierarchy.layerGroups.length;

    return {
        initializeLayers,
        currentLayer,
        isAnimating,
        totalLayers: nodeHierarchy.layerGroups.length,
        updateAnimation,
        disassembleNextLayer,
        reassemblePreviousLayer,
        assembleModel,
        isFullyAssembled,
        isFullyDisassembled,
        setDisassembleDistance
    };
}
