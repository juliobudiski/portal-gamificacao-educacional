import React from 'react';
import QuizEditor from '../../QuizEditorPage';
import NarrativeEditor from '../../NarrativeEditorPage';
import LearningContentEditor from '../../LearningContentEditorPage';

/**
 * Modais de Apoio à Criação
 * 
 * Conjunto de modais contextuais utilizados durante o fluxo de criação para
 * confirmar descartes, validar passos ou dar dicas de design gamificado.
 */


function ActivityCreationModals({ editingStep, setEditingStep, handleSaveContentLocally }) {
  if (!editingStep) return null;

  return (
    <>
      {editingStep.type === 'quiz' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <QuizEditor
              initialData={editingStep.content?.questions || []}
              onSave={(questions) => handleSaveContentLocally({ type: 'quiz', questions })}
              onCancel={() => setEditingStep(null)}
              isOfflineMode={true}
            />
          </div>
        </div>
      )}

      {editingStep.type === 'narrative' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <NarrativeEditor
              initialData={editingStep.content}
              onSave={(data) => handleSaveContentLocally({ type: 'narrative', ...data })}
              onCancel={() => setEditingStep(null)}
              isOfflineMode={true}
            />
          </div>
        </div>
      )}

      {editingStep.type === 'content' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setEditingStep(null)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 font-bold text-xl z-10">✕</button>
            <LearningContentEditor
              initialData={editingStep.content}
              onSave={(data) => handleSaveContentLocally({ type: 'content', ...data })}
              isOfflineMode={true}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ActivityCreationModals;