import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; //
import { Link } from 'react-router-dom';

function ClassListPage() {
    const { user, authToken } = useContext(AuthContext); //
    const [classes, setClasses] = useState([]);
    const [message, setMessage] = useState('');

    const fetchClasses = async () => {
        setMessage('');
        try {
            const response = await fetch('http://127.0.0.1:5000/api/classes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setClasses(data);
            } else {
                setMessage(data.message || 'Erro ao carregar turmas.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setMessage('Erro na comunicação com o servidor.');
        }
    };

    useEffect(() => {
        if (authToken) {
            fetchClasses();
        }
    }, [authToken]);

    const handleLeaveClass = async (classId) => {
        if (!window.confirm('Tem certeza que deseja sair desta turma?')) {
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/classes/${classId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Você saiu da turma com sucesso.');
                fetchClasses(); // Recarrega a lista de turmas
            } else {
                setMessage(data.message || 'Erro ao sair da turma.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setMessage('Erro na comunicação com o servidor.');
        }
    };

    const handleDeleteClass = async (classId) => {
        if (!window.confirm('Tem certeza que deseja deletar esta turma? Esta ação é irreversível e desassociará todas as atividades e matrículas.')) {
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Turma deletada com sucesso.');
                fetchClasses(); // Recarrega a lista de turmas
            } else {
                setMessage(data.message || 'Erro ao deletar turma.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setMessage('Erro na comunicação com o servidor.');
        }
    };

    return (
        <div>
            <h1>{user?.role === 'professor' ? 'Minhas Turmas' : 'Minhas Matrículas'}</h1> {/* */}
            {message && <p>{message}</p>}
            {user?.role === 'professor' && (
                <Link to="/teacher/classes/new">Criar Nova Turma</Link>
            )}
            {classes.length > 0 ? (
                <ul>
                    {classes.map((cls) => (
                        <li key={cls.id}>
                            <h2><Link to={`/classes/${cls.id}`}>{cls.name}</Link></h2>
                            <p>{cls.description}</p>
                            {user?.role === 'professor' && ( //
                                <>
                                    <p>Código de Inscrição: <strong>{cls.enrollment_code}</strong></p>
                                    <Link to={`/classes/${cls.id}/edit`}>Editar</Link>
                                    <button onClick={() => handleDeleteClass(cls.id)}>Deletar</button>
                                </>
                            )}
                            {user?.role === 'aluno' && ( //
                                <button onClick={() => handleLeaveClass(cls.id)}>Sair da Turma</button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Nenhuma turma encontrada.</p>
            )}
        </div>
    );
}

export default ClassListPage;