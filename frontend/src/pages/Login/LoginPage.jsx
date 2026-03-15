import React, { useState } from 'react';
import AuthCard from '../../components/AuthCard/AuthCard';
import { supabase } from '../../services/supabase';

function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('Email ou senha inválidos.');
      } else {
        setErrorMsg(error.message);
      }
    } else {
      // Sucesso! O redirecionamento você (usuário) mencionou que fará depois,
      // mas vamos adicionar um log ou alert básico apenas para validar a integração.
      alert(`Login bem-sucedido! Bem-vindo de volta.`);
      // onNavigate('dashboard'); // Exemplo
    }
  };

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
      <form className="auth-form" onSubmit={handleLogin}>
        {errorMsg && (
          <div style={{ color: '#f47070', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthCard>
  );
}

export default LoginPage;
