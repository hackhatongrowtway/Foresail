/**
 * components/Topbar/Topbar.jsx
 * Top navigation bar with page title, notifications, theme toggle and user menu.
 */
import React, { useState } from 'react';
import './Topbar.css';

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5a5 5 0 0 0-5 5v2.5L1.5 11h13L13 9V6.5a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1.06 1.06M10.74 10.74l1.06 1.06M3.2 11.8l1.06-1.06M10.74 4.26l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M13 9.5A6.5 6.5 0 0 1 5.5 2a6.5 6.5 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M9.5 4.5L12.5 7l-3 2.5M12.5 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Topbar({ title, subtitle, theme, onToggleTheme, user, onLogout, notificationCount = 0, breadcrumb }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="topbar">
      {/* Page title / breadcrumb */}
      <div className="topbar__title-block">
        {breadcrumb ? (
          <>
            <button className="topbar__breadcrumb-btn" onClick={breadcrumb.onClick}>
              {breadcrumb.label}
            </button>
            <span className="topbar__breadcrumb-sep">›</span>
            <h1 className="topbar__title">{title}</h1>
          </>
        ) : (
          <>
            <h1 className="topbar__title">{title}</h1>
            {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="topbar__actions">
        {/* Notifications */}
        <button className="topbar__icon-btn" aria-label={`${notificationCount} notificações`}>
          <IconBell />
          {notificationCount > 0 && (
            <span className="topbar__notif-badge" aria-label={`${notificationCount} não lidas`}>
              {notificationCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          className="topbar__icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>

        {/* User menu */}
        <div className="topbar__user-menu">
          <button
            className="topbar__user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <span className="topbar__user-avatar">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
            <span className="topbar__user-name">{user?.name ?? 'Usuário'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2 }}>
              <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="topbar__overlay" onClick={() => setUserMenuOpen(false)} />
              <div className="topbar__dropdown" role="menu">
                <div className="topbar__dropdown-header">
                  <span className="topbar__dropdown-name">{user?.name}</span>
                  <span className="topbar__dropdown-email">{user?.email}</span>
                </div>
                <div className="topbar__dropdown-divider" />
                <button
                  className="topbar__dropdown-item topbar__dropdown-item--danger"
                  role="menuitem"
                  onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                >
                  <IconLogout />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
