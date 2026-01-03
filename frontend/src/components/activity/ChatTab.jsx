// frontend/src/components/activity/ChatTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaArrowLeft, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

const ChatTab = ({ onReturn }) => {
  const { user } = useAuth();
  const { activityId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- CORREÇÃO: Estados de UI adicionados ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  console.log("[ChatTab] Estado inicial de isloading:", isLoading);
  console.log("[ChatTab] Estado inicial de error:", error);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log("[ChatTab] useEffect executado com activityId:", activityId);
    console.log("[ChatTab] useEffect executado com user.token:", user.token);
    console.log("[ChatTab] useEffect executado com user.id:", user.id);
    const fetchHistory = async () => {
      console.log("[ChatTab] fetchHistory executado")
      // --- CORREÇÃO: Gerenciamento de estado ---
      setIsLoading(true);
      setError('');
      try {
        console.log("[ChatTab] fetchHistory entrou no try")
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/activity/${activityId}/messages`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!response.ok) {
          throw new Error("Não foi possível carregar o histórico do chat.");
        }
        const history = await response.json();
        setMessages(history);
      } catch (error) {
        console.error("Erro ao buscar histórico do chat:", error);
        setError(error.message);
      } finally {
        // Garante que o loading termine, com sucesso ou erro
        setIsLoading(false);
      }
    };
    fetchHistory();

    const socket = io(import.meta.env.VITE_API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor de chat!');
      socket.emit('join', { user_id: user.id, activity_id: activityId });
    });

    socket.on('new_message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [activityId, user.token, user.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      const messagePayload = {
        activity_id: activityId,
        sender_id: user.id,
        content: newMessage.trim(),
      };
      socketRef.current.emit('send_message', messagePayload);
      setNewMessage('');
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-primary-bg p-4 pt-16 text-primary-text rounded-lg" style={{ height: '80vh', maxHeight: '700px' }}>

      <div className='flex-shrink-0'>
        <button
          onClick={onReturn}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 py-2 px-4 
               bg-secondary-bg text-secondary-text 
               border border-border-color rounded-full shadow-lg 
               hover:bg-primary-bg hover:shadow-xl transition-all"
        >
          <FaArrowLeft /> Voltar ao Tabuleiro
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">Chat da Atividade</h2>

      {/* --- CORREÇÃO: Renderização condicional baseada nos novos estados --- */}
      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FaSpinner className="animate-spin text-3xl text-yellow-400 mb-3" />
            <p>Carregando histórico...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
            <FaExclamationCircle className="text-4xl mb-3" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${Number(msg.sender_id) === Number(user.id) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${Number(msg.sender_id) === Number(user.id) ? 'bg-teal-600' : 'bg-gray-600'}`}>
                  {Number(msg.sender_id) !== Number(user.id) && <p className="font-bold text-xs text-cyan-300">{msg.sender_name}</p>}
                  <p className="text-primary-text">{msg.content}</p>
                  <p className="text-right text-xs text-secondary-text mt-1">{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex-shrink-0 flex flex-col gap-2">
        {/* CONTADOR DE CARACTERES */}
        <div className="flex justify-between text-xs px-1">
          <span className="text-secondary-text">
            {newMessage.length}/500
          </span>
          {newMessage.length >= 500 && <span className="text-red-400">Limite atingido!</span>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={500} // <--- O NAVEGADOR BLOQUEIA AQUI
            className={`flex-grow p-2 rounded-lg focus:outline-none 
                bg-white dark:bg-gray-700 
                text-gray-900 dark:text-gray-100 
                placeholder-gray-500 dark:placeholder-gray-400
                ${newMessage.length >= 500 ? 'border border-red-500' : ''}`}
            disabled={isLoading || !!error}
          />
          <button
            type="submit"
            className="bg-teal-600 px-4 py-2 rounded-lg font-bold hover:bg-teal-500 transition-colors disabled:opacity-50"
            disabled={isLoading || !!error || !newMessage.trim()}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatTab;