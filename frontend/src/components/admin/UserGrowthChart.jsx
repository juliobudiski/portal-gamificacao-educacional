// frontend/src/components/admin/UserGrowthChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * UserGrowthChart
 * 
 * Architectural intent: Serves as a specialized presentation component for rendering the User Growth trend line.
 * It encapsulates the Recharts line chart configuration, decoupling the complex SVG rendering logic
 * from the parent dashboard component.
 */


function UserGrowthChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-secondary-text">Sem dados para exibir.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
          <Line type="monotone" dataKey="Novos Usuários" stroke="var(--accent-teal)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: "var(--accent-teal)" }} dot={{ r: 4, strokeWidth: 2, fill: 'var(--background-secondary)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default UserGrowthChart;