/**
 * App.jsx — Roteador principal do Foresail.
 * Rotas de auth : login | register
 * Rotas do app  : dashboard | projects | project-detail | integrations | settings | ingestion
 */
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './services/supabase';
import { useTheme } from './hooks/useTheme';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import PageTransition     from './components/PageTransition/PageTransition';
import LoginPage          from './pages/Login/LoginPage';
import RegisterPage       from './pages/Register/RegisterPage';
import ProDashboard   from './pages/ProDashboard/ProDashboard';
import ProjectsPage   from './pages/ProjectsPage/ProjectsPage';
import ProjectDetail  from './pages/ProjectDetail/ProjectDetail';
import Integrations   from './pages/Integrations/Integrations';
import Settings       from './pages/Settings/Settings';
import IngestionPanel from './pages/IngestionPanel/IngestionPanel';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';



const AUTH_PAGES = {
  login:    { component: LoginPage,    direction: 'back'    },
  register: { component: RegisterPage, direction: 'forward' },
};

const APP_PAGES = {
  dashboard:        ProDashboard,
  projects:         ProjectsPage,
  'project-detail': ProjectDetail,
  integrations:     Integrations,
  settings:         Settings,
  ingestion:        IngestionPanel,
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState('login');
  const [direction,setDirection]= useState('forward');
  const [pageData, setPageData] = useState(null);

  const navigate = useCallback((target, data = null) => {
    setDirection(target === 'register' ? 'forward' : 'back');
    setPageData(data);
    setPage(target);
  }, []);

  useEffect(() => {
    // Busca a sessão assim que o App monta
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setPage('dashboard');
    });

    // Escuta mudanças de logado/deslogado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setPage('dashboard');
      } else {
        setPage('login');
      }
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
