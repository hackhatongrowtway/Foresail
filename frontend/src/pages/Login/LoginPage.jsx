import React from 'react';
import AuthCard from '../../components/AuthCard/AuthCard';

function LoginPage({ onNavigate }) {
  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      footer={(
        <>
          Nao tem uma conta?{' '}
          <button onClick={() => onNavigate('register')}>Criar conta</button>
        </>
      )}
    >
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="seu@email.com"
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="Sua senha"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="auth-submit">Entrar</button>
      </form>
      <p className="auth-helper">
        Fluxo de login mantido como placeholder visual ate a integracao real.
      </p>
    </AuthCard>
  );
}

export default LoginPage;
