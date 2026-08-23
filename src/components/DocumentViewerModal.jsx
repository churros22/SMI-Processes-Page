import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Calendar, 
  Tag, 
  AlertCircle,
  Layers
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { resolveProcessUrl } from '../utils/storage';

export default function DocumentViewerModal({
  isOpen,
  onClose,
  processData
}) {
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Image Viewer Zoom Slider (30% to 700%) & Pan
  const [zoomPercent, setZoomPercent] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchDistanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !processData) return;
    setActiveItem(processData);
  }, [isOpen, processData]);

  useEffect(() => {
    if (!isOpen || !activeItem) return;

    let isMounted = true;
    setLoading(true);
    setError('');
    setZoomPercent(100);
    setPan({ x: 0, y: 0 });

    async function loadDocument() {
      try {
        const target = activeItem.url ? activeItem : processData;
        const resolvedUrl = await resolveProcessUrl(target);
        if (!isMounted) return;
        setFileUrl(resolvedUrl || target.url || './processes/cartographie-interactions-smi.png');
        setLoading(false);
      } catch (err) {
        console.error("Error rendering document:", err);
        if (isMounted) {
          setFileUrl('./processes/cartographie-interactions-smi.png');
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => { isMounted = false; };
  }, [isOpen, activeItem, processData]);

  if (!isOpen || !processData) return null;

  const currentDisplayItem = activeItem || processData;
  const hasSubProcesses = processData.subProcesses && processData.subProcesses.length > 0;

  // Pointer Capture Dragging & Touch Pinch Handlers

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
      setZoomPercent(z => Math.min(Math.max(Math.round(z * factor), 30), 700));
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('.image-viewer-toolbar')) return;
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

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomPercent(z => Math.min(Math.max(Math.round(z * zoomFactor), 30), 700));
  };

  const handleResetZoomPan = () => {
    setZoomPercent(100);
    setPan({ x: 0, y: 0 });
  };

  const handleOpenInNewTab = () => {
    const code = currentDisplayItem.code || processData.code;
    window.open(`#doc=${encodeURIComponent(code)}`, '_blank');
  };

  const revisionText = currentDisplayItem.version || processData.version || 'Rev 3.0';
  const dateText = currentDisplayItem.lastUpdated || processData.lastUpdated || new Date().toLocaleDateString('fr-FR');

  return (
    <div className="modal-backdrop viewer-backdrop">
      <div className="viewer-container-card">
        {/* Header Bar */}
        <div className="viewer-header">
          <div className="viewer-title-group">
            <img src={logoImg} alt="Top Gloves Logo" className="viewer-logo" />

            <div className="viewer-titles">
              <h3>
                <span className="viewer-code-pill">{currentDisplayItem.code}</span>
                {currentDisplayItem.name}
              </h3>
              <div className="modal-meta-badges">
                <span className="modal-meta-tag"><Tag size={12} /> {revisionText}</span>
                <span className="modal-meta-tag"><Calendar size={12} /> Modifié le {dateText}</span>
              </div>
            </div>
          </div>

          <div className="viewer-header-actions">
            {fileUrl && (
              <a
                href={fileUrl}
                download={currentDisplayItem.originalFileName || `${currentDisplayItem.code}_document.png`}
                className="viewer-btn secondary"
                title="Télécharger l'image de la carte"
              >
                <Download size={15} />
                <span>Télécharger</span>
              </a>
            )}

            <button
              onClick={handleOpenInNewTab}
              className="viewer-btn primary"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={15} />
              <span>Nouvel Onglet</span>
            </button>

            <button className="viewer-close-btn" onClick={onClose} title="Fermer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SUB-PROCESSES TAB BAR IF AVAILABLE */}
        {hasSubProcesses && (
          <div className="sub-processes-tabs-bar">
            <span className="sub-tabs-label">
              <Layers size={15} /> Processus & Sous-Processus :
            </span>

            {/* Parent Process Tab */}
            <button
              className={`sub-tab-item ${activeItem.id === processData.id ? 'active' : ''}`}
              onClick={() => setActiveItem(processData)}
            >
              <strong>{processData.code}</strong> (Principal)
            </button>

            {/* Sub-Processes Tabs */}
            {processData.subProcesses.map((sub) => (
              <button
                key={sub.id || sub.code}
                className={`sub-tab-item ${activeItem.id === sub.id ? 'active' : ''}`}
                onClick={() => setActiveItem(sub)}
              >
                <strong>{sub.code}</strong> : {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Viewer Body Content */}
        <div className="viewer-body">
          {loading && (
            <div className="viewer-loading">
              <div className="spinner"></div>
              <p>Chargement de la Fiche Processus en cours...</p>
            </div>
          )}

          {error && (
            <div className="viewer-error-box">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          )}

          {/* HIGH QUALITY PNG IMAGE VIEWER */}
          {!loading && !error && (
            <div 
              className="image-viewer-wrapper"
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
              <div 
                className="image-transform-viewport"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out'
                }}
              >
                <img 
                  src={fileUrl} 
                  alt={currentDisplayItem.name} 
                  className="high-res-process-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = './processes/cartographie-interactions-smi.png';
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>

              <div className="image-viewer-toolbar">
                <button 
                  className={`tool-pill-btn ${zoomPercent === 100 && pan.x === 0 && pan.y === 0 ? 'active' : ''}`}
                  onClick={handleResetZoomPan}
                  title="Ajuster et centrer l'image (100%)"
                >
                  <Eye size={15} />
                  <span>Ajuster Écran</span>
                </button>

                <div className="toolbar-separator"></div>

                <button onClick={() => setZoomPercent(z => Math.max(z - 25, 30))} title="Zoom Arrière">
                  <ZoomOut size={18} />
                </button>

                <div className="zoom-slider-container">
                  <input
                    type="range"
                    min="30"
                    max="700"
                    value={zoomPercent}
                    onChange={(e) => setZoomPercent(Number(e.target.value))}
                    className="zoom-range-slider"
                  />
                  <span className="zoom-value-badge">{zoomPercent}%</span>
                </div>

                <button onClick={() => setZoomPercent(z => Math.min(z + 25, 700))} title="Zoom Avant (jusqu'à 700%)">
                  <ZoomIn size={18} />
                </button>

                <div className="toolbar-separator"></div>

                <button onClick={handleResetZoomPan} title="Réinitialiser (100%)">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
