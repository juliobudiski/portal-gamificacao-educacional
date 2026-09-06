// frontend/src/components/activity/ChatTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaFlag } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';

/**
 * @component ChatTab
 * @description
 * Real-time global chat interface for a specific activity.
 * 
 * Architectural Decisions:
 * - Real-time Data Flow: Integrates Socket.io for bidirectional communication, handling incoming messages, censorship events, and error broadcasts.
 * - UX & Side Effects: Uses a `useRef` pointing to the bottom of the message list (`messagesEndRef`) inside a `useEffect` to auto-scroll when new messages arrive.
 * - Security/Moderation: Incorporates a reporting mechanism, updating local state instantly when the server emits a `message_censored` event.
 */
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

    socket.on('error_message', (data) => {
      showToast(data.msg || "Erro ao enviar mensagem.", "error");
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
    <div className="relative flex flex-col h-full bg-primary-bg p-6 pt-16 text-gray-200 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden" style={{ height: '80vh', maxHeight: '700px' }}>
      {/* Efeitos de luz ao fundo */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-teal-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className='flex-shrink-0 relative z-20'>
        <button onClick={onReturn} 
          className="absolute top-0 left-0 flex items-center gap-2 py-2 px-4 
                     bg-black/50 text-secondary-text font-bold backdrop-blur-md 
                     border border-white/10 rounded-full shadow-lg 
                     hover:bg-white/10 hover:text-white hover:scale-105 transition-all">
          <FaArrowLeft /> Voltar ao Tabuleiro
        </button>
      </div>
      
      <header className="mb-6 relative z-10 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] flex-shrink-0">Chat Global da Atividade</h2>
        <p className="text-sm text-secondary-text mt-1">Converse com outros alunos e tire dúvidas.</p>
      </header>

      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar relative z-10 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-inner">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FaSpinner className="animate-spin text-4xl text-teal-400 mb-4 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
            <p className="text-secondary-text font-medium tracking-wide">Carregando histórico holográfico...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-red-400 bg-red-900/10 p-6 rounded-xl border border-red-500/20">
            <FaExclamationCircle className="text-5xl mb-4 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full opacity-50">
                    <p className="text-secondary-text italic text-center max-w-sm">Nenhuma mensagem ainda. Que tal ser o primeiro a dar um oi?</p>
                </div>
            )}
            {messages.map((msg) => {
              const isMine = Number(msg.sender_id) === Number(user.id);

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-fade-in-up`}>

                  {/* Container da bolha e botões de ação */}
                  <div className="flex items-center gap-2 max-w-[85%] lg:max-w-[70%] relative">

                    {/* Botão de Denúncia (só aparece nos dos outros e se não estiver banida) */}
                    {!isMine && !msg.is_censored && (
                      <button
                        onClick={() => handleReportMessage(msg.id)}
                        className="absolute -right-8 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-red-400 rounded-full hover:bg-red-500/20"
                        title="Denunciar mensagem ofensiva"
                      >
                        <FaFlag size={14} />
                      </button>
                    )}

                    {/* Avatar do Usuário */}
                    {!isMine && msg.avatar && (
                      <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-600 self-end mb-2 shadow-md hidden sm:block" />
                    )}

                    {/* A Bolha da Mensagem */}
                    <div className={`p-4 rounded-2xl shadow-md flex-1 ${msg.is_censored
                        ? 'bg-gray-800/50 border border-red-500/30 text-gray-500 italic backdrop-blur-sm' // Estilo de censura
                        : isMine
                          ? 'bg-gradient-to-br from-teal-600/90 to-cyan-700/90 border border-teal-400/30 text-white rounded-tr-sm shadow-[0_4px_15px_rgba(20,184,166,0.3)]'
                          : 'bg-gray-800/80 backdrop-blur-md border border-white/10 text-gray-200 rounded-tl-sm shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
                      }`}
                    >
                      {!isMine && !msg.is_censored && (
                         <div className="flex flex-col mb-1">
                           <span 
                              className="font-extrabold text-[11px] uppercase tracking-wider text-teal-400"
                              style={(() => {
                                  if (!msg.name_cosmetic || msg.name_cosmetic.type !== 'color') return {};
                                  const c = msg.name_cosmetic.color;
                                  return msg.name_cosmetic.effect === 'neon' 
                                      ? { color: c, textShadow: `0 0 5px ${c}, 0 0 7px ${c}` } 
                                      : { color: c };
                              })()}
                           >
                             {msg.sender_name}
                           </span>
                           {msg.title && (
                               <span 
                                  className="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                                  style={(() => {
                                      if (!msg.title_cosmetic || msg.title_cosmetic.type !== 'color') return {};
                                      const c = msg.title_cosmetic.color;
                                      return msg.title_cosmetic.effect === 'neon' 
                                          ? { color: c, textShadow: `0 0 5px ${c}, 0 0 7px ${c}` } 
                                          : { color: c };
                                  })()}
                               >
                                  {msg.title}
                               </span>
                           )}
                         </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                      <p className={`text-right text-[10px] mt-2 font-medium ${isMine ? 'text-teal-100/70' : 'text-gray-500'}`}>
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

      <form onSubmit={handleSendMessage} className="flex-shrink-0 flex flex-col gap-2 relative z-10">
        <div className="flex justify-between text-[11px] font-bold px-2 uppercase tracking-wider">
          <span className="text-gray-500">{newMessage.length}/500</span>
          {newMessage.length >= 500 && <span className="text-red-400 animate-pulse">Limite atingido!</span>}
        </div>

        <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Transmitir mensagem na rede..."
            maxLength={500}
            className={`flex-grow p-4 rounded-xl focus:outline-none 
                bg-gray-900/50 border border-transparent
                text-white placeholder-gray-500 transition-all
                ${newMessage.length >= 500 ? 'focus:border-red-500/50 bg-red-900/10' : 'focus:border-teal-500/50 focus:bg-gray-800/80'}
            `}
            disabled={isLoading || !!error}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(20,184,166,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
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