// ============================================
// EXPORT NOVEL FUNCTIONS
// ============================================

/**
 * Strips HTML tags from a string.
 */
function stripHTML(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}


// Global variable to track selection state
let exportSelectionState = {};

// [MVVM : Other]
// Group: Coordinator | Naming: ExportCoordinator
// Ouvre la modale d'exportation du roman et initialise l'état de sélection.
function openExportNovelModal() {
    // Initialize selection state with all items checked
    exportSelectionState = {};
    project.acts.forEach(act => {
        exportSelectionState[`act-${act.id}`] = true;
        act.chapters.forEach(chapter => {
            exportSelectionState[`chapter-${chapter.id}`] = true;
            chapter.scenes.forEach(scene => {
                exportSelectionState[`scene-${scene.id}`] = true;
            });
        });
    });

    renderExportTree();
    updateExportFormatInfo();
    document.getElementById('exportNovelModal').classList.add('active');
}

// [MVVM : View]
// Génère et affiche l'arborescence des éléments (actes, chapitres, scènes) à exporter.
function renderExportTree() {
    const container = document.getElementById('exportTreeContainer');
    console.log('renderExportTree called, container:', container);
    console.log('project.acts:', project.acts);
    if (!container) return;

    let html = '';

    if (!project.acts || project.acts.length === 0) {
        html = '<p style="color: var(--text-muted); text-align: center;">Aucun acte à exporter</p>';
        container.innerHTML = html;
        return;
    }

    project.acts.forEach((act, actIndex) => {
        const actChecked = exportSelectionState[`act-${act.id}`] ? 'checked' : '';
        html += `
                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem;">
                            <input type="checkbox" ${actChecked} onchange="toggleAct(${act.id})" id="export-act-${act.id}" style="cursor: pointer;">
                            <span>Acte ${actIndex + 1}</span>
                        </label>
                        <div style="margin-left: 1.5rem;">
                `;

        act.chapters.forEach((chapter, chapIndex) => {
            const chapterChecked = exportSelectionState[`chapter-${chapter.id}`] ? 'checked' : '';
            html += `
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; font-size: 0.95rem; margin-bottom: 0.25rem;">
                                <input type="checkbox" ${chapterChecked} onchange="toggleChapter(${act.id}, ${chapter.id})" id="export-chapter-${chapter.id}" style="cursor: pointer;">
                                <span>Chapitre ${chapIndex + 1}</span>
                            </label>
                            <div style="margin-left: 1.5rem;">
                    `;

            chapter.scenes.forEach((scene, sceneIndex) => {
                const sceneChecked = exportSelectionState[`scene-${scene.id}`] ? 'checked' : '';
                html += `
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                                <input type="checkbox" ${sceneChecked} onchange="toggleScene(${act.id}, ${chapter.id}, ${scene.id})" id="export-scene-${scene.id}" style="cursor: pointer;">
                                <span>Scène ${sceneIndex + 1}</span>
                            </label>
                        `;
            });

            html += `
                            </div>
                        </div>
                    `;
        });

        html += `
                        </div>
                    </div>
                `;
    });

    container.innerHTML = html;
}

// [MVVM : ViewModel]
// Alterne la sélection de l'ensemble des éléments du projet pour l'export.
function toggleAllScenes() {
    // Check if all are currently selected
    const allSelected = Object.values(exportSelectionState).every(v => v === true);

    // Toggle all to opposite state
    const newState = !allSelected;

    project.acts.forEach(act => {
        exportSelectionState[`act-${act.id}`] = newState;
        act.chapters.forEach(chapter => {
            exportSelectionState[`chapter-${chapter.id}`] = newState;
            chapter.scenes.forEach(scene => {
                exportSelectionState[`scene-${scene.id}`] = newState;
            });
        });
    });

    renderExportTree();
}

// Act Management
// Fonctions toggleAct et toggleChapter déjà définies plus haut (lignes ~5854 et ~5944)
// Les définitions en double ont été supprimées pour éviter les conflits

// [MVVM : ViewModel]
// Gère le changement d'état de sélection d'une scène et met à jour les parents (chapitre, acte).
function toggleScene(actId, chapterId, sceneId) {
    const checkbox = document.getElementById(`export-scene-${sceneId}`);
    exportSelectionState[`scene-${sceneId}`] = checkbox.checked;

    // Update chapter checkbox
    const act = project.acts.find(a => a.id === actId);
    if (act) {
        const chapter = act.chapters.find(c => c.id === chapterId);
        if (chapter) {
            const allScenesChecked = chapter.scenes.every(s => exportSelectionState[`scene-${s.id}`]);
            exportSelectionState[`chapter-${chapterId}`] = allScenesChecked;

            // Update act checkbox
            const allChaptersChecked = act.chapters.every(c => exportSelectionState[`chapter-${c.id}`]);
            exportSelectionState[`act-${actId}`] = allChaptersChecked;
        }
    }

    renderExportTree();
}

// [MVVM : View]
// Met à jour les informations textuelles affichées selon le format d'export choisi.
function updateExportFormatInfo() {
    const format = document.getElementById('exportFormatSelect').value;
    const infoBox = document.getElementById('formatInfoBox');

    const messages = {
        docx: '<strong style="color: var(--text-primary);">ℹ️ Note :</strong> Toutes les fonctionnalités ne sont pas supportées en format DOCX. Le texte exporté pourrait ne pas ressembler exactement à l\'éditeur. Pour une compatibilité complète, utilisez un autre format.',
        markdown: '<strong style="color: var(--text-primary);">✅ Format Markdown :</strong> Excellent pour la portabilité et la compatibilité avec la plupart des éditeurs de texte et des plateformes de publication.',
        txt: '<strong style="color: var(--text-primary);">📋 Texte brut :</strong> Format universel sans formatage. Compatible avec tous les logiciels.',
        html: '<strong style="color: var(--text-primary);">🌐 HTML :</strong> Format web avec préservation complète du formatage. Ouvrez dans un navigateur ou importez dans des éditeurs HTML.',
        epub: '<strong style="color: var(--text-primary);">📚 EPUB :</strong> Format e-book standard. Compatible avec Kindle (via conversion), Kobo, Apple Books, et la plupart des liseuses.'
    };

    infoBox.innerHTML = messages[format] || messages.docx;
}

// [MVVM : ViewModel]
// Récupère les options de l'interface et lance le processus d'exportation approprié.
function executeNovelExport() {
    const format = document.getElementById('exportFormatSelect').value;
    const options = {
        exportSummaries: document.getElementById('exportSummariesCheck').checked,
        exportProse: document.getElementById('exportProseCheck').checked,
        includeActTitles: document.getElementById('includeActTitlesCheck').checked,
        includeSceneSubtitles: document.getElementById('includeSceneSubtitlesCheck').checked,
        sceneDivider: document.getElementById('sceneDividerSelect').value,
        includeCharacters: document.getElementById('includeCharactersCheck').checked,
        includeWorld: document.getElementById('includeWorldCheck').checked,
        includeTimeline: document.getElementById('includeTimelineCheck').checked,
        includeRelations: document.getElementById('includeRelationsCheck').checked,
        includeCodex: document.getElementById('includeCodexCheck').checked,
        includeNotes: document.getElementById('includeNotesCheck').checked
    };

    // Check if creating a ZIP archive (project export)
    const isProjectExport = options.includeCharacters || options.includeWorld ||
        options.includeTimeline || options.includeRelations ||
        options.includeCodex || options.includeNotes;

    if (isProjectExport) {
        exportProjectAsZip(format, options);
    } else {
        // Single file export
        switch (format) {
            case 'docx':
                exportAsDOCX(options);
                break;
            case 'markdown':
                exportAsMarkdown(options);
                break;
            case 'txt':
                exportAsTXT(options);
                break;
            case 'html':
                exportAsHTML(options);
                break;
            case 'epub':
                exportAsEPUB(options);
                break;
        }
    }
}

// [MVVM : ViewModel]
// Coche ou décoche toutes les options additionnelles d'export (personnages, univers, etc.).
function toggleAllExportOptions(selectAll) {
    const checkboxes = [
        'includeCharactersCheck', 'includeWorldCheck', 'includeTimelineCheck',
        'includeRelationsCheck', 'includeCodexCheck', 'includeNotesCheck'
    ];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = selectAll;
    });
}

// [MVVM : ViewModel]
// Extrait et structure les données du projet sélectionnées pour l'exportation.
function getSelectedContent(options) {
    let content = {
        acts: []
    };

    project.acts.forEach((act, actIndex) => {
        if (!exportSelectionState[`act-${act.id}`]) return;

        let exportAct = {
            title: `Acte ${actIndex + 1}`,
            chapters: []
        };

        act.chapters.forEach((chapter, chapIndex) => {
            if (!exportSelectionState[`chapter-${chapter.id}`]) return;

            let exportChapter = {
                title: chapter.title || `Chapitre ${chapIndex + 1}`,
                scenes: []
            };

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (!exportSelectionState[`scene-${scene.id}`]) return;

                // Utiliser la version finale si elle existe, sinon le contenu actuel
                const sceneContent = getSceneExportContent(scene);

                let exportScene = {
                    title: scene.title || `Scène ${sceneIndex + 1}`,
                    summary: scene.summary || '',
                    content: sceneContent || ''
                };

                exportChapter.scenes.push(exportScene);
            });

            if (exportChapter.scenes.length > 0) {
                exportAct.chapters.push(exportChapter);
            }
        });

        if (exportAct.chapters.length > 0) {
            content.acts.push(exportAct);
        }
    });

    return content;
}

// [MVVM : Other]
// Group: Util / Helper | Naming: ExportUtils
// Retourne la chaîne de caractères utilisée comme séparateur de scènes selon le type choisi.
function getSceneDivider(dividerType) {
    switch (dividerType) {
        case 'asterisks':
            return '\n\n* * *\n\n';
        case 'hash':
            return '\n\n###\n\n';
        case 'line':
            return '\n\n---\n\n';
        case 'space':
            return '\n\n\n';
        case 'none':
            return '\n\n';
        default:
            return '\n\n* * *\n\n';
    }
}

// [MVVM : Other]
// Group: Service | Naming: ExportService
// Génère et télécharge le contenu du projet au format Markdown.
function exportAsMarkdown(options) {
    const content = getSelectedContent(options);
    const divider = getSceneDivider(options.sceneDivider);
    let markdown = `# ${project.title}\n\n`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            markdown += `# ${act.title}\n\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            markdown += `## ${chapter.title}\n\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    markdown += `### ${scene.title}\n\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    markdown += `> ${scene.summary}\n\n`;
                }

                if (options.exportProse && scene.content) {
                    markdown += `${stripHTML(scene.content)}\n`;
                }

                // Add divider between scenes (except after last scene)
                if (sceneIndex < chapter.scenes.length - 1) {
                    markdown += divider;
                }
            });

            markdown += '\n\n';
        });
    });

    downloadFile(markdown, `${project.title}.md`, 'text/markdown');
    showNotification('✓ Export Markdown terminé');
    closeModal('exportNovelModal');
}

// [MVVM : Other]
// Group: Service | Naming: ExportService
// Génère et télécharge le contenu du projet au format texte brut (.txt).
function exportAsTXT(options) {
    const content = getSelectedContent(options);
    const divider = getSceneDivider(options.sceneDivider);
    let text = `${project.title}\n${'='.repeat(project.title.length)}\n\n`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            text += `${act.title}\n${'-'.repeat(act.title.length)}\n\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            text += `${chapter.title}\n\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    text += `${scene.title}\n\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    text += `[Résumé: ${scene.summary}]\n\n`;
                }

                if (options.exportProse && scene.content) {
                    text += `${stripHTML(scene.content)}\n`;
                }

                if (sceneIndex < chapter.scenes.length - 1) {
                    text += divider;
                }
            });

            text += '\n\n';
        });
    });

    downloadFile(text, `${project.title}.txt`, 'text/plain');
    showNotification('✓ Export TXT terminé');
    closeModal('exportNovelModal');
}

// [MVVM : Other]
// Group: Service | Naming: ExportService
// Génère et télécharge le contenu du projet au format HTML.
function exportAsHTML(options) {
    const content = getSelectedContent(options);
    const divider = getSceneDivider(options.sceneDivider).replace(/\n/g, '<br>');

    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.8;
            color: #333;
            background: #fafafa;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 2rem;
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 1rem;
        }
        h2 {
            font-size: 2rem;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #666;
            padding-bottom: 0.5rem;
        }
        h3 {
            font-size: 1.5rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #666;
        }
        h4 {
            font-size: 1.2rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: #888;
            font-style: italic;
        }
        p {
            margin-bottom: 1rem;
            text-align: justify;
        }
        .summary {
            background: #f0f0f0;
            padding: 1rem;
            border-left: 4px solid #999;
            margin: 1rem 0;
            font-style: italic;
            color: #666;
        }
        .divider {
            text-align: center;
            margin: 2rem 0;
            color: #999;
        }
    </style>
</head>
<body>
    <h1>${project.title}</h1>
`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            html += `    <h2>${act.title}</h2>\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            html += `    <h3>${chapter.title}</h3>\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    html += `    <h4>${scene.title}</h4>\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    html += `    <div class="summary">${scene.summary}</div>\n`;
                }

                if (options.exportProse && scene.content) {
                    // Convert line breaks to paragraphs after stripping HTML
                    const plainText = stripHTML(scene.content);
                    const paragraphs = plainText.split('\n').filter(p => p.trim());
                    paragraphs.forEach(para => {
                        html += `    <p>${para}</p>\n`;
                    });
                }

                if (sceneIndex < chapter.scenes.length - 1 && options.sceneDivider !== 'none') {
                    html += `    <div class="divider">${divider}</div>\n`;
                }
            });
        });
    });

    html += `    </body>\n</html>`;

    downloadFile(html, `${project.title}.html`, 'text/html');
    showNotification('✓ Export HTML terminé');
    closeModal('exportNovelModal');
}

// [MVVM : Other]
// Group: Service | Naming: ExportService
// Génère et télécharge le contenu du projet au format EPUB (utilisant JSZip).
async function exportAsEPUB(options) {
    if (typeof JSZip === 'undefined') {
        alert('❌ Erreur : La bibliothèque JSZip n\'est pas chargée. Veuillez rafraîchir la page.');
        return;
    }

    const content = getSelectedContent(options);
    const zip = new JSZip();
    const bookId = 'plume-' + Date.now();
    const timestamp = new Date().toISOString().split('.')[0] + 'Z';

    // Helper to escape XML
    const escapeXML = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // Helper to convert HTML content to XHTML
    const toXHTML = (html) => {
        if (!html) return '';
        const plainText = stripHTML(html);
        const paragraphs = plainText.split('\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${escapeXML(p)}</p>`).join('\n');
    };

    // Get scene divider for EPUB
    const getDividerXHTML = () => {
        switch (options.sceneDivider) {
            case 'asterisks': return '<p class="divider">* * *</p>';
            case 'hash': return '<p class="divider">###</p>';
            case 'line': return '<hr class="divider"/>';
            case 'space': return '<p class="divider-space">&#160;</p>';
            case 'none': return '';
            default: return '<p class="divider">* * *</p>';
        }
    };

    // 1. mimetype (must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    const containerXML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.file('META-INF/container.xml', containerXML);

    // 3. OEBPS/styles.css
    const stylesCSS = `
body {
    font-family: Georgia, "Times New Roman", serif;
    margin: 1em;
    line-height: 1.6;
}
h1 {
    font-size: 1.8em;
    text-align: center;
    margin: 1em 0;
    page-break-before: always;
}
h2 {
    font-size: 1.4em;
    margin: 1.5em 0 0.5em 0;
    page-break-before: always;
}
h3 {
    font-size: 1.1em;
    font-style: italic;
    margin: 1em 0 0.5em 0;
}
p {
    margin: 0;
    text-indent: 1.5em;
    text-align: justify;
}
p:first-of-type, h1 + p, h2 + p, h3 + p, .divider + p, .divider-space + p, hr + p {
    text-indent: 0;
}
.summary {
    font-style: italic;
    color: #666;
    margin: 1em 0;
    padding: 0.5em;
    border-left: 3px solid #ccc;
    text-indent: 0;
}
.divider {
    text-align: center;
    margin: 1.5em 0;
    text-indent: 0;
}
.divider-space {
    margin: 2em 0;
    text-indent: 0;
}
hr.divider {
    border: none;
    border-top: 1px solid #ccc;
    margin: 1.5em 2em;
}
.title-page {
    text-align: center;
    margin-top: 30%;
}
.title-page h1 {
    page-break-before: avoid;
}
`;
    zip.file('OEBPS/styles.css', stylesCSS);

    // 4. Generate chapter files and build manifest/spine
    const manifestItems = [];
    const spineItems = [];
    let chapterNum = 0;

    // Title page
    const titlePageXHTML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
    <meta charset="UTF-8"/>
    <title>${escapeXML(project.title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    <div class="title-page">
        <h1>${escapeXML(project.title)}</h1>
    </div>
</body>
</html>`;
    zip.file('OEBPS/title.xhtml', titlePageXHTML);
    manifestItems.push('<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="title"/>');

    // NAV document (EPUB 3 navigation)
    let navContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head>
    <meta charset="UTF-8"/>
    <title>Table des matières</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1>Table des matières</h1>
        <ol>
            <li><a href="title.xhtml">${escapeXML(project.title)}</a></li>
`;

    // Generate chapter files
    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            navContent += `            <li><a href="chapter${chapterNum + 1}.xhtml">${escapeXML(act.title)}</a>
                <ol>\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            chapterNum++;
            const chapterId = `chapter${chapterNum}`;
            const fileName = `${chapterId}.xhtml`;

            let chapterContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
    <meta charset="UTF-8"/>
    <title>${escapeXML(chapter.title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
`;

            if (options.includeActTitles && chapIndex === 0) {
                chapterContent += `    <h1>${escapeXML(act.title)}</h1>\n`;
            }

            chapterContent += `    <h2>${escapeXML(chapter.title)}</h2>\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    chapterContent += `    <h3>${escapeXML(scene.title)}</h3>\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    chapterContent += `    <p class="summary">${escapeXML(scene.summary)}</p>\n`;
                }

                if (options.exportProse && scene.content) {
                    chapterContent += toXHTML(scene.content) + '\n';
                }

                if (sceneIndex < chapter.scenes.length - 1 && options.sceneDivider !== 'none') {
                    chapterContent += `    ${getDividerXHTML()}\n`;
                }
            });

            chapterContent += `    </body>\n</html>`;

            zip.file(`OEBPS/${fileName}`, chapterContent);
            manifestItems.push(`<item id="${chapterId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
            spineItems.push(`<itemref idref="${chapterId}"/>`);

            if (options.includeActTitles) {
                navContent += `                    <li><a href="${fileName}">${escapeXML(chapter.title)}</a></li>\n`;
            } else {
                navContent += `            <li><a href="${fileName}">${escapeXML(chapter.title)}</a></li>\n`;
            }
        });

        if (options.includeActTitles) {
            navContent += `                </ol>
            </li>\n`;
        }
    });

    navContent += `    </body>\n</html>`;

    zip.file('OEBPS/nav.xhtml', navContent);
    manifestItems.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');

    // 5. content.opf (package document)
    const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="BookId">${bookId}</dc:identifier>
        <dc:title>${escapeXML(project.title)}</dc:title>
        <dc:language>fr</dc:language>
        <dc:creator>Plume</dc:creator>
        <meta property="dcterms:modified">${timestamp}</meta>
    </metadata>
    <manifest>
        <item id="css" href="styles.css" media-type="text/css"/>
        ${manifestItems.join('\n        ')}
    </manifest>
    <spine>
        ${spineItems.join('\n        ')}
    </spine>
</package>`;

    zip.file('OEBPS/content.opf', contentOPF);

    // Generate the EPUB file
    try {
        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        saveAs(blob, `${project.title}.epub`);
        showNotification('✓ Export EPUB terminé');
        closeModal('exportNovelModal');
    } catch (error) {
        alert('❌ Erreur lors de l\'export EPUB : ' + error.message);
        console.error(error);
    }
}

// [MVVM : autre]
// Génère et télécharge le contenu du projet au format DOCX (utilisant la bibliothèque docx).
async function exportAsDOCX(options) {
    // Check if docx library is loaded
    if (typeof docx === 'undefined') {
        alert('❌ Erreur : La bibliothèque DOCX n\'est pas chargée. Veuillez rafraîchir la page.');
        return;
    }

    const content = getSelectedContent(options);
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

    const children = [];

    // Title
    children.push(
        new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            children.push(
                new Paragraph({
                    text: act.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );
        }

        act.chapters.forEach((chapter, chapIndex) => {
            children.push(
                new Paragraph({
                    text: chapter.title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 200 }
                })
            );

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    children.push(
                        new Paragraph({
                            text: scene.title,
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 200, after: 100 }
                        })
                    );
                }

                if (options.exportSummaries && scene.summary) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: scene.summary,
                                    italics: true
                                })
                            ],
                            spacing: { after: 200 }
                        })
                    );
                }

                if (options.exportProse && scene.content) {
                    const plainText = stripHTML(scene.content);
                    const paragraphs = plainText.split('\n').filter(p => p.trim());
                    paragraphs.forEach(para => {
                        children.push(
                            new Paragraph({
                                text: para,
                                spacing: { after: 200 }
                            })
                        );
                    });
                }

                // Add divider between scenes
                if (sceneIndex < chapter.scenes.length - 1) {
                    const dividerText = options.sceneDivider === 'asterisks' ? '* * *' :
                        options.sceneDivider === 'hash' ? '###' :
                            options.sceneDivider === 'line' ? '---' : '';

                    if (dividerText) {
                        children.push(
                            new Paragraph({
                                text: dividerText,
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 200, after: 200 }
                            })
                        );
                    }
                }
            });
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${project.title}.docx`);
        showNotification('✓ Export DOCX terminé');
        closeModal('exportNovelModal');
    } catch (error) {
        alert('❌ Erreur lors de l\'export DOCX : ' + error.message);
        console.error(error);
    }
}

// [MVVM : autre]
// Compile le roman et ses annexes (personnages, univers, etc.) dans une archive ZIP.
async function exportProjectAsZip(format, options) {
    if (typeof JSZip === 'undefined') {
        alert('❌ Erreur : La bibliothèque JSZip n\'est pas chargée. Veuillez rafraîchir la page.');
        return;
    }

    const zip = new JSZip();

    // Add main novel file
    const content = getSelectedContent(options);
    let mainFileContent = '';
    let mainFileName = '';

    switch (format) {
        case 'markdown':
            mainFileContent = await generateMarkdownContent(content, options);
            mainFileName = `${project.title}.md`;
            break;
        case 'txt':
            mainFileContent = await generateTXTContent(content, options);
            mainFileName = `${project.title}.txt`;
            break;
        case 'html':
            mainFileContent = await generateHTMLContent(content, options);
            mainFileName = `${project.title}.html`;
            break;
        case 'docx':
            // DOCX is binary, handled separately below
            break;
    }

    if (format !== 'docx') {
        zip.file(mainFileName, mainFileContent);
    } else {
        // For DOCX, we need to generate the binary blob
        const docxBlob = await generateDOCXBlob(content, options);
        zip.file(`${project.title}.docx`, docxBlob);
    }

    // Add Characters if requested
    if (options.includeCharacters && project.characters && project.characters.length > 0) {
        let charactersContent = '# Personnages\n\n';
        project.characters.forEach(char => {
            charactersContent += `## ${char.name}\n\n`;
            if (char.role) charactersContent += `**Rôle:** ${char.role}\n\n`;
            if (char.age) charactersContent += `**Âge:** ${char.age}\n\n`;
            if (char.description) charactersContent += `**Description:** ${char.description}\n\n`;
            if (char.background) charactersContent += `**Histoire:** ${char.background}\n\n`;
            if (char.personality) charactersContent += `**Personnalité:** ${char.personality}\n\n`;
            if (char.goals) charactersContent += `**Objectifs:** ${char.goals}\n\n`;
            if (char.strengths) charactersContent += `**Forces:** ${char.strengths}\n\n`;
            if (char.weaknesses) charactersContent += `**Faiblesses:** ${char.weaknesses}\n\n`;
            if (char.notes) charactersContent += `**Notes:** ${char.notes}\n\n`;
            charactersContent += '---\n\n';
        });
        zip.file('Personnages.md', charactersContent);
    }

    // Add World/Universe if requested
    if (options.includeWorld && project.world && project.world.length > 0) {
        let worldContent = '# Univers\n\n';
        project.world.forEach(elem => {
            worldContent += `## ${elem.name}\n\n`;
            if (elem.type) worldContent += `**Type:** ${elem.type}\n\n`;
            if (elem.description) worldContent += `${elem.description}\n\n`;
            if (elem.history) worldContent += `**Histoire:** ${elem.history}\n\n`;
            if (elem.culture) worldContent += `**Culture:** ${elem.culture}\n\n`;
            if (elem.geography) worldContent += `**Géographie:** ${elem.geography}\n\n`;
            if (elem.notes) worldContent += `**Notes:** ${elem.notes}\n\n`;
            worldContent += '---\n\n';
        });
        zip.file('Univers.md', worldContent);
    }

    // Add Timeline if requested
    if (options.includeTimeline && project.timeline && project.timeline.length > 0) {
        let timelineContent = '# Timeline\n\n';
        const sortedEvents = [...project.timeline].sort((a, b) => {
            if (a.date && b.date) return new Date(a.date) - new Date(b.date);
            return (a.order || 0) - (b.order || 0);
        });
        sortedEvents.forEach(event => {
            timelineContent += `## ${event.title}\n\n`;
            if (event.date) timelineContent += `**Date:** ${event.date}\n\n`;
            if (event.era) timelineContent += `**Ère:** ${event.era}\n\n`;
            if (event.description) timelineContent += `${event.description}\n\n`;
            if (event.characters && event.characters.length > 0) {
                const charNames = event.characters.map(id => {
                    const char = project.characters?.find(c => c.id === id);
                    return char ? char.name : id;
                }).join(', ');
                timelineContent += `**Personnages impliqués:** ${charNames}\n\n`;
            }
            timelineContent += '---\n\n';
        });
        zip.file('Timeline.md', timelineContent);
    }

    // Add Relations if requested
    if (options.includeRelations && project.relationships && project.relationships.length > 0) {
        let relationsContent = '# Relations entre personnages\n\n';
        project.relationships.forEach(rel => {
            const char1 = project.characters?.find(c => c.id === rel.source || c.id === rel.from);
            const char2 = project.characters?.find(c => c.id === rel.target || c.id === rel.to);
            const name1 = char1 ? char1.name : 'Inconnu';
            const name2 = char2 ? char2.name : 'Inconnu';
            relationsContent += `## ${name1} ↔ ${name2}\n\n`;
            if (rel.type) relationsContent += `**Type:** ${rel.type}\n\n`;
            if (rel.label) relationsContent += `**Relation:** ${rel.label}\n\n`;
            if (rel.description) relationsContent += `${rel.description}\n\n`;
            relationsContent += '---\n\n';
        });
        zip.file('Relations.md', relationsContent);
    }

    // Add Codex if requested
    if (options.includeCodex && project.codex && project.codex.length > 0) {
        let codexContent = '# Codex\n\n';
        project.codex.forEach(entry => {
            codexContent += `## ${entry.title || entry.name}\n\n`;
            if (entry.category) codexContent += `**Catégorie:** ${entry.category}\n\n`;
            if (entry.content) codexContent += `${entry.content}\n\n`;
            if (entry.description) codexContent += `${entry.description}\n\n`;
            codexContent += '---\n\n';
        });
        zip.file('Codex.md', codexContent);
    }

    // Add Notes if requested  
    if (options.includeNotes && project.notes && project.notes.length > 0) {
        let notesContent = '# Notes\n\n';
        project.notes.forEach(note => {
            notesContent += `## ${note.title}\n\n`;
            if (note.category) notesContent += `**Catégorie:** ${note.category}\n\n`;
            if (note.content) notesContent += `${note.content}\n\n`;
            notesContent += '---\n\n';
        });
        zip.file('Notes.md', notesContent);
    }

    // Generate and download ZIP
    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `${project.title}_Export.zip`);
        showNotification('✓ Export du projet complet terminé');
        closeModal('exportNovelModal');
    } catch (error) {
        alert('❌ Erreur lors de la création du ZIP : ' + error.message);
        console.error(error);
    }
}

// [MVVM : autre]
// Formate les données sélectionnées en syntaxe Markdown.
async function generateMarkdownContent(content, options) {
    const divider = getSceneDivider(options.sceneDivider);
    let markdown = `# ${project.title}\n\n`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            markdown += `# ${act.title}\n\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            markdown += `## ${chapter.title}\n\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    markdown += `### ${scene.title}\n\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    markdown += `> ${scene.summary}\n\n`;
                }

                if (options.exportProse && scene.content) {
                    markdown += `${stripHTML(scene.content)}\n`;
                }

                if (sceneIndex < chapter.scenes.length - 1) {
                    markdown += divider;
                }
            });

            markdown += '\n\n';
        });
    });

    return markdown;
}

// [MVVM : autre]
// Formate les données sélectionnées en texte brut.
async function generateTXTContent(content, options) {
    const divider = getSceneDivider(options.sceneDivider);
    let text = `${project.title}\n${'='.repeat(project.title.length)}\n\n`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            text += `${act.title}\n${'-'.repeat(act.title.length)}\n\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            text += `${chapter.title}\n\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    text += `${scene.title}\n\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    text += `[Résumé: ${scene.summary}]\n\n`;
                }

                if (options.exportProse && scene.content) {
                    text += `${stripHTML(scene.content)}\n`;
                }

                if (sceneIndex < chapter.scenes.length - 1) {
                    text += divider;
                }
            });

            text += '\n\n';
        });
    });

    return text;
}

// [MVVM : autre]
// Formate les données sélectionnées en document HTML structuré.
async function generateHTMLContent(content, options) {
    const divider = getSceneDivider(options.sceneDivider).replace(/\n/g, '<br>');

    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <style>
        body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; color: #333; background: #fafafa; }
        h1 { font-size: 2.5rem; margin-bottom: 2rem; text-align: center; border-bottom: 3px solid #333; padding-bottom: 1rem; }
        h2 { font-size: 2rem; margin-top: 3rem; margin-bottom: 1.5rem; border-bottom: 2px solid #666; padding-bottom: 0.5rem; }
        h3 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #666; }
        h4 { font-size: 1.2rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #888; font-style: italic; }
        p { margin-bottom: 1rem; text-align: justify; }
        .summary { background: #f0f0f0; padding: 1rem; border-left: 4px solid #999; margin: 1rem 0; font-style: italic; color: #666; }
        .divider { text-align: center; margin: 2rem 0; color: #999; }
    </style>
</head>
<body>
    <h1>${project.title}</h1>
`;

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            html += `    <h2>${act.title}</h2>\n`;
        }

        act.chapters.forEach((chapter, chapIndex) => {
            html += `    <h3>${chapter.title}</h3>\n`;

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    html += `    <h4>${scene.title}</h4>\n`;
                }

                if (options.exportSummaries && scene.summary) {
                    html += `    <div class="summary">${scene.summary}</div>\n`;
                }

                if (options.exportProse && scene.content) {
                    const plainText = stripHTML(scene.content);
                    const paragraphs = plainText.split('\n').filter(p => p.trim());
                    paragraphs.forEach(para => {
                        html += `    <p>${para}</p>\n`;
                    });
                }

                if (sceneIndex < chapter.scenes.length - 1 && options.sceneDivider !== 'none') {
                    html += `    <div class="divider">${divider}</div>\n`;
                }
            });
        });
    });

    html += `    </body>\n</html>`;
    return html;
}

// [MVVM : autre]
// Génère le blob binaire pour un document DOCX à partir du contenu structuré.
async function generateDOCXBlob(content, options) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

    const children = [];

    children.push(
        new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    content.acts.forEach((act, actIndex) => {
        if (options.includeActTitles) {
            children.push(
                new Paragraph({
                    text: act.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );
        }

        act.chapters.forEach((chapter, chapIndex) => {
            children.push(
                new Paragraph({
                    text: chapter.title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 200 }
                })
            );

            chapter.scenes.forEach((scene, sceneIndex) => {
                if (options.includeSceneSubtitles && scene.title) {
                    children.push(
                        new Paragraph({
                            text: scene.title,
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 200, after: 100 }
                        })
                    );
                }

                if (options.exportSummaries && scene.summary) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: scene.summary,
                                    italics: true
                                })
                            ],
                            spacing: { after: 200 }
                        })
                    );
                }

                if (options.exportProse && scene.content) {
                    const plainText = stripHTML(scene.content);
                    const paragraphs = plainText.split('\n').filter(p => p.trim());
                    paragraphs.forEach(para => {
                        children.push(
                            new Paragraph({
                                text: para,
                                spacing: { after: 200 }
                            })
                        );
                    });
                }

                if (sceneIndex < chapter.scenes.length - 1) {
                    const dividerText = options.sceneDivider === 'asterisks' ? '* * *' :
                        options.sceneDivider === 'hash' ? '###' :
                            options.sceneDivider === 'line' ? '---' : '';

                    if (dividerText) {
                        children.push(
                            new Paragraph({
                                text: dividerText,
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 200, after: 200 }
                            })
                        );
                    }
                }
            });
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    return await Packer.toBlob(doc);
}

// [MVVM : autre]
// Gère le téléchargement d'un fichier par le navigateur à partir d'un contenu et d'un type MIME.
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

