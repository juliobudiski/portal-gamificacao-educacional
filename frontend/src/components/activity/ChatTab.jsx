import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * @component ChatTab
 * @desc Componente para exibição e envio de mensagens em um chat de atividade.
 * @returns {JSX.Element} Interface de chat com histórico de mensagens e campo de envio.
 */
const ChatTab = ({onReturn}) => {
  // Log de inicialização do componente
  if (isDebugMode) {
    console.log('[ChatTab] Componente inicializado. Estado inicial:', {
      messageCount: 2,
      newMessageEmpty: true
    });
  }

  const [messages, setMessages] = useState([
    { id: 1, user: 'Alice', text: 'Alguém na questão 2? Achei difícil!' },
    { id: 2, user: 'Beto', text: 'Também! A dica é pensar em herança.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  /**
   * @function handleSendMessage
   * @desc Adiciona nova mensagem ao histórico e limpa o campo de entrada.
   * @returns {void}
   */
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Log antes de atualizar o estado
      if (isDebugMode) {
        console.log(
          `[ChatTab] Enviando nova mensagem. Comprimento: ${newMessage.length} caracteres`,
          `Total de mensagens pré-envio: ${messages.length}`
        );
      }

      setMessages([...messages, { id: Date.now(), user: 'Você', text: newMessage }]);
      setNewMessage('');

      // Log após atualização do estado (nota: estado é assíncrono)
      if (isDebugMode) {
        console.log('[ChatTab] Estado atualizado. Nova mensagem adicionada.');
      }
    }
  };

  // Log de renderização
  if (isDebugMode) {
    console.log(`[ChatTab] Renderizando. Mensagens: ${messages.length}`, `Nova mensagem: ${newMessage.length > 0 ? 'preenchida' : 'vazia'}`);
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white flex flex-col h-96">
      <button 
        onClick={onReturn} 
        className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
        </svg>
        Voltar ao Tabuleiro
      </button>
      <h2 className="text-2xl font-bold text-teal-400 mb-4">Chat da Atividade</h2>
      
      {/* Área de histórico de mensagens */}
      <div className="flex-grow bg-gray-900 p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`p-2 rounded-lg ${msg.user === 'Você' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}`}
          >
            <span className="font-bold text-sm">{msg.user}: </span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      
      {/* TODO: Implementar tratamento de erro para falhas de envio */}
      {/* TODO: Adicionar suporte para envio com tecla Enter */}
      
      {/* Área de composição de mensagem */}
      <div className="flex">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => {
            setNewMessage(e.target.value);
            // Log de alteração no campo de mensagem
            if (isDebugMode && e.target.value.trim()) {
              console.log(`[ChatTab] Campo de mensagem alterado. Comprimento: ${e.target.value.length}`);
            }
          }}
          placeholder="Digite sua mensagem..." 
          className="flex-grow bg-gray-700 p-2 rounded-l-lg focus:outline-none" 
        />
        <button 
          onClick={handleSendMessage} 
          className="bg-teal-600 p-2 rounded-r-lg"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;