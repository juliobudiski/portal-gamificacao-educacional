import { useEffect } from 'react';

/**
 * @hook useKeyboardShortcuts
 * @description
 * Hook global para atalhos rápidos de teclado (Melhoria 96).
 * Mapeia teclas universais como Esc para fechar, Espaço para avançar diálogos
 * e números 1-4 para seleção rápida de alternativas.
 */
export default function useKeyboardShortcuts({
  onEscape,
  onSpace,
  onNumberKey
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignora atalhos se o usuário estiver digitando em um input ou textarea
      const targetTag = e.target.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      } else if (e.key === ' ' && onSpace) {
        e.preventDefault();
        onSpace();
      } else if (['1', '2', '3', '4'].includes(e.key) && onNumberKey) {
        e.preventDefault();
        onNumberKey(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onSpace, onNumberKey]);
}
