import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Download, 
  Printer, 
  X,
  Tag
} from 'lucide-react';
import { resolveProcessUrl } from '../utils/storage';

export default function FullScreenCleanViewer({
  processItem,
  allProcesses,
  onClose
}) {
  const [activeProcess, setActiveProcess] = useState(processItem);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Zoom & Pan (30% to 700%)
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    async function loadImg() {
      if (!activeProcess || !activeProcess.url || activeProcess.url.trim().length === 0) {
        setImageUrl('');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const resolved = await resolveProcessUrl(activeProcess);
        setImageUrl(resolved || activeProcess.url || '');
      } catch (err) {
        setImageUrl(activeProcess.url || '');
      } finally {
        setIsLoading(false);
      }
    }
    loadImg();
  }, [activeProcess]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
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
    if (e.target.closest('.clean-toolbar')) return;
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

  const handleReset = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find sub-processes if available
  const subProcesses = activeProcess?.subProcesses || [];

  return (
    <div className="fullscreen-clean-container" ref={containerRef}>
      {/* Tiny Floating Process Code Tag (top left) */}
      <div className="clean-top-badge">
        <span className="clean-code-pill">{activeProcess?.code}</span>
        <span className="clean-title-text">{activeProcess?.name}</span>
        {activeProcess?.version && (
          <span className="clean-meta-pill"><Tag size={11} /> {activeProcess.version}</span>
        )}
        {subProcesses.length > 0 && (
          <div className="clean-sub-tabs">
            {subProcesses.map((sub) => (
              <button 
                key={sub.code}
                className="clean-sub-btn"
                onClick={() => setActiveProcess(sub)}
              >
                {sub.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 100% Fullscreen Viewport Body */}
      <div 
        className="clean-viewport-body"
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
        {isLoading ? (
          <div className="clean-loading-box">
            <div className="spinner"></div>
          </div>
        ) : !imageUrl ? (
          <div className="png-empty-box" style={{ padding: '40px' }}>
            <h3>Aucun schéma téléversé</h3>
            <p>Aucun schéma ou document n'a encore été téléversé pour le processus {activeProcess?.code}.</p>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '8px' }}>
              Connectez-vous en Admin pour téléverser le document officiel.
            </p>
          </div>
        ) : (
          <div 
            className="clean-transform-layer"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            <img 
              src={imageUrl} 
              alt={activeProcess?.name}
              className="clean-high-res-img"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        )}
      </div>

      {/* Tiny Semi-Transparent Floating Toolbar at Bottom Center */}
      <div className="clean-toolbar">
        <button onClick={() => setZoom(z => Math.max(z - 25, 30))} title="Zoom Arrière">
          <ZoomOut size={16} />
        </button>
        <div className="clean-zoom-box">
          <input 
            type="range" 
            min="30" 
            max="700" 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            className="clean-range-slider" 
          />
          <span className="clean-zoom-badge">{zoom}%</span>
        </div>
        <button onClick={() => setZoom(z => Math.min(z + 25, 700))} title="Zoom Avant (jusqu'à 700%)">
          <ZoomIn size={16} />
        </button>
        <div className="clean-divider"></div>
        <button onClick={handleReset} title="Réinitialiser à 100%">
          <RotateCcw size={15} />
        </button>
        <button onClick={toggleFullscreen} title={isFullscreen ? "Quitter Plein Écran" : "Mode Plein Écran"}>
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <div className="clean-divider"></div>
        <button onClick={() => window.print()} title="Imprimer">
          <Printer size={15} />
        </button>
        {imageUrl && (
          <a href={imageUrl} download={`${activeProcess?.code || 'carte'}.png`} className="clean-dl-link" title="Télécharger PNG">
            <Download size={15} />
          </a>
        )}
        {onClose && (
          <button onClick={onClose} className="clean-close-btn" title="Fermer">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
