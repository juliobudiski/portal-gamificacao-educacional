// frontend/src/components/activity/ChatTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaFlag } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';

const ChatTab = ({ onReturn }) => {
  const { user } = useAuth();
  const { activityId } = useParams();
  const { showToast } = useToast(); // Usamos o toast para feedback amigável
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/activity/${activityId}/messages`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!response.ok) throw new Error("Não foi possível carregar o histórico do chat.");

        const history = await response.json();
        setMessages(history);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();

    const socket = io(import.meta.env.VITE_API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { user_id: user.id, activity_id: activityId });
    });

    socket.on('new_message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // --- NOVO: Ouve se alguma mensagem foi banida enquanto o chat está aberto ---
    socket.on('message_censored', (data) => {
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === data.msg_id
          ? { ...msg, is_censored: true, content: "🚫 Mensagem ocultada devido a denúncias." }
          : msg
      ));
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

  // --- NOVA FUNÇÃO: Denunciar Mensagem ---
  const handleReportMessage = async (msgId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/messages/${msgId}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      const data = await response.json();
      if (response.ok) {
        showToast("Denúncia registrada. Agradecemos por manter a comunidade segura!", "success");
      } else {
        showToast(data.error || "Erro ao denunciar.", "warning");
      }
    } catch (err) {
      showToast("Erro de rede ao tentar denunciar.", "error");
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-primary-bg p-4 pt-16 text-primary-text rounded-lg" style={{ height: '80vh', maxHeight: '700px' }}>

      <div className='flex-shrink-0'>
        <button onClick={onReturn} className="absolute top-4 left-4 z-20 flex items-center gap-2 py-2 px-4 bg-secondary-bg text-secondary-text border border-border-color rounded-full shadow-lg hover:bg-primary-bg hover:shadow-xl transition-all">
          <FaArrowLeft /> Voltar ao Tabuleiro
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">Chat da Atividade</h2>

      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar">
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
            {messages.map((msg) => {
              const isMine = Number(msg.sender_id) === Number(user.id);

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>

                  {/* Container da bolha e botões de ação */}
                  <div className="flex items-center gap-2 max-w-xs lg:max-w-md">

                    {/* Botão de Denúncia (só aparece nos dos outros e se não estiver banida) */}
                    {!isMine && !msg.is_censored && (
                      <button
                        onClick={() => handleReportMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-500/10"
                        title="Denunciar mensagem ofensiva"
                      >
                        <FaFlag size={12} />
                      </button>
                    )}

                    {/* A Bolha da Mensagem */}
                    <div className={`p-3 rounded-lg shadow-sm border ${msg.is_censored
                        ? 'bg-gray-800/50 border-red-500/30 text-gray-500 italic' // Estilo de censura
                        : isMine
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : 'bg-secondary-bg border-border-color text-primary-text'
                      }`}
                    >
                      {!isMine && <p className="font-bold text-xs text-teal-400 mb-1">{msg.sender_name}</p>}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-right text-[10px] mt-1 opacity-70`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex-shrink-0 flex flex-col gap-2">
        <div className="flex justify-between text-xs px-1">
          <span className="text-secondary-text">{newMessage.length}/500</span>
          {newMessage.length >= 500 && <span className="text-red-400">Limite atingido!</span>}
        </div>

        <div className="flex gap-2 shadow-lg">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            className={`flex-grow p-3 rounded-lg focus:outline-none 
                bg-secondary-bg border border-border-color
                text-primary-text transition-colors
                ${newMessage.length >= 500 ? 'border-red-500 focus:border-red-500' : 'focus:border-accent-teal'}
            `}
            disabled={isLoading || !!error}
          />
          <button
            type="submit"
            className="bg-accent-teal text-gray-900 px-6 py-2 rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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