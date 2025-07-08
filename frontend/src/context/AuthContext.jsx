// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Cria e EXPORTA o Contexto de Autenticação
export const AuthContext = createContext(null); // <-- AQUI ESTÁ A CORREÇÃO

// 2. Cria um Hook customizado para usar o AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Função auxiliar para decodificar o JWT e obter os dados do usuário
const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // Verifique se o token não expirou (opcional, mas bom ter)
    if (decoded.exp * 1000 < Date.now()) {
      console.warn("Token JWT expirado.");
      return null;
    }
    // Retorne os dados do usuário que você esperar do token
    // Ex: id, email, name, role. Ajuste conforme o que seu backend coloca no token.
    return {
      id: decoded.sub, // 'sub' é o assunto do token, geralmente o ID do usuário
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      profile_picture: decoded.profile_picture, // Se o backend incluir a imagem do Google
      institutionName: decoded.institutionName,
      discipline: decoded.discipline,
      token: token // Armazenamos o token junto para facilitar o acesso
    };
  } catch (error) {
    console.error("Erro ao decodificar JWT:", error);
    return null;
  }
};


// 3. Cria o Provedor de Autenticação
export const AuthProvider = ({ children }) => {
  // Estado para armazenar o usuário logado
  // Começamos com null, ou podemos tentar carregar do localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token'); // Carrega o token
      return storedToken ? getUserFromToken(storedToken) : null; // Tenta decodificar o token
    } catch (error) {
      console.error("Failed to parse user from localStorage or decode token", error);
      return null;
    }
  });

  // Efeito para manter o estado de autenticação consistente com o localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedToken = localStorage.getItem('token');
        setUser(storedToken ? getUserFromToken(storedToken) : null);
      } catch (error) {
        console.error("Failed to re-sync user from localStorage on storage change", error);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Função para fazer login
  // Agora 'userData' deve conter o JWT do backend
  const login = (access_token) => { // Aceita diretamente o access_token como string
    if (access_token && typeof access_token === 'string') { // Verifica se é uma string
      localStorage.setItem('token', access_token); // Armazena APENAS o token
      setUser(getUserFromToken(access_token)); // Decodifica e salva os dados do usuário derivados do token
    } else {
      console.error("Token de acesso não fornecido ou não é uma string válida para login.");
    }
  };

  // Função para fazer logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token'); // Remove o token do localStorage
  };

  // O valor que será fornecido para os componentes que consumirem este contexto
  const value = {
    user,
    isAuthenticated: !!user, // Adicionando um booleano para fácil verificação de autenticação
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};