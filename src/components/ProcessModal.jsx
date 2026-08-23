import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Image as ImageIcon,
  Trash2,
  Plus,
  Edit3,
  Layers,
  Calendar,
  Tag,
  RefreshCw
} from 'lucide-react';
import { uploadImageFile } from '../utils/storage';
import { getGitHubConfig, uploadImageToGitHub } from '../utils/githubApi';

export default function ProcessModal({
  isOpen,
  onClose,
  processData,
  onSaveProcess,
  onDeleteProcess,
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
    fileType: 'image',
    fileKey: null,
    subProcesses: []
  });

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [subUploading, setSubUploading] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState(null);

  // Sub-process draft form
  const [subForm, setSubForm] = useState({
    code: '',
    name: '',
    pilote: '',
    url: '',
    fileType: 'image',
    originalFileName: '',
    description: ''
  });

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
        fileType: processData.fileType || 'image',
        fileKey: processData.fileKey || null,
        subProcesses: processData.subProcesses ? JSON.parse(JSON.stringify(processData.subProcesses)) : []
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
        fileKey: null,
        subProcesses: []
      });
    }
    setEditingSubIndex(null);
    setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'image', originalFileName: '', description: '' });
  }, [processData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Main file upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('Téléversement du fichier en cours...');

    try {
      const fileNameLower = file.name.toLowerCase();
      let detectedType = 'image';
      if (fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm')) {
        detectedType = 'html';
      } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
        detectedType = 'word';
      }

      const cleanCode = (formData.code || 'proc').replace(/[^a-zA-Z0-9]/g, '_');
      const timeStamp = Date.now();
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.png';
      const safeGitFileName = `${cleanCode}_${timeStamp}${fileExt}`;
      const finalUrl = `./processes/${safeGitFileName}`;

      const ghConfig = getGitHubConfig();
      if (ghConfig.token) {
        setUploadMessage('Publication directe sur GitHub...');
        await uploadImageToGitHub(file, safeGitFileName, `[Admin Upload] Fichier processus ${formData.code} : ${file.name}`);
        setFormData(prev => ({
          ...prev,
          url: finalUrl,
          fileKey: null,
          fileType: detectedType,
          originalFileName: file.name,
          lastUpdated: new Date().toLocaleDateString('fr-FR')
        }));
        showToast && showToast(`Fichier "${file.name}" téléversé et commité sur GitHub !`, 'success');
      } else {
        const uploadRes = await uploadImageFile(formData.code || formData.id, file);
        setFormData(prev => ({
          ...prev,
          url: uploadRes.url,
          fileKey: uploadRes.fileKey || null,
          fileType: detectedType,
          originalFileName: file.name,
          lastUpdated: new Date().toLocaleDateString('fr-FR')
        }));
        showToast && showToast(`Fichier "${file.name}" sauvegardé en local !`, 'info');
      }

      setUploadMessage('Fichier prêt !');
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage(`Erreur: ${err.message || "Impossible de téléverser le fichier."}`);
      showToast && showToast(`Erreur: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Sub-process file upload handler
  const handleSubFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubUploading(true);

    try {
      const fileNameLower = file.name.toLowerCase();
      let detectedType = 'image';
      if (fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm')) {
        detectedType = 'html';
      }

      const cleanCode = (subForm.code || 'sub').replace(/[^a-zA-Z0-9]/g, '_');
      const timeStamp = Date.now();
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.png';
      const safeGitFileName = `sub_${cleanCode}_${timeStamp}${fileExt}`;
      const finalUrl = `./processes/${safeGitFileName}`;

      const ghConfig = getGitHubConfig();
      if (ghConfig.token) {
        await uploadImageToGitHub(file, safeGitFileName, `[Admin Upload] Fichier sous-processus ${subForm.code} : ${file.name}`);
        setSubForm(prev => ({
          ...prev,
          url: finalUrl,
          fileKey: null,
          fileType: detectedType,
          originalFileName: file.name
        }));
        showToast && showToast(`Fichier sous-processus téléversé sur GitHub !`, 'success');
      } else {
        const uploadRes = await uploadImageFile(subForm.code || `sub_${Date.now()}`, file);
        setSubForm(prev => ({
          ...prev,
          url: uploadRes.url,
          fileKey: uploadRes.fileKey || null,
          fileType: detectedType,
          originalFileName: file.name
        }));
        showToast && showToast(`Fichier sous-processus sauvegardé en local !`, 'info');
      }
    } catch (err) {
      console.error("Sub upload error:", err);
      alert(`Erreur téléversement sous-processus: ${err.message}`);
    } finally {
      setSubUploading(false);
    }
  };

  const handleAddOrUpdateSub = () => {
    if (!subForm.code || !subForm.name) {
      alert("Veuillez saisir au moins le code et le nom du sous-processus.");
      return;
    }

    const newSubs = [...(formData.subProcesses || [])];
    if (editingSubIndex !== null) {
      newSubs[editingSubIndex] = { ...subForm, id: subForm.id || `sub_${Date.now()}` };
    } else {
      newSubs.push({ ...subForm, id: `sub_${Date.now()}` });
    }

    setFormData(prev => ({ ...prev, subProcesses: newSubs }));
    setEditingSubIndex(null);
    setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'image', originalFileName: '', description: '' });
  };

  const handleEditSub = (index) => {
    setEditingSubIndex(index);
    setSubForm(formData.subProcesses[index]);
  };

  const handleDeleteSub = (index) => {
    const newSubs = formData.subProcesses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, subProcesses: newSubs }));
    if (editingSubIndex === index) {
      setEditingSubIndex(null);
      setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'image', originalFileName: '', description: '' });
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
      <div className="modal-card process-edit-modal" style={{ maxWidth: '680px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>{processData ? `Édition : ${formData.code} - ${formData.name}` : 'Nouveau Processus SMI'}</h2>
          <p>Mettez à jour les informations, la fiche document / image et les sous-processus.</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Code du Processus *</label>
              <input
                type="text"
                name="code"
                placeholder="ex: P#1.1, P#2, P#5"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Catégorie SMI *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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
              name="name"
              placeholder="ex: Stratégies & Revue de Direction"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Pilote du Processus (Responsable)</label>
              <input
                type="text"
                name="pilote"
                placeholder="ex: Direction Générale"
                value={formData.pilote}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label><Tag size={14} /> N° de Révision</label>
              <input
                type="text"
                name="version"
                placeholder="ex: Rev 3.0"
                value={formData.version}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Calendar size={14} /> Date de modification</label>
            <input
              type="text"
              name="lastUpdated"
              placeholder="ex: 11/08/2026"
              value={formData.lastUpdated}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description synthétique</label>
            <textarea
              name="description"
              rows="2"
              placeholder="Brève description de la finalité du processus..."
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* DOCUMENT PRINCIPAL UPLOAD */}
          <div className="html-upload-section">
            <label className="section-label">
              <ImageIcon size={18} /> Document / Fiche Processus (PNG, JPG, WEBP, SVG)
            </label>

            {formData.url ? (
              <div className="current-file-box">
                <div className="file-info-left">
                  <Check size={20} className="icon-success" />
                  <div>
                    <span className="file-name">{formData.originalFileName || formData.url.split('/').pop()}</span>
                    <p className="file-url">{formData.url}</p>
                  </div>
                </div>

                <div className="file-actions">
                  <label className="btn-replace-file">
                    <RefreshCw size={14} /> Remplacer Image
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg,.html"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="dropzone">
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-text">Déposez votre document image ici</p>
                <span className="dropzone-sub">Formats acceptés : PNG, JPG, WEBP, SVG</span>
                
                <label className="btn-select-file">
                  <span>Parcourir les fichiers</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,.html"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
            
            {uploading && <div className="upload-loading">{uploadMessage}</div>}
          </div>

          {/* DEDICATED SUB-PROCESSES MANAGEMENT SECTION */}
          <div className="html-upload-section" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '14px', borderRadius: '10px' }}>
            <div className="section-label" style={{ color: '#0369A1', marginBottom: '10px' }}>
              <Layers size={18} />
              <span>Sous-Processus Rattachés ({formData.subProcesses ? formData.subProcesses.length : 0})</span>
            </div>

            {/* List of current sub-processes */}
            {formData.subProcesses && formData.subProcesses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {formData.subProcesses.map((sub, idx) => (
                  <div 
                    key={sub.id || idx} 
                    style={{ 
                      background: '#FFFFFF', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0056B3', fontSize: '0.88rem' }}>{sub.code} : {sub.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Pilote: {sub.pilote || 'Non spécifié'} {sub.url ? `• Document: ${sub.originalFileName || sub.url.split('/').pop()}` : '• Sans document'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleEditSub(idx)}
                        style={{ background: '#DBEAFE', color: '#2563EB', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Éditer ce sous-processus"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteSub(idx)}
                        style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Supprimer ce sous-processus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-process Add/Edit Sub-Form */}
            <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#1E293B' }}>
                {editingSubIndex !== null ? 'Modifier le sous-processus' : 'Ajouter un nouveau sous-processus'}
              </h4>

              <div className="form-grid-2" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Code (Ex: P#1.3.1)"
                  value={subForm.code}
                  onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="Nom (Ex: Maîtrise Documentation SMI)"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Pilote (Ex: Responsable Doc)"
                  value={subForm.pilote}
                  onChange={(e) => setSubForm({ ...subForm, pilote: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />

                <label className="btn-select-file" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 10px' }}>
                  <Upload size={13} />
                  {subForm.url ? 'Changer Fichier' : 'Fichier Image Sous-Proc.'}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,.html"
                    onChange={handleSubFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {subForm.url && (
                <div style={{ fontSize: '0.75rem', color: '#10B981', marginBottom: '8px', fontWeight: 'bold' }}>
                  ✓ Document associé : {subForm.originalFileName || subForm.url.split('/').pop()}
                </div>
              )}

              {subUploading && <div style={{ fontSize: '0.75rem', color: '#0284C7', marginBottom: '8px' }}>Téléversement sous-processus en cours...</div>}

              <button
                type="button"
                onClick={handleAddOrUpdateSub}
                style={{
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} />
                {editingSubIndex !== null ? 'Enregistrer Sous-Processus' : 'Ajouter ce Sous-Processus'}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            {processData && onDeleteProcess && (
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => {
                  onDeleteProcess(processData.id);
                  onClose();
                }}
                style={{ marginRight: 'auto' }}
              >
                <Trash2 size={16} /> Supprimer
              </button>
            )}

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
