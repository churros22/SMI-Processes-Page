import React from 'react';
import { Image as ImageIcon, Edit3, Trash2, User, Layers, Calendar, Tag, Eye } from 'lucide-react';
import { PROCESS_CATEGORIES } from '../data/initialProcesses';

export default function ProcessListView({
  processes,
  isAdmin,
  onNodeClick,
  onNodeEdit,
  onNodeDelete
}) {
  // Left-click (e.button === 0) -> prevent default link action and open Amazing Modal Viewer on current page.
  // Native Right-click -> browser shows native menu "Ouvrir le lien dans un nouvel onglet".
  // Ctrl+Click / Middle-click -> browser natively opens href target in new tab.
  const handleOpenClick = (e, processItem) => {
    // If left click without modifier keys (Ctrl/Cmd/Shift/Alt), open in Modal Viewer on current page
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      onNodeClick(processItem);
    }
  };

  return (
    <div className="list-view-container">
      <div className="list-header-bar">
        <h2>Tableau des Processus SMI ({processes.length})</h2>
        <p>Cliquez sur un processus pour le consulter.</p>
      </div>

      <div className="process-table-wrapper">
        <table className="process-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Intitulé du Processus / Sous-Processus</th>
              <th>Catégorie</th>
              <th>Pilote</th>
              <th>Révision</th>
              <th>Modifié le</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  Aucun processus enregistré.
                </td>
              </tr>
            ) : (
              processes.map((p) => {
                const catInfo = PROCESS_CATEGORIES[p.category] || {};
                const subProcesses = p.subProcesses || [];
                const docHref = `#doc=${encodeURIComponent(p.code)}`;

                return (
                  <React.Fragment key={p.id}>
                    {/* PARENT PROCESS ROW */}
                    <tr 
                      className="process-row parent-process-row clickable-row"
                      onClick={(e) => {
                        if (!e.target.closest('.table-actions')) {
                          onNodeClick(p);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="table-code-badge" style={{ backgroundColor: catInfo.color || '#003B7A' }}>
                          {p.code}
                        </span>
                      </td>
                      <td className="table-name-cell">
                        <strong style={{ color: '#0F172A' }}>{p.name}</strong>
                        {p.description && <p className="table-desc">{p.description}</p>}
                        {subProcesses.length > 0 && (
                          <span className="sub-count-tag">
                            <Layers size={12} /> {subProcesses.length} sous-processus rattaché(s)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`table-cat-tag cat-${p.category.toLowerCase()}`}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div className="pilote-info">
                          <User size={14} />
                          <span>{p.pilote}</span>
                        </div>
                      </td>
                      <td>
                        <span className="version-pill"><Tag size={12} /> {p.version || 'Rev 3.0'}</span>
                      </td>
                      <td>
                        <span className="date-pill"><Calendar size={12} /> {p.lastUpdated || '11/08/2026'}</span>
                      </td>
                      <td>
                        {p.url ? (
                          <span className="html-status-available" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 700 }}>
                            <ImageIcon size={15} /> Document HD
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                            Non téléversé
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <a
                            href={docHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-open-html"
                            onClick={(e) => handleOpenClick(e, p)}
                            title="Clic gauche: Visionneuse Modal HD | Clic droit: Ouvrir dans un nouvel onglet"
                          >
                            <Eye size={14} />
                            <span>Ouvrir</span>
                          </a>

                          {isAdmin && (
                            <>
                              <button
                                className="btn-icon-action edit"
                                onClick={(e) => { e.stopPropagation(); onNodeEdit(p); }}
                                title="Éditer le processus et ses sous-processus"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                className="btn-icon-action delete"
                                onClick={(e) => { e.stopPropagation(); onNodeDelete(p.id); }}
                                title="Supprimer le processus"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* SUB-PROCESSES ROWS INDENTED */}
                    {subProcesses.map((sub, idx) => {
                      const subHref = `#doc=${encodeURIComponent(sub.code)}`;
                      return (
                        <tr 
                          key={sub.id || idx} 
                          className="process-row sub-process-row clickable-row"
                          onClick={(e) => {
                            if (!e.target.closest('.table-actions')) {
                              onNodeClick(sub);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ paddingLeft: '28px' }}>
                            <span className="table-code-badge sub-code-badge">
                              ↳ {sub.code}
                            </span>
                          </td>
                          <td className="table-name-cell" style={{ paddingLeft: '20px' }}>
                            <strong style={{ color: '#0284C7' }}>{sub.name}</strong>
                            {sub.description && <p className="table-desc">{sub.description}</p>}
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Sous-processus de {p.code}</span>
                          </td>
                          <td>
                            <span className="table-cat-tag cat-support" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                              Sous-Processus
                            </span>
                          </td>
                          <td>
                            <div className="pilote-info">
                              <User size={13} />
                              <span>{sub.pilote || p.pilote}</span>
                            </div>
                          </td>
                          <td>
                            <span className="version-pill"><Tag size={11} /> {sub.version || p.version || 'Rev 2.0'}</span>
                          </td>
                          <td>
                            <span className="date-pill"><Calendar size={11} /> {sub.lastUpdated || p.lastUpdated || '11/08/2026'}</span>
                          </td>
                          <td>
                            {sub.url ? (
                              <span className="html-status-available" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 700 }}>
                                <ImageIcon size={14} /> Document HD
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                Non téléversé
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions">
                              <a
                                href={subHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-open-html"
                                style={{ background: '#0284C7' }}
                                onClick={(e) => handleOpenClick(e, sub)}
                                title="Clic gauche: Visionneuse Modal HD | Clic droit: Ouvrir dans un nouvel onglet"
                              >
                                <Eye size={13} />
                                <span>Ouvrir</span>
                              </a>

                              {isAdmin && (
                                <button
                                  className="btn-icon-action edit"
                                  onClick={(e) => { e.stopPropagation(); onNodeEdit(p); }}
                                  title="Gérer ce sous-processus via le parent"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
