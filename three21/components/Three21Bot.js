import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import AIPromptGenerator from './AIPromptGenerator';
import { ScreenshotManager } from './ScreenshotManager';
import chatStorageManager from './ChatStorageManager';
export default function Three21Bot({ 
    isOpen, 
    onClose, 
    modelInfo, 
    demoConfig = null,
    selectedPart, 
    onScreenshot,
    sceneAnalysis = null,
    autoScreenshot = null
}) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [screenshot, setScreenshot] = useState(autoScreenshot);
    const [chatLoaded, setChatLoaded] = useState(false);
    const [aiPromptGenerator] = useState(() => new AIPromptGenerator());
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Load existing chat when component opens
    useEffect(() => {
        if (isOpen && !chatLoaded && (modelInfo || demoConfig)) {
            loadExistingChat();
        }
    }, [isOpen, modelInfo, demoConfig, chatLoaded]);

    // Save chat when messages change
    useEffect(() => {
        if (chatLoaded && messages.length > 0 && (modelInfo || demoConfig)) {
            saveChatToStorage();
        }
    }, [messages, chatLoaded, modelInfo, demoConfig]);

    const loadExistingChat = async () => {
        try {
            // Use demo config or regular model info for chat loading
            const chatModelInfo = demoConfig || modelInfo;
            const existingMessages = await chatStorageManager.loadChatForModel(chatModelInfo);
            if (existingMessages.length > 0) {
                setMessages(existingMessages);
                console.log(`Loaded ${existingMessages.length} existing messages`);
            } else {
                // No existing chat, show initial greeting
                showInitialGreeting();
            }
            setChatLoaded(true);
        } catch (error) {
            console.error('Failed to load existing chat:', error);
            showInitialGreeting();
            setChatLoaded(true);
        }
    };

    const saveChatToStorage = async () => {
        try {
            // Use demo config or regular model info for chat saving
            const chatModelInfo = demoConfig || modelInfo;
            await chatStorageManager.saveChatForModel(chatModelInfo, messages);
        } catch (error) {
            console.error('Failed to save chat:', error);
        }
    };

    const clearChatHistory = async () => {
        try {
            // Use demo config or regular model info for chat clearing
            const chatModelInfo = demoConfig || modelInfo;
            await chatStorageManager.clearChatForModel(chatModelInfo);
            setMessages([]);
            showInitialGreeting();
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    };

    const showInitialGreeting = () => {
        // Get model info from demo config or regular model info
        const currentModelInfo = demoConfig || modelInfo;
        
        const greeting = {
            role: 'assistant',
            content: `# 🤖 Three21Bot - Advanced 3D Model Analysis Assistant

Welcome! I'm your specialized AI assistant for comprehensive 3D model analysis and reverse engineering.

${currentModelInfo ? `## Current Model: **${currentModelInfo.name || currentModelInfo.filename || 'Unnamed Model'}**
${currentModelInfo.description ? `*${currentModelInfo.description.substring(0, 200)}${currentModelInfo.description.length > 200 ? '...' : ''}*` : ''}

**📋 Model Details:**
${currentModelInfo.category ? `- **Category:** ${currentModelInfo.category}` : ''}
${currentModelInfo.manufacturer ? `- **Manufacturer:** ${currentModelInfo.manufacturer}` : ''}
${currentModelInfo.material ? `- **Material:** ${currentModelInfo.material}` : ''}
${currentModelInfo.purpose ? `- **Purpose:** ${currentModelInfo.purpose}` : ''}
${currentModelInfo.complexity ? `- **Complexity:** ${currentModelInfo.complexity}` : ''}
${currentModelInfo.tags && currentModelInfo.tags.length > 0 ? `- **Tags:** ${currentModelInfo.tags.slice(0, 5).join(', ')}${currentModelInfo.tags.length > 5 ? '...' : ''}` : ''}

` : ''}**🔬 Enhanced Analysis Capabilities:**
- 📷 **Visual Analysis** - Automated screenshot analysis (excluding UI elements)
- 🔍 **Component-Level Insights** - Click any part for detailed analysis
- ⚙️ **Reverse Engineering** - Manufacturing methods & design intent
- 📐 **Technical Documentation** - Standards, citations & references
- 🎯 **Research-Grade Output** - Academic quality insights with sources
- 🔗 **Study Resources** - Links to relevant research and documentation

**📊 Analysis Status:**
${autoScreenshot ? '✅ Auto-screenshot captured for reference' : '📷 Screenshot available on request'}
${selectedPart ? `🎯 Selected: ${selectedPart.name || 'Component'}` : '👆 Click any model part for component analysis'}
${sceneAnalysis ? `🔧 Scene analyzed: ${sceneAnalysis.meshCount} components` : ''}

**💡 Pro Tips:**
- I focus ONLY on your 3D model (UI elements are ignored in screenshots)
- Your model description helps me provide more accurate analysis
- Ask for study links and references for research purposes
- I can analyze manufacturing methods, materials, and design decisions
- All chats are saved locally for this specific model

What aspect of your model would you like to explore first?`,
            timestamp: Date.now()
        };
        
        setMessages([greeting]);
    };

    // Load existing chat when component opens or model changes
    useEffect(() => {
        if (isOpen && (modelInfo || demoConfig)) {
            loadExistingChat();
        } else if (isOpen && !modelInfo && !demoConfig) {
            showInitialGreeting();
        }
    }, [isOpen, modelInfo, demoConfig, autoScreenshot, selectedPart, sceneAnalysis]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const captureScreenshot = async () => {
        try {
            if (onScreenshot) {
                const screenshotData = await onScreenshot();
                setScreenshot(screenshotData);
                return screenshotData;
            }
            return null;
        } catch (error) {
            console.error('Screenshot failed:', error);
            return null;
        }
    };

    const sendMessage = async (messageText, includeScreenshot = false) => {
        if (!messageText.trim() && !includeScreenshot) return;

        setIsLoading(true);
        
        let screenshotData = screenshot;
        if (includeScreenshot && !screenshotData) {
            screenshotData = await captureScreenshot();
        }

        // Keep user message simple and clean
        const userMessage = {
            role: 'user',
            content: messageText || (includeScreenshot ? 'Please analyze this screenshot of the model' : ''),
            timestamp: Date.now(),
            hasScreenshot: !!screenshotData
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputMessage('');

        try {
            // Send clean request - let the API handle the system prompt enhancement
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    modelInfo: demoConfig || modelInfo,  // Use demo config when available
                    selectedPart,
                    screenshot: screenshotData,
                    sceneAnalysis,
                    analysisContext: {
                        excludeUIElements: true,
                        focusOnModel: true,
                        researchGrade: true,
                        provideCitations: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage = {
                role: 'assistant',
                content: data.content,
                timestamp: Date.now(),
                citations: data.citations || [],
                references: data.references || []
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            // Clear screenshot after use
            if (screenshotData) {
                setScreenshot(null);
            }

        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: `❌ **Analysis Error**: ${error.message}

**Troubleshooting:**
- Ensure your model is fully loaded
- Try taking a new screenshot
- Check your internet connection
- Simplify your question and try again

The AI focuses on technical analysis of your 3D model. Please rephrase your question or try a screenshot-based analysis.`,
                timestamp: Date.now(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const handleScreenshotAnalysis = async () => {
        await sendMessage('', true);
    };

    if (!isOpen) return null;

    return (
        <div className="three21-bot-overlay">
            <div className="three21-bot-container" ref={chatContainerRef}>
                {/* Header */}
                <div className="three21-bot-header">
                    <div className="header-content">
                        <div className="bot-avatar">
                            <span>🤖</span>
                        </div>
                        <div className="bot-info">
                            <h3>Three21Bot</h3>
                            <span className="bot-status">
                                {isLoading ? '🔄 Analyzing...' : '✅ Ready'}
                            </span>
                        </div>
                        {selectedPart && (
                            <div className="selected-part">
                                <span>🎯 Focus: {typeof selectedPart === 'object' ? selectedPart.name : selectedPart}</span>
                            </div>
                        )}
                    </div>
                    <button className="close-button" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="three21-bot-messages">
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.role}`}>
                            <div className="message-content">
                                {message.role === 'assistant' ? (
                                    <ReactMarkdown 
                                        components={{
                                            h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
                                            h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
                                            h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
                                            p: ({children}) => <p className="markdown-p">{children}</p>,
                                            ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
                                            li: ({children}) => <li className="markdown-li">{children}</li>,
                                            strong: ({children}) => <strong className="markdown-strong">{children}</strong>,
                                            code: ({children}) => <code className="markdown-code">{children}</code>,
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                ) : (
                                    <div>
                                        {message.content}
                                        {message.hasScreenshot && (
                                            <div className="screenshot-indicator">
                                                📷 Screenshot included
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="message-timestamp">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="three21-bot-input">
                    <div className="quick-actions">
                        <button 
                            className="quick-action-btn screenshot-btn"
                            onClick={handleScreenshotAnalysis}
                            disabled={isLoading}
                        >
                            📷 Analyze Current View
                        </button>
                        {screenshot && (
                            <span className="screenshot-ready">📷 Screenshot ready</span>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="input-form">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask about the model, parts, or engineering insights..."
                            disabled={isLoading}
                            className="message-input"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !inputMessage.trim()}
                            className="send-button"
                        >
                            {isLoading ? '⏳' : '➤'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .three21-bot-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    animation: overlayFadeIn 0.4s ease;
                }

                @keyframes overlayFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .three21-bot-container {
                    width: 100%;
                    max-width: 56rem;
                    height: 85vh;
                    background: #1f2937;
                    border: 1px solid #374151;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    animation: containerSlideIn 0.3s ease;
                }

                .three21-bot-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #3b82f6;
                }

                @keyframes containerSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .three21-bot-header {
                    background: #111827;
                    border-bottom: 1px solid #374151;
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .three21-bot-header::before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #3b82f6;
                    opacity: 0.2;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }

                .bot-avatar {
                    width: 3rem;
                    height: 3rem;
                    background: #3b82f6;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .bot-info h3 {
                    color: #f9fafb;
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 700;
                }

                .bot-status {
                    color: #9ca3af;
                    font-size: 0.8rem;
                    display: block;
                    margin-top: 0.25rem;
                    font-weight: 500;
                }

                .selected-part {
                    background: #eff6ff;
                    border: 1px solid #dbeafe;
                    padding: 0.5rem 0.875rem;
                    border-radius: 12px;
                    color: #3b82f6;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .close-button {
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    color: #6b7280;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-button:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .three21-bot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: #1f2937;
                }

                .message {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }

                .message.user {
                    align-items: flex-end;
                }

                .message.assistant {
                    align-items: flex-start;
                }

                .message-content {
                    max-width: 85%;
                    padding: 1rem 1.25rem;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    line-height: 1.5;
                }

                .message.user .message-content {
                    background: #3b82f6;
                    color: white;
                    border-bottom-right-radius: 6px;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .message.assistant .message-content {
                    background: #111827;
                    color: #f9fafb;
                    border: 1px solid #374151;
                    border-bottom-left-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .message-timestamp {
                    font-size: 0.7rem;
                    color: #9ca3af;
                    margin: 0 1.25rem;
                    font-weight: 500;
                }

                .screenshot-indicator {
                    margin-top: 0.75rem;
                    padding: 0.5rem 0.875rem;
                    background: #eff6ff;
                    border: 1px solid #dbeafe;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    color: #3b82f6;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .typing-indicator {
                    display: flex;
                    gap: 0.375rem;
                    align-items: center;
                    padding: 1rem;
                }

                .typing-indicator span {
                    width: 0.5rem;
                    height: 0.5rem;
                    background: #3b82f6;
                    border-radius: 50%;
                    animation: typingBounce 1.4s infinite ease-in-out;
                }

                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes typingBounce {
                    0%, 80%, 100% { 
                        opacity: 0.4; 
                        transform: scale(0.8) translateY(0);
                    }
                    40% { 
                        opacity: 1; 
                        transform: scale(1.1) translateY(-4px);
                    }
                }

                .three21-bot-input {
                    background: #111827;
                    border-top: 1px solid #374151;
                    padding: 1rem 1.5rem;
                }

                .quick-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .quick-action-btn {
                    background: #1f2937;
                    border: 1px solid #374151;
                    color: #f9fafb;
                    padding: 0.5rem 0.875rem;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .quick-action-btn:hover:not(:disabled) {
                    background: #374151;
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .quick-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .screenshot-ready {
                    color: #10b981;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .input-form {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-end;
                }

                .message-input {
                    flex: 1;
                    background: #1f2937;
                    border: 1px solid #374151;
                    border-radius: 14px;
                    padding: 0.875rem 1rem;
                    color: #f9fafb;
                    font-size: 0.8rem;
                    outline: none;
                    transition: all 0.2s ease;
                    resize: none;
                    min-height: 2.75rem;
                    max-height: 7rem;
                    line-height: 1.4;
                }

                .message-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }

                .message-input::placeholder {
                    color: #6b7280;
                }

                .send-button {
                    background: #3b82f6;
                    border: none;
                    color: white;
                    width: 2.75rem;
                    height: 2.75rem;
                    border-radius: 14px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
                }

                .send-button:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Enhanced Markdown Styles - Dark Theme */
                .markdown-h1 {
                    color: #f9fafb;
                    font-size: 1.25rem;
                    margin: 0 0 0.75rem 0;
                    font-weight: 700;
                    line-height: 1.3;
                }

                .markdown-h2 {
                    color: #f9fafb;
                    font-size: 1.125rem;
                    margin: 1rem 0 0.5rem 0;
                    font-weight: 600;
                    line-height: 1.3;
                }

                .markdown-h3 {
                    color: #d1d5db;
                    font-size: 0.9rem;
                    margin: 0.75rem 0 0.375rem 0;
                    font-weight: 600;
                    line-height: 1.4;
                }

                .markdown-p {
                    margin: 0.5rem 0;
                    line-height: 1.6;
                    color: #f9fafb;
                }

                .markdown-ul {
                    margin: 0.5rem 0;
                    padding-left: 1.25rem;
                }

                .markdown-li {
                    margin: 0.375rem 0;
                    line-height: 1.5;
                    color: #f9fafb;
                }

                .markdown-strong {
                    color: #3b82f6;
                    font-weight: 700;
                }

                .markdown-code {
                    background: #374151;
                    color: #d1d5db;
                    padding: 0.2rem 0.4rem;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    border: 1px solid #4b5563;
                }

                /* Custom Scrollbar */
                .three21-bot-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .three21-bot-messages::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 3px;
                }

                .three21-bot-messages::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                    transition: background 0.2s ease;
                }

                .three21-bot-messages::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }

                /* Mobile-First Responsive Design */
                @media (max-width: 768px) {
                    .three21-bot-overlay {
                        padding: 0.5rem;
                    }
                    
                    .three21-bot-container {
                        height: 98vh;
                        border-radius: 16px;
                        max-width: none;
                    }
                    
                    .three21-bot-header {
                        padding: 0.75rem 1rem;
                    }
                    
                    .three21-bot-messages {
                        padding: 0.75rem 1rem;
                        gap: 1rem;
                    }
                    
                    .three21-bot-input {
                        padding: 0.75rem 1rem;
                    }
                    
                    .message-content {
                        max-width: 98%;
                        padding: 0.75rem 1rem;
                        font-size: 0.8rem;
                        line-height: 1.5;
                    }
                    
                    .header-content {
                        gap: 0.5rem;
                    }
                    
                    .selected-part {
                        display: none;
                    }
                    
                    .quick-actions {
                        gap: 0.375rem;
                        margin-bottom: 0.75rem;
                    }
                    
                    .bot-avatar {
                        width: 2.5rem;
                        height: 2.5rem;
                        font-size: 1rem;
                        border-radius: 12px;
                    }
                    
                    .bot-info h3 {
                        font-size: 1rem;
                    }
                    
                    .bot-status {
                        font-size: 0.75rem;
                    }
                    
                    .close-button {
                        width: 2rem;
                        height: 2rem;
                        font-size: 0.875rem;
                        border-radius: 10px;
                    }
                    
                    .quick-action-btn {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.75rem;
                    }
                    
                    .message-input {
                        padding: 0.75rem 1rem;
                        font-size: 0.8rem;
                        min-height: 2.5rem;
                        border-radius: 12px;
                    }
                    
                    .send-button {
                        width: 2.5rem;
                        height: 2.5rem;
                        font-size: 1rem;
                        border-radius: 12px;
                    }
                    
                    .input-form {
                        gap: 0.5rem;
                    }
                    
                    .message-timestamp {
                        font-size: 0.65rem;
                        margin: 0 1rem;
                    }
                    
                    .screenshot-indicator {
                        margin-top: 0.5rem;
                        padding: 0.375rem 0.625rem;
                        font-size: 0.7rem;
                        border-radius: 8px;
                    }
                    
                    .screenshot-ready {
                        font-size: 0.7rem;
                    }
                    
                    /* Enhanced Markdown Mobile Styles */
                    .markdown-h1 {
                        font-size: 1.125rem;
                        margin: 0 0 0.5rem 0;
                    }
                    
                    .markdown-h2 {
                        font-size: 1rem;
                        margin: 1rem 0 0.5rem 0;
                    }
                    
                    .markdown-h3 {
                        font-size: 0.875rem;
                        margin: 0.75rem 0 0.375rem 0;
                    }
                    
                    .markdown-p {
                        margin: 0.5rem 0;
                        line-height: 1.5;
                        font-size: 0.8rem;
                    }
                    
                    .markdown-ul {
                        margin: 0.5rem 0;
                        padding-left: 1rem;
                    }
                    
                    .markdown-li {
                        margin: 0.25rem 0;
                        line-height: 1.4;
                        font-size: 0.8rem;
                    }
                    
                    .markdown-code {
                        padding: 0.125rem 0.375rem;
                        font-size: 0.7rem;
                        border-radius: 4px;
                    }
                    
                    .typing-indicator {
                        padding: 0.5rem;
                    }
                    
                    .typing-indicator span {
                        width: 0.375rem;
                        height: 0.375rem;
                    }
                }
                
                /* Extra small screens */
                @media (max-width: 480px) {
                    .three21-bot-overlay {
                        padding: 0.25rem;
                    }
                    
                    .three21-bot-container {
                        height: 100vh;
                        border-radius: 12px;
                    }
                    
                    .three21-bot-header {
                        padding: 0.5rem 0.75rem;
                    }
                    
                    .three21-bot-messages {
                        padding: 0.5rem 0.75rem;
                        gap: 0.75rem;
                    }
                    
                    .three21-bot-input {
                        padding: 0.5rem 0.75rem;
                    }
                    
                    .message-content {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.75rem;
                        line-height: 1.4;
                    }
                    
                    .bot-avatar {
                        width: 2rem;
                        height: 2rem;
                        font-size: 0.875rem;
                        border-radius: 10px;
                    }
                    
                    .bot-info h3 {
                        font-size: 0.875rem;
                    }
                    
                    .bot-status {
                        font-size: 0.65rem;
                    }
                    
                    .close-button {
                        width: 1.75rem;
                        height: 1.75rem;
                        font-size: 0.75rem;
                        border-radius: 8px;
                    }
                    
                    .quick-action-btn {
                        padding: 0.375rem 0.5rem;
                        font-size: 0.65rem;
                    }
                    
                    .message-input {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.75rem;
                        min-height: 2.25rem;
                        border-radius: 10px;
                    }
                    
                    .send-button {
                        width: 2.25rem;
                        height: 2.25rem;
                        font-size: 0.875rem;
                        border-radius: 10px;
                    }
                    
                    .quick-actions {
                        margin-bottom: 0.5rem;
                    }
                    
                    .message-timestamp {
                        font-size: 0.6rem;
                        margin: 0 0.75rem;
                    }
                    
                    /* Ultra-compact markdown for tiny screens */
                    .markdown-h1 {
                        font-size: 1rem;
                        margin: 0 0 0.375rem 0;
                    }
                    
                    .markdown-h2 {
                        font-size: 0.875rem;
                        margin: 0.75rem 0 0.375rem 0;
                    }
                    
                    .markdown-h3 {
                        font-size: 0.8rem;
                        margin: 0.5rem 0 0.25rem 0;
                    }
                    
                    .markdown-p {
                        margin: 0.375rem 0;
                        line-height: 1.4;
                        font-size: 0.75rem;
                    }
                    
                    .markdown-li {
                        margin: 0.125rem 0;
                        font-size: 0.75rem;
                    }
                    
                    .markdown-ul {
                        padding-left: 0.75rem;
                    }
                    
                    .markdown-code {
                        font-size: 0.65rem;
                        padding: 0.1rem 0.25rem;
                    }
                }

            `}</style>
        </div>
    );
}
