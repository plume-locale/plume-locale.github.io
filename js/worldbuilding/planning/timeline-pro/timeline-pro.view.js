/**
 * @class TimelineProView
 * @description Moteur de rendu canvas pour la chronologie avancée, inspiré de time.graphics.
 */
class TimelineProView {

    // ─── Constants ───────────────────────────────────────────────────────────
    static RULER_H     = 52;   // Hauteur de la règle temporelle
    static HEADER_W    = 200;  // Largeur des en-têtes de piste
    static MINIMAP_H   = 46;   // Hauteur de la minimap
    static ROW_H       = 50;   // Hauteur d'une SOUS-LIGNE d'événement
    static MIN_TRACK_H = 60;   // Hauteur minimale d'une piste (1 sous-ligne)
    static get TRACK_H()  { return this.MIN_TRACK_H; } // legacy alias
    static GUARD       = 6;    // Marge intérieure des eventi

    // ─── State ────────────────────────────────────────────────────────────────
    static state = {
        canvas: null, ctx: null,
        zoom: 0.05,           // px / unité de temps
        offsetX: 0,           // décalage horizontal en px
        scrollY: 0,           // décalage vertical pour pistes (px)
        width: 0, height: 0,
        // Interaction
        isDragging: false,
        dragMode: null,
        lastMouseX: 0, lastMouseY: 0,
        dragEventId: null, dragEventOffsetX: 0,
        dragTargetTrackIdx: null,
        // État UI
        hoveredId: null, 
        selectedId: null,      // ID de l'événement principal (pour le panneau)
        selectedIds: [],       // Liste de tous les événements sélectionnés
        hoveredResizeId: null, 
        // Ghost création
        ghostT: null,          // Temps (world) sous la souris pour preview
        ghostTrackId: null,    // Piste sous la souris
        // Marquee selection
        marqueeStart: null,    // {lx, ly} local
        marqueeEnd: null,      // {lx, ly} local
        // Drag-and-drop link
        dragLinkFromId: null,  // ID source pour création de lien par drag
        // Liaisons Bézier
        linkMode: false,
        linkFromId: null,
        hoveredLinkId: null,
        selectedLinkId: null,
        mouseX: 0, mouseY: 0,
        dateMode: 'numeric',
        ro: null,
        filterText: '',
        expandedTrackIds: [], // Track which tracks are expanded in the UI
    };

    // ─── Couleur sémantique des liaisons ───────────────────────────────────────────────
    static LINK_TYPE_META = {
        causal:      { get label() { return Localization.t('timeline.pro.link.causal'); },    color: '#e67e22', icon: '⚡' },
        temporal:    { get label() { return Localization.t('timeline.pro.link.temporal'); },  color: '#3498db', icon: '⧐'  },
        triggers:    { get label() { return Localization.t('timeline.pro.link.triggers'); },  color: '#e74c3c', icon: '▶' },
        parallel:    { get label() { return Localization.t('timeline.pro.link.parallel'); },  color: '#9b59b6', icon: '∥'  },
        contradicts: { get label() { return Localization.t('timeline.pro.link.contradicts'); }, color: '#c0392b', icon: '✘'  },
        custom:      { get label() { return Localization.t('timeline.pro.link.custom'); },    color: '#d4af37', icon: '○'  },
    };

    /** Retourne la couleur effective d'un lien (couleur custom ou couleur du type) */
    static _linkColor(lnk) {
        if (lnk.color) return lnk.color;  // couleur custom définie manuellement
        return (this.LINK_TYPE_META[lnk.type] || this.LINK_TYPE_META.custom).color;
    }

    // ─── POINT D'ENTRÉE ───────────────────────────────────────────────────────
    static renderMainView(containerId = 'editorView') {
        const host = document.getElementById(containerId);
        if (!host) return;

        // Reset state proprement
        this.state.selectedId    = null;
        this.state.hoveredId     = null;
        this.state.linkMode      = false;
        this.state.linkFromId    = null;
        this.state.hoveredLinkId = null;
        this.state.selectedLinkId= null;
        this.state.filterText    = '';
        this.state.filterText    = '';
        this._hideTooltip();
        if (this.state.ro) { this.state.ro.disconnect(); this.state.ro = null; }
        window.removeEventListener('mousemove',  this._onMouseMove);
        window.removeEventListener('mouseup',    this._onMouseUp);
        window.removeEventListener('keydown',    this._onKeyDown);

        host.innerHTML = `
<div id="tlp-shell" style="
    display:flex; flex-direction:column; height:100%; overflow:hidden;
    background:var(--bg-primary); font-family:'Inter',system-ui,sans-serif; position:relative;">

  <!-- ── Toolbar ── -->
  <div id="tlp-toolbar" style="
      display:flex; align-items:center; gap:.5rem; padding:.6rem 1rem;
      background:var(--bg-card); border-bottom:1px solid var(--border-color);
      flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,.06);">

    <button id="tlp-add" class="btn btn-primary" style="gap:.4rem;display:flex;align-items:center;padding:.45rem .9rem;font-size:.85rem;border-radius:6px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${Localization.t('timeline.pro.btn.add')}
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-track-manage" class="btn" title="${Localization.t('timeline.pro.panel.tracks_title')}" style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      ${Localization.t('timeline.pro.btn.tracks')}
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-zoom-in"  class="btn" title="${Localization.t('timeline.pro.btn.zoom_in')}" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="16.5" y1="16.5" x2="22" y2="22"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button id="tlp-zoom-out" class="btn" title="${Localization.t('timeline.pro.btn.zoom_out')}" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="16.5" y1="16.5" x2="22" y2="22"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button id="tlp-fit"      class="btn" title="${Localization.t('timeline.pro.btn.fit')}" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-date-toggle" class="btn" title="${Localization.t('timeline.pro.btn.date_toggle')}"
            style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span id="tlp-date-label">${this.state.dateMode === 'calendar' ? Localization.t('timeline.pro.label.calendar') : Localization.t('timeline.pro.label.numeric')}</span>
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-link-mode" class="btn" title="${Localization.t('timeline.pro.btn.link_mode_title')}"
            style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;transition:background .15s,color .15s;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      ${Localization.t('timeline.pro.btn.link_mode')}
    </button>

    <div style="flex:1;"></div>

    <!-- ── Filtre recherche ── -->
    <div style="position:relative;display:flex;align-items:center;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           style="position:absolute;left:.55rem;color:var(--text-muted);pointer-events:none;">
        <circle cx="11" cy="11" r="8"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
      </svg>
      <input id="tlp-filter" type="text" placeholder="${Localization.t('timeline.pro.filter.placeholder')}" autocomplete="off"
             style="padding:.4rem .4rem .4rem 1.8rem;border:1px solid var(--border-color);
                    border-radius:6px;background:var(--bg-secondary);color:var(--text-primary);
                    font-size:.8rem;width:140px;outline:none;transition:border-color .15s,width .2s;"
             onfocus="this.style.width='200px'" onblur="this.style.width='140px'">
      <button id="tlp-filter-clear" title="${Localization.t('timeline.pro.filter.clear')}" style="
          position:absolute;right:.3rem;background:none;border:none;cursor:pointer;
          color:var(--text-muted);font-size:.9rem;line-height:1;padding:.1rem;display:none;">×</button>
    </div>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <div id="tlp-hint" style="font-size:.75rem;color:var(--text-muted);opacity:.7;margin-left:.5rem;">
      ${Localization.t('timeline.pro.hint.main')}
    </div>
  </div>

  <!-- ── Zone canvas + panel ── -->
  <div style="flex:1;display:flex;overflow:hidden;position:relative;">

    <!-- Canvas -->
    <div id="tlp-canvas-wrap" style="flex:1;overflow:hidden;position:relative;">
      <canvas id="tlp-canvas" style="display:block;touch-action:none;"></canvas>
    </div>

    <!-- Panneau d'édition -->
    <div id="tlp-panel" style="
        width:340px; flex-shrink:0; background:var(--bg-card);
        border-left:1px solid var(--border-color); overflow-y:auto;
        display:none; flex-direction:column;
        box-shadow:-4px 0 20px rgba(0,0,0,.07);">
    </div>

  </div>

  <!-- ── Tooltip de survol ── -->
  <div id="tlp-tooltip" style="
      position:fixed; z-index:99998; pointer-events:none;
      display:none; max-width:420px; min-width:200px;
      background:var(--bg-card,#fff);
      border:1px solid var(--border-color,#e0e0e0);
      border-radius:12px;
      box-shadow:0 12px 40px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
      padding:0;
      overflow:hidden;
      font-family:'Inter',system-ui,sans-serif;
      animation:tlpTipIn .15s ease;
  "></div>
</div>`;

        // Injecter les styles tooltip une seule fois
        if (!document.getElementById('tlp-tooltip-style')) {
            const s = document.createElement('style');
            s.id = 'tlp-tooltip-style';
            s.textContent = `
                @keyframes tlpTipIn {
                    from { opacity:0; transform: translateY(6px) scale(.97); }
                    to   { opacity:1; transform: none; }
                }
                #tlp-tooltip .tlp-tip-header {
                    display:flex; align-items:center; gap:.6rem;
                    padding:.75rem 1rem .6rem;
                    border-bottom:1px solid var(--border-color,#e8e8e8);
                }
                #tlp-tooltip .tlp-tip-color-dot {
                    width:10px; height:10px; border-radius:50%; flex-shrink:0;
                }
                #tlp-tooltip .tlp-tip-title {
                    font-size:.9rem; font-weight:700;
                    color:var(--text-primary,#1a1a1a);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                    max-width:260px;
                }
                #tlp-tooltip .tlp-tip-body {
                    padding:.65rem 1rem .75rem;
                    display:flex; flex-direction:column; gap:.45rem;
                }
                #tlp-tooltip .tlp-tip-dates {
                    display:flex; align-items:center; gap:.4rem;
                    font-size:.78rem; color:var(--text-muted,#888);
                    font-weight:500;
                }
                #tlp-tooltip .tlp-tip-dates svg {
                    opacity:.55; flex-shrink:0;
                }
                #tlp-tooltip .tlp-tip-desc {
                    font-size:.82rem; color:var(--text-secondary,#555);
                    line-height:1.6;
                    white-space:pre-wrap; word-break:break-word;
                }
                #tlp-tooltip .tlp-tip-tags {
                    display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.15rem;
                }
                #tlp-tooltip .tlp-tip-tag {
                    font-size:.72rem; font-weight:600; border-radius:20px;
                    padding:.18em .65em;
                    background:var(--bg-secondary,#f0f0f0);
                    color:var(--text-muted,#666);
                }
                #tlp-tooltip .tlp-tip-hint {
                    font-size:.72rem; color:var(--text-muted,#aaa);
                    text-align:center; padding:.3rem 1rem .6rem;
                    font-style:italic;
                }
            `;
            document.head.appendChild(s);
        }

        requestAnimationFrame(() => {
            this._initCanvas();
            this._bindAll();
            this._fitView();
            this.draw();
        });
    }

    // ─── INIT CANVAS ─────────────────────────────────────────────────────────
    static _initCanvas() {
        const wrap   = document.getElementById('tlp-canvas-wrap');
        const canvas = document.getElementById('tlp-canvas');
        if (!wrap || !canvas) return;

        this.state.canvas = canvas;
        this.state.ctx    = canvas.getContext('2d');

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const r   = wrap.getBoundingClientRect();
            this.state.width  = r.width;
            this.state.height = r.height;
            canvas.width  = r.width  * dpr;
            canvas.height = r.height * dpr;
            canvas.style.width  = r.width  + 'px';
            canvas.style.height = r.height + 'px';
            this.state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.draw();
        };

        this.state.ro = new ResizeObserver(resize);
        this.state.ro.observe(wrap);
        resize();
    }

    // ─── FIT VIEW ─────────────────────────────────────────────────────────────
    static _fitView() {
        const events = TimelineProRepository.getAll();
        const W = this.state.width - this.HEADER_W;
        if (!W || W <= 0) return;

        if (events.length === 0) {
            this.state.zoom    = 0.05;
            this.state.offsetX = this.HEADER_W + W * 0.1;
            return;
        }
        const minT = Math.min(...events.map(e => e.startDate));
        const maxT = Math.max(...events.map(e => e.endDate ?? e.startDate));
        const span = (maxT - minT) || 1000;
        const pad  = span * 0.15;

        this.state.zoom    = W / (span + 2 * pad);
        this.state.offsetX = this.HEADER_W - (minT - pad) * this.state.zoom;
        this.state.scrollY = 0;
    }

    // ─── BIND EVENTS ─────────────────────────────────────────────────────────
    static _bindAll() {
        const canvas = this.state.canvas;
        if (!canvas) return;

        // Bind handlers as stable references
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseUp   = this._handleMouseUp.bind(this);
        this._onKeyDown   = this._handleKeyDown.bind(this);

        canvas.addEventListener('mousedown',  e => this._handleMouseDown(e));
        canvas.addEventListener('dblclick',   e => this._handleDblClick(e));
        canvas.addEventListener('mousemove',  e => this._handleMouseMoveCanvas(e));
        canvas.addEventListener('mouseleave', () => { this.state.hoveredId = null; this.state.hoveredLinkId = null; this._hideTooltip(); this.draw(); });
        canvas.addEventListener('wheel',      e => this._handleWheel(e), { passive: false });
        window.addEventListener('mousemove',  this._onMouseMove);
        window.addEventListener('mouseup',    this._onMouseUp);
        window.addEventListener('keydown',    this._onKeyDown);

        // Toolbar
        document.getElementById('tlp-add')?.addEventListener('click', () => TimelineProViewModel.addEvent());
        document.getElementById('tlp-track-manage')?.addEventListener('click', () => TimelineProViewModel.openTracksPanel());
        document.getElementById('tlp-zoom-in')?.addEventListener('click',  () => this._zoomAt(1.5));
        document.getElementById('tlp-zoom-out')?.addEventListener('click', () => this._zoomAt(1 / 1.5));
        document.getElementById('tlp-fit')?.addEventListener('click',      () => { this._fitView(); this.draw(); });
        document.getElementById('tlp-date-toggle')?.addEventListener('click', () => {
            this.state.dateMode = this.state.dateMode === 'calendar' ? 'numeric' : 'calendar';
            const lbl = document.getElementById('tlp-date-label');
            if (lbl) lbl.textContent = this.state.dateMode === 'calendar' ? Localization.t('timeline.pro.label.calendar') : Localization.t('timeline.pro.label.numeric');
            if (this.state.selectedId) TimelineProViewModel.openPanel(this.state.selectedId);
            this.draw();
        });

        // Bouton mode liaison
        const linkBtn = document.getElementById('tlp-link-mode');
        linkBtn?.addEventListener('click', () => this._toggleLinkMode());

        // Filtre recherche
        const filterInput = document.getElementById('tlp-filter');
        const filterClear = document.getElementById('tlp-filter-clear');
        filterInput?.addEventListener('input', () => {
            this.state.filterText = filterInput.value.trim().toLowerCase();
            if (filterClear) filterClear.style.display = this.state.filterText ? 'block' : 'none';
            this.draw();
        });
        filterClear?.addEventListener('click', () => {
            filterInput.value = '';
            this.state.filterText = '';
            filterClear.style.display = 'none';
            this.draw();
        });

        // Context menu sur clic droit dans les en-têtes
        this.state.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            const { lx, ly } = this._local(e);
            if (lx > this.HEADER_W || ly < this.RULER_H) return;
            
            const tIdx = this._getTrackIdxAtY(ly);
            const track = TimelineProRepository.getTracks().filter(t => !t.isHidden)[tIdx];
            if (track) this._showTrackContextMenu(e.clientX, e.clientY, track);
        });
    }

    // ─── KEYBOARD ─────────────────────────────────────────────────────────────
    static _handleKeyDown(e) {
        // Ignorer si l'utilisateur tape dans un champ de saisie
        const active = document.activeElement;
        const tag = active?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                if (e.shiftKey) this._redo(); else this._undo();
            } else if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                this._redo();
            }
        }

        // Supprimer l'élément sélectionné avec Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.state.selectedId) {
                TimelineProViewModel.deleteEvent(this.state.selectedId);
            } else if (this.state.selectedLinkId) {
                TimelineProViewModel.deleteLink(this.state.selectedLinkId);
            }
        }

        // Escape : désélectionner / quitter modes
        if (e.key === 'Escape') {
            if (this.state.linkMode) this._toggleLinkMode();
            this._selectEvent(null);
            this.state.selectedLinkId = null;
            TimelineProViewModel.closePanel();
            this.draw();
        }
    }

    // ─── MOUSE DOWN ──────────────────────────────────────────────────────────
    static _handleMouseDown(e) {
        this._hideTooltip();
        const { lx, ly } = this._local(e);

        // ── Interaction Minimap ──
        if (lx >= this.HEADER_W && ly >= this.state.height - this.MINIMAP_H) {
            this.state.isDragging = true;
            this.state.dragMode   = 'minimap';
            this._scrubMinimap(lx);
            this.draw();
            e.preventDefault();
            return;
        }

        // Shortcut Shift+Clic sur un événement → activer le mode liaison direct
        if (e.shiftKey) {
            const hit = this._hitTest(lx, ly);
            if (hit && !this.state.linkMode) {
                this._toggleLinkMode();
                this.state.linkFromId = hit.id;
                this._updateLinkHint(Localization.t('timeline.pro.hint.link_target'));
                this.draw();
                e.preventDefault();
                return;
            }
        }

        // ── Mode liaison : tout clic est intercepté ──
        if (this.state.linkMode) {
            const hit = this._hitTest(lx, ly);
            if (hit) {
                if (!this.state.linkFromId) {
                    this.state.linkFromId = hit.id;
                    this._updateLinkHint(Localization.t('timeline.pro.hint.link_target'));
                } else if (hit.id !== this.state.linkFromId) {
                    TimelineProViewModel.createLink(this.state.linkFromId, hit.id);
                    this.state.linkFromId = null;
                    this._toggleLinkMode();
                }
            } else {
                this.state.linkFromId = null;
                this._updateLinkHint(Localization.t('timeline.pro.hint.link_source'));
                this.draw();
            }
            e.preventDefault();
            return;
        }

        // Clic dans l'en-tête de piste → ne rien faire
        if (lx <= this.HEADER_W && ly >= this.RULER_H) return;

        // ── Quick Link Handle (drag point) ──
        const linkHandleHit = this._hitTestLinkHandle(lx, ly);
        if (linkHandleHit) {
            this.state.isDragging     = true;
            this.state.dragMode       = 'create-link';
            this.state.dragLinkFromId = linkHandleHit.id;
            this.state.mouseX         = lx;
            this.state.mouseY         = ly;
            e.preventDefault();
            return;
        }

        // ── Resize handle (bord droit d'une barre) ? ──
        const resizeHit = this._hitTestResize(lx, ly);
        if (resizeHit) {
            this.state.isDragging  = true;
            this.state.lastMouseX  = e.clientX;
            this.state.dragMode    = 'resize';
            this.state.dragEventId = resizeHit.id;
            this._selectEvent(resizeHit.id);
            this.state.selectedLinkId = null;
            e.preventDefault();
            return;
        }

        // ── Clic sur un événement ? → drag event-track ──
        const hit = this._hitTest(lx, ly);
        if (hit) {
            const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;
            
            // Si l'élément n'est pas déjà dans la sélection, on met à jour la sélection
            // sauf si on veut juste draguer la sélection actuelle
            if (!this.state.selectedIds.includes(hit.id) || isMultiKey) {
                this._selectEvent(hit.id, isMultiKey);
            }

            const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
            const tIdx   = tracks.findIndex(t => t.id === hit.trackId);
            this.state.isDragging        = true;
            this.state.lastMouseX        = e.clientX;
            this.state.lastMouseY        = e.clientY;
            this.state.dragMode          = 'event-track';
            this.state.dragEventId       = hit.id;
            this.state.dragEventOffsetX  = lx - this._worldToScreen(hit.startDate);
            this.state.dragTargetTrackIdx = tIdx;
            this.state.selectedId        = hit.id; // On s'assure que celui cliqué est le "primaire"
            this.state.selectedLinkId    = null;
            e.preventDefault();
            return;
        }

        // ── Clic sur un lien ? ──
        const linkHit = this._hitTestLink(lx, ly);
        if (linkHit) {
            this.state.selectedLinkId = linkHit.id;
            this.state.selectedId     = null;
            TimelineProViewModel.closePanel();
            TimelineProViewModel.openLinkPanel(linkHit.id);
            this.draw();
            e.preventDefault();
            return;
        }

        // Clic dans le vide -> Pan OU Marquee
        this.state.isDragging   = true;
        this.state.lastMouseX   = e.clientX;
        this.state.lastMouseY   = e.clientY;
        
        if (lx > this.HEADER_W && (e.ctrlKey || e.metaKey)) {
            // Ctrl/Cmd + Drag = Marquee Selection
            this.state.dragMode     = 'marquee';
            this.state.marqueeStart = { lx, ly };
            this.state.marqueeEnd   = { lx, ly };
        } else {
            this.state.dragMode     = 'pan';
            if (lx > this.HEADER_W) {
                this._selectEvent(null);
                this.state.selectedLinkId = null;
                TimelineProViewModel.closePanel();
                this.draw();
            }
        }
        e.preventDefault();
    }

    // ─── MOUSE DBL-CLICK ─────────────────────────────────────────────────────
    static _handleDblClick(e) {
        const { lx, ly } = this._local(e);
        if (lx <= this.HEADER_W) return;

        const trackIdx = this._getTrackIdxAtY(ly);
        const tracks   = TimelineProRepository.getTracks().filter(t => !t.isHidden);
        if (trackIdx < 0 || trackIdx >= tracks.length) return;

        const worldT = this._screenToWorld(lx);
        TimelineProViewModel.addEventAt(Math.round(worldT), tracks[trackIdx].id);
    }

    // ─── MOUSE MOVE CANVAS (hover) ────────────────────────────────────────────
    static _handleMouseMoveCanvas(e) {
        if (this.state.isDragging) return;
        const { lx, ly } = this._local(e);
        this.state.mouseX = lx;
        this.state.mouseY = ly;

        // Survol Minimap
        if (lx >= this.HEADER_W && ly >= this.state.height - this.MINIMAP_H) {
            this.state.canvas.style.cursor = 'grab';
            this.state.hoveredId = null;
            this.state.hoveredLinkId = null;
            this._hideTooltip();
            this.draw();
            return;
        }

        // Curseur en mode liaison
        if (this.state.linkMode) {
            const hit = this._hitTest(lx, ly);
            const newHover = hit ? hit.id : null;
            if (newHover !== this.state.hoveredId) {
                this.state.hoveredId = newHover;
                this.state.canvas.style.cursor = 'crosshair';
                this.draw();
            } else if (this.state.linkFromId) {
                this.draw();
            }
            return;
        }

        // ── Hover handle de resize ──
        const resizeHit = this._hitTestResize(lx, ly);
        const newResizeHover = resizeHit ? resizeHit.id : null;
        if (newResizeHover !== this.state.hoveredResizeId) {
            this.state.hoveredResizeId = newResizeHover;
            this.draw();
        }
        if (resizeHit) {
            this.state.canvas.style.cursor = 'ew-resize';
            this._hideTooltip();
            return;
        }

        const hit = this._hitTest(lx, ly);
        const newHover = hit ? hit.id : null;
        if (newHover !== this.state.hoveredId) {
            this.state.hoveredId = newHover;
            this.state.canvas.style.cursor = hit ? 'grab' : 'default';
            this.draw();
        }

        // Hover sur les liens
        const linkHit = !hit ? this._hitTestLink(lx, ly) : null;
        const newLinkHover = linkHit ? linkHit.id : null;
        if (newLinkHover !== this.state.hoveredLinkId) {
            this.state.hoveredLinkId = newLinkHover;
            if (linkHit) this.state.canvas.style.cursor = 'pointer';
            this.draw();
        }

        if (hit) {
            this._showTooltip(hit, e.clientX, e.clientY);
            this.state.ghostT = null;
            this.state.ghostTrackId = null;
        } else {
            this._hideTooltip();
            // ── Ghost Cursor logic ──
            const tIdx = this._getTrackIdxAtY(ly);
            const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
            if (tIdx >= 0 && tIdx < tracks.length && lx > this.HEADER_W) {
                this.state.ghostT = this._screenToWorld(lx);
                this.state.ghostTrackId = tracks[tIdx].id;
            } else {
                this.state.ghostT = null;
                this.state.ghostTrackId = null;
            }
        }
        this.draw();
    }

    // ─── MOUSE MOVE WINDOW (drag) ─────────────────────────────────────────────
    static _handleMouseMove(e) {
        if (!this.state.isDragging) return;
        const dx = e.clientX - this.state.lastMouseX;
        const dy = e.clientY - this.state.lastMouseY;
        this.state.lastMouseX = e.clientX;
        this.state.lastMouseY = e.clientY;

        if (this.state.dragMode === 'minimap') {
            const { lx } = this._local(e);
            this._scrubMinimap(lx);
            this.draw();
        } else if (this.state.dragMode === 'pan') {
            this.state.offsetX  += dx;
            this.state.scrollY  -= dy;
            this.state.scrollY   = Math.max(0, this.state.scrollY);

        } else if (this.state.dragMode === 'marquee') {
            const { lx, ly }    = this._local(e);
            this.state.marqueeEnd = { lx, ly };

        } else if (this.state.dragMode === 'create-link') {
            const { lx, ly }    = this._local(e);
            this.state.mouseX   = lx;
            this.state.mouseY   = ly;
            // Hover sur cible potentielle
            const hit = this._hitTest(lx, ly);
            this.state.hoveredId = hit ? hit.id : null;

        } else if (this.state.dragMode === 'resize' && this.state.dragEventId) {
            // (existing resize logic)
            const ev = TimelineProRepository.getById(this.state.dragEventId);
            if (ev && !ev.isLocked) {
                const canvasLeft = this.state.canvas.getBoundingClientRect().left;
                const cursorX    = e.clientX - canvasLeft;
                const newEnd     = Math.round(this._screenToWorld(cursorX));
                if (newEnd > ev.startDate) {
                    ev.endDate = newEnd;
                    TimelineProRepository.save(ev);
                }
            }
        } else if (this.state.dragMode === 'event-track' && this.state.dragEventId) {
            // (existing drag logic)
            const ev = TimelineProRepository.getById(this.state.dragEventId);
            if (ev && !ev.isLocked) {
                const canvasLeft = this.state.canvas.getBoundingClientRect().left;
                const cursorX    = e.clientX - canvasLeft;
                const newStart   = Math.round(this._screenToWorld(cursorX - this.state.dragEventOffsetX));
                const delta      = newStart - ev.startDate;
                
                // Si plusieurs sélectionnés, déplacer tout le groupe
                if (this.state.selectedIds.length > 1 && this.state.selectedIds.includes(ev.id)) {
                    this.state.selectedIds.forEach(id => {
                        const target = TimelineProRepository.getById(id);
                        if (target && !target.isLocked) {
                            target.startDate += delta;
                            if (target.endDate != null) target.endDate += delta;
                            TimelineProRepository.save(target);
                        }
                    });
                } else {
                    ev.startDate = newStart;
                    if (ev.endDate != null) ev.endDate += delta;
                    TimelineProRepository.save(ev);
                }

                const canvasTop  = this.state.canvas.getBoundingClientRect().top;
                const cursorY    = e.clientY - canvasTop;
                const tracks     = TimelineProRepository.getTracks().filter(t => !t.isHidden);
                const rawIdx     = this._getTrackIdxAtY(cursorY);
                const tIdx       = Math.max(0, Math.min(tracks.length - 1, rawIdx));
                this.state.dragTargetTrackIdx = tIdx;
            }
        }
        this.draw();
    }

    // ─── MOUSE UP ─────────────────────────────────────────────────────────────
    static _handleMouseUp(e) {
        if (this.state.dragMode === 'event-track' && this.state.dragEventId) {
            const ev = TimelineProRepository.getById(this.state.dragEventId);
            if (ev && !ev.isLocked) {
                const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
                const tIdx   = this.state.dragTargetTrackIdx ?? 0;
                const target = tracks[tIdx];
                if (target && target.id !== ev.trackId) {
                    const oldTrackId = ev.trackId;
                    if (this.state.selectedIds.length > 1 && this.state.selectedIds.includes(ev.id)) {
                        this.state.selectedIds.forEach(id => {
                            const tEv = TimelineProRepository.getById(id);
                            if (tEv && !tEv.isLocked && tEv.trackId === oldTrackId) {
                                tEv.trackId = target.id;
                                TimelineProRepository.save(tEv);
                            }
                        });
                    } else {
                        ev.trackId = target.id;
                        TimelineProRepository.save(ev);
                    }
                    if (this.state.selectedId === ev.id) TimelineProViewModel.openPanel(ev.id);
                }
            }
            if (typeof saveProject === 'function') saveProject();

        } else if (this.state.dragMode === 'marquee') {
            this._finalizeMarquee();

        } else if (this.state.dragMode === 'create-link') {
            const { lx, ly } = this._local(e);
            const target = this._hitTest(lx, ly);
            if (target && target.id !== this.state.dragLinkFromId) {
                TimelineProViewModel.createLink(this.state.dragLinkFromId, target.id);
            }
            this.state.dragLinkFromId = null;

        } else if (this.state.dragMode === 'resize') {
            if (typeof saveProject === 'function') saveProject();
        }
        this.state.isDragging        = false;
        this.state.dragMode          = null;
        this.state.dragTargetTrackIdx = null;
        this.state.marqueeStart      = null;
        this.state.marqueeEnd        = null;
        this.draw();
    }

    // ─── WHEEL ───────────────────────────────────────────────────────────────
    static _handleWheel(e) {
        e.preventDefault();
        const { lx } = this._local(e);
        const worldBefore = this._screenToWorld(lx);
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        this.state.zoom = Math.max(1e-6, Math.min(1e4, this.state.zoom * factor));
        this.state.offsetX = lx - worldBefore * this.state.zoom;
        this.draw();
    }

    // ─── SELECT EVENT ─────────────────────────────────────────────────────────
    static _selectEvent(id, isMulti = false) {
        if (isMulti) {
            if (id) {
                if (this.state.selectedIds.includes(id)) {
                    this.state.selectedIds = this.state.selectedIds.filter(x => x !== id);
                } else {
                    this.state.selectedIds.push(id);
                }
            }
        } else {
            this.state.selectedIds = id ? [id] : [];
        }

        // Le dernier ID dans la liste devient la sélection "primaire" pour le panneau
        this.state.selectedId = this.state.selectedIds[this.state.selectedIds.length - 1] || null;

        if (this.state.selectedId) TimelineProViewModel.openPanel(this.state.selectedId);
        else                      TimelineProViewModel.closePanel();
        this.draw();
    }

    // ─── COORDINATE HELPERS ───────────────────────────────────────────────────
    static _local(e) {
        const r  = this.state.canvas.getBoundingClientRect();
        return { lx: e.clientX - r.left, ly: e.clientY - r.top };
    }
    static _worldToScreen(t) { return t * this.state.zoom + this.state.offsetX; }
    static _screenToWorld(x) { return (x - this.state.offsetX) / this.state.zoom; }

    /** Renvoie l'index de la piste visible à la position Y-écran demandée */
    static _getTrackIdxAtY(ly) {
        if (ly < this.RULER_H) return -1;
        const layout = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);
        const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
        
        for (let i = 0; i < tracks.length; i++) {
            const m = metrics.get(tracks[i].id);
            if (m && ly >= m.y && ly < m.y + m.h) return i;
        }
        return tracks.length - 1; // Fallback à la dernière si dépassement bas
    }

    /**
     * Zoom centré sur :
     *  - la position de l'événement sélectionné (s'il y en a un)
     *  - sinon le centre horizontal du canvas
     * Conserve ainsi la position à l'écran de l'élément d'intérêt.
     */
    static _zoomAt(factor) {
        // Trouver le point pivot en coordonnées écran
        let pivotScreen;
        const sel = this.state.selectedId
            ? TimelineProRepository.getById(this.state.selectedId)
            : null;

        if (sel) {
            // Centre de l'événement : pour une période = milieu, pour un point = start
            const worldPivot = sel.endDate != null
                ? (sel.startDate + sel.endDate) / 2
                : sel.startDate;
            pivotScreen = this._worldToScreen(worldPivot);
            // Clamp dans la zone visible
            pivotScreen = Math.max(this.HEADER_W, Math.min(this.state.width, pivotScreen));
        } else {
            // Centre du canvas (hors en-tête)
            pivotScreen = this.HEADER_W + (this.state.width - this.HEADER_W) / 2;
        }

        // Conserver le monde sous le pivot
        const worldBefore = this._screenToWorld(pivotScreen);
        this.state.zoom   = Math.max(1e-6, Math.min(1e4, this.state.zoom * factor));
        this.state.offsetX = pivotScreen - worldBefore * this.state.zoom;
        this.draw();
    }


    // ─── HIT TEST ─────────────────────────────────────────────────────────────
    static _hitTest(lx, ly) {
        if (lx <= this.HEADER_W || ly < this.RULER_H) return null;
        if (ly >= this.state.height - this.MINIMAP_H) return null; // Ignorer la zone Minimap
        const events = TimelineProRepository.getAll();
        const layout = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);

        for (let i = events.length - 1; i >= 0; i--) {
            const ev  = events[i];
            const m = metrics.get(ev.trackId);
            if (!m) continue;

            const ty = m.y;
            const th = m.h;
            if (ty > this.state.height || ty + th < 0) continue;

            // Calcul de la sous-ligne
            const row    = layout.get(ev.id) || 0;
            const subH   = this.ROW_H;
            const iy     = ty + this.GUARD + row * subH;

            const sx = this._worldToScreen(ev.startDate);

            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                const ex  = this._worldToScreen(ev.endDate);
                const sw  = Math.max(8, ex - sx);
                // Exclure la zone du handle resize (12px extrémité droite)
                const interactW = Math.max(0, sw - 14);
                if (lx >= sx && lx <= sx + interactW && ly >= iy && ly <= iy + subH) return ev;
            } else {
                if (Math.hypot(lx - sx, ly - (iy + subH / 2)) <= 14) return ev;
            }
        }
        return null;
    }

    // ─── HIT TEST RESIZE HANDLE ───────────────────────────────────────────────
    /**
     * Détecte si le curseur (lx, ly) est sur la poignée de resize (bord droit) d'une barre.
     * Retourne l'événement ou null.
     */
    static _hitTestResize(lx, ly) {
        if (lx <= this.HEADER_W || ly < this.RULER_H) return null;
        const HANDLE_W = 14; // largeur de la zone sensible
        const events = TimelineProRepository.getAll();
        const layout = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);

        for (let i = events.length - 1; i >= 0; i--) {
            const ev = events[i];
            if (ev.endDate == null || ev.endDate === ev.startDate) continue; // points ignorés
            
            const m = metrics.get(ev.trackId);
            if (!m) continue;

            const ty = m.y;
            const th = m.h;
            if (ty > this.state.height || ty + th < 0) continue;

            const row    = layout.get(ev.id) || 0;
            const subH   = this.ROW_H;
            const iy     = ty + this.GUARD + row * subH;

            const sx = this._worldToScreen(ev.startDate);
            const ex = this._worldToScreen(ev.endDate);
            const sw = Math.max(8, ex - sx);

            // Zone sensible : [ex - HANDLE_W, ex]
            if (lx >= sx + sw - HANDLE_W && lx <= sx + sw + 4 && ly >= iy && ly <= iy + subH) {
                return ev;
            }
        }
        return null;
    }

    /**
     * Calcule la répartition des événements en sous-lignes pour chaque piste.
     * @returns {Map<string, number> & {trackMaxRows: Map<string, number>}}
     */
    static _getPackedLayout() {
        const events = TimelineProRepository.getAll();
        const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
        const layout = new Map();
        layout.trackMaxRows = new Map();

        tracks.forEach(tr => {
            const trackEvents = events
                .filter(e => e.trackId === tr.id)
                .sort((a, b) => a.startDate - b.startDate);

            const rowEnds = []; // Temps de fin pour chaque sous-ligne
            trackEvents.forEach(ev => {
                const start = ev.startDate;
                const end   = ev.endDate ?? ev.startDate;
                const buffer = 8 / (this.state.zoom || 0.05);

                let r = rowEnds.findIndex(lastEnd => start >= lastEnd + buffer);
                if (r === -1) {
                    r = rowEnds.length;
                    rowEnds.push(end);
                } else {
                    rowEnds[r] = Math.max(rowEnds[r], end);
                }
                layout.set(ev.id, r);
            });
            layout.trackMaxRows.set(tr.id, Math.max(1, rowEnds.length));
        });
        return layout;
    }

    /**
     * Calcule les métriques Y/H (position verticale + hauteur) de chaque piste visible.
     * La hauteur d'une piste s'adapte au nombre de sous-lignes utilisées.
     * @param {Map} layout - résultat de _getPackedLayout()
     * @returns {Map<string, {y:number, h:number}>} keyed by trackId
     */
    static _computeTrackMetrics(layout) {
        const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
        const metrics = new Map();
        let curY = this.RULER_H - this.state.scrollY;
        tracks.forEach(tr => {
            const maxRows = layout.trackMaxRows.get(tr.id) || 1;
            const h = this.MIN_TRACK_H + (maxRows - 1) * this.ROW_H;
            metrics.set(tr.id, { y: curY, h });
            curY += h;
        });
        return metrics;
    }


    // ═══════════════════════════════════════════════════════════════════════════
    //  DRAW
    // ═══════════════════════════════════════════════════════════════════════════
    static draw() {
        const ctx = this.state.ctx;
        if (!ctx) return;
        const { width: W, height: H } = this.state;

        // Calcul du layout ET des métriques de hauteur une seule fois
        const layout  = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);

        // Background
        const p = this._p();
        ctx.fillStyle = p.canvasBg;
        ctx.fillRect(0, 0, W, H);

        this._drawTrackBG(ctx, W, H, metrics);
        this._drawBands(ctx, W, H);
        this._drawGrid(ctx, W, H);
        this._drawRuler(ctx, W);
        this._drawTrackHeaders(ctx, H, metrics);
        this._drawLinks(ctx, H, layout, metrics);
        this._drawEvents(ctx, H, layout, metrics);
        this._drawGhost(ctx, H, layout, metrics);
        this._drawMarquee(ctx);
        this._drawLinkPreview(ctx, H, layout, metrics);
        this._drawCurrentTimeLine(ctx, H);
        this._clipHeader(ctx, W, H);
        this._drawBandLabels(ctx, W);    // libellés dans la règle — toujours au-dessus
        this._drawMinimap(ctx, W, H);
    }

    // ─── MINIMAP ─────────────────────────────────────────────────────────────
    
    static _drawMinimap(ctx, W, H) {
        const mh = this.MINIMAP_H;
        const my = H - mh;
        const mx = this.HEADER_W;
        const mw = W - mx;
        
        ctx.fillStyle = 'rgba(12, 12, 18, 0.85)';
        ctx.fillRect(mx, my, mw, mh);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(W, my);
        ctx.stroke();
        
        const events = TimelineProRepository.getAll();
        if (events.length === 0) return;

        let minT = Number.MAX_VALUE; let maxT = -Number.MAX_VALUE;
        events.forEach(e => {
            if (e.startDate < minT) minT = e.startDate;
            const et = e.endDate != null ? e.endDate : e.startDate;
            if (et > maxT) maxT = et;
        });
        
        if (minT > maxT) { minT = 0; maxT = 100; }
        if (maxT === minT) { minT -= 10; maxT += 10; }
        const span = maxT - minT;
        const pminT = minT - span * 0.05;
        const pmaxT = maxT + span * 0.05;
        const pspan = Math.max(0.001, pmaxT - pminT);

        const mapX = (t) => mx + ((t - pminT) / pspan) * mw;

        events.filter(e => e.isEpoch || e.showBand).forEach(e => {
            const x1 = mapX(e.startDate);
            const x2 = e.endDate != null ? mapX(e.endDate) : x1;
            const bw = Math.max(1, x2 - x1);
            const color = e.color?.startsWith('#') ? e.color : '#d4af37';
            const [r,g,b] = this._hexToRgb(color);
            ctx.fillStyle = `rgba(${r},${g},${b},0.25)`;
            ctx.fillRect(x1, my, bw, mh);
        });

        const tracks = TimelineProRepository.getTracks();
        const maxIdx = Math.max(1, tracks.length);
        events.filter(e => !e.isEpoch && !e.showBand).forEach(e => {
            const trIdx = Math.max(0, tracks.findIndex(t => t.id === e.trackId));
            const yPct = (trIdx + 0.5) / maxIdx;
            const py = my + 6 + yPct * (mh - 12);

            const x1 = mapX(e.startDate);
            const x2 = e.endDate != null ? mapX(e.endDate) : x1;
            const bw = Math.max(2.5, x2 - x1);
            
            ctx.fillStyle = e.color || '#ffffff';
            ctx.beginPath();
            ctx.roundRect(x1, py - 1.5, bw, 3, 1.5);
            ctx.fill();
        });

        const tLeft = this._screenToWorld(mx);
        const tRight = this._screenToWorld(W);
        let vx1 = mapX(tLeft);
        let vx2 = mapX(tRight);
        
        vx1 = Math.max(mx, Math.min(vx1, mx + mw));
        vx2 = Math.max(mx, Math.min(vx2, mx + mw));
        const vw = Math.max(2, vx2 - vx1);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(vx1, my, vw, mh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx1, my, vw, mh);
    }
    
    static _scrubMinimap(lx) {
        const mx = this.HEADER_W;
        const mw = this.state.width - mx;
        if (mw <= 0) return;
        
        const events = TimelineProRepository.getAll();
        if (events.length === 0) return;

        let minT = Number.MAX_VALUE; let maxT = -Number.MAX_VALUE;
        events.forEach(e => {
            if (e.startDate < minT) minT = e.startDate;
            const et = e.endDate != null ? e.endDate : e.startDate;
            if (et > maxT) maxT = et;
        });
        if (minT > maxT) { minT = 0; maxT = 100; }
        if (maxT === minT) { minT -= 10; maxT += 10; }
        const span = maxT - minT;
        const pminT = minT - span * 0.05;
        const pmaxT = maxT + span * 0.05;
        const pspan = Math.max(0.001, pmaxT - pminT);

        const clampX = Math.max(mx, Math.min(lx, mx + mw));
        const pct = (clampX - mx) / mw;
        const targetWorldT = pminT + pct * pspan;

        const cx = mx + mw / 2;
        this.state.offsetX = cx - this.HEADER_W - targetWorldT * this.state.zoom;
    }

    // ─── TRACK BACKGROUNDS ────────────────────────────────────────────────────
    static _drawTrackBG(ctx, W, H, metrics = null) {
        if (!metrics) metrics = this._computeTrackMetrics(this._getPackedLayout());
        const p = this._p();
        const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);
        let maxTyTh = this.RULER_H - this.state.scrollY;

        tracks.forEach((tr, i) => {
            const m = metrics.get(tr.id);
            if (!m) return;
            const ty = m.y;
            const th = m.h;
            maxTyTh = Math.max(maxTyTh, ty + th);

            if (ty + th < this.RULER_H || ty > H) return;

            ctx.fillStyle = i % 2 === 0 ? p.trackEven : p.trackOdd;
            ctx.fillRect(this.HEADER_W, ty, W - this.HEADER_W, th);

            // ── Indicateur piste cible lors d'un drag cross-track ──
            if (
                this.state.dragMode === 'event-track' &&
                this.state.dragTargetTrackIdx === i
            ) {
                ctx.fillStyle = 'rgba(100,160,255,0.13)';
                ctx.fillRect(this.HEADER_W, ty, W - this.HEADER_W, th);
                // Bordure supérieure accent
                ctx.strokeStyle = 'rgba(100,160,255,0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.HEADER_W, ty);
                ctx.lineTo(W, ty);
                ctx.stroke();
                ctx.lineWidth = 1;
            }

            // Bottom separator
            ctx.strokeStyle = p.separator;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.HEADER_W, ty + th);
            ctx.lineTo(W, ty + th);
            ctx.stroke();
        });

        // Zone vide sous les pistes
        const emptyY = maxTyTh;
        if (emptyY < H) {
            ctx.fillStyle = p.canvasBg;
            ctx.fillRect(this.HEADER_W, emptyY, W - this.HEADER_W, H - emptyY);
        }
    }

    // ─── FULL-HEIGHT BANDS & EPOCHS ──────────────────────────────────────────
    static _drawBands(ctx, W, H) {
        const events = TimelineProRepository.getAll();
        const epochs = events.filter(ev => ev.isEpoch && ev.endDate != null && ev.endDate !== ev.startDate);
        const bands  = events.filter(ev => ev.showBand && !ev.isEpoch && ev.endDate != null && ev.endDate !== ev.startDate);

        // 1. Dessiner les Époques (Fond le plus bas)
        epochs.forEach(ev => {
            const sx = this._worldToScreen(ev.startDate);
            const ex = this._worldToScreen(ev.endDate);
            if (ex < this.HEADER_W || sx > W) return;

            const x  = Math.max(sx, this.HEADER_W);
            const x2 = Math.min(ex, W);
            const bw = x2 - x;
            if (bw <= 0) return;

            const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const [r,g,b] = this._hexToRgb(color);

            ctx.save();
            ctx.fillStyle = `rgba(${r},${g},${b},0.05)`;
            ctx.fillRect(x, this.RULER_H, bw, H - this.RULER_H);
            
            ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(x, this.RULER_H); ctx.lineTo(x, H);
            ctx.moveTo(x2, this.RULER_H); ctx.lineTo(x2, H);
            ctx.stroke();
            ctx.restore();
        });

        // 2. Dessiner les Bandes classiques
        bands.forEach(ev => {
            const sx = this._worldToScreen(ev.startDate);
            const ex = this._worldToScreen(ev.endDate);
            if (ex < this.HEADER_W || sx > W) return;

            const x  = Math.max(sx, this.HEADER_W);
            const x2 = Math.min(ex, W);
            const bw = x2 - x;
            if (bw <= 0) return;

            const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const isSel = this.state.selectedIds.includes(ev.id);
            const [r,g,b] = this._hexToRgb(color);

            ctx.save();
            ctx.fillStyle = `rgba(${r},${g},${b},${isSel ? 0.32 : 0.18})`;
            ctx.fillRect(x, this.RULER_H, bw, H - this.RULER_H);

            // Left border - more visible
            ctx.strokeStyle = `rgba(${r},${g},${b},${isSel ? 0.8 : 0.5})`;
            ctx.lineWidth   = isSel ? 2 : 1;
            ctx.setLineDash(isSel ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(Math.max(sx, this.HEADER_W), this.RULER_H);
            ctx.lineTo(Math.max(sx, this.HEADER_W), H);
            ctx.stroke();

            // Right border
            if (ex <= W) {
                ctx.beginPath();
                ctx.moveTo(ex, this.RULER_H);
                ctx.lineTo(ex, H);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();
        });
    }

    /**
     * Dessine les libellés des bandes DANS la règle (zone ruler), après le rendu
     * de la règle, pour qu'ils soient toujours visibles au-dessus des événements.
     */
    static _drawBandLabels(ctx, W) {
        const events = TimelineProRepository.getAll();
        const RH = this.RULER_H;

        events.forEach(ev => {
            if (!ev.showBand || ev.endDate == null || ev.endDate === ev.startDate) return;

            const sx = this._worldToScreen(ev.startDate);
            const ex = this._worldToScreen(ev.endDate);
            if (ex < this.HEADER_W || sx > W) return;

            const x  = Math.max(sx, this.HEADER_W);
            const x2 = Math.min(ex, W);
            const bw = x2 - x;
            if (bw < 30) return;

            const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const isSel = this.state.selectedIds.includes(ev.id);
            const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
            const [r,g,b] = hex2rgb(color);

            ctx.save();

            // Clip to ruler strip
            ctx.beginPath();
            ctx.rect(x, 0, bw, RH);
            ctx.clip();

            // Colored band in ruler - slightly punchier
            ctx.fillStyle = `rgba(${r},${g},${b},${isSel ? 0.32 : 0.20})`;
            ctx.fillRect(x, 0, bw, RH);

            // Label centered in ruler strip
            ctx.fillStyle    = `rgba(${r},${g},${b},${isSel ? 1 : 0.85})`;
            ctx.font         = `${isSel ? 700 : 600} 10px Inter,system-ui,sans-serif`;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._truncate(ctx, ev.title, bw - 14), x + 7, RH / 2);

            ctx.restore();
        });
    }

    // ─── GRID ─────────────────────────────────────────────────────────────────
    static _drawGrid(ctx, W, H) {
        const p = this._p();
        const { major, minor } = this._scaleInfo();

        const screenLeft = this.HEADER_W;
        const startMajor = Math.floor(this._screenToWorld(screenLeft) / major) * major;

        // Minor grid lines
        ctx.strokeStyle = p.gridMinor;
        ctx.lineWidth = 1;
        for (let t = startMajor; this._worldToScreen(t) < W; t += minor) {
            const x = this._worldToScreen(t);
            if (x < screenLeft) continue;
            ctx.beginPath();
            ctx.moveTo(x, this.RULER_H);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        // Major grid lines
        ctx.strokeStyle = p.gridMajor;
        ctx.lineWidth = 1;
        for (let t = startMajor; this._worldToScreen(t) < W; t += major) {
            const x = this._worldToScreen(t);
            if (x < screenLeft) continue;
            ctx.beginPath();
            ctx.moveTo(x, this.RULER_H);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
    }

    // ─── RULER ────────────────────────────────────────────────────────────────
    static _drawRuler(ctx, W) {
        const H = this.RULER_H;
        const p = this._p();

        // Ruler BG
        ctx.fillStyle = p.rulerBg;
        ctx.fillRect(this.HEADER_W, 0, W - this.HEADER_W, H);

        // Bottom line
        ctx.strokeStyle = p.rulerLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.HEADER_W, H);
        ctx.lineTo(W, H);
        ctx.stroke();

        const { major, minor, fmt } = this._scaleInfo();
        const startMajor = Math.floor(this._screenToWorld(this.HEADER_W) / major) * major;

        // Minor ticks
        ctx.strokeStyle = p.tickMinor;
        ctx.lineWidth   = 1;
        for (let t = startMajor; this._worldToScreen(t) < W; t += minor) {
            const x = this._worldToScreen(t);
            if (x < this.HEADER_W) continue;
            ctx.beginPath();
            ctx.moveTo(x, H - 8);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        // Major ticks + labels
        ctx.strokeStyle     = p.tickMajor;
        ctx.fillStyle       = p.tickLabel;
        ctx.font            = '500 11px Inter,system-ui,sans-serif';
        ctx.textAlign       = 'center';
        ctx.textBaseline    = 'middle';

        for (let t = startMajor; this._worldToScreen(t) < W; t += major) {
            const x = this._worldToScreen(t);
            if (x < this.HEADER_W) continue;

            ctx.beginPath();
            ctx.moveTo(x, H - 16);
            ctx.lineTo(x, H);
            ctx.stroke();

            ctx.fillText(fmt(t), x, H / 2 - 4);
        }
    }

    // ─── TRACK HEADERS ────────────────────────────────────────────────────────
    static _drawTrackHeaders(ctx, H, metrics = null) {
        if (!metrics) metrics = this._computeTrackMetrics(this._getPackedLayout());
        const W = this.HEADER_W;
        const p = this._p();
        const tracks = TimelineProRepository.getTracks().filter(t => !t.isHidden);

        // Header panel BG
        ctx.fillStyle = p.headerBg;
        ctx.fillRect(0, this.RULER_H, W, H - this.RULER_H);

        // Separator
        ctx.strokeStyle = p.trackBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W, this.RULER_H);
        ctx.lineTo(W, H);
        ctx.stroke();

        tracks.forEach((tr, i) => {
            const m = metrics.get(tr.id);
            if (!m) return;
            const ty = m.y;
            const th = m.h;

            if (ty + th < this.RULER_H || ty > H) return;

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, Math.max(ty, this.RULER_H), W, Math.min(ty + th, H) - Math.max(ty, this.RULER_H));
            ctx.clip();

            const trColor = tr.color?.startsWith('#') ? tr.color : '#d4af37';
            ctx.fillStyle = trColor;
            ctx.fillRect(0, ty, 3, th);

            ctx.fillStyle    = p.headerTitle;
            ctx.font         = '600 12px Inter,system-ui,sans-serif';
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._truncate(ctx, tr.title, W - 40), 14, ty + th / 2 - 6);

            const count = TimelineProRepository.getAll().filter(e => e.trackId === tr.id).length;
            ctx.fillStyle = p.headerSub;
            ctx.font      = '400 10px Inter,system-ui,sans-serif';
            ctx.fillText(count + ' événement' + (count > 1 ? 's' : ''), 14, ty + th / 2 + 10);

            // ── Mise en évidence piste cible (drag cross-track) ──
            if (this.state.dragMode === 'event-track' && this.state.dragTargetTrackIdx === i) {
                const trColorRgb = trColor.startsWith('#')
                    ? [parseInt(trColor.slice(1,3),16), parseInt(trColor.slice(3,5),16), parseInt(trColor.slice(5,7),16)]
                    : [100,100,100];
                ctx.fillStyle = `rgba(${trColorRgb[0]},${trColorRgb[1]},${trColorRgb[2]},0.18)`;
                ctx.fillRect(0, ty, W, th);

                // Bordure gauche épaisse
                ctx.fillStyle = trColor;
                ctx.fillRect(0, ty, 4, th);
            }

            ctx.strokeStyle = p.separator;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(0, ty + th);
            ctx.lineTo(W, ty + th);
            ctx.stroke();

            ctx.restore();
        });
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    static _drawEvents(ctx, H, layout = null, metrics = null) {
        const events = TimelineProRepository.getAll();
        const W = this.state.width;
        if (!layout) layout = this._getPackedLayout();
        if (!metrics) metrics = this._computeTrackMetrics(layout);

        events.forEach(ev => {
            const m = metrics.get(ev.trackId);
            if (!m) return;

            const ty = m.y;
            const th = m.h;
            if (ty + th < this.RULER_H || ty > H) return;

            // Calcul de la sous-ligne
            const row    = layout.get(ev.id) || 0;
            const subH   = this.ROW_H;
            const iy     = ty + this.GUARD + row * subH;

            const sx    = this._worldToScreen(ev.startDate);
            const cy    = iy + subH / 2;
            const isSel = this.state.selectedIds.includes(ev.id);
            const isPrimary = this.state.selectedId === ev.id;
            const isHov = this.state.hoveredId  === ev.id;
            const isDrag= this.state.dragEventId === ev.id;

            const color     = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const textColor = ev.textColor?.startsWith('#') ? ev.textColor : '#ffffff';

            // ── Filtre de recherche : griser les événements non-matchants ──
            const ft = this.state.filterText;
            let filterMatch = true;
            if (ft) {
                const title = (ev.title || '').toLowerCase();
                const desc  = (ev.description || '').toLowerCase();
                const tags  = (ev.tags || []).map(t => t.toLowerCase());
                filterMatch = title.includes(ft) || desc.includes(ft) || tags.some(t => t.includes(ft));
            }

            ctx.save();
            ctx.globalAlpha = isDrag ? 0.65 : (ft && !filterMatch ? 0.12 : 1);

            // ── CLIP à la zone de la piste ─────────────────────────────────
            const clipTop    = Math.max(this.RULER_H, ty);
            const clipBottom = Math.min(H, ty + th);
            ctx.beginPath();
            ctx.rect(this.HEADER_W, clipTop, W - this.HEADER_W, clipBottom - clipTop);
            ctx.clip();

            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                // ── PERIOD BAR ──────────────────────────────────────────────
                const ex = this._worldToScreen(ev.endDate);
                const bw = Math.max(6, ex - sx);
                const bh = subH - 2; 
                const by = iy + 1;

                // Selection glow
                if (isSel || isHov) {
                    ctx.shadowColor  = color + 'aa';
                    ctx.shadowBlur   = isSel ? 16 : 8;
                }

                this._drawBar(ctx, ev.style || 'solid', sx, by, bw, bh, color, isSel, isHov);

                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

                // Selection border
                if (isSel) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth   = isPrimary ? 2.5 : 1.5;
                    ctx.setLineDash([5, 4]);
                    this._rrect(ctx, sx - 2, by - 2, bw + 4, bh + 4, 7);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Link Anchor Handle (Quick Link)
                if (isPrimary && !this.state.isDragging) {
                    this._drawLinkAnchor(ctx, sx + bw / 2, by + bh / 2, color);
                }

                // Label
                if (bw > 22) {
                    ctx.fillStyle    = textColor;
                    ctx.font         = `${isSel ? 600 : 500} 12px Inter,system-ui,sans-serif`;
                    ctx.textAlign    = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor  = 'rgba(0,0,0,.4)';
                    ctx.shadowBlur   = 3;
                    const displayTitle = ev.title + this._getCharacterAges(ev);
                    this._fillTextMultiline(ctx, displayTitle, sx + 10, by + bh / 2, bw - 20, 14);
                    ctx.shadowBlur = 0;
                }

                // Tags badges
                if (ev.tags?.length && bw > 60) {
                    ev.tags.slice(0, 3).forEach((tag, ti) => {
                        const tx = sx + bw - 10 - ti * 8;
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        ctx.beginPath(); ctx.arc(tx, by + bh - 6, 3, 0, Math.PI * 2); ctx.fill();
                    });
                }

                // Resize handle
                const isResizeHov = this.state.hoveredResizeId === ev.id || (this.state.dragEventId === ev.id && this.state.dragMode === 'resize');
                if (isResizeHov || isSel) {
                    const hx = sx + bw - 1;
                    ctx.save();
                    ctx.fillStyle = isResizeHov ? '#fff' : 'rgba(255,255,255,0.65)';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    const capH = Math.min(bh - 4, 28);
                    const capW = 6;
                    const capX = hx - capW / 2;
                    const capY = by + bh / 2 - capH / 2;
                    this._rrect(ctx, capX, capY, capW, capH, 3);
                    ctx.fill(); ctx.stroke();
                    ctx.strokeStyle = isResizeHov ? color : 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1;
                    [capY + capH * 0.35, capY + capH * 0.65].forEach(gy => {
                        ctx.beginPath(); ctx.moveTo(capX + 1.5, gy); ctx.lineTo(capX + capW - 1.5, gy); ctx.stroke();
                    });
                    ctx.restore();
                }

            } else {
                // ── POINT EVENT ─────────────────────────────────────────────
                const R = isSel ? 12 : 10;
                if (isSel || isHov) {
                    ctx.shadowColor  = color + 'bb';
                    ctx.shadowBlur   = isSel ? 20 : 12;
                }
                ctx.strokeStyle = color;
                ctx.lineWidth   = isSel ? 3 : 2;
                const pColor = isSel ? color : this._p().trackEven;
                ctx.fillStyle   = pColor;
                ctx.beginPath(); ctx.arc(sx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.shadowBlur = 0;
                
                // Content of point: Lucide Icon or Dot
                // Rétrocompatibilité : anciens ids 'baby'→'birth', 'skull'→'death'
                const ICON_ALIAS = { baby: 'birth', skull: 'death', circle: null, dot: null };
                const resolvedIcon = ev.icon ? (ICON_ALIAS.hasOwnProperty(ev.icon) ? ICON_ALIAS[ev.icon] : ev.icon) : null;
                ctx.fillStyle = isSel ? '#fff' : color;
                if (resolvedIcon && TimelineProView.ICON_PATHS[resolvedIcon]) {
                    this._drawIcon(ctx, resolvedIcon, sx, cy, isSel ? 14 : 12, isSel ? '#fff' : color);
                } else {
                    ctx.beginPath(); ctx.arc(sx, cy, isSel ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
                }

                // Link Anchor Handle
                if (isPrimary && !this.state.isDragging) {
                    this._drawLinkAnchor(ctx, sx, cy, color, R + 4);
                }

                // Label
                ctx.restore(); ctx.save();
                ctx.globalAlpha = isDrag ? 0.65 : 1;
                ctx.beginPath(); ctx.rect(this.HEADER_W, this.RULER_H, W - this.HEADER_W, H - this.RULER_H); ctx.clip();

                const lines = String(ev.title).split('\n');
                const lh    = 12;
                const th    = lines.length * lh;
                const dist  = R + 5;
                const roomAbove = (cy - dist) - this.RULER_H;
                let labelY = cy - dist, baseline = 'bottom';
                if (roomAbove < th) { labelY = cy + dist; baseline = 'top'; }

                ctx.fillStyle    = color;
                ctx.font         = `${isSel ? 700 : 500} 11px Inter,system-ui,sans-serif`;
                ctx.textAlign    = 'center';
                ctx.textBaseline = baseline;
                ctx.shadowColor  = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4;
                const displayTitle = ev.title + this._getCharacterAges(ev);
                this._fillTextMultiline(ctx, displayTitle, sx, labelY, 150, lh);
                ctx.shadowBlur = 0;
                if (ev.tags?.length) {
                    ev.tags.slice(0, 3).forEach((tag, ti) => {
                        ctx.fillStyle = color + 'aa';
                        ctx.beginPath(); ctx.arc(sx + (ti - 1) * 8, cy - R - 16, 3, 0, Math.PI * 2); ctx.fill();
                    });
                }
                ctx.strokeStyle = color + '44'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
                ctx.beginPath(); ctx.moveTo(sx, cy + R); ctx.lineTo(sx, ty + this.TRACK_H - 6); ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();
        });
    }

    // ─── BAR STYLE RENDERER ───────────────────────────────────────────────────
    /**
     * Dessine une barre de période avec le style demandé.
     * Styles : 'solid' | 'gradient' | 'outline' | 'striped' | 'arrow' | 'pill'
     */
    // ─── CONTEXT MENU SUR EN-TÊTE DE PISTE ───────────────────────────────────
    static _showTrackContextMenu(cx, cy, track) {
        // Supprimer tout menu existant
        document.getElementById('tlp-ctx')?.remove();

        const menu = document.createElement('div');
        menu.id = 'tlp-ctx';
        const trColor = track.color?.startsWith('#') ? track.color : '#aaa';

        menu.style.cssText = `
            position:fixed; left:${cx}px; top:${cy}px; z-index:99999;
            background:var(--bg-primary,#fff); border:1px solid var(--border-color,#e0e0e0);
            border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,.15);
            padding:.4rem 0; min-width:210px; font-family:Inter,system-ui,sans-serif;
            animation:tlpCtxIn .12s ease;
        `;

        // Inject animation
        if (!document.getElementById('tlp-ctx-style')) {
            const s = document.createElement('style');
            s.id = 'tlp-ctx-style';
            s.textContent = `@keyframes tlpCtxIn{from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:none}}`;
            document.head.appendChild(s);
        }

        const item = (icon, label, action, danger = false) => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                display:flex;align-items:center;gap:.65rem;width:100%;padding:.52rem 1rem;
                border:none;background:transparent;cursor:pointer;text-align:left;
                font-size:.85rem;font-weight:500;
                color:${danger ? 'var(--accent-red,#e74c3c)' : 'var(--text-primary,#1a1a1a)'};
                transition:background .1s;
            `;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>${label}`;
            btn.onmouseenter = () => btn.style.background = danger ? 'rgba(231,76,60,.07)' : 'var(--bg-secondary,#f8f9fa)';
            btn.onmouseleave = () => btn.style.background = 'transparent';
            btn.onclick = () => { menu.remove(); action(); };
            return btn;
        };

        const sep = () => {
            const d = document.createElement('div');
            d.style.cssText = 'height:1px;background:var(--border-color,#e0e0e0);margin:.3rem 0;';
            return d;
        };

        // Track color swatch header
        const header = document.createElement('div');
        header.style.cssText = `display:flex;align-items:center;gap:.6rem;padding:.5rem 1rem .6rem;border-bottom:1px solid var(--border-color,#e0e0e0);margin-bottom:.3rem;`;
        header.innerHTML = `
            <div style="width:10px;height:10px;border-radius:50%;background:${trColor};flex-shrink:0;"></div>
            <span style="font-size:.8rem;font-weight:700;color:var(--text-primary,#1a1a1a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">${track.title}</span>`;
        menu.appendChild(header);

        // ── Actions ──
        menu.appendChild(item(
            '<circle cx="12" cy="12" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>',
            'Gérer les pistes…',
            () => TimelineProViewModel.openTracksPanel()
        ));

        menu.appendChild(sep());

        menu.appendChild(item(
            '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
            'Ajouter un événement ici',
            () => {
                const cx2 = this._screenToWorld((this.state.width + this.HEADER_W) / 2);
                TimelineProViewModel.addEventAt(Math.round(cx2), track.id);
            }
        ));

        menu.appendChild(item(
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
            'Renommer la piste',
            () => {
                const name = prompt('Nouveau nom :', track.title);
                if (name !== null) TimelineProViewModel.renameTrack(track.id, name);
            }
        ));

        // ── Visibilité ──
        const eyeIcon = track.isHidden
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        menu.appendChild(item(
            eyeIcon,
            track.isHidden ? 'Afficher la piste' : 'Masquer la piste',
            () => TimelineProViewModel.toggleTrackVisibility(track.id)
        ));

        menu.appendChild(item(
            '<path d="M12 2 L13.5 5.5 L17.5 5.5 L14.5 8 L15.5 12 L12 9.5 L8.5 12 L9.5 8 L6.5 5.5 L10.5 5.5 Z"/>',
            'Changer la couleur',
            () => TimelineProViewModel.openTracksPanel()
        ));

        if (track.id !== 'default') {
            menu.appendChild(sep());
            menu.appendChild(item(
                '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
                'Supprimer la piste',
                () => TimelineProViewModel.deleteTrack(track.id),
                true
            ));
        }

        document.body.appendChild(menu);

        // Overflow guard
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth)  menu.style.left = (cx - rect.width)  + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top  = (cy - rect.height) + 'px';

        // Auto-dismiss
        const dismiss = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('mousedown', dismiss); } };
        setTimeout(() => document.addEventListener('mousedown', dismiss), 10);
    }

    // ─── BAR STYLE RENDERER ───────────────────────────────────────────────────
    static _drawBar(ctx, style, x, y, w, h, color, isSel, isHov) {
        const light  = this._lighten(color, 40);
        const dark   = this._lighten(color, -30);
        const r      = style === 'pill' ? h / 2 : 5;

        ctx.beginPath();

        switch(style) {

            case 'gradient': {
                const grad = ctx.createLinearGradient(x, y, x + w, y);
                grad.addColorStop(0, light);
                grad.addColorStop(1, dark);
                ctx.fillStyle = grad;
                this._rrect(ctx, x, y, w, h, r);
                ctx.fill();
                break;
            }

            case 'outline': {
                ctx.fillStyle   = color + '22';
                ctx.strokeStyle = color;
                ctx.lineWidth   = isSel ? 2.5 : 1.5;
                this._rrect(ctx, x, y, w, h, r);
                ctx.fill();
                ctx.stroke();
                break;
            }

            case 'striped': {
                // Fill base
                ctx.fillStyle = color + 'cc';
                this._rrect(ctx, x, y, w, h, r);
                ctx.fill();
                // Stripe overlay
                ctx.save();
                this._rrect(ctx, x, y, w, h, r);
                ctx.clip();
                ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                ctx.lineWidth   = 6;
                for (let sx = x - h; sx < x + w + h; sx += 14) {
                    ctx.beginPath();
                    ctx.moveTo(sx, y);
                    ctx.lineTo(sx + h, y + h);
                    ctx.stroke();
                }
                ctx.restore();
                break;
            }

            case 'arrow': {
                const tip = Math.min(h * 0.5, 10);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w + tip, y + h / 2);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
                ctx.fill();
                break;
            }

            case 'pill': {
                const vGrad = ctx.createLinearGradient(x, y, x, y + h);
                vGrad.addColorStop(0, light);
                vGrad.addColorStop(1, color);
                ctx.fillStyle = vGrad;
                this._rrect(ctx, x, y, w, h, r);
                ctx.fill();
                // Inner shine
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                this._rrect(ctx, x + 2, y + 2, w - 4, h / 2 - 2, r - 1);
                ctx.fill();
                break;
            }

            default: // 'solid'
            {
                ctx.fillStyle = color;
                this._rrect(ctx, x, y, w, h, r);
                ctx.fill();
                // Top highlight
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                this._rrect(ctx, x, y, w, h / 2, r);
                ctx.fill();
                break;
            }
        }
    }

    // ─── "NOW" LINE ──────────────────────────────────────────────────────────
    static _drawCurrentTimeLine(ctx, H) {
        const x = this._worldToScreen(0);
        if (x < this.HEADER_W || x > this.state.width) return;

        ctx.save();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, this.RULER_H);
        ctx.lineTo(x, H);
        ctx.stroke();
        ctx.restore();
    }

    // ─── CLIP HEADER (overdraw protection) ───────────────────────────────────
    static _clipHeader(ctx, W, H) {
        const p = this._p();
        ctx.fillStyle = p.rulerBg;
        ctx.fillRect(0, 0, this.HEADER_W, this.RULER_H);

        ctx.strokeStyle = p.trackBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.HEADER_W, 0);
        ctx.lineTo(this.HEADER_W, this.RULER_H);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, this.RULER_H);
        ctx.lineTo(this.HEADER_W, this.RULER_H);
        ctx.stroke();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SCALE CALCULATOR
    // ═══════════════════════════════════════════════════════════════════════════
    static _scaleInfo() {
        const MIN_MAJOR_PX = 100;

        if (this.state.dateMode === 'calendar') {
            // Unités = jours depuis époque Unix
            // Niveaux : 1j, 7j, 14j, 30j, 90j, 365j, 1825j(5ans)
            const CAL_SCALES = [1, 7, 14, 30, 90, 182, 365, 730, 1825, 3650, 36500];
            const major = CAL_SCALES.find(s => s * this.state.zoom >= MIN_MAJOR_PX)
                          ?? CAL_SCALES[CAL_SCALES.length - 1];

            // Minor = 1/5 du major, arrondi aux niveaux cohérents
            const minor = major >= 365 ? major / 4 :
                          major >= 30  ? 7 :
                          major >= 7   ? 1 : 1;

            const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
            const fmt = t => {
                const d = new Date(Math.round(t) * 86400000);
                if (major >= 365)  return d.getFullYear().toString();
                if (major >= 30)   return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
                return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]}`;
            };
            return { major, minor, fmt };
        }

        // ── Mode numérique (par défaut) ──────────────────────────────────────
        const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000];
        let major = niceSteps.find(s => s * this.state.zoom >= MIN_MAJOR_PX)
                    ?? niceSteps[niceSteps.length - 1];
        const minor = major / 5;
        const fmt   = t => {
            const abs = Math.abs(Math.round(t));
            if (abs >= 1e6)  return (t / 1e6).toFixed(1) + ' M';
            if (abs >= 1e3)  return (t / 1e3).toFixed(0) + ' k';
            return Math.round(t).toString();
        };
        return { major, minor, fmt };
    }

    // ─── DATE HELPERS ─────────────────────────────────────────────────────────

    /**
     * Parse une chaîne de date vers un nombre interne.
     * Supporte : "24/03/2026", "2026-03-24", "2026", ou un float brut.
     * En mode calendar → retourne des jours depuis époque Unix (ms / 86400000).
     * En mode numeric  → retourne parseFloat.
     */
    static _parseDate(str) {
        if (str === null || str === undefined || str === '') return null;
        const s = String(str).trim();
        // dd/mm/yyyy
        const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmy) {
            const d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
            return Math.round(d.getTime() / 86400000);
        }
        // yyyy-mm-dd (format natif <input type="date">)
        const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (ymd) {
            const d = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
            return Math.round(d.getTime() / 86400000);
        }
        return parseFloat(s);
    }

    /** Convertit un nombre interne en string ISO "yyyy-mm-dd" (pour <input type="date">) */
    static _numToISO(t) {
        if (t == null || isNaN(t)) return '';
        const d = new Date(Math.round(t) * 86400000);
        return d.toISOString().slice(0, 10);
    }

    /** Formate un nombre interne pour affichage lisible selon le mode courant */
    static _fmtDate(t) {
        if (t == null || isNaN(t)) return '';
        if (this.state.dateMode !== 'calendar') return String(Math.round(t));
        const d = new Date(Math.round(t) * 86400000);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CSS COLOR UTILITIES (thème clair / sombre adaptatif)
    // ═══════════════════════════════════════════════════════════════════════════

    /** Détecte si le thème courant est sombre */
    static _isDark() {
        if (typeof getComputedStyle === 'undefined') return false;
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
        if (!bg.startsWith('#')) return false;
        const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }

    /** Palette sémantique adaptée au thème */
    static _p() {
        const dark = this._isDark();
        return {
            canvasBg    : dark ? '#16161e' : '#f4f5f7',
            trackEven   : dark ? '#1c1c28' : '#ffffff',
            trackOdd    : dark ? '#1a1a24' : '#f8f9fb',
            headerBg    : dark ? '#12121c' : '#ffffff',
            rulerBg     : dark ? '#0e0e18' : '#ffffff',
            gridMinor   : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
            gridMajor   : dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
            separator   : dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
            rulerLine   : dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            tickMinor   : dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)',
            tickMajor   : dark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.50)',
            tickLabel   : dark ? '#c0c0cc' : '#555566',
            headerTitle : dark ? '#e8e8f0' : '#1a1a2e',
            headerSub   : dark ? '#888899' : '#888899',
            trackBorder : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
            eventText   : '#ffffff',
        };
    }

    static _css(v, fallback = '#000') {
        const val = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        if (!val) return fallback;
        if (/^\d+\s*,/.test(val)) return `rgb(${val})`;
        return val;
    }

    static _cssAlpha(v, a, fallback = 'rgba(0,0,0,0.1)') {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        if (!raw) return fallback;
        if (raw.startsWith('#') && raw.length === 7) {
            const r = parseInt(raw.slice(1,3),16), g = parseInt(raw.slice(3,5),16), b = parseInt(raw.slice(5,7),16);
            return `rgba(${r},${g},${b},${a})`;
        }
        if (/^\d+\s*,/.test(raw)) return `rgba(${raw},${a})`;
        return raw;
    }

    static _lighten(hex, amt) {
        if (!hex?.startsWith('#')) return '#d4af37';
        let r = Math.max(0, Math.min(255, parseInt(hex.slice(1,3),16) + amt));
        let g = Math.max(0, Math.min(255, parseInt(hex.slice(3,5),16) + amt));
        let b = Math.max(0, Math.min(255, parseInt(hex.slice(5,7),16) + amt));
        return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
    }

    // ─── MISC UTILS ───────────────────────────────────────────────────────────
    static _rrect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    static _truncate(ctx, text, maxW) {
        if (!text) return '';
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
        return t + '…';
    }

    static _fillTextMultiline(ctx, text, x, y, maxW, lineHeight = 13) {
        if (!text) return;
        const lines = String(text).split('\n'), count = lines.length;
        const oldBaseline = ctx.textBaseline;
        ctx.textBaseline = 'top';
        let startY = y;
        if (oldBaseline === 'bottom') startY = y - count * lineHeight;
        else if (oldBaseline === 'middle') startY = y - (count * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(this._truncate(ctx, line, maxW), x, startY + i * lineHeight);
        });
        ctx.textBaseline = oldBaseline;
    }

    // ─── Public: refresh ──────────────────────────────────────────────────────
    static refresh() { this.draw(); }

    /** Retourne le point d'attache central d'un événement (barre ou point) */
    static _eventCenter(ev, layout = null, metrics = null) {
        if (!layout) layout = this._getPackedLayout();
        if (!metrics) metrics = this._computeTrackMetrics(layout);
        const m = metrics.get(ev.trackId);
        if (!m) return null;
        const row = layout.get(ev.id) || 0;
        const cy  = m.y + this.GUARD + (row + 0.5) * this.ROW_H;
        const sx  = this._worldToScreen(ev.startDate);
        if (ev.endDate != null && ev.endDate !== ev.startDate) {
            const ex = this._worldToScreen(ev.endDate);
            return { x: (sx + ex) / 2, y: cy };
        }
        return { x: sx, y: cy };
    }

    /** Hit-test d'un lien : renvoie le lien si le point est proche de la courbe */
    static _hitTestLink(px, py) {
        const links  = TimelineProRepository.getLinks();
        const events = TimelineProRepository.getAll();
        const layout = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);
        const THRESH = 8;
        for (const lnk of links) {
            const from = events.find(e => e.id === lnk.fromId);
            const to   = events.find(e => e.id === lnk.toId);
            if (!from || !to) continue;
            const p1 = this._eventCenter(from, layout, metrics);
            const p2 = this._eventCenter(to, layout, metrics);
            if (!p1 || !p2) continue;
            const curv = lnk.curvature ?? 80;
            const cp1x = p1.x + (p2.x - p1.x) / 3, cp1y = p1.y - curv;
            const cp2x = p1.x + 2 * (p2.x - p1.x) / 3, cp2y = p2.y - curv;
            for (let t = 0; t <= 1; t += 1/30) {
                const mt = 1 - t;
                const bx = mt*mt*mt*p1.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p2.x;
                const by = mt*mt*mt*p1.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p2.y;
                if (Math.hypot(bx - px, by - py) <= THRESH) return lnk;
            }
        }
        return null;
    }

    /** Finalise la sélection par rectangle */
    static _finalizeMarquee() {
        if (!this.state.marqueeStart || !this.state.marqueeEnd) return;
        const x1 = Math.min(this.state.marqueeStart.lx, this.state.marqueeEnd.lx);
        const x2 = Math.max(this.state.marqueeStart.lx, this.state.marqueeEnd.lx);
        const y1 = Math.min(this.state.marqueeStart.ly, this.state.marqueeEnd.ly);
        const y2 = Math.max(this.state.marqueeStart.ly, this.state.marqueeEnd.ly);
        const events = TimelineProRepository.getAll();
        const layout = this._getPackedLayout();
        const metrics = this._computeTrackMetrics(layout);
        const selected = [];
        events.forEach(ev => {
            const m = metrics.get(ev.trackId);
            if (!m) return;
            const row  = layout.get(ev.id) || 0;
            const iy   = m.y + this.GUARD + row * this.ROW_H;
            const sx   = this._worldToScreen(ev.startDate);
            const cy   = iy + this.ROW_H / 2;
            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                const ex = this._worldToScreen(ev.endDate);
                const rect = { left: sx, top: iy, right: ex, bottom: iy + this.ROW_H };
                if (!(rect.left > x2 || rect.right < x1 || rect.top > y2 || rect.bottom < y1)) selected.push(ev.id);
            } else {
                if (sx >= x1 && sx <= x2 && cy >= y1 && cy <= y2) selected.push(ev.id);
            }
        });
        if (selected.length > 0) {
            this.state.selectedIds = selected;
            this.state.selectedId = selected[selected.length - 1];
            TimelineProViewModel.openPanel(this.state.selectedId);
        } else {
            this.state.selectedIds = [];
            this.state.selectedId = null;
            TimelineProViewModel.closePanel();
        }
    }


    /** Dessine toutes les liaisons */
    static _drawLinks(ctx, H, layout = null, metrics = null) {
        if (!layout) layout = this._getPackedLayout();
        if (!metrics) metrics = this._computeTrackMetrics(layout);
        const links  = TimelineProRepository.getLinks();
        const events = TimelineProRepository.getAll();
        links.forEach(lnk => {
            const from = events.find(e => e.id === lnk.fromId);
            const to   = events.find(e => e.id === lnk.toId);
            if (!from || !to) return;
            const p1 = this._eventCenter(from, layout, metrics);
            const p2 = this._eventCenter(to, layout, metrics);
            if (!p1 || !p2) return;
            const isSel = this.state.selectedLinkId === lnk.id;
            const isHov = this.state.hoveredLinkId  === lnk.id;
            this._drawBezierLink(ctx, lnk, p1, p2, isSel, isHov);
        });
    }

    /** Prévisualisation du lien en cours de création */
    static _drawLinkPreview(ctx, H, layout = null, metrics = null) {
        const fromId = this.state.linkMode ? this.state.linkFromId : this.state.dragLinkFromId;
        if (!fromId) return;
        if (!layout) layout = this._getPackedLayout();
        if (!metrics) metrics = this._computeTrackMetrics(layout);
        const events = TimelineProRepository.getAll();
        const from   = events.find(e => e.id === fromId);
        if (!from) return;
        const p1 = this._eventCenter(from, layout, metrics);
        if (!p1) return;
        const color = from.color?.startsWith('#') ? from.color : '#d4af37';
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        const p2 = { x: this.state.mouseX, y: this.state.mouseY };
        const curv = 80;
        const cp1x = p1.x + (p2.x - p1.x) / 3, cp1y = p1.y - curv;
        const cp2x = p1.x + 2 * (p2.x - p1.x) / 3, cp2y = p2.y - curv;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    /** Dessine le curseur fantôme (preview de création) */
    static _drawGhost(ctx, H, layout, metrics) {
        if (this.state.isDragging || !this.state.ghostT || !this.state.ghostTrackId) return;
        const m = metrics.get(this.state.ghostTrackId);
        if (!m) return;
        const sx = this._worldToScreen(this.state.ghostT);
        if (sx < this.HEADER_W || sx > this.state.width) return;
        ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(sx, m.y); ctx.lineTo(sx, m.y + m.h); ctx.stroke();
        ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(sx, m.y + m.h / 2, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    /** Dessine le rectangle de sélection (marquee) */
    static _drawMarquee(ctx) {
        if (this.state.dragMode !== 'marquee' || !this.state.marqueeStart || !this.state.marqueeEnd) return;
        const x1 = Math.min(this.state.marqueeStart.lx, this.state.marqueeEnd.lx);
        const x2 = Math.max(this.state.marqueeStart.lx, this.state.marqueeEnd.lx);
        const y1 = Math.min(this.state.marqueeStart.ly, this.state.marqueeEnd.ly);
        const y2 = Math.max(this.state.marqueeStart.ly, this.state.marqueeEnd.ly);
        ctx.save();
        ctx.fillStyle   = 'rgba(212, 175, 55, 0.15)';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth   = 1;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.restore();
    }

    /** Dessine le marqueur de temps actuel (ligne rouge) */
    static _drawCurrentTimeLine(ctx, H) {
        const now = Date.now() / (24 * 60 * 60 * 1000); // simplify? 
        // Note: use model specific 'now' if available, otherwise hide.
        if (this.state.dateMode !== 'calendar') return; 
        const sx = this._worldToScreen(this._parseDate(new Date().toISOString()));
        if (sx < this.HEADER_W || sx > this.state.width) return;
        ctx.save();
        ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 2]);
        ctx.beginPath(); ctx.moveTo(sx, this.RULER_H); ctx.lineTo(sx, H); ctx.stroke();
        ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(sx, this.RULER_H, 4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    /** Nettoyage propre de l'en-tête (coin supérieur gauche) */
    static _clipHeader(ctx, W, H) {
        ctx.fillStyle = this._p().headerBg;
        ctx.fillRect(0, 0, this.HEADER_W, this.RULER_H);
        ctx.strokeStyle = this._p().trackBorder;
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(this.HEADER_W, 0); ctx.lineTo(this.HEADER_W, this.RULER_H); ctx.stroke();
        // Optionnel: titre du module
        ctx.fillStyle = this._p().headerTitle;
        ctx.font      = '600 13px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Localization.t('nav.timeline_pro').toUpperCase(), this.HEADER_W/2, this.RULER_H/2);
    }

    /** Hit-test du "levier" de liaison rapide */
    static _hitTestLinkHandle(lx, ly) {
        if (!this.state.selectedId || this.state.isDragging) return null;
        const ev = TimelineProRepository.getById(this.state.selectedId);
        if (!ev) return null;
        const p = this._eventCenter(ev);
        return (p && Math.hypot(lx - p.x, ly - p.y) <= 18) ? ev : null;
    }

    /** Dessine le point d'ancrage pour la liaison rapide */
    static _drawLinkAnchor(ctx, x, y, color, radius = 18) {
        ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.beginPath(); ctx.arc(x, y, radius * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    /** Dessine une courbe de Bézier entre deux événements */
    static _drawBezierLink(ctx, lnk, p1, p2, isSel, isHov) {
        const dash = lnk.pattern==='dashed'?[10,6]:lnk.pattern==='dotted'?[2,5]:[];
        const color = lnk.color || '#d4af37', width = (lnk.width || 2) * (isSel?1.5:1), curv = lnk.curvature??80;
        const cp1x = p1.x + (p2.x-p1.x)/3, cp1y = p1.y-curv, cp2x = p1.x + 2*(p2.x-p1.x)/3, cp2y = p2.y-curv;
        ctx.save(); if (isSel || isHov) { ctx.shadowColor=color+'aa'; ctx.shadowBlur=isSel?14:7; }
        ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.setLineDash(dash);
        ctx.globalAlpha = isSel ? 1 : 0.75;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y); ctx.stroke();
        ctx.setLineDash([]);
        if (lnk.capStart && lnk.capStart !== 'none') this._drawLinkCap(ctx, lnk.capStart, p1.x, p1.y, Math.atan2(cp1y-p1.y, cp1x-p1.x)+Math.PI, color, width);
        if (lnk.capEnd && lnk.capEnd !== 'none') this._drawLinkCap(ctx, lnk.capEnd, p2.x, p2.y, Math.atan2(p2.y-cp2y, p2.x-cp2x), color, width);
        if (lnk.label) this._drawLinkLabel(ctx, lnk, cp1x, cp1y, cp2x, cp2y);
        ctx.restore();
    }

    /** Dessine une extrémité sur la courbe */
    static _drawLinkCap(ctx, type, x, y, angle, color, lw) {
        const sz = Math.max(12, lw * 5.5);
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); if (type === 'arrow') { ctx.moveTo(0,0); ctx.lineTo(-sz, -sz*0.4); ctx.lineTo(-sz*0.7,0); ctx.lineTo(-sz, sz*0.4); ctx.closePath(); } else if (type === 'circle') { ctx.arc(-sz*0.4, 0, sz*0.4, 0, Math.PI*2); } else if (type === 'diamond') { ctx.moveTo(0,0); ctx.lineTo(-sz*0.5,-sz*0.4); ctx.lineTo(-sz,0); ctx.lineTo(-sz*0.5,sz*0.4); ctx.closePath(); }
        ctx.fill(); ctx.stroke(); ctx.restore();
    }

    /** Dessine le libellé d'un lien */
    static _drawLinkLabel(ctx, lnk, cp1x, cp1y, cp2x, cp2y) {
        const mx = (cp1x + cp2x) / 2, my = (cp1y + cp2y) / 2 - 10;
        ctx.save(); ctx.font = '500 11px Inter,sans-serif'; ctx.fillStyle = lnk.color || '#d4af37'; ctx.textAlign = 'center'; ctx.shadowColor = 'var(--bg-primary,#fff)'; ctx.shadowBlur = 4;
        this._fillTextMultiline(ctx, lnk.label, mx, my, 180, 13);
        ctx.restore();
    }

    /**
     * Dessine une icône Lucide à partir de son tracé SVG.
     * Les tracés sont centrés dans un carré de 24x24.
     */
    static _drawIcon(ctx, name, x, y, size, color) {
        const pathData = this.ICON_PATHS[name];
        if (!pathData) return;
        ctx.save();
        ctx.translate(x, y);
        const scale = size / 24;
        ctx.scale(scale, scale);
        ctx.translate(-12, -12); 
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2.2;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        const paths = Array.isArray(pathData) ? pathData : [pathData];
        paths.forEach(p => {
            const path = new Path2D(p);
            ctx.stroke(path);
        });
        ctx.restore();
    }

    // ─── TOOLTIP ─────────────────────────────────────────────────────────────────
    static _showTooltip(ev, mouseX, mouseY) {
        const tip = document.getElementById('tlp-tooltip');
        if (!tip) return;
        const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
        const hasDesc = ev.description && ev.description.trim().length > 0;
        const [r,g,b] = this._hexToRgb(color);

        let dateStr = '';
        if (ev.startDate != null) {
            dateStr = this._fmtDate(ev.startDate);
            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                dateStr += ' → ' + this._fmtDate(ev.endDate);
            }
        }

        const descHtml = hasDesc 
            ? `<div class="tlp-tip-desc">${ev.description.replace(/\n/g, '<br>')}</div>` 
            : '';

        const tagsHtml = (ev.tags && ev.tags.length > 0)
            ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${ev.tags.map(t => `<span style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:10px;">${this._esc(t)}</span>`).join('')}</div>`
            : '';

        const lockIcon = ev.isLocked
            ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:.5;margin-left:.3rem"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
            : '';

        // ── Entités liées (Personnages & Lieu) ──
        let entitiesHtml = '';
        const chars = window.project?.characters || [];
        const worldItems = window.project?.world || [];
        
        // Héritage depuis la piste
        let effChars = (ev.characters || []).map(String);
        let effWorldId = ev.worldId ? String(ev.worldId) : null;
        if (ev.trackId) {
            const tr = TimelineProRepository.getTracks().find(t => String(t.id) === String(ev.trackId));
            if (tr) {
                if (tr.characters) tr.characters.forEach(c => effChars.push(String(c)));
                if (!effWorldId && tr.worldId) effWorldId = String(tr.worldId);
            }
        }
        effChars = Array.from(new Set(effChars));

        const linkedChars = effChars.map(id => chars.find(c => String(c.id) === id)).filter(Boolean);
        const linkedPlace = effWorldId ? worldItems.find(w => String(w.id) === effWorldId) : null;

        if (linkedPlace || linkedChars.length > 0) {
            entitiesHtml += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;">`;
            if (linkedPlace) {
                const placeName = linkedPlace.fields?.nom || 'Lieu inconnu';
                entitiesHtml += `<div style="display:flex;align-items:center;gap:4px;color:#a0a0b0;margin-bottom:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${this._esc(placeName)}
                </div>`;
            }
            if (linkedChars.length > 0) {
                const names = linkedChars.map(c => this._esc(c.name || c.firstName || 'Inconnu')).join(', ');
                entitiesHtml += `<div style="display:flex;align-items:flex-start;gap:4px;color:#a0a0b0;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span>${names}</span>
                </div>`;
            }
            entitiesHtml += `</div>`;
        }

        const titleText = (ev.title || '') + this._getCharacterAges(ev);

        tip.innerHTML = `
            <div class="tlp-tip-header">
                <div class="tlp-tip-color-dot" style="background:${color};box-shadow:0 0 0 3px rgba(${r},${g},${b},.2)"></div>
                <div class="tlp-tip-title">${titleText.replace(/</g,'&lt;')}</div>
                ${lockIcon}
            </div>
            <div class="tlp-tip-body">
                ${dateStr ? `<div class="tlp-tip-dates">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    ${dateStr}
                </div>` : ''}
                ${descHtml}
                ${tagsHtml}
                ${entitiesHtml}
                <div class="tlp-tip-hint" style="margin-top:6px">${!hasDesc && !entitiesHtml && !tagsHtml ? Localization.t('timeline.pro.hint.edit_view') : Localization.t('timeline.pro.hint.edit')}</div>
            </div>
        `;
        tip.style.display = 'block';
        requestAnimationFrame(() => {
            const tw = tip.offsetWidth || 300;
            const th = tip.offsetHeight || 80;
            const gap = 18;
            let left = mouseX + gap;
            let top  = mouseY - th / 2;
            if (left + tw > window.innerWidth - 8) left = mouseX - tw - gap;
            if (top + th > window.innerHeight - 8) top = window.innerHeight - th - 8;
            if (top < 8) top = 8;
            tip.style.left = left + 'px';
            tip.style.top  = top  + 'px';
        });
    }

    static _hideTooltip() {
        const tip = document.getElementById('tlp-tooltip');
        if (tip) tip.style.display = 'none';
    }

    static _esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
    }

    // ─── NARRATOLOGICAL UTILS ────────────────────────────────────────────────
    
    static _hexToRgb(h) {
        if (!h || !h.startsWith('#')) return [212, 175, 55];
        return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    }

    static _getCharacterAges(ev) {
        let effChars = (ev.characters || []).map(String);
        if (ev.trackId) {
            const tr = TimelineProRepository.getTracks().find(t => String(t.id) === String(ev.trackId));
            if (tr && tr.characters) tr.characters.forEach(c => effChars.push(String(c)));
        }
        effChars = Array.from(new Set(effChars));

        if (effChars.length === 0) return '';
        const chars = window.project?.characters || [];

        const ages = [];
        effChars.forEach(id => {
            const char = chars.find(c => String(c.id) === String(id));
            if (char && char.birthDate) {
                const bDate = this._parseDate(char.birthDate);
                if (bDate !== null && !isNaN(bDate)) {
                    let age;
                    if (this.state.dateMode === 'calendar') {
                        age = Math.floor((ev.startDate - bDate) / 365.25);
                    } else {
                        age = Math.floor(ev.startDate - bDate);
                    }
                    if (age >= 0 && age < 2000) ages.push(age);
                }
            }
        });
        
        if (ages.length === 0) return '';
        return ` (${ages.join(', ')}${ages.length === 1 ? ' ' + Localization.t('timeline.pro.label.year') : ' ' + Localization.t('timeline.pro.label.years')})`;
    }

    static ICON_PATHS = {
        pin: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        birth: ["M9 12h.01", "M15 12h.01", "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5", "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6 9 9 0 0 1 1.8-3.9 2 2 0 0 1 3.6-4.4 9 9 0 0 1 6.8 0 2 2 0 0 1 3.6 4.4Z"],
        death: ["M9 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z", "M19 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z", "M12 22s-4-1-4-5V10a4 4 0 0 1 8 0v7c0 4-4 5-4 5z", "M7 15h10"],
        battle: ["M14.5 17.5L3 6V3h3l11.5 11.5", "M13 19l2 2", "M16 16l2 2", "M19 13l2 2", "M21 21l-3-3", "M10 21l-2-2L3.5 12.5"],
        crown: "M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z",
        feather: ["M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z", "M16 8L2 22", "M17.5 15H9"],
        ring: ["M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M12 6V2l3 2-3 2z"],
        heart: "M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l1.1 1 7.7 7.8 7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z",
        mariage: ["M8 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M16 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"],
        fire: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
        voyage: ["M12 22V8", "M5 12H2", "M22 12h-3", "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 13c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"],
        magic: ["M12 3v1", "M12 20v1", "M3 12h1", "M20 12h1", "M18.364 5.636l-.707.707", "M6.343 17.657l-.707.707", "M5.636 5.636l.707.707", "M17.657 17.657l.707.707", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
        cult: ["M6 9V2h12v7", "M6 18H4c-1.1 0-2-1-2-2v-2c0-1.1.9-2 2-2h2", "M18 18h2c1.1 0 2-1 2-2v-2c0-1.1-.9-2-2-2h-2", "M10 22v-6.5", "M14 22v-6.5", "M10 15.5h4"],
        build: ["M2 21h20", "M9 8V4h6v4", "M4 17V8h16v9", "M10 17v-4", "M14 17v-4"],
        science: ["M6 18h12", "M7 2v7l-3.5 9h17L17 9V2", "M7 2h10", "M8 11h8"],
        flag: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22v-7"]
    };
}
