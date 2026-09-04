import React from 'react';
import GameBoardEditor from '../../activity/GameBoardEditor';
import { useHelpModal } from "../../../context/HelpModalContext";
import { FaRoute, FaLightbulb, FaRobot, FaInfoCircle } from 'react-icons/fa';

/**
 * Criação de Atividade - Passo 6 (Revisão e Publicação)
 * 
 * Consolida todos os dados configurados nos passos anteriores para revisão final
 * e realiza o envio (POST) para salvar a atividade no banco de dados.
 */


function Step6_GameBoard({ activityData, setActivityData, onEditContent, onStructureChange }) {
  const { openHelp } = useHelpModal();

  return (
    <div id="tour-gameboard-intro" className="space-y-10 animate-fade-in relative pb-10">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Configuração do Tabuleiro
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            A trilha de progressão é o coração da sua atividade. Defina a jornada que os alunos farão.
          </p>
        </div>
        <button
          onClick={() => openHelp('tabuleiro_progressao')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      <div className="bg-info-bg/30 backdrop-blur-sm border border-info/50 p-6 rounded-2xl animate-fade-in shadow-inner">
        <h4 className="flex items-center text-xl font-bold text-info mb-4 uppercase tracking-wider">
          <FaLightbulb className="mr-3 text-2xl" /> Dicas para um bom tabuleiro:
        </h4>
        <ul className="list-disc list-inside text-base text-primary-text space-y-2 leading-relaxed ml-2">
          <li>Alterne entre <strong className="text-accent-teal">Narrativa</strong> (para engajar), <strong className="text-accent-yellow">Conteúdo</strong> (para ensinar) e <strong className="text-accent-purple">Quiz</strong> (para avaliar).</li>
          <li>Evite colocar um <strong className="text-accent-purple">Quiz</strong> como o primeiro passo da trilha; prepare o aluno antes!</li>
          <li>Aproveite o <strong className="text-accent-purple font-extrabold"><FaRobot className="inline mr-2 text-xl" />Assistente de IA</strong> para gerar ideias, mas <strong className="text-info">lembre-se de revisar e validar</strong> cada rascunho gerado.</li>
        </ul>
      </div>

      <div className="pt-4">
          <GameBoardEditor
            gamificationDesign={activityData.gamificationDesign}
            setActivityData={setActivityData}
            onEditContent={onEditContent}
            onStructureChange={onStructureChange}
            activityId={activityData.id}
            fullActivityData={activityData}
          />
      </div>
    </div>
  );
}

export default Step6_GameBoard;