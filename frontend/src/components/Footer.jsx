// frontend/src/components/Footer.jsx
import React from "react";
import { ShieldAlert, Copyright } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-bg text-secondary-text text-sm border-t border-gray-700 shadow-xl">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Marca e direitos */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center space-x-2">
            <Copyright className="w-4 h-4 text-accent-yellow" />
            <p className="font-semibold">
              {currentYear} GamificaEdu - Portal de Gamificação Educacional
            </p>
          </div>

          {/* Texto legal */}
          <p className="max-w-3xl text-secondary-text leading-relaxed transition-colors duration-300 hover:text-gray-200">
            Este portal e todo o seu conteúdo, incluindo textos, gráficos,
            códigos, atividades e design, são protegidos por leis de direitos
            autorais. A reprodução, distribuição ou transmissão de qualquer
            parte deste trabalho, sem autorização por escrito, é estritamente
            proibida.
          </p>

          {/* Alerta legal */}
          <div className="flex items-center space-x-2 text-secondary-text text-xs mt-2">
            <ShieldAlert className="w-4 h-4 text-accent-purple" />
            <span>
              A violação dos direitos autorais é crime previsto na Lei nº
              9.610/98.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
