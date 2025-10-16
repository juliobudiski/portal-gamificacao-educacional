// frontend/src/context/AuthContext.jsx

// --- 1. IMPORTAÇÕES ---
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// --- 2. CRIAÇÃO DO CONTEXTO DE AUTENTICAÇÃO ---
export const AuthContext = createContext(null);

// --- 3. HOOK CUSTOMIZADO (useAuth) ---
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- 4. FUNÇÃO AUXILIAR PARA DECODIFICAR O TOKEN ---
const getUserFromToken = (token) => {
  console.log('[AuthContext] Tentando decodificar o token:', token);
  if (!token) {
    console.log('[AuthContext] Nenhum token fornecido para decodificação.');
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    console.log('[AuthContext] Token decodificado com sucesso:', decoded);

    if (decoded.exp * 1000 < Date.now()) {
      console.warn('[AuthContext] Token JWT expirado. Data de expiração:', new Date(decoded.exp * 1000));
      localStorage.removeItem('token');
      return null;
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      profile_picture: decoded.profile_picture,
      institutionName: decoded.institutionName,
      discipline: decoded.discipline,
      unlocked_global_avatars: decoded.unlocked_global_avatars, // Extrai os avatares do token
      token: token
    };
  } catch (error) {
    console.error('[AuthContext] Erro ao decodificar o token JWT:', error);
    return null;
  }
};


// --- 5. COMPONENTE PROVEDOR (AuthProvider) ---
export const AuthProvider = ({ children }) => {
  // --- Estado do Usuário ---
  // A função de inicialização do useState carrega o token do localStorage apenas uma vez.
  const [user, setUser] = useState(() => {
    console.log('[AuthContext] Inicializando o estado de autenticação via useState.');
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('[AuthContext] Token encontrado no localStorage na inicialização do estado.');
        return getUserFromToken(storedToken);
      }
      console.log('[AuthContext] Nenhum token encontrado no localStorage na inicialização do estado.');
      return null;
    } catch (error) {
      console.error('[AuthContext] Falha ao ler o token do localStorage na inicialização do estado:', error);
      return null;
    }
  });

  // --- Estado de Autenticação ---
  // NOVO: Adiciona a declaração do estado isAuthenticated
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Efeito para sincronizar `isAuthenticated` quando `user` muda
  useEffect(() => {
    setIsAuthenticated(!!user);
    console.log('[AuthContext] Estado isAuthenticated atualizado:', !!user);
  }, [user]); // Depende do objeto user

  // --- Efeito para Sincronização entre Abas (via evento 'storage') ---
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        console.log('[AuthContext] Evento de "storage" detectado. Sincronizando estado.');
        try {
          const storedToken = localStorage.getItem('token');
          // Use getUserFromToken aqui
          const decodedUser = storedToken ? getUserFromToken(storedToken) : null;
          setUser(decodedUser);
          setIsAuthenticated(!!decodedUser); // Atualiza isAuthenticated também
        } catch (error) {
          console.error('[AuthContext] Falha ao sincronizar o usuário a partir do evento de storage:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Função de Login ---
  const login = (data) => {
    console.log('[AuthContext] Função de login chamada.');
    const { access_token } = data;

    if (access_token && typeof access_token === 'string') {
      localStorage.setItem('token', access_token);
      console.log('[AuthContext] Armazenando token no localStorage.');

      // Use getUserFromToken aqui
      const decodedUser = getUserFromToken(access_token);

      if (decodedUser) {
        setUser(decodedUser);
        setIsAuthenticated(true);
        console.log('[AuthContext] Usuário logado com sucesso:', decodedUser);
      } else {
        console.error('[AuthContext] Tentativa de login falhou: token de acesso inválido ou não decodificável.');
        logout();
      }
    } else {
      console.error('[AuthContext] Tentativa de login falhou: access_token não fornecido ou tipo incorreto.');
    }
  };

  // NOVA FUNÇÃO: Atualiza os dados do usuário no contexto
  const updateUserData = (updatedData) => {
    console.log('[AuthContext] Função updateUserData chamada com:', updatedData);
    if (updatedData.access_token) {
      localStorage.setItem('token', updatedData.access_token);
      // Use getUserFromToken aqui
      const decodedUser = getUserFromToken(updatedData.access_token);
      if (decodedUser) {
        setUser(decodedUser);
        setIsAuthenticated(true);
        console.log('[AuthContext] Dados do usuário atualizados via novo token:', decodedUser);
      } else {
        console.error('[AuthContext] Falha ao decodificar o novo token em updateUserData. Token inválido.');
      }
    } else if (user) {
      setUser(prevUser => {
        const newUser = { ...prevUser, ...updatedData };
        console.log('[AuthContext] Dados do usuário atualizados via objeto de dados:', newUser);
        return newUser;
      });
    } else {
      console.warn('[AuthContext] updateUserData chamada sem token ou usuário existente.');
    }
  };

  // --- Função de Logout ---
  const logout = () => {
    console.log('[AuthContext] Função de logout chamada. Limpando dados de autenticação.');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const getToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user]);

  // --- Valor do Contexto ---
  const value = {
    user,
    isAuthenticated, // Agora isAuthenticated é um estado próprio
    login,
    logout,
    updateUserData,
    getToken, // Inclua updateUserData no value
  };

  // --- Renderização do Provedor ---
  return (
    <AuthContext.Provider value={value}> {/* Use o objeto 'value' explicitamente */}
      {children}
    </AuthContext.Provider>
  );
};