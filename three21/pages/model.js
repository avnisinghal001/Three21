import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { get as idbGet } from 'idb-keyval';
import { ModelInfoProvider } from '../components/ModelInfoContext';
import ModelErrorBoundary from '../components/ModelErrorBoundary';
import PersistentVoiceControl from '../components/PersistentVoiceControl';
import VoiceOnboardingModal from '../components/VoiceOnboardingModal';
import VoiceStatusPopup from '../components/VoiceStatusPopup';
import { Toast } from '../components/Toast';

const AnyModelViewer = dynamic(() => import('../components/AnyModelViewer'), { ssr: false });

// Demo model configuration
export const DEMO_CONFIG = {
    url: '/demo.fbx',
    type: 'fbx',
    name: 'Tactical Quadruped Robot Dog – Inspired by Battlefield 2042 & MIT\'s Mini Cheetah',
    filename: 'demo.fbx',
    description: `A high-detail 3D model of a tactical quadruped robot dog, inspired by futuristic combat units from Battlefield 2042, fused with the sleek mechanical design philosophy of MIT's Mini Cheetah. Modeled in Blender and rendered using Cycles, this robotic unit is equipped for battlefield mobility, autonomy, and multi-role deployment. Its design features a sensor-packed head unit, modular armor plating, and actuated leg joints allowing for realistic movement. Built with a central AI core, thermal vision module, and top-mounted payload system, the robot exemplifies the fusion of military-grade engineering with advanced robotics research. This model serves as a concept for next-generation combat robotics—agile, autonomous, and lethal—mirroring current real-world developments in quadruped robotics for tactical applications.`,
    category: 'Military & Defense & Robotics',
    manufacturer: 'Conceptual Design - MIT/Battlefield 2042 Inspired',
    purpose: 'Tactical reconnaissance, battlefield support, autonomous operations',
    complexity: 'Complex',
    tags: ['robot dog', 'battlefield 2042 robot', 'quadruped robot', 'blender robot model', 'MIT mini cheetah', 'sci-fi robot', 'tactical robot dog', 'military robot', 'combat robot', 'autonomous machine', 'future warfare', 'cyberpunk robot', 'mechanical dog', 'defense tech'],
    components: {
        'Optic & Sensor Head Unit': 'Cameras, LIDAR, thermal scopes for battlefield awareness',
        'Central Processing Core': 'AI decision-making unit with tactical algorithms',
        'Upper and Lower Leg Pistons': 'Hydraulic servo-linked limbs for agile movement',
        'Knee & Ankle Joints': 'Fully rigged articulation for complex terrain navigation',
        'Paw Grippers': 'Magnetic and terrain-sensing footpads for enhanced stability',
        'Armor Plating': 'Detachable modular covers for battlefield endurance',
        'Payload Deck': 'Compatible with drones, turrets, or supply modules',
        'Cooling Vent & Exhaust System': 'Thermal regulation for extended operations',
        'Communication Antenna Array': 'For remote synchronization and swarm operations'
    },
    isDemoMode: true
};

export default function ModelPage() {
    const router = useRouter();
    const [fileUrl, setFileUrl] = useState(null);
    const [type, setType] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoConfig, setDemoConfig] = useState(null);
    const [loadingSource, setLoadingSource] = useState('');
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isModelLoadedOnce, setIsModelLoadedOnce] = useState(false);
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    // Voice interface state
    const [showVoiceOnboarding, setShowVoiceOnboarding] = useState(false);
    const [voiceStatusVisible, setVoiceStatusVisible] = useState(false);
    const [voicePreferences, setVoicePreferences] = useState(null);

    // Handle model loading completion
    const handleModelLoad = (scene, scaleInfo) => {
        console.log('🎯 Model loaded successfully!', scene);
        setIsModelLoading(false);
        
        // Show success toast with TTS only once
        if (!isModelLoadedOnce) {
            setIsModelLoadedOnce(true);
            setToast({
                message: '✅ Model loaded successfully!',
                isVisible: true
            });
        }
    };

    // Handle toast dismissal
    const hideToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };
    
    // Refs for AI voice control
    const modelViewerRef = useRef(null);
    const chatInterfaceRef = useRef(null);

    // Voice preferences initialization
    useEffect(() => {
        const checkVoicePreferences = () => {
            const preferences = localStorage.getItem('voicePreferences');
            if (!preferences) {
                setShowVoiceOnboarding(true);
            } else {
                setVoicePreferences(JSON.parse(preferences));
            }
        };
        checkVoicePreferences();
    }, []);

    // Handle voice onboarding completion
    const handleVoiceOnboardingComplete = (preferences) => {
        setVoicePreferences(preferences);
        setShowVoiceOnboarding(false);
        localStorage.setItem('voicePreferences', JSON.stringify(preferences));
    };

    // Show voice status popup
    const showVoiceStatus = (message, type = 'info') => {
        setVoiceStatusVisible(true);
        setTimeout(() => setVoiceStatusVisible(false), 3000);
    };

    // AI Voice Command Event Listeners
    useEffect(() => {
        const handleExpandModel = (event) => {
            console.log('🎯 AI Voice Command: Expand model');
            // Trigger expand/disassemble functionality
            const expandEvent = new CustomEvent('modelExpand', { 
                detail: { action: 'expand', source: 'voice' }
            });
            window.dispatchEvent(expandEvent);
            
            // Also try to trigger via AnyModelViewer ref if available
            if (modelViewerRef.current && modelViewerRef.current.expandModel) {
                modelViewerRef.current.expandModel();
            }
        };

        const handleAssembleModel = (event) => {
            console.log('🎯 AI Voice Command: Assemble model');
            // Trigger assemble functionality
            const assembleEvent = new CustomEvent('modelAssemble', { 
                detail: { action: 'assemble', source: 'voice' }
            });
            window.dispatchEvent(assembleEvent);
            
            // Also try to trigger via AnyModelViewer ref if available
            if (modelViewerRef.current && modelViewerRef.current.assembleModel) {
                modelViewerRef.current.assembleModel();
            }
        };

        const handleToggleChat = (event) => {
            console.log('🎯 AI Voice Command: Toggle chat interface');
            // Trigger chat interface toggle
            const chatEvent = new CustomEvent('toggleChat', { 
                detail: { action: 'toggle', source: 'voice' }
            });
            window.dispatchEvent(chatEvent);
            
            // Also try to trigger via chat interface ref if available
            if (chatInterfaceRef.current && chatInterfaceRef.current.toggle) {
                chatInterfaceRef.current.toggle();
            }
        };

        const handleOpenChat = (event) => {
            console.log('🎯 AI Voice Command: Open chat interface');
            const chatEvent = new CustomEvent('openChat', { 
                detail: { action: 'open', source: 'voice' }
            });
            window.dispatchEvent(chatEvent);
            
            if (chatInterfaceRef.current && chatInterfaceRef.current.open) {
                chatInterfaceRef.current.open();
            }
        };

        const handleCloseChat = (event) => {
            console.log('🎯 AI Voice Command: Close chat interface');
            const chatEvent = new CustomEvent('closeChat', { 
                detail: { action: 'close', source: 'voice' }
            });
            window.dispatchEvent(chatEvent);
            
            if (chatInterfaceRef.current && chatInterfaceRef.current.close) {
                chatInterfaceRef.current.close();
            }
        };

        const handleResetView = (event) => {
            console.log('🎯 AI Voice Command: Reset view');
            const resetEvent = new CustomEvent('resetView', { 
                detail: { action: 'reset', source: 'voice' }
            });
            window.dispatchEvent(resetEvent);
            
            if (modelViewerRef.current && modelViewerRef.current.resetView) {
                modelViewerRef.current.resetView();
            }
        };

        const handleRotateModel = (event) => {
            console.log('🎯 AI Voice Command: Rotate model');
            const rotateEvent = new CustomEvent('rotateModel', { 
                detail: { action: 'rotate', source: 'voice' }
            });
            window.dispatchEvent(rotateEvent);
            
            if (modelViewerRef.current && modelViewerRef.current.rotateModel) {
                modelViewerRef.current.rotateModel();
            }
        };

        const handleZoomIn = (event) => {
            console.log('🎯 AI Voice Command: Zoom in');
            const zoomEvent = new CustomEvent('zoomIn', { 
                detail: { action: 'zoomIn', source: 'voice' }
            });
            window.dispatchEvent(zoomEvent);
            
            if (modelViewerRef.current && modelViewerRef.current.zoomIn) {
                modelViewerRef.current.zoomIn();
            }
        };

        const handleZoomOut = (event) => {
            console.log('🎯 AI Voice Command: Zoom out');
            const zoomEvent = new CustomEvent('zoomOut', { 
                detail: { action: 'zoomOut', source: 'voice' }
            });
            window.dispatchEvent(zoomEvent);
            
            if (modelViewerRef.current && modelViewerRef.current.zoomOut) {
                modelViewerRef.current.zoomOut();
            }
        };

        const handleScreenshot = (event) => {
            console.log('🎯 AI Voice Command: Take screenshot');
            const screenshotEvent = new CustomEvent('takeScreenshot', { 
                detail: { action: 'screenshot', source: 'voice' }
            });
            window.dispatchEvent(screenshotEvent);
            
            if (modelViewerRef.current && modelViewerRef.current.takeScreenshot) {
                modelViewerRef.current.takeScreenshot();
            }
        };

        // Listen for AI voice command events
        window.addEventListener('ai-expand-model', handleExpandModel);
        window.addEventListener('ai-assemble-model', handleAssembleModel);
        window.addEventListener('ai-toggle-chat', handleToggleChat);
        window.addEventListener('ai-open-chat', handleOpenChat);
        window.addEventListener('ai-close-chat', handleCloseChat);
        window.addEventListener('ai-reset-view', handleResetView);
        window.addEventListener('ai-rotate-model', handleRotateModel);
        window.addEventListener('ai-zoom-in', handleZoomIn);
        window.addEventListener('ai-zoom-out', handleZoomOut);
        window.addEventListener('ai-screenshot', handleScreenshot);

        // Cleanup event listeners
        return () => {
            window.removeEventListener('ai-expand-model', handleExpandModel);
            window.removeEventListener('ai-assemble-model', handleAssembleModel);
            window.removeEventListener('ai-toggle-chat', handleToggleChat);
            window.removeEventListener('ai-open-chat', handleOpenChat);
            window.removeEventListener('ai-close-chat', handleCloseChat);
            window.removeEventListener('ai-reset-view', handleResetView);
            window.removeEventListener('ai-rotate-model', handleRotateModel);
            window.removeEventListener('ai-zoom-in', handleZoomIn);
            window.removeEventListener('ai-zoom-out', handleZoomOut);
            window.removeEventListener('ai-screenshot', handleScreenshot);
        };
    }, []);

    useEffect(() => {
        async function loadModel() {
            // Set loading state whenever we start loading a model
            setIsModelLoading(true);
            setIsModelLoadedOnce(false); // Reset the loaded flag for new model
            
            // Check if demo mode is requested
            if (router.isReady && router.query.type === 'demo') {
                setIsDemoMode(true);
                setDemoConfig(DEMO_CONFIG);
                setFileUrl(DEMO_CONFIG.url);
                setType(DEMO_CONFIG.type);
                
                // Check cache status for demo loading feedback
                const checkCacheStatus = () => {
                    const cacheInfo = window.three21DemoCache;
                    if (cacheInfo?.isCached) {
                        setLoadingSource('cache');
                    } else if (cacheInfo?.isReady) {
                        setLoadingSource('network');
                    } else {
                        setLoadingSource('preparing');
                    }
                };
                
                checkCacheStatus();
                
                // Also listen for cache status updates
                const interval = setInterval(() => {
                    checkCacheStatus();
                    const cacheInfo = window.three21DemoCache;
                    if (cacheInfo?.isReady) {
                        clearInterval(interval);
                    }
                }, 100);
                return;
            }

            // Regular model loading logic
            const file = await idbGet('lastModelFile');
            const t = await idbGet('lastModelType');
            if (file && t) {
                setType(t);
                setFileUrl(URL.createObjectURL(file));
            } else if (router.isReady) {
                const url = router.query.file;
                const queryType = router.query.type;
                if (url) {
                    setFileUrl(url);
                    // Determine type from URL extension or query parameter
                    const detectedType = queryType || (url.toLowerCase().includes('.fbx') ? 'fbx' : 'gltf');
                    setType(detectedType);
                    localStorage.setItem('lastModelUrl', url);
                    localStorage.setItem('lastModelType', detectedType);
                } else {
                    const lastUrl = localStorage.getItem('lastModelUrl');
                    const lastType = localStorage.getItem('lastModelType');
                    if (lastUrl && lastType) {
                        setFileUrl(lastUrl);
                        setType(lastType);
                    }
                }
            }
        }
        loadModel();
    }, [router.isReady, router.query.file, router.query.type]);

    if (!fileUrl || !type) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#19202dff',
            }}>
                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '2rem', marginBottom: 12 }}>
                    {isDemoMode ? (
                        loadingSource === 'cache' ? 'Loading Demo Model from Cache...' :
                        loadingSource === 'network' ? 'Downloading Demo Model...' :
                        loadingSource === 'preparing' ? 'Preparing Demo...' :
                        'Loading Demo Model...'
                    ) : 'No model uploaded'}
                </h2>
                {isDemoMode && loadingSource && (
                    <p style={{ 
                        color: '#dededeff', 
                        fontSize: '1rem', 
                        marginBottom: '20px',
                        textAlign: 'center' 
                    }}>
                        {loadingSource === 'cache' && '⚡ Loading instantly from cache'}
                        {loadingSource === 'network' && '🌐 First-time download (will be cached)'}
                        {loadingSource === 'preparing' && '🔧 Initializing service worker'}
                    </p>
                )}
                {!isDemoMode && (
                    <a href="/import-model" style={{
                        padding: '12px 28px',
                        background: '#ffffffff',
                        color: '#1e3c72',
                        fontWeight: 600,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 12px 0 rgba(0,255,208,0.15)',
                        transition: 'background 0.2s',
                    }}>Go to Import Page</a>
                )}
            </div>
        );
    }

    return (
        <>
            <ModelErrorBoundary>
                <ModelInfoProvider demoConfig={isDemoMode ? DEMO_CONFIG : null}>
                    <AnyModelViewer 
                        ref={modelViewerRef}
                        url={fileUrl} 
                        type={type} 
                        isDemoMode={isDemoMode}
                        demoConfig={isDemoMode ? DEMO_CONFIG : null}
                        onModelLoad={handleModelLoad}
                    />
                </ModelInfoProvider>
            </ModelErrorBoundary>

            {/* Loading Overlay */}
            {isModelLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    color: '#fff'
                }}>
                    {/* Spinning loader animation */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        border: '3px solid rgba(255, 255, 255, 0.2)',
                        borderTop: '3px solid #00ffd0',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '24px'
                    }}></div>
                    
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '8px',
                        textAlign: 'center'
                    }}>
                        {isDemoMode ? (
                            loadingSource === 'cache' ? 'Loading Demo Model from Cache...' :
                            loadingSource === 'network' ? 'Downloading Demo Model...' :
                            loadingSource === 'preparing' ? 'Preparing Demo...' :
                            'Loading Demo Model...'
                        ) : 'Loading Model...'}
                    </h2>
                    
                    {isDemoMode && loadingSource && (
                        <p style={{
                            color: '#00ffd0',
                            fontSize: '1rem',
                            textAlign: 'center',
                            opacity: 0.9
                        }}>
                            {loadingSource === 'cache' && '⚡ Loading instantly from cache'}
                            {loadingSource === 'network' && '🌐 First-time download (will be cached)'}
                            {loadingSource === 'preparing' && '🔧 Initializing service worker'}
                        </p>
                    )}
                    
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Model Loaded Toast */}
            <Toast 
                message={toast.message}
                isVisible={toast.isVisible}
                onHide={hideToast}
                duration={4000}
                enableTTS={true}
            />

        </>
    );
}