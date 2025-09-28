import * as THREE from 'three';

/**
 * Advanced highlighting system with customizable neon effects
 */
export class HighlightManager {
    constructor() {
        this.highlightedObjects = new Map();
        this.originalMaterials = new Map();
        this.highlightColor = new THREE.Color(0x00ffff); // Neon blue
        this.highlightOpacity = 0.7;
        this.highlightIntensity = 1.0;
        this.pulseAnimation = true;
        this.pulseSpeed = 2.0;
        this.animationClock = new THREE.Clock();
    }

    /**
     * Set highlight color and properties
     */
    setHighlightProperties(color, opacity = 0.7, intensity = 1.0, pulse = true, pulseSpeed = 2.0) {
        this.highlightColor = new THREE.Color(color);
        this.highlightOpacity = opacity;
        this.highlightIntensity = intensity;
        this.pulseAnimation = pulse;
        this.pulseSpeed = pulseSpeed;
    }

    /**
     * Create highlight material with neon effect
     */
    createHighlightMaterial(originalMaterial) {
        const baseColor = this.highlightColor.clone();
        
        // Create a material that overlays the original with neon effect
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: this.highlightOpacity,
            emissive: baseColor.clone().multiplyScalar(this.highlightIntensity * 0.3),
            emissiveIntensity: this.highlightIntensity,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
        });

        // For wireframe overlay effect
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: this.highlightOpacity * 0.5,
            wireframe: true,
            emissive: baseColor.clone().multiplyScalar(0.2),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        return { highlightMaterial, wireframeMaterial };
    }

    /**
     * Highlight an object with neon effect
     */
    highlightObject(object, options = {}) {
        if (!object || !object.isMesh) return false;

        // Store original material if not already stored
        if (!this.originalMaterials.has(object.uuid)) {
            this.originalMaterials.set(object.uuid, object.material);
        }

        // Remove existing highlight if present
        this.removeHighlight(object);

        const { highlightMaterial, wireframeMaterial } = this.createHighlightMaterial(object.material);

        // Create highlight mesh (clone geometry but with highlight material)
        const highlightMesh = new THREE.Mesh(object.geometry, highlightMaterial);
        highlightMesh.position.copy(object.position);
        highlightMesh.rotation.copy(object.rotation);
        highlightMesh.scale.copy(object.scale);
        highlightMesh.matrixWorld.copy(object.matrixWorld);
        highlightMesh.name = `${object.name}_highlight`;
        highlightMesh.userData.isHighlight = true;
        highlightMesh.userData.originalObject = object;

        // Create wireframe overlay
        const wireframeMesh = new THREE.Mesh(object.geometry, wireframeMaterial);
        wireframeMesh.position.copy(object.position);
        wireframeMesh.rotation.copy(object.rotation);
        wireframeMesh.scale.copy(object.scale).multiplyScalar(1.001); // Slightly larger to avoid z-fighting
        wireframeMesh.matrixWorld.copy(object.matrixWorld);
        wireframeMesh.name = `${object.name}_wireframe`;
        wireframeMesh.userData.isHighlight = true;
        wireframeMesh.userData.originalObject = object;

        // Add to scene
        if (object.parent) {
            object.parent.add(highlightMesh);
            object.parent.add(wireframeMesh);
        }

        // Store highlight info
        this.highlightedObjects.set(object.uuid, {
            originalObject: object,
            highlightMesh,
            wireframeMesh,
            startTime: this.animationClock.getElapsedTime(),
            options
        });

        return true;
    }

    /**
     * Remove highlight from object
     */
    removeHighlight(object) {
        if (!object) return false;

        const highlightInfo = this.highlightedObjects.get(object.uuid);
        if (highlightInfo) {
            // Remove highlight meshes from scene
            if (highlightInfo.highlightMesh.parent) {
                highlightInfo.highlightMesh.parent.remove(highlightInfo.highlightMesh);
            }
            if (highlightInfo.wireframeMesh.parent) {
                highlightInfo.wireframeMesh.parent.remove(highlightInfo.wireframeMesh);
            }

            // Dispose materials
            highlightInfo.highlightMesh.material.dispose();
            highlightInfo.wireframeMesh.material.dispose();

            this.highlightedObjects.delete(object.uuid);
            return true;
        }
        return false;
    }

    /**
     * Clear all highlights
     */
    clearAllHighlights() {
        const objectIds = Array.from(this.highlightedObjects.keys());
        objectIds.forEach(uuid => {
            const highlightInfo = this.highlightedObjects.get(uuid);
            if (highlightInfo) {
                this.removeHighlight(highlightInfo.originalObject);
            }
        });
    }

    /**
     * Update highlight animations (call in animation loop)
     */
    updateHighlights() {
        if (!this.pulseAnimation) return;

        const currentTime = this.animationClock.getElapsedTime();

        this.highlightedObjects.forEach((highlightInfo, uuid) => {
            const { highlightMesh, wireframeMesh, startTime } = highlightInfo;
            
            // Calculate pulse effect
            const elapsed = currentTime - startTime;
            const pulseValue = (Math.sin(elapsed * this.pulseSpeed) + 1) * 0.5; // 0 to 1
            
            // Apply pulse to opacity and emissive intensity
            const baseOpacity = this.highlightOpacity;
            const pulsedOpacity = baseOpacity * (0.5 + pulseValue * 0.5); // Pulse between 50% and 100% of base opacity
            
            highlightMesh.material.opacity = pulsedOpacity;
            wireframeMesh.material.opacity = pulsedOpacity * 0.5;
            
            // Pulse emissive intensity
            const emissiveIntensity = this.highlightIntensity * (0.7 + pulseValue * 0.3);
            highlightMesh.material.emissiveIntensity = emissiveIntensity;
        });
    }

    /**
     * Get currently highlighted objects
     */
    getHighlightedObjects() {
        return Array.from(this.highlightedObjects.values()).map(info => info.originalObject);
    }

    /**
     * Check if object is highlighted
     */
    isHighlighted(object) {
        return this.highlightedObjects.has(object.uuid);
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.clearAllHighlights();
        this.originalMaterials.clear();
    }
}

/**
 * Hook for using highlight manager in React components
 */
export function useHighlightManager() {
    const highlightManager = new HighlightManager();
    return highlightManager;
}
