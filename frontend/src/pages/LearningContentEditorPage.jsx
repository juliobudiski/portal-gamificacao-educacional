import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaVideo, FaEye, FaSave, FaExternalLinkAlt, FaAlignLeft } from 'react-icons/fa';
import { useActivityCreation } from '../context/ActivityCreationContext';
import LearningMaterialViewer from '../components/activity/LearningMaterialViewer';

// Helper focado no YouTube
const getYouTubeEmbedUrl = (input) => {
    if (!input) return null;
    let urlString = input.trim();
    const iframeMatch = urlString.match(/src=["'](.*?)["']/i);
    if (iframeMatch) {
        urlString = iframeMatch[1];
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlString.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return /^https?:\/\//i.test(urlString) ? urlString : `https://${urlString}`;
};

/**
 * Componente LearningContentEditorPage
 * 
 * Página dedicada à edição do conteúdo educacional bruto de uma atividade (questões, texto, links).
 */
function LearningContentEditorPage({ initialData, onSave, isOfflineMode = false }) {
    const { activityId, stepId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activityData } = useActivityCreation();

    const [contentConfig, setContentConfig] = useState(() => {
        if (initialData) return initialData;
        const stepContent = activityData?.gamificationDesign?.progression_path?.find(p => p.id === stepId)?.content;
        return {
            video_url: stepContent?.video_url || '',
            text_content: stepContent?.text_content || '',
            material_link: stepContent?.material_link || ''
        };
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchContent = useCallback(async () => {
        if (isOfflineMode || !activityId || !stepId || !user?.token) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content?type=content`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (response.ok && data) {
                setContentConfig({
                    video_url: data.video_url || '',
                    text_content: data.text_content || '',
                    material_link: data.material_link || ''
                });
            }
        } catch (err) {
            console.error("Erro ao buscar conteúdo:", err);
        } finally {
            setLoading(false);
        }
    }, [activityId, stepId, user?.token, isOfflineMode]);

    useEffect(() => { fetchContent(); }, [fetchContent]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContentConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (isOfflineMode) {
            if (onSave) onSave(contentConfig);
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const payload = { type: 'content', ...contentConfig };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao salvar conteúdo.');

            setMessage('Conteúdo salvo com sucesso!');
            setTimeout(() => navigate(`/professor/atividades/${activityId}/edit`, { state: { fromStep: 5 } }), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const finalVideoUrl = getYouTubeEmbedUrl(contentConfig.video_url);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 transition-colors duration-300 relative overflow-hidden">
            {/* Efeitos de luz ao fundo */}
            <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[500px] h-[400px] bg-green-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center gap-3 mb-8 bg-black/30 p-6 rounded-3xl border border-white/5 shadow-xl backdrop-blur-md">
                    <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-4 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                        <FaVideo className="text-2xl text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 drop-shadow-md">Editor de Conteúdo Base</h1>
                        <p className="text-gray-400 mt-1 font-medium tracking-wide">Acervo técnico, videoaulas e manuais de consulta.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* COLUNA ESQUERDA: EDITOR */}
                    <div className="space-y-6">
                        <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 group">
                            <label className="block text-sm font-bold mb-3 flex items-center gap-2 text-gray-300 uppercase tracking-wider">
                                <FaVideo className="text-red-500" /> Link do YouTube (Stream)
                            </label>
                            <input
                                type="text"
                                name="video_url"
                                value={contentConfig.video_url}
                                onChange={handleInputChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full p-4 bg-gray-900/60 text-white rounded-2xl border border-white/10 focus:border-red-500/50 outline-none transition-all duration-300 placeholder-gray-600 shadow-inner group-hover:border-white/20"
                            />
                            <p className="text-xs text-gray-500 mt-3 italic">
                                Dica: Cole o link direto do vídeo ou o código de incorporação (iframe).
                            </p>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 group">
                            <label className="block text-sm font-bold mb-3 flex items-center gap-2 text-gray-300 uppercase tracking-wider">
                                <FaExternalLinkAlt className="text-blue-400" /> Material Complementar Exato
                            </label>
                            <input
                                type="text"
                                name="material_link"
                                value={contentConfig.material_link}
                                onChange={handleInputChange}
                                placeholder="https://drive.google.com/... (PDF/Slide)"
                                className="w-full p-4 bg-gray-900/60 text-white rounded-2xl border border-white/10 focus:border-blue-400/50 outline-none transition-all duration-300 placeholder-gray-600 shadow-inner group-hover:border-white/20"
                            />
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 group">
                            <label className="block text-sm font-bold mb-3 flex items-center gap-2 text-gray-300 uppercase tracking-wider">
                                <FaAlignLeft className="text-green-400" /> Log de Transmissão (Texto / Markdown)
                            </label>
                            <textarea
                                name="text_content"
                                rows="12"
                                value={contentConfig.text_content}
                                onChange={handleInputChange}
                                placeholder="# Título da Aula&#10;&#10;Escreva aqui o conteúdo teórico..."
                                className="w-full p-4 bg-gray-900/60 text-gray-300 rounded-2xl border border-white/10 focus:border-green-400/50 outline-none transition-all duration-300 placeholder-gray-600 shadow-inner font-mono text-sm leading-relaxed group-hover:border-white/20 custom-scrollbar"
                            />
                        </div>
                    </div>

                    {/* COLUNA DIREITA: PREVIEW */}
                    <div className="space-y-6">
                        <div className="bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                            <h3 className="text-xl font-bold text-gray-300 mb-6 flex items-center gap-2">
                                Pré-visualização do Stream
                            </h3>

                            <div className="relative pt-[56.25%] bg-black rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-gray-700/50 group">
                                {finalVideoUrl ? (
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={finalVideoUrl}
                                        title="Video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gray-900/50">
                                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3 border border-gray-700 group-hover:scale-110 transition-transform">
                                            <FaVideo size={24} className="opacity-50" />
                                        </div>
                                        <p className="font-medium tracking-wide">Sem sinal de vídeo</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-blue-300 text-sm flex items-start gap-3 shadow-inner">
                                <FaExternalLinkAlt className="mt-1 flex-shrink-0 opacity-70" />
                                <p><strong>Simulação:</strong> O layout abaixo mostra exatamente como o aluno verá este conteúdo dentro do módulo da atividade.</p>
                            </div>
                        </div>

                        <div className="xl:sticky xl:top-8 space-y-4">
                            <h3 className="text-xl font-bold text-gray-300 flex items-center gap-2 ml-2">
                                <FaEye className="text-teal-400" /> Interface do Aluno
                            </h3>

                            {/* Container estilo Tablet/Mockup */}
                            <div className="border border-white/10 rounded-[2rem] overflow-hidden bg-gray-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[80vh] custom-scrollbar relative">
                                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10"></div>
                                <LearningMaterialViewer
                                    content={contentConfig}
                                    onComplete={() => { }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center">
                    <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-extrabold py-4 px-12 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-lg group disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                        <FaSave className="transform group-hover:scale-125 transition-transform" /> 
                        {loading ? 'Transmitindo...' : 'Publicar Módulo de Ensino'}
                    </button>

                    {message && (
                        <div className="mt-6 p-4 bg-green-900/30 text-green-400 border border-green-500/50 rounded-xl flex items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)] w-full md:w-auto justify-center">
                            <span className="text-xl mr-3">✓</span> {message}
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 p-4 bg-red-900/30 text-red-400 border border-red-500/50 rounded-xl flex items-center font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)] w-full md:w-auto justify-center">
                            <span className="text-xl mr-3">!</span> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LearningContentEditorPage;