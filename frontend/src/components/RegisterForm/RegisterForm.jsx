/**
 * components/RegisterForm/RegisterForm.jsx
 * Name + email + password + confirm form with strength indicator.
 * All logic in useRegisterForm hook.
 */
import React, { useState } from 'react';
import { useRegisterForm } from '../../hooks/useRegisterForm';
import './RegisterForm.css';

const EyeIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const CheckIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const STRENGTH_LEVELS = [
  { pct: '20%', color: '#f47070', label: 'Muito fraca' },
  { pct: '40%', color: '#f4a04c', label: 'Fraca' },
  { pct: '60%', color: '#f4d94c', label: 'Regular' },
  { pct: '80%', color: '#6ac96a', label: 'Boa' },
  { pct: '100%', color: '#00E5A0', label: 'Forte' },
];

function PasswordStrength({ score }) {
  if (score === 0) return <div className="rf__strength-bar" />;
  const level = STRENGTH_LEVELS[Math.min(score - 1, 4)];
  return (
    <div className="rf__strength-bar">
      <div
        className="rf__strength-fill"
        style={{ width: level.pct, background: level.color }}
      />
    </div>
  );
}

function RegisterForm() {
  const { fields, errors, apiError, loading, success, change, submit, strengthScore } = useRegisterForm();
  const [showPw, setShowPw]       = useState(false);
  const [showConf, setShowConf]   = useState(false);

  if (success) {
    return (
      <div className="rf__success">
        <div className="rf__success-icon"><CheckIcon /></div>
        <p className="rf__success-title">Conta criada!</p>
        <p className="rf__success-sub">
          Bem-vindo ao Foresail, {fields.name.split(' ')[0]}!
        </p>
      </div>
    );
  }

  return (
    <form className="rf" onSubmit={submit} noValidate>
      {apiError && (
        <div className="rf__api-err" role="alert">
          <span>{apiError}</span>
          <button type="button" onClick={() => {}}>×</button>
        </div>
      )}

      {/* Name */}
      <div className={`rf__field ${errors.name ? 'is-err' : ''}`}>
        <label className="rf__lbl" htmlFor="rf-name">Nome completo</label>
        <input id="rf-name" type="text" className="rf__inp"
          placeholder="Seu nome"
          value={fields.name} onChange={change('name')}
          autoComplete="name"/>
        {errors.name && <span className="rf__err">{errors.name}</span>}
      </div>

      {/* Email */}
      <div className={`rf__field ${errors.email ? 'is-err' : ''}`}>
        <label className="rf__lbl" htmlFor="rf-email">Email</label>
        <input id="rf-email" type="email" className="rf__inp"
          placeholder="seu@email.com"
          value={fields.email} onChange={change('email')}
          autoComplete="email"/>
        {errors.email && <span className="rf__err">{errors.email}</span>}
      </div>

      {/* Password + strength */}
      <div className={`rf__field ${errors.password ? 'is-err' : ''}`}>
        <label className="rf__lbl" htmlFor="rf-pw">Senha</label>
        <div className="rf__pw-wrap">
          <input id="rf-pw" type={showPw ? 'text' : 'password'} className="rf__inp rf__inp--pw"
            placeholder="Mínimo 6 caracteres"
            value={fields.password} onChange={change('password')}
            autoComplete="new-password"/>
          <button type="button" className="rf__eye" onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
            {showPw ? <EyeOff /> : <EyeIcon />}
          </button>
        </div>
        <PasswordStrength score={fields.password ? strengthScore(fields.password) : 0} />
        {errors.password && <span className="rf__err">{errors.password}</span>}
      </div>

      {/* Confirm password */}
      <div className={`rf__field ${errors.confirm ? 'is-err' : ''}`}>
        <label className="rf__lbl" htmlFor="rf-conf">Confirmar senha</label>
        <div className="rf__pw-wrap">
          <input id="rf-conf" type={showConf ? 'text' : 'password'} className="rf__inp rf__inp--pw"
            placeholder="Repita a senha"
            value={fields.confirm} onChange={change('confirm')}
            autoComplete="new-password"/>
          <button type="button" className="rf__eye" onClick={() => setShowConf(v => !v)}
            aria-label={showConf ? 'Ocultar' : 'Mostrar'}>
            {showConf ? <EyeOff /> : <EyeIcon />}
          </button>
        </div>
        {errors.confirm && <span className="rf__err">{errors.confirm}</span>}
      </div>

      <button type="submit" className={`rf__submit ${loading ? 'loading' : ''}`} disabled={loading}>
        {loading ? <span className="rf__spinner" aria-hidden="true" /> : 'Criar conta'}
      </button>
    </form>
  );
}

export default RegisterForm;
