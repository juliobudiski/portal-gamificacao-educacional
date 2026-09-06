// frontend/src/components/admin/TopActivitiesChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * TopActivitiesChart
 * 
 * Architectural intent: Serves as a specialized presentation component for rendering the Top Activities metric.
 * It encapsulates the Recharts bar chart configuration, keeping the parent analytics view clean and decoupled
 * from specific charting library implementations.
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
                            borderRadius: '12px',
                            color: 'var(--text-primary)',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                        cursor={{ fill: 'var(--background-primary)', opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '10px' }} />
                    <Bar dataKey="Cópias" fill="var(--accent-purple)" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TopActivitiesChart;