// frontend/src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * @component ScrollToTop
 * @description
 * Utility component that resets window scroll position on route changes.
 * 
 * Architectural Decisions:
 * - Renderless Component: Returns `null` as it solely manages the side effect of scrolling, following the "Renderless Component" pattern for cross-cutting router concerns.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Rola a janela para as coordenadas (0, 0) - o topo da página
    window.scrollTo(0, 0);
  }, [pathname]); // O efeito é re-executado toda vez que o 'pathname' (URL) muda

  return null; // Este componente não renderiza nada visualmente
}

export default ScrollToTop;