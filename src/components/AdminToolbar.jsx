import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  ChevronUp,
  ChevronDown,
  Github
} from 'lucide-react';
import { getGitHubConfig } from '../utils/githubApi';

export default function AdminToolbar({
  isAdmin,
  viewMode,
  onAddProcess,
  onOpenGitHubConfig,
  onSave,
  onExportJSON,
  onImportJSON,
  onResetDefault,
  isSaving
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  if (!isAdmin) return null;

  const ghConfig = getGitHubConfig();
  const isGitHubConfigured = Boolean(ghConfig.token && ghConfig.owner && ghConfig.repo);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          onImportJSON(json);
        } catch (err) {
          alert("Fichier JSON invalide. Impossible d'importer la cartographie.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`admin-docked-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <button 
          className="admin-dock-toggle-btn"
          onClick={() => setIsExpanded(true)}
          title="Ouvrir le panneau administrateur"
        >
          <ShieldCheck size={18} color="#FBBF24" />
          <span>Panneau Admin</span>
          <ChevronUp size={16} />
        </button>
      ) : (
        <div className="admin-dock-content">
          <div className="admin-dock-header">
            <div className="dock-title">
              <ShieldCheck size={16} color="#FBBF24" />
              <span>Outils Administrateur</span>
            </div>
            <button className="dock-close-btn" onClick={() => setIsExpanded(false)} title="Réduire">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="admin-dock-body">
            <button 
              className="tb-btn outline" 
              onClick={onOpenGitHubConfig}
              style={{
                borderColor: isGitHubConfigured ? '#10B981' : '#F59E0B',
                color: isGitHubConfigured ? '#34D399' : '#FBBF24'
              }}
              title="Configurer la connexion API GitHub pour commit direct"
            >
              <Github size={15} />
              <span>{isGitHubConfigured ? 'GitHub API (Connecté)' : 'Configurer GitHub API'}</span>
            </button>

            {viewMode === 'list' && (
              <button className="tb-btn primary" onClick={onAddProcess}>
                <Plus size={15} />
                <span>Nouveau Processus</span>
              </button>
            )}

            <button className="tb-btn save" onClick={onSave} disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>

            <button className="tb-btn outline" onClick={onExportJSON} title="Télécharger une sauvegarde JSON">
              <Download size={14} />
              <span>Exporter JSON</span>
            </button>

            <button className="tb-btn outline" onClick={() => fileInputRef.current?.click()} title="Importer du JSON">
              <Upload size={14} />
              <span>Importer JSON</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              style={{ display: 'none' }} 
            />

            <button className="tb-btn danger-outline" onClick={onResetDefault} title="Réinitialiser au modèle par défaut">
              <RotateCcw size={14} />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
