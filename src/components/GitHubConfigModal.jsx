import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, GitBranch, Github, CheckCircle2, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { getGitHubConfig, saveGitHubConfig, testGitHubConnection } from '../utils/githubApi';

export default function GitHubConfigModal({
  isOpen,
  onClose,
  showToast
}) {
  const [config, setConfig] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = getGitHubConfig();
      setConfig(current);
      setTestResult(null);
      setTestError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError('');

    try {
      const res = await testGitHubConnection(config);
      setTestResult(res);
      if (showToast) showToast("Connexion API GitHub établie avec succès !", "success");
    } catch (err) {
      setTestError(err.message || "Impossible de se connecter à GitHub.");
      if (showToast) showToast(err.message, "error");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.owner || !config.repo || !config.token) {
      alert("Veuillez remplir l'utilisateur, le dépôt et le jeton d'accès Token.");
      return;
    }
    saveGitHubConfig(config);
    if (showToast) showToast("Configuration API GitHub enregistrée dans votre navigateur !", "success");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card github-config-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2><Github size={22} color="#003B7A" /> Configuration API GitHub (Commit Direct)</h2>
          <p>Permet à l'admin de publier directement des cartes PNG et métadonnées sur le dépôt GitHub.</p>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label><Github size={14} /> Nom d'utilisateur ou Organisation GitHub *</label>
            <input
              type="text"
              placeholder="ex: votre-pseudo-github"
              value={config.owner}
              onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Nom du Dépôt GitHub (Repo) *</label>
              <input
                type="text"
                placeholder="ex: SMI-Processes-Page"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label><GitBranch size={14} /> Branche Cible *</label>
              <input
                type="text"
                placeholder="ex: main ou gh-pages"
                value={config.branch}
                onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label><Key size={14} /> Jeton d'Accès Personnel (GitHub PAT Token) *</label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              required
            />
            <span className="form-hint-text">
              <Info size={12} /> Stocké de façon sécurisée uniquement sur votre navigateur (LocalStorage). Permission requise : <code>contents:write</code> ou <code>repo</code>.
            </span>
          </div>

          {testResult && (
            <div className="auth-info-box" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <div className="info-item" style={{ color: '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#059669" />
                Connecté au dépôt {testResult.fullName} (Branche par défaut : {testResult.defaultBranch})
              </div>
            </div>
          )}

          {testError && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{testError}</span>
            </div>
          )}

          <div className="github-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={testing}
            >
              <RefreshCw size={14} className={testing ? 'spinner' : ''} />
              <span>{testing ? 'Test en cours...' : 'Tester la Connexion'}</span>
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Enregistrer la Config
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
