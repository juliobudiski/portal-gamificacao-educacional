// frontend/src/components/PrintableActivity.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { FaPrint, FaArrowLeft } from 'react-icons/fa';

function PrintableActivity({ activityData, onBack }) {

    const handlePrint = () => {
        window.print();
    };

    const path = activityData?.gamificationDesign?.progression_path || [];

    return (
        <div className="bg-white text-black p-4 md:p-8 min-h-screen font-sans">

            {/* --- CABEÇALHO DE CONTROLE (Não aparece na impressão) --- */}
            <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-100 p-4 rounded-xl shadow border border-gray-300 gap-4">
                <button onClick={onBack} className="flex items-center text-gray-700 hover:text-black font-bold">
                    <FaArrowLeft className="mr-2" /> Voltar para o Editor
                </button>
                <div className="text-center text-sm text-gray-500">
                    Dica: Nas opções de impressão do navegador, marque "Imprimir gráficos de fundo" (Background graphics) para ver as cores.
                </div>
                <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all">
                    <FaPrint className="mr-2" /> Salvar PDF / Imprimir
                </button>
            </div>

            {/* --- CAPA DO CADERNO --- */}
            <header className="border-b-4 border-black pb-6 mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold uppercase mb-4 tracking-tight">
                    {activityData.title || "Atividade Sem Título"}
                </h1>
                <div className="text-lg md:text-xl space-y-2 text-gray-700">
                    <p><strong>Área:</strong> {activityData.areaKnowledge || "Não definida"}</p>
                    <p><strong>Público-Alvo predominante:</strong> {activityData.playerProfile?.selectedProfiles?.join(", ") || "Geral"}</p>
                    <p><strong>Ambiente:</strong> {activityData.activityPlanning?.characteristics?.find(c => c.includes("Presencial") || c.includes("Online")) || "Desplugado"}</p>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="max-w-4xl mx-auto">
                <div className="bg-black text-white text-center py-3 mb-10 rounded-lg shadow-md">
                    <h2 className="text-2xl font-black uppercase tracking-widest">Caderno do Mestre do Jogo</h2>
                </div>

                {path.length === 0 ? (
                    <p className="italic text-gray-500 text-center text-xl">A trilha da atividade está vazia.</p>
                ) : (
                    path.map((node, index) => {
                        const stepNumber = index + 1;

                        // ==========================================
                        // 1. NARRATIVA (Diálogos e Interpretação)
                        // ==========================================
                        if (node.type === 'narrative') {
                            const dialogue = node.content?.dialogue || [];
                            return (
                                <div key={node.id} className="mb-10 break-inside-avoid">
                                    <h3 className="text-2xl font-bold text-purple-900 uppercase border-b-2 border-purple-900 mb-4 pb-2 flex items-center">
                                        <span className="bg-purple-900 text-white w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg">{stepNumber}</span>
                                        Narrativa (Roleplay)
                                    </h3>

                                    {dialogue.length === 0 ? (
                                        <p className="italic text-gray-500">Sem falas cadastradas para esta cena.</p>
                                    ) : (
                                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                                            <p className="text-xs text-purple-600 uppercase font-bold mb-4 tracking-wider border-b border-purple-200 pb-2">
                                                Instrução: Leia as falas abaixo para a turma
                                            </p>
                                            {dialogue.map((line, i) => (
                                                <div key={i} className="mb-4 text-lg leading-relaxed flex gap-3">
                                                    <strong className="text-purple-900 whitespace-nowrap min-w-[120px] text-right">
                                                        {line.characterRole}:
                                                    </strong>
                                                    <span className="text-gray-800 bg-white px-3 py-1 rounded shadow-sm flex-1">
                                                        "{line.text}"
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // ==========================================
                        // 2. CONTEÚDO (Teoria / Explicação)
                        // ==========================================
                        if (node.type === 'content') {
                            const texto = node.content?.text_content || "";
                            const videoUrl = node.content?.video_url || "";

                            return (
                                <div key={node.id} className="mb-10 break-inside-avoid">
                                    <h3 className="text-2xl font-bold text-blue-900 uppercase border-b-2 border-blue-900 mb-4 pb-2 flex items-center">
                                        <span className="bg-blue-900 text-white w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg">{stepNumber}</span>
                                        Conteúdo Base / Explicação
                                    </h3>

                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                        {videoUrl && (
                                            <div className="mb-4 bg-white p-3 rounded border border-blue-100 flex items-center gap-2 text-blue-900">
                                                <span className="text-xl">▶️</span>
                                                <strong>Exibição de Vídeo:</strong>
                                                <a href={videoUrl} className="underline text-blue-600 text-sm break-all">{videoUrl}</a>
                                            </div>
                                        )}

                                        {texto ? (
                                            <div>
                                                <p className="text-xs text-blue-600 uppercase font-bold mb-3 tracking-wider border-b border-blue-200 pb-2">
                                                    Quadro Negro / Teoria
                                                </p>
                                                {/* --- AQUI ESTÁ A MÁGICA DO MARKDOWN --- */}
                                                <div className="bg-white p-6 border border-gray-300 rounded-lg shadow-inner">
                                                    <article className="prose max-w-none text-black prose-headings:text-black prose-a:text-blue-600 prose-code:text-purple-700">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                                        >
                                                            {texto.replace(/\\n/g, '\n')}
                                                        </ReactMarkdown>
                                                    </article>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="italic text-gray-500">Sem texto teórico cadastrado.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // ==========================================
                        // 3. QUIZ (Perguntas e Gabarito)
                        // ==========================================
                        if (node.type === 'quiz') {
                            const questions = node.content?.questions || [];

                            return (
                                <div key={node.id} className="mb-10">
                                    <h3 className="text-2xl font-bold text-green-900 uppercase border-b-2 border-green-900 mb-4 pb-2 flex items-center break-inside-avoid">
                                        <span className="bg-green-900 text-white w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg">{stepNumber}</span>
                                        Desafio (Quiz & Gabarito)
                                    </h3>

                                    {questions.length === 0 ? (
                                        <p className="italic text-gray-500 break-inside-avoid">Sem perguntas cadastradas.</p>
                                    ) : (
                                        <div className="space-y-8">
                                            {questions.map((q, qIndex) => {
                                                const textoPergunta = q.text || "Pergunta sem texto";
                                                const opcoes = q.options || [];
                                                const respostaCorreta = q.correct_option || "";

                                                return (
                                                    <div key={qIndex} className="bg-green-50 p-6 rounded-xl border border-green-300 shadow-sm break-inside-avoid">

                                                        {/* Header da Pergunta */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <p className="font-bold text-xl text-gray-900 flex-1 pr-4">
                                                                {qIndex + 1}. {textoPergunta}
                                                            </p>
                                                            <div className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-full text-gray-600 font-bold whitespace-nowrap shadow-sm">
                                                                {q.points || 10} XP
                                                            </div>
                                                        </div>

                                                        {/* Alternativas */}
                                                        <ul className="space-y-3 ml-2 mb-4">
                                                            {opcoes.map((opt, oIndex) => {
                                                                const isCorrect = (opt === respostaCorreta);
                                                                return (
                                                                    <li key={oIndex}
                                                                        className={`text-lg p-3 rounded-lg flex items-start border shadow-sm
                                                                        ${isCorrect ? "bg-green-200 border-green-500 font-bold text-green-900" : "bg-white border-gray-300 text-gray-700"}`}>

                                                                        {/* Checkbox de Impressão */}
                                                                        <span className="mr-3 mt-1 text-xl flex-shrink-0">
                                                                            {isCorrect ? "☑️" : "⬜"}
                                                                        </span>
                                                                        <span className="flex-1">{opt}</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>

                                                        {/* Explicação da IA / Professor (Opcional) */}
                                                        {q.explanation && (
                                                            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg text-gray-800 text-sm shadow-inner">
                                                                <strong className="block text-yellow-800 mb-1 uppercase tracking-wide text-xs">💡 Comentário para o Professor:</strong>
                                                                {q.explanation}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return null; // Caso existam outros tipos de passos no futuro
                    })
                )}
            </main>

            {/* Rodapé de Impressão */}
            <footer className="mt-16 text-center text-sm text-gray-500 border-t border-gray-300 pt-4">
                Impresso via Portal Gamefica.Edu - {new Date().toLocaleDateString('pt-BR')}
            </footer>
        </div>
    );
}

export default PrintableActivity;