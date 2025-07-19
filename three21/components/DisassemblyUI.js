import { useState, useEffect } from 'react';

export function DisassemblyUI({ currentLayer, totalLayers, isAnimating, onOpenAI, separationDistance = 0.2, onSeparationDistanceChange }) {
    const [showInstructions, setShowInstructions] = useState(true);

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
                <div className="disassembly-instructions">
                    <div className="instructions-header">
                        <div className="instructions-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                        </div>
                        <h3>Disassembly Controls</h3>
                    </div>
                    
                    <div className="instructions-content">
                        <div className="control-item">
                            <kbd className="key-badge">E</kbd>
                            <span>Disassemble next layer</span>
                        </div>
                        <div className="control-item">
                            <kbd className="key-badge">Q</kbd>
                            <span>Reassemble previous layer</span>
                        </div>
                        <div className="instructions-note">
                            Model will disassemble layer by layer outward from each parent's center. Use the separation slider in the status panel to adjust how far parts move during disassembly.
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowInstructions(false)}
                        className="instructions-close-btn"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        Hide
                    </button>
                </div>
            )}

            {/* AI Assistant Button */}
            <button
                onClick={onOpenAI}
                className="ai-assistant-btn"
            >
                <div className="ai-btn-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <span>Three21Bot AI</span>
            </button>

            {/* Status Indicator */}
            <div className="status-indicator">
                <div className="status-row">
                    <span className="status-label">Status:</span>
                    <div className="status-value">
                        {isAnimating ? (
                            <>
                                <div className="status-spinner"></div>
                                Animating
                            </>
                        ) : (
                            <>
                                <div className="status-dot status-ready"></div>
                                Ready
                            </>
                        )}
                    </div>
                </div>
                
                <div className="status-row">
                    <span className="status-label">Layer:</span>
                    <span className="status-value">{currentLayer} / {totalLayers}</span>
                </div>
                
                {/* Separation Distance Control */}
                <div className="status-row">
                    <span className="status-label">Separation:</span>
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
                            style={{ width: '80px', marginLeft: '8px' }}
                        />
                        <span className="distance-value">{Number(separationDistance).toFixed(2)}</span>
                    </div>
                </div>
                
                {totalLayers > 0 && (
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{
                                    width: `${(currentLayer / totalLayers) * 100}%`
                                }}
                            />
                        </div>
                        <span className="progress-text">{Math.round((currentLayer / totalLayers) * 100)}%</span>
                    </div>
                )}
            </div>

            {/* Assemble/Disassemble Control Buttons */}
            <div className="control-buttons">
                <button
                    className={`btn-control ${currentLayer <= 0 ? 'btn-control-active' : 'btn-control-secondary'}`}
                    onClick={handleAssemble}
                    disabled={currentLayer <= 0 || isAnimating}
                >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="btn-text">Assemble</span>
                </button>
                <button
                    className={`btn-control ${currentLayer >= totalLayers ? 'btn-control-secondary' : 'btn-control-active'}`}
                    onClick={handleDisassemble}
                    disabled={currentLayer >= totalLayers || isAnimating}
                >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    <span className="btn-text">Disassemble</span>
                </button>
            </div>

            {/* Show/Hide Instructions Button */}
            {!showInstructions && (
                <button
                    onClick={() => setShowInstructions(true)}
                    className="show-controls-btn"
                    onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                        <path d="M12 17h.01"/>
                    </svg>
                    Show Controls
                </button>
            )}

            <style jsx>{`
                /* Fallback styles for visibility */
                .disassembly-instructions {
                    position: fixed !important;
                    top: 24px !important;
                    left: 24px !important;
                    background: rgba(10, 10, 11, 0.95) !important;
                    border: 1px solid rgba(39, 39, 42, 1) !important;
                    color: #fafafa !important;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .ai-assistant-btn {
                    position: fixed !important;
                    top: 24px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
                    color: #fafafa !important;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    padding: 0.875rem 1.75rem !important;
                    border-radius: 25px !important;
                    font-size: 0.875rem !important;
                    font-weight: 600 !important;
                    border: none !important;
                    cursor: pointer !important;
                    gap: 0.625rem !important;
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
                    align-items: center !important;
                    justify-content: center !important;
                    white-space: nowrap !important;
                }

                .status-indicator {
                    position: fixed !important;
                    top: 24px !important;
                    right: 24px !important;
                    background: rgba(10, 10, 11, 0.95) !important;
                    border: 1px solid rgba(39, 39, 42, 1) !important;
                    color: #fafafa !important;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .show-controls-btn {
                    position: fixed !important;
                    bottom: 24px !important;
                    left: 24px !important;
                    background: rgba(10, 10, 11, 0.95) !important;
                    border: 2px solid rgba(39, 39, 42, 1) !important;
                    color: #fafafa !important;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                /* Enhanced styles with CSS variables */
                .disassembly-instructions {
                    position: fixed;
                    top: 1.5rem;
                    left: 1.5rem;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 2.25rem;
                    max-width: 360px;
                    z-index: 9999;
                    box-shadow: 
                        0 32px 64px -12px rgba(0, 0, 0, 0.35),
                        0 0 0 1px rgba(255, 255, 255, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(24px) saturate(1.8);
                    animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    position: fixed;
                    overflow: hidden;
                    pointer-events: auto;
                }

                .disassembly-instructions::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, 
                        transparent, 
                        var(--primary-accent) 20%, 
                        var(--secondary-accent) 50%, 
                        var(--primary-accent) 80%, 
                        transparent);
                    border-radius: 20px 20px 0 0;
                    animation: gradientShift 3s ease-in-out infinite;
                }

                .disassembly-instructions::after {
                    content: '';
                    position: absolute;
                    top: -100%;
                    left: -100%;
                    width: 300%;
                    height: 300%;
                    background: 
                        radial-gradient(circle at 30% 70%, rgba(var(--primary-rgb), 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 70% 30%, rgba(var(--secondary-rgb), 0.06) 0%, transparent 50%),
                        conic-gradient(from 45deg at 50% 50%, transparent, rgba(var(--accent-rgb), 0.03), transparent);
                    animation: subtleOrbit 20s linear infinite;
                    pointer-events: none;
                }

                @keyframes gradientShift {
                    0%, 100% { 
                        background: linear-gradient(90deg, transparent, var(--primary-accent), transparent);
                    }
                    50% { 
                        background: linear-gradient(90deg, transparent, var(--secondary-accent), transparent);
                    }
                }

                @keyframes subtleOrbit {
                    from { transform: rotate(0deg) scale(1); }
                    to { transform: rotate(360deg) scale(1.1); }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-40px) scale(0.85) rotateY(-15deg);
                        filter: blur(15px) brightness(0.7);
                    }
                    60% {
                        opacity: 0.8;
                        transform: translateX(5px) scale(1.02) rotateY(2deg);
                        filter: blur(2px) brightness(1.1);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1) rotateY(0deg);
                        filter: blur(0px) brightness(1);
                    }
                }

                @keyframes float {
                    0%, 100% { 
                        transform: translate(0%, 0%) rotate(0deg) scale(1); 
                        opacity: 0.03;
                    }
                    25% { 
                        transform: translate(20%, -15%) rotate(90deg) scale(1.1); 
                        opacity: 0.05;
                    }
                    50% { 
                        transform: translate(-10%, 20%) rotate(180deg) scale(0.9); 
                        opacity: 0.02;
                    }
                    75% { 
                        transform: translate(-25%, -10%) rotate(270deg) scale(1.05); 
                        opacity: 0.04;
                    }
                }

                .instructions-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    position: relative;
                }

                .instructions-icon {
                    width: 3rem;
                    height: 3rem;
                    background: var(--gradient-primary);
                    color: var(--primary-foreground);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 
                        0 12px 24px var(--primary-shadow),
                        0 0 0 1px rgba(255, 255, 255, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    animation: iconPulseAdvanced 4s ease-in-out infinite;
                    position: relative;
                    overflow: hidden;
                }

                .instructions-icon::before {
                    content: '';
                    position: absolute;
                    top: -100%;
                    left: -100%;
                    width: 300%;
                    height: 300%;
                    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.15), transparent, rgba(255, 255, 255, 0.1), transparent);
                    animation: conicSpin 6s linear infinite;
                }

                .instructions-icon::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 120%;
                    height: 120%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
                    transform: translate(-50%, -50%);
                    animation: radialPulse 3s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes iconPulseAdvanced {
                    0%, 100% { 
                        transform: scale(1) rotate(0deg);
                        box-shadow: 
                            0 12px 24px var(--primary-shadow),
                            0 0 0 1px rgba(255, 255, 255, 0.1),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }
                    50% { 
                        transform: scale(1.08) rotate(2deg);
                        box-shadow: 
                            0 16px 32px var(--primary-shadow),
                            0 0 0 2px rgba(255, 255, 255, 0.15),
                            inset 0 2px 0 rgba(255, 255, 255, 0.3);
                    }
                }

                @keyframes conicSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes radialPulse {
                    0%, 100% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    50% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                }

                .instructions-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 700;
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                }

                .instructions-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .control-item {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1rem;
                    border-radius: 12px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid transparent;
                }

                .control-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(120deg, 
                        var(--muted) 0%, 
                        rgba(var(--primary-rgb), 0.08) 50%, 
                        var(--muted) 100%);
                    transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: -1;
                }

                .control-item::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: var(--gradient-primary);
                    transition: width 0.4s ease;
                    transform: translateY(-50%);
                    z-index: 1;
                }

                .key-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.5rem;
                    height: 2.5rem;
                    background: linear-gradient(135deg, var(--muted) 0%, var(--card) 100%);
                    border: 2px solid var(--border);
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 800;
                    color: var(--foreground);
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                    box-shadow: 
                        0 4px 0 var(--border),
                        0 8px 16px rgba(0, 0, 0, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .key-badge::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s ease;
                }

                .control-item:hover .key-badge::before {
                    left: 100%;
                }

                .control-item:hover .key-badge {
                    transform: translateY(-2px) rotateZ(-2deg);
                    box-shadow: 
                        0 6px 0 var(--primary-accent),
                        0 12px 24px rgba(var(--primary-rgb), 0.25),
                        inset 0 2px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -2px 0 rgba(0, 0, 0, 0.1);
                    border-color: var(--primary-accent);
                    background: linear-gradient(135deg, 
                        rgba(var(--primary-rgb), 0.1) 0%, 
                        var(--card) 100%);
                }

                .control-item span {
                    font-size: 0.9rem;
                    color: var(--muted-foreground);
                    line-height: 1.5;
                    font-weight: 500;
                }

                .control-item:hover span {
                    color: var(--foreground);
                }

                .instructions-note {
                    font-size: 0.8rem;
                    color: var(--muted-foreground);
                    line-height: 1.6;
                    padding: 1rem;
                    background: var(--muted);
                    border-radius: 10px;
                    border-left: 4px solid var(--primary-accent);
                    position: relative;
                    overflow: hidden;
                }

                .instructions-note::before {
                    content: '💡';
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    font-size: 1rem;
                    opacity: 0.6;
                }

                .instructions-close-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 2px solid var(--border);
                    color: var(--muted-foreground);
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    position: relative;
                    overflow: hidden;
                }

                .instructions-close-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 100%;
                    background: var(--muted);
                    transition: width 0.3s ease;
                    z-index: -1;
                }

                .instructions-close-btn:hover::before {
                    width: 100%;
                }

                .instructions-close-btn:hover {
                    color: var(--foreground);
                    border-color: var(--primary-accent);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .ai-assistant-btn {
                    position: fixed;
                    top: 1.5rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--gradient-primary);
                    border: none;
                    color: var(--primary-foreground);
                    padding: 0.875rem 1.75rem;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                    z-index: 9999;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 8px 25px var(--primary-shadow),
                        0 0 0 1px rgba(255, 255, 255, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    outline: none;
                    position: fixed;
                    overflow: hidden;
                    pointer-events: auto;
                    white-space: nowrap;
                    min-width: fit-content;
                }

                .ai-assistant-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.2), 
                        transparent);
                    transition: left 0.6s ease;
                }

                .ai-assistant-btn:hover::before {
                    left: 100%;
                }

                .ai-assistant-btn:hover {
                    box-shadow: 
                        0 12px 35px var(--primary-shadow),
                        0 0 0 2px rgba(255, 255, 255, 0.15),
                        inset 0 2px 0 rgba(255, 255, 255, 0.25);
                    transform: translateX(-50%) translateY(-2px);
                }

                .ai-btn-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                    position: relative;
                    width: 1.125rem;
                    height: 1.125rem;
                    flex-shrink: 0;
                }

                .ai-btn-icon svg {
                    width: 1.125rem;
                    height: 1.125rem;
                }

                .ai-assistant-btn span {
                    z-index: 1;
                    position: relative;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .status-indicator {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.5rem;
                    z-index: 9999;
                    box-shadow: 
                        0 16px 32px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px) saturate(1.5);
                    min-width: 180px;
                    animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    position: fixed;
                    overflow: hidden;
                    pointer-events: auto;
                }

                .status-indicator::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--gradient-secondary);
                    animation: statusGlow 3s ease-in-out infinite;
                }

                .status-indicator::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(from 0deg, 
                        transparent, 
                        rgba(var(--secondary-rgb), 0.06), 
                        transparent, 
                        rgba(var(--accent-rgb), 0.04), 
                        transparent);
                    animation: statusOrbit 15s linear infinite;
                    pointer-events: none;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(40px) scale(0.85) rotateY(15deg);
                        filter: blur(15px) brightness(0.7);
                    }
                    60% {
                        opacity: 0.8;
                        transform: translateX(-5px) scale(1.02) rotateY(-2deg);
                        filter: blur(2px) brightness(1.1);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1) rotateY(0deg);
                        filter: blur(0px) brightness(1);
                    }
                }

                @keyframes statusGlow {
                    0%, 100% { 
                        opacity: 0.8;
                        background: var(--gradient-secondary);
                    }
                    50% { 
                        opacity: 1;
                        background: var(--gradient-primary);
                    }
                }

                @keyframes statusOrbit {
                    from { transform: rotate(0deg) scale(1); }
                    to { transform: rotate(-360deg) scale(1.1); }
                }

                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    padding: 0.25rem 0;
                }

                .status-row:last-child {
                    margin-bottom: 0;
                }

                .status-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--muted-foreground);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .status-value {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--foreground);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .distance-control {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 120px;
                }

                .distance-slider {
                    flex: 1;
                    height: 4px;
                    background: var(--muted);
                    border-radius: 2px;
                    outline: none;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                    cursor: pointer;
                }

                .distance-slider:hover {
                    opacity: 1;
                }

                .distance-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary-accent);
                    cursor: pointer;
                    border: 2px solid var(--card);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .distance-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.4);
                }

                .distance-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary-accent);
                    cursor: pointer;
                    border: 2px solid var(--card);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .distance-slider:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .distance-slider:disabled::-webkit-slider-thumb {
                    cursor: not-allowed;
                    transform: none;
                }

                .distance-value {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--primary-accent);
                    min-width: 2.5rem;
                    text-align: center;
                    background: rgba(var(--primary-rgb), 0.1);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    position: relative;
                }

                .status-ready {
                    background: var(--success);
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 10px var(--success);
                }

                .status-ready::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid var(--success);
                    animation: ripple 2s ease-in-out infinite;
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

                @keyframes ripple {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }

                .status-spinner {
                    width: 12px;
                    height: 12px;
                    border: 2px solid var(--border);
                    border-top: 2px solid var(--primary-accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .progress-container {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: var(--muted);
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .progress-bar::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.3), 
                        transparent);
                    animation: progressShimmerAdvanced 2.5s ease-in-out infinite;
                }

                @keyframes progressShimmerAdvanced {
                    0% { 
                        transform: translateX(-100%) scaleX(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: translateX(0%) scaleX(1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(100%) scaleX(0.5);
                        opacity: 0;
                    }
                }

                .progress-fill {
                    height: 100%;
                    background: var(--gradient-primary);
                    border-radius: 4px;
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 
                        0 0 12px rgba(var(--primary-rgb), 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.4), 
                        transparent);
                    animation: fillShimmerAdvanced 2s ease-in-out infinite;
                }

                @keyframes fillShimmerAdvanced {
                    0% { 
                        transform: translateX(-120%) skewX(-15deg);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(120%) skewX(-15deg);
                        opacity: 0;
                    }
                }

                .progress-text {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--primary-accent);
                    min-width: 2.5rem;
                    text-align: center;
                }

                .show-controls-btn {
                    position: fixed;
                    bottom: 1.5rem;
                    left: 1.5rem;
                    background: var(--card);
                    border: 2px solid var(--border);
                    color: var(--foreground);
                    padding: 1rem 1.25rem;
                    border-radius: 30px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                    z-index: 9999;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    outline: none;
                    animation: slideInUp 0.5s ease-out;
                    position: fixed;
                    overflow: hidden;
                    pointer-events: auto;
                }

                .show-controls-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 100%;
                    background: var(--gradient-primary);
                    transition: width 0.4s ease;
                    z-index: -1;
                }

                .show-controls-btn:hover::before {
                    width: 100%;
                }

                .show-controls-btn:hover {
                    color: var(--primary-foreground);
                    border-color: var(--primary-accent);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
                    transform: translateY(-3px) scale(1.05);
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .disassembly-instructions {
                        top: 1rem;
                        left: 1rem;
                        right: 1rem;
                        max-width: none;
                        padding: 1.5rem;
                    }

                    .ai-assistant-btn {
                        top: 1rem;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 0.8rem;
                        padding: 0.75rem 1.5rem;
                        border-radius: 20px;
                        gap: 0.5rem;
                    }

                    .ai-assistant-btn:hover {
                        transform: translateX(-50%) translateY(-1px);
                    }

                    .status-indicator {
                        top: 1rem;
                        right: 1rem;
                        padding: 1rem;
                        min-width: 140px;
                    }

                    .show-controls-btn {
                        bottom: 1rem;
                        left: 1rem;
                        font-size: 0.75rem;
                        padding: 0.875rem 1rem;
                    }
                }

                /* Advanced animations for premium feel */
                @media (prefers-reduced-motion: no-preference) {
                    .disassembly-instructions {
                        animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                                   subtleFloat 6s ease-in-out infinite 3s;
                    }
                    
                    .status-indicator {
                        animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                                   subtleFloat 6s ease-in-out infinite 3.5s;
                    }

                    .ai-assistant-btn {
                        animation: subtleFloat 8s ease-in-out infinite 2s;
                    }

                    .control-item {
                        animation: fadeInUp 0.6s ease-out;
                        animation-fill-mode: both;
                    }

                    .control-item:nth-child(1) { animation-delay: 0.1s; }
                    .control-item:nth-child(2) { animation-delay: 0.2s; }
                    .control-item:nth-child(3) { animation-delay: 0.3s; }
                }

                @keyframes subtleFloat {
                    0%, 100% { 
                        transform: translateY(0px) scale(1);
                    }
                    50% { 
                        transform: translateY(-3px) scale(1.005);
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Enhanced micro-interactions */
                .instructions-header h3 {
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                    animation: textShimmer 4s ease-in-out infinite;
                }

                @keyframes textShimmer {
                    0%, 100% {
                        background-position: 0% 50%;
                        filter: brightness(1);
                    }
                    50% {
                        background-position: 100% 50%;
                        filter: brightness(1.2);
                    }
                }

                /* Advanced hover states */
                .disassembly-instructions:hover {
                    transform: scale(1.02);
                    box-shadow: 
                        0 40px 80px -12px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.15);
                }

                .status-indicator:hover {
                    transform: scale(1.02);
                    box-shadow: 
                        0 20px 40px rgba(0, 0, 0, 0.2),
                        0 0 0 1px rgba(255, 255, 255, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.15);
                }

                /* Subtle particle effects */
                .instructions-icon:hover::after {
                    animation: particleExplosion 0.6s ease-out;
                }

                @keyframes particleExplosion {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.5);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(2);
                    }
                }

                /* Control Buttons - Same Style as Demo Viewer */
                .control-buttons {
                    position: fixed;
                    bottom: 2rem;
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

                .btn-control {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    height: 2.75rem;
                    padding: 0 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.1);
                    color: #fafafa;
                    border-radius: 12px;
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

                .btn-control:focus-visible {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .btn-control::before {
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

                .btn-control:hover:not(:disabled) {
                    background: rgba(59, 130, 246, 0.8);
                    color: #ffffff;
                    border-color: #3b82f6;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .btn-control:hover:not(:disabled)::before {
                    left: 100%;
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

                .btn-control:disabled::before {
                    display: none;
                }

                .btn-control .btn-icon {
                    width: 1rem;
                    height: 1rem;
                    stroke-width: 2;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 2;
                }

                .btn-control .btn-text {
                    font-weight: 600;
                    letter-spacing: 0.025em;
                    position: relative;
                    z-index: 2;
                }

                /* Mobile Responsive Design for Control Buttons */
                @media (max-width: 768px) {
                    .control-buttons {
                        bottom: 1rem;
                        left: 1rem;
                        right: 1rem;
                        transform: none;
                        min-width: auto;
                        max-width: none;
                    }

                    .btn-control {
                        height: 2.75rem;
                        font-size: 0.9rem;
                        gap: 0.6rem;
                    }

                    .btn-control .btn-icon {
                        width: 1.1rem;
                        height: 1.1rem;
                    }

                    .btn-control .btn-text {
                        font-size: 0.9rem;
                        font-weight: 600;
                    }
                }

                /* Small Mobile Responsive Design */
                @media (max-width: 480px) {
                    .control-buttons {
                        gap: 0.75rem;
                        padding: 0.875rem;
                        bottom: 0.75rem;
                        left: 0.75rem;
                        right: 0.75rem;
                    }

                    .btn-control {
                        height: 2.5rem;
                        font-size: 0.8rem;
                        gap: 0.5rem;
                    }

                    .btn-control .btn-icon {
                        width: 1rem;
                        height: 1rem;
                    }

                    .btn-control .btn-text {
                        font-size: 0.8rem;
                        font-weight: 700;
                    }
                }
            `}</style>
        </>
    );
}
