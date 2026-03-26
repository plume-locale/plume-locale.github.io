/**
 * @class TimelineProViewModel
 * @description Orchestre les actions CRUD et le panneau d'édition de la chronologie.
 */
class TimelineProViewModel {

    // ─── PANEL CONTAINER ──────────────────────────────────────────────────────
    static _panel() { return document.getElementById('tlp-panel'); }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CRUD ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    static addEvent() {
        const tracks = TimelineProRepository.getTracks();
        const state  = TimelineProView.state;
        const centerWorld = TimelineProView._screenToWorld(
            (state.width + TimelineProView.HEADER_W) / 2
        );
        const ev = new TimelineProModel({
            title:   Localization.t('modal.timeline.placeholder_title'),
            startDate: Math.round(centerWorld),
            trackId: tracks[0]?.id ?? 'default',
            color:   '#d4af37',
        });
        TimelineProRepository.save(ev);
        if (typeof saveProject === 'function') saveProject();
        TimelineProView.draw();
        this.openPanel(ev.id);
    }

    static addEventAt(t, trackId) {
        const ev = new TimelineProModel({
            title: Localization.t('modal.timeline.placeholder_title'),
            startDate: t,
            trackId,
            color: '#d4af37',
        });
        TimelineProRepository.save(ev);
        if (typeof saveProject === 'function') saveProject();
        TimelineProView.draw();
        this.openPanel(ev.id);
    }

    static deleteEvent(id) {
        TimelineProRepository.delete(id);
        TimelineProRepository.deleteLinksForEvent(id);   // nettoyer les liens orphelins
        TimelineProView.state.selectedId     = null;
        TimelineProView.state.selectedLinkId = null;
        this.closePanel();
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CRUD PISTES
    // ═══════════════════════════════════════════════════════════════════════════

    static addTrack() {
        const tracks = TimelineProRepository.getTracks();
        const palette = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#e91e63'];
        const color  = palette[tracks.length % palette.length];
        const trk = new TimelineProTrack({
            title: 'Piste ' + (tracks.length + 1),
            color,
            order: tracks.length,
        });
        TimelineProRepository.saveTrack(trk);
        if (typeof saveProject === 'function') saveProject();
        this.openTracksPanel();
    }

    static renameTrack(id, title) {
        const tr = TimelineProRepository.getTracks().find(t => t.id === id);
        if (tr) { tr.title = title.trim() || tr.title; TimelineProRepository.saveTrack(tr); }
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    static deleteTrack(id) {
        if (id === 'default') { alert('La piste par défaut ne peut pas être supprimée.'); return; }
        if (!confirm('Supprimer cette piste ? Les événements seront déplacés vers la piste par défaut.')) return;
        TimelineProRepository.deleteTrack(id);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
        this.openTracksPanel();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PANEL (shared side panel)
    // ═══════════════════════════════════════════════════════════════════════════

    static openPanel(id) {
        const ev    = TimelineProRepository.getById(id);
        const panel = this._panel();
        if (!ev || !panel) return;

        const tracks  = TimelineProRepository.getTracks();
        const isHex   = c => c?.startsWith('#');
        const bgColor = isHex(ev.color) ? ev.color : '#d4af37';
        const txColor = isHex(ev.textColor) ? ev.textColor : '#ffffff';

        // ── Style presets definition ──────────────────────────────────────────
        const STYLES = [
            { id: 'solid',    label: 'Plein',    svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="3" fill="currentColor"/></svg>` },
            { id: 'gradient', label: 'Dégradé',  svg: `<svg width="36" height="16" viewBox="0 0 36 16"><defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="currentColor" stop-opacity=".4"/><stop offset="100%" stop-color="currentColor"/></linearGradient></defs><rect x="1" y="2" width="34" height="12" rx="3" fill="url(#gd)"/></svg>` },
            { id: 'outline',  label: 'Contour',  svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1.5" y="2.5" width="33" height="11" rx="3" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.5"/></svg>` },
            { id: 'striped',  label: 'Rayé',     svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="3" fill="currentColor" fill-opacity=".7"/><line x1="8" y1="2" x2="2" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/><line x1="17" y1="2" x2="11" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/><line x1="26" y1="2" x2="20" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/></svg>` },
            { id: 'arrow',    label: 'Flèche',   svg: `<svg width="36" height="16" viewBox="0 0 36 16"><path d="M1 2h28l6 6-6 6H1z" fill="currentColor" rx="3"/></svg>` },
            { id: 'pill',     label: 'Pilule',   svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="6" fill="currentColor"/></svg>` },
        ];

        panel.style.display = 'flex';
        panel.innerHTML = `
<div style="padding:1.25rem 1.25rem 0;display:flex;flex-direction:column;gap:0;height:100%;">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
    <span style="font-weight:700;font-size:.95rem;color:var(--text-primary);">${Localization.t('timeline.pro.panel.edit_title')}</span>
    <button id="tlp-p-close" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;line-height:1;padding:.1rem .35rem;border-radius:4px;">×</button>
  </div>

  <!-- Scroll area -->
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;padding-bottom:1rem;">

    <!-- Title -->
    <div>
      <label style="${this._labelStyle()}">Titre</label>
      <textarea id="tlp-p-title" style="${this._inputStyle()}height:44px;resize:vertical;" placeholder="Nom de l'événement">${this._esc(ev.title)}</textarea>
    </div>

    <!-- Start / End -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;">
      <div>
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.start')}</label>
        ${TimelineProView.state.dateMode === 'calendar'
            ? `<input id="tlp-p-start" type="date" value="${TimelineProView._numToISO(ev.startDate)}" style="${this._inputStyle()}">`
            : `<input id="tlp-p-start" type="number" value="${ev.startDate}" style="${this._inputStyle()}" step="any">`
        }
      </div>
      <div>
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.end')}</label>
        ${TimelineProView.state.dateMode === 'calendar'
            ? `<input id="tlp-p-end" type="date" value="${TimelineProView._numToISO(ev.endDate)}" style="${this._inputStyle()}">`
            : `<input id="tlp-p-end" type="number" value="${ev.endDate ?? ''}" placeholder="${Localization.t('timeline.pro.placeholder.punctual')}" style="${this._inputStyle()}" step="any">`
        }
      </div>
    </div>

    <!-- Track -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.track')}</label>
      <select id="tlp-p-track" style="${this._inputStyle()}">
        ${tracks.map(t => `<option value="${t.id}" ${t.id === ev.trackId ? 'selected' : ''}>${this._esc(t.title)}</option>`).join('')}
      </select>
    </div>

    <!-- ── Design section ─────────────────────────────────────────── -->
    <div style="border-top:1px solid var(--border-color);padding-top:1rem;">
      <label style="${this._labelStyle()}">Design</label>

      <!-- Style presets -->
      <div style="margin-bottom:.85rem;">
        <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem;">Style visuel</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;" id="tlp-style-grid">
          ${STYLES.map(s => `
            <button data-style="${s.id}" title="${s.label}" style="
                display:flex;flex-direction:column;align-items:center;gap:.3rem;
                padding:.5rem .25rem;border-radius:6px;border:2px solid ${ev.style === s.id ? 'var(--primary-color)' : 'var(--border-color)'};
                background:${ev.style === s.id ? 'rgba(var(--primary-color-rgb,255,140,66),.08)' : 'var(--bg-secondary)'};
                cursor:pointer;transition:border-color .15s,background .15s;color:${bgColor};">
              ${s.svg}
              <span style="font-size:.7rem;color:var(--text-secondary);font-weight:500;">${s.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <!-- Colors row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.75rem;">
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem;">Couleur fond</div>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <input id="tlp-p-color" type="color" value="${bgColor}"
                   style="width:36px;height:32px;border:2px solid var(--border-color);border-radius:6px;cursor:pointer;background:none;padding:1px;flex-shrink:0;">
            <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
              ${['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#d4af37','#1abc9c']
                .map(c => `<div onclick="document.getElementById('tlp-p-color').value='${c}';TimelineProViewModel._applyField('${id}','color','${c}')"
                                style="width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;border:1px solid rgba(0,0,0,.1);transition:transform .12s;"
                                onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''"></div>`).join('')}
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem;">Couleur texte</div>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <input id="tlp-p-textcolor" type="color" value="${txColor}"
                   style="width:36px;height:32px;border:2px solid var(--border-color);border-radius:6px;cursor:pointer;background:none;padding:1px;flex-shrink:0;">
            <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
              ${['#ffffff','#000000','#1a1a2e','#fffde7','#e3f2fd','#fce4ec']
                .map(c => `<div onclick="document.getElementById('tlp-p-textcolor').value='${c}';TimelineProViewModel._applyField('${id}','textColor','${c}')"
                                style="width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;border:1px solid rgba(0,0,0,.2);transition:transform .12s;"
                                onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''"></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div><!-- /design -->

    <!-- ── Tags ──────────────────────────────────────────────────── -->
    <div style="border-top:1px solid var(--border-color);padding-top:1rem;">
      <label style="${this._labelStyle()}">Tags</label>
      <div id="tlp-tags-wrap" style="display:flex;flex-wrap:wrap;gap:.35rem;min-height:28px;padding:.4rem;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-secondary);cursor:text;align-items:center;">
        ${(ev.tags||[]).map(tag => `
          <span style="display:inline-flex;align-items:center;gap:.3rem;background:var(--primary-color);color:#fff;font-size:.75rem;font-weight:600;padding:.2rem .55rem;border-radius:20px;">
            ${this._esc(tag)}
            <span onclick="TimelineProViewModel._removeTag('${id}','${this._esc(tag)}')" style="cursor:pointer;opacity:.8;font-size:.9rem;line-height:1;">&times;</span>
          </span>`).join('')}
        <input id="tlp-tag-input" placeholder="Ajouter un tag…" style="border:none;outline:none;background:transparent;font-size:.8rem;color:var(--text-primary);min-width:100px;flex:1;">
      </div>
    </div>

    <!-- ── Description ────────────────────────────────────────────── -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.desc')}</label>
      <textarea id="tlp-p-desc" rows="4" style="${this._inputStyle()}resize:vertical;line-height:1.6;" placeholder="Notes, contexte…">${this._esc(ev.description)}</textarea>
    </div>

    <!-- Lock -->
    <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.4rem .5rem;border-radius:6px;background:var(--bg-secondary);">
      <input id="tlp-p-lock" type="checkbox" ${ev.isLocked ? 'checked' : ''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary-color);">
      <span style="font-size:.8rem;color:var(--text-secondary);">Verrouiller (empêcher le glisser-déposer)</span>
    </label>

    <!-- Band -->
    <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.4rem .5rem;border-radius:6px;background:var(--bg-secondary);">
      <input id="tlp-p-band" type="checkbox" ${ev.showBand ? 'checked' : ''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary-color);">
      <div style="display:flex;flex-direction:column;gap:.1rem;">
        <span style="font-size:.8rem;color:var(--text-secondary);font-weight:500;">Bande pleine hauteur</span>
        <span style="font-size:.72rem;color:var(--text-muted);">Colorier toute la colonne verticale</span>
      </div>
    </label>

  </div><!-- /scroll -->

  <!-- Footer -->
  <div style="padding:1rem 0;border-top:1px solid var(--border-color);display:flex;gap:.5rem;">
    <button id="tlp-p-duplicate" style="
        flex:1;padding:.55rem;border-radius:6px;
        border:1px solid var(--border-color);color:var(--text-secondary);background:var(--bg-secondary);
        cursor:pointer;font-size:.82rem;font-weight:600;transition:background .15s;display:flex;align-items:center;justify-content:center;gap:.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Dupliquer
    </button>
    <button id="tlp-p-delete" style="
        flex:1;padding:.55rem;border-radius:6px;
        border:1px solid var(--accent-red,#e74c3c);color:var(--accent-red,#e74c3c);background:transparent;
        cursor:pointer;font-size:.82rem;font-weight:600;transition:background .15s;display:flex;align-items:center;justify-content:center;gap:.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      Supprimer
    </button>
  </div>

</div>`;

        // ── Bindings ──────────────────────────────────────────────────────────
        const update = (save = false) => {
            const raw = TimelineProRepository.getById(id);
            if (!raw) return;
            raw.title       = document.getElementById('tlp-p-title').value;
            const sVal      = document.getElementById('tlp-p-start').value;
            const eVal      = document.getElementById('tlp-p-end').value;
            raw.startDate   = TimelineProView._parseDate(sVal) ?? 0;
            raw.endDate     = eVal === '' ? null : (TimelineProView._parseDate(eVal) ?? null);
            raw.trackId     = document.getElementById('tlp-p-track').value;
            raw.color       = document.getElementById('tlp-p-color').value;
            raw.textColor   = document.getElementById('tlp-p-textcolor').value;
            raw.description = document.getElementById('tlp-p-desc').value;
            raw.isLocked    = document.getElementById('tlp-p-lock').checked;
            raw.showBand    = document.getElementById('tlp-p-band')?.checked ?? false;
            TimelineProRepository.save(raw);
            TimelineProView.draw();
            if (save && typeof saveProject === 'function') saveProject();
        };

        ['tlp-p-title','tlp-p-start','tlp-p-end','tlp-p-track','tlp-p-desc'].forEach(k => {
            document.getElementById(k)?.addEventListener('input', () => update(false));
            document.getElementById(k)?.addEventListener('change', () => update(true));
        });
        document.getElementById('tlp-p-color')?.addEventListener('input', () => update(false));
        document.getElementById('tlp-p-textcolor')?.addEventListener('input', () => update(false));
        document.getElementById('tlp-p-lock')?.addEventListener('change', () => update(true));
        document.getElementById('tlp-p-band')?.addEventListener('change', () => update(true));


        // Style grid
        document.getElementById('tlp-style-grid')?.querySelectorAll('button[data-style]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyField(id, 'style', btn.dataset.style);
                // Refresh panel highlights
                document.querySelectorAll('#tlp-style-grid button').forEach(b => {
                    const sel = b.dataset.style === btn.dataset.style;
                    b.style.borderColor = sel ? 'var(--primary-color)' : 'var(--border-color)';
                    b.style.background  = sel ? 'rgba(var(--primary-color-rgb,255,140,66),.08)' : 'var(--bg-secondary)';
                });
            });
        });

        // Tags
        document.getElementById('tlp-tags-wrap')?.addEventListener('click', () =>
            document.getElementById('tlp-tag-input')?.focus()
        );
        document.getElementById('tlp-tag-input')?.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
                e.preventDefault();
                this._addTag(id, e.target.value.trim());
            } else if (e.key === 'Backspace' && !e.target.value) {
                const raw = TimelineProRepository.getById(id);
                if (raw?.tags?.length) this._removeTag(id, raw.tags[raw.tags.length - 1]);
            }
        });

        // Close
        document.getElementById('tlp-p-close')?.addEventListener('click', () => {
            this.closePanel();
            TimelineProView.state.selectedId = null;
            TimelineProView.draw();
        });

        // Duplicate
        document.getElementById('tlp-p-duplicate')?.addEventListener('click', () => this.duplicateEvent(id));

        // Delete
        const dBtn = document.getElementById('tlp-p-delete');
        dBtn?.addEventListener('click', () => this.deleteEvent(id));
        dBtn?.addEventListener('mouseenter', () => { dBtn.style.background = 'rgba(231,76,60,.08)'; });
        dBtn?.addEventListener('mouseleave', () => { dBtn.style.background = 'transparent'; });

        const dupBtn = document.getElementById('tlp-p-duplicate');
        dupBtn?.addEventListener('mouseenter', () => { dupBtn.style.background = 'var(--bg-tertiary,#eee)'; });
        dupBtn?.addEventListener('mouseleave', () => { dupBtn.style.background = 'var(--bg-secondary)'; });
    }

    // ── Helpers fields ────────────────────────────────────────────────────────
    static _applyField(id, field, value) {
        const ev = TimelineProRepository.getById(id);
        if (!ev) return;
        ev[field] = value;
        TimelineProRepository.save(ev);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    static _addTag(id, tag) {
        const ev = TimelineProRepository.getById(id);
        if (!ev) return;
        if (!ev.tags.includes(tag)) { ev.tags.push(tag); TimelineProRepository.save(ev); TimelineProView.draw(); }
        this.openPanel(id); // refresh tags display
    }

    static _removeTag(id, tag) {
        const ev = TimelineProRepository.getById(id);
        if (!ev) return;
        ev.tags = ev.tags.filter(t => t !== tag);
        TimelineProRepository.save(ev);
        TimelineProView.draw();
        this.openPanel(id);
    }

    // ── Duplicate ─────────────────────────────────────────────────────────────
    static duplicateEvent(id) {
        const original = TimelineProRepository.getById(id);
        if (!original) return;
        const copy = new TimelineProModel({
            ...original,
            id: undefined, // will be regenerated
            title: original.title + ' (copie)',
            startDate: original.startDate + (original.endDate ? (original.endDate - original.startDate) * 0.1 : 50),
            endDate: original.endDate
                ? original.endDate + (original.endDate - original.startDate) * 0.1
                : null,
        });
        TimelineProRepository.save(copy);
        TimelineProView.draw();
        this.openPanel(copy.id);
        TimelineProView.state.selectedId = copy.id;
        if (typeof saveProject === 'function') saveProject();
    }

    // Quick color helper (legacy + inline palette)
    static _updateColor(id, color) { this._applyField(id, 'color', color); }


    static openTracksPanel() {
        const panel = this._panel();
        if (!panel) return;
        const tracks = TimelineProRepository.getTracks();
        const PALETTE = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#16a085','#3498db','#9b59b6','#d4af37','#1abc9c','#e91e63'];

        panel.style.display = 'flex';
        panel.innerHTML = `
<div style="padding:1.25rem;display:flex;flex-direction:column;gap:0;height:100%;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
    <span style="font-weight:700;font-size:.95rem;color:var(--text-primary);">Gestion des pistes</span>
    <button id="tlp-p-close" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;line-height:1;padding:.1rem .35rem;border-radius:4px;">×</button>
  </div>

  <div id="tlp-tracks-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.75rem;">
    ${tracks.map(tr => {
        const trColor = tr.color?.startsWith('#') ? tr.color : '#aaa';
        return `
      <div class="tlp-track-wrapper" data-track-id="${tr.id}" draggable="true" style="background:var(--bg-secondary);border-radius:10px;border:1px solid var(--border-color);overflow:hidden;transition:opacity .15s;">

        <!-- Header row -->
        <div style="display:flex;align-items:center;gap:.6rem;padding:.65rem .7rem .65rem .5rem;">
          <!-- Grip / Drag handle -->
          <div style="cursor:grab;color:var(--text-muted);opacity:.5;display:flex;align-items:center;justify-content:center;padding:.2rem;" title="Déplacer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
          <!-- Color swatch / picker trigger -->
          <label title="Changer la couleur" style="cursor:pointer;flex-shrink:0;position:relative;">
            <div style="width:14px;height:38px;border-radius:4px;background:${trColor};transition:opacity .15s;"
                 onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'"></div>
            <input type="color" value="${trColor}"
                   oninput="TimelineProViewModel._trackColorInput('${tr.id}', this.value, this.closest('.tlp-track-card'))"
                   onchange="TimelineProViewModel._trackColorChange('${tr.id}', this.value)"
                   style="position:absolute;opacity:0;width:0;height:0;top:0;left:0;pointer-events:none;">
          </label>
          <!-- Title -->
          <input value="${this._esc(tr.title)}"
                 onchange="TimelineProViewModel.renameTrack('${tr.id}',this.value)"
                 style="flex:1;background:transparent;border:none;outline:none;font-size:.9rem;font-weight:600;color:var(--text-primary);">
          ${tr.id !== 'default' ? `
          <button onclick="TimelineProViewModel.deleteTrack('${tr.id}')"
                  title="Supprimer la piste"
                  style="background:none;border:none;cursor:pointer;color:var(--accent-red,#e74c3c);opacity:.6;padding:.2rem;transition:opacity .15s;"
                  onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='.6'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>` : ''}
        </div>

        <!-- Color palette row -->
        <div class="tlp-track-card" data-track-id="${tr.id}" style="display:flex;align-items:center;gap:.35rem;padding:.5rem .9rem .65rem;border-top:1px solid var(--border-color);flex-wrap:wrap;">
          ${PALETTE.map(c => `
            <div onclick="TimelineProViewModel._trackColorChange('${tr.id}','${c}')"
                 title="${c}"
                 style="width:18px;height:18px;border-radius:50%;background:${c};cursor:pointer;
                        border:2px solid ${c === trColor ? '#fff' : 'transparent'};
                        box-shadow:${c === trColor ? '0 0 0 2px '+c : 'none'};
                        transition:transform .12s,box-shadow .12s;"
                 onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''">
            </div>`).join('')}
          <!-- Custom color picker -->
          <label title="Couleur personnalisée" style="cursor:pointer;position:relative;margin-left:.1rem;">
            <div style="width:18px;height:18px;border-radius:50%;border:2px dashed var(--text-muted);display:flex;align-items:center;justify-content:center;transition:transform .12s;"
                 onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text-muted)"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <input type="color" value="${trColor}"
                   onchange="TimelineProViewModel._trackColorChange('${tr.id}', this.value)"
                   style="position:absolute;opacity:0;width:100%;height:100%;top:0;left:0;cursor:pointer;">
          </label>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color);">
    <button onclick="TimelineProViewModel.addTrack()" style="
        width:100%;padding:.6rem;border-radius:6px;
        border:1px solid var(--border-color);background:var(--bg-secondary);
        color:var(--text-primary);cursor:pointer;font-size:.85rem;font-weight:600;
        display:flex;align-items:center;justify-content:center;gap:.5rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Nouvelle piste
    </button>
    <p style="font-size:.75rem;color:var(--text-muted);margin-top:.65rem;line-height:1.5;">
      Double-cliquez sur une piste dans la chronologie pour créer un événement à cet emplacement.
    </p>
  </div>
</div>`;

        document.getElementById('tlp-p-close')?.addEventListener('click', () => this.closePanel());

        // ── Drag & Drop Natif pour réorganisation ──
        const list = document.getElementById('tlp-tracks-list');
        if (list) {
            let dragged = null;

            list.addEventListener('dragstart', e => {
                const card = e.target.closest('.tlp-track-wrapper');
                if (!card) return;
                dragged = card;
                e.dataTransfer.effectAllowed = 'move';
                // Utiliser setTimeout pour que l'opacité ne s'applique pas au ghost image de drag
                setTimeout(() => card.style.opacity = '0.4', 0);
            });

            list.addEventListener('dragover', e => {
                e.preventDefault(); // Nécessaire pour autoriser le drop
                e.dataTransfer.dropEffect = 'move';
                const card = e.target.closest('.tlp-track-wrapper');
                if (card && card !== dragged) {
                    const rect = card.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    list.insertBefore(dragged, next ? card.nextSibling : card);
                }
            });

            list.addEventListener('dragend', () => {
                if (dragged) dragged.style.opacity = '1';
                dragged = null;
                
                // Sauvegarder le nouvel ordre
                const orderedIds = [...list.querySelectorAll('.tlp-track-wrapper')].map(el => el.dataset.trackId);
                TimelineProRepository.reorderTracks(orderedIds);
                TimelineProView.draw();
                if (typeof saveProject === 'function') saveProject();
            });
        }
    }

    /** Live preview de la couleur sans sauvegarder */
    static _trackColorInput(id, color, card) {
        // Update swatch visually (live)
        const swatch = card?.previousElementSibling?.querySelector('div[style*="border-radius:4px"]');
        if (swatch) swatch.style.background = color;
    }

    /** Sauvegarde la couleur de piste et redessine */
    static _trackColorChange(id, color) {
        const tr = TimelineProRepository.getTracks().find(t => t.id === id);
        if (!tr) return;
        tr.color = color;
        TimelineProRepository.saveTrack(tr);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
        this.openTracksPanel(); // refresh selected state in palette
    }


    static closePanel() {
        const panel = this._panel();
        if (panel) panel.style.display = 'none';
    }

    // ─── Style Helpers ─────────────────────────────────────────────────────────
    static _labelStyle() {
        return 'display:block;margin-bottom:.35rem;font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);';
    }
    static _inputStyle() {
        return 'width:100%;padding:.55rem .75rem;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:.88rem;box-sizing:border-box;outline:none;transition:border-color .15s;';
    }
    static _esc(s = '') {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CRUD LIAISONS
    // ═══════════════════════════════════════════════════════════════════════════

    static createLink(fromId, toId) {
        // Éviter les doublons
        const existing = TimelineProRepository.getLinks().find(
            l => (l.fromId === fromId && l.toId === toId) ||
                 (l.fromId === toId   && l.toId === fromId)
        );
        if (existing) { alert('Une liaison entre ces deux événements existe déjà.'); return; }
        const lnk = new TimelineProLink({ fromId, toId });
        TimelineProRepository.saveLink(lnk);
        if (typeof saveProject === 'function') saveProject();
        TimelineProView.draw();
        this.openLinkPanel(lnk.id);
        TimelineProView.state.selectedLinkId = lnk.id;
    }

    static deleteLink(id) {
        TimelineProRepository.deleteLink(id);
        TimelineProView.state.selectedLinkId = null;
        this.closePanel();
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    static _applyLinkField(id, field, value) {
        const lnk = TimelineProRepository.getLinkById(id);
        if (!lnk) return;
        lnk[field] = value;
        TimelineProRepository.saveLink(lnk);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    static openLinkPanel(id) {
        const lnk   = TimelineProRepository.getLinkById(id);
        const panel = this._panel();
        if (!lnk || !panel) return;

        const events = TimelineProRepository.getAll();
        const fromEv = events.find(e => e.id === lnk.fromId);
        const toEv   = events.find(e => e.id === lnk.toId);
        const color  = lnk.color?.startsWith('#') ? lnk.color : '#d4af37';

        const CapBtn = (capField, val, label, svgContent) => `
            <button data-cap="${capField}" data-val="${val}" title="${label}" style="
                display:flex;flex-direction:column;align-items:center;gap:.25rem;
                padding:.5rem .35rem;border-radius:6px;border:2px solid ${lnk[capField]===val?'var(--primary-color)':'var(--border-color)'};
                background:${lnk[capField]===val?'rgba(var(--primary-color-rgb,255,140,66),.08)':'var(--bg-secondary)'};
                cursor:pointer;transition:border-color .15s;font-size:.7rem;color:var(--text-secondary);flex:1;">
                <svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="${color}" stroke-width="1.5">${svgContent}</svg>
                ${label}
            </button>`;

        const PatBtn = (val, label, dash) => `
            <button data-pattern="${val}" title="${label}" style="
                display:flex;flex-direction:column;align-items:center;gap:.25rem;
                padding:.5rem .35rem;border-radius:6px;border:2px solid ${lnk.pattern===val?'var(--primary-color)':'var(--border-color)'};
                background:${lnk.pattern===val?'rgba(var(--primary-color-rgb,255,140,66),.08)':'var(--bg-secondary)'};
                cursor:pointer;transition:border-color .15s;font-size:.7rem;color:var(--text-secondary);flex:1;">
                <svg width="36" height="6" viewBox="0 0 36 6">
                    <line x1="0" y1="3" x2="36" y2="3" stroke="${color}" stroke-width="2" stroke-dasharray="${dash}" stroke-linecap="round"/>
                </svg>
                ${label}
            </button>`;

        panel.style.display = 'flex';
        panel.innerHTML = `
<div style="padding:1.25rem 1.25rem 0;display:flex;flex-direction:column;gap:0;height:100%;">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
    <div style="display:flex;align-items:center;gap:.55rem;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span style="font-weight:700;font-size:.95rem;color:var(--text-primary);">Liaison</span>
    </div>
    <button id="tlp-lp-close" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;line-height:1;padding:.1rem .35rem;border-radius:4px;">&times;</button>
  </div>

  <!-- From / To -->
  <div style="display:grid;grid-template-columns:1fr 24px 1fr;align-items:center;gap:.4rem;margin-bottom:1rem;">
    <div style="background:var(--bg-secondary);border-radius:8px;padding:.5rem .65rem;font-size:.8rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
         title="${this._esc(fromEv?.title||'')}">
      ${this._esc(fromEv?.title || '?')}
    </div>
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" style="flex-shrink:0;">
      <line x1="0" y1="6" x2="20" y2="6" stroke="${color}" stroke-width="1.5"/>
      <polyline points="14,2 20,6 14,10" stroke="${color}" stroke-width="1.5" fill="none"/>
    </svg>
    <div style="background:var(--bg-secondary);border-radius:8px;padding:.5rem .65rem;font-size:.8rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
         title="${this._esc(toEv?.title||'')}">
      ${this._esc(toEv?.title || '?')}
    </div>
  </div>

  <!-- Scroll area -->
  <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;padding-bottom:1rem;">

    <!-- Couleur -->
    <div>
      <label style="${this._labelStyle()}">Couleur</label>
      <div style="display:flex;align-items:center;gap:.5rem;">
        <input id="tlp-lp-color" type="color" value="${color}"
               style="width:36px;height:32px;border:2px solid var(--border-color);border-radius:6px;cursor:pointer;background:none;padding:1px;flex-shrink:0;">
        <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
          ${['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#d4af37','#1abc9c','#ffffff','#888899']
            .map(c => `<div onclick="document.getElementById('tlp-lp-color').value='${c}';TimelineProViewModel._applyLinkField('${id}','color','${c}')"
                style="width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===color?'var(--text-primary)':'rgba(0,0,0,.1)'};transition:transform .12s;"
                onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''"></div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Motif -->
    <div>
      <label style="${this._labelStyle()}">Motif du trait</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-pattern-grid">
        ${PatBtn('solid',  'Plein',  '0')}
        ${PatBtn('dashed', 'Tirets', '8,4')}
        ${PatBtn('dotted', 'Points', '2,4')}
      </div>
    </div>

    <!-- Extrémité gauche -->
    <div>
      <label style="${this._labelStyle()}">Extrémité gauche</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-capstart-grid">
        ${CapBtn('capStart','none',   'Aucune',  '<line x1="0" y1="7" x2="28" y2="7"/>')}
        ${CapBtn('capStart','arrow',  'Flèche',  '<line x1="6" y1="7" x2="28" y2="7"/><polyline points="6,3 0,7 6,11" fill="none"/>')}
        ${CapBtn('capStart','circle', 'Cercle',  '<line x1="7" y1="7" x2="28" y2="7"/><circle cx="3.5" cy="7" r="3.5" fill="${color}"/>')}
        ${CapBtn('capStart','diamond','Losange', '<line x1="9" y1="7" x2="28" y2="7"/><polygon points="0,7 4.5,3.5 9,7 4.5,10.5" fill="${color}"/>')}
      </div>
    </div>

    <!-- Extrémité droite -->
    <div>
      <label style="${this._labelStyle()}">Extrémité droite</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-capend-grid">
        ${CapBtn('capEnd','none',   'Aucune',  '<line x1="0" y1="7" x2="28" y2="7"/>')}
        ${CapBtn('capEnd','arrow',  'Flèche',  '<line x1="0" y1="7" x2="22" y2="7"/><polyline points="22,3 28,7 22,11" fill="none"/>')}
        ${CapBtn('capEnd','circle', 'Cercle',  '<line x1="0" y1="7" x2="21" y2="7"/><circle cx="24.5" cy="7" r="3.5" fill="${color}"/>')}
        ${CapBtn('capEnd','diamond','Losange', '<line x1="0" y1="7" x2="19" y2="7"/><polygon points="28,7 23.5,3.5 19,7 23.5,10.5" fill="${color}"/>')}
      </div>
    </div>

    <!-- Épaisseur -->
    <div>
      <label style="${this._labelStyle()}">Épaisseur <span id="tlp-lp-width-val">${lnk.width||2}</span> px</label>
      <input id="tlp-lp-width" type="range" min="1" max="8" value="${lnk.width||2}" step="0.5"
             style="width:100%;accent-color:var(--primary-color);">
    </div>

    <!-- Courbure -->
    <div>
      <label style="${this._labelStyle()}">Courbure <span id="tlp-lp-curv-val">${lnk.curvature||80}</span></label>
      <input id="tlp-lp-curv" type="range" min="0" max="300" value="${lnk.curvature||80}"
             style="width:100%;accent-color:var(--primary-color);">
    </div>

    <!-- Label -->
    <div>
      <label style="${this._labelStyle()}">Libellé (optionnel)</label>
      <input id="tlp-lp-label" type="text" value="${this._esc(lnk.label||'')}" placeholder="Ex : cause, suite…"
             style="${this._inputStyle()}">
    </div>

  </div><!-- /scroll -->

  <!-- Footer -->
  <div style="padding:1rem 0;border-top:1px solid var(--border-color);">
    <button id="tlp-lp-delete" style="
        width:100%;padding:.55rem;border-radius:6px;
        border:1px solid var(--accent-red,#e74c3c);color:var(--accent-red,#e74c3c);background:transparent;
        cursor:pointer;font-size:.82rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      Supprimer cette liaison
    </button>
  </div>

</div>`;

        // ── Bindings ──
        document.getElementById('tlp-lp-color')?.addEventListener('input', e => {
            this._applyLinkField(id, 'color', e.target.value);
        });
        document.getElementById('tlp-lp-label')?.addEventListener('input', e => {
            this._applyLinkField(id, 'label', e.target.value);
        });
        document.getElementById('tlp-lp-width')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            const span = document.getElementById('tlp-lp-width-val');
            if (span) span.textContent = v;
            this._applyLinkField(id, 'width', v);
        });
        document.getElementById('tlp-lp-curv')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            const span = document.getElementById('tlp-lp-curv-val');
            if (span) span.textContent = Math.round(v);
            this._applyLinkField(id, 'curvature', v);
        });

        // Motif
        document.getElementById('tlp-lp-pattern-grid')?.querySelectorAll('button[data-pattern]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyLinkField(id, 'pattern', btn.dataset.pattern);
                this.openLinkPanel(id);
            });
        });
        // CapStart
        document.getElementById('tlp-lp-capstart-grid')?.querySelectorAll('button[data-cap="capStart"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyLinkField(id, 'capStart', btn.dataset.val);
                this.openLinkPanel(id);
            });
        });
        // CapEnd
        document.getElementById('tlp-lp-capend-grid')?.querySelectorAll('button[data-cap="capEnd"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyLinkField(id, 'capEnd', btn.dataset.val);
                this.openLinkPanel(id);
            });
        });

        document.getElementById('tlp-lp-close')?.addEventListener('click', () => {
            TimelineProView.state.selectedLinkId = null;
            this.closePanel();
            TimelineProView.draw();
        });
        const dBtn = document.getElementById('tlp-lp-delete');
        dBtn?.addEventListener('click', () => this.deleteLink(id));
        dBtn?.addEventListener('mouseenter', () => { dBtn.style.background = 'rgba(231,76,60,.08)'; });
        dBtn?.addEventListener('mouseleave', () => { dBtn.style.background = 'transparent'; });
    }
}
