import { useRef, useEffect, useState } from 'react';
import ModelInteractions from '../components/ModelInteractions';

export function useModelInteractions() {
    const modelInteractionsRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!modelInteractionsRef.current) {
            modelInteractionsRef.current = new ModelInteractions();
        }
    }, []);

    const initializeInteractions = (modelRef, sceneRef, layerManager = null, animationController = null) => {
        if (modelInteractionsRef.current) {
            modelInteractionsRef.current.initialize(modelRef, sceneRef, layerManager, animationController);
            setIsInitialized(true);
        }
    };

    const setCallbacks = (callbacks) => {
        if (modelInteractionsRef.current) {
            modelInteractionsRef.current.setCallbacks(callbacks);
        }
    };

    const getAvailableParts = () => {
        return modelInteractionsRef.current?.getAvailableParts() || [];
    };

    return {
        modelInteractions: modelInteractionsRef.current,
        initializeInteractions,
        setCallbacks,
        getAvailableParts,
        isInitialized
    };
}

export default useModelInteractions;
