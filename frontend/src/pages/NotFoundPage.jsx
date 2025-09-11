import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaSearch, 
  FaExclamationTriangle, 
  FaRobot, 
  FaRocket, 
  FaGamepad,
  FaRegSadTear
} from 'react-icons/fa';

function NotFoundPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Efeito parallax baseado na posição do mouse
  const parallaxStyle = {
    transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px)`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
      {/* Elementos de fundo decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse-slow" style={parallaxStyle}></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500 rounded-full filter blur-3xl opacity-20 animate-pulse-medium" style={parallaxStyle}></div>
        <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-yellow-500 rounded-full filter blur-3xl opacity-20 animate-pulse-fast" style={parallaxStyle}></div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {/* Ícone animado */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              y: [0, -15, 0]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-8xl mb-6 flex justify-center"
          >
            <FaExclamationTriangle className="text-yellow-400" />
          </motion.div>

          {/* Número 404 com efeito */}
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500 mb-4"
          >
            404
          </motion.h1>

          {/* Mensagem principal */}
          <motion.h2 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Oops! Página não encontrada
          </motion.h2>

          {/* Mensagem explicativa */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Parece que você se perdeu no universo da gamificação. A página que você está procurando pode ter sido movida ou não existe mais.
          </motion.p>

          {/* Ícones flutuantes */}
          <div className="flex justify-center space-x-6 mb-10">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0 }}
              className="text-3xl text-purple-400"
            >
              <FaRobot />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
              className="text-3xl text-teal-400"
            >
              <FaRocket />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1 }}
              className="text-3xl text-yellow-400"
            >
              <FaGamepad />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
              className="text-3xl text-red-400"
            >
              <FaRegSadTear />
            </motion.div>
          </div>

          {/* Botões de ação */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                <FaHome className="mr-2" />
                Voltar ao Início
              </motion.button>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-300"
            >
              <FaSearch className="mr-2" />
              Voltar à Página Anterior
            </button>
          </motion.div>

          {/* Mensagem extra */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
            className="text-gray-400 mt-10 text-sm"
          >
            Se você acredita que isso é um erro, entre em contato com o suporte técnico.
          </motion.p>
        </motion.div>

        {/* Efeito de partículas no cursor */}
        {isHovered && (
          <motion.div
            className="absolute w-4 h-4 bg-yellow-400 rounded-full pointer-events-none"
            style={{
              left: mousePosition.x - 8,
              top: mousePosition.y - 8,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          />
        )}
      </div>

      
    </div>
  );
}

export default NotFoundPage;