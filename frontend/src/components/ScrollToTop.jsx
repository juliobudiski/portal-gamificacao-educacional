// frontend/src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Este componente detecta mudanças na rota da aplicação
 * e força a janela a rolar para o topo.
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