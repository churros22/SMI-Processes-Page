import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Calendar, 
  Tag, 
  Edit3, 
  Upload, 
  FileText, 
  X, 
  Check, 
  Download,
  AlertCircle,
  Github
} from 'lucide-react';
import { uploadImageFile, resolveProcessUrl } from '../utils/storage';
import { getGitHubConfig, uploadImageToGitHub, commitProcessDataToGitHub } from '../utils/githubApi';

export default function PngMapViewer({
  mapProcess,
  onUpdateMapProcess,
  allProcesses,
  isAdmin,
  showToast
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Pan & Zoom State (30% to 500%)
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Admin Metadata Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editRevision, setEditRevision] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    async function loadMapImage() {
      if (!mapProcess) return;
      setIsLoadingImage(true);
      setImageError(false);
      try {
        const resolved = await resolveProcessUrl(mapProcess);
        setImageUrl(resolved || mapProcess.url || '');
      } catch (err) {
        console.error("Error resolving PNG map URL:", err);
        setImageUrl(mapProcess.url || '');
      } finally {
        setIsLoadingImage(false);
      }
    }
    loadMapImage();
  }, [mapProcess]);

  // Handle Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(Math.max(Math.round(zoom * zoomFactor), 30), 700);
    setZoom(newZoom);
  };

  // Touch Pinch-to-Zoom & Pointer Dragging Handlers
  const touchDistanceRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistanceRef.current) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchDistanceRef.current;
      touchDistanceRef.current = currentDist;
      setZoom(z => Math.min(Math.max(Math.round(z * factor), 30), 700));
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('.viewer-top-info-bar') || e.target.closest('.png-zoom-toolbar')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleResetZoomPan = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {});
      setIsFullscreen(false);
    }
  };

  // Open Metadata Edit Modal
  const handleOpenEditModal = () => {
    setEditTitle(mapProcess.name || 'Cartographie des Interactions du SMI');
    setEditRevision(mapProcess.version || 'Rev 3.0');
    setEditDate(mapProcess.lastUpdated || new Date().toLocaleDateString('fr-FR'));
    setIsEditModalOpen(true);
  };

  // Save Admin Metadata & File
  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    const updated = {
      ...mapProcess,
      name: editTitle,
      version: editRevision,
      lastUpdated: editDate
    };
    onUpdateMapProcess(updated);
    setIsEditModalOpen(false);

    // Auto Commit to GitHub if configured
    const ghConfig = getGitHubConfig();
    if (ghConfig.token) {
      try {
        if (showToast) showToast("Publication du commit sur GitHub en cours...", "info");
        await commitProcessDataToGitHub(allProcesses || [], updated);
        if (showToast) showToast("Métadonnées publiées sur GitHub avec succès ! GitHub Pages va se mettre à jour.", "success");
      } catch (err) {
        console.error("GitHub commit error:", err);
        if (showToast) showToast(`Métadonnées enregistrées en local. (Erreur GitHub: ${err.message})`, "error");
      }
    } else {
      if (showToast) showToast("Métadonnées enregistrées avec succès !", "success");
    }
  };

  // Upload New PNG Image
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadRes = await uploadImageFile(mapProcess.id || 'GLOBAL_MAP', file);
      const timeStamp = Date.now();
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.png';
      const fileNameOnGit = `cartographie-interactions-smi_${timeStamp}${fileExt}`;
      const relativeUrl = `./processes/${fileNameOnGit}`;

      const ghConfig = getGitHubConfig();
      const isGitHubActive = !!ghConfig.token;

      const updatedMap = {
        ...mapProcess,
        url: relativeUrl,
        fileKey: isGitHubActive ? null : (uploadRes.fileKey || null),
        originalFileName: file.name,
        lastUpdated: new Date().toLocaleDateString('fr-FR')
      };
      onUpdateMapProcess(updatedMap);
      setImageUrl(uploadRes.url);
      setZoom(100);
      setPan({ x: 0, y: 0 });

      // Auto Commit to GitHub if configured
      if (isGitHubActive) {
        try {
          if (showToast) showToast("Téléversement direct de la carte PNG sur GitHub...", "info");
          await uploadImageToGitHub(file, fileNameOnGit, `[Admin Upload] Nouvelle cartographie : ${file.name}`);
          // Wait 600ms to allow GitHub API branch HEAD to settle before committing data.json
          await new Promise(r => setTimeout(r, 600));
          await commitProcessDataToGitHub(allProcesses || [], updatedMap);
          if (showToast) showToast("Image PNG commitée sur GitHub avec succès ! GitHub Pages met à jour le site pour tout le monde.", "success");
        } catch (ghErr) {
          console.error("GitHub upload error:", ghErr);
          if (showToast) showToast(`Erreur GitHub: ${ghErr.message}`, "error");
        }
      } else {
        if (showToast) showToast(`Nouvelle carte PNG téléversée en local ! (${file.name})`, "success");
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (showToast) showToast("Erreur lors du téléversement de l'image.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const titleText = mapProcess?.name || 'Cartographie des Interactions du SMI';
  const revisionText = mapProcess?.version || 'Rev 3.0';
  const dateText = mapProcess?.lastUpdated || new Date().toLocaleDateString('fr-FR');

  return (
    <div className="png-viewer-container" ref={containerRef}>
      {/* Top Floating Info Bar (Title, Revision, Date & Admin Actions) */}
      <div className="viewer-top-info-bar">
        <div className="info-bar-left">
          <h2 className="viewer-map-title">{titleText}</h2>
          <div className="metadata-badges-group">
            <span className="meta-badge revision" title="Numéro de Révision">
              <Tag size={13} />
              {revisionText}
            </span>
            <span className="meta-badge date" title="Dernière modification">
              <Calendar size={13} />
              Modifié le {dateText}
            </span>
          </div>
        </div>

        <div className="info-bar-actions">
          {imageUrl && (
            <a 
              href={imageUrl} 
              download={mapProcess?.originalFileName || "cartographie-smi.png"} 
              className="btn-info-action secondary"
              title="Télécharger l'image de la carte"
            >
              <Download size={15} />
              <span>Télécharger PNG</span>
            </a>
          )}

          {isAdmin && (
            <button 
              className="btn-info-action primary" 
              onClick={handleOpenEditModal}
              title="Modifier les métadonnées ou téléverser une nouvelle carte PNG"
            >
              <Edit3 size={15} />
              <span>Éditer Carte / Métadonnées</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container (Ultra Large Display for PNG Maps) */}
      <div 
        className="png-map-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {isLoadingImage ? (
          <div className="png-loading-box">
            <div className="spinner"></div>
            <p>Chargement de la Carte PNG en cours...</p>
          </div>
        ) : imageError || !imageUrl ? (
          <div className="png-empty-box">
            <AlertCircle size={48} color="#94A3B8" />
            <h3>Image de la Carte non disponible</h3>
            <p>L'image PNG spécifiée n'a pas pu être chargée ou aucun fichier n'a encore été téléversé.</p>
            {isAdmin && (
              <label className="btn-upload-lg">
                <Upload size={18} />
                <span>Téléverser la Carte PNG</span>
                <input 
                  type="file" 
                  accept=".png,.jpg,.jpeg,.webp,.svg" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        ) : (
          <div 
            className="png-transform-layer"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            <img 
              src={imageUrl} 
              alt={titleText}
              className="main-png-image"
              onError={() => setImageError(true)}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Smooth Floating Navigation & Zoom Toolbar */}
        {imageUrl && !imageError && (
          <div className="png-zoom-toolbar">
            <button onClick={() => setZoom(z => Math.max(z - 25, 30))} title="Zoom arrière">
              <ZoomOut size={16} />
            </button>
            <div className="zoom-slider-box">
              <input 
                type="range" 
                min="30" 
                max="700" 
                value={zoom} 
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="zoom-slider-range" 
              />
              <span className="zoom-value-text">{zoom}%</span>
            </div>
            <button onClick={() => setZoom(z => Math.min(z + 25, 500))} title="Zoom avant">
              <ZoomIn size={16} />
            </button>
            <div className="toolbar-divider"></div>
            <button onClick={handleResetZoomPan} title="Taille réelle (100%) et centrer">
              <RotateCcw size={15} />
            </button>
            <button onClick={toggleFullscreen} title={isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        )}
      </div>

      {/* Admin Edit Metadata & Upload Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop viewer-backdrop">
          <div className="modal-card edit-metadata-modal">
            <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2><Edit3 size={20} color="#2563EB" /> Éditer les Métadonnées & Carte PNG</h2>
              <p>Mettez à jour le titre, le numéro de révision, la date ou remplacez l'image PNG.</p>
            </div>

            <form onSubmit={handleSaveMetadata} className="metadata-edit-form">
              <div className="form-group">
                <label><FileText size={15} /> Titre du document / Carte</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><Tag size={15} /> N° de Révision</label>
                  <input 
                    type="text" 
                    value={editRevision} 
                    onChange={(e) => setEditRevision(e.target.value)} 
                    placeholder="ex: Rev 3.0"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label><Calendar size={15} /> Date de modification</label>
                  <input 
                    type="text" 
                    value={editDate} 
                    onChange={(e) => setEditDate(e.target.value)} 
                    placeholder="ex: 11/08/2026"
                    required 
                  />
                </div>
              </div>

              <div className="upload-section-box">
                <label className="upload-box-label">
                  <Upload size={18} color="#2563EB" />
                  <span>{isUploading ? "Téléversement en cours..." : "Remplacer le fichier PNG"}</span>
                  <p>Formats acceptés : PNG, JPG, WEBP, SVG (Recommandé : PNG Haute Définition)</p>
                  <input 
                    type="file" 
                    accept=".png,.jpg,.jpeg,.webp,.svg" 
                    onChange={handleFileUpload} 
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Enregistrer les Métadonnées</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
