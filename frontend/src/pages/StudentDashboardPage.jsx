// src/pages/StudentDashboardPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaBook, FaChalkboardTeacher, FaChevronRight, FaStar, FaTrophy, FaTasks, FaUserGraduate } from 'react-icons/fa';



/**
 * Cartão que representa uma turma no dashboard.
 */
const ClassCard = ({ classInfo }) => (
    <div className="bg-[#3a4046] rounded-2xl shadow-xl border-l-4 border-[#ffbd30] p-6 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300">
        <div>
            <h3 className="text-xl font-bold text-white mb-2">{classInfo.name}</h3>
            <div className="flex items-center text-sm text-gray-400 mb-4">
                <FaChalkboardTeacher className="mr-2 text-[#69e8cb]" />
                <span>{classInfo.professor_name}</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">{classInfo.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4">
            <span className="text-sm font-semibold text-white px-3 py-1 bg-[#69e8cb]/20 text-[#69e8cb] rounded-full">
                {classInfo.activities_count} atividades
            </span>
            <Link to={`/classes/${classInfo.id}`} className="font-bold text-[#ffbd30] hover:text-yellow-300 flex items-center">
                Acessar <FaChevronRight className="ml-1" />
            </Link>
        </div>
    </div>
);

/**
 * Cartão que representa uma atividade pendente.
 */
const ActivityCard = ({ activity }) => (
    <div className="bg-[#3a4046] p-4 rounded-xl flex items-center justify-between hover:bg-[#4a525a] transition-colors">
        <div>
            <p className="font-bold text-white">{activity.title}</p>
            <p className="text-sm text-gray-400">{activity.class_name}</p>
        </div>
        <Link to={`/activities/${activity.id}`} className="py-2 px-4 bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] text-[#2c3135] font-bold rounded-lg text-sm">
            Ver Atividade
        </Link>
    </div>
);

/**
 * O componente principal da página do Dashboard do Aluno.
 */
function StudentDashboardPage() {
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            console.log("Iniciando busca de dados para o dashboard do aluno...");
            setLoading(true);
            setError('');
            try {
                // ------ MODO REAL (API) ------
                 const token = localStorage.getItem('token');
                 if (!token) {
                     setError("Usuário não autenticado.");
                     setLoading(false);
                     return;
                 }
                 const response = await fetch('http://127.0.0.1:5000/api/student/dashboard', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 const data = await response.json();
                 if (!response.ok) {
                     throw new Error(data.message || "Erro ao carregar dados do dashboard.");
                 }
                 setDashboardData(data);

            } catch (err) {
                console.error("Erro ao buscar dados do dashboard:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="text-center p-10 text-white">Carregando seu dashboard...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
    }
    
    if (!dashboardData) {
        return <div className="text-center p-10 text-white">Nenhum dado encontrado para o dashboard.</div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e2226] to-[#2c3135] p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                {/* Cabeçalho de Boas-vindas */}
                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold">
                        Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb]">{user?.name || 'Aluno'}</span>!
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Pronto para a sua próxima jornada de aprendizado?</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Principal (Turmas e Atividades) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Seção Minhas Turmas */}
                        <section>
                            <div className="flex items-center mb-6">
                                <FaBook className="text-3xl text-[#ffbd30] mr-4" />
                                <h2 className="text-3xl font-bold">Minhas Turmas</h2>
                            </div>
                            {dashboardData.classes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {dashboardData.classes.map(cls => (
                                        <ClassCard key={cls.id} classInfo={cls} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400">Você ainda não está matriculado em nenhuma turma.</p>
                            )}
                        </section>

                        {/* Seção Minhas Atividades Pendentes */}
                        <section>
                            <div className="flex items-center mb-6">
                                <FaTasks className="text-3xl text-[#69e8cb] mr-4" />
                                <h2 className="text-3xl font-bold">Minhas Atividades</h2>
                            </div>
                             {dashboardData.pendingActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.pendingActivities.map(activity => (
                                        <ActivityCard key={activity.id} activity={activity} />
                                    ))}
                                </div>
                             ) : (
                                <p className="text-gray-400">Nenhuma atividade disponível no momento.</p>
                             )}
                        </section>
                    </div>

                    {/* Coluna Lateral (Desempenho e Ações Rápidas) */}
                    <aside className="space-y-8">
                        {/* Card de Desempenho */}
                        <section className="bg-[#343a40] p-6 rounded-2xl shadow-xl border-t-4 border-[#9570d9]">
                            <h2 className="text-2xl font-bold mb-6 text-center">Meu Desempenho</h2>
                            <div className="space-y-5">
                                <div className="flex items-center p-4 bg-[#2c3135] rounded-lg">
                                    <FaStar className="text-3xl text-yellow-400 mr-4" />
                                    <div>
                                        <p className="text-sm text-gray-400">Pontuação Total</p>
                                        <p className="text-2xl font-bold">{dashboardData.performance.totalPoints}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-[#2c3135] rounded-lg">
                                    <FaUserGraduate className="text-3xl text-green-400 mr-4" />
                                    <div>
                                        <p className="text-sm text-gray-400">Nível Atual</p>
                                        <p className="text-2xl font-bold">{dashboardData.performance.level}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-[#2c3135] rounded-lg">
                                    <FaTrophy className="text-3xl text-purple-400 mr-4" />
                                    <div>
                                        <p className="text-sm text-gray-400">Conquistas</p>
                                        <p className="text-2xl font-bold">{dashboardData.performance.achievements}</p>
                                    </div>
                                </div>
                            </div>
                            <Link to="/aluno/desempenho" className="block w-full text-center mt-6 py-2 px-4 bg-[#9570d9] hover:bg-purple-600 rounded-lg font-semibold">
                                Ver Detalhes
                            </Link>
                        </section>

                        {/* Card de Ações Rápidas */}
                        <section className="bg-[#343a40] p-6 rounded-2xl shadow-xl">
                            <h2 className="text-2xl font-bold mb-4 text-center">Ações Rápidas</h2>
                            <Link to="/aluno/entrar-turma" className="block w-full text-center mb-3 py-3 px-4 bg-gradient-to-r from-[#ffbd30] to-[#ffa000] text-[#2c3135] hover:opacity-90 rounded-lg font-bold">
                                Entrar em Nova Turma
                            </Link>
                            <Link to="/aluno/minhas-atividades" className="block w-full text-center py-3 px-4 bg-[#69e8cb] text-[#2c3135] hover:opacity-90 rounded-lg font-bold">
                                Ver Todas as Atividades
                            </Link>
                        </section>
                    </aside>
                </main>
            </div>
        </div>
    );
}

export default StudentDashboardPage;
