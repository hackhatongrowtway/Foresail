/**
 * App.jsx — Roteador principal do Foresail.
 * Rotas de auth : login | register
 * Rotas do app  : dashboard | projects | project-detail | integrations | settings | ingestion
 */
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './services/supabase';
import { useTheme } from './hooks/useTheme';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import PageTransition from './components/PageTransition/PageTransition';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ProDashboard from './pages/ProDashboard/ProDashboard';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail/ProjectDetail';
import Integrations from './pages/Integrations/Integrations';
import Settings from './pages/Settings/Settings';
import IngestionPanel from './pages/IngestionPanel/IngestionPanel';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';



const AUTH_PAGES = {
  login: { component: LoginPage, direction: 'back' },
  register: { component: RegisterPage, direction: 'forward' },
};

const APP_PAGES = {
  dashboard: ProDashboard,
  projects: ProjectsPage,
  'project-detail': ProjectDetail,
  integrations: Integrations,
  settings: Settings,
  ingestion: IngestionPanel,
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [direction, setDirection] = useState('forward');
  const [pageData, setPageData] = useState(null);

  const navigate = useCallback((target, data = null) => {
    setDirection(target === 'register' ? 'forward' : 'back');
    setPageData(data);
    setPage(target);
  }, []);

  useEffect(() => {
    // Normaliza o objeto user do Supabase para sempre ter um campo `name`
    function normalizeUser(supabaseUser) {
      if (!supabaseUser) return null;
      const meta = supabaseUser.user_metadata ?? {};
      return {
        ...supabaseUser,
        name: meta.full_name ?? meta.name ?? supabaseUser.email ?? 'Usuário',
      };
    }

    // Busca a sessão e valida no servidor se o usuário ainda existe
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;

      // getUser() faz chamada real ao Supabase — detecta usuário deletado
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        return;
      }

      setUser(normalizeUser(user));
      setPage('dashboard');
    });

    // Escuta mudanças de logado/deslogado e refresh de token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const isNowLoggedIn = !!session?.user;

      setUser(normalizeUser(session?.user));

      setPage(currentPage => {
        // Se deslogou, volta pro login
        if (!isNowLoggedIn) return 'login';

        // Se acabou de logar e tava nas telas de login/register, manda pro dashboard
        if (isNowLoggedIn && (currentPage === 'login' || currentPage === 'register')) {
          return 'dashboard';
        }

        // Caso contrário, mantém onde o cara já está navegando
        return currentPage;
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  if (user && APP_PAGES[page]) {
    const Page = APP_PAGES[page];
    return (
      <Page key={page} user={user} theme={theme} onToggleTheme={toggleTheme}
        onNavigate={navigate} onLogout={handleLogout}
        projectId={pageData?.id} projectData={pageData} />
    );
  }

  const authPage = AUTH_PAGES[page] || AUTH_PAGES.login;
  const Auth = authPage.component;
  return (
    <div data-theme={theme} className="app-root">
      <AnimatedBackground theme={theme} />
      <main className="app-layout">
        <PageTransition pageKey={page} direction={direction}>
          <Auth onNavigate={navigate} />
        </PageTransition>
      </main>
    </div>
  );
}
export default App;
