import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import PngMapViewer from './components/PngMapViewer';
import ProcessListView from './components/ProcessListView';
import AdminToolbar from './components/AdminToolbar';
import ProcessModal from './components/ProcessModal';
import DocumentViewerModal from './components/DocumentViewerModal';
import FullScreenCleanViewer from './components/FullScreenCleanViewer';
import GitHubConfigModal from './components/GitHubConfigModal';
import Toast from './components/Toast';

import { loadData, saveData } from './utils/storage';
import { INITIAL_PROCESSES, GLOBAL_MAP_PROCESS } from './data/initialProcesses';
import { getGitHubConfig, commitProcessDataToGitHub } from './utils/githubApi';
import './App.css';

export default function App() {
  // Auth State
  const [role, setRole] = useState(() => {
    return sessionStorage.getItem('SMI_USER_ROLE') || null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // View Mode: 'map' (PNG Global Interactions Map Viewer) or 'list' (Tabular Inventory)
  const [viewMode, setViewMode] = useState('map');

  // Data State
  const [processes, setProcesses] = useState([]);
  const [globalMapProcess, setGlobalMapProcess] = useState(GLOBAL_MAP_PROCESS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [editingProcess, setEditingProcess] = useState(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isGitHubConfigOpen, setIsGitHubConfigOpen] = useState(false);

  // Document Viewer Modal
  const [viewingProcess, setViewingProcess] = useState(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  // Hash listener for direct new tab viewing (#doc=P#1.1)
  const [docHash, setDocHash] = useState(() => window.location.hash);

  // Phone & Browser Hardware Back Button Modal Interceptor
  useEffect(() => {
    const isAnyModalOpen = isAuthModalOpen || isProcessModalOpen || isGitHubConfigOpen || isViewerModalOpen;

    if (isAnyModalOpen) {
      window.history.pushState({ smiModalOpen: true }, '');

      const handlePopState = () => {
        setIsAuthModalOpen(false);
        setIsProcessModalOpen(false);
        setIsGitHubConfigOpen(false);
        setIsViewerModalOpen(false);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAuthModalOpen, isProcessModalOpen, isGitHubConfigOpen, isViewerModalOpen]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const openProcessModal = (processToEdit = null) => {
    setEditingProcess(processToEdit);
    setIsProcessModalOpen(true);
  };
  const openGitHubModal = () => setIsGitHubConfigOpen(true);
  const openViewerModal = (processToView) => {
    setViewingProcess(processToView);
    setIsViewerModalOpen(true);
  };

  const closeModal = () => {
    setIsAuthModalOpen(false);
    setIsProcessModalOpen(false);
    setIsGitHubConfigOpen(false);
    setIsViewerModalOpen(false);
    if (window.history.state?.smiModalOpen) {
      window.history.back();
    }
  };

  // Toast Notifications
  const [toast, setToast] = useState(null);

  const isAdmin = role === 'admin';

  // Load initial data on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const data = await loadData();
        let loadedProcesses = data.processes || INITIAL_PROCESSES;

        // Ensure sub-processes (P#1.3.1 on P#1.3 and P#3.1 on P#3) are ALWAYS present
        const mergedProcesses = loadedProcesses.map(lp => {
          const defProc = INITIAL_PROCESSES.find(ip => ip.id === lp.id);
          if (defProc && defProc.subProcesses && defProc.subProcesses.length > 0) {
            if (!lp.subProcesses || lp.subProcesses.length === 0) {
              return { ...lp, subProcesses: defProc.subProcesses };
            }
          }
          return lp;
        });

        setProcesses(mergedProcesses);

        if (data.globalMapProcess) {
          setGlobalMapProcess(data.globalMapProcess);
        }
      } catch (err) {
        console.error("Error loading SMI data:", err);
        setProcesses(INITIAL_PROCESSES);
        setGlobalMapProcess(GLOBAL_MAP_PROCESS);
      } finally {
        setIsLoading(false);
      }
    }
    init();

    // Auto-prompt passcode on first visit if not logged in
    if (!sessionStorage.getItem('SMI_USER_ROLE')) {
      setIsAuthModalOpen(true);
    }
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Auth Handlers
  const handleAuthenticate = (selectedRole) => {
    setRole(selectedRole);
    sessionStorage.setItem('SMI_USER_ROLE', selectedRole);
    if (selectedRole === 'admin') {
      showToast('Accès Administrateur accordé ! Vous pouvez éditer les processus et métadonnées.', 'success');
    } else {
      showToast('Accès Utilisateur activé (Mode consultation).', 'info');
    }
  };

  const handleLogoutAdmin = () => {
    setRole('user');
    sessionStorage.setItem('SMI_USER_ROLE', 'user');
    showToast('Déconnexion Administrateur. Passage en mode Utilisateur (Consultation).', 'info');
  };

  // Open Document Viewer Modal directly on the page
  const handleNodeClick = (process) => {
    openViewerModal(process);
  };

  // Global Map Update
  const handleUpdateGlobalMap = (updatedMap) => {
    setGlobalMapProcess(updatedMap);
    saveData(processes, updatedMap);
  };

  // Process CRUD & GitHub Sync
  const handleSaveProcess = async (updatedProcess) => {
    const updatedList = processes.some(p => p.id === updatedProcess.id)
      ? processes.map(p => p.id === updatedProcess.id ? updatedProcess : p)
      : [...processes, updatedProcess];

    setProcesses(updatedList);
    saveData(updatedList, globalMapProcess);

    const ghConfig = getGitHubConfig();
    if (ghConfig.token) {
      try {
        showToast("Commit des métadonnées sur GitHub...", "info");
        await commitProcessDataToGitHub(updatedList, globalMapProcess, `[Admin] Enregistrement processus ${updatedProcess.code}`);
        showToast(`Processus ${updatedProcess.code} enregistré et publié sur GitHub !`, 'success');
      } catch (err) {
        console.error("GitHub commit error:", err);
        showToast(`Processus ${updatedProcess.code} enregistré en local. (Erreur GitHub: ${err.message})`, 'error');
      }
    } else {
      showToast(`Processus ${updatedProcess.code} enregistré avec succès !`, 'success');
    }
  };

  const handleDeleteProcess = async (processId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce processus ?")) {
      const filtered = processes.filter(p => p.id !== processId);
      setProcesses(filtered);
      saveData(filtered, globalMapProcess);

      const ghConfig = getGitHubConfig();
      if (ghConfig.token) {
        try {
          showToast("Publication de la suppression sur GitHub...", "info");
          await commitProcessDataToGitHub(filtered, globalMapProcess, `[Admin] Suppression processus ${processId}`);
          showToast("Processus supprimé et mis à jour sur GitHub !", 'success');
        } catch (err) {
          showToast(`Processus supprimé en local. (Erreur GitHub: ${err.message})`, 'error');
        }
      } else {
        showToast("Processus supprimé avec succès.", 'info');
      }
    }
  };

  // Save Cartography Data
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await saveData(processes, globalMapProcess);

      const ghConfig = getGitHubConfig();
      if (ghConfig.token) {
        showToast("Publication globale sur le dépôt GitHub en cours...", "info");
        await commitProcessDataToGitHub(processes, globalMapProcess);
        showToast("Toutes les données ont été commitées sur GitHub avec succès ! GitHub Pages va se mettre à jour.", 'success');
      } else {
        showToast("Données du SMI enregistrées localement avec succès !", 'success');
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("Erreur lors de la sauvegarde.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Import / Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ processes, globalMapProcess }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `smi_top_gloves_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Export JSON téléchargé !", 'success');
  };

  const handleImportJSON = async (json) => {
    if (json.processes && Array.isArray(json.processes)) {
      setProcesses(json.processes);
      if (json.globalMapProcess) setGlobalMapProcess(json.globalMapProcess);
      saveData(json.processes, json.globalMapProcess || globalMapProcess);

      const ghConfig = getGitHubConfig();
      if (ghConfig.token) {
        try {
          showToast("Publication du JSON sur GitHub en cours...", "info");
          await commitProcessDataToGitHub(json.processes, json.globalMapProcess || globalMapProcess, "[Admin] Import sauvegarde JSON");
          showToast("Données importées et publiées sur GitHub !", 'success');
        } catch (err) {
          showToast(`Données importées en local. (Erreur GitHub: ${err.message})`, 'error');
        }
      } else {
        showToast("Données importées avec succès !", 'success');
      }
    }
  };

  const handleResetDefault = () => {
    if (window.confirm("Voulez-vous réinitialiser les données vers le modèle standard SMI Top Gloves Latex Industries ?")) {
      setProcesses(INITIAL_PROCESSES);
      setGlobalMapProcess(GLOBAL_MAP_PROCESS);
      saveData(INITIAL_PROCESSES, GLOBAL_MAP_PROCESS);
      showToast("Données réinitialisées aux valeurs par défaut.", 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement des Processus de SMI — Top Gloves Latex Industries...</p>
      </div>
    );
  }

  // Check if opened directly via URL hash in a new tab (#doc=P#1.1)
  if (docHash && docHash.startsWith('#doc=')) {
    const targetCode = decodeURIComponent(docHash.replace('#doc=', ''));
    let matchedItem = null;
    for (const p of processes) {
      if (p.code === targetCode) { matchedItem = p; break; }
      if (p.subProcesses) {
        const sub = p.subProcesses.find(s => s.code === targetCode);
        if (sub) { matchedItem = { ...sub, parentProcess: p }; break; }
      }
    }
    if (matchedItem) {
      return (
        <FullScreenCleanViewer
          processItem={matchedItem}
          allProcesses={processes}
          onClose={() => { window.location.hash = ''; }}
        />
      );
    }
  }

  return (
    <div className="app-layout">
      {/* Header Bar */}
      <Header
        isAdmin={isAdmin}
        onOpenAuth={openAuthModal}
        onLogoutAdmin={handleLogoutAdmin}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSave={handleSaveAll}
        onOpenNewProcessModal={() => openProcessModal(null)}
        isSaving={isSaving}
      />

      {/* Main View Area */}
      <main className="main-content-view">
        {viewMode === 'map' ? (
          <PngMapViewer
            mapProcess={globalMapProcess}
            onUpdateMapProcess={handleUpdateGlobalMap}
            allProcesses={processes}
            isAdmin={isAdmin}
            showToast={showToast}
          />
        ) : (
          <ProcessListView
            processes={processes}
            isAdmin={isAdmin}
            onNodeClick={handleNodeClick}
            onNodeEdit={(p) => openProcessModal(p)}
            onNodeDelete={handleDeleteProcess}
          />
        )}
      </main>

      {/* Admin Floating Quick Toolbar */}
      <AdminToolbar
        isAdmin={isAdmin}
        viewMode={viewMode}
        onAddProcess={() => openProcessModal(null)}
        onOpenGitHubConfig={openGitHubModal}
        onSave={handleSaveAll}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onResetDefault={handleResetDefault}
        isSaving={isSaving}
      />

      {/* Auth Passcode Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeModal}
        onAuthenticate={handleAuthenticate}
      />

      {/* Process Edit / Create Modal */}
      <ProcessModal
        isOpen={isProcessModalOpen}
        onClose={closeModal}
        processData={editingProcess}
        onSaveProcess={handleSaveProcess}
        showToast={showToast}
      />

      {/* GitHub API Configuration Modal */}
      <GitHubConfigModal
        isOpen={isGitHubConfigOpen}
        onClose={closeModal}
        showToast={showToast}
      />

      {/* Document / Media Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        onClose={closeModal}
        processData={viewingProcess}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
