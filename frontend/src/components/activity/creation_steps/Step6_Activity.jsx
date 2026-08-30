import React from 'react';
import GameBoardEditor from '../../activity/GameBoardEditor';
import { useHelpModal } from "../../../context/HelpModalContext";
import { FaRoute, FaLightbulb, FaRobot } from 'react-icons/fa';

/**
 * Criação de Atividade - Passo 6 (Revisão e Publicação)
 * 
 * Consolida todos os dados configurados nos passos anteriores para revisão final
 * e realiza o envio (POST) para salvar a atividade no banco de dados.
 */


function Step6_GameBoard({ activityData, setActivityData, onEditContent, onStructureChange }) {
  const { openHelp } = useHelpModal();

  return (
    <div id="tour-gameboard-intro" className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Configuração do Tabuleiro
        </h2>
        <p className="mt-2 text-secondary-text">
          A trilha de progressão é o coração da sua atividade gamificada. É aqui que você define a jornada que os alunos farão.
        </p>
      </div>

      <div className="bg-info-bg/30 border-l-4 border-info p-4 rounded-r-lg shadow-sm">
        <h4 className="flex items-center text-lg font-bold text-info mb-2">
          <FaLightbulb className="mr-2" /> Dicas para um bom tabuleiro:
        </h4>
        <ul className="list-disc list-inside text-sm text-secondary-text space-y-1">
          <li>Alterne entre <strong>Narrativa</strong> (para engajar), <strong>Conteúdo</strong> (para ensinar) e <strong>Quiz</strong> (para avaliar).</li>
          <li>Evite colocar um <strong>Quiz</strong> como o primeiro passo da trilha; prepare o aluno antes!</li>
          <li>Aproveite o <strong className="text-accent-purple"><FaRobot className="inline mr-1" />Assistente de IA</strong> para gerar ideias, mas <strong>lembre-se de revisar e validar</strong> cada rascunho gerado.</li>
        </ul>
      </div>

      <GameBoardEditor
        gamificationDesign={activityData.gamificationDesign}
        setActivityData={setActivityData}
        onEditContent={onEditContent}
        onStructureChange={onStructureChange}
        activityId={activityData.id}
        fullActivityData={activityData}
      />

      <button onClick={() => openHelp('tabuleiro_progressao')} className="bg-info text-white px-4 py-2 rounded-lg font-bold hover:bg-info/90 transition-colors">
        Ajuda
      </button>
    </div>
  );
}

export default Step6_GameBoard;