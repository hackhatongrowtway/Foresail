import { useState } from 'react';

// Replace mockSignUp with your real auth service when the backend is wired in.
const mockSignUp = async ({ name, email }) => {
  await new Promise((resolve) => setTimeout(resolve, 1300));
  if (email.endsWith('@blocked.com')) {
    throw new Error('Email nao permitido.');
  }
  return { ok: true, name };
};

export function useRegisterForm() {
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const change = (field) => (event) => {
    setFields((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!fields.name.trim()) nextErrors.name = 'Nome obrigatorio.';
    if (!fields.email) nextErrors.email = 'Email obrigatorio.';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) nextErrors.email = 'Email invalido.';

    if (!fields.password) nextErrors.password = 'Senha obrigatoria.';
    else if (fields.password.length < 6) nextErrors.password = 'Minimo 6 caracteres.';

    if (!fields.confirm) nextErrors.confirm = 'Confirme sua senha.';
    else if (fields.password !== fields.confirm) nextErrors.confirm = 'Senhas nao coincidem.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const strengthScore = (value = fields.password) => {
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      await mockSignUp(fields);
      setSuccess(true);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { fields, errors, apiError, loading, success, change, submit, strengthScore };
}
