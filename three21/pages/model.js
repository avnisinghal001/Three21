import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { get as idbGet } from 'idb-keyval';
import { ModelInfoProvider } from '../components/ModelInfoContext';
import ModelErrorBoundary from '../components/ModelErrorBoundary';

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

    useEffect(() => {
        async function loadModel() {
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
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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
                        color: '#00ffd0', 
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
                        background: 'linear-gradient(90deg, #00ffd0 0%, #2a5298 100%)',
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
        <ModelErrorBoundary>
            <ModelInfoProvider demoConfig={isDemoMode ? DEMO_CONFIG : null}>
                <AnyModelViewer 
                    url={fileUrl} 
                    type={type} 
                    isDemoMode={isDemoMode}
                    demoConfig={isDemoMode ? DEMO_CONFIG : null}
                />
            </ModelInfoProvider>
        </ModelErrorBoundary>
    );
}