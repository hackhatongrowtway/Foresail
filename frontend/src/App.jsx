import React, { useEffect, useState } from 'react';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import PageTransition from './components/PageTransition/PageTransition';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import './styles/layout.css';

const PAGES = {
  login: { component: LoginPage },
  register: { component: RegisterPage },
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('foresail_theme') || 'dark');
  const [page, setPage] = useState('login');
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('foresail_theme', theme);
  }, [theme]);

  const navigate = (target) => {
    setDirection(target === 'register' ? 'forward' : 'back');
    setPage(target);
  };

  const PageComponent = PAGES[page].component;

  return (
    <div data-theme={theme} className="app-root">
      <AnimatedBackground theme={theme} />
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? 'Claro' : 'Escuro'}
      </button>
      <main className="app-layout">
        <PageTransition pageKey={page} direction={direction}>
          <PageComponent onNavigate={navigate} />
        </PageTransition>
      </main>
    </div>
  );
}

export default App;
