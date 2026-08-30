// frontend/src/components/admin/TopActivitiesChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Gráfico de Top Atividades
 * 
 * Componente analítico do painel de administração que exibe um gráfico de barras
 * com as atividades mais populares/engajadoras do sistema.
 */


function TopActivitiesChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-secondary-text">Sem dados para exibir.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" width={150} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--background-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)'
                        }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                    <Bar dataKey="Cópias" fill="#805AD5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TopActivitiesChart;