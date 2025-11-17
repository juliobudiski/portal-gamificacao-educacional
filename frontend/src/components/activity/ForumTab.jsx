import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaComments, FaPlus, FaTrophy, FaPaperPlane, FaThumbtack, FaHeart, FaRegHeart, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// --- Sub-componentes para manter o código organizado ---
const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// Item da lista de CATEGORIAS
const CategoryListItem = ({ category, onSelect }) => (
    // --- CORREÇÃO: Fundo e hover cientes do tema ---
    <button onClick={() => onSelect(category)} className="w-full text-left p-4 bg-secondary-bg rounded-lg hover:bg-hover-bg-color transition-colors border border-border-color">
        <h3 className="font-bold text-primary-text text-lg">{category.title}</h3>
        <p className="text-sm text-secondary-text">{category.description}</p>
        {/* --- CORREÇÃO: Cor de texto ciente do tema --- */}
        <p className="text-xs text-accent-teal mt-2">{category.topic_count} tópicos</p>
    </button>
);

// Item da lista de TÓPICOS (perguntas)
const TopicListItem = ({ topic, onSelect }) => (
    // --- CORREÇÃO: Fundo e hover cientes do tema ---
    <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-secondary-bg rounded-lg hover:bg-hover-bg-color transition-colors flex justify-between items-center border border-border-color">
        <div className="flex items-center gap-3">
            {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
            {topic.is_pinned && <FaThumbtack className="text-accent-teal flex-shrink-0" title="Tópico Fixo" />}
            <div>
                <h3 className="font-bold text-primary-text">{topic.title}</h3>
                <p className="text-sm text-secondary-text">por {topic.author_name} - {topic.post_count} respostas</p>
            </div>
        </div>
        {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
        {topic.best_answer_id && <FaTrophy className="text-accent-yellow text-xl flex-shrink-0" title="Resolvido" />}
    </button>
);

// Item de um POST (resposta)
const PostItem = ({ post, isTopicAuthor, onMarkBest, isBestAnswer, onToggleLike }) => (
    // --- CORREÇÃO: Fundos e bordas cientes do tema ---
    <div className={`p-4 rounded-lg border ${isBestAnswer ? 'bg-accent-yellow/10 border-accent-yellow' : 'bg-primary-bg border-border-color'}`}>
        <div className="flex justify-between items-start">
            {/* --- CORREÇÃO: Cor de texto ciente do tema --- */}
            <p className="font-bold text-accent-teal">{post.author_name}</p>
            <p className="text-xs text-secondary-text">{formatDate(post.created_at)}</p>
            {isTopicAuthor && !isBestAnswer && (
                <button onClick={() => onMarkBest(post.id)} className="text-xs flex items-center gap-1 text-accent-yellow hover:text-accent-yellow/80">
                    <FaTrophy /> Marcar como Melhor
                </button>
            )}
        </div>
        <p className="text-secondary-text mt-2 whitespace-pre-wrap">{post.body}</p>
        <div className="flex justify-between items-center mt-3">
            {isBestAnswer
                // --- CORREÇÃO: Cor de texto ciente do tema ---
                ? <div className="text-xs font-bold text-accent-yellow flex items-center gap-2"><FaTrophy /> MELHOR RESPOSTA</div>
                : <div></div> // Espaçador
            }
            <div className="flex items-center gap-2 text-secondary-text">
                <span className="text-sm">{post.likes_count}</span>
                {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
                <button onClick={() => onToggleLike(post.id, post.current_user_has_liked)} className="text-lg hover:text-danger transition-colors">
                    {post.current_user_has_liked ? <FaHeart className="text-danger" /> : <FaRegHeart />}
                </button>
            </div>
        </div>
    </div>
);

// Formulário para criar um novo TÓPICO
const CreateTopicForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { user } = useAuth();
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
            <h2 className="text-2xl font-bold mb-4 text-primary-text">Criar Novo Tópico</h2>
            {/* --- CORREÇÃO: Inputs cientes do tema --- */}
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da pergunta..." className="w-full bg-secondary-bg p-2 rounded mb-4 border border-border-color text-primary-text" required />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Descreva a sua pergunta em detalhe..." className="w-full flex-grow bg-secondary-bg p-2 rounded mb-4 resize-none border border-border-color text-primary-text" required />
            {user.role === 'professor' && (
                <div className="flex items-center mb-4">
                    <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-4 w-4 rounded" />
                    <label htmlFor="isPinned" className="ml-2 text-secondary-text">Fixar este tópico no topo do fórum</label>
                </div>
            )}
            <div className="flex justify-end gap-4">
                {/* --- CORREÇÃO: Botões cientes do tema --- */}
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-secondary-bg border border-border-color rounded hover:bg-hover-bg-color">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-accent-teal text-gray-900 rounded disabled:opacity-50">{isSubmitting ? 'Publicando...' : 'Publicar Tópico'}</button>
            </div>
        </form>
    );
};


const ForumTab = ({ onReturn }) => {
    const { user } = useAuth();
    const { activityId } = useParams();

    const [view, setView] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newPostBody, setNewPostBody] = useState('');

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/activity/${activityId}/categories`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os canais do fórum.");
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [activityId, user.token]);

    const fetchTopics = useCallback(async (categoryId) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${categoryId}/topics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os tópicos.");
            setTopics(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    const fetchTopicDetails = useCallback(async (topicId) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${topicId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar o tópico.");
            setSelectedTopic(await response.json());
            setView('topic_detail');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    useEffect(() => { if (view === 'categories') { fetchCategories(); } }, [view, fetchCategories]);

    const handleToggleLike = async (postId) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            setSelectedTopic(prevTopic => ({
                ...prevTopic,
                posts: prevTopic.posts.map(p => {
                    if (p.id === postId) {
                        const hasLiked = !p.current_user_has_liked;
                        const likeCount = hasLiked ? p.likes_count + 1 : p.likes_count - 1;
                        return { ...p, current_user_has_liked: hasLiked, likes_count: likeCount };
                    }
                    return p;
                })
            }));
        } catch (err) {
            setError("Não foi possível registrar o like. Tente novamente.");
        }
    };
    const handleCreateTopic = async (title, body, isPinned) => {
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${selectedCategory.id}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ title, body, is_pinned: isPinned }),
            });
            await fetchTopics(selectedCategory.id);
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

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <FaSpinner className="animate-spin text-4xl text-yellow-400 mb-4" />
                    <p>Carregando Fórum...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-red-400 text-center p-8">
                    <FaExclamationCircle className="text-5xl mx-auto mb-4" />
                    <p className="font-semibold">Falha ao carregar o fórum</p>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }
        switch (view) {
            case 'create_topic':
                return <CreateTopicForm onSubmit={handleCreateTopic} onCancel={() => setView('topics')} isSubmitting={isSubmitting} />;

            case 'topic_detail':
                return (
                    <div className="flex flex-col h-full">
                        <div>
                            <button onClick={() => setView('topics')} className="mb-4 flex items-center gap-2 text-accent-yellow hover:text-accent-yellow/80">
                                <FaArrowLeft /> Voltar para os tópicos
                            </button>
                            {/* --- CORREÇÃO: Fundo e borda cientes do tema --- */}
                            <div className="bg-secondary-bg p-4 rounded-lg mb-4 border border-border-color">
                                <h2 className="text-2xl font-bold text-primary-text">{selectedTopic.title}</h2>
                                <p className="text-sm text-secondary-text">por {selectedTopic.author_name}</p>
                                <p className="text-primary-text mt-4 whitespace-pre-wrap">{selectedTopic.body}</p>
                            </div>
                            <h3 className="font-bold mb-2 text-primary-text">Respostas</h3>
                        </div>
                        <div className="flex-grow space-y-4 overflow-y-auto pr-2 min-h-0">
                            {selectedTopic.posts.map(post => (
                                <PostItem key={post.id} post={post}
                                    isTopicAuthor={Number(user.id) === Number(selectedTopic.author_id)}
                                    onMarkBest={handleMarkBest}
                                    isBestAnswer={post.id === selectedTopic.best_answer_id}
                                    onToggleLike={handleToggleLike}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex-shrink-0">
                            {/* --- CORREÇÃO: Textarea e botão cientes do tema --- */}
                            <textarea value={newPostBody} onChange={e => setNewPostBody(e.target.value)} placeholder="Escreva a sua resposta..." className="w-full bg-secondary-bg p-2 rounded-t-lg focus:outline-none resize-none h-20 border-t border-x border-border-color text-primary-text" />
                            <button onClick={handleCreatePost} disabled={isSubmitting} className="w-full bg-accent-teal p-2 rounded-b-lg disabled:opacity-50 font-bold flex items-center justify-center gap-2 text-gray-900">
                                <FaPaperPlane /> Publicar Resposta
                            </button>
                        </div>
                    </div>
                );

            case 'topics':
                return (
                    <>
                        <button onClick={() => setView('categories')} className="mb-4 flex items-center gap-2 text-accent-yellow hover:text-accent-yellow/80"><FaArrowLeft /> Voltar para os canais</button>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-primary-text">{selectedCategory?.title}</h2>
                            {/* --- CORREÇÃO: Botão ciente do tema --- */}
                            <button onClick={() => setView('create_topic')} className="bg-accent-teal text-gray-900 py-2 px-3 rounded-lg flex items-center gap-2 font-bold"><FaPlus /> Criar Tópico</button>
                        </div>
                        <div className="space-y-3">
                            {topics.length > 0 ? topics.map(topic => <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />) : <p className="text-secondary-text text-center p-8">Nenhum tópico criado neste canal ainda.</p>}
                        </div>
                    </>
                );

            default:
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
        <div className="relative pt-16 bg-primary-bg p-6 rounded-lg text-primary-text flex flex-col" style={{ height: '80vh', maxHeight: '700px' }}>

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

            <div className="flex-grow relative mt-8 min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default ForumTab;