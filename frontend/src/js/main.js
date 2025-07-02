document.addEventListener('DOMContentLoaded', () => {
    console.log('Portal de Gamificação carregado!');

    const loginLink = document.getElementById('login-link');
    const cadastroLink = document.getElementById('cadastro-link');
    const conteudoPrincipal = document.getElementById('conteudo-principal');

    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            conteudoPrincipal.innerHTML = '<h2>Página de Login</h2><p>Formulário de login irá aqui.</p>';
        });
    }

    if (cadastroLink) {
        cadastroLink.addEventListener('click', (event) => {
            event.preventDefault();
            conteudoPrincipal.innerHTML = '<h2>Página de Cadastro</h2><p>Formulário de cadastro irá aqui.</p>';
        });
    }
});