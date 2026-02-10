// ==========================================
// PAGE PAGINATION SYSTEM - Multi-Page Layout
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

/**
 * [MVVM : View]
 * Transforme l'éditeur en mode multi-pages
 */
function createMultiPageLayout() {
    if (currentPageFormat === 'none') {
        restoreSinglePageLayout();
        return;
    }

    const editorContents = document.querySelectorAll('.editor-content.page-mode');

    editorContents.forEach(editorContent => {
        const textarea = editorContent.querySelector('.editor-textarea');
        if (!textarea || textarea.dataset.paginatedLayout === 'true') return;

        // Marquer comme paginé
        textarea.dataset.paginatedLayout = 'true';

        // Sauvegarder le contenu original
        const originalContent = textarea.innerHTML;

        // Obtenir les dimensions
        const dims = getPageDimensions(currentPageFormat);

        // Créer un conteneur de pages
        const pagesContainer = document.createElement('div');
        pagesContainer.className = 'pages-container';
        pagesContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 2rem;
            justify-content: center;
            padding: 2rem 0;
        `;

        // Créer la première page
        let currentPage = createPage(dims, 1);
        pagesContainer.appendChild(currentPage);

        // Insérer le contenu et créer des pages supplémentaires si nécessaire
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalContent;

        // Copier le contenu dans les pages
        const contentNodes = Array.from(tempDiv.childNodes);
        let pageContent = currentPage.querySelector('.page-text');
        let pageNumber = 1;

        contentNodes.forEach(node => {
            const clone = node.cloneNode(true);
            pageContent.appendChild(clone);

            // Vérifier si on dépasse la hauteur de page
            if (isPageOverflowing(currentPage, dims)) {
                // Retirer le dernier noeud ajouté
                pageContent.removeChild(clone);

                // Créer une nouvelle page
                pageNumber++;
                currentPage = createPage(dims, pageNumber);
                pagesContainer.appendChild(currentPage);
                pageContent = currentPage.querySelector('.page-text');

                // Ajouter le noeud à la nouvelle page
                pageContent.appendChild(clone);
            }
        });

        // Remplacer le textarea par le conteneur de pages
        textarea.style.display = 'none';
        editorContent.appendChild(pagesContainer);
    });
}

/**
 * [MVVM : View Helper]
 * Crée une div "page" avec ses marges et numéro
 */
function createPage(dims, pageNumber) {
    const page = document.createElement('div');
    page.className = 'simulated-page';
    page.style.cssText = `
        width: ${dims.width};
        height: ${dims.height};
        background: #ffffff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color);
        position: relative;
        overflow: hidden;
        page-break-after: always;
    `;

    // Contenu de la page avec padding
    const pageText = document.createElement('div');
    pageText.className = 'page-text';
    pageText.contentEditable = 'true';
    pageText.style.cssText = `
        width: 100%;
        height: calc(100% - ${dims.paddingTop} - ${dims.paddingBottom} - 1.5cm);
        padding: ${dims.paddingTop} ${dims.paddingRight} 0 ${dims.paddingLeft};
        font-size: 11.5pt;
        line-height: 1.45;
        text-align: justify;
        hyphens: auto;
        -webkit-hyphens: auto;
        -moz-hyphens: auto;
        color: #2c3e50;
        overflow: hidden;
    `;

    // Numéro de page en bas
    const pageNumberDiv = document.createElement('div');
    pageNumberDiv.className = 'page-number';
    pageNumberDiv.textContent = pageNumber;
    pageNumberDiv.style.cssText = `
        position: absolute;
        bottom: ${dims.paddingBottom};
        left: 50%;
        transform: translateX(-50%);
        font-size: 10pt;
        color: #666;
    `;

    page.appendChild(pageText);
    page.appendChild(pageNumberDiv);

    return page;
}

/**
 * [MVVM : View Helper]
 * Vérifie si une page déborde
 */
function isPageOverflowing(page, dims) {
    const pageText = page.querySelector('.page-text');
    return pageText.scrollHeight > pageText.clientHeight;
}

/**
 * [MVVM : View]
 * Restaure le mode page unique
 */
function restoreSinglePageLayout() {
    const editorContents = document.querySelectorAll('.editor-content');

    editorContents.forEach(editorContent => {
        const pagesContainer = editorContent.querySelector('.pages-container');
        const textarea = editorContent.querySelector('.editor-textarea');

        if (pagesContainer && textarea) {
            // Récupérer tout le contenu des pages
            const pages = pagesContainer.querySelectorAll('.page-text');
            let fullContent = '';
            pages.forEach(page => {
                fullContent += page.innerHTML;
            });

            // Restaurer dans le textarea
            textarea.innerHTML = fullContent;
            textarea.style.display = '';
            textarea.dataset.paginatedLayout = 'false';

            // Supprimer le conteneur de pages
            pagesContainer.remove();
        }
    });
}

/**
 * [MVVM : View]
 * Met à jour la pagination après un changement de contenu
 */
let paginationTimeout = null;
function updatePagination() {
    if (currentPageFormat === 'none') return;

    // Debounce pour éviter trop de recalculs
    clearTimeout(paginationTimeout);
    paginationTimeout = setTimeout(() => {
        // Pour l'instant, on ne recalcule pas automatiquement
        // car cela nécessiterait de gérer la position du curseur
        // à travers plusieurs divs
    }, 1000);
}
