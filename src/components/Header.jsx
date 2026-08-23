import React from 'react';
import { 
  Lock, 
  Unlock, 
  ListFilter, 
  Plus, 
  Save, 
  LogOut,
  MapPin
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Header({
  isAdmin,
  onOpenAuth,
  onLogoutAdmin,
  viewMode,
  setViewMode,
  onSave,
  onOpenNewProcessModal,
  isSaving
}) {
  return (
    <header className="main-header">
      {/* Top Banner */}
      <div className="header-top">
        <div className="brand-container">
          <div className="logo-wrapper">
            <img src={logoImg} alt="Top Gloves Logo" className="brand-logo" />
          </div>
          <div className="brand-titles">
            <h1 className="brand-title">Les Processus de SMI</h1>
            <h2 className="brand-company">Top Gloves Latex Industries</h2>
            <p className="brand-subtitle">Système de Management Intégré • ISO 9001 • ISO 13485</p>
          </div>
        </div>

        <div className="header-actions">
          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Consulter la Cartographie Globale"
            >
              <MapPin size={15} />
              <span className="toggle-label-full">Cartographie Globale</span>
              <span className="toggle-label-short">Carte</span>
            </button>

            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Afficher le Tableau des Processus"
            >
              <ListFilter size={15} />
              <span className="toggle-label-full">Tableau des Processus</span>
              <span className="toggle-label-short">Tableau</span>
            </button>
          </div>

          {/* Admin Direct Quick Actions (ONLY in Tableau/List View) */}
          {isAdmin && viewMode === 'list' && (
            <div className="admin-quick-actions">
              <button className="btn-secondary-sm" onClick={onOpenNewProcessModal} title="Créer un nouveau processus">
                <Plus size={14} />
                <span className="btn-label-full">Nouveau Processus</span>
                <span className="btn-label-short">Nouveau</span>
              </button>
              <button className="btn-primary-sm" onClick={onSave} disabled={isSaving} title="Enregistrer la cartographie">
                <Save size={14} />
                <span className="btn-label-full">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                <span className="btn-label-short">{isSaving ? '...' : 'Sauvegarder'}</span>
              </button>
            </div>
          )}
          
          {/* Role Status & Auth Button */}
          <div className="auth-status-container">
            {isAdmin ? (
              <div className="admin-status-badge">
                <span className="badge-icon"><Unlock size={14} /></span>
                <span className="badge-text-full">Mode Administrateur</span>
                <span className="badge-text-short">Admin</span>
                <button 
                  className="logout-sm-btn" 
                  onClick={onLogoutAdmin}
                  title="Déconnexion Administrateur"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button className="user-login-btn" onClick={onOpenAuth} title="Saisir le code d'accès administrateur">
                <Lock size={14} />
                <span className="auth-label-full">Accès Administrateur</span>
                <span className="auth-label-short">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
