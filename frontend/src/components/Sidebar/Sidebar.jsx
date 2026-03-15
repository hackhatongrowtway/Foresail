/**
 * components/Sidebar/Sidebar.jsx
 * Navigation sidebar with brand, nav items and user info.
 */
import React from 'react';
import './Sidebar.css';

const BrandMark = () => (
  <svg width="24" height="28" viewBox="0 0 28 32" fill="none" className="sidebar__brand-mark">
    <rect x="0" y="0" width="28" height="9" rx="4.5" fill="#1B4DFF"/>
    <rect x="0" y="12" width="20" height="9" rx="4.5" fill="#1B4DFF"/>
    <circle cx="6" cy="26" r="6" fill="#00E5A0"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconProjects = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h3A1.5 1.5 0 0 1 8 4.5V5H2v-.5Z" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconAnalysis = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <polyline points="2,12 6,7 9,10 14,4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="14" cy="4" r="1.5" fill="currentColor"/>
  </svg>
);

const IconRisks = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <line x1="8" y1="7" x2="8" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="8" cy="11.5" r="0.7" fill="currentColor"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: IconDashboard },
  { id: 'projects',     label: 'Projetos',     Icon: IconProjects  },
  { id: 'ingestion',    label: 'Ingestão',     Icon: IconDownload  },
  { id: 'risks',        label: 'Riscos',       Icon: IconRisks     },
  { id: 'integrations', label: 'Integrações',  Icon: IconLink      },
  { id: 'settings',     label: 'Configurações',Icon: IconSettings  },
];

function Sidebar({ activePage = 'dashboard', onNavigate, user }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <BrandMark />
        <span className="sidebar__brand-name">foresail</span>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar__nav-item${activePage === id ? ' sidebar__nav-item--active' : ''}`}
            onClick={() => onNavigate?.(id)}
            aria-current={activePage === id ? 'page' : undefined}
          >
            <span className="sidebar__nav-icon" aria-hidden="true"><Icon /></span>
            <span className="sidebar__nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="sidebar__spacer" />

      {/* User */}
      {user && (
        <div className="sidebar__user">
          <div className="sidebar__avatar" aria-hidden="true">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user.name}</span>
            <span className="sidebar__user-role">Pro</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
