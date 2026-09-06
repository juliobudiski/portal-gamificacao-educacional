import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaLock } from 'react-icons/fa';

/**
 * ForgotPasswordPage
 * 
 * Architectural intent: Encapsulates the UI and network logic for initiating the password recovery flow.
 * It acts as an isolated boundary for unauthenticated state, ensuring separation from the core application
 * logic and authenticated routes.
 */
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => { // Adicionado async
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      // Chamada real à API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      // Não importa se deu 200 ou 404 (segurança), mostramos sucesso
      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Ocorreu um erro ao tentar enviar o e-mail. Tente novamente.');
      }
    } catch (error) {
      console.error("Erro na recuperação:", error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
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
            Recuperação de Senha
          </h2>
          <p className="mt-2 text-sm text-secondary-text">
            {!isSubmitted
              ? "Insira seu e-mail para receber as instruções de redefinição."
              : "Verifique sua caixa de entrada."}
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaEnvelope className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    E-mail enviado!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      Enviamos um link de recuperação para <strong>{email}</strong>.
                      Se não encontrar, verifique sua pasta de spam.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-sm font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 mb-4 block w-full"
              >
                Tentar outro e-mail
              </button>

              <Link to="/login" className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                <FaArrowLeft className="mr-2" /> Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Endereço de e-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-border-color placeholder-gray-500 dark:placeholder-gray-400 text-primary-text bg-secondary-bg focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-colors"
                    placeholder="Endereço de e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 flex items-center">
                  <FaArrowLeft className="mr-1" /> Voltar para o Login
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;