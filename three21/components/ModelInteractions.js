class ModelInteractions {
    constructor() {
        this.modelRef = null;
        this.sceneRef = null;
        this.layerManager = null;
        this.animationController = null;
        this.callbacks = {
            onPartSelected: null,
            onModelExpanded: null,
            onScreenshot: null,
            onAnalysis: null
        };
    }

    // Initialize with model and scene references
    initialize(modelRef, sceneRef, layerManager = null, animationController = null) {
        this.modelRef = modelRef;
        this.sceneRef = sceneRef;
        this.layerManager = layerManager;
        this.animationController = animationController;
        console.log('Model interactions initialized');
    }

    // Set callbacks for UI updates
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Voice command: Expand/disassemble the model
    expandModel(targetPart = null, parameters = null) {
        console.log('Voice command: Expand model', { targetPart, parameters });
        
        try {
            if (this.layerManager && this.layerManager.expandAll) {
                this.layerManager.expandAll();
            } else if (this.animationController && this.animationController.expandModel) {
                this.animationController.expandModel();
            } else {
                // Fallback: simple separation animation
                this.performBasicExpansion(targetPart);
            }
            
            if (this.callbacks.onModelExpanded) {
                this.callbacks.onModelExpanded({ action: 'expand', target: targetPart });
            }
            
        } catch (error) {
            console.error('Error expanding model:', error);
        }
    }

    // Voice command: Collapse/assemble the model
    collapseModel(targetPart = null, parameters = null) {
        console.log('Voice command: Collapse model', { targetPart, parameters });
        
        try {
            if (this.layerManager && this.layerManager.collapseAll) {
                this.layerManager.collapseAll();
            } else if (this.animationController && this.animationController.collapseModel) {
                this.animationController.collapseModel();
            } else {
                this.performBasicCollapse(targetPart);
            }
            
            if (this.callbacks.onModelExpanded) {
                this.callbacks.onModelExpanded({ action: 'collapse', target: targetPart });
            }
            
        } catch (error) {
            console.error('Error collapsing model:', error);
        }
    }

    // Voice command: Rotate the model or a specific part
    rotateModel(direction = 'clockwise', degrees = 90, targetPart = null) {
        console.log('Voice command: Rotate model', { direction, degrees, targetPart });
        
        try {
            if (!this.sceneRef?.current) return;
            
            const rotationAmount = (degrees * Math.PI) / 180;
            const rotationDirection = direction === 'clockwise' ? 1 : -1;
            
            if (targetPart && this.layerManager) {
                // Rotate specific part if possible
                const part = this.findPart(targetPart);
                if (part) {
                    part.rotation.y += rotationAmount * rotationDirection;
                }
            } else {
                // Rotate entire model
                if (this.modelRef?.current) {
                    this.modelRef.current.rotation.y += rotationAmount * rotationDirection;
                }
            }
            
        } catch (error) {
            console.error('Error rotating model:', error);
        }
    }

    // Voice command: Zoom/scale the model
    zoomModel(factor = 1.5, targetPart = null) {
        console.log('Voice command: Zoom model', { factor, targetPart });
        
        try {
            if (!this.sceneRef?.current) return;
            
            if (targetPart && this.layerManager) {
                const part = this.findPart(targetPart);
                if (part) {
                    part.scale.multiplyScalar(factor);
                }
            } else {
                // Zoom entire model
                if (this.modelRef?.current) {
                    const currentScale = this.modelRef.current.scale.x;
                    const newScale = Math.min(Math.max(currentScale * factor, 0.1), 5);
                    this.modelRef.current.scale.set(newScale, newScale, newScale);
                }
            }
            
        } catch (error) {
            console.error('Error zooming model:', error);
        }
    }

    // Voice command: Select a specific part
    selectPart(partName) {
        console.log('Voice command: Select part', partName);
        
        try {
            const part = this.findPart(partName);
            if (part) {
                // Highlight the part
                this.highlightPart(part);
                
                if (this.callbacks.onPartSelected) {
                    this.callbacks.onPartSelected({
                        name: partName,
                        object: part,
                        position: part.position,
                        rotation: part.rotation
                    });
                }
            } else {
                console.warn('Part not found:', partName);
                // Try fuzzy matching
                const fuzzyMatch = this.findPartFuzzy(partName);
                if (fuzzyMatch) {
                    this.selectPart(fuzzyMatch.name);
                }
            }
            
        } catch (error) {
            console.error('Error selecting part:', error);
        }
    }

    // Voice command: Analyze the model or specific part
    analyzeModel(targetPart = null) {
        console.log('Voice command: Analyze model', targetPart);
        
        if (this.callbacks.onAnalysis) {
            this.callbacks.onAnalysis({ target: targetPart, type: 'voice_analysis' });
        }
    }

    // Voice command: Take screenshot
    takeScreenshot() {
        console.log('Voice command: Take screenshot');
        
        if (this.callbacks.onScreenshot) {
            this.callbacks.onScreenshot();
        }
    }

    // Voice command: Reset view
    resetView() {
        console.log('Voice command: Reset view');
        
        try {
            if (this.modelRef?.current) {
                // Reset position, rotation, and scale
                this.modelRef.current.position.set(0, 0, 0);
                this.modelRef.current.rotation.set(0, 0, 0);
                this.modelRef.current.scale.set(1, 1, 1);
            }
            
            // Clear any highlights
            this.clearAllHighlights();
            
            // Reset layer manager state
            if (this.layerManager && this.layerManager.resetAll) {
                this.layerManager.resetAll();
            }
            
        } catch (error) {
            console.error('Error resetting view:', error);
        }
    }

    // Helper: Find a part by name
    findPart(partName) {
        if (!this.modelRef?.current || !partName) return null;
        
        const searchName = partName.toLowerCase();
        let foundPart = null;
        
        this.modelRef.current.traverse((child) => {
            if (!foundPart && child.name && child.name.toLowerCase().includes(searchName)) {
                foundPart = child;
            }
            // Also check userData for more detailed naming
            if (!foundPart && child.userData && child.userData.name) {
                if (child.userData.name.toLowerCase().includes(searchName)) {
                    foundPart = child;
                }
            }
        });
        
        return foundPart;
    }

    // Helper: Find part with fuzzy matching
    findPartFuzzy(partName) {
        if (!this.modelRef?.current || !partName) return null;
        
        const searchName = partName.toLowerCase();
        const parts = [];
        
        this.modelRef.current.traverse((child) => {
            if (child.name) {
                parts.push({ name: child.name, object: child });
            }
        });
        
        // Simple fuzzy matching - find parts that contain any word from the search
        const searchWords = searchName.split(' ');
        const matches = parts.filter(part => {
            const partNameLower = part.name.toLowerCase();
            return searchWords.some(word => partNameLower.includes(word));
        });
        
        return matches.length > 0 ? matches[0] : null;
    }

    // Helper: Highlight a part
    highlightPart(part) {
        if (!part) return;
        
        // Clear previous highlights
        this.clearAllHighlights();
        
        // Store original material for restoration
        if (part.material && !part.userData.originalMaterial) {
            part.userData.originalMaterial = part.material.clone();
        }
        
        // Apply highlight effect
        if (part.material) {
            part.material.emissive.setHex(0x444444);
            part.material.transparent = true;
            part.material.opacity = 0.8;
        }
        
        part.userData.isHighlighted = true;
    }

    // Helper: Clear all highlights
    clearAllHighlights() {
        if (!this.modelRef?.current) return;
        
        this.modelRef.current.traverse((child) => {
            if (child.userData.isHighlighted) {
                // Restore original material
                if (child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    delete child.userData.originalMaterial;
                }
                delete child.userData.isHighlighted;
            }
        });
    }

    // Helper: Basic expansion animation
    performBasicExpansion(targetPart) {
        if (!this.modelRef?.current) return;
        
        this.modelRef.current.traverse((child, index) => {
            if (child.isMesh) {
                // Move parts away from center
                const direction = child.position.clone().normalize();
                const distance = 2 + Math.random() * 3;
                child.position.add(direction.multiplyScalar(distance));
            }
        });
    }

    // Helper: Basic collapse animation
    performBasicCollapse(targetPart) {
        if (!this.modelRef?.current) return;
        
        this.modelRef.current.traverse((child) => {
            if (child.isMesh && child.userData.originalPosition) {
                // Return to original position
                child.position.copy(child.userData.originalPosition);
            }
        });
    }

    // Get available parts for voice commands
    getAvailableParts() {
        if (!this.modelRef?.current) return [];
        
        const parts = [];
        this.modelRef.current.traverse((child) => {
            if (child.isMesh && child.name) {
                parts.push({
                    name: child.name,
                    displayName: this.formatPartName(child.name),
                    type: child.type,
                    visible: child.visible
                });
            }
        });
        
        return parts;
    }

    // Format part names for display
    formatPartName(name) {
        return name
            .replace(/[_-]/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    }
}

export default ModelInteractions;
