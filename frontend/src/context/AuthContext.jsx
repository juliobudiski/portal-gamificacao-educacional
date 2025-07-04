// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Cria o Contexto de Autenticação
const AuthContext = createContext(null);

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
      institutionName: decoded.institutionName, // <--- VERIFIQUE ESTA LINHA
      discipline: decoded.discipline,         // <--- E ESTA LINHA
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
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  // Função para fazer login
  // Agora 'userData' deve conter o JWT do backend
  const login = (userData) => {
    // Aqui 'userData' é o objeto que vem do backend.
    // Assumimos que 'userData.access_token' é o JWT
    const token = userData.access_token;
    if (token) {
      localStorage.setItem('token', token); // Armazena APENAS o token
      setUser(getUserFromToken(token)); // Decodifica e salva os dados do usuário derivados do token
    } else {
      console.error("Token de acesso não encontrado no payload de login.");
      // Se não houver token, ainda podemos salvar os dados do usuário diretamente (caso de Google Sign-In sem JWT inicialmente)
      // Ou você pode forçar que o token sempre venha.
      setUser(userData); // Se o backend não retornar JWT no data.user para o Google
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
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};