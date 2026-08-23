import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  FileCode, 
  FileText, 
  Image as ImageIcon,
  Trash2,
  Plus,
  Edit3,
  Layers
} from 'lucide-react';
import { uploadProcessFile, saveFileBlob } from '../utils/storage';

export default function EditProcessModal({
  isOpen,
  onClose,
  processData,
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Réalisation',
    pilote: '',
    version: 'v1.0',
    description: '',
    url: '',
    fileType: 'html',
    originalFileName: '',
    subProcesses: []
  });

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [subUploading, setSubUploading] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState(null);

  // New sub-process draft form
  const [subForm, setSubForm] = useState({
    code: '',
    name: '',
    pilote: '',
    url: '',
    fileType: 'html',
    originalFileName: '',
    description: ''
  });

  useEffect(() => {
    if (processData) {
      setFormData({
        code: processData.code || '',
        name: processData.name || '',
        category: processData.category || 'Réalisation',
        pilote: processData.pilote || '',
        version: processData.version || 'v1.0',
        description: processData.description || '',
        url: processData.url || '',
        fileType: processData.fileType || 'html',
        originalFileName: processData.originalFileName || '',
        subProcesses: processData.subProcesses || []
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'Réalisation',
        pilote: '',
        version: 'v1.0',
        description: '',
        url: '',
        fileType: 'html',
        originalFileName: '',
        subProcesses: []
      });
    }
    setEditingSubIndex(null);
    setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'html', originalFileName: '', description: '' });
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
    setUploadMessage('Téléversement et indexation en cours...');

    try {
      const fileNameLower = file.name.toLowerCase();
      let detectedType = 'html';
      if (fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.webp') || fileNameLower.endsWith('.svg')) {
        detectedType = 'image';
      } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
        detectedType = 'word';
      }

      const fileKey = `${formData.code.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;
      await saveFileBlob(fileKey, file);

      const fileUrl = await uploadProcessFile(file);

      setFormData(prev => ({
        ...prev,
        url: fileUrl,
        fileType: detectedType,
        originalFileName: file.name
      }));

      setUploadMessage('Fichier prêt !');
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage("Erreur lors du téléversement.");
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
      let detectedType = 'html';
      if (fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.webp') || fileNameLower.endsWith('.svg')) {
        detectedType = 'image';
      } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
        detectedType = 'word';
      }

      const fileKey = `sub_${Date.now()}_${file.name}`;
      await saveFileBlob(fileKey, file);
      const fileUrl = await uploadProcessFile(file);

      setSubForm(prev => ({
        ...prev,
        url: fileUrl,
        fileType: detectedType,
        originalFileName: file.name
      }));
    } catch (err) {
      console.error("Sub upload error:", err);
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
    setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'html', originalFileName: '', description: '' });
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
      setSubForm({ code: '', name: '', pilote: '', url: '', fileType: 'html', originalFileName: '', description: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert("Veuillez renseigner le code et le nom du processus.");
      return;
    }

    onSave({
      ...processData,
      ...formData
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>{processData ? `Éditer Processus ${processData.code}` : 'Créer un nouveau processus'}</h2>
          <p>Mettez à jour les informations, le document principal et les sous-processus associés.</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Grid fields */}
          <div className="form-grid-2">
            <div className="form-group">
              <label>Code Processus *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Ex: P#1.3"
                required
              />
            </div>

            <div className="form-group">
              <label>Catégorie *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="Management">Management (Pilotage)</option>
                <option value="Réalisation">Réalisation (Opérationnel)</option>
                <option value="Support">Support (Soutien)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nom du Processus *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Management Qualité"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Pilote du Processus</label>
              <input
                type="text"
                name="pilote"
                value={formData.pilote}
                onChange={handleChange}
                placeholder="Ex: Responsable SMI"
              />
            </div>

            <div className="form-group">
              <label>Version</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="Ex: v2.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description du Processus</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Brève description de l'objectif et du périmètre de ce processus..."
            ></textarea>
          </div>

          {/* MAIN DOCUMENT SECTION */}
          <div className="html-upload-section">
            <div className="section-label">
              <Upload size={16} />
              <span>Document Principal (HTML, Word .docx, Image HD)</span>
            </div>

            {formData.url ? (
              <div className="current-file-box">
                <div className="file-info-left">
                  <Check size={18} className="icon-success" />
                  <div>
                    <span className="file-name">{formData.originalFileName || 'Document lié'}</span>
                    <span className="file-url">{formData.fileType.toUpperCase()} • {formData.url}</span>
                  </div>
                </div>

                <div className="file-actions">
                  <label className="btn-replace-file">
                    Remplacer Fichier
                    <input
                      type="file"
                      accept=".html,.htm,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="dropzone">
                <Upload size={28} className="dropzone-icon" />
                <p className="dropzone-text">Déposez votre fichier ici ou cliquez pour choisir</p>
                <p className="dropzone-sub">Formats acceptés : HTML (.html), Word (.docx), Image HD (.png, .jpg)</p>
                <label className="btn-select-file">
                  Parcourir Fichiers
                  <input
                    type="file"
                    accept=".html,.htm,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {uploading && <p className="upload-loading">{uploadMessage}</p>}
          </div>

          {/* DEDICATED SUB-PROCESSES MANAGEMENT SECTION */}
          <div className="html-upload-section" style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
            <div className="section-label" style={{ color: '#0369A1' }}>
              <Layers size={18} />
              <span>Sous-Processus Rattachés ({formData.subProcesses ? formData.subProcesses.length : 0})</span>
            </div>

            {/* List of current sub-processes */}
            {formData.subProcesses && formData.subProcesses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {formData.subProcesses.map((sub, idx) => (
                  <div 
                    key={sub.id || idx} 
                    style={{ 
                      background: '#FFFFFF', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justify-content: 'space-between',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0056B3', fontSize: '0.88rem' }}>{sub.code} : {sub.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Pilote: {sub.pilote || 'Non spécifié'} {sub.url ? `• Document: ${sub.originalFileName || sub.url}` : '• Sans document'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleEditSub(idx)}
                        style={{ background: '#DBEAFE', color: '#2563EB', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteSub(idx)}
                        style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-process Add/Edit Sub-Form */}
            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#1E293B' }}>
                {editingSubIndex !== null ? 'Modifier le sous-processus' : 'Ajouter un sous-processus'}
              </h4>

              <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Code (Ex: P#1.3.1)"
                  value={subForm.code}
                  onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="Nom (Ex: Maîtrise Documentation)"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Pilote (Ex: Gestionnaire Doc)"
                  value={subForm.pilote}
                  onChange={(e) => setSubForm({ ...subForm, pilote: e.target.value })}
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                />

                <label className="btn-select-file" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, justifyContent: 'center' }}>
                  <Upload size={14} />
                  {subForm.url ? 'Changer Fichier' : 'Fichier Sous-Proc.'}
                  <input
                    type="file"
                    accept=".html,.htm,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    onChange={handleSubFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {subForm.url && (
                <div style={{ fontSize: '0.75rem', color: '#10B981', marginBottom: '8px', fontWeight: 'bold' }}>
                  ✓ Document lié: {subForm.originalFileName || subForm.url}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddOrUpdateSub}
                style={{
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  align-items: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} />
                {editingSubIndex !== null ? 'Enregistrer Sous-Processus' : 'Ajouter ce Sous-Processus'}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            {processData && onDelete && (
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce processus ?")) {
                    onDelete(processData.id);
                    onClose();
                  }
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
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
