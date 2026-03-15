/**
 * components/EmptyState/EmptyState.jsx
 * Generic empty state with icon, title, description and optional CTA.
 */
import React from 'react';
import './EmptyState.css';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state" role="status">
      {icon && <div className="empty-state__icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <button className="empty-state__btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
