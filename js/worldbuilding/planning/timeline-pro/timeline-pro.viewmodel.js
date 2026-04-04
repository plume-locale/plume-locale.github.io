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
        const ids = TimelineProView.state.selectedIds.length > 0 ? [...TimelineProView.state.selectedIds] : [id];
        if (ids.length > 1 && !confirm(Localization.t('timeline.pro.confirm.delete_multiple', [ids.length]))) return;
        if (ids.length === 1 && !confirm(Localization.t('timeline.pro.confirm.delete_single'))) return;

        ids.forEach(currentId => {
            TimelineProRepository.delete(currentId);
            TimelineProRepository.deleteLinksForEvent(currentId);
        });
        TimelineProView.state.selectedId      = null;
        TimelineProView.state.selectedIds     = [];
        TimelineProView.state.selectedLinkId  = null;
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
            title: Localization.t('timeline.pro.track.placeholder') + ' ' + (tracks.length + 1),
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
        if (id === 'default') { alert(Localization.t('timeline.pro.error.delete_default_track')); return; }
        if (!confirm(Localization.t('timeline.pro.confirm.delete_track'))) return;
        TimelineProRepository.deleteTrack(id);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
        this.openTracksPanel();
    }

    static toggleTrackVisibility(id) {
        const tr = TimelineProRepository.getTracks().find(t => t.id === id);
        if (!tr) return;
        tr.isHidden = !tr.isHidden;
        TimelineProRepository.saveTrack(tr);
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
        this.openTracksPanel();
    }

    static _updateTrackCharacters(id, selectEl) {
        const tr = TimelineProRepository.getTracks().find(t => t.id === id);
        if (!tr) return;
        tr.characters = Array.from(selectEl.selectedOptions).map(o => o.value);
        TimelineProRepository.saveTrack(tr);
        TimelineProView.draw(); // au cas où l'héritage a un impact sur l'affichage
        if (typeof saveProject === 'function') saveProject();
    }

    static _updateTrackWorld(id, worldId) {
        const tr = TimelineProRepository.getTracks().find(t => t.id === id);
        if (!tr) return;
        tr.worldId = worldId || null;
        TimelineProRepository.saveTrack(tr);
        TimelineProView.draw(); // au cas où l'héritage a un impact sur l'affichage
        if (typeof saveProject === 'function') saveProject();
    }

    static toggleTrackExpansion(id) {
        const idx = TimelineProView.state.expandedTrackIds.indexOf(id);
        if (idx === -1) TimelineProView.state.expandedTrackIds.push(id);
        else TimelineProView.state.expandedTrackIds.splice(idx, 1);
        this.openTracksPanel();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PANEL (shared side panel)
    // ═══════════════════════════════════════════════════════════════════════════

    static openPanel(id) {
        const ev    = TimelineProRepository.getById(id);
        const panel = this._panel();
        if (!ev || !panel) return;

        const trk = TimelineProRepository.getTracks();
        const visibleTracks = trk.filter(t => !t.isHidden);
        const isHex   = c => c?.startsWith('#');
        const bgColor = isHex(ev.color) ? ev.color : '#d4af37';
        const txColor = isHex(ev.textColor) ? ev.textColor : '#ffffff';

        const STYLES = [
            { id: 'solid',    label: Localization.t('timeline.pro.style.solid'),    svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="3" fill="currentColor"/></svg>` },
            { id: 'gradient', label: Localization.t('timeline.pro.style.gradient'),  svg: `<svg width="36" height="16" viewBox="0 0 36 16"><defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="currentColor" stop-opacity=".4"/><stop offset="100%" stop-color="currentColor"/></linearGradient></defs><rect x="1" y="2" width="34" height="12" rx="3" fill="url(#gd)"/></svg>` },
            { id: 'outline',  label: Localization.t('timeline.pro.style.outline'),   svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1.5" y="2.5" width="33" height="11" rx="3" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.5"/></svg>` },
            { id: 'striped',  label: Localization.t('timeline.pro.style.striped'),   svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="3" fill="currentColor" fill-opacity=".7"/><line x1="8" y1="2" x2="2" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/><line x1="17" y1="2" x2="11" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/><line x1="26" y1="2" x2="20" y2="14" stroke="white" stroke-opacity=".3" stroke-width="2"/></svg>` },
            { id: 'arrow',    label: Localization.t('timeline.pro.style.arrow'),     svg: `<svg width="36" height="16" viewBox="0 0 36 16"><path d="M1 2h28l6 6-6 6H1z" fill="currentColor" rx="3"/></svg>` },
            { id: 'pill',     label: Localization.t('timeline.pro.style.pill'),      svg: `<svg width="36" height="16" viewBox="0 0 36 16"><rect x="1" y="2" width="34" height="12" rx="6" fill="currentColor"/></svg>` },
        ];

        panel.style.display = 'flex';
        panel.style.width = '800px';
        panel.innerHTML = `
<div style="display:flex; height:100%; width:100%; overflow:hidden; font-family:Inter,sans-serif;">

  <!-- LEFT COLUMN: Parameters -->
  <div style="width:340px; border-right:1px solid var(--border-color); display:flex; flex-direction:column; padding:1.25rem; box-sizing:border-box; background:var(--bg-card);">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
      <div style="display:flex; flex-direction:column;">
        <span style="font-weight:700; font-size:.95rem; color:var(--text-primary);">${Localization.t('timeline.pro.panel.edit_col_left')}</span>
        ${TimelineProView.state.selectedIds.length > 1 ? `<span style="font-size:.7rem;color:var(--primary-color);font-weight:600;">${Localization.t('timeline.pro.panel.multiple_selected', [TimelineProView.state.selectedIds.length])}</span>` : ''}
      </div>
      <button id="tlp-p-close-left" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1.4rem; padding:4px; line-height:1;">&times;</button>
    </div>

    <div style="flex:1; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:1.2rem;">
      <!-- Title -->
      <div>
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.title')}</label>
        <textarea id="tlp-p-title" style="${this._inputStyle()}height:44px;resize:vertical;" placeholder="${Localization.t('timeline.pro.placeholder.event_name')}">${this._esc(ev.title)}</textarea>
      </div>

      <!-- Start / End -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:.6rem;">
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
          ${visibleTracks.map(t => `<option value="${t.id}" ${t.id === ev.trackId ? 'selected' : ''}>${this._esc(t.title)}</option>`).join('')}
        </select>
      </div>

      <!-- Icon -->
      <div ${ev.endDate != null && ev.endDate !== ev.startDate ? 'style="display:none;"' : ''}>
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.event_type')}</label>
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:.4rem;">
          ${[
            {id:'pin', icon:'map-pin', label: Localization.t('timeline.pro.icon.pin')},
            {id:'birth', icon:'baby', label: Localization.t('timeline.pro.icon.birth')},
            {id:'death', icon:'skull', label: Localization.t('timeline.pro.icon.death')},
            {id:'battle', icon:'swords', label: Localization.t('timeline.pro.icon.battle')},
            {id:'crown', icon:'crown', label: Localization.t('timeline.pro.icon.crown')},
            {id:'feather', icon:'feather', label: Localization.t('timeline.pro.icon.feather')},
            {id:'mariage', icon:'heart', label: Localization.t('timeline.pro.icon.mariage')},
            {id:'fire', icon:'flame', label: Localization.t('timeline.pro.icon.fire')},
            {id:'voyage', icon:'anchor', label: Localization.t('timeline.pro.icon.voyage')}
          ].map(item => `
            <button onclick="document.getElementById('tlp-p-icon').value='${item.id}';TimelineProViewModel._applyField('${id}','icon','${item.id}');TimelineProViewModel.openPanel('${id}')"
                    title="${item.label}"
                    style="width:36px;height:36px;border-radius:6px;border:1px solid ${ev.icon === item.id || (!ev.icon && item.id === 'pin') ? 'var(--primary-color)' : 'var(--border-color)'};
                           background:${ev.icon === item.id || (!ev.icon && item.id === 'pin') ? 'rgba(var(--primary-color-rgb),.1)' : 'var(--bg-secondary)'};
                           cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-primary);">
              <i data-lucide="${item.icon}" style="width:18px;height:18px;"></i>
            </button>
          `).join('')}
          <input type="hidden" id="tlp-p-icon" value="${ev.icon || 'pin'}">
        </div>
      </div>

      <!-- Design -->
      <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.design')}</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-top:.4rem;" id="tlp-style-grid">
            ${STYLES.map(s => `
              <button data-style="${s.id}" title="${s.label}" style="
                  display:flex;flex-direction:column;align-items:center;gap:.3rem;
                  padding:.4rem .2rem;border-radius:6px;border:2px solid ${ev.style === s.id ? 'var(--primary-color)' : 'var(--border-color)'};
                  background:${ev.style === s.id ? 'rgba(var(--primary-color-rgb,255,140,66),.08)' : 'var(--bg-secondary)'};
                  cursor:pointer;color:${bgColor};">
                ${s.svg}
              </button>`).join('')}
        </div>
        <div style="display:flex; gap:12px; margin-top:12px;">
           <div style="flex:1;">
             <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.35rem;">${Localization.t('timeline.pro.field.color_event')}</div>
             <input id="tlp-p-color" type="color" value="${bgColor}" style="width:100%;height:30px;border:none;background:none;cursor:pointer;">
           </div>
           <div style="flex:1;">
             <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.35rem;">${Localization.t('timeline.pro.field.color_text')}</div>
             <input id="tlp-p-textcolor" type="color" value="${txColor}" style="width:100%;height:30px;border:none;background:none;cursor:pointer;">
           </div>
        </div>
      </div>

      <!-- Linked -->
      <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.linked_entities')}</label>
        <select id="tlp-p-characters" multiple style="${this._inputStyle()}height:80px;margin-top:.4rem;">
          ${(window.project?.characters || []).map(c => `<option value="${c.id}" ${(ev.characters || []).some(id => String(id) === String(c.id)) ? 'selected' : ''}>${this._esc(c.name || (c.firstName + ' ' + c.lastName).trim())}</option>`).join('')}
        </select>
        <select id="tlp-p-world" style="${this._inputStyle()}margin-top:.4rem;">
          <option value="">-- ${Localization.t('common.none')} --</option>
          ${(window.project?.world || []).map(w => `<option value="${w.id}" ${String(ev.worldId) === String(w.id) ? 'selected' : ''}>${this._esc(w.fields?.nom || w.name)}</option>`).join('')}
        </select>
      </div>

      <!-- Tags -->
      <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
        <label style="${this._labelStyle()}">${Localization.t('timeline.pro.field.tags')}</label>
        <div id="tlp-tags-wrap" style="display:flex;flex-wrap:wrap;gap:.35rem;min-height:28px;padding:.4rem;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-secondary);cursor:text;">
          ${(ev.tags||[]).map(tag => `
            <span style="display:inline-flex;align-items:center;gap:.3rem;background:var(--primary-color);color:#fff;font-size:.75rem;font-weight:600;padding:.2rem .4rem;border-radius:12px;">
              ${this._esc(tag)} <span onclick="TimelineProViewModel._removeTag('${id}','${this._esc(tag)}')" style="cursor:pointer;opacity:.8;">&times;</span>
            </span>`).join('')}
          <input id="tlp-tag-input" placeholder="${Localization.t('timeline.pro.placeholder.add_tag')}" style="border:none;outline:none;background:transparent;font-size:.8rem;color:var(--text-primary);width:60px;flex:1;">
        </div>
      </div>

       <!-- Options -->
      <div style="border-top:1px solid var(--border-color); padding-top:1rem; display:flex; flex-direction:column; gap:.4rem;">
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.4rem;border-radius:6px;background:var(--bg-secondary);">
          <input id="tlp-p-lock" type="checkbox" ${ev.isLocked ? 'checked' : ''} style="accent-color:var(--primary-color);">
          <span style="font-size:.8rem;">${Localization.t('timeline.pro.field.lock')}</span>
        </label>
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.4rem;border-radius:6px;background:var(--bg-secondary);">
          <input id="tlp-p-band" type="checkbox" ${ev.showBand ? 'checked' : ''} style="accent-color:var(--primary-color);">
          <span style="font-size:.8rem;">${Localization.t('timeline.pro.field.show_band')}</span>
        </label>
      </div>
    </div>

    <!-- Actions Footer -->
    <div style="padding-top:1rem; border-top:1px solid var(--border-color); display:flex; gap:.5rem;">
      <button id="tlp-p-duplicate" style="flex:1; padding:.5rem; border-radius:6px; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;"><i data-lucide="copy" style="width:14px;"></i></button>
      <button id="tlp-p-delete" style="flex:1; padding:.5rem; border-radius:6px; background:rgba(231,76,60,.1); border:1px solid #e74c3c; color:#e74c3c; cursor:pointer;"><i data-lucide="trash" style="width:14px;"></i></button>
    </div>
  </div>

  <!-- RIGHT COLUMN: Narrative / Description -->
  <div style="flex:1; display:flex; flex-direction:column; background:var(--bg-primary); position:relative; overflow:hidden;">
    <div style="padding:1.25rem; border-bottom:1px solid var(--border-color); background:var(--bg-card); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
      <span style="font-weight:700; color:var(--text-primary);">${Localization.t('timeline.pro.panel.edit_col_right')}</span>
      <button id="tlp-p-close" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1.4rem;">&times;</button>
    </div>
    
    <!-- RICH TEXT EDITOR WITH TOOLBAR -->
    <div style="flex:1; display:flex; flex-direction:column; overflow:hidden; background:var(--bg-primary);">
        <div class="editor-toolbar" id="editorToolbar-tlp-p-desc" style="display:flex; flex-wrap:wrap; padding:6px; border-bottom:1px solid var(--border-color); background:var(--bg-card); flex-shrink:0;">
            ${typeof getEditorToolbarHTML === 'function' ? getEditorToolbarHTML('tlp-p-desc', true) : ''}
        </div>
        <div class="editor-workspace" style="flex:1; overflow-y:auto;">
            <div id="editor-tlp-p-desc" 
                 contenteditable="true" 
                 class="editor-textarea" 
                 style="padding:1.5rem; min-height:100%; outline:none; color:var(--text-primary);"
                 placeholder="${Localization.t('timeline.pro.placeholder.desc')}">${ev.description || ''}</div>
        </div>
    </div>
  </div>

</div>` + `
<!-- Style local pour s'assurer que la barre d'outils est toujours visible et bien espacée -->
<style>
#editorToolbar-tlp-p-desc {
    gap: 8px;
    align-items: center;
    overflow-x: auto;
}
#editorToolbar-tlp-p-desc .toolbar-group {
    display: flex;
    gap: 4px;
    align-items: center;
    border-right: 1px solid var(--border-color);
    padding-right: 8px;
    margin-right: 4px;
}
#editorToolbar-tlp-p-desc .toolbar-group:last-child {
    border-right: none;
}
#editorToolbar-tlp-p-desc .toolbar-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
}
#editorToolbar-tlp-p-desc .toolbar-btn:hover {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
}
#editorToolbar-tlp-p-desc select {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.8rem;
    color: var(--text-primary);
}
</style>
`;

        // ── Bindings ──
        const update = (save = false) => {
            const currentEv = TimelineProRepository.getById(id);
            if (!currentEv) return;

            currentEv.title       = document.getElementById('tlp-p-title').value;
            currentEv.startDate   = TimelineProView._parseDate(document.getElementById('tlp-p-start').value) ?? currentEv.startDate;
            const eVal            = document.getElementById('tlp-p-end').value;
            currentEv.endDate     = eVal === '' ? null : (TimelineProView._parseDate(eVal) ?? null);
            currentEv.trackId     = document.getElementById('tlp-p-track').value;
            currentEv.color       = document.getElementById('tlp-p-color').value;
            currentEv.textColor   = document.getElementById('tlp-p-textcolor').value;
            currentEv.description = document.getElementById('editor-tlp-p-desc').innerHTML;
            currentEv.isLocked    = document.getElementById('tlp-p-lock').checked;
            currentEv.showBand    = document.getElementById('tlp-p-band').checked;
            
            const charsSelect = document.getElementById('tlp-p-characters');
            currentEv.characters = Array.from(charsSelect.selectedOptions).map(o => o.value);
            currentEv.worldId = document.getElementById('tlp-p-world').value || null;

            TimelineProRepository.save(currentEv);
            TimelineProView.draw();
            if (save && typeof saveProject === 'function') saveProject();
        };

        ['tlp-p-title','tlp-p-start','tlp-p-end','tlp-p-track','tlp-p-characters','tlp-p-world'].forEach(k => {
            const el = document.getElementById(k);
            if (el) {
                el.addEventListener('input', () => update(false));
                el.addEventListener('change', () => update(true));
            }
        });
        document.getElementById('tlp-p-color')?.addEventListener('input', () => update(false));
        document.getElementById('tlp-p-textcolor')?.addEventListener('input', () => update(false));
        document.getElementById('tlp-p-lock')?.addEventListener('change', () => update(true));
        document.getElementById('tlp-p-band')?.addEventListener('change', () => update(true));
        
        const editor = document.getElementById('editor-tlp-p-desc');
        
        // Fix: Stop propagation of Delete, Backspace and Enter keys to prevent global timeline actions (like deleting the event)
        editor.addEventListener('keydown', (e) => {
            if (['Delete', 'Backspace', 'Enter'].includes(e.key)) {
                e.stopPropagation();
            }
        });

        editor.addEventListener('input', () => {
            update(false);
        });

        editor.addEventListener('focus', () => {
            if (typeof initializeColorPickers === 'function') initializeColorPickers('tlp-p-desc');
        });
        editor.addEventListener('blur', () => update(true));
        
        try {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch(e) { console.warn('Lucide icons error:', e); }
        if (typeof initializeColorPickers === 'function') initializeColorPickers('tlp-p-desc');
        
        document.getElementById('tlp-p-close-left')?.addEventListener('click', () => {
             this.closePanel();
             TimelineProView.state.selectedId = null;
             TimelineProView.state.selectedIds = [];
             TimelineProView.draw();
        });
        document.getElementById('tlp-p-close')?.addEventListener('click', () => {
             this.closePanel();
             TimelineProView.state.selectedId = null;
             TimelineProView.state.selectedIds = [];
             TimelineProView.draw();
        });

        document.getElementById('tlp-style-grid')?.querySelectorAll('button[data-style]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyField(id, 'style', btn.dataset.style);
                this.openPanel(id);
            });
        });

        document.getElementById('tlp-tags-wrap')?.addEventListener('click', () => document.getElementById('tlp-tag-input')?.focus());
        document.getElementById('tlp-tag-input')?.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
                e.preventDefault();
                this._addTag(id, e.target.value.trim());
            } else if (e.key === 'Backspace' && !e.target.value) {
                const cur = TimelineProRepository.getById(id);
                if (cur?.tags?.length) this._removeTag(id, cur.tags[cur.tags.length - 1]);
            }
        });

        document.getElementById('tlp-p-duplicate')?.addEventListener('click', () => this.duplicateEvent(id));
        document.getElementById('tlp-p-delete')?.addEventListener('click', () => this.deleteEvent(id));

        try {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch(e) { console.warn('Lucide icons error:', e); }
        if (typeof initializeColorPickers === 'function') initializeColorPickers('tlp-p-desc');
    }

    // ── Helpers fields ────────────────────────────────────────────────────────
    static _applyField(id, field, value) {
        const ids = TimelineProView.state.selectedIds.length > 0 ? TimelineProView.state.selectedIds : [id];
        ids.forEach(currentId => {
            const ev = TimelineProRepository.getById(currentId);
            if (!ev) return;
            ev[field] = value;
            TimelineProRepository.save(ev);
        });
        TimelineProView.draw();
        if (typeof saveProject === 'function') saveProject();
    }

    static _addTag(id, tag) {
        const ids = TimelineProView.state.selectedIds.length > 0 ? TimelineProView.state.selectedIds : [id];
        ids.forEach(currentId => {
            const ev = TimelineProRepository.getById(currentId);
            if (!ev) return;
            if (!ev.tags.includes(tag)) {
                ev.tags.push(tag);
                TimelineProRepository.save(ev);
            }
        });
        TimelineProView.draw();
        this.openPanel(id); 
    }

    static _removeTag(id, tag) {
        const ids = TimelineProView.state.selectedIds.length > 0 ? TimelineProView.state.selectedIds : [id];
        ids.forEach(currentId => {
            const ev = TimelineProRepository.getById(currentId);
            if (!ev) return;
            ev.tags = ev.tags.filter(t => t !== tag);
            TimelineProRepository.save(ev);
        });
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
            title: original.title + ' (' + Localization.t('common.copy') + ')',
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

        // Icône œil ouvert / fermé
        const eyeOpen   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        const eyeClosed = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

        panel.style.display = 'flex';
        panel.style.width = '340px';
        panel.innerHTML = `
<div style="padding:1.25rem;display:flex;flex-direction:column;gap:0;height:100%;font-family:Inter,sans-serif;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
    <span style="font-weight:700;font-size:1rem;color:var(--text-primary);">${Localization.t('timeline.pro.panel.tracks_title')}</span>
    <button id="tlp-p-close" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;">×</button>
  </div>

  <div id="tlp-tracks-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;padding-right:.5rem;">
    ${tracks.map(tr => {
        const trColor = tr.color?.startsWith('#') ? tr.color : '#aaa';
        const characters = tr.characters || [];
        const worldId = tr.worldId || "";
        const isExpanded = TimelineProView.state.expandedTrackIds.includes(tr.id);
        
        return `
      <div class="tlp-track-wrapper" data-track-id="${tr.id}" draggable="true" style="background:var(--bg-secondary);border-radius:12px;border:1px solid var(--border-color);transition:box-shadow .2s;">
        
        <!-- ROW 1 : Header & CRUD -->
        <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;">
          <div style="cursor:grab;color:var(--text-muted);opacity:.5;" title="${Localization.t('timeline.pro.track.btn_reorder')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
          
          <button onclick="TimelineProViewModel.toggleTrackVisibility('${tr.id}')" 
                  style="background:none;border:none;cursor:pointer;color:${tr.isHidden ? 'var(--text-muted)' : 'var(--primary-color)'};opacity:${tr.isHidden ? '.5' : '1'};">
            ${tr.isHidden ? eyeClosed : eyeOpen}
          </button>

          <label style="cursor:pointer;position:relative;">
            <div style="width:14px;height:24px;border-radius:4px;background:${trColor};"></div>
            <input type="color" value="${trColor}" onchange="TimelineProViewModel._trackColorChange('${tr.id}', this.value)" style="position:absolute;opacity:0;inset:0;cursor:pointer;">
          </label>

          <input value="${TimelineProViewModel._esc(tr.title)}" 
                 onchange="TimelineProViewModel.renameTrack('${tr.id}', this.value)"
                 style="flex:1;background:transparent;border:none;outline:none;font-weight:700;font-size:1rem;color:var(--text-primary);max-width:140px;">

          <div style="display:flex;align-items:center;gap:.4rem;">
            ${tr.id !== 'default' ? `
            <button onclick="TimelineProViewModel.deleteTrack('${tr.id}')" style="background:none;border:none;cursor:pointer;color:var(--accent-red,#e74c3c);opacity:.7;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>` : ''}
            
            <button onclick="TimelineProViewModel.toggleTrackExpansion('${tr.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);transform:rotate(${isExpanded?'180':'0'}deg);transition:transform .2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>

        ${isExpanded ? `
        <!-- ROW 2 : Palette -->
        <div style="display:flex;align-items:center;gap:.4rem;padding:.5rem .75rem;border-top:1px solid var(--border-color);flex-wrap:wrap;">
          ${PALETTE.map(c => `<div onclick="TimelineProViewModel._trackColorChange('${tr.id}','${c}')" style="width:18px;height:18px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c === trColor ? '#fff' : 'transparent'};"></div>`).join('')}
        </div>

        <!-- ROW 3 : Linked Entities -->
        <div style="padding:.75rem;border-top:1px dashed var(--border-color);background:rgba(255,255,255,0.03);display:flex;flex-direction:column;gap:.6rem;">
          <div>
            <label style="display:block;font-size:.65rem;text-transform:uppercase;font-weight:800;color:var(--text-muted);margin-bottom:.3rem;">${Localization.t('timeline.pro.field.characters')}</label>
            <select onchange="TimelineProViewModel._updateTrackCharacters('${tr.id}', this)" multiple style="width:100%;height:80px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-primary);color:var(--text-primary);font-size:.75rem;padding:.3rem;">
              ${(window.project?.characters || []).map(c => `
                <option value="${c.id}" ${characters.map(String).includes(String(c.id)) ? 'selected' : ''}>${TimelineProViewModel._esc(c.name || (c.firstName + ' ' + c.lastName).trim() || Localization.t('common.no_name'))}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:.65rem;text-transform:uppercase;font-weight:800;color:var(--text-muted);margin-bottom:.3rem;">${Localization.t('timeline.pro.field.location')}</label>
            <select onchange="TimelineProViewModel._updateTrackWorld('${tr.id}', this.value)" style="width:100%;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-primary);color:var(--text-primary);font-size:.75rem;padding:.4rem;">
              <option value="">-- ${Localization.t('common.none') || 'Aucun lieu'} --</option>
              ${(window.project?.world || []).map(w => `
                <option value="${w.id}" ${String(worldId) === String(w.id) ? 'selected' : ''}>${TimelineProViewModel._esc(w.fields?.nom || Localization.t('common.no_name'))}</option>
              `).join('')}
            </select>
          </div>
        </div>` : ''}

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
      ${Localization.t('timeline.pro.track.btn_add')}
    </button>
    <p style="font-size:.75rem;color:var(--text-muted);margin-top:.65rem;line-height:1.5;">
      ${Localization.t('timeline.pro.track.hint')}
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
    static _trackColorInput(id, color, wrapper) {
        // Update swatch visually (live)
        const swatch = wrapper?.querySelector('div[style*="border-radius:4px"]');
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
        if (panel) {
            panel.style.display = 'none';
        }
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
        if (existing) {
            // Toast non-bloquant au lieu d'alert()
            this._toast(Localization.t('timeline.pro.toast.link_exists'));
            return;
        }
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

    /** Toast non-bloquant (2.5s) */
    static _toast(msg, type = 'info') {
        const t = document.createElement('div');
        const colors = { info: '#3498db', warn: '#e67e22', error: '#e74c3c' };
        t.style.cssText = `
            position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);
            background:${colors[type]||colors.info};color:#fff;
            padding:.55rem 1.2rem;border-radius:8px;font-size:.85rem;font-weight:600;
            z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.25);
            animation:tlpToastIn .2s ease;pointer-events:none;
        `;
        t.textContent = msg;
        if (!document.getElementById('tlp-toast-style')) {
            const s = document.createElement('style');
            s.id = 'tlp-toast-style';
            s.textContent = `@keyframes tlpToastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%)}}`;
            document.head.appendChild(s);
        }
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
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
        // Couleur effective : couleur custom ou couleur du type sémantique
        const color  = TimelineProView._linkColor(lnk);
        const TYPES  = TimelineProView.LINK_TYPE_META;

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
        panel.style.width = '340px';
        panel.innerHTML = `
<div style="padding:1.25rem 1.25rem 0;display:flex;flex-direction:column;gap:0;height:100%;">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
    <div style="display:flex;align-items:center;gap:.55rem;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      </svg>
      <span style="font-weight:700;font-size:.95rem;color:var(--text-primary);">${Localization.t('timeline.pro.panel.link_title')}</span>
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

    <!-- Type sémantique -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.type')}</label>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;" id="tlp-lp-type-grid">
        ${Object.entries(TYPES).map(([key, meta]) => `
          <button data-type="${key}" title="${meta.label}" style="
              display:flex;align-items:center;gap:.35rem;padding:.45rem .4rem;
              border-radius:6px;border:2px solid ${lnk.type===key ? meta.color : 'var(--border-color)'};
              background:${lnk.type===key ? meta.color + '22' : 'var(--bg-secondary)'};
              cursor:pointer;transition:border-color .15s;font-size:.72rem;
              color:${lnk.type===key ? meta.color : 'var(--text-secondary)'};
              font-weight:${lnk.type===key ? '700' : '500'};">
            <span style="flex-shrink:0;font-size:.85rem;">${meta.icon}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${meta.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- Couleur -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.color_custom')} <span style="font-weight:400;text-transform:none;font-size:.75rem;">${Localization.t('timeline.pro.link_field.color_hint')}</span></label>
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
        <input id="tlp-lp-color" type="color" value="${color}"
               style="width:36px;height:32px;border:2px solid var(--border-color);border-radius:6px;cursor:pointer;background:none;padding:1px;flex-shrink:0;">
        <div style="display:flex;gap:.3rem;flex-wrap:wrap;">
          ${['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#d4af37','#1abc9c','#ffffff','#888899']
            .map(c => `<div onclick="document.getElementById('tlp-lp-color').value='${c}';TimelineProViewModel._applyLinkField('${id}','color','${c}')"
                style="width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===color?'var(--text-primary)':'rgba(0,0,0,.1)'};transition:transform .12s;"
                onmouseenter="this.style.transform='scale(1.25)'" onmouseleave="this.style.transform=''"></div>`).join('')}
        </div>
        ${lnk.color ? `<button onclick="TimelineProViewModel._applyLinkField('${id}','color',null);TimelineProViewModel.openLinkPanel('${id}')" title="Réinitialiser (utiliser la couleur du type)" style="font-size:.72rem;background:none;border:1px solid var(--border-color);border-radius:4px;padding:.15rem .4rem;cursor:pointer;color:var(--text-muted);">Auto</button>` : ''}
      </div>
    </div>

    <!-- Motif -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.pattern')}</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-pattern-grid">
        ${PatBtn('solid',  Localization.t('timeline.pro.link_pattern.solid'),  '0')}
        ${PatBtn('dashed', Localization.t('timeline.pro.link_pattern.dashed'), '8,4')}
        ${PatBtn('dotted', Localization.t('timeline.pro.link_pattern.dotted'), '2,4')}
      </div>
    </div>

    <!-- Extrémité gauche -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.start_cap')}</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-capstart-grid">
        ${CapBtn('capStart','none',   Localization.t('timeline.pro.link.cap_none'),   '<line x1="0" y1="7" x2="28" y2="7"/>')}
        ${CapBtn('capStart','arrow',  Localization.t('timeline.pro.link.cap_arrow'),  '<line x1="6" y1="7" x2="28" y2="7"/><polyline points="6,3 0,7 6,11" fill="none"/>')}
        ${CapBtn('capStart','circle', Localization.t('timeline.pro.link.cap_circle'), '<line x1="7" y1="7" x2="28" y2="7"/><circle cx="3.5" cy="7" r="3.5" fill="${color}"/>')}
        ${CapBtn('capStart','diamond',Localization.t('timeline.pro.link.cap_diamond'),'<line x1="9" y1="7" x2="28" y2="7"/><polygon points="0,7 4.5,3.5 9,7 4.5,10.5" fill="${color}"/>')}
      </div>
    </div>

    <!-- Extrémité droite -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.end_cap')}</label>
      <div style="display:flex;gap:.4rem;" id="tlp-lp-capend-grid">
        ${CapBtn('capEnd','none',   Localization.t('timeline.pro.link.cap_none'),   '<line x1="0" y1="7" x2="28" y2="7"/>')}
        ${CapBtn('capEnd','arrow',  Localization.t('timeline.pro.link.cap_arrow'),  '<line x1="0" y1="7" x2="22" y2="7"/><polyline points="22,3 28,7 22,11" fill="none"/>')}
        ${CapBtn('capEnd','circle', Localization.t('timeline.pro.link.cap_circle'), '<line x1="0" y1="7" x2="21" y2="7"/><circle cx="24.5" cy="7" r="3.5" fill="${color}"/>')}
        ${CapBtn('capEnd','diamond',Localization.t('timeline.pro.link.cap_diamond'),'<line x1="0" y1="7" x2="19" y2="7"/><polygon points="28,7 23.5,3.5 19,7 23.5,10.5" fill="${color}"/>')}
      </div>
    </div>

    <!-- Épaisseur -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.width')} <span id="tlp-lp-width-val">${lnk.width||2}</span> px</label>
      <input id="tlp-lp-width" type="range" min="1" max="8" value="${lnk.width||2}" step="0.5"
             style="width:100%;accent-color:var(--primary-color);">
    </div>

    <!-- Courbure -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.curvature')} <span id="tlp-lp-curv-val">${lnk.curvature||80}</span></label>
      <input id="tlp-lp-curv" type="range" min="0" max="300" value="${lnk.curvature||80}"
             style="width:100%;accent-color:var(--primary-color);">
    </div>

    <!-- Label -->
    <div>
      <label style="${this._labelStyle()}">${Localization.t('timeline.pro.link_field.label')}</label>
      <input id="tlp-lp-label" type="text" value="${this._esc(lnk.label||'')}" placeholder="${Localization.t('timeline.pro.link_placeholder.label')}"
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
      ${Localization.t('timeline.pro.link_btn_delete')}
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

        // Type sémantique
        document.getElementById('tlp-lp-type-grid')?.querySelectorAll('button[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._applyLinkField(id, 'type', btn.dataset.type);
                this.openLinkPanel(id); // rafraîchir pour mettre à jour couleurs
            });
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
