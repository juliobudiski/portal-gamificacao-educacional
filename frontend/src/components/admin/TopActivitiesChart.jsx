// frontend/src/components/admin/TopActivitiesChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function TopActivitiesChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-secondary-text">Sem dados para exibir.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis type="number" stroke="#A0AEC0" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#A0AEC0" width={150} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#2D3748',
                            border: '1px solid #4A5568',
                            borderRadius: '0.5rem'
                        }}
                        labelStyle={{ color: '#E2E8F0' }}
                    />
                    <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                    <Bar dataKey="Cópias" fill="#805AD5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TopActivitiesChart;
