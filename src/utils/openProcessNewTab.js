import { resolveProcessUrl } from './storage';

export async function openProcessDocumentInNewTab(processItem, parentProcess = null) {
  if (!processItem) return;

  const targetProcess = processItem;
  const parent = parentProcess || (processItem.parentProcess ? processItem.parentProcess : null);

  // Collect all related sub-process tabs
  let subTabs = [];
  if (parent && parent.subProcesses) {
    subTabs = [
      { id: parent.id, code: parent.code, name: parent.name, url: parent.url, fileType: parent.fileType, originalFileName: parent.originalFileName, version: parent.version, lastUpdated: parent.lastUpdated, isParent: true },
      ...parent.subProcesses.map(s => ({ ...s, isParent: false }))
    ];
  } else if (processItem.subProcesses && processItem.subProcesses.length > 0) {
    subTabs = [
      { id: processItem.id, code: processItem.code, name: processItem.name, url: processItem.url, fileType: processItem.fileType, originalFileName: processItem.originalFileName, version: processItem.version, lastUpdated: processItem.lastUpdated, isParent: true },
      ...processItem.subProcesses.map(s => ({ ...s, isParent: false }))
    ];
  }

  let initialUrl = '';
  try {
    initialUrl = await resolveProcessUrl(targetProcess);
  } catch (e) {
    initialUrl = targetProcess.url || '';
  }

  const win = window.open('', '_blank');
  if (!win) {
    alert("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour ouvrir le document dans un nouvel onglet.");
    return;
  }

  const titleText = `${targetProcess.code} : ${targetProcess.name} — Top Gloves`;
  const revisionText = targetProcess.version || 'Rev 3.0';
  const dateText = targetProcess.lastUpdated || new Date().toLocaleDateString('fr-FR');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${titleText}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #0F172A; color: #F8FAFC; user-select: none; -webkit-user-select: none; }
        body { display: flex; flex-direction: column; }

        .top-ribbon {
          background: #003B7A;
          color: #FFFFFF;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          flex-shrink: 0;
          z-index: 100;
        }

        .top-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .top-code-badge { background: #2563EB; color: white; font-weight: 800; font-size: 0.8rem; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; }
        .top-titles { min-width: 0; overflow: hidden; }
        .top-titles h1 { font-size: 1rem; font-weight: 800; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .meta-group { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
        .meta-pill { background: rgba(255,255,255,0.15); color: #E2E8F0; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; }

        .top-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .btn-action {
          background: rgba(255,255,255,0.15);
          color: white;
          border: 1px solid rgba(255,255,255,0.25);
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .btn-action:hover { background: rgba(255,255,255,0.3); }
        .btn-primary { background: #2563EB; border: none; }
        .btn-primary:hover { background: #1D4ED8; }

        .sub-tabs-bar {
          background: #1E293B;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #334155;
          overflow-x: auto;
          flex-shrink: 0;
        }
        .sub-tabs-title { font-size: 0.75rem; font-weight: 700; color: #94A3B8; margin-right: 4px; white-space: nowrap; }
        .tab-btn {
          background: #334155;
          color: #94A3B8;
          border: 1px solid #475569;
          padding: 5px 12px;
          border-radius: 16px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab-btn:hover { background: #475569; color: white; }
        .tab-btn.active { background: #2563EB; color: white; border-color: #3B82F6; font-weight: 700; }

        .viewport-body {
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          touch-action: none;
        }

        .pan-transform-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-origin: center center;
          transition: transform 0.05s ease-out;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .interactive-img {
          display: block;
          max-width: 98vw;
          max-height: 95vh;
          object-fit: contain;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          border-radius: 6px;
          pointer-events: none;
        }

        .floating-toolbar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 20px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 95;
        }
        .floating-toolbar button { background: none; border: none; color: white; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; font-size: 0.85rem; font-weight: 700; }
        .floating-toolbar button:hover { background: rgba(255,255,255,0.2); }
        .zoom-slider { width: 130px; accent-color: #2563EB; cursor: pointer; }
        .zoom-badge { color: white; font-weight: 800; font-size: 0.85rem; min-width: 45px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="top-ribbon">
        <div class="top-brand">
          <span class="top-code-badge" id="headerCode">${targetProcess.code}</span>
          <div class="top-titles">
            <h1 id="headerName">${targetProcess.name}</h1>
            <div class="meta-group">
              <span class="meta-pill" id="headerRevision">🏷️ ${revisionText}</span>
              <span class="meta-pill" id="headerDate">📅 ${dateText}</span>
            </div>
          </div>
        </div>
        <div class="top-actions">
          <button onclick="window.print()" class="btn-action">🖨️ Imprimer</button>
          <a id="downloadBtn" href="${initialUrl}" download="${targetProcess.originalFileName || 'document.png'}" class="btn-action btn-primary" style="text-decoration:none">⬇️ Télécharger PNG</a>
          <button onclick="window.close()" class="btn-action">✕ Fermer</button>
        </div>
      </div>

      ${subTabs.length > 0 ? `
        <div class="sub-tabs-bar">
          <span class="sub-tabs-title">📁 Sous-Processus :</span>
          ${subTabs.map((t, idx) => `
            <button 
              class="tab-btn ${t.code === targetProcess.code ? 'active' : ''}" 
              onclick="switchTab('${t.code}', '${t.name.replace(/'/g, "\\'")}', '${t.url}', '${t.version || 'Rev 3.0'}', '${t.lastUpdated || ''}')"
            >
              <strong>${t.code}</strong> ${t.isParent ? '(Principal)' : `: ${t.name}`}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <div class="viewport-body" id="mainViewport" onwheel="handleWheelZoom(event)">
        <div class="pan-transform-container" id="transformContainer">
          <img id="mainImg" src="${initialUrl}" alt="${targetProcess.name}" class="interactive-img" draggable="false" ondragstart="return false;">
        </div>
      </div>

      <div class="floating-toolbar" id="floatingToolbar">
        <button onclick="changeZoom(-25)">➖</button>
        <input type="range" class="zoom-slider" id="zoomRange" min="30" max="500" value="100" oninput="setZoom(this.value)">
        <span class="zoom-badge" id="zoomBadge">100%</span>
        <button onclick="changeZoom(25)">➕</button>
        <button onclick="resetZoomAndPan()">🔄 Reset</button>
      </div>

      <script>
        let currentZoom = 100;
        let panX = 0;
        let panY = 0;
        let isPointerDown = false;
        let startX = 0;
        let startY = 0;

        const container = document.getElementById('transformContainer');
        const viewport = document.getElementById('mainViewport');
        const img = document.getElementById('mainImg');

        function updateTransform() {
          if (container) {
            container.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + (currentZoom / 100) + ")";
          }
          const badge = document.getElementById('zoomBadge');
          const range = document.getElementById('zoomRange');
          if (badge) badge.innerText = Math.round(currentZoom) + '%';
          if (range) range.value = currentZoom;
        }

        function setZoom(val) {
          currentZoom = Math.min(Math.max(parseInt(val), 30), 500);
          updateTransform();
        }

        function changeZoom(delta) {
          setZoom(currentZoom + delta);
        }

        function resetZoomAndPan() {
          currentZoom = 100;
          panX = 0;
          panY = 0;
          updateTransform();
        }

        function handleWheelZoom(e) {
          e.preventDefault();
          const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
          setZoom(currentZoom * zoomFactor);
        }

        // Pointer Capture Dragging Handlers
        viewport.addEventListener('pointerdown', (e) => {
          if (e.target.closest('.floating-toolbar') || e.target.closest('.top-ribbon') || e.target.closest('.sub-tabs-bar')) return;
          e.preventDefault();
          isPointerDown = true;
          viewport.style.cursor = 'grabbing';
          startX = e.clientX - panX;
          startY = e.clientY - panY;
          try { viewport.setPointerCapture(e.pointerId); } catch(err) {}
        });

        viewport.addEventListener('pointermove', (e) => {
          if (!isPointerDown) return;
          panX = e.clientX - startX;
          panY = e.clientY - startY;
          updateTransform();
        });

        viewport.addEventListener('pointerup', (e) => {
          isPointerDown = false;
          viewport.style.cursor = 'grab';
          try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
        });

        viewport.addEventListener('pointercancel', (e) => {
          isPointerDown = false;
          viewport.style.cursor = 'grab';
          try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
        });

        function switchTab(code, name, url, rev, date) {
          document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
          event.currentTarget.classList.add('active');

          document.getElementById('headerCode').innerText = code;
          document.getElementById('headerName').innerText = name;
          if (rev) document.getElementById('headerRevision').innerText = '🏷️ ' + rev;
          if (date) document.getElementById('headerDate').innerText = '📅 ' + date;
          img.src = url;
          document.getElementById('downloadBtn').href = url;
          resetZoomAndPan();
        }
      </script>
    </body>
    </html>
  `);
}
