import { useState } from 'react';
import { supabase } from '../services/supabase';

// Função real que chama o Supabase Auth
const signUpUser = async ({ name, email, password }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // Envia o nome real do usuário para o meta_data
        // Nossa Trigger no banco de dados (SQL) vai ler isso
        // e inserir na tabela `public.profiles` (display_name)
        full_name: name,
        name: name,
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }
  return { ok: true, user: data.user };
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
      await signUpUser(fields);
      setSuccess(true);
    } catch (error) {
      // Traduz erros comuns do Supabase para pt-br
      let msg = error.message;
      if (msg.includes('already registered')) msg = 'Este email já está cadastrado.';
      else if (msg.includes('Password should be')) msg = 'A senha informada é fraca demais.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { fields, errors, apiError, loading, success, change, submit, strengthScore };
}
