/**
 * components/PageTransition/PageTransition.jsx
 * Wraps page content with enter/exit CSS animations.
 * direction: 'forward' (login→register) | 'back' (register→login)
 */

import React, { useEffect, useState } from 'react';
import './PageTransition.css';

function PageTransition({ children, pageKey, direction = 'forward' }) {
  const [cls, setCls] = useState('pt-enter');

  useEffect(() => {
    setCls(direction === 'forward' ? 'pt-enter' : 'pt-enter-back');
    const t = setTimeout(() => setCls(''), 450);
    return () => clearTimeout(t);
  }, [pageKey, direction]);

  return (
    <div className={`page-transition ${cls}`}>
      {children}
    </div>
  );
}

export default PageTransition;
