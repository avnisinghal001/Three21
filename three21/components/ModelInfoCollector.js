import { useState } from 'react';

export function ModelInfoCollector({ 
    fileName, 
    fileType, 
    onSubmit, 
    onSkip,
    isLoading 
}) {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [purpose, setPurpose] = useState('');
    const [complexity, setComplexity] = useState('medium');
    const [tags, setTags] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!description.trim()) {
            alert('Please provide a description of your model');
            return;
        }
        if (!category) {
            alert('Please select a category for your model');
            return;
        }
        if (!purpose) {
            alert('Please select a purpose for your model analysis');
            return;
        }
        if (!tags.trim()) {
            alert('Please provide at least one tag for your model');
            return;
        }
        
        const modelInfo = {
            filename: fileName,
            type: fileType,
            description: description.trim(),
            category: category.trim(),
            purpose: purpose.trim(),
            complexity,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            userProvided: true
        };
        onSubmit(modelInfo);
    };

    const handleSkip = () => {
        const basicInfo = {
            filename: fileName,
            type: fileType,
            userProvided: false
        };
        onSkip(basicInfo);
    };

    const categories = [
        'Mechanical Parts', 'Electronics', 'Automotive', 'Architecture', 
        'Furniture', 'Tools', 'Toys', 'Medical', 'Aerospace', 'Other'
    ];

    const purposes = [
        'Prototyping', 'Analysis', 'Reverse Engineering', 'Education', 
        'Manufacturing', 'Visualization', 'Documentation', 'Other'
    ];

    return (
        <div className="model-info-overlay">
            <div className="model-info-container">
                <div className="model-info-header">
                    <div className="header-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h2>Model Information *</h2>
                    <p>Provide detailed information for enhanced AI analysis and research-grade insights</p>
                    <div className="importance-note">
                        <strong>⚠️ Required:</strong> All fields below are mandatory for optimal AI analysis quality
                    </div>
                </div>

                <div className="file-preview-card">
                    <div className="file-preview-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </div>
                    <div className="file-preview-details">
                        <h3>{fileName}</h3>
                        <span className="file-type-badge">{fileType.toUpperCase()}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="model-info-form">
                    <div className="form-section">
                        <label className="form-label">
                            Description *
                            <span className="form-label-required">Required</span>
                        </label>
                        <textarea
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this model represents, its function, and key features..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-section">
                            <label className="form-label">Category *</label>
                            <select 
                                className="form-select"
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="">Select category...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-section">
                            <label className="form-label">Purpose *</label>
                            <select 
                                className="form-select"
                                value={purpose} 
                                onChange={(e) => setPurpose(e.target.value)}
                                required
                            >
                                <option value="">Select purpose...</option>
                                {purposes.map(purp => (
                                    <option key={purp} value={purp}>{purp}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Complexity Level *</label>
                        <div className="complexity-grid">
                            {[
                                { value: 'simple', label: 'Simple', desc: 'Basic shapes, few parts', icon: '●' },
                                { value: 'medium', label: 'Medium', desc: 'Multiple components', icon: '●●' },
                                { value: 'complex', label: 'Complex', desc: 'Highly detailed, many parts', icon: '●●●' }
                            ].map(({ value, label, desc, icon }) => (
                                <label key={value} className={`complexity-card ${complexity === value ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        value={value}
                                        checked={complexity === value}
                                        onChange={(e) => setComplexity(e.target.value)}
                                        className="complexity-radio"
                                    />
                                    <div className="complexity-indicator">{icon}</div>
                                    <div className="complexity-info">
                                        <span className="complexity-title">{label}</span>
                                        <span className="complexity-desc">{desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">
                            Tags *
                            <span className="form-label-required">Required</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="mechanical, automotive, engine, gear, assembly..."
                            required
                        />
                        <div className="form-hint">
                            Add relevant keywords separated by commas (helps AI provide better analysis)
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            onClick={handleSkip}
                            className="btn btn-ghost"
                            disabled={isLoading}
                        >
                            Skip for now
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue Analysis
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14m-7-7l7 7-7 7"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="ai-features-card">
                    <div className="ai-features-header">
                        <div className="ai-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                        </div>
                        <h4>Enhanced AI Analysis with Your Input</h4>
                    </div>
                    <ul className="ai-features-list">
                        <li><strong>Description</strong>: Guides AI focus and analysis approach</li>
                        <li><strong>Category</strong>: Applies domain-specific engineering knowledge</li>
                        <li><strong>Purpose</strong>: Tailors insights for your specific goals</li>
                        <li><strong>Tags</strong>: Incorporates relevant technical expertise</li>
                        <li><strong>Complexity</strong>: Adjusts analysis depth and detail</li>
                    </ul>
                    <div className="quality-note">
                        🎯 <strong>Research-Grade Analysis:</strong> Complete information enables citations, standards references, and industry-specific insights
                    </div>
                </div>
            </div>
        </div>
    );
}
