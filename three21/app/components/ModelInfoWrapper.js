'use client';

import { useEffect, useState } from 'react';
import { ModelInfoProvider } from '../../components/ModelInfoContext';

export default function ModelInfoWrapper({ children }) {
    const [swStatus, setSwStatus] = useState('loading');
    const [demoCached, setDemoCached] = useState(false);

    useEffect(() => {
        // Register service worker and prefetch demo.fbx
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered successfully:', registration);
                    setSwStatus('ready');
                    
                    // Prefetch demo.fbx after service worker is ready
                    if (registration.active || registration.waiting) {
                        prefetchDemo();
                    } else {
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'activated') {
                                    prefetchDemo();
                                }
                            });
                        });
                    }
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                    setSwStatus('failed');
                });
        } else {
            setSwStatus('not-supported');
        }

        function prefetchDemo() {
            // Check if demo.fbx is already cached
            checkDemoCache();
            
            // Trigger a fetch to cache demo.fbx if not already cached
            fetch('/demo.fbx', { 
                method: 'HEAD',
                cache: 'force-cache' 
            }).then(() => {
                console.log('Demo model prefetched and cached');
                setDemoCached(true);
                // Store cache status in localStorage for faster UI updates
                localStorage.setItem('three21-demo-cached', 'true');
            }).catch((error) => {
                console.log('Demo model prefetch failed, will try on demand:', error);
                setDemoCached(false);
                localStorage.setItem('three21-demo-cached', 'false');
            });
        }

        function checkDemoCache() {
            // Quick check from localStorage first
            const cachedStatus = localStorage.getItem('three21-demo-cached');
            if (cachedStatus === 'true') {
                setDemoCached(true);
            }
            
            // Then verify with service worker if available
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    const { cached } = event.data;
                    setDemoCached(cached);
                    localStorage.setItem('three21-demo-cached', cached ? 'true' : 'false');
                };
                
                navigator.serviceWorker.controller.postMessage(
                    { type: 'GET_CACHE_STATUS' },
                    [messageChannel.port2]
                );
            }
        }
    }, []);

    // Expose cache status to child components via global
    useEffect(() => {
        window.three21DemoCache = {
            isReady: swStatus === 'ready',
            isCached: demoCached,
            status: swStatus
        };
    }, [swStatus, demoCached]);

    return (
        <ModelInfoProvider>
            {children}
        </ModelInfoProvider>
    );
}
