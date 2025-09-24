// frontend/src/hooks/useAssetLoader.js
import { useState, useEffect, useRef } from 'react';

function useAssetLoader(imageUrls) {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [etr, setEtr] = useState(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        // Reseta o estado para garantir que o loading funcione em recarregamentos
        setIsLoaded(false);
        setLoadingProgress(0);
        setEtr(null);

        // Se não há imagens, considera carregado imediatamente
        if (!imageUrls || imageUrls.length === 0) {
            setIsLoaded(true);
            return;
        }

        startTimeRef.current = Date.now();
        let loadedCount = 0;
        const totalImages = imageUrls.length;
        
        const imagePromises = imageUrls.map((url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;

                const handleLoad = () => {
                    loadedCount++;
                    const progress = Math.round((loadedCount / totalImages) * 100);
                    setLoadingProgress(progress);
                    resolve(); // Resolve a promessa
                };
                
                img.onload = handleLoad;
                // Trata erros como "carregado" para não travar o loader
                img.onerror = () => {
                    console.warn(`Falha ao carregar asset: ${url}`);
                    handleLoad();
                };
            });
        });

        // Espera todas as promessas de imagem serem resolvidas
        Promise.all(imagePromises).then(() => {
            // Pequeno delay para a barra de 100% ser visível antes de sumir
            setTimeout(() => {
                setIsLoaded(true);
                setEtr(null);
            }, 300);
        });

    }, [imageUrls]); // O hook re-executa se a lista de URLs mudar

    // O useEffect para calcular o ETR continua o mesmo
    useEffect(() => {
        if (isLoaded || loadingProgress < 5) {
            setEtr(null);
            return;
        }
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTimeRef.current;
            if (elapsedTime > 50) {
                const speed = loadingProgress / elapsedTime;
                const remainingProgress = 100 - loadingProgress;
                const etrMs = remainingProgress / speed;
                const etrSeconds = Math.round(etrMs / 1000);
                if (etrSeconds > 1) setEtr(`cerca de ${etrSeconds} segundos restantes...`);
                else if (etrSeconds === 1) setEtr(`cerca de 1 segundo restante...`);
                else setEtr('quase pronto...');
            }
        }, 500);
        return () => clearInterval(interval);
    }, [loadingProgress, isLoaded]);

    return { loadingProgress, isLoaded, etr };
}

export default useAssetLoader;

