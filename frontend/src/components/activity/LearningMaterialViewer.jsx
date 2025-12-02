import React from 'react';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LearningMaterialViewer = ({ content, onComplete }) => {
    // Extrai dados com fallback
    const { video_url, text_content, material_link } = content || {};

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-secondary-bg rounded-xl shadow-2xl overflow-hidden border border-border-color animate-fade-in">

            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    📚 Material de Estudo
                </h2>
                {material_link && (
                    <a
                        href={material_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                        Material Complementar ↗
                    </a>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Seção de Vídeo (Renderiza apenas se houver URL) */}
                {video_url && (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-gray-700">
                        <ReactPlayer
                            url={video_url}
                            width="100%"
                            height="100%"
                            controls={true}
                            config={{
                                youtube: {
                                    playerVars: { showinfo: 1 }
                                }
                            }}
                        />
                    </div>
                )}

                {/* Seção de Texto (Markdown) */}
                {text_content && (
                    <div className="prose prose-invert max-w-none text-primary-text bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {text_content}
                        </ReactMarkdown>
                    </div>
                )}

                {!video_url && !text_content && (
                    <div className="text-center text-gray-500 py-10">
                        Nenhum conteúdo cadastrado para este passo.
                    </div>
                )}
            </div>

            {/* Footer / Ações */}
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-end">
                <button
                    onClick={() => onComplete(content.step_id)}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-2"
                >
                    <span>Entendi, continuar!</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default LearningMaterialViewer;