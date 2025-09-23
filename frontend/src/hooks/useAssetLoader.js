import { useState, useEffect, useRef } from 'react';

/**
 * Hook customizado para pré-carregar imagens com progresso e estimativa de tempo restante.
 * @param {string[]} imageUrls - Uma array de URLs das imagens a serem carregadas.
 * @returns {{loadingProgress: number, isLoaded: boolean, etr: string | null}} - Progresso, status e a string de tempo restante.
 */
function useAssetLoader(imageUrls) {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    // NOVO: Estado para armazenar a estimativa de tempo
    const [etr, setEtr] = useState(null);

    // NOVO: useRef para guardar o tempo de início sem causar re-renderizações
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (!imageUrls || imageUrls.length === 0) {
            setIsLoaded(true);
            return;
        }

        startTimeRef.current = Date.now(); // Marca o tempo de início
        let loadedCount = 0;
        const totalImages = imageUrls.length;

        imageUrls.forEach((url) => {
            const img = new Image();
            img.src = url;

            const handleLoad = () => {
                loadedCount++;
                const progress = Math.round((loadedCount / totalImages) * 100);
                setLoadingProgress(progress);
                if (loadedCount === totalImages) {
                    setIsLoaded(true);
                    setEtr(null); // Limpa a estimativa ao concluir
                }
            };

            img.onload = handleLoad;
            img.onerror = handleLoad;
        });

    }, [imageUrls]);

    // NOVO: useEffect separado para calcular o ETR periodicamente
    useEffect(() => {
        if (isLoaded || loadingProgress === 0) {
            setEtr(null);
            return;
        }

        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTimeRef.current;
            // Só calcula se já passou algum tempo e temos algum progresso, para evitar divisões por zero
            if (elapsedTime > 50 && loadingProgress > 5) {
                const speed = loadingProgress / elapsedTime; // progresso por milissegundo
                const remainingProgress = 100 - loadingProgress;
                const etrMs = remainingProgress / speed; // ETR em milissegundos
                
                const etrSeconds = Math.round(etrMs / 1000);

                if (etrSeconds > 1) {
                    setEtr(`cerca de ${etrSeconds} segundos restantes...`);
                } else if (etrSeconds === 1) {
                    setEtr(`cerca de 1 segundo restante...`);
                } else {
                    setEtr('quase pronto...');
                }
            }
        }, 500); // Atualiza a estimativa a cada meio segundo

        // Função de limpeza para remover o intervalo quando o carregamento terminar
        return () => clearInterval(interval);

    }, [loadingProgress, isLoaded]);

    // ALTERADO: Retorna também o ETR
    return { loadingProgress, isLoaded, etr };
}

export default useAssetLoader;
