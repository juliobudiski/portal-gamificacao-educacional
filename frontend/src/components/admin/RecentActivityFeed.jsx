// frontend/src/components/admin/RecentActivityFeed.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    Edit3, PlusCircle, Trash2, Copy, ChevronsRight, LogIn, UserPlus, 
    Clock, HelpCircle, ArrowLeft, XCircle 
} from 'lucide-react';

// Mapeia ações para ícones e cores para uma melhor visualização
const iconMap = {
  activity_created: <PlusCircle className="text-green-400" size={16} />,
  activity_edited: <Edit3 className="text-yellow-400" size={16} />,
  activity_deleted: <Trash2 className="text-red-400" size={16} />,
  activity_copied: <Copy className="text-blue-400" size={16} />,
  activity_assigned: <ChevronsRight className="text-purple-400" size={16} />,
  login_success: <LogIn className="text-teal-400" size={16} />,
  register_success: <UserPlus className="text-teal-400" size={16} />,
  login_fail: <XCircle className="text-orange-400" size={16} />,
  step_view_duration: <Clock className="text-gray-400" size={16} />,
  help_button_click: <HelpCircle className="text-indigo-400" size={16} />,
  previous_button_click: <ArrowLeft className="text-gray-400" size={16} />,
  form_abandoned: <XCircle className="text-orange-400" size={16} />,
};

// Mapeia nomes de seção técnicos para nomes amigáveis
const sectionNames = {
  'activity_creation': 'Criação de Atividade',
  'auth': 'Autenticação',
  // Adicione outros mapeamentos conforme necessário
};

// Formata a mensagem do feed para ser mais descritiva
const formatActionText = (item) => {
    const title = item.details?.title ? `"${item.details.title}"` : '';
    const section = sectionNames[item.section] || item.section?.replace(/_/g, ' ') || 'uma seção';

    switch (item.action) {
        // Eventos de Sistema
        case 'activity_created': return `criou a atividade ${title}`;
        case 'activity_edited': return `editou a atividade #${item.activity_id}`;
        case 'activity_deleted': return `deletou a atividade ${title}`;
        case 'activity_copied': return `copiou a atividade #${item.details?.original_activity_id}`;
        case 'activity_assigned': return `atribuiu a atividade #${item.activity_id}`;

        // Eventos de Autenticação
        case 'login_success': return `realizou login com sucesso.`;
        case 'login_fail': return `tentou fazer login sem sucesso.`;
        case 'register_success': return `se cadastrou na plataforma.`;
        
        // Eventos de Analytics do Frontend (mais detalhados)
        case 'step_view_duration':
            return `permaneceu por ${item.details?.duration_seconds || 0}s na etapa ${item.details?.step} de "${section}".`;
        case 'form_abandoned':
            return `abandonou o formulário de "${section}" na etapa ${item.details?.last_step}.`;
        case 'help_button_click':
            return `pediu ajuda na etapa ${item.details?.step} de "${section}".`;
        case 'previous_button_click':
            return `voltou da etapa ${item.details?.from_step} para a ${item.details?.to_step} em "${section}".`;

        // Eventos genéricos (caso existam)
        case 'view_start': return `começou a visualizar "${section}".`;
        case 'view_duration': return `permaneceu por ${item.details?.duration}s em "${section}".`;

        default: return item.action.replace(/_/g, ' ');
    }
}

function RecentActivityFeed({ feedItems }) {
  if (!feedItems || feedItems.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">Nenhuma atividade de usuário para exibir.</div>;
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {feedItems.map(item => (
        <div key={item.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0 bg-gray-700 p-2 rounded-full">
            {iconMap[item.action] || <PlusCircle className="text-gray-400" size={16} />}
          </div>
          <div>
            <p className="text-sm text-gray-200">
              <span className="font-bold">{item.user_name}</span> {formatActionText(item)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentActivityFeed;

