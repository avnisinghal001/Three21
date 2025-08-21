import { useState, useEffect } from 'react';
import { 
    Tool, 
    HelpCircle, 
    X, 
    Zap, 
    Eye, 
    List, 
    Maximize, 
    BarChart, 
    ChevronUp, 
    ChevronDown,
    Settings,
    Activity,
    Layers
} from 'react-feather';

export function DisassemblyUI({ 
    currentLayer, 
    totalLayers, 
    isAnimating, 
    onOpenAI, 
    separationDistance = 0.2, 
    onSeparationDistanceChange,
    highlightColor = '#00ffff',
    highlightOpacity = 0.7,
    onHighlightColorChange,
    onHighlightOpacityChange,
    modelScale = null,
    onScaleChange
}) {
    const [showInstructions, setShowInstructions] = useState(true);
    const [showStatus, setShowStatus] = useState(true);

    useEffect(() => {
        // Auto-hide instructions after 8 seconds
        const timer = setTimeout(() => {
            setShowInstructions(false);
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    // Handle manual disassemble/assemble button clicks
    const handleDisassemble = () => {
        // Simulate pressing 'E' key
        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);
    };

    const handleAssemble = () => {
        // Simulate pressing 'Q' key
        const event = new KeyboardEvent('keydown', { key: 'q' });
        window.dispatchEvent(event);
    };

    console.log('DisassemblyUI rendering:', { currentLayer, totalLayers, isAnimating, showInstructions });

    return (
        <>
            {/* Instructions Overlay */}
            {showInstructions && (
                <div className="disassembly-instructions" role="dialog" aria-labelledby="instructions-title" aria-describedby="instructions-content">
                    <div className="instructions-header">
                        <div className="instructions-icon" aria-hidden="true">
                            <Tool size={20} />
                        </div>
                        <h3 id="instructions-title">Disassembly Controls</h3>
                    </div>
                    
                    <div className="instructions-content" id="instructions-content">
                        <div className="control-item">
                            <kbd className="key-badge" aria-label="E key">E</kbd>
                            <span>Disassemble next layer</span>
                        </div>
                        <div className="control-item">
                            <kbd className="key-badge" aria-label="Q key">Q</kbd>
                            <span>Reassemble previous layer</span>
                        </div>
                        <div className="instructions-note" role="note">
                            Model will disassemble layer by layer outward from each parent's center. Use the separation slider in the status panel to adjust how far parts move during disassembly. Click any part to highlight it with customizable neon effects - adjust color and opacity in the highlight controls.
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowInstructions(false)}
                        className="instructions-close-btn"
                        aria-label="Hide instructions"
                        type="button"
                    >
                        <X size={14} />
                        <span>Hide</span>
                    </button>
                </div>
            )}

            {/* AI Assistant Button */}
            <button
                onClick={onOpenAI}
                className="ai-assistant-btn"
                aria-label="Open Three21Bot AI Assistant"
                type="button"
            >
                <div className="ai-btn-icon" aria-hidden="true">
                    <Zap size={18} />
                </div>
                <span>Three21Bot AI</span>
            </button>

            {/* Status Indicator */}
            {showStatus && (
                <div className="status-indicator" role="region" aria-labelledby="status-title">
                    <div className="status-header">
                        <h3 id="status-title" className="status-title">
                            <Activity size={16} aria-hidden="true" />
                            Status Panel
                        </h3>
                        <button
                            onClick={() => setShowStatus(false)}
                            className="status-close-btn"
                            aria-label="Hide status panel"
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="status-row">
                        <span className="status-label">Status:</span>
                        <div className="status-value">
                            {isAnimating ? (
                                <>
                                    <div className="status-spinner" aria-hidden="true"></div>
                                    <span>Animating</span>
                                </>
                            ) : (
                                <>
                                    <div className="status-dot status-ready" aria-hidden="true"></div>
                                    <span>Ready</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="status-row">
                        <span className="status-label">
                            <Layers size={14} aria-hidden="true" />
                            Layer:
                        </span>
                        <span className="status-value">{currentLayer} / {totalLayers}</span>
                    </div>
                    
                    {/* Separation Distance Control */}
                    <div className="status-row">
                        <span className="status-label">
                            <Maximize size={14} aria-hidden="true" />
                            Separation:
                        </span>
                        <div className="distance-control">
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                step="0.01"
                                value={separationDistance}
                                onChange={(e) => onSeparationDistanceChange && onSeparationDistanceChange(parseFloat(e.target.value))}
                                className="distance-slider"
                                disabled={isAnimating}
                                aria-label={`Separation distance: ${Number(separationDistance).toFixed(2)}`}
                            />
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                step="0.01"
                                value={separationDistance}
                                onChange={(e) => onSeparationDistanceChange && onSeparationDistanceChange(parseFloat(e.target.value))}
                                className="distance-number-input"
                                disabled={isAnimating}
                                aria-label="Separation distance value"
                            />
                            <span className="distance-value" aria-hidden="true">{Number(separationDistance).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Highlight Color Control */}
                    <div className="status-row">
                        <span className="status-label">
                            <List size={14} aria-hidden="true" />
                            Highlight:
                        </span>
                        <div className="highlight-control">
                            <input
                                type="color"
                                value={highlightColor}
                                onChange={(e) => onHighlightColorChange && onHighlightColorChange(e.target.value)}
                                className="color-picker"
                                disabled={isAnimating}
                                aria-label="Highlight color picker"
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={highlightOpacity}
                                onChange={(e) => onHighlightOpacityChange && onHighlightOpacityChange(parseFloat(e.target.value))}
                                className="opacity-slider"
                                disabled={isAnimating}
                                aria-label={`Highlight opacity: ${(highlightOpacity * 100).toFixed(0)}%`}
                            />
                            <span className="opacity-value" aria-hidden="true">{(highlightOpacity * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    
                    {/* Model Scale Control */}
                    {modelScale && modelScale.originalSize && (
                        <div className="status-row">
                            <span className="status-label">
                                <BarChart size={14} aria-hidden="true" />
                                Scale:
                            </span>
                            <div className="scale-control">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5.0"
                                    step="0.1"
                                    value={modelScale?.userScale || 1}
                                    onChange={(e) => onScaleChange && onScaleChange(parseFloat(e.target.value))}
                                    className="scale-slider"
                                    disabled={isAnimating}
                                    aria-label={`Model scale: ${modelScale?.userScale || 1}x`}
                                />
                                <input
                                    type="number"
                                    min="0.1"
                                    max="5.0"
                                    step="0.1"
                                    value={modelScale?.userScale || 1}
                                    onChange={(e) => onScaleChange && onScaleChange(parseFloat(e.target.value))}
                                    className="scale-number-input"
                                    disabled={isAnimating}
                                    aria-label="Model scale value"
                                />
                                <span className="scale-value" aria-hidden="true">{modelScale?.userScale || 1}x</span>
                                <div 
                                    className="original-size-info" 
                                    title={`Original: ${modelScale.originalSize.width.toFixed(1)} × ${modelScale.originalSize.height.toFixed(1)} × ${modelScale.originalSize.depth.toFixed(1)}`}
                                >
                                    <Eye size={12} aria-hidden="true" />
                                    {modelScale.originalSize.maxDimension.toFixed(1)} units
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {totalLayers > 0 && (
                        <div className="progress-container">
                            <div className="progress-bar" role="progressbar" aria-valuenow={currentLayer} aria-valuemin="0" aria-valuemax={totalLayers} aria-label="Disassembly progress">
                                <div 
                                    className="progress-fill"
                                    style={{
                                        width: `${(currentLayer / totalLayers) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="progress-text" aria-hidden="true">{Math.round((currentLayer / totalLayers) * 100)}%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Assemble/Disassemble Control Buttons */}
            
            <div className='control-div'>
<div className="control-buttons" role="group" aria-label="Disassembly controls">
                <button
                    className={`btn-control ${currentLayer <= 0 ? 'btn-control-active' : 'btn-control-secondary'}`}
                    onClick={handleAssemble}
                    disabled={currentLayer <= 0 || isAnimating}
                    aria-label="Assemble model"
                    type="button"
                >
                    <ChevronUp className="btn-icon" size={16} />
                    <span className="btn-text">Assemble</span>
                </button>
                <button
                    className={`btn-control ${currentLayer >= totalLayers ? 'btn-control-secondary' : 'btn-control-active'}`}
                    onClick={handleDisassemble}
                    disabled={currentLayer >= totalLayers || isAnimating}
                    aria-label="Disassemble model"
                    type="button"
                >
                    <ChevronDown className="btn-icon" size={16} />
                    <span className="btn-text">Disassemble</span>
                </button>
            </div>
            </div>
            

            {/* Show/Hide Instructions Button */}
            {!showInstructions && (
                <button
                    onClick={() => setShowInstructions(true)}
                    className="show-controls-btn"
                    aria-label="Show disassembly controls"
                    type="button"
                >
                    <HelpCircle size={16} />
                    <span>Show Controls</span>
                </button>
            )}

            {/* Show/Hide Status Button */}
            {!showStatus && (
                <button
                    onClick={() => setShowStatus(true)}
                    className="show-status-btn"
                    aria-label="Show status panel"
                    type="button"
                >
                    <Settings size={16} />
                    <span>Show Status</span>
                </button>
            )}

            <style jsx>{`
                /* Mobile-first responsive design with a11y focus */
                .disassembly-instructions {
                    position: fixed;
                    top: 0.75rem;
                    left: 0.75rem;
                    right: 0.75rem;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem;
                    z-index: 9999;
                    box-shadow: 
                        0 16px 32px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(20px);
                    animation: slideInLeft 0.5s ease-out;
                    max-height: calc(100vh - 1.5rem);
                    overflow-y: auto;
                }

                @media (min-width: 768px) {
                    .disassembly-instructions {
                        top: 1.5rem;
                        left: 1.5rem;
                        right: auto;
                        max-width: 360px;
                        padding: 1.5rem;
                        border-radius: 16px;
                    }
                }

                .instructions-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                @media (min-width: 768px) {
                    .instructions-header {
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                }

                .instructions-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    background: var(--gradient-primary);
                    color: var(--primary-foreground);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 8px 16px var(--primary-shadow);
                }

                @media (min-width: 768px) {
                    .instructions-icon {
                        width: 3rem;
                        height: 3rem;
                        border-radius: 14px;
                        box-shadow: 0 12px 24px var(--primary-shadow);
                    }
                }

                .instructions-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--foreground);
                }

                @media (min-width: 768px) {
                    .instructions-header h3 {
                        font-size: 1.125rem;
                        background: var(--gradient-primary);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                }

                .instructions-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                @media (min-width: 768px) {
                    .instructions-content {
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                }

                .control-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 8px;
                    background: var(--muted);
                    transition: all 0.3s ease;
                }

                @media (min-width: 768px) {
                    .control-item {
                        gap: 1.25rem;
                        padding: 1rem;
                        border-radius: 12px;
                    }
                }

                .control-item:hover {
                    background: rgba(var(--primary-rgb), 0.1);
                }

                .key-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                    background: var(--card);
                    border: 2px solid var(--border);
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: var(--foreground);
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                @media (min-width: 768px) {
                    .key-badge {
                        width: 2.5rem;
                        height: 2.5rem;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 800;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
                    }
                }

                .control-item span {
                    font-size: 0.8rem;
                    color: var(--muted-foreground);
                    line-height: 1.4;
                    font-weight: 500;
                }

                @media (min-width: 768px) {
                    .control-item span {
                        font-size: 0.9rem;
                        line-height: 1.5;
                    }
                }

                .instructions-note {
                    font-size: 0.75rem;
                    color: var(--muted-foreground);
                    line-height: 1.5;
                    padding: 0.75rem;
                    background: var(--muted);
                    border-radius: 8px;
                    border-left: 3px solid var(--primary-accent);
                }

                @media (min-width: 768px) {
                    .instructions-note {
                        font-size: 0.8rem;
                        line-height: 1.6;
                        padding: 1rem;
                        border-radius: 10px;
                        border-left-width: 4px;
                    }
                }

                .instructions-close-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 2px solid var(--border);
                    color: var(--muted-foreground);
                    padding: 0.625rem 0.875rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    outline: none;
                }

                @media (min-width: 768px) {
                    .instructions-close-btn {
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        font-size: 0.8rem;
                    }
                }

                .instructions-close-btn:hover {
                    color: var(--foreground);
                    border-color: var(--primary-accent);
                    background: var(--muted);
                }

                .instructions-close-btn:focus-visible {
                    outline: 2px solid var(--primary-accent);
                    outline-offset: 2px;
                }

                .ai-assistant-btn {
                    position: fixed;
                    top: 0.75rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--gradient-primary);
                    border: none;
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 16px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                    z-index: 9999;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px var(--primary-shadow);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    outline: none;
                    white-space: nowrap;
                    min-width: fit-content;
                }

                @media (min-width: 768px) {
                    .ai-assistant-btn {
                        top: 1.5rem;
                        padding: 0.875rem 1.75rem;
                        border-radius: 25px;
                        font-size: 0.875rem;
                        gap: 0.625rem;
                        box-shadow: 0 8px 25px var(--primary-shadow);
                    }
                }

                .ai-assistant-btn:hover {
                    transform: translateX(-50%) translateY(-1px);
                    box-shadow: 0 8px 25px var(--primary-shadow);
                }

                @media (min-width: 768px) {
                    .ai-assistant-btn:hover {
                        transform: translateX(-50%) translateY(-2px);
                        box-shadow: 0 12px 35px var(--primary-shadow);
                    }
                }

                .ai-assistant-btn:focus-visible {
                    outline: 2px solid var(--primary-foreground);
                    outline-offset: 2px;
                }

                .ai-btn-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .status-indicator {
                    position: fixed;
                    top: 0.75rem;
                    right: 0.75rem;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem;
                    z-index: 9999;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(20px);
                    min-width: 200px;
                    max-width: calc(100vw - 1.5rem);
                    animation: slideInRight 0.5s ease-out;
                }

                @media (min-width: 768px) {
                    .status-indicator {
                        top: 1.5rem;
                        right: 1.5rem;
                        border-radius: 16px;
                        padding: 1.5rem;
                        min-width: 280px;
                        max-width: 360px;
                    }
                }

                .status-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border);
                }

                .status-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: var(--foreground);
                }

                @media (min-width: 768px) {
                    .status-title {
                        font-size: 1rem;
                    }
                }

                .status-close-btn {
                    background: transparent;
                    border: 1px solid var(--border);
                    color: var(--muted-foreground);
                    padding: 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    outline: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .status-close-btn:hover {
                    color: var(--foreground);
                    border-color: var(--primary-accent);
                    background: var(--muted);
                }

                .status-close-btn:focus-visible {
                    outline: 2px solid var(--primary-accent);
                    outline-offset: 2px;
                }

                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                @media (min-width: 768px) {
                    .status-row {
                        flex-wrap: nowrap;
                        margin-bottom: 1rem;
                    }
                }

                .status-row:last-child {
                    margin-bottom: 0;
                }

                .status-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--muted-foreground);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    flex-shrink: 0;
                }

                @media (min-width: 768px) {
                    .status-label {
                        font-size: 0.8rem;
                        gap: 0.5rem;
                    }
                }

                .status-value {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--foreground);
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                @media (min-width: 768px) {
                    .status-value {
                        font-size: 0.8rem;
                        gap: 0.5rem;
                    }
                }

                .distance-control, .highlight-control, .scale-control {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    flex: 1;
                    min-width: 0;
                }

                @media (min-width: 768px) {
                    .distance-control, .highlight-control, .scale-control {
                        gap: 0.5rem;
                    }
                }

                .distance-slider, .opacity-slider, .scale-slider {
                    flex: 1;
                    height: 3px;
                    background: var(--muted);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                    min-width: 50px;
                }

                @media (min-width: 768px) {
                    .distance-slider, .opacity-slider, .scale-slider {
                        height: 4px;
                        min-width: 80px;
                    }
                }

                .distance-slider::-webkit-slider-thumb,
                .opacity-slider::-webkit-slider-thumb,
                .scale-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--primary-accent);
                    cursor: pointer;
                    border: 2px solid var(--card);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                @media (min-width: 768px) {
                    .distance-slider::-webkit-slider-thumb,
                    .opacity-slider::-webkit-slider-thumb,
                    .scale-slider::-webkit-slider-thumb {
                        width: 16px;
                        height: 16px;
                    }
                }

                .distance-slider::-webkit-slider-thumb:hover,
                .opacity-slider::-webkit-slider-thumb:hover,
                .scale-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.4);
                }

                .distance-number-input, .scale-number-input {
                    width: 60px;
                    height: 20px;
                    padding: 0.125rem 0.25rem;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    background: var(--card);
                    color: var(--foreground);
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-align: center;
                    outline: none;
                }

                @media (min-width: 768px) {
                    .distance-number-input {
                        width: 70px;
                        height: 24px;
                        font-size: 0.75rem;
                        padding: 0.2rem 0.4rem;
                    }
                }

                .distance-number-input:focus, .scale-number-input:focus {
                    border-color: var(--primary-accent);
                    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
                }

                .distance-value, .opacity-value, .scale-value {
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: var(--primary-accent);
                    min-width: 2rem;
                    text-align: center;
                    background: rgba(var(--primary-rgb), 0.1);
                    padding: 0.125rem 0.25rem;
                    border-radius: 3px;
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }

                @media (min-width: 768px) {
                    .distance-value, .opacity-value {
                        font-size: 0.75rem;
                        min-width: 2.5rem;
                        padding: 0.2rem 0.4rem;
                        border-radius: 4px;
                    }
                }

                .color-picker {
                    width: 28px;
                    height: 20px;
                    border: 1px solid var(--border);
                    border-radius: 3px;
                    cursor: pointer;
                    background: none;
                    padding: 0;
                }

                @media (min-width: 768px) {
                    .color-picker {
                        width: 32px;
                        height: 24px;
                        border-radius: 4px;
                    }
                }

                .color-picker::-webkit-color-swatch-wrapper {
                    padding: 0;
                    border: none;
                    border-radius: inherit;
                }

                .color-picker::-webkit-color-swatch {
                    border: none;
                    border-radius: inherit;
                }

                .scale-info {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .scale-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }

                .scale-value {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--primary-accent);
                }

                .original-size, .original-size-info {
                    font-size: 0.6rem;
                    color: var(--muted-foreground);
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    cursor: help;
                }

                @media (min-width: 768px) {
                    .original-size {
                        font-size: 0.65rem;
                        gap: 0.375rem;
                    }
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    position: relative;
                }

                @media (min-width: 768px) {
                    .status-dot {
                        width: 8px;
                        height: 8px;
                    }
                }

                .status-ready {
                    background: var(--success);
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 8px var(--success);
                }

                .status-spinner {
                    width: 10px;
                    height: 10px;
                    border: 2px solid var(--border);
                    border-top: 2px solid var(--primary-accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @media (min-width: 768px) {
                    .status-spinner {
                        width: 12px;
                        height: 12px;
                    }
                }

                .progress-container {
                    margin-top: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                @media (min-width: 768px) {
                    .progress-container {
                        margin-top: 1rem;
                        gap: 0.75rem;
                    }
                }

                .progress-bar {
                    flex: 1;
                    height: 6px;
                    background: var(--muted);
                    border-radius: 3px;
                    overflow: hidden;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                @media (min-width: 768px) {
                    .progress-bar {
                        height: 8px;
                        border-radius: 4px;
                    }
                }

                .progress-fill {
                    height: 100%;
                    background: var(--gradient-primary);
                    border-radius: inherit;
                    transition: width 0.8s ease;
                    box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.5);
                }

                @media (min-width: 768px) {
                    .progress-fill {
                        box-shadow: 0 0 12px rgba(var(--primary-rgb), 0.5);
                    }
                }

                .progress-text {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--primary-accent);
                    min-width: 2rem;
                    text-align: center;
                }

                @media (min-width: 768px) {
                    .progress-text {
                        font-size: 0.7rem;
                        min-width: 2.5rem;
                    }
                }

                .show-controls-btn, .show-status-btn {
                    position: fixed;
                    background: var(--card);
                    border: 2px solid var(--border);
                    color: var(--foreground);
                    padding: 0.75rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    z-index: 9999;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    outline: none;
                    animation: slideInUp 0.5s ease-out;
                    white-space: nowrap;
                }

                @media (min-width: 768px) {
                    .show-controls-btn, .show-status-btn {
                        padding: 1rem 1.25rem;
                        border-radius: 25px;
                        font-size: 0.8rem;
                        gap: 0.75rem;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                    }
                }

                .show-controls-btn {
                    bottom: 1rem;
                    left: 1rem;
                }

                @media (min-width: 768px) {
                    .show-controls-btn {
                        bottom: 1.5rem;
                        left: 1.5rem;
                    }
                }

                .show-status-btn {
                    bottom: 1rem;
                    right: 1rem;
                }

                @media (min-width: 768px) {
                    .show-status-btn {
                        bottom: 1.5rem;
                        right: 1.5rem;
                    }
                }

                .show-controls-btn:hover, .show-status-btn:hover {
                    color: var(--primary-foreground);
                    border-color: var(--primary-accent);
                    background: var(--gradient-primary);
                    box-shadow: 0 8px 25px rgba(var(--primary-rgb), 0.3);
                    transform: translateY(-2px);
                }

                .show-controls-btn:focus-visible, .show-status-btn:focus-visible {
                    outline: 2px solid var(--primary-accent);
                    outline-offset: 2px;
                }

                /* Control Buttons */
                .control-buttons {
                    position: fixed;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    padding: 0.875rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    min-width: 240px;
                    max-width: calc(100vw - 2rem);
                }

                @media (min-width: 768px) {
                    .control-buttons {
                        bottom: 2rem;
                        gap: 1rem;
                        padding: 1rem;
                        border-radius: 16px;
                        min-width: 280px;
                        max-width: none;
                    }
                }

                .btn-control {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.375rem;
                    height: 2.5rem;
                    padding: 0 0.75rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.1);
                    color: #fafafa;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    font-family: inherit;
                    text-decoration: none;
                    outline: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    overflow: hidden;
                    user-select: none;
                    white-space: nowrap;
                    width: 100%;
                }

                @media (min-width: 768px) {
                    .btn-control {
                        height: 2.75rem;
                        padding: 0 1rem;
                        border-radius: 12px;
                        font-size: 0.875rem;
                        gap: 0.5rem;
                    }
                }

                .btn-control:focus-visible {
                    outline: 2px solid var(--primary-accent);
                    outline-offset: 2px;
                }

                .btn-control:hover:not(:disabled) {
                    background: rgba(59, 130, 246, 0.8);
                    color: #ffffff;
                    border-color: #3b82f6;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .btn-control-active {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    color: #ffffff;
                    border-color: #3b82f6;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
                    transform: translateY(-1px);
                }

                .btn-control-active:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                    transform: translateY(-2px);
                }

                .btn-control-secondary {
                    background: rgba(100, 116, 139, 0.8);
                    color: #cbd5e1;
                    border-color: rgba(100, 116, 139, 0.5);
                }

                .btn-control-secondary:hover:not(:disabled) {
                    background: rgba(59, 130, 246, 0.8);
                    color: #ffffff;
                    border-color: #3b82f6;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
                }

                .btn-control:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: rgba(100, 116, 139, 0.3);
                    color: rgba(203, 213, 225, 0.6);
                    border-color: rgba(100, 116, 139, 0.3);
                    transform: none;
                    box-shadow: none;
                    pointer-events: none;
                }

                .btn-control .btn-icon {
                    flex-shrink: 0;
                }

                .btn-control .btn-text {
                    font-weight: 600;
                    letter-spacing: 0.025em;
                }

                /* Animations */
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.7;
                        transform: scale(1.1);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive adjustments for very small screens */
                @media (max-width: 480px) {
                    .disassembly-instructions {
                        top: 0.5rem;
                        left: 0.5rem;
                        right: 0.5rem;
                        padding: 0.875rem;
                        border-radius: 10px;
                    }

                    .status-indicator {
                        top: 0.5rem;
                        right: 0.5rem;
                        padding: 0.875rem;
                        border-radius: 10px;
                        min-width: 180px;
                    }

                    .ai-assistant-btn {
                        top: 0.5rem;
                        font-size: 0.75rem;
                        padding: 0.625rem 1rem;
                        border-radius: 14px;
                    }
                    
                    .control-buttons {
                        bottom: 0.5rem;
                        left: 0.5rem;
                        right: 0.5rem;
                        transform: none;
                        gap: 0.5rem;
                        // padding: 0.75rem;
                        border-radius: 10px;
                        min-width: calc(100vw - 1rem);
                    }

                    .btn-control {
                        height: 2.25rem;
                        font-size: 0.75rem;
                        gap: 0.25rem;
                        padding: 0 0.5rem;
                        border-radius: 8px;
                    }

                    .show-controls-btn, .show-status-btn {
                        bottom: 5rem;
                        padding: 0.625rem 0.875rem;
                        font-size: 0.7rem;
                        border-radius: 16px;
                    }

                    .show-controls-btn {
                        left: 0.5rem;
                    }

                    .show-status-btn {
                        right: 0.5rem;
                    }

                    .status-label {
                        font-size: 0.65rem;
                    }

                    .status-value {
                        font-size: 0.7rem;
                    }

                    .distance-number-input {
                        width: 50px;
                        height: 18px;
                        font-size: 0.65rem;
                    }

                    .distance-value, .opacity-value {
                        font-size: 0.6rem;
                        min-width: 1.75rem;
                    }

                    .color-picker {
                        width: 24px;
                        height: 18px;
                    }
                }

                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    .disassembly-instructions,
                    .status-indicator {
                        border-width: 2px;
                        box-shadow: none;
                    }

                    .btn-control {
                        border-width: 2px;
                    }

                    .instructions-close-btn,
                    .status-close-btn,
                    .show-controls-btn,
                    .show-status-btn {
                        border-width: 2px;
                    }
                }

                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }

                /* Print styles */
                @media print {
                    .disassembly-instructions,
                    .status-indicator,
                    .ai-assistant-btn,
                    .control-buttons,
                    .show-controls-btn,
                    .show-status-btn {
                        display: none !important;
                    }
                }
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                    display: block !important;
                    visibility: visible !important;
                        }
            `}</style>
        </>
    );
}
