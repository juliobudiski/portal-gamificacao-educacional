// frontend/src/components/activity/ForumTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaComments, FaPlus, FaTrophy, FaPaperPlane, FaThumbtack } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// --- Sub-componentes para manter o código organizado ---

// Item da lista de CATEGORIAS
const CategoryListItem = ({ category, onSelect }) => (
    <button onClick={() => onSelect(category)} className="w-full text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <h3 className="font-bold text-white text-lg">{category.title}</h3>
        <p className="text-sm text-gray-400">{category.description}</p>
        <p className="text-xs text-teal-400 mt-2">{category.topic_count} tópicos</p>
    </button>
);

// Item da lista de TÓPICOS (perguntas)
const TopicListItem = ({ topic, onSelect }) => (
    <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex justify-between items-center">
        <div className="flex items-center gap-3">
            {topic.is_pinned && <FaThumbtack className="text-cyan-400 flex-shrink-0" title="Tópico Fixo" />}
            <div>
                <h3 className="font-bold text-white">{topic.title}</h3>
                <p className="text-sm text-gray-400">por {topic.author_name} - {topic.post_count} respostas</p>
            </div>
        </div>
        {topic.best_answer_id && <FaTrophy className="text-yellow-400 text-xl flex-shrink-0" title="Resolvido" />}
    </button>
);

// Item de um POST (resposta)
const PostItem = ({ post, isTopicAuthor, onMarkBest, isBestAnswer }) => (
    <div className={`p-4 rounded-lg border ${isBestAnswer ? 'bg-yellow-900/30 border-yellow-500' : 'bg-gray-900 border-gray-700'}`}>
        <div className="flex justify-between items-start">
            <p className="font-bold text-teal-300">{post.author_name}</p>
            {isTopicAuthor && !isBestAnswer && (
                <button onClick={() => onMarkBest(post.id)} className="text-xs flex items-center gap-1 text-yellow-400 hover:text-white">
                    <FaTrophy /> Marcar como Melhor
                </button>
            )}
        </div>
        <p className="text-gray-300 mt-2 whitespace-pre-wrap">{post.body}</p>
        {isBestAnswer && <div className="mt-3 text-xs font-bold text-yellow-400 flex items-center gap-2"><FaTrophy /> MELHOR RESPOSTA</div>}
    </div>
);

// Formulário para criar um novo TÓPICO
const CreateTopicForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { user } = useAuth(); // Apenas para verificar o papel do utilizador
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim() && body.trim()) {
            onSubmit(title, body, isPinned);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Tópico</h2>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da pergunta..." className="w-full bg-gray-700 p-2 rounded mb-4" required />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Descreva a sua pergunta em detalhe..." className="w-full flex-grow bg-gray-700 p-2 rounded mb-4 resize-none" required />
            {user.role === 'professor' && (
                <div className="flex items-center mb-4">
                    <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-4 w-4 rounded" />
                    <label htmlFor="isPinned" className="ml-2 text-gray-300">Fixar este tópico no topo do fórum</label>
                </div>
            )}
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-600 rounded">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 rounded disabled:bg-gray-500">{isSubmitting ? 'Publicando...' : 'Publicar Tópico'}</button>
            </div>
        </form>
    );
};


const ForumTab = ({ onReturn }) => {
    const { user } = useAuth();
    const { activityId } = useParams();

    // Controlo de navegação e dados
    const [view, setView] = useState('categories'); // 'categories', 'topics', 'topic_detail', 'create_topic'
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Controlo de UI e formulários
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newPostBody, setNewPostBody] = useState('');

    // --- LÓGICA DE BUSCA DE DADOS ---
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/activity/${activityId}/categories`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os canais do fórum.");
            setCategories(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [activityId, user.token]);

    const fetchTopics = useCallback(async (categoryId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${categoryId}/topics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os tópicos.");
            setTopics(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    const fetchTopicDetails = useCallback(async (topicId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${topicId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar o tópico.");
            setSelectedTopic(await response.json());
            setView('topic_detail');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    useEffect(() => { if (view === 'categories') { fetchCategories(); } }, [view, fetchCategories]);

    // --- LÓGICA DE CRIAÇÃO/ATUALIZAÇÃO ---
    const handleCreateTopic = async (title, body, isPinned) => {
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${selectedCategory.id}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ title, body, is_pinned: isPinned }),
            });
            await fetchTopics(selectedCategory.id); // Recarrega a lista de tópicos
            setView('topics');
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    const handleCreatePost = async () => {
        if (!newPostBody.trim()) return;
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${selectedTopic.id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ body: newPostBody }),
            });
            setNewPostBody('');
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    const handleMarkBest = async (postId) => {
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${selectedTopic.id}/best-answer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ post_id: postId }),
            });
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    // --- RENDERIZAÇÃO CONDICIONAL ---
    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8">Carregando...</div>;
        if (error) return <div className="text-red-400 text-center p-8">{error}</div>;

        switch (view) {
            case 'create_topic':
                return <CreateTopicForm onSubmit={handleCreateTopic} onCancel={() => setView('topics')} isSubmitting={isSubmitting} />;

            case 'topic_detail':
                return (
                    <div className="flex flex-col h-full">
                        <button onClick={() => setView('topics')} className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200">
                            <FaArrowLeft /> Voltar para os tópicos
                        </button>
                        <div className="bg-gray-700 p-4 rounded-lg mb-4">
                            <h2 className="text-2xl font-bold text-white">{selectedTopic.title}</h2>
                            <p className="text-sm text-gray-400">por {selectedTopic.author_name}</p>
                            <p className="text-gray-200 mt-4 whitespace-pre-wrap">{selectedTopic.body}</p>
                        </div>
                        <h3 className="font-bold mb-2">Respostas</h3>
                        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                            {selectedTopic.posts.map(post => (
                                <PostItem key={post.id} post={post}
                                    isTopicAuthor={user.id === selectedTopic.author_id}
                                    onMarkBest={handleMarkBest}
                                    isBestAnswer={post.id === selectedTopic.best_answer_id}
                                />
                            ))}
                        </div>
                        <div className="mt-4">
                            <textarea value={newPostBody} onChange={e => setNewPostBody(e.target.value)} placeholder="Escreva a sua resposta..." className="w-full bg-gray-700 p-2 rounded-t-lg focus:outline-none resize-none h-20" />
                            <button onClick={handleCreatePost} disabled={isSubmitting} className="w-full bg-teal-600 p-2 rounded-b-lg disabled:bg-gray-500 font-bold flex items-center justify-center gap-2">
                                <FaPaperPlane /> Publicar Resposta
                            </button>
                        </div>
                    </div>
                );

            case 'topics':
                return (
                    <>
                        <button onClick={() => setView('categories')} className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200"><FaArrowLeft /> Voltar para os canais</button>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{selectedCategory?.title}</h2>
                            <button onClick={() => setView('create_topic')} className="bg-blue-600 py-2 px-3 rounded-lg flex items-center gap-2 font-bold"><FaPlus /> Criar Tópico</button>
                        </div>
                        <div className="space-y-3">
                            {topics.length > 0 ? topics.map(topic => <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />) : <p className="text-gray-500 text-center p-8">Nenhum tópico criado neste canal ainda.</p>}
                        </div>
                    </>
                );

            default: // 'categories'
                return (
                    <>
                        <h2 className="text-2xl font-bold text-teal-400 mb-4">Canais do Fórum</h2>
                        <div className="space-y-3">
                            {categories.map(category => (
                                <CategoryListItem key={category.id} category={category} onSelect={(category) => {
                                    setSelectedCategory(category);
                                    fetchTopics(category.id);
                                    setView('topics');
                                }} />
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

export default ForumTab;