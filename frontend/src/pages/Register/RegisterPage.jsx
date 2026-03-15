import React from 'react';
import AuthCard from '../../components/AuthCard/AuthCard';
import RegisterForm from '../../components/RegisterForm/RegisterForm';

function RegisterPage({ onNavigate }) {
  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece a monitorar seus projetos hoje"
      footer={(
        <>
          Ja tem uma conta?{' '}
          <button onClick={() => onNavigate('login')}>Fazer login</button>
        </>
      )}
    >
      <RegisterForm />
    </AuthCard>
  );
}

export default RegisterPage;
