import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';

/**
 * ResetPasswordPage
 * 
 * Architectural intent: Encapsulates the UI and network logic for finalizing the password recovery flow.
 * It acts as an isolation boundary for the unauthenticated state, verifying the reset token and handling
 * the secure submission of the new password.
 */
function ResetPasswordPage() {
    // Captura o token da URL (definido na rota /reset-password/:token)
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação básica no frontend
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                // Opcional: Redirecionar automaticamente após alguns segundos
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setStatus('error');
                // Mostra mensagem do backend (ex: "Link expirou") ou genérica
                setMessage(data.error || 'Ocorreu um erro ao redefinir a senha.');
            }
        } catch (error) {
            console.error('Erro na redefinição:', error);
            setStatus('error');
            setMessage('Erro de conexão com o servidor.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-bg px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-secondary-bg p-8 rounded-xl shadow-lg border border-border-color">

                {/* Cabeçalho */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-4">
                        <FaLock className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-primary-text">
                        Redefinir Senha
                    </h2>
                    <p className="mt-2 text-sm text-secondary-text">
                        Crie uma nova senha segura para sua conta.
                    </p>
                </div>

                {/* Estado de Sucesso */}
                {status === 'success' ? (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 animate-fade-in-up">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FaCheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Senha alterada com sucesso!
                                </h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                    <p>Você será redirecionado para o login em instantes.</p>
                                </div>
                                <div className="mt-4">
                                    <Link to="/login" className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 hover:underline">
                                        Ir para Login agora &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Formulário */
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

                        {/* Mensagem de Erro */}
                        {status === 'error' && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Erro
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            {message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-secondary-text mb-1">
                                    Nova Senha
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border-color placeholder-gray-500 dark:placeholder-gray-400 text-primary-text bg-secondary-bg focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-text mb-1">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border-color placeholder-gray-500 dark:placeholder-gray-400 text-primary-text bg-secondary-bg focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all ${status === 'loading' ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Salvando...
                                    </span>
                                ) : (
                                    "Definir Nova Senha"
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center">
                            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 flex items-center text-sm">
                                <FaArrowLeft className="mr-1" /> Voltar para o Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;