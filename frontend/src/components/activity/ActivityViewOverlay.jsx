import React, { useEffect, useRef } from 'react';
import { FaTimes, FaRegLightbulb } from 'react-icons/fa';
import boardBackground from '/board/background_board.webp';

/**
 * @component ActivityViewOverlay
 * @description
 * High-z-index overlay container for displaying full-screen activity content.
 * 
 * Architectural Decisions:
 * - Accessibility (a11y): Implements `role="dialog"`, ARIA labels, focus trapping, and ESC key dismissal to comply with web accessibility standards.
 * - Composition Pattern: Acts as a generic, styled wrapper (Layout Component) that accepts `children`, decoupling the presentation frame from the specific activity content.
 */
const ActivityViewOverlay = ({ isOpen, onClose, title, backgroundImage, children }) => {
  const closeBtnRef = useRef(null);
  const titleId = 'activity-overlay-title';

  useEffect(() => {
    if (!isOpen) return;

    // focus the close button for keyboard users when modal opens
    closeBtnRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // don't render when closed
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Dimmed backdrop with subtle gradient + blur for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.8))',
        }}
        aria-hidden
      />

      {/* Decorative board background (covers full viewport, fixed so it doesn't scroll)	*/}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none "
        style={{ backgroundImage: `url(${boardBackground})`, opacity: 0.18 }}
        aria-hidden
      />

      {/* Floating accent image (fixed, non-interactive) */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="decorative"
          className="z-50 fixed bottom-6 right-6 w-48 h-48 opacity-90 object-contain pointer-events-none select-none"
          style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}
          aria-hidden
        />
      )}

      {/* Close button (keyboard accessible) */}
      <button
        ref={closeBtnRef}
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="fixed top-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
        aria-label="Voltar ao Tabuleiro"
        style={{
          background: 'rgba(0,0,0,0.45)',
          color: '#ffffff',
          boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
        }}
      >
        <FaTimes size={20} />
      </button>

      {/* Main scrollable content area */}
      <div
        className="relative z-20 w-full h-full overflow-y-auto p-6 md:p-10"
        onClick={(e) => e.stopPropagation()} // prevent clicks inside from closing
      >
        <div className="flex w-full min-h-[60vh] items-start justify-center">
          <div
            className="w-full max-w-5xl rounded-xl shadow-xl p-6 md:p-8 transition-transform duration-300 ease-out transform hover:-translate-y-1"
            style={{
              background: 'linear-gradient(180deg, rgba(44,49,53,0.72), rgba(30,34,37,0.72))',
              border: '1px solid rgba(255,189,48,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <header className="flex items-center gap-4 mb-6">
              <div
                className="flex items-center justify-center rounded-xl p-3 shadow-inner"
                style={{
                  background: 'linear-gradient(135deg, rgba(105,232,203,0.06), rgba(149,112,217,0.06))',
                }}
                aria-hidden
              >
                <FaRegLightbulb size={20} className="opacity-90" />
              </div>

              <div className="flex-1">
                <h2
                  id={titleId}
                  className="text-2xl md:text-4xl font-extrabold leading-tight"
                  style={{
                    color: '#ffbd30',
                    textShadow: '0 3px 12px rgba(0,0,0,0.65)',
                  }}
                >
                  {title}
                </h2>
                <p className="mt-1 text-sm text-secondary-text/80">GamificaEdu Portal</p>
              </div>


            </header>

            {/* Body container — keep existing children and layout intact */}
            <main className="w-full text-gray-100" aria-live="polite">
              <div className="mb-6">
                {/* subtle section divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(255,189,48,0.12)] to-transparent rounded" />
              </div>

              <div className="rounded-xl p-4 md:p-6 shadow-md" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.03))' }}>
                {children}
              </div>

            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityViewOverlay;
