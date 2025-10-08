// frontend/src/components/activity/ChatTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaComments, FaQuestionCircle, FaPlus, FaTrophy, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// Componente para um único Tópico na lista
const TopicListItem = ({ topic, onSelect }) => (
  <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex justify-between items-center">
    <div>
      <h3 className="font-bold text-white">{topic.title}</h3>
      <p className="text-sm text-gray-400">por {topic.author_name} - {topic.post_count} respostas</p>
    </div>
    {topic.best_answer_id && <FaTrophy className="text-yellow-400 text-xl flex-shrink-0" title="Resolvido" />}
  </button>
);

// Componente para uma única Resposta dentro de um tópico
const PostItem = ({ post, isTopicAuthor, onMarkBest }) => {
  const { user } = useAuth();
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start">
        <p className="font-bold text-teal-300">{post.author_name}</p>
        {isTopicAuthor && (
          <button onClick={() => onMarkBest(post.id)} className="text-xs flex items-center gap-1 text-yellow-400 hover:text-white">
            <FaTrophy /> Marcar como Melhor
          </button>
        )}
      </div>
      <p className="text-gray-300 mt-2">{post.body}</p>
    </div>
  );
};


const ChatTab = ({ onReturn }) => {
  const { user } = useAuth();
  const { activityId } = useParams();

  const [view, setView] = useState('list'); // 'list', 'topic', 'create'
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- LÓGICA DE BUSCA DE DADOS ---
  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/forum`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error("Não foi possível carregar os tópicos.");
      const data = await response.json();
      setTopics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activityId, user.token]);

  const fetchTopicDetails = async (topicId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${topicId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error("Não foi possível carregar o tópico.");
      const data = await response.json();
      setSelectedTopic(data);
      setView('topic');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchTopics();
    }
  }, [view, fetchTopics]);

  // --- LÓGICA DE ENVIO DE DADOS ---
  const handleCreatePost = async (topicId, body) => {
    // Lógica para enviar uma nova resposta
  };

  const handleMarkBest = async (postId) => {
    // Lógica para marcar a melhor resposta
  };


  // --- RENDERIZAÇÃO ---
  const renderContent = () => {
    if (isLoading) return <div>Carregando...</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    switch (view) {
      case 'topic':
        return (
          <div className="flex flex-col h-full">
            <button onClick={() => setView('list')} className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200">
              <FaArrowLeft /> Voltar para a lista de tópicos
            </button>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedTopic.title}</h2>
              <p className="text-sm text-gray-400">por {selectedTopic.author_name}</p>
              <p className="text-gray-200 mt-4">{selectedTopic.body}</p>
            </div>
            <h3 className="font-bold mb-2">Respostas</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
              {selectedTopic.posts.map(post => (
                <PostItem
                  key={post.id}
                  post={post}
                  isTopicAuthor={user.id === selectedTopic.author_id}
                  onMarkBest={handleMarkBest}
                />
              ))}
            </div>
            {/* Formulário de Nova Resposta */}
            <div className="mt-4 flex">
              <input type="text" placeholder="Escreva a sua resposta..." className="flex-grow bg-gray-700 p-2 rounded-l-lg focus:outline-none" />
              <button className="bg-teal-600 p-3 rounded-r-lg"><FaPaperPlane /></button>
            </div>
          </div>
        );

      // Adicione a view 'create' aqui se desejar um formulário em tela cheia

      default: // 'list'
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-2"><FaComments /> Fórum da Atividade</h2>
              <button className="bg-blue-600 py-2 px-3 rounded-lg flex items-center gap-2 font-bold"><FaPlus /> Criar Tópico</button>
            </div>
            <div className="space-y-3">
              {topics.map(topic => (
                <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white flex flex-col" style={{ height: '80vh', maxHeight: '700px' }}>
      <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
        <FaArrowLeft /> Voltar ao Tabuleiro
      </button>
      <div className="flex-grow relative mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChatTab;