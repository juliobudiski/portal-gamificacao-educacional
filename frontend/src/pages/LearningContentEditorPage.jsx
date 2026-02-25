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
        <div className="min-h-screen bg-primary-bg text-primary-text p-4 md:p-8">
            <div className="max-w-full mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
                        <FaVideo className="text-xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Editor de Conteúdo</h1>
                        <p className="text-secondary-text">Adicione videoaulas e textos explicativos.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaVideo className="text-red-500" /> Link do YouTube
                            </label>
                            <input
                                type="text"
                                name="video_url"
                                value={contentConfig.video_url}
                                onChange={handleInputChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Dica: Cole o link direto do vídeo ou o código de incorporação (iframe).
                            </p>
                        </div>

                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaExternalLinkAlt className="text-blue-400" /> Link de Material Complementar (PDF/Slide)
                            </label>
                            <input
                                type="text"
                                name="material_link"
                                value={contentConfig.material_link}
                                onChange={handleInputChange}
                                placeholder="https://drive.google.com/..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaAlignLeft className="text-green-400" /> Conteúdo em Texto (Markdown suportado)
                            </label>
                            <textarea
                                name="text_content"
                                rows="12"
                                value={contentConfig.text_content}
                                onChange={handleInputChange}
                                placeholder="# Título da Aula&#10;&#10;Escreva aqui o conteúdo teórico..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-secondary-text">Pré-visualização do Vídeo</h3>

                        <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700">
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                    <FaVideo size={40} className="mb-2 opacity-50" />
                                    <p>Cole um link para visualizar</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-info-bg p-4 rounded-lg border border-info/30 text-info text-sm">
                            <strong>Nota:</strong> O texto escrito ao lado aparecerá formatado abaixo do vídeo na visão do aluno.
                        </div>

                        <div className="lg:sticky lg:top-8 space-y-4">
                            <h3 className="text-xl font-bold text-secondary-text flex items-center gap-2">
                                <FaEye /> Visualização do Aluno
                            </h3>

                            <div className="border-2 border-dashed border-border-color rounded-2xl overflow-hidden bg-secondary-bg shadow-2xl overflow-y-auto max-h-[80vh]">
                                <LearningMaterialViewer
                                    content={contentConfig}
                                    onComplete={() => { }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-color flex flex-col md:flex-row gap-4 items-center">
                    <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <FaSave /> {loading ? 'Salvando...' : 'Salvar Conteúdo'}
                    </button>

                    {message && <span className="text-green-400 font-medium animate-pulse">{message}</span>}
                    {error && <span className="text-red-400 font-medium">{error}</span>}
                </div>
            </div>
        </div>
    );
}

export default LearningContentEditorPage;