import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function AuthModal({ isOpen, onClose, onAuthenticate }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanPass = passcode.trim();
    if (cleanPass === 'admin1104') {
      onAuthenticate('admin');
      setPasscode('');
      onClose();
    } else if (cleanPass === 'tgent3') {
      onAuthenticate('user');
      setPasscode('');
      onClose();
    } else {
      setError('Code d\'accès incorrect. Veuillez vérifier votre code et réessayer.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card auth-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-header">
          <img src={logoImg} alt="Top Gloves Logo" className="auth-logo" />
          <h2>Authentification d'Accès</h2>
          <p>Les Processus de SMI — Top Gloves Latex Industries</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="passcode-input">
              <KeyRound size={16} /> Code d'accès obligatoire
            </label>
            <input
              id="passcode-input"
              type="password"
              placeholder="Saisissez votre code d'accès (Utilisateur ou Admin)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
              className="auth-input"
            />
          </div>

          {error && (
            <div className="auth-error-alert">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-info-box">
            <div className="info-item">
              <span className="badge-user">Accès Utilisateur</span>
              <p>Consultation de la cartographie des processus et ouverture des fiches HTML.</p>
            </div>
            <div className="info-item">
              <span className="badge-admin">Accès Administrateur</span>
              <p>Modification du schéma d'interactions, gestion des processus, téléversement et remplacement des fichiers HTML.</p>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Valider l'Accès
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
