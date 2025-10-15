// frontend/src/pages/admin/LocationMapPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corrige o problema do ícone padrão do Leaflet não aparecer
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMapPage() {
    const { user } = useContext(AuthContext);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            setError(null);
            const token = user?.token;
            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/analytics/user-locations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar localizações.');
                const data = await response.json();
                setLocations(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, [user]);

    if (loading) return <div className="text-center p-10">Carregando dados de localização...</div>;
    if (error) return <div className="text-center p-10 text-red-400">Erro: {error}</div>;

    // Define uma posição central padrão para o mapa
    const mapCenter = locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [-14.235, -51.925]; // Coordenadas do Brasil

    return (
        <div className="animate-fade-in space-y-8 text-primary-text">
            <h1 className="text-3xl font-bold">Mapa de Acessos</h1>

            {/* Mapa Interativo */}
            <div className="bg-primary-bg/50 p-6 rounded-xl h-[600px] w-full">
                <MapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {locations.map(loc => (
                        <Marker key={loc.user_id} position={[loc.latitude, loc.longitude]}>
                            <Popup>
                                <strong>{loc.user_name}</strong><br />
                                {loc.city}, {loc.state}<br />
                                {loc.country}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Tabela de Localizações */}
            <div className="bg-primary-bg/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Lista de Localizações Registradas</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-primary-bg/60">
                            <tr>
                                <th className="px-4 py-2 text-left">Usuário</th>
                                <th className="px-4 py-2 text-left">Cidade</th>
                                <th className="px-4 py-2 text-left">Bairro</th>
                                <th className="px-4 py-2 text-left">Estado</th>
                                <th className="px-4 py-2 text-left">País</th>
                                <th className="px-4 py-2 text-left">Última Atualização</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {locations.map(loc => (
                                <tr key={loc.user_id} className="hover:bg-border-color/50">
                                    <td className="px-4 py-2">{loc.user_name}</td>
                                    <td className="px-4 py-2">{loc.city}</td>
                                    <td className="px-4 py-2">{loc.suburb}</td>
                                    <td className="px-4 py-2">{loc.state}</td>
                                    <td className="px-4 py-2">{loc.country}</td>
                                    <td className="px-4 py-2 text-sm">{new Date(loc.last_update).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default LocationMapPage;