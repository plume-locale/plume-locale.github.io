// ==========================================
// PAGE PREVIEW MODAL - Print Preview Style
// ==========================================

/**
 * [MVVM : View Helper]
 * Obtient les dimensions de page selon le format
 */
function getPageDimensions(format) {
    const dimensions = {
        'a4': { width: '21cm', height: '29.7cm', paddingTop: '2.5cm', paddingBottom: '2.5cm', paddingLeft: '2.5cm', paddingRight: '2.5cm' },
        'moyen': { width: '18cm', height: '24cm', paddingTop: '2cm', paddingBottom: '2cm', paddingLeft: '2.2cm', paddingRight: '2.2cm' },
        'a5': { width: '16cm', height: '21cm', paddingTop: '1.5cm', paddingBottom: '1.5cm', paddingLeft: '1.8cm', paddingRight: '1.8cm' },
        'digest': { width: '14.5cm', height: '21.6cm', paddingTop: '1.2cm', paddingBottom: '1.2cm', paddingLeft: '1.5cm', paddingRight: '1.5cm' },
        'pocket': { width: '13cm', height: '18cm', paddingTop: '1cm', paddingBottom: '1cm', paddingLeft: '1.2cm', paddingRight: '1.2cm' }
    };
    return dimensions[format] || dimensions['a4'];
}

let currentPreviewFormat = 'a4';
let currentPreviewPagesPerRow = 2;
let currentPreviewScope = 'all';
let currentZoom = 100;

/**
 * Ouvre la modale de prévisualisation de page
 */
function openPagePreview(scope = 'all') {
    currentPreviewScope = scope;

    // Utiliser le format établi globalement s'il existe et est valide
    if (typeof currentPageFormat !== 'undefined' && currentPageFormat !== 'none') {
        const knownFormats = ['a4', 'moyen', 'a5', 'digest', 'pocket'];
        if (knownFormats.includes(currentPageFormat)) {
            currentPreviewFormat = currentPageFormat;
        }
    }

    const modal = document.getElementById('pagePreviewModal');
    if (!modal) {
        createPagePreviewModal();
    } else {
        // Mettre à jour le sélecteur de portée et format si déjà ouvert
        const scopeSelect = document.getElementById('previewScopeSelect');
        if (scopeSelect) scopeSelect.value = currentPreviewScope;

        const formatSelect = document.getElementById('previewFormatSelect');
        if (formatSelect) formatSelect.value = currentPreviewFormat;
    }

    // Afficher la modale
    document.getElementById('pagePreviewModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Récupérer le contenu selon la portée
    const content = getPreviewContent(currentPreviewScope);

    if (!content || content.trim() === "") {
        alert(Localization.t('preview.no_content') || 'Aucun contenu à prévisualiser');
        document.getElementById('pagePreviewModal').classList.remove('active'); // Hide modal if no content
        document.body.style.overflow = ''; // Restore scroll
        return;
    }

    // Générer la prévisualisation (le scrollHeight fonctionnera car la modale est active/visible)
    setTimeout(() => {
        generatePagePreview(content, currentPreviewFormat);
    }, 50);
}

/**
 * Récupère le contenu à prévisualiser selon la portée
 */
function getPreviewContent(scope) {
    if (scope === 'scene') {
        const activeEditor = document.querySelector('.editor-textarea');
        return activeEditor ? activeEditor.innerHTML : '';
    }

    if (scope === 'all' && typeof project !== 'undefined') {
        let fullHTML = '';
        project.acts.forEach((act, actIndex) => {
            // Page de titre d'acte
            fullHTML += `<h1 class="preview-act-title" style="text-align: center; padding-top: 5cm; margin-bottom: 0.5cm; font-size: 28pt; text-transform: uppercase; letter-spacing: 3pt;">
                ${Localization.t('search.default.act') || 'Acte'} ${actIndex + 1}
            </h1>`;
            fullHTML += `<h2 class="preview-act-subtitle" style="text-align: center; margin-bottom: 2cm; font-size: 20pt; font-style: italic; font-weight: normal; color: #444; page-break-after: always;">${act.title}</h2>`;

            act.chapters.forEach((chapter, chapterIndex) => {
                // Titre de chapitre
                fullHTML += `<h3 class="preview-chapter-title" style="text-align: center; padding-top: 3cm; margin-bottom: 0.3cm; font-size: 18pt; text-transform: uppercase; letter-spacing: 1pt; page-break-before: always;">
                    ${Localization.t('search.default.chapter') || 'Chapitre'} ${chapterIndex + 1}
                </h3>`;
                fullHTML += `<h4 class="preview-chapter-subtitle" style="text-align: center; margin-bottom: 2cm; font-size: 15pt; font-weight: normal; font-style: italic; color: #666;">${chapter.title}</h4>`;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    if (scene.content && scene.content.trim() !== "") {
                        // NORMALISATION DU CONTENU
                        // Les scènes dans le JSON utilisent souvent \n\n pour les paragraphes
                        // et peuvent contenir des <span>. On s'assure que tout est bien découpé en <p>.
                        let content = scene.content;

                        // Si pas de balises de bloc, on entoure tout de <p> et on coupe aux \n\n
                        if (!/<(p|div|h[1-6]|ul|ol|li|blockquote)/i.test(content)) {
                            content = '<p>' + content.trim().split(/\n\n+/).join('</p><p>') + '</p>';
                        } else {
                            // S'il y a déjà des balises, on vérifie s'il reste des \n\n orphelins
                            content = content.replace(/\n\n+/g, '</p><p>');
                        }

                        fullHTML += `<div class="preview-content-chunk">${content}</div>`;

                        // Séparateur de scène sauf si c'est la dernière du chapitre
                        if (sceneIndex < chapter.scenes.length - 1) {
                            fullHTML += `<div class="preview-scene-separator" style="text-align: center; margin: 2.5rem 0; font-size: 18pt; color: #ccc;">* * *</div>`;
                        }
                    }
                });
            });
        });
        return fullHTML;
    }

    return '';
}

/**
 * Ferme la modale de prévisualisation
 */
function closePagePreview() {
    document.getElementById('pagePreviewModal').classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Crée la structure HTML de la modale
 */
function createPagePreviewModal() {
    const modalHTML = `
        <div class="modal" id="pagePreviewModal" onclick="if(event.target === this) closePagePreview()">
            <div class="modal-content page-preview-modal">
                <div class="modal-header">
                    <h2><i data-lucide="file-text"></i> ${Localization.t('preview.title')}</h2>
                    <button class="modal-close" onclick="closePagePreview()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="page-preview-toolbar">
                    <div class="preview-controls">
                        <div class="control-group">
                            <i data-lucide="layers" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span>${Localization.t('preview.scope') || 'Portée'}</span>
                            <select id="previewScopeSelect" onchange="changePreviewScope(this.value)">
                                <option value="all" ${currentPreviewScope === 'all' ? 'selected' : ''}>${Localization.t('preview.scope_all') || 'Histoire complète'}</option>
                                <option value="scene" ${currentPreviewScope === 'scene' ? 'selected' : ''}>${Localization.t('preview.scope_scene') || 'Scène actuelle'}</option>
                            </select>
                        </div>

                        <div class="control-group">
                            <i data-lucide="file-text" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span>${Localization.t('preview.format')}</span>
                            <select id="previewFormatSelect" onchange="changePreviewFormat(this.value)">
                                <option value="a4" ${currentPreviewFormat === 'a4' ? 'selected' : ''}>${Localization.t('toolbar.page_format.a4')}</option>
                                <option value="moyen" ${currentPreviewFormat === 'moyen' ? 'selected' : ''}>${Localization.t('toolbar.page_format.moyen')}</option>
                                <option value="a5" ${currentPreviewFormat === 'a5' ? 'selected' : ''}>${Localization.t('toolbar.page_format.a5')}</option>
                                <option value="digest" ${currentPreviewFormat === 'digest' ? 'selected' : ''}>${Localization.t('toolbar.page_format.digest')}</option>
                                <option value="pocket" ${currentPreviewFormat === 'pocket' ? 'selected' : ''}>${Localization.t('toolbar.page_format.pocket')}</option>
                            </select>
                        </div>
                        
                        <div class="control-group">
                            <i data-lucide="columns-2" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span>${Localization.t('preview.pages_per_row')}</span>
                            <select id="previewPagesPerRowSelect" onchange="changePreviewPagesPerRow(this.value)">
                                <option value="1" ${currentPreviewPagesPerRow === 1 ? 'selected' : ''}>1</option>
                                <option value="2" ${currentPreviewPagesPerRow === 2 ? 'selected' : ''}>2</option>
                                <option value="3" ${currentPreviewPagesPerRow === 3 ? 'selected' : ''}>3</option>
                                <option value="4" ${currentPreviewPagesPerRow === 4 ? 'selected' : ''}>4</option>
                            </select>
                        </div>
                        
                        <div class="preview-zoom-controls">
                            <button class="zoom-btn" onclick="zoomPreview(-10)" title="${Localization.t('preview.zoom_out')}">
                                <i data-lucide="minus" style="width:14px;height:14px;"></i>
                            </button>
                            <span id="previewZoomLevel" style="min-width: 45px; text-align: center; font-variant-numeric: tabular-nums;">${currentZoom}%</span>
                            <button class="zoom-btn" onclick="zoomPreview(10)" title="${Localization.t('preview.zoom_in')}">
                                <i data-lucide="plus" style="width:14px;height:14px;"></i>
                            </button>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="printPreview()">
                        <i data-lucide="printer" style="width:14px;height:14px;"></i>
                        <span>${Localization.t('preview.print')}</span>
                    </button>
                </div>
                
                <div class="page-preview-container" id="pagePreviewContainer">
                    <!-- Pages will be generated here -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Génère la prévisualisation paginée
 */
function generatePagePreview(content, format) {
    const container = document.getElementById('pagePreviewContainer');
    const dims = getPageDimensions(format);

    // Nettoyer le conteneur
    container.innerHTML = '';

    // Créer un wrapper pour les pages
    const pagesWrapper = document.createElement('div');
    pagesWrapper.className = 'preview-pages-wrapper';
    pagesWrapper.id = 'previewPagesWrapper';
    // On applique le zoom et la grille
    pagesWrapper.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${currentPreviewPagesPerRow}, 1fr);
        gap: 2rem;
        padding: 4rem 2rem;
        justify-items: center;
        zoom: ${currentZoom / 100};
        -moz-transform: scale(${currentZoom / 100});
        -moz-transform-origin: top center;
        width: 100%;
    `;

    // TRÈS IMPORTANT : Ajouter le wrapper au conteneur AVANT de générer les pages
    // pour que les mesures de scrollHeight soient correctes.
    container.appendChild(pagesWrapper);

    // Créer un élément temporaire pour parser le contenu
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);

    // Calculer la hauteur de contenu disponible par page (en pixels)
    // Conversion cm vers px: 1cm = 37.795px
    const cmToPx = 37.795275591;
    const pageContentHeightPx = (parseFloat(dims.height) - parseFloat(dims.paddingTop) - parseFloat(dims.paddingBottom) - 1.5) * cmToPx;

    // Diviser le contenu en pages
    let pageNumber = 1;
    let currentPage = createPreviewPage(dims, pageNumber);
    pagesWrapper.appendChild(currentPage); // Ajouter à la DOM tout de suite
    let currentPageContent = currentPage.querySelector('.page-text');

    // On utilise un tableau de nœuds à traiter de manière récursive/granulaire
    // On aplatit les chunks de contenu pour avoir accès directement aux paragraphes
    let nodesToProcess = [];
    Array.from(tempDiv.childNodes).forEach(node => {
        if (node.classList && node.classList.contains('preview-content-chunk')) {
            nodesToProcess.push(...Array.from(node.childNodes));
        } else {
            nodesToProcess.push(node);
        }
    });

    let i = 0;
    while (i < nodesToProcess.length) {
        const node = nodesToProcess[i];

        // Ignorer les nœuds vides (texte seul avec uniquement des espaces/retours à la ligne)
        if (node.nodeType === 3 && node.textContent.trim() === "") {
            i++;
            continue;
        }

        const clone = node.cloneNode(true);

        // Vérifier si le nœud demande un saut de page manuel avant
        const hasManualBreakBefore = node.nodeType === 1 && node.style && (node.style.pageBreakBefore === 'always' || node.style.breakBefore === 'always' || node.style.breakBefore === 'page');

        if (hasManualBreakBefore && currentPageContent.childNodes.length > 0) {
            pageNumber++;
            currentPage = createPreviewPage(dims, pageNumber);
            pagesWrapper.appendChild(currentPage);
            currentPageContent = currentPage.querySelector('.page-text');
        }

        currentPageContent.appendChild(clone);

        // Si on dépasse la hauteur de la page
        // On laisse une petite marge de 5px pour éviter les arrondis foireux
        if (currentPageContent.scrollHeight > pageContentHeightPx + 5) {
            currentPageContent.removeChild(clone);

            // TENTATIVE DE DÉCOMPOSITION
            // Si le nœud a lui même des enfants et qu'il est déjà à l'origine d'un débordement
            // On va essayer de le décomposer pour ne pas perdre de texte
            if (node.nodeType === 1 && node.childNodes.length > 1 && (node.tagName === 'P' || node.tagName === 'DIV' || node.tagName === 'BLOCKQUOTE')) {
                const children = Array.from(node.childNodes);
                // On crée des fragments qui héritent des styles du parent
                const fragments = children.map(child => {
                    const wrap = node.cloneNode(false);
                    wrap.appendChild(child.cloneNode(true));
                    return wrap;
                });
                nodesToProcess.splice(i, 1, ...fragments);
                // On ne change pas i pour traiter le premier fragment au prochain tour
                continue;
            }

            // Créer une nouvelle page
            pageNumber++;
            currentPage = createPreviewPage(dims, pageNumber);
            pagesWrapper.appendChild(currentPage);
            currentPageContent = currentPage.querySelector('.page-text');

            // Ajouter l'élément sur la nouvelle page
            currentPageContent.appendChild(clone);

            // Si l'élément est VRAIMENT trop gros pour tenir sur une page entière, on le laisse
            // pour ne pas entrer dans une boucle infinie de création de pages.
        }
        i++;
    }

    // Nettoyer tempDiv
    document.body.removeChild(tempDiv);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Crée une page de prévisualisation
 */
function createPreviewPage(dims, pageNumber) {
    const page = document.createElement('div');
    page.className = 'preview-page';
    page.style.cssText = `
        width: ${dims.width};
        height: ${dims.height};
        background: #ffffff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #ddd;
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
    `;

    const pageText = document.createElement('div');
    pageText.className = 'page-text';
    pageText.style.cssText = `
        width: 100%;
        height: calc(100% - ${dims.paddingTop} - ${dims.paddingBottom} - 1.5cm);
        padding: ${dims.paddingTop} ${dims.paddingRight} 0 ${dims.paddingLeft};
        font-size: 11.5pt;
        line-height: 1.45;
        text-align: justify;
        hyphens: auto;
        color: #2c3e50;
        font-family: 'Crimson Pro', serif;
        overflow: hidden;
    `;

    const pageNum = document.createElement('div');
    pageNum.className = 'page-number';
    pageNum.textContent = pageNumber;
    pageNum.style.cssText = `
        position: absolute;
        bottom: ${dims.paddingBottom};
        left: 50%;
        transform: translateX(-50%);
        font-size: 10pt;
        color: #666;
        font-family: 'Crimson Pro', serif;
    `;

    page.appendChild(pageText);
    page.appendChild(pageNum);

    return page;
}

/**
 * Change le format de prévisualisation
 */
function changePreviewFormat(format) {
    currentPreviewFormat = format;
    const content = getPreviewContent(currentPreviewScope);
    if (content) {
        generatePagePreview(content, format);
    }
}

/**
 * Change la portée de prévisualisation
 */
function changePreviewScope(scope) {
    currentPreviewScope = scope;
    const content = getPreviewContent(scope);
    if (content) {
        generatePagePreview(content, currentPreviewFormat);
    } else {
        alert(Localization.t('preview.no_content') || 'Aucun contenu à prévisualiser');
    }
}

/**
 * Change le nombre de pages par ligne
 */
function changePreviewPagesPerRow(count) {
    currentPreviewPagesPerRow = parseInt(count);
    const wrapper = document.querySelector('.preview-pages-wrapper');
    if (wrapper) {
        wrapper.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
    }
}

/**
 * Zoom de la prévisualisation
 */
function zoomPreview(delta) {
    currentZoom = Math.max(25, Math.min(200, currentZoom + delta));
    const wrapper = document.getElementById('previewPagesWrapper');
    if (wrapper) {
        wrapper.style.zoom = currentZoom / 100;
        wrapper.style.MozTransform = `scale(${currentZoom / 100})`;
    }
    document.getElementById('previewZoomLevel').textContent = currentZoom + '%';
}

/**
 * Imprime la prévisualisation
 */
function printPreview() {
    window.print();
}
