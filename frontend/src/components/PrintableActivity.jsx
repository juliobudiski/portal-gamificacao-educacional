import React, { useEffect } from 'react';
import { FaPrint, FaArrowLeft } from 'react-icons/fa';

function PrintableActivity({ activityData, onBack }) {

    const handlePrint = () => {
        window.print();
    };

    const path = activityData?.gamificationDesign?.progression_path || [];

    // DEBUG AVANÇADO: Isso vai destrinchar o objeto inteiro
    useEffect(() => {
        if (path && path.length > 0) {
            console.log("--- ESTRUTURA REAL DO PATH ---");
            path.forEach((node, index) => {
                console.log(`Nó ${index} (${node.type}):`, JSON.stringify(node, null, 2));
            });
        }
    }, [path]);

    return (
        <div className="bg-white text-black p-8 min-h-screen">

            <div className="no-print flex justify-between items-center mb-8 bg-gray-100 p-4 rounded-lg shadow">
                <button onClick={onBack} className="flex items-center text-gray-700 hover:text-black">
                    <FaArrowLeft className="mr-2" /> Voltar para o Editor
                </button>
                <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700">
                    <FaPrint className="mr-2" /> Salvar como PDF / Imprimir
                </button>
            </div>

            <header className="border-b-2 border-black pb-4 mb-8">
                <h1 className="text-4xl font-extrabold uppercase mb-2">{activityData.title || "Atividade Sem Título"}</h1>
                <p className="text-lg"><strong>Área de Conhecimento:</strong> {activityData.areaKnowledge}</p>
                <p className="text-lg"><strong>Público-Alvo predominante:</strong> {activityData.playerProfile?.selectedProfiles?.join(", ") || "Não informado"}</p>
            </header>

            <main>
                <h2 className="text-2xl font-bold mb-6 border-b border-gray-300 pb-2">Roteiro do Mestre de Jogo (Trilha)</h2>

                {path.length === 0 ? (
                    <p className="italic text-gray-500">Nenhum elemento adicionado à trilha ainda.</p>
                ) : (
                    path.map((node, index) => {

                        // --- NARRATIVA ---
                        if (node.type === 'narrative') {
                            // Tenta ler 'text', se não tiver tenta 'content', se não tiver 'story'
                            const textoNarrativa = node.content?.text || node.content?.content || node.content?.story;
                            return (
                                <div key={node.id} className="print-section border-l-4 border-purple-500 pl-4 mb-6">
                                    <h3 className="text-xl font-bold text-purple-700 uppercase">Fase {index + 1}: Narrativa</h3>
                                    <p className="mt-2 text-justify whitespace-pre-wrap">{textoNarrativa || "Sem texto de narrativa cadastrado."}</p>
                                </div>
                            );
                        }

                        // --- CONTEÚDO BASE ---
                        if (node.type === 'content') {
                            const titulo = node.content?.title || node.content?.titulo || "Conteúdo";
                            const texto = node.content?.body || node.content?.text || node.content?.content;
                            return (
                                <div key={node.id} className="print-section border-l-4 border-blue-500 pl-4 mb-6">
                                    <h3 className="text-xl font-bold text-blue-700 uppercase">Fase {index + 1}: Conteúdo Base</h3>
                                    <h4 className="font-semibold mt-2">{titulo}</h4>
                                    <p className="mt-2 text-justify whitespace-pre-wrap">{texto || "Sem texto de conteúdo cadastrado."}</p>
                                </div>
                            );
                        }

                        // --- QUIZ ---
                        if (node.type === 'quiz') {
                            const questions = node.content?.questions || node.content?.perguntas || [];
                            return (
                                <div key={node.id} className="print-section border-l-4 border-green-500 pl-4 mb-6">
                                    <h3 className="text-xl font-bold text-green-700 uppercase">Fase {index + 1}: Desafio (Quiz)</h3>
                                    {questions.length === 0 ? <p className="mt-2">Sem perguntas cadastradas.</p> : (
                                        <ul className="mt-4 space-y-4">
                                            {questions.map((q, qIndex) => {
                                                // Tenta achar a pergunta
                                                const textoPergunta = q.questionText || q.question || q.text || q.pergunta || "Pergunta sem texto";
                                                // Tenta achar as opções
                                                const opcoes = q.options || q.opcoes || q.answers || [];

                                                return (
                                                    <li key={qIndex} className="bg-gray-50 p-4 rounded border border-gray-200">
                                                        <p className="font-bold">Q{qIndex + 1}: {textoPergunta}</p>
                                                        <ul className="mt-2 ml-4 list-disc space-y-1">
                                                            {opcoes.map((opt, oIndex) => {
                                                                const textoOpcao = opt.text || opt.texto || opt.label;
                                                                const correta = opt.isCorrect || opt.correta || opt.is_correct;
                                                                return (
                                                                    <li key={oIndex} className={correta ? "font-bold text-green-700" : "text-gray-600"}>
                                                                        {textoOpcao} {correta && " (Resposta Correta)"}
                                                                    </li>
                                                                )
                                                            })}
                                                        </ul>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        }

                        return null;
                    })
                )}
            </main>
        </div>
    );
}

export default PrintableActivity;