// frontend/src/context/AuthContext.jsx

// --- 1. IMPORTAÇÕES ---
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// --- 2. CRIAÇÃO DO CONTEXTO DE AUTENTICAÇÃO ---
export const AuthContext = createContext(null);

// --- Adiciona a função de debug ---
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
  // Adiciona um timestamp para facilitar a leitura da sequência
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  if (DEBUG_MODE) {
    console.debug(`[${timestamp} AuthContext] ${message}`, ...optionalParams);
  }
};

// --- 3. HOOK CUSTOMIZADO (useAuth) ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Adiciona um log aqui para ver quando useAuth é chamado
  // Remova/comente depois, pode ser muito verboso
  // debugLog('Hook useAuth chamado.');
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// --- 4. FUNÇÃO AUXILIAR PARA DECODIFICAR O TOKEN ---
const getUserFromToken = (token) => {
  debugLog('getUserFromToken: Tentando decodificar token:', token ? '[TOKEN EXISTE]' : null);
  if (!token) {
    debugLog('getUserFromToken: Nenhum token fornecido.');
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    debugLog('getUserFromToken: Token decodificado:', decoded);

    // Verifica expiração
    if (decoded.exp * 1000 < Date.now()) {
      debugLog('getUserFromToken: Token EXPIRADO em:', new Date(decoded.exp * 1000));
      localStorage.removeItem('token');
      return null;
    }

    // Retorna o objeto user completo
    const userPayload = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      profile_picture: decoded.profile_picture,
      institutionName: decoded.institutionName,
      discipline: decoded.discipline,
      unlocked_global_avatars: decoded.unlocked_global_avatars,
      onboarding_status: decoded.onboarding_status || {},
      // Incluímos o token aqui para consistência, embora getToken seja preferível
      token: token
    };
    debugLog('getUserFromToken: Payload do usuário extraído:', userPayload);
    return userPayload;

  } catch (error) {
    debugLog('getUserFromToken: ERRO ao decodificar token:', error);
    localStorage.removeItem('token'); // Limpa token inválido
    return null;
  }
};


// --- 5. COMPONENTE PROVEDOR (AuthProvider) ---
export const AuthProvider = ({ children }) => {
  debugLog('AuthProvider: Inicializando...');

  // Inicializa token e user a partir do localStorage
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    debugLog('AuthProvider (useState Token Initializer): Token do localStorage:', storedToken ? '[TOKEN EXISTE]' : null);
    return storedToken;
  });

  const [user, setUser] = useState(() => {
    debugLog('AuthProvider (useState User Initializer): Tentando obter usuário do token inicial.');
    // Usa o token já lido na inicialização do useState do token
    return getUserFromToken(token);
  });

  // Estado de loading para saber quando a verificação inicial terminou
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Efeito para carregar dados do localStorage na montagem inicial
  useEffect(() => {
    debugLog('AuthProvider (useEffect[] Mount): Verificação inicial do localStorage.');
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      debugLog('AuthProvider (useEffect[] Mount): Token encontrado. Decodificando...');
      const initialUser = getUserFromToken(storedToken);
      if (initialUser) {
        debugLog('AuthProvider (useEffect[] Mount): Usuário válido encontrado. Definindo estado.');
        setUser(initialUser);
        setToken(storedToken); // Garante que o estado token também está correto
      } else {
        debugLog('AuthProvider (useEffect[] Mount): Token inválido ou expirado no storage. Limpando.');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } else {
      debugLog('AuthProvider (useEffect[] Mount): Nenhum token no localStorage.');
      setUser(null);
      setToken(null);
    }
    setLoadingAuth(false); // Marca o fim do carregamento inicial
    debugLog('AuthProvider (useEffect[] Mount): Carregamento inicial de autenticação CONCLUÍDO. loadingAuth:', false);
  }, []); // Array vazio garante que rode só uma vez na montagem
  // --- Função de Logout com Logs ---
  const logout = useCallback(() => {
    debugLog('AuthProvider (logout): Função chamada. Limpando localStorage e estados token/user.');
    localStorage.removeItem('token');
    setToken(null); // Limpa o estado token
    setUser(null);  // Limpa o estado user
  }, []);
  // --- Função de Login com Logs Detalhados ---
  const login = useCallback((data) => {
    debugLog('AuthProvider (login): Função chamada com dados:', data);
    const receivedToken = data?.access_token; // Pega o token dos dados recebidos
    if (receivedToken) {
      debugLog('AuthProvider (login): access_token recebido. Salvando no localStorage.');
      localStorage.setItem('token', receivedToken);
      debugLog('AuthProvider (login): Decodificando token para definir o usuário...');
      const loggedInUser = getUserFromToken(receivedToken);
      if (loggedInUser) {
        debugLog('AuthProvider (login): Usuário decodificado com sucesso. ATUALIZANDO ESTADOS token e user.');
        setToken(receivedToken); // ATUALIZA o estado token
        setUser(loggedInUser);  // ATUALIZA o estado user
      } else {
        debugLog('AuthProvider (login): Falha ao decodificar o token recebido. Limpando estados.');
        logout(); // Chama logout para limpar tudo em caso de token inválido
      }
    } else {
      debugLog('AuthProvider (login): Falha - access_token não encontrado nos dados.');
      logout(); // Limpa se não receber token
    }
  }, []); // useCallback sem dependências problemáticas

  // --- Função de Atualização (se usar) ---
  const updateUserData = useCallback((updatedData) => {
    // ... (sua lógica de updateUserData com logs, similar ao login) ...
    debugLog('AuthProvider (updateUserData): Função chamada com dados:', updatedData);
    if (updatedData.access_token) {
      // Lógica para atualizar com um novo token completo
      const newToken = updatedData.access_token;
      localStorage.setItem('token', newToken);
      const updatedUser = getUserFromToken(newToken);
      if (updatedUser) {
        debugLog('AuthProvider (updateUserData): Usuário atualizado via novo token:', updatedUser);
        setToken(newToken); // Atualiza estado token
        setUser(updatedUser); // Atualiza estado user
      } else {
        debugLog('AuthProvider (updateUserData): Falha ao decodificar novo token. Limpando.');
        logout();
      }
    } else if (user && typeof updatedData === 'object') {
      // Lógica para mesclar dados sem mudar o token (ex: atualização de perfil)
      setUser(prevUser => {
        // Cria um novo objeto mesclado, garantindo que o token antigo seja mantido
        const newUser = { ...prevUser, ...updatedData, token: prevUser.token };
        debugLog('AuthProvider (updateUserData): Usuário atualizado via merge:', newUser);
        // Salva o usuário atualizado no localStorage? Opcional, depende da sua necessidade.
        // localStorage.setItem('user', JSON.stringify(newUser)); // Descomente se necessário
        return newUser;
      });
    } else {
      debugLog('AuthProvider (updateUserData): Chamada inválida.');
    }
  }, [user, logout]); // Depende do user e logout



  // --- Função getToken (apenas lê, não modifica) ---
  const getToken = useCallback(() => {
    debugLog('AuthProvider (getToken): Obtendo token atual do estado:', token ? '[TOKEN EXISTE]' : null);
    return token;
  }, [token]); // Depende do estado token

  // --- Valor do Contexto com Logs ---
  const value = {
    user,
    // isAuthenticated é derivado de !!user, não precisa ser um estado separado
    isAuthenticated: !!user,
    loadingAuth, // Exporta o estado de loading do AuthContext
    token, // Exporta o token diretamente
    login,
    logout,
    updateUserData,
    getToken,
  };

  // Log ANTES de retornar o Provider
  debugLog('AuthProvider: Renderizando Provider com o valor:', {
    user: value.user ? '{...user object...}' : null, // Evita logar objeto grande
    isAuthenticated: value.isAuthenticated,
    loadingAuth: value.loadingAuth,
    token: value.token ? '[TOKEN EXISTE]' : null
  });

  // Renderiza um loading ENQUANTO o AuthContext verifica o token inicial
  // SÓ renderiza os children DEPOIS que loadingAuth for false
  return (
    <AuthContext.Provider value={value}>
      {loadingAuth ? (
        <div className="min-h-screen w-full bg-primary-bg flex items-center justify-center text-primary-text text-xl">
          <span className="animate-pulse">Carregando sessão...</span>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};