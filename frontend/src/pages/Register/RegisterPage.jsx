/**
 * pages/Register/RegisterPage.jsx
 * Assembles: AuthCard + RegisterForm + SocialLoginButtons + link back to Login.
 */
import React, { useState } from 'react';
import AuthCard from '../../components/AuthCard/AuthCard';
import RegisterForm from '../../components/RegisterForm/RegisterForm';
import '../../components/AuthCard/AuthCard.css';

function RegisterPage({ onNavigate }) {
  const [socialError, setSocialError] = useState('');

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece a monitorar seus projetos hoje"
      footer={
        <>
          Já tem uma conta?{' '}
          <button onClick={() => onNavigate('login')}>Fazer login</button>
        </>
      }
    >
      {socialError && (
        <div role="alert" style={{
          background:'var(--err-bg)', border:'1px solid var(--err-bd)', color:'var(--err)',
          borderRadius:'9px', padding:'10px 14px', fontSize:'13px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:'8px', marginBottom:'16px'
        }}>
          <span>{socialError}</span>
          <button onClick={() => setSocialError('')} style={{background:'none',border:'none',color:'var(--err)',fontSize:'18px',opacity:.6,padding:0,cursor:'pointer'}}>×</button>
        </div>
      )}

      <RegisterForm />


    </AuthCard>
  );
}

export default RegisterPage;
