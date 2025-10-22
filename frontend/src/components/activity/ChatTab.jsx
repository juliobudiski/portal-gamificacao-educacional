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

  // Novos estados de UI
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
        if (!response.ok) {
          throw new Error("Não foi possível carregar o histórico do chat.");
        }
        const history = await response.json();
        setMessages(history);
      } catch (error) {
        console.error("Erro ao buscar histórico do chat:", error);
        setError(error.message);
      } finally {
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
    <div className="flex flex-col h-full bg-primary-bg p-4 text-primary-text rounded-lg" style={{ height: '80vh', maxHeight: '700px' }}>

      <div className='flex-shrink-0'>
        <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
          <FaArrowLeft /> Voltar ao Tabuleiro
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">Chat da Atividade</h2>

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

      <form onSubmit={handleSendMessage} className="flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-grow bg-border-color p-2 rounded-lg focus:outline-none"
          disabled={isLoading || !!error}
        />
        <button type="submit" className="bg-teal-600 px-4 py-2 rounded-lg font-bold" disabled={isLoading || !!error}>Enviar</button>
      </form>
    </div>
  );
};

export default ChatTab;