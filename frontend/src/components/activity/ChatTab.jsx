import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const ChatTab = () => {
    const [messages, setMessages] = useState([
        { id: 1, user: 'Alice', text: 'Alguém na questão 2? Achei difícil!' },
        { id: 2, user: 'Beto', text: 'Também! A dica é pensar em herança.' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { id: Date.now(), user: 'Você', text: newMessage }]);
            setNewMessage('');
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg text-white flex flex-col h-96">
            <h2 className="text-2xl font-bold text-teal-400 mb-4">Chat da Atividade</h2>
            <div className="flex-grow bg-gray-900 p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg ${msg.user === 'Você' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}`}>
                        <span className="font-bold text-sm">{msg.user}: </span>
                        <span>{msg.text}</span>
                    </div>
                ))}
            </div>
            <div className="flex">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-grow bg-gray-700 p-2 rounded-l-lg focus:outline-none" />
                <button onClick={handleSendMessage} className="bg-teal-600 p-2 rounded-r-lg"><FaPaperPlane /></button>
            </div>
        </div>
    );
};

export default ChatTab;