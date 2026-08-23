import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink, 
  Calendar,
  Tag,
  FileText
} from 'lucide-react';
import { uploadImageFile } from '../utils/storage';

export default function ProcessModal({
  isOpen,
  onClose,
  processData,
  onSaveProcess,
  showToast
}) {
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    category: 'Réalisation',
    pilote: '',
    version: 'Rev 3.0',
    lastUpdated: new Date().toLocaleDateString('fr-FR'),
    description: '',
    status: 'Validé',
    url: '',
    originalFileName: '',
    fileType: 'image'
  });

  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (processData) {
      setFormData({
        id: processData.id || `PROC-${Date.now()}`,
        code: processData.code || '',
        name: processData.name || '',
        category: processData.category || 'Réalisation',
        pilote: processData.pilote || '',
        version: processData.version || 'Rev 3.0',
        lastUpdated: processData.lastUpdated || new Date().toLocaleDateString('fr-FR'),
        description: processData.description || '',
        status: processData.status || 'Validé',
        url: processData.url || '',
        originalFileName: processData.originalFileName || '',
        fileType: 'image',
        fileKey: processData.fileKey || null,
        subProcesses: processData.subProcesses || []
      });
    } else {
      setFormData({
        id: `PROC-${Date.now()}`,
        code: '',
        name: '',
        category: 'Réalisation',
        pilote: '',
        version: 'Rev 1.0',
        lastUpdated: new Date().toLocaleDateString('fr-FR'),
        description: '',
        status: 'Validé',
        url: '',
        originalFileName: '',
        fileType: 'image',
        subProcesses: []
      });
    }
  }, [processData, isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const uploadRes = await uploadImageFile(formData.code || formData.id, file);
      
      setFormData(prev => ({
        ...prev,
        url: uploadRes.url,
        fileKey: uploadRes.fileKey || null,
        originalFileName: file.name,
        fileType: 'image',
        lastUpdated: new Date().toLocaleDateString('fr-FR')
      }));

      showToast && showToast(`Image "${file.name}" téléversée avec succès !`, 'success');
    } catch (err) {
      console.error(err);
      alert("Erreur lors du téléversement de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert("Veuillez saisir le code et le nom du processus.");
      return;
    }
    onSaveProcess(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card process-edit-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>{processData ? `Édition : ${formData.code} - ${formData.name}` : 'Nouveau Processus SMI'}</h2>
          <p>Gérez les métadonnées du processus et son image rattachée (PNG, JPG, WEBP, SVG).</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Code du Processus *</label>
              <input
                type="text"
                placeholder="ex: P#1.1, P#2, P#5"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Catégorie SMI *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Management">Management (Pilotage)</option>
                <option value="Réalisation">Réalisation (Opérationnels)</option>
                <option value="Support">Support (Soutien)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Intitulé du Processus *</label>
            <input
              type="text"
              placeholder="ex: Stratégies & Revue de Direction"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Pilote du Processus (Responsable)</label>
              <input
                type="text"
                placeholder="ex: Direction Générale"
                value={formData.pilote}
                onChange={(e) => setFormData({ ...formData, pilote: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label><Tag size={14} /> N° de Révision</label>
              <input
                type="text"
                placeholder="ex: Rev 3.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Calendar size={14} /> Date de modification</label>
            <input
              type="text"
              placeholder="ex: 11/08/2026"
              value={formData.lastUpdated}
              onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description synthétique</label>
            <textarea
              rows="3"
              placeholder="Brève description de la finalité du processus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          {/* PNG Image Upload Section */}
          <div className="html-upload-section">
            <label className="section-label">
              <ImageIcon size={18} /> Image de la Fiche Processus (PNG, JPG, WEBP, SVG)
            </label>

            {formData.url ? (
              <div className="current-file-box">
                <div className="file-info-left">
                  <ImageIcon size={20} className="icon-success" />
                  <div>
                    <span className="file-name">{formData.originalFileName || formData.url.split('/').pop()}</span>
                    <p className="file-url">{formData.url}</p>
                  </div>
                </div>

                <div className="file-actions">
                  <a
                    href={formData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-preview-link"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLink size={14} /> Ouvrir Image
                  </a>

                  <label className="btn-replace-file">
                    <RefreshCw size={14} /> Remplacer Image
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div
                className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-text">Glissez-déposez votre image PNG ici</p>
                <span className="dropzone-sub">Formats acceptés : PNG, JPG, WEBP, SVG</span>
                
                <label className="btn-select-file">
                  <span>Parcourir les fichiers</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </label>
              </div>
            )}
            
            {uploading && <div className="upload-loading">Téléversement de l'image en cours...</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer le Processus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
