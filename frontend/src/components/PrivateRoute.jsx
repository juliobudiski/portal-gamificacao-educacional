// frontend/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajuste o caminho se necessário

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth(); // Assumindo que useAuth também pode retornar um estado de carregamento

  // Se o contexto ainda estiver carregando (por exemplo, verificando o localStorage),
  // você pode retornar um spinner de carregamento ou null.
  // Por enquanto, vamos considerar que o 'user' estará null se não houver token ou se for inválido.
  // Se você implementar um 'loading' no AuthContext, pode usá-lo aqui:
  // if (loading) {
  //   return <div>Carregando...</div>; 
  // }

  // Se não houver usuário logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se allowedRoles for fornecido, verifica se o papel do usuário está entre os permitidos
  // Se allowedRoles não for fornecido, significa que qualquer usuário autenticado pode acessar
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redireciona para uma página de "acesso negado" ou para a homepage
    return <Navigate to="/" replace />;
  }

  // Se o usuário estiver logado e tiver o papel correto, renderiza o componente filho
  return <Outlet />;
};

export default PrivateRoute;