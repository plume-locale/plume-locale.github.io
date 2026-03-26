/**
 * @class TimelineProView
 * @description Moteur de rendu canvas pour la chronologie avancée, inspiré de time.graphics.
 */
class TimelineProView {

    // ─── Constants ───────────────────────────────────────────────────────────
    static RULER_H   = 52;   // Hauteur de la règle temporelle
    static HEADER_W  = 200;  // Largeur des en-têtes de piste
    static TRACK_H   = 80;   // Hauteur d'une piste
    static GUARD     = 8;    // Marge intérieure des eventos

    // ─── State ────────────────────────────────────────────────────────────────
    static state = {
        canvas: null, ctx: null,
        zoom: 0.05,           // px / unité de temps
        offsetX: 0,           // décalage horizontal en px
        scrollY: 0,           // décalage vertical pour pistes (px)
        width: 0, height: 0,
        // Interaction
        isDragging: false, dragMode: null,   // 'pan' | 'event'
        lastMouseX: 0, lastMouseY: 0,
        dragEventId: null, dragEventOffsetX: 0,
        // État UI
        hoveredId: null, selectedId: null,
        // Liaisons Bézier
        linkMode: false,       // true = attente du 2e clic pour créer un lien
        linkFromId: null,      // événement source du lien en cours
        hoveredLinkId: null,   // lien survolé
        selectedLinkId: null,  // lien sélectionné
        mouseX: 0, mouseY: 0, // Coordonnées souris courantes (canvas)
        // Mode de date : 'numeric' (valeurs brutes) ou 'calendar' (jours depuis époque)
        dateMode: 'numeric',
        // Resize observer
        ro: null,
    };

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
        this._hideTooltip();
        if (this.state.ro) { this.state.ro.disconnect(); this.state.ro = null; }
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup',   this._onMouseUp);

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

    <button id="tlp-track-manage" class="btn" title="Gérer les pistes" style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      Pistes
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-zoom-in"  class="btn" title="Zoom +" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="16.5" y1="16.5" x2="22" y2="22"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button id="tlp-zoom-out" class="btn" title="Zoom -" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="16.5" y1="16.5" x2="22" y2="22"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <button id="tlp-fit"      class="btn" title="Ajuster la vue" style="padding:.4rem .6rem;border-radius:6px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-date-toggle" class="btn" title="Basculer mode calendrier / numérique"
            style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span id="tlp-date-label">Numérique</span>
    </button>

    <div style="width:1px;height:22px;background:var(--border-color);margin:0 .25rem;"></div>

    <button id="tlp-link-mode" class="btn" title="Mode liaison : Shift+clic sur un événement pour relier"
            style="gap:.35rem;display:flex;align-items:center;padding:.45rem .8rem;font-size:.8rem;border-radius:6px;transition:background .15s,color .15s;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      Relier
    </button>

    <div style="flex:1;"></div>
    <div id="tlp-hint" style="font-size:.75rem;color:var(--text-muted);opacity:.7;">
      Double-clic sur une piste pour créer un événement
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

        canvas.addEventListener('mousedown',  e => this._handleMouseDown(e));
        canvas.addEventListener('dblclick',   e => this._handleDblClick(e));
        canvas.addEventListener('mousemove',  e => this._handleMouseMoveCanvas(e));
        canvas.addEventListener('mouseleave', () => { this.state.hoveredId = null; this.state.hoveredLinkId = null; this._hideTooltip(); this.draw(); });
        canvas.addEventListener('wheel',      e => this._handleWheel(e), { passive: false });
        window.addEventListener('mousemove',  this._onMouseMove);
        window.addEventListener('mouseup',    this._onMouseUp);

        // Toolbar
        document.getElementById('tlp-add')?.addEventListener('click', () => TimelineProViewModel.addEvent());
        document.getElementById('tlp-track-manage')?.addEventListener('click', () => TimelineProViewModel.openTracksPanel());
        document.getElementById('tlp-zoom-in')?.addEventListener('click',  () => this._zoomAt(1.5));
        document.getElementById('tlp-zoom-out')?.addEventListener('click', () => this._zoomAt(1 / 1.5));
        document.getElementById('tlp-fit')?.addEventListener('click',      () => { this._fitView(); this.draw(); });
        document.getElementById('tlp-date-toggle')?.addEventListener('click', () => {
            this.state.dateMode = this.state.dateMode === 'calendar' ? 'numeric' : 'calendar';
            const lbl = document.getElementById('tlp-date-label');
            if (lbl) lbl.textContent = this.state.dateMode === 'calendar' ? 'Calendrier' : 'Numérique';
            // Si un event est sélectionné, rafraîchir le panneau pour changer les inputs
            if (this.state.selectedId) TimelineProViewModel.openPanel(this.state.selectedId);
            this.draw();
        });

        // Bouton mode liaison
        const linkBtn = document.getElementById('tlp-link-mode');
        linkBtn?.addEventListener('click', () => this._toggleLinkMode());

        // Context menu sur clic droit dans les en-têtes
        this.state.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            const { lx, ly } = this._local(e);
            if (lx > this.HEADER_W || ly < this.RULER_H) return;
            const tIdx  = Math.floor((ly - this.RULER_H + this.state.scrollY) / this.TRACK_H);
            const track = TimelineProRepository.getTracks()[tIdx];
            if (track) this._showTrackContextMenu(e.clientX, e.clientY, track);
        });
    }

    // ─── MOUSE DOWN ──────────────────────────────────────────────────────────
    static _handleMouseDown(e) {
        const { lx, ly } = this._local(e);

        // Shortcut Shift+Clic sur un événement → activer le mode liaison direct
        if (e.shiftKey) {
            const hit = this._hitTest(lx, ly);
            if (hit && !this.state.linkMode) {
                this._toggleLinkMode();
                this.state.linkFromId = hit.id;
                this._updateLinkHint("Cliquer sur l'événement cible pour créer la liaison");
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
                    this._updateLinkHint("Cliquer sur l'\u00e9v\u00e9nement cible pour cr\u00e9er la liaison");
                } else if (hit.id !== this.state.linkFromId) {
                    TimelineProViewModel.createLink(this.state.linkFromId, hit.id);
                    this.state.linkFromId = null;
                    this._toggleLinkMode();
                }
            } else {
                this.state.linkFromId = null;
                this._updateLinkHint('Cliquer sur un \u00e9v\u00e9nement source pour commencer une liaison');
                this.draw();
            }
            e.preventDefault();
            return;
        }

        // Clic dans l'en-tête de piste → ne rien faire
        if (lx <= this.HEADER_W && ly >= this.RULER_H) return;

        // ── Clic sur un événement ? ──
        const hit = this._hitTest(lx, ly);
        if (hit) {
            this.state.isDragging       = true;
            this.state.lastMouseX       = e.clientX;
            this.state.lastMouseY       = e.clientY;
            this.state.dragMode         = 'event';
            this.state.dragEventId      = hit.id;
            this.state.dragEventOffsetX = lx - this._worldToScreen(hit.startDate);
            this._selectEvent(hit.id);
            this.state.selectedLinkId   = null;
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

        // Clic dans le vide -> Pan
        this.state.isDragging   = true;
        this.state.lastMouseX   = e.clientX;
        this.state.lastMouseY   = e.clientY;
        this.state.dragMode     = 'pan';
        this.state.dragEventId  = null;
        if (lx > this.HEADER_W) {
            this._selectEvent(null);
            this.state.selectedLinkId = null;
            TimelineProViewModel.closePanel();
            this.draw();
        }
        e.preventDefault();
    }

    // ─── MOUSE DBL-CLICK ─────────────────────────────────────────────────────
    static _handleDblClick(e) {
        const { lx, ly } = this._local(e);
        if (lx <= this.HEADER_W) return;

        const trackIdx = Math.floor((ly - this.RULER_H + this.state.scrollY) / this.TRACK_H);
        const tracks   = TimelineProRepository.getTracks();
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

        // Curseur en mode liaison
        if (this.state.linkMode) {
            const hit = this._hitTest(lx, ly);
            const newHover = hit ? hit.id : null;
            if (newHover !== this.state.hoveredId) {
                this.state.hoveredId = newHover;
                this.state.canvas.style.cursor = hit ? 'crosshair' : 'crosshair';
                this.draw();
            } else if (this.state.linkFromId) {
                // Forcer le redraw pour que la ligne élastique suive la souris
                this.draw();
            }
            return;
        }

        const hit = this._hitTest(lx, ly);
        const newHover = hit ? hit.id : null;
        if (newHover !== this.state.hoveredId) {
            this.state.hoveredId = newHover;
            this.state.canvas.style.cursor = hit ? 'grab' : (lx > this.HEADER_W ? 'default' : 'default');
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
        } else {
            this._hideTooltip();
        }
    }

    // ─── MOUSE MOVE WINDOW (drag) ─────────────────────────────────────────────
    static _handleMouseMove(e) {
        if (!this.state.isDragging) return;
        const dx = e.clientX - this.state.lastMouseX;
        const dy = e.clientY - this.state.lastMouseY;
        this.state.lastMouseX = e.clientX;
        this.state.lastMouseY = e.clientY;

        if (this.state.dragMode === 'pan') {
            this.state.offsetX  += dx;
            this.state.scrollY  -= dy;
            this.state.scrollY   = Math.max(0, this.state.scrollY);
        } else if (this.state.dragMode === 'event' && this.state.dragEventId) {
            const ev = TimelineProRepository.getById(this.state.dragEventId);
            if (ev && !ev.isLocked) {
                const cursorX = e.clientX - this.state.canvas.getBoundingClientRect().left;
                const newStart = Math.round(this._screenToWorld(cursorX - this.state.dragEventOffsetX));
                const delta = newStart - ev.startDate;
                ev.startDate = newStart;
                if (ev.endDate != null) ev.endDate = +(ev.endDate) + delta;
                TimelineProRepository.save(ev);
            }
        }
        this.draw();
    }

    // ─── MOUSE UP ─────────────────────────────────────────────────────────────
    static _handleMouseUp() {
        if (this.state.dragMode === 'event') {
            if (typeof saveProject === 'function') saveProject();
        }
        this.state.isDragging = false;
        this.state.dragMode   = null;
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
    static _selectEvent(id) {
        this.state.selectedId = id;
        if (id) TimelineProViewModel.openPanel(id);
        else    TimelineProViewModel.closePanel();
        this.draw();
    }

    // ─── COORDINATE HELPERS ───────────────────────────────────────────────────
    static _local(e) {
        const r  = this.state.canvas.getBoundingClientRect();
        return { lx: e.clientX - r.left, ly: e.clientY - r.top };
    }
    static _worldToScreen(t) { return t * this.state.zoom + this.state.offsetX; }
    static _screenToWorld(x) { return (x - this.state.offsetX) / this.state.zoom; }

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
        const events = TimelineProRepository.getAll();
        const tracks = TimelineProRepository.getTracks();
        const layout = this._getPackedLayout();

        for (let i = events.length - 1; i >= 0; i--) {
            const ev  = events[i];
            const tIdx = tracks.findIndex(t => t.id === ev.trackId);
            if (tIdx < 0) continue;

            const ty = this.RULER_H + tIdx * this.TRACK_H - this.state.scrollY;
            if (ty > this.state.height || ty + this.TRACK_H < 0) continue;

            // Calcul de la sous-ligne
            const row    = layout.get(ev.id) || 0;
            const maxRow = layout.trackMaxRows.get(ev.trackId) || 1;
            const subH   = (this.TRACK_H - this.GUARD * 2) / maxRow;
            const iy     = ty + this.GUARD + row * subH;

            const sx = this._worldToScreen(ev.startDate);

            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                const sw = Math.max(8, this._worldToScreen(ev.endDate) - sx);
                if (lx >= sx && lx <= sx + sw && ly >= iy && ly <= iy + subH) return ev;
            } else {
                if (Math.hypot(lx - sx, ly - (iy + subH / 2)) <= 14) return ev;
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
        const tracks = TimelineProRepository.getTracks();
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


    // ═══════════════════════════════════════════════════════════════════════════
    //  DRAW
    // ═══════════════════════════════════════════════════════════════════════════
    static draw() {
        const ctx = this.state.ctx;
        if (!ctx) return;
        const { width: W, height: H } = this.state;

        // Calcul du layout une seule fois pour tout le cycle de rendu
        const layout = this._getPackedLayout();

        // Background
        const p = this._p();
        ctx.fillStyle = p.canvasBg;
        ctx.fillRect(0, 0, W, H);

        this._drawTrackBG(ctx, W, H);
        this._drawBands(ctx, W, H);
        this._drawGrid(ctx, W, H);
        this._drawRuler(ctx, W);
        this._drawTrackHeaders(ctx, H);
        this._drawLinks(ctx, H, layout);        // ── liaisons Bezier
        this._drawEvents(ctx, H, layout);
        this._drawLinkPreview(ctx, H, layout);  // ── prévisualisation en cours
        this._drawCurrentTimeLine(ctx, H);
        this._clipHeader(ctx, W, H);
        this._drawBandLabels(ctx, W);    // libellés dans la règle — toujours au-dessus
    }

    // ─── TRACK BACKGROUNDS ────────────────────────────────────────────────────
    static _drawTrackBG(ctx, W, H) {
        const p = this._p();
        const tracks = TimelineProRepository.getTracks();
        tracks.forEach((tr, i) => {
            const ty = this.RULER_H + i * this.TRACK_H - this.state.scrollY;
            if (ty + this.TRACK_H < this.RULER_H || ty > H) return;

            ctx.fillStyle = i % 2 === 0 ? p.trackEven : p.trackOdd;
            ctx.fillRect(this.HEADER_W, ty, W - this.HEADER_W, this.TRACK_H);

            // Bottom separator
            ctx.strokeStyle = p.separator;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.HEADER_W, ty + this.TRACK_H);
            ctx.lineTo(W, ty + this.TRACK_H);
            ctx.stroke();
        });

        // Zone vide sous les pistes
        const totalH = tracks.length * this.TRACK_H;
        const emptyY = this.RULER_H + totalH - this.state.scrollY;
        if (emptyY < H) {
            ctx.fillStyle = p.canvasBg;
            ctx.fillRect(this.HEADER_W, emptyY, W - this.HEADER_W, H - emptyY);
        }
    }

    // ─── FULL-HEIGHT BANDS ────────────────────────────────────────────────────
    static _drawBands(ctx, W, H) {
        const events = TimelineProRepository.getAll();

        events.forEach(ev => {
            if (!ev.showBand || ev.endDate == null || ev.endDate === ev.startDate) return;

            const sx = this._worldToScreen(ev.startDate);
            const ex = this._worldToScreen(ev.endDate);
            if (ex < this.HEADER_W || sx > W) return;

            const x  = Math.max(sx, this.HEADER_W);
            const x2 = Math.min(ex, W);
            const bw = x2 - x;
            if (bw <= 0) return;

            const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const isSel = this.state.selectedId === ev.id;

            ctx.save();

            const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
            const [r,g,b] = hex2rgb(color);

            // Main band fill
            ctx.fillStyle = `rgba(${r},${g},${b},${isSel ? 0.13 : 0.07})`;
            ctx.fillRect(x, this.RULER_H, bw, H - this.RULER_H);

            // Left border
            ctx.strokeStyle = `rgba(${r},${g},${b},${isSel ? 0.55 : 0.30})`;
            ctx.lineWidth   = isSel ? 2 : 1;
            ctx.setLineDash(isSel ? [] : [5, 4]);
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
            const isSel = this.state.selectedId === ev.id;
            const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
            const [r,g,b] = hex2rgb(color);

            ctx.save();

            // Clip to ruler strip
            ctx.beginPath();
            ctx.rect(x, 0, bw, RH);
            ctx.clip();

            // Colored band in ruler
            ctx.fillStyle = `rgba(${r},${g},${b},${isSel ? 0.18 : 0.10})`;
            ctx.fillRect(x, 0, bw, RH);

            // Label centered in ruler strip
            ctx.fillStyle    = `rgba(${r},${g},${b},${isSel ? 1 : 0.75})`;
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
    static _drawTrackHeaders(ctx, H) {
        const W = this.HEADER_W;
        const p = this._p();
        const tracks = TimelineProRepository.getTracks();

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
            const ty = this.RULER_H + i * this.TRACK_H - this.state.scrollY;
            if (ty + this.TRACK_H < this.RULER_H || ty > H) return;

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, Math.max(ty, this.RULER_H), W, Math.min(ty + this.TRACK_H, H) - Math.max(ty, this.RULER_H));
            ctx.clip();

            const trColor = tr.color?.startsWith('#') ? tr.color : '#d4af37';
            ctx.fillStyle = trColor;
            ctx.fillRect(0, ty, 3, this.TRACK_H);

            ctx.fillStyle    = p.headerTitle;
            ctx.font         = '600 12px Inter,system-ui,sans-serif';
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._truncate(ctx, tr.title, W - 40), 14, ty + this.TRACK_H / 2 - 6);

            const count = TimelineProRepository.getAll().filter(e => e.trackId === tr.id).length;
            ctx.fillStyle = p.headerSub;
            ctx.font      = '400 10px Inter,system-ui,sans-serif';
            ctx.fillText(count + ' événement' + (count > 1 ? 's' : ''), 14, ty + this.TRACK_H / 2 + 10);

            ctx.strokeStyle = p.separator;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(0, ty + this.TRACK_H);
            ctx.lineTo(W, ty + this.TRACK_H);
            ctx.stroke();

            ctx.restore();
        });
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    static _drawEvents(ctx, H, layout = null) {
        const events = TimelineProRepository.getAll();
        const tracks = TimelineProRepository.getTracks();
        const W = this.state.width;
        if (!layout) layout = this._getPackedLayout();

        events.forEach(ev => {
            const tIdx = tracks.findIndex(t => t.id === ev.trackId);
            if (tIdx < 0) return;

            const ty   = this.RULER_H + tIdx * this.TRACK_H - this.state.scrollY;
            if (ty + this.TRACK_H < this.RULER_H || ty > H) return;

            // Calcul de la sous-ligne
            const row    = layout.get(ev.id) || 0;
            const maxRow = layout.trackMaxRows.get(ev.trackId) || 1;
            const subH   = (this.TRACK_H - this.GUARD * 2) / maxRow;
            const iy     = ty + this.GUARD + row * subH;

            const sx    = this._worldToScreen(ev.startDate);
            const cy    = iy + subH / 2;
            const isSel = this.state.selectedId === ev.id;
            const isHov = this.state.hoveredId  === ev.id;
            const isDrag= this.state.dragEventId === ev.id;

            const color     = ev.color?.startsWith('#') ? ev.color : '#d4af37';
            const textColor = ev.textColor?.startsWith('#') ? ev.textColor : '#ffffff';

            ctx.save();
            ctx.globalAlpha = isDrag ? 0.65 : 1;

            // ── CLIP à la zone de la piste ─────────────────────────────────
            // On laisse 1px au-dessus/dessous pour que la sélection glow soit
            // visible sans déborder sur la swimlane adjacente.
            const clipTop    = Math.max(this.RULER_H, ty);
            const clipBottom = Math.min(H, ty + this.TRACK_H);
            ctx.beginPath();
            ctx.rect(this.HEADER_W, clipTop, W - this.HEADER_W, clipBottom - clipTop);
            ctx.clip();

            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                // ── PERIOD BAR ──────────────────────────────────────────────
                const ex = this._worldToScreen(ev.endDate);
                const bw = Math.max(6, ex - sx);
                const bh = subH - 2; // -2 pour un petit espace entre lignes
                const by = iy + 1;

                // Selection glow
                if (isSel || isHov) {
                    ctx.shadowColor  = color + '99';
                    ctx.shadowBlur   = isSel ? 16 : 8;
                    ctx.shadowOffsetY = 1;
                }

                this._drawBar(ctx, ev.style || 'solid', sx, by, bw, bh, color, isSel, isHov);

                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

                // Selection border (dashes)
                if (isSel) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth   = 2;
                    ctx.setLineDash([5, 4]);
                    this._rrect(ctx, sx - 2, by - 2, bw + 4, bh + 4, 7);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Label
                if (bw > 22) {
                    ctx.fillStyle    = textColor;
                    ctx.font         = `${isSel ? 600 : 500} 12px Inter,system-ui,sans-serif`;
                    ctx.textAlign    = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor  = 'rgba(0,0,0,.4)';
                    ctx.shadowBlur   = 3;
                    ctx.fillText(this._truncate(ctx, ev.title, bw - 20), sx + 10, by + bh / 2);
                    ctx.shadowBlur = 0;
                }

                // Tags badges (small dots)
                if (ev.tags?.length && bw > 60) {
                    ev.tags.slice(0, 3).forEach((tag, ti) => {
                        const tx = sx + bw - 10 - ti * 8;
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        ctx.beginPath();
                        ctx.arc(tx, by + bh - 6, 3, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

            } else {
                // ── POINT EVENT ─────────────────────────────────────────────
                const R = isSel ? 12 : 10;

                if (isSel || isHov) {
                    ctx.shadowColor  = color + 'bb';
                    ctx.shadowBlur   = isSel ? 20 : 12;
                }

                // Outer ring
                ctx.strokeStyle = color;
                ctx.lineWidth   = isSel ? 3 : 2;
                const p = this._p();
                ctx.fillStyle   = isSel ? color : p.trackEven;
                ctx.beginPath();
                ctx.arc(sx, cy, R, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.shadowBlur = 0;

                // Inner dot
                ctx.fillStyle = isSel ? '#fff' : color;
                ctx.beginPath();
                ctx.arc(sx, cy, isSel ? 4.5 : 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Label above
                ctx.fillStyle    = isSel ? color : p.headerTitle;
                ctx.font         = `${isSel ? 700 : 500} 11px Inter,system-ui,sans-serif`;
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'bottom';
                ctx.shadowColor  = 'rgba(0,0,0,.3)';
                ctx.shadowBlur   = 4;
                ctx.fillText(this._truncate(ctx, ev.title, 150), sx, cy - R - 5);
                ctx.shadowBlur = 0;

                // Tags: tiny colored dots below label
                if (ev.tags?.length) {
                    ev.tags.slice(0, 3).forEach((tag, ti) => {
                        ctx.fillStyle = color + 'aa';
                        ctx.beginPath();
                        ctx.arc(sx + (ti - 1) * 8, cy - R - 16, 3, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                // Stem
                ctx.strokeStyle = color + '44';
                ctx.lineWidth   = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(sx, cy + R);
                ctx.lineTo(sx, ty + this.TRACK_H - 6);
                ctx.stroke();
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
    //  CSS COLOR UTILITIES  (thème clair / sombre adaptatif)
    // ═══════════════════════════════════════════════════════════════════════════

    /** Détecte si le thème courant est sombre */
    static _isDark() {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
        if (!bg.startsWith('#')) return false;
        const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }

    /**
     * Palette sémantique adaptée au thème, indépendante de --bg-card.
     * Retourne les couleurs canvas correctes selon le mode clair/sombre.
     */
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
            const r = parseInt(raw.slice(1,3),16);
            const g = parseInt(raw.slice(3,5),16);
            const b = parseInt(raw.slice(5,7),16);
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

    // ═══════════════════════════════════════════════════════════════════════════
    //  MISC UTILS
    // ═══════════════════════════════════════════════════════════════════════════
    static _rrect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y,     x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x,     y + h, r);
        ctx.arcTo(x,     y + h, x,     y,     r);
        ctx.arcTo(x,     y,     x + w, y,     r);
        ctx.closePath();
    }

    static _truncate(ctx, text, maxW) {
        if (!text) return '';
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
        return t + '…';
    }

    // ─── Public: refresh after external data change ────────────────────────────
    static refresh() { this.draw(); }

    // ═══════════════════════════════════════════════════════════════════════════
    //  LIAISONS BÉZIER
    // ═══════════════════════════════════════════════════════════════════════════

    /** Active / désactive le mode liaison */
    static _toggleLinkMode() {
        this.state.linkMode   = !this.state.linkMode;
        this.state.linkFromId = null;
        const btn = document.getElementById('tlp-link-mode');
        if (btn) {
            const on = this.state.linkMode;
            btn.style.background = on ? 'var(--primary-color,#ff8c42)' : '';
            btn.style.color      = on ? '#fff' : '';
        }
        this._updateLinkHint(
            this.state.linkMode
                ? 'Cliquer sur un \u00e9v\u00e9nement source pour commencer une liaison'
                : 'Double-clic sur une piste pour cr\u00e9er un \u00e9v\u00e9nement'
        );
        this.state.canvas.style.cursor = this.state.linkMode ? 'crosshair' : 'default';
        this.draw();
    }

    static _updateLinkHint(text) {
        const h = document.getElementById('tlp-hint');
        if (h) h.textContent = text;
    }

    /**
     * Retourne le point d'attache central d'un événement (barre ou point) en px canvas.
     * @returns {{x:number, y:number}|null}
     */
    static _eventCenter(ev, layout = null) {
        const tracks = TimelineProRepository.getTracks();
        const tIdx   = tracks.findIndex(t => t.id === ev.trackId);
        if (tIdx < 0) return null;

        if (!layout) layout = this._getPackedLayout();
        const row    = layout.get(ev.id) || 0;
        const maxRow = layout.trackMaxRows.get(ev.trackId) || 1;
        const subH   = (this.TRACK_H - this.GUARD * 2) / maxRow;

        const ty = this.RULER_H + tIdx * this.TRACK_H - this.state.scrollY;
        const cy = ty + this.GUARD + (row + 0.5) * subH;
        const sx = this._worldToScreen(ev.startDate);
        if (ev.endDate != null && ev.endDate !== ev.startDate) {
            const ex = this._worldToScreen(ev.endDate);
            return { x: (sx + ex) / 2, y: cy };
        }
        return { x: sx, y: cy };
    }

    /**
     * Hit-test d'un lien : renvoie le lien si le point (px, py) est proche de la courbe.
     * Utilise un échantillonnage de la courbe de Bézier.
     */
    static _hitTestLink(px, py) {
        const links  = TimelineProRepository.getLinks();
        const events = TimelineProRepository.getAll();
        const THRESH = 8;

        for (let i = links.length - 1; i >= 0; i--) {
            const lnk = links[i];
            const from = events.find(e => e.id === lnk.fromId);
            const to   = events.find(e => e.id === lnk.toId);
            if (!from || !to) continue;
            const p1 = this._eventCenter(from, layout);
            const p2 = this._eventCenter(to, layout);
            if (!p1 || !p2) continue;

            const curv = lnk.curvature ?? 80;
            const cp1x = p1.x + (p2.x - p1.x) / 3;
            const cp1y = p1.y - curv;
            const cp2x = p1.x + 2 * (p2.x - p1.x) / 3;
            const cp2y = p2.y - curv;

            // Échantillonner 30 points
            for (let t = 0; t <= 1; t += 1 / 30) {
                const mt = 1 - t;
                const bx = mt*mt*mt*p1.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p2.x;
                const by = mt*mt*mt*p1.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p2.y;
                if (Math.hypot(bx - px, by - py) <= THRESH) return lnk;
            }
        }
        return null;
    }

    /** Dessine toutes les liaisons */
    static _drawLinks(ctx, H, layout = null) {
        const links  = TimelineProRepository.getLinks();
        const events = TimelineProRepository.getAll();

        links.forEach(lnk => {
            const from = events.find(e => e.id === lnk.fromId);
            const to   = events.find(e => e.id === lnk.toId);
            if (!from || !to) return;
            const p1 = this._eventCenter(from, layout);
            const p2 = this._eventCenter(to, layout);
            if (!p1 || !p2) return;

            const isSel = this.state.selectedLinkId === lnk.id;
            const isHov = this.state.hoveredLinkId  === lnk.id;
            this._drawBezierLink(ctx, lnk, p1, p2, isSel, isHov);
        });
    }

    /** Prévisualisation du lien en cours de création */
    static _drawLinkPreview(ctx, H, layout = null) {
        if (!this.state.linkMode || !this.state.linkFromId) return;
        const events = TimelineProRepository.getAll();
        const from   = events.find(e => e.id === this.state.linkFromId);
        if (!from) return;
        const p1 = this._eventCenter(from, layout);
        if (!p1) return;

        // Pulsation : cercle autour de la source
        const color = from.color?.startsWith('#') ? from.color : '#d4af37';
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Ligne élastique vers la souris
        const p2 = { x: this.state.mouseX, y: this.state.mouseY };
        const curv = 80;
        const cp1x = p1.x + (p2.x - p1.x) / 3;
        const cp1y = p1.y - curv;
        const cp2x = p1.x + 2 * (p2.x - p1.x) / 3;
        const cp2y = p2.y - curv;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
    }

    /** Dessine une seule courbe de Bézier entre p1 et p2 */
    static _drawBezierLink(ctx, lnk, p1, p2, isSel, isHov) {
        const color  = lnk.color?.startsWith('#') ? lnk.color : '#d4af37';
        const width  = (lnk.width || 2) * (isSel ? 1.5 : 1);
        const curv   = lnk.curvature ?? 80;

        const cp1x = p1.x + (p2.x - p1.x) / 3;
        const cp1y = p1.y - curv;
        const cp2x = p1.x + 2 * (p2.x - p1.x) / 3;
        const cp2y = p2.y - curv;

        // Motif
        const dash = lnk.pattern === 'dashed' ? [10, 6]
                   : lnk.pattern === 'dotted' ? [2, 5]
                   : [];

        ctx.save();

        // Glow si sélectionné / survolé
        if (isSel || isHov) {
            ctx.shadowColor  = color + 'aa';
            ctx.shadowBlur   = isSel ? 14 : 7;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth   = width;
        ctx.lineCap     = 'round';
        ctx.setLineDash(dash);
        ctx.globalAlpha = isSel ? 1 : (isHov ? 0.9 : 0.75);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Extrémité START
        if (lnk.capStart && lnk.capStart !== 'none') {
            // Direction tangente en t=0 (vers cp1)
            const dx = cp1x - p1.x, dy = cp1y - p1.y;
            const angle = Math.atan2(dy, dx);
            this._drawLinkCap(ctx, lnk.capStart, p1.x, p1.y, angle + Math.PI, color, width);
        }
        // Extrémité END
        if (lnk.capEnd && lnk.capEnd !== 'none') {
            // Direction tangente en t=1 (depuis cp2)
            const dx = p2.x - cp2x, dy = p2.y - cp2y;
            const angle = Math.atan2(dy, dx);
            this._drawLinkCap(ctx, lnk.capEnd, p2.x, p2.y, angle, color, width);
        }

        // Label
        if (lnk.label) this._drawLinkLabel(ctx, lnk, cp1x, cp1y, cp2x, cp2y);

        ctx.restore();
    }

    /**
     * Dessine une extrémité sur la courbe.
     * @param {'arrow'|'circle'|'diamond'} type
     * @param {number} x  point d'attache
     * @param {number} y
     * @param {number} angle  direction de la pointe (rad)
     */
    static _drawLinkCap(ctx, type, x, y, angle, color, lw) {
        const sz = Math.max(12, lw * 5.5);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle   = color;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([]);
        ctx.globalAlpha = 1; 
        
        // Petite ombre pour le contraste
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur  = 3;
        ctx.shadowOffsetY = 1;

        ctx.beginPath();
        if (type === 'arrow') {
            ctx.moveTo(0, 0);
            ctx.lineTo(-sz, -sz * 0.45);
            ctx.lineTo(-sz * 0.65, 0);
            ctx.lineTo(-sz, sz * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (type === 'circle') {
            ctx.arc(-sz * 0.4, 0, sz * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'diamond') {
            ctx.moveTo(0, 0);
            ctx.lineTo(-sz * 0.55, -sz * 0.4);
            ctx.lineTo(-sz, 0);
            ctx.lineTo(-sz * 0.55, sz * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static _drawLinkLabel(ctx, lnk, cp1x, cp1y, cp2x, cp2y) {
        const mx = (cp1x + cp2x) / 2;
        const my = (cp1y + cp2y) / 2 - 8;
        ctx.save();
        ctx.font      = '500 11px Inter,system-ui,sans-serif';
        ctx.fillStyle = lnk.color?.startsWith('#') ? lnk.color : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'var(--bg-primary,#fff)';
        ctx.shadowBlur  = 4;
        ctx.fillText(lnk.label, mx, my);
        ctx.restore();
    }

    // ─── TOOLTIP ─────────────────────────────────────────────────────────────────
    static _showTooltip(ev, mouseX, mouseY) {
        const tip = document.getElementById('tlp-tooltip');
        if (!tip) return;

        const color = ev.color?.startsWith('#') ? ev.color : '#d4af37';
        const hasDesc = ev.description && ev.description.trim().length > 0;
        const hasTags = ev.tags?.length > 0;

        // ── Dates formatées ──
        let dateStr = '';
        if (ev.startDate != null) {
            dateStr = this._fmtDate(ev.startDate);
            if (ev.endDate != null && ev.endDate !== ev.startDate) {
                dateStr += ' → ' + this._fmtDate(ev.endDate);
            }
        }

        // ── Tags HTML ──
        const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
        const [r,g,b] = hex2rgb(color);
        const tagsHtml = hasTags
            ? `<div class="tlp-tip-tags">${ev.tags.map(t =>
                `<span class="tlp-tip-tag" style="background:rgba(${r},${g},${b},.15);color:${color}">${t}</span>`
              ).join('')}</div>`
            : '';

        // ── Description ──
        const descHtml = hasDesc
            ? `<div class="tlp-tip-desc">${ev.description.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
            : '';

        // ── Indicateur de verrouillage ──
        const lockIcon = ev.isLocked
            ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:.5;margin-left:.3rem"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
            : '';

        tip.innerHTML = `
            <div class="tlp-tip-header">
                <div class="tlp-tip-color-dot" style="background:${color};box-shadow:0 0 0 3px rgba(${r},${g},${b},.2)"></div>
                <div class="tlp-tip-title">${(ev.title || '').replace(/</g,'&lt;')}</div>
                ${lockIcon}
            </div>
            <div class="tlp-tip-body">
                ${dateStr ? `<div class="tlp-tip-dates">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    ${dateStr}
                </div>` : ''}
                ${descHtml}
                ${tagsHtml}
                ${!hasDesc ? '<div class="tlp-tip-hint">Cliquer pour voir & éditer</div>' : '<div class="tlp-tip-hint">Cliquer pour éditer</div>'}
            </div>
        `;

        tip.style.display = 'block';

        // ── Positionnement intelligent ──
        // On lit la taille après injection du contenu
        requestAnimationFrame(() => {
            const tw = tip.offsetWidth  || 320;
            const th = tip.offsetHeight || 100;
            const gap = 18;
            let left = mouseX + gap;
            let top  = mouseY - th / 2;

            // Débordement droite → coller à gauche du curseur
            if (left + tw > window.innerWidth - 8) {
                left = mouseX - tw - gap;
            }
            // Débordement bas
            if (top + th > window.innerHeight - 8) {
                top = window.innerHeight - th - 8;
            }
            // Débordement haut
            if (top < 8) top = 8;

            tip.style.left = left + 'px';
            tip.style.top  = top  + 'px';
        });
    }

    static _hideTooltip() {
        const tip = document.getElementById('tlp-tooltip');
        if (tip) tip.style.display = 'none';
    }
}
