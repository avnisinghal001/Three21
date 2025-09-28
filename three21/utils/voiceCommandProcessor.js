class VoiceCommandProcessor {
    constructor() {
        this.commands = {
            // Model manipulation commands
            'expand': ['expand', 'open up', 'spread out', 'explode', 'disassemble'],
            'collapse': ['collapse', 'close', 'assemble', 'put together', 'combine'],
            'rotate': ['rotate', 'turn', 'spin', 'revolve'],
            'zoom': ['zoom', 'magnify', 'scale', 'resize'],
            'select': ['select', 'choose', 'pick', 'highlight', 'focus on'],
            'analyze': ['analyze', 'examine', 'inspect', 'study', 'look at'],
            'screenshot': ['screenshot', 'capture', 'take picture', 'snap', 'save image'],
            'reset': ['reset', 'restore', 'original', 'default', 'clear'],
            
            // Navigation commands
            'left': ['left', 'port'],
            'right': ['right', 'starboard'],
            'up': ['up', 'top', 'above'],
            'down': ['down', 'bottom', 'below'],
            'front': ['front', 'forward', 'ahead'],
            'back': ['back', 'behind', 'rear'],
            
            // Part selection commands
            'engine': ['engine', 'motor', 'power unit'],
            'wing': ['wing', 'wings'],
            'fuselage': ['fuselage', 'body', 'hull', 'frame'],
            'landing gear': ['landing gear', 'wheels', 'gear'],
            'propeller': ['propeller', 'prop', 'rotor'],
            'tail': ['tail', 'rudder', 'fin'],
        };
        
        this.modelInteractions = null;
        this.onCommandExecuted = null;
    }

    setModelInteractions(interactions) {
        this.modelInteractions = interactions;
    }

    setCommandCallback(callback) {
        this.onCommandExecuted = callback;
    }

    processVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        console.log('Processing voice command:', lowerTranscript);
        
        const commandResult = this.parseCommand(lowerTranscript);
        
        if (commandResult) {
            this.executeCommand(commandResult);
            return commandResult;
        }
        
        return null;
    }

    parseCommand(transcript) {
        const words = transcript.split(' ');
        
        // Check for direct commands first
        for (const [commandType, variations] of Object.entries(this.commands)) {
            for (const variation of variations) {
                if (transcript.includes(variation)) {
                    return {
                        type: commandType,
                        original: transcript,
                        target: this.extractTarget(transcript, commandType),
                        parameters: this.extractParameters(transcript, commandType)
                    };
                }
            }
        }
        
        // Check for complex commands
        return this.parseComplexCommand(transcript);
    }

    parseComplexCommand(transcript) {
        // Pattern: "select the [part] and [action]"
        const selectAndActionPattern = /select\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+and\s+(.*)/i;
        const match = transcript.match(selectAndActionPattern);
        
        if (match) {
            const partName = match[1];
            const action = match[2];
            
            return {
                type: 'complex',
                original: transcript,
                commands: [
                    { type: 'select', target: partName },
                    this.parseCommand(action)
                ].filter(Boolean)
            };
        }
        
        // Pattern: "[action] the [part]"
        const actionPartPattern = /(expand|collapse|rotate|analyze|zoom)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i;
        const actionMatch = transcript.match(actionPartPattern);
        
        if (actionMatch) {
            return {
                type: actionMatch[1].toLowerCase(),
                original: transcript,
                target: actionMatch[2]
            };
        }
        
        return null;
    }

    extractTarget(transcript, commandType) {
        // Extract target object from transcript
        for (const [partName, variations] of Object.entries(this.commands)) {
            for (const variation of variations) {
                if (transcript.includes(variation) && partName !== commandType) {
                    return partName;
                }
            }
        }
        
        // Try to extract generic part names
        const partPattern = /(?:the\s+)?(\w+(?:\s+\w+)?)/i;
        const words = transcript.replace(new RegExp(this.commands[commandType].join('|'), 'gi'), '').trim();
        const match = words.match(partPattern);
        
        return match ? match[1].trim() : null;
    }

    extractParameters(transcript, commandType) {
        const parameters = {};
        
        // Extract numeric values
        const numberPattern = /(\d+(?:\.\d+)?)\s*(degrees?|percent|%|times?|px|pixels?)?/gi;
        let numberMatch;
        
        while ((numberMatch = numberPattern.exec(transcript)) !== null) {
            const value = parseFloat(numberMatch[1]);
            const unit = numberMatch[2] || '';
            
            if (unit.toLowerCase().includes('degree')) {
                parameters.degrees = value;
            } else if (unit.includes('%') || unit.toLowerCase().includes('percent')) {
                parameters.percentage = value;
            } else if (unit.toLowerCase().includes('time')) {
                parameters.times = value;
            } else {
                parameters.value = value;
            }
        }
        
        // Extract directional parameters
        const directions = ['left', 'right', 'up', 'down', 'clockwise', 'counterclockwise'];
        for (const direction of directions) {
            if (transcript.includes(direction)) {
                parameters.direction = direction;
                break;
            }
        }
        
        return Object.keys(parameters).length > 0 ? parameters : null;
    }

    executeCommand(commandResult) {
        console.log('Executing command:', commandResult);
        
        if (!this.modelInteractions) {
            console.warn('Model interactions not set');
            return;
        }
        
        try {
            if (commandResult.type === 'complex') {
                // Execute multiple commands in sequence
                commandResult.commands.forEach(cmd => {
                    if (cmd) this.executeSingleCommand(cmd);
                });
            } else {
                this.executeSingleCommand(commandResult);
            }
            
            if (this.onCommandExecuted) {
                this.onCommandExecuted(commandResult);
            }
            
        } catch (error) {
            console.error('Command execution error:', error);
        }
    }

    executeSingleCommand(command) {
        const { type, target, parameters } = command;
        
        switch (type) {
            case 'expand':
                if (this.modelInteractions.expandModel) {
                    this.modelInteractions.expandModel(target, parameters);
                }
                break;
                
            case 'collapse':
                if (this.modelInteractions.collapseModel) {
                    this.modelInteractions.collapseModel(target, parameters);
                }
                break;
                
            case 'rotate':
                if (this.modelInteractions.rotateModel) {
                    const direction = parameters?.direction || 'clockwise';
                    const degrees = parameters?.degrees || 90;
                    this.modelInteractions.rotateModel(direction, degrees, target);
                }
                break;
                
            case 'zoom':
                if (this.modelInteractions.zoomModel) {
                    const factor = parameters?.times || parameters?.percentage || 1.5;
                    this.modelInteractions.zoomModel(factor, target);
                }
                break;
                
            case 'select':
                if (this.modelInteractions.selectPart) {
                    this.modelInteractions.selectPart(target);
                }
                break;
                
            case 'analyze':
                if (this.modelInteractions.analyzeModel) {
                    this.modelInteractions.analyzeModel(target);
                }
                break;
                
            case 'screenshot':
                if (this.modelInteractions.takeScreenshot) {
                    this.modelInteractions.takeScreenshot();
                }
                break;
                
            case 'reset':
                if (this.modelInteractions.resetView) {
                    this.modelInteractions.resetView();
                }
                break;
                
            default:
                console.warn('Unknown command type:', type);
        }
    }

    // Helper method to get command suggestions
    getCommandSuggestions() {
        return [
            "Say 'expand the model' to disassemble it",
            "Say 'select the engine' to highlight a specific part",
            "Say 'rotate left 45 degrees' to rotate the view",
            "Say 'zoom in 2 times' to magnify the model",
            "Say 'take a screenshot' to capture the current view",
            "Say 'analyze the wing' to get detailed information",
            "Say 'reset view' to return to original position"
        ];
    }

    // Helper method to check if a command is recognized
    isValidCommand(transcript) {
        return this.parseCommand(transcript.toLowerCase()) !== null;
    }
}

export default VoiceCommandProcessor;
