// frontend/src/components/Footer.jsx
import React from "react";
import { ShieldAlert, Copyright } from "lucide-react";

/**
 * @component Footer
 * @description
 * Global application footer presenting legal and branding information.
 * 
 * Architectural Decisions:
 * - Pure Presentation: Completely stateless and decoupled from business logic.
 * - Centralized Branding: Consolidates copyright and warnings in a single reusable module to ensure consistency across the application.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-primary-bg/80 backdrop-blur-md text-secondary-text text-sm border-t border-border-color shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
      {/* Elementos decorativos (Blobs sutis) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent-teal/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative max-w-6xl mx-auto px-6 py-8">
        {/* Marca e direitos */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center space-x-2 group">
            <Copyright className="w-5 h-5 text-accent-yellow group-hover:rotate-180 transition-transform duration-700" />
            <p className="font-bold text-base text-primary-text bg-clip-text text-transparent bg-gradient-to-r from-accent-yellow to-accent-teal">
              {currentYear} GamificaEdu - Portal de Gamificação Educacional
            </p>
          </div>

          {/* Texto legal */}
          <p className="max-w-3xl text-secondary-text/80 leading-relaxed transition-colors duration-300 hover:text-secondary-text">
            Este portal e todo o seu conteúdo, incluindo textos, gráficos,
            códigos, atividades e design, são protegidos por leis de direitos
            autorais. A reprodução, distribuição ou transmissão de qualquer
            parte deste trabalho, sem autorização por escrito, é estritamente
            proibida.
          </p>

          {/* Alerta legal */}
          <div className="flex items-center space-x-2 text-danger/80 bg-danger/10 px-4 py-2 rounded-full mt-4 border border-danger/20 hover:bg-danger/20 hover:text-danger transition-colors cursor-default">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span className="font-medium">
              A violação dos direitos autorais é crime previsto na Lei nº 9.610/98.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
