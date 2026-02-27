/* ==========================================
   CHANGELOG VIEW — Rendu de la vue Changelog
   Lit les données depuis window.CHANGELOG_DATA
   (défini dans changelog.data.js — pas de fetch,
    fonctionne même en file://)
   ========================================== */

const ChangelogView = (() => {

    // ── Convertisseur Markdown → HTML léger ──────────────────────────────
    function _mdToHtml(md) {
        if (!md) return '';
        let html = md
            // titres
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // gras / italic
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // `code`
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // listes
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            // paragraphes (lignes vides)
            .replace(/\n\n+/g, '\n\n')
            .split('\n\n')
            .map(block => {
                block = block.trim();
                if (!block) return '';
                if (/^<(h[1-6]|ul|ol|li)/.test(block)) return block;
                if (block.includes('<li>')) return `<ul>${block}</ul>`;
                return `<p>${block.replace(/\n/g, ' ')}</p>`;
            })
            .join('\n');
        return html;
    }

    // ── Couleurs de badge par type ────────────────────────────────────────
    const BADGE_COLORS = {
        major: '#e74c3c',
        minor: '#3498db',
        patch: '#2ecc71',
        hotfix: '#f39c12',
    };

    function _badgeHtml(type) {
        const color = BADGE_COLORS[type] || '#888';
        return `<span class="changelog-badge" style="background:${color}">${type}</span>`;
    }

    function _formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString(
                document.documentElement.lang || 'fr-FR',
                { year: 'numeric', month: 'long', day: 'numeric' }
            );
        } catch { return dateStr; }
    }

    // ── Rendu de la liste de versions (sidebar) ───────────────────────────
    function _renderVersionList(container, versions, selectedIdx) {
        const sidebar = container.querySelector('.changelog-sidebar');
        if (!sidebar) return;
        sidebar.innerHTML = versions.map((v, i) => {
            // Si c'est un hash git (7 hex chars), on l'affiche en style mono
            const isHash = /^[0-9a-f]{7,}$/.test(v.version);
            const versionLabel = isHash
                ? `<code class="changelog-commit-hash">${v.version}</code>`
                : `<span class="changelog-version-number">${v.version}</span>`;
            const commitInfo = v.commit_count
                ? `<span class="changelog-commit-count">${v.commit_count} commit${v.commit_count > 1 ? 's' : ''}</span>`
                : '';
            return `
            <div class="changelog-version-item ${i === selectedIdx ? 'active' : ''}"
                 onclick="ChangelogView._selectVersion(${i})"
                 data-idx="${i}">
                <div class="changelog-version-tag">
                    ${versionLabel}
                    ${_badgeHtml(v.type)}
                </div>
                <div class="changelog-version-date">${_formatDate(v.date)} ${commitInfo}</div>
                <div class="changelog-version-summary">${v.summary || ''}</div>
            </div>`;
        }).join('');
    }

    // ── Rendu du contenu d'une version ───────────────────────────────────
    function _renderContent(container, version) {
        const content = container.querySelector('.changelog-content');
        if (!content) return;
        if (!version || !version.content) {
            content.innerHTML = `<div class="changelog-empty">
                <i data-lucide="file-x" style="width:32px;height:32px;opacity:.4"></i>
                <span>Pas de contenu disponible</span>
            </div>`;
            if (window.lucide) lucide.createIcons({ nodes: [content] });
            return;
        }
        content.innerHTML = `<article class="changelog-article">${_mdToHtml(version.content)}</article>`;
    }

    // ── État interne ──────────────────────────────────────────────────────
    let _currentContainer = null;
    let _versions = [];
    let _selectedIdx = 0;

    // ── API publique : sélectionner une version ───────────────────────────
    function _selectVersion(idx) {
        if (!_currentContainer) return;
        _selectedIdx = idx;
        // Mettre à jour la classe active dans la sidebar
        _currentContainer.querySelectorAll('.changelog-version-item').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
        _renderContent(_currentContainer, _versions[idx]);
    }

    // ── Rendu principal ───────────────────────────────────────────────────
    function renderInContainer(container) {
        if (!container) return;
        _currentContainer = container;

        // Lire les données depuis window.CHANGELOG_DATA
        const data = window.CHANGELOG_DATA;

        // ── Cas : données absentes ────────────────────────────────────
        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = `
                <div class="changelog-root">
                    <div class="changelog-header">
                        <div class="changelog-header-title">
                            <i data-lucide="scroll" style="width:18px;height:18px"></i>
                            Changelog
                        </div>
                    </div>
                    <div class="changelog-error">
                        <i data-lucide="alert-circle" style="width:32px;height:32px;opacity:.4"></i>
                        <span>Aucune donnée de changelog disponible.</span>
                        <code>window.CHANGELOG_DATA est vide ou absent</code>
                    </div>
                </div>`;
            if (window.lucide) lucide.createIcons({ nodes: [container] });
            return;
        }

        _versions = data;
        _selectedIdx = 0;

        // ── Structure HTML ────────────────────────────────────────────
        container.innerHTML = `
            <div class="changelog-root">
                <div class="changelog-header">
                    <div class="changelog-header-title">
                        <i data-lucide="scroll" style="width:18px;height:18px"></i>
                        Changelog
                    </div>
                    <span class="changelog-header-sub">${_versions.length} version${_versions.length > 1 ? 's' : ''}</span>
                </div>
                <div class="changelog-body">
                    <div class="changelog-layout">
                        <div class="changelog-sidebar"></div>
                        <div class="changelog-content"></div>
                    </div>
                </div>
            </div>`;

        _renderVersionList(container, _versions, _selectedIdx);
        _renderContent(container, _versions[_selectedIdx]);

        if (window.lucide) lucide.createIcons({ nodes: [container] });
    }

    return { renderInContainer, _selectVersion };
})();
