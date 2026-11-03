import React from 'react';
import PropTypes from 'prop-types';

/**
 * @component SkeletonCard
 * @description
 * Estrutura animatrônica de carregamento (Melhoria 91).
 * Fornece placeholders em SVG e divs pulsantes que simulam a geometria
 * exata dos cards do sistema (atividades, turmas, dashboards).
 */
export default function SkeletonCard({ type = 'activity', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'table-row') {
    return (
      <>
        {items.map((_, i) => (
          <tr key={i} className="animate-pulse border-b border-border-color">
            <td className="p-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
            <td className="p-4"><div className="h-4 bg-white/10 rounded w-20 mx-auto"></div></td>
            <td className="p-4"><div className="h-4 bg-white/10 rounded w-16 mx-auto"></div></td>
            <td className="p-4"><div className="h-4 bg-white/10 rounded w-12 mx-auto"></div></td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-secondary-bg/60 border border-border-color rounded-3xl p-6 flex flex-col justify-between h-72 animate-pulse shadow-lg"
          aria-hidden="true"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-white/10 rounded-full w-24"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
            <div className="h-8 bg-white/10 rounded-xl w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded w-full"></div>
              <div className="h-3 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-color/40 flex items-center justify-between">
            <div className="h-8 bg-white/10 rounded-xl w-28"></div>
            <div className="h-8 bg-white/10 rounded-xl w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonCard.propTypes = {
  type: PropTypes.oneOf(['activity', 'table-row', 'simple']),
  count: PropTypes.number
};
