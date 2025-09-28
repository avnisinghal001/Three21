import React from 'react';

class ModelErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('Model Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{ 
                    width: '100vw', 
                    height: '100vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%, #000000 100%)',
                    color: '#ffffff',
                    padding: '2rem'
                }}>
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '2rem', 
                        borderRadius: '12px',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>
                            Model Loading Error
                        </h2>
                        <p style={{ marginBottom: '1rem', color: '#cccccc' }}>
                            There was an error loading or displaying the 3D model. This could be due to:
                        </p>
                        <ul style={{ 
                            textAlign: 'left', 
                            color: '#aaaaaa', 
                            marginBottom: '2rem',
                            listStyle: 'disc',
                            paddingLeft: '2rem'
                        }}>
                            <li>Corrupted or invalid model file</li>
                            <li>Unsupported file format features</li>
                            <li>WebGL context issues</li>
                            <li>Browser compatibility problems</li>
                        </ul>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginRight: '1rem'
                            }}
                        >
                            Reload Page
                        </button>
                        <button 
                            onClick={() => window.history.back()} 
                            style={{
                                background: 'transparent',
                                color: '#ffffff',
                                border: '2px solid #ffffff',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Go Back
                        </button>
                        {this.state.error && (
                            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', color: '#ffab91' }}>
                                    Technical Details
                                </summary>
                                <pre style={{ 
                                    background: 'rgba(0, 0, 0, 0.3)', 
                                    padding: '1rem', 
                                    borderRadius: '4px',
                                    marginTop: '0.5rem',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    maxHeight: '200px'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ModelErrorBoundary;
