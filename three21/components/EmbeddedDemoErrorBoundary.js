import React from 'react';

class EmbeddedDemoErrorBoundary extends React.Component {
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
        console.error('EmbeddedDemoViewer Error:', error);
        console.error('Error Info:', errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-fallback">
                    <div className="error-content">
                        <div className="error-icon">⚠️</div>
                        <h3>3D Model Loading Error</h3>
                        <p>The embedded model viewer encountered an error.</p>
                        <button 
                            className="retry-button"
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                                window.location.reload();
                            }}
                        >
                            Reload Page
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Technical Details</summary>
                                <pre>{this.state.error && this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                    </div>
                    
                    <style jsx>{`
                        .error-boundary-fallback {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            height: 100%;
                            background: var(--background);
                            border-radius: var(--radius);
                            border: 1px solid var(--border);
                        }

                        .error-content {
                            text-align: center;
                            padding: 2rem;
                            max-width: 400px;
                        }

                        .error-icon {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                        }

                        .error-content h3 {
                            color: var(--foreground);
                            margin-bottom: 0.5rem;
                            font-size: 1.25rem;
                            font-weight: 600;
                        }

                        .error-content p {
                            color: var(--muted-foreground);
                            margin-bottom: 1.5rem;
                            line-height: 1.5;
                        }

                        .retry-button {
                            background: var(--primary);
                            color: var(--primary-foreground);
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: var(--radius);
                            font-weight: 500;
                            cursor: pointer;
                            transition: background 0.2s;
                        }

                        .retry-button:hover {
                            background: var(--primary-hover);
                        }

                        .error-details {
                            margin-top: 1rem;
                            text-align: left;
                        }

                        .error-details summary {
                            cursor: pointer;
                            color: var(--muted-foreground);
                            margin-bottom: 0.5rem;
                        }

                        .error-details pre {
                            background: var(--muted);
                            padding: 0.75rem;
                            border-radius: var(--radius);
                            font-size: 0.75rem;
                            overflow-x: auto;
                            white-space: pre-wrap;
                            color: var(--foreground);
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default EmbeddedDemoErrorBoundary;
