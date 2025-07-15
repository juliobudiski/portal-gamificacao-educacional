// frontend/src/context/AuthContext.jsx

// --- 1. IMPORTAÇÕES ---
// Importa as ferramentas necessárias do React e a biblioteca para decodificar JSON Web Tokens (JWT).
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Biblioteca para decodificar tokens JWT.

// --- 2. CRIAÇÃO DO CONTEXTO DE AUTENTICAÇÃO ---
// Cria um "Contêiner Global" (Context) para compartilhar dados de autenticação (usuário, token)
// por toda a aplicação, sem precisar passar props manualmente por todos os componentes.
export const AuthContext = createContext(null);

// --- 3. HOOK CUSTOMIZADO (useAuth) ---
// Criar um hook customizado `useAuth` é uma boa prática.
// Ele simplifica o uso do contexto nos componentes, substituindo `useContext(AuthContext)` por apenas `useAuth()`.
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- 4. FUNÇÃO AUXILIAR PARA DECODIFICAR O TOKEN ---
// Esta função recebe um token JWT, o decodifica e extrai as informações do usuário.
const getUserFromToken = (token) => {
  console.log('[AuthContext] Tentando decodificar o token:', token);
  if (!token) {
    console.log('[AuthContext] Nenhum token fornecido para decodificação.');
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    console.log('[AuthContext] Token decodificado com sucesso:', decoded);

    // Verifica se o token expirou. O campo 'exp' vem em segundos, então convertemos para milissegundos.
    if (decoded.exp * 1000 < Date.now()) {
      console.warn('[AuthContext] Token JWT expirado. Data de expiração:', new Date(decoded.exp * 1000));
      localStorage.removeItem('token'); // Limpa o token expirado do storage.
      return null;
    }

    // Retorna um objeto de usuário com os dados extraídos do payload do token.
    // 'sub' (subject) é um campo padrão para o ID do usuário.
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      profile_picture: decoded.profile_picture,
      institutionName: decoded.institutionName,
      discipline: decoded.discipline,
      token: token // Também armazenamos o token original para fácil acesso.
    };
  } catch (error) {
    console.error('[AuthContext] Erro ao decodificar o token JWT:', error);
    return null;
  }
};


// --- 5. COMPONENTE PROVEDOR (AuthProvider) ---
// Este componente irá "envelopar" a aplicação (ou partes dela) e fornecer
// os dados e funções de autenticação para todos os componentes filhos.
export const AuthProvider = ({ children }) => {
  // --- Estado do Usuário ---
  // O estado `user` armazena as informações do usuário logado.
  // A função de inicialização tenta carregar o token do localStorage na primeira vez que a página carrega.
  const [user, setUser] = useState(() => {
    console.log('[AuthContext] Inicializando o estado de autenticação.');
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('[AuthContext] Token encontrado no localStorage. Tentando decodificar...');
        return getUserFromToken(storedToken);
      }
      console.log('[AuthContext] Nenhum token encontrado no localStorage na inicialização.');
      return null;
    } catch (error) {
      console.error('[AuthContext] Falha ao ler o token do localStorage na inicialização:', error);
      return null;
    }
  });

  // --- Efeito para Sincronização entre Abas ---
  // Este `useEffect` ouve por mudanças no `localStorage`. Se o usuário fizer login ou logout
  // em outra aba, esta aba será atualizada automaticamente.
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Verifica se a mudança foi na chave 'token'
      if (event.key === 'token') {
        console.log('[AuthContext] Evento de "storage" detectado. Sincronizando estado.');
        try {
          const storedToken = localStorage.getItem('token');
          setUser(storedToken ? getUserFromToken(storedToken) : null);
        } catch (error) {
          console.error('[AuthContext] Falha ao sincronizar o usuário a partir do evento de storage:', error);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Função de limpeza: remove o listener quando o componente é desmontado.
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Função de Login ---
  // Recebe o token de acesso do backend, armazena e atualiza o estado do usuário.
  const login = (access_token) => {
    console.log('[AuthContext] Função de login chamada.');
    if (access_token && typeof access_token === 'string') {
      console.log('[AuthContext] Armazenando token no localStorage e atualizando o estado do usuário.');
      localStorage.setItem('token', access_token);
      const userData = getUserFromToken(access_token);
      setUser(userData);
      console.log('[AuthContext] Usuário logado:', userData);
    } else {
      console.error('[AuthContext] Tentativa de login falhou: token de acesso inválido ou não fornecido.');
    }
  };

  // --- Função de Logout ---
  const logout = () => {
    console.log('[AuthContext] Função de logout chamada. Limpando dados de autenticação.');
    setUser(null);
    localStorage.removeItem('token');
  };

  // --- Valor do Contexto ---
  // Objeto que contém os dados e funções que serão compartilhados com os componentes filhos.
  const value = {
    user,
    isAuthenticated: !!user, // Um booleano para verificar facilmente se o usuário está logado.
    login,
    logout,
  };

  // --- Renderização do Provedor ---
  // O `AuthContext.Provider` disponibiliza o `value` para todos os `children`.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
