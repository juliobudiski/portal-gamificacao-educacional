import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { FaPrint, FaArrowLeft, FaCheckSquare, FaRegSquare } from 'react-icons/fa';

/**
 * @component PrintableActivity
 * @description
 * Specialized view for generating printer-friendly versions of gamified activities.
 * 
 * Architectural Decisions:
 * - Print-Specific Styling: Injects scoped CSS `@media print` rules directly to guarantee rendering fidelity.
 * - Data Transformation: Parses complex `activityData` object recursively, mapping abstract node types into concrete HTML structures.
 * - High Cohesion: All logic related to print layout and node rendering is centralized here.
 */
function PrintableActivity({ activityData, onBack }) {

    const handlePrint = () => {
        window.print();
    };

    const path = activityData?.gamificationDesign?.progression_path || [];
    
    // Extraindo dados para a capa e contexto
    const currentScenario = activityData?.currentScenario || {};
    const desiredScenario = activityData?.desiredScenario || {};
    const rules = activityData?.gamificationRules || { generalRules: [], specificRules: "" };

    return (
        <div className="bg-white text-black min-h-screen font-serif printable-container">
            {/* INJEÇÃO DE CSS DE IMPRESSÃO */}
            <style>{`
                @media print {
                    @page { margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    .no-print { display: none !important; }
                    .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
                    .page-break-before { page-break-before: always; break-before: page; }
                    
                    /* Modo Economia de Tinta (Ink Saver) */
                    .ink-saver-bg { background-color: transparent !important; }
                    .ink-saver-border { border-color: #333 !important; }
                    .ink-saver-text { color: #000 !important; }
                    .prose * { color: #000 !important; }
                }
                
                .printable-container {
                    max-width: 210mm; /* A4 Width */
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }
            `}</style>

            {/* --- CABEÇALHO DE CONTROLE (Não aparece na impressão) --- */}
            <div className="no-print flex flex-col md:flex-row justify-between items-center mb-12 bg-slate-100 p-6 rounded-xl shadow border border-slate-300 gap-4 font-sans">
                <button onClick={onBack} className="flex items-center text-slate-700 hover:text-black font-bold">
                    <FaArrowLeft className="mr-2" /> Voltar para o Editor
                </button>
                <div className="text-center text-sm text-slate-500">
                    O PDF está otimizado (Ink Saver) para remover fundos na hora da impressão.
                </div>
                <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all">
                    <FaPrint className="mr-2" /> Imprimir Caderno
                </button>
            </div>

            {/* --- CAPA E CONTEXTO DO CADERNO --- */}
            <header className="border-b-4 border-black pb-8 mb-10">
                <div className="text-center mb-8">
                    <div className="inline-block border-2 border-black px-4 py-1 font-bold tracking-widest uppercase text-sm mb-4">
                        Caderno do Mestre do Jogo
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
                        {activityData.title || "Missão Sem Título"}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold uppercase text-gray-600 ink-saver-text">
                        <span>Área: {activityData.areaKnowledge || "Não definida"}</span>
                        <span>•</span>
                        <span>Público: {activityData.playerProfile?.selectedProfiles?.join(", ") || "Geral"}</span>
                        <span>•</span>
                        <span>Ambiente: {activityData.activityPlanning?.characteristics?.find(c => c.includes("Presencial") || c.includes("Online")) || "Desplugado"}</span>
                    </div>
                </div>

                {/* SINOPSE / MISSÃO */}
                <div className="mt-8 break-inside-avoid">
                    <h2 className="text-2xl font-bold uppercase border-b-2 border-black mb-4">O Briefing da Missão</h2>
                    <p className="text-lg text-justify mb-6">{activityData.description || "Nenhuma descrição fornecida para a missão."}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cenário Atual */}
                        <div>
                            <h3 className="font-bold text-lg mb-2">Problemas a Resolver (Cenário Atual):</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {currentScenario?.problems?.map((p, i) => <li key={i}>{p}</li>)}
                                {currentScenario?.otherProblem && <li>{currentScenario.otherProblem}</li>}
                                {(!currentScenario?.problems?.length && !currentScenario?.otherProblem) && <li className="italic">Nenhum problema listado.</li>}
                            </ul>
                        </div>
                        
                        {/* Objetivos */}
                        <div>
                            <h3 className="font-bold text-lg mb-2">Objetivos (Cenário Desejado):</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {desiredScenario?.objectives?.map((o, i) => <li key={i}>{o}</li>)}
                                {desiredScenario?.otherObjective && <li>{desiredScenario.otherObjective}</li>}
                                {(!desiredScenario?.objectives?.length && !desiredScenario?.otherObjective) && <li className="italic">Nenhum objetivo listado.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* REGRAS */}
                <div className="mt-8 break-inside-avoid">
                    <h2 className="text-2xl font-bold uppercase border-b-2 border-black mb-4">Regras da Sessão</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Leis Gerais:</h3>
                            {rules.generalRules.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                    {rules.generalRules.map((rule, i) => <li key={i}>{rule}</li>)}
                                </ul>
                            ) : (
                                <p className="italic">Nenhuma regra geral selecionada.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Regras Específicas:</h3>
                            <p className="whitespace-pre-wrap">
                                {rules.specificRules || <span className="italic">Sem regras adicionais.</span>}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL (TRILHA) --- */}
            <main>
                <div className="page-break-before mb-10">
                    <h2 className="text-3xl font-black uppercase tracking-widest text-center border-y-4 border-black py-4">
                        O Roteiro da Aventura
                    </h2>
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
                                <div key={node.id} className="mb-12 break-inside-avoid">
                                    <h3 className="text-xl font-bold uppercase mb-4 flex items-center ink-saver-text">
                                        <span className="bg-black text-white ink-saver-bg ink-saver-border ink-saver-text border-2 border-black w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg font-bold">
                                            {stepNumber}
                                        </span>
                                        Cena: Roleplay Narrativo
                                    </h3>

                                    {dialogue.length === 0 ? (
                                        <p className="italic">Sem falas cadastradas para esta cena.</p>
                                    ) : (
                                        <div className="bg-gray-50 ink-saver-bg p-6 rounded-none border-l-4 border-black shadow-sm">
                                            <p className="text-xs uppercase font-bold mb-4 tracking-wider border-b border-gray-300 pb-2">
                                                Instrução: Interprete as falas abaixo para a turma
                                            </p>
                                            <div className="space-y-4">
                                                {dialogue.map((line, i) => (
                                                    <div key={i} className="text-lg leading-relaxed">
                                                        <span className="font-bold uppercase tracking-wider">{line.characterRole}:</span> 
                                                        <span className="ml-2 italic">"{line.text}"</span>
                                                    </div>
                                                ))}
                                            </div>
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
                                <div key={node.id} className="mb-12 break-inside-avoid">
                                    <h3 className="text-xl font-bold uppercase mb-4 flex items-center ink-saver-text">
                                        <span className="bg-black text-white ink-saver-bg ink-saver-border ink-saver-text border-2 border-black w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg font-bold">
                                            {stepNumber}
                                        </span>
                                        Conteúdo Teórico
                                    </h3>

                                    <div className="border border-black p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ink-saver-bg">
                                        {videoUrl && (
                                            <div className="mb-6 p-4 border border-dashed border-black bg-gray-50 ink-saver-bg">
                                                <strong className="block uppercase text-sm mb-1">Recurso de Mídia (Vídeo):</strong>
                                                <a href={videoUrl} className="underline text-blue-800 break-all">{videoUrl}</a>
                                            </div>
                                        )}

                                        {texto ? (
                                            <div>
                                                <p className="text-xs uppercase font-bold mb-3 tracking-wider border-b border-black pb-2">
                                                    Material de Apoio
                                                </p>
                                                <article className="prose max-w-none font-serif text-black prose-headings:font-sans prose-headings:font-bold prose-headings:text-black">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                        {texto.replace(/\\n/g, '\n')}
                                                    </ReactMarkdown>
                                                </article>
                                            </div>
                                        ) : (
                                            <p className="italic">Sem texto teórico cadastrado.</p>
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
                                <div key={node.id} className="mb-12">
                                    <h3 className="text-xl font-bold uppercase mb-4 flex items-center ink-saver-text break-inside-avoid">
                                        <span className="bg-black text-white ink-saver-bg ink-saver-border ink-saver-text border-2 border-black w-8 h-8 flex items-center justify-center rounded-full mr-3 text-lg font-bold">
                                            {stepNumber}
                                        </span>
                                        Desafio / Avaliação
                                    </h3>

                                    {questions.length === 0 ? (
                                        <p className="italic break-inside-avoid">Sem perguntas cadastradas.</p>
                                    ) : (
                                        <div className="space-y-10">
                                            {questions.map((q, qIndex) => {
                                                const textoPergunta = q.text || "Pergunta sem texto";
                                                const opcoes = q.options || [];
                                                const respostaCorreta = q.correct_option || "";

                                                return (
                                                    <div key={qIndex} className="break-inside-avoid">
                                                        
                                                        {/* Header da Pergunta */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <p className="font-bold text-lg text-black flex-1 pr-4">
                                                                {qIndex + 1}. {textoPergunta}
                                                            </p>
                                                            <div className="text-xs border-2 border-black px-2 py-1 uppercase font-bold whitespace-nowrap">
                                                                Valendo {q.points || 10} XP
                                                            </div>
                                                        </div>

                                                        {/* Alternativas */}
                                                        <ul className="space-y-2 ml-4 mb-4">
                                                            {opcoes.map((opt, oIndex) => {
                                                                const isCorrect = (opt === respostaCorreta);
                                                                return (
                                                                    <li key={oIndex} className="flex items-start text-lg">
                                                                        <span className="mr-3 mt-1 flex-shrink-0">
                                                                            {isCorrect ? <FaCheckSquare /> : <FaRegSquare />}
                                                                        </span>
                                                                        <span className={isCorrect ? "font-bold underline decoration-wavy underline-offset-4 decoration-1" : ""}>
                                                                            {opt}
                                                                        </span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>

                                                        {/* Comentário da IA / Professor */}
                                                        {q.explanation && (
                                                            <div className="mt-4 p-4 border border-dashed border-gray-400 bg-gray-50 ink-saver-bg text-sm">
                                                                <strong className="block uppercase tracking-wide text-xs mb-1">Dica de Facilitação / Comentário:</strong>
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

                        return null;
                    })
                )}
            </main>

            {/* Rodapé de Impressão */}
            <footer className="mt-16 text-center text-xs uppercase font-bold text-gray-500 border-t-2 border-black pt-4 page-break-before">
                Caderno gerado por Portal Gamefica.Edu - {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}
            </footer>
        </div>
    );
}

export default PrintableActivity;
