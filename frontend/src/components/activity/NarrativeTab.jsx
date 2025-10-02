import React, { useState } from 'react';
import { FaPlay, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props
import { useAuth } from '../../context/AuthContext'; // Importe o useAuth
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAnalytics from '../../hooks/useAnalytics';
// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * @component NarrativeTab
 * @desc Componente para exibição de narrativa gamificada com personagens e diálogos.
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.narrativeConfig - Configuração da narrativa
 * @param {string} props.narrativeConfig.scenario - URL da imagem de cenário
 * @param {Array} props.narrativeConfig.characters - Lista de personagens
 * @param {Array} props.narrativeConfig.dialogue - Diálogos da narrativa
 * @param {Function} props.onStart - Callback para iniciar o desafio
 * @returns {JSX.Element} Interface de narrativa interativa
 */
const NarrativeTab = ({ content, onComplete }) => {
  // Desestrutura os dados da narrativa de dentro do objeto 'content'
  const { scenario, characters, dialogue } = content;
  // Log de inicialização do componente
  if (isDebugMode) {
    console.log('[NarrativeTab] Componente inicializado', {
      configPresent: !!content,
      characterCount: characters?.length || 0,
      dialogueLines: dialogue?.length || 0
    });
  }


  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const { user } = useAuth(); // Obtenha o usuário do contexto
  const { activityId } = useParams();
  // 2. Inicializar o hook de analytics para a seção "narrative"
  const { logEvent } = useAnalytics("narrative", user.token, activityId);
  // Se não houver configuração de narrativa, exibe uma mensagem padrão.
  if (!content || !scenario || characters.length === 0) {
    // Log de narrativa não configurada
    if (isDebugMode) {
      console.log('[NarrativeTab] Narrativa não configurada - exibindo estado padrão');
    }

    return (
      <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Missão</h2>
        <p className="text-gray-400">A narrativa para esta atividade ainda não foi configurada.</p>
        <button
          onClick={onStart}
          className="mt-8 py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold flex items-center justify-center mx-auto"
        >
          <FaPlay className="mr-2" /> Ir para o Desafio
        </button>
      </div>
    );
  }

  useEffect(() => {
    // Este useEffect agora roda apenas uma vez quando o componente é montado
    // para registrar que a narrativa foi visualizada.
    if (user?.role === 'aluno') {
      logEvent("narrative_viewed", {
        // --- CORREÇÃO APLICADA AQUI ---
        total_dialogue_lines: dialogue?.length || 0
      });
      console.log('[NarrativeTab] Visualização da narrativa registrada via useAnalytics.');
    }
    // A dependência agora é 'dialogue.length', que é a variável correta.
  }, [logEvent, user?.role, dialogue?.length]);


  const currentLine = dialogue[currentLineIndex];
  const currentCharacter = characters.find(c => c.role === currentLine?.characterRole);


  /**
   * @function goToNextLine
   * @desc Avança para o próximo diálogo na sequência narrativa
   * @returns {void}
   */
  const goToNextLine = () => {
    if (currentLineIndex < dialogue.length - 1) {
      // Log de navegação
      if (isDebugMode) {
        console.log(`[NarrativeTab] Avançando para o próximo diálogo: ${currentLineIndex + 1}/${dialogue.length}`);
      }
      logEvent("narrative_next_line", {
        from_line: currentLineIndex,
        to_line: currentLineIndex + 1,
        character_role: currentLine?.characterRole
      });
      setCurrentLineIndex(prev => prev + 1);
    }
  };

  /**
   * @function goToPreviousLine
   * @desc Retrocede para o diálogo anterior na sequência narrativa
   * @returns {void}
   */
  const goToPreviousLine = () => {
    if (currentLineIndex > 0) {
      // Log de navegação
      if (isDebugMode) {
        console.log(`[NarrativeTab] Retrocedendo para diálogo anterior: ${currentLineIndex - 1}/${dialogue.length}`);
      }
      logEvent("narrative_previous_line", {
        from_line: currentLineIndex,
        to_line: currentLineIndex - 1,
        character_role: currentLine?.characterRole
      });
      setCurrentLineIndex(prev => prev - 1);
    }
  };

  const handleCompleteNarrative = () => {
    console.log(`[NarrativeTab] Narrativa finalizada. Chamando onComplete com o step_id: ${content.step_id}`);
    // Mesma correção: lê diretamente da prop 'content'
    onComplete(content.step_id);
  };

  // Log de renderização
  if (isDebugMode) {
    console.log(`[NarrativeTab] Renderizando. Diálogo atual: ${currentLineIndex + 1}/${dialogue.length}`);
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-8 rounded-lg text-white animate-fade-in">
      {/* --- O PALCO DA CENA --- */}
      <div
        className="relative w-full h-96 bg-cover bg-center rounded-lg mb-4 border-4 border-gray-700 shadow-lg"
        style={{ backgroundImage: `url(${scenario})` }}
      >
        {/* TODO: Adicionar fallback para imagens quebradas */}
        {/* TODO: Implementar animações de transição entre personagens */}

        {/* Renderiza os personagens na cena */}
        {characters.map((char, index) => (
          <img
            key={index}
            src={char.image}
            alt={char.role}
            className={`absolute bottom-0 h-4/5 object-contain transition-all duration-300 ${currentCharacter?.image === char.image ? 'opacity-100 scale-110' : 'opacity-50 scale-100'
              }`}
            style={{ left: `${10 + index * 25}%` }} // Espalha os personagens
          />
        ))}
      </div>

      {/* --- CAIXA DE DIÁLOGO --- */}
      {currentLine && (
        <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg border border-gray-600 min-h-[120px]">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">{currentLine.characterRole}</h3>
          <p className="text-lg text-gray-200">{currentLine.text}</p>
        </div>
      )}

      {/* --- CONTROLES DE NAVEGAÇÃO --- */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPreviousLine}
          disabled={currentLineIndex === 0}
          className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowLeft className="mr-2" /> Anterior
        </button>

        <span className="text-gray-400">{currentLineIndex + 1} / {dialogue.length}</span>

        {currentLineIndex < dialogue.length - 1 ? (
          <button
            onClick={goToNextLine}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"
          >
            Próximo <FaArrowRight className="ml-2" />
          </button>
        ) : (
          <button
            onClick={handleCompleteNarrative}
            className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg flex items-center font-bold"
          >
            Continuar Jornada! <FaPlay className="ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

// Validação de props ATUALIZADA
NarrativeTab.propTypes = {
  content: PropTypes.shape({
    step_id: PropTypes.string.isRequired, // O ID do passo
    scenario: PropTypes.string,
    characters: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired
      })
    ),
    dialogue: PropTypes.arrayOf(
      PropTypes.shape({
        characterRole: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  onComplete: PropTypes.func.isRequired
};



export default NarrativeTab;