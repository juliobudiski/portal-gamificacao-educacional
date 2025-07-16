import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ClassEditPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[ClassEditPage] Componente montado para edição da turma ID:', class_id);
        const fetchClassData = async () => {
            if (!user?.token || user?.role !== 'professor' || !class_id) {
                setMessage('Acesso negado ou token/ID da turma ausente.');
                setIsLoading(false);
                console.warn('[ClassEditPage] Acesso negado ou dados ausentes.');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                const data = await response.json();
                console.log('[ClassEditPage] Resposta API (detalhes para edição):', data);

                if (response.ok) {
                    setName(data.name);
                    setDescription(data.description);
                    setMessage('');
                } else {
                    setMessage(data.message || 'Erro ao carregar detalhes da turma.');
                }
            } catch (error) {
                console.error('[ClassEditPage] Erro ao carregar detalhes da turma:', error);
                setMessage('Erro na comunicação com o servidor ao carregar detalhes.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassData();
        return () => {
            console.log('[ClassEditPage] Componente desmontado.');
        };
    }, [class_id, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[ClassEditPage] Tentando atualizar turma...');
        setMessage('');
        setIsLoading(true);

        const token = user?.token;
        if (!token || user?.role !== 'professor' || !class_id) {
            setMessage('Erro: Acesso negado, token ou ID da turma ausente.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, description }),
            });

            const data = await response.json();
            console.log('[ClassEditPage] Resposta API (atualizar turma):', data);

            if (response.ok) {
                setMessage('Turma atualizada com sucesso!');
                console.log('[ClassEditPage] Turma atualizada, navegando de volta.');
                navigate('/teacher/classes'); // Redireciona de volta para a lista de turmas
            } else {
                setMessage(data.message || 'Erro ao atualizar turma.');
                console.error('[ClassEditPage] Erro ao atualizar turma:', data.message);
            }
        } catch (error) {
            console.error('[ClassEditPage] Erro na requisição de atualização:', error);
            setMessage('Erro na comunicação com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center"><p>Carregando dados da turma para edição...</p></div>;
    }

    if (message && !name) { // Se houver erro inicial ou sem dados
        return <div className="container mx-auto p-4 text-center text-red-600"><p>{message}</p></div>;
    }
    
    // Se não for professor ou sem acesso
    if (user?.role !== 'professor') {
        return <div className="container mx-auto p-4 text-center text-red-600"><p>Acesso negado para edição de turma.</p></div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Editar Turma: {name}</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <div className="mb-4">
                    <label htmlFor="editName" className="block text-gray-700 text-sm font-bold mb-2">
                        Nome da Turma:
                    </label>
                    <input
                        type="text"
                        id="editName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="editDescription" className="block text-gray-700 text-sm font-bold mb-2">
                        Descrição:
                    </label>
                    <textarea
                        id="editDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-y"
                        disabled={isLoading}
                    ></textarea>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Atualizando...' : 'Atualizar Turma'}
                    </button>
                    {message && (
                        <p className={`text-sm ml-4 font-medium ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}

export default ClassEditPage;