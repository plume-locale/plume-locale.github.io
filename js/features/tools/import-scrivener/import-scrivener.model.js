/**
 * [MVVM : Model]
 * Import Scrivener Model
 * Gère le parsing de fichiers Scrivener v2/v3 (.scrivx + RTF)
 *
 * Scrivener sur Windows:
 *   - Le projet .scriv est un DOSSIER
 *   - Le fichier principal est <nom>.scrivx (XML)
 *   - Les contenus sont dans Files/Docs/ (v2) ou Files/Data/<UUID>/ (v3)
 *   - Format des contenus : RTF (v2) ou RTF (v3)
 *
 * Dans le navigateur, on demande à l'utilisateur de sélectionner
 * le fichier .scrivx ET les fichiers RTF associés (via <input multiple>).
 */

const ImportScrivenerModel = {

    /**
     * Parse le fichier .scrivx (XML) et retourne la structure du binder
     * @param {string} xmlContent - Contenu XML du fichier .scrivx
     * @returns {Object} - { projectTitle, binder }
     */
    parseScrivxXml(xmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');

        // Détection d'erreur de parsing
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error(Localization.t('scrivener.error_invalid_scrivx', [parseError.textContent.substring(0, 200)]));
        }

        // Titre du projet (peut être dans l'attribut ou dans ProjectTitle)
        const projectTitle = doc.querySelector('ScrivenerProject > ProjectTitle')?.textContent?.trim()
            || doc.querySelector('ScrivenerProject')?.getAttribute('Identifier')
            || Localization.t('scrivener.default_project_title');

        // Trouver le DraftFolder (le Manuscrit)
        const draftFolder = this._findDraftFolder(doc);

        if (!draftFolder) {
            // Fallback: prendre tous les items du binder
            const binderEl = doc.querySelector('Binder');
            if (!binderEl) throw new Error(Localization.t('scrivener.error_no_binder'));
            return {
                projectTitle,
                binder: this._parseBinder(binderEl)
            };
        }

        return {
            projectTitle,
            binder: this._parseBinderItem(draftFolder)
        };
    },

    /**
     * Trouve le DraftFolder (Manuscrit) dans le document XML
     */
    _findDraftFolder(doc) {
        // Scrivener v3 : BinderItem avec Type="DraftFolder"
        const draftV3 = doc.querySelector('BinderItem[Type="DraftFolder"]');
        if (draftV3) return draftV3;

        // Scrivener v2 : chercher le dossier "Manuscrit" ou "Draft" ou "Manuscript"
        const allFolders = doc.querySelectorAll('BinderItem[Type="Folder"]');
        for (const folder of allFolders) {
            const titleEl = folder.querySelector(':scope > Title');
            const title = titleEl?.textContent?.trim() || '';
            if (/^(manuscrit|draft|manuscript|buch|roman)$/i.test(title)) {
                return folder;
            }
        }

        // En dernier recours, le premier Folder fils du Binder
        return doc.querySelector('Binder > BinderItem[Type="Folder"]');
    },

    /**
     * Parse un élément BinderItem récursivement
     * @param {Element} item
     * @returns {Object}
     */
    _parseBinderItem(item) {
        const id = item.getAttribute('ID') || item.getAttribute('UUID') || '';
        const type = item.getAttribute('Type') || 'Text';
        const titleEl = item.querySelector(':scope > Title');
        const title = titleEl?.textContent?.trim() || Localization.t('scrivener.untitled_item');

        // Récupérer le synopsis/résumé
        const synopsis = item.querySelector(':scope > MetaData > Synopsis')?.textContent?.trim()
            || item.querySelector(':scope > Synopsis')?.textContent?.trim()
            || '';

        // Inclure dans la compilation ?
        const includeInCompile = item.querySelector(':scope > MetaData > IncludeInCompile')?.textContent?.trim()
            || item.querySelector(':scope > IncludeInCompile')?.textContent?.trim()
            || 'Yes';

        const children = [];
        const childrenEl = item.querySelector(':scope > Children');
        if (childrenEl) {
            const childItems = childrenEl.querySelectorAll(':scope > BinderItem');
            for (const child of childItems) {
                children.push(this._parseBinderItem(child));
            }
        }

        return { id, type, title, synopsis, includeInCompile, children };
    },

    /**
     * Parse l'ensemble du Binder
     */
    _parseBinder(binderEl) {
        const items = binderEl.querySelectorAll(':scope > BinderItem');
        return {
            id: 'root',
            type: 'Folder',
            title: 'Binder',
            synopsis: '',
            includeInCompile: 'Yes',
            children: Array.from(items).map(item => this._parseBinderItem(item))
        };
    },

    /**
     * Construit une map {id -> File} depuis les fichiers sélectionnés par l'utilisateur
     * @param {FileList} fileList - Les fichiers sélectionnés (tout le contenu du dossier .scriv idéalement)
     * @returns {Object} - { scrivxFile, rtfMap: {id: File}, version }
     */
    buildFileMap(fileList) {
        let scrivxFile = null;
        const rtfMap = {};   // id -> File (contenu RTF)
        let version = 2;     // Scrivener 2 ou 3

        for (const file of fileList) {
            const name = file.name.toLowerCase();
            const path = file.webkitRelativePath || file.name;

            // Le fichier .scrivx principal
            if (name.endsWith('.scrivx')) {
                scrivxFile = file;
                continue;
            }

            // Détecter la version selon le chemin
            // v3: Files/Data/<UUID>/content.rtf
            // v2: Files/Docs/<ID>.rtf
            if (path.includes('Files/Data/') || path.includes('Files\\Data\\')) {
                version = 3;
                // Extraire l'UUID du chemin
                const match = path.match(/[/\\]Data[/\\]([^/\\]+)[/\\]content\.rtf?$/i);
                if (match) {
                    rtfMap[match[1]] = file;
                }
            } else if (path.includes('Files/Docs/') || path.includes('Files\\Docs\\') || name.endsWith('.rtf')) {
                // v2: le nom du fichier est l'ID
                const idMatch = name.match(/^(\d+)\.rtfd?$/i);
                if (idMatch) {
                    rtfMap[idMatch[1]] = file;
                }
            }
        }

        return { scrivxFile, rtfMap, version };
    },

    /**
     * Convertit du RTF brut en HTML simple
     * Parser RTF minimal — gère le texte, gras, italique, retours à la ligne
     * @param {string} rtfContent - Contenu RTF brut
     * @returns {string} - HTML
     */
    rtfToHtml(rtfContent) {
        if (!rtfContent) return '';

        try {
            let text = rtfContent;

            // Supprimer le header RTF {\rtf1...
            text = text.replace(/^\{\\rtf\d[^}]*\}?/m, '');

            // Remplacer les caractères encodés RTF \'XX
            text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
                try {
                    // Utiliser Windows-1252 approximation — les codes courants
                    const code = parseInt(hex, 16);
                    // Mapping de quelques caractères Windows-1252 importants
                    const win1252 = {
                        0x92: '\u2019', // '
                        0x93: '\u201C', // "
                        0x94: '\u201D', // "
                        0x96: '\u2013', // –
                        0x97: '\u2014', // —
                        0x85: '\u2026', // …
                        0xe9: 'é', 0xe8: 'è', 0xea: 'ê', 0xeb: 'ë',
                        0xe0: 'à', 0xe2: 'â', 0xe4: 'ä',
                        0xf9: 'ù', 0xfb: 'û', 0xfc: 'ü',
                        0xef: 'ï', 0xee: 'î',
                        0xf4: 'ô', 0xf6: 'ö',
                        0xe7: 'ç',
                        0xc9: 'É', 0xc8: 'È', 0xca: 'Ê',
                        0xc0: 'À', 0xc2: 'Â',
                        0xd9: 'Ù', 0xdb: 'Û',
                        0xcf: 'Ï', 0xce: 'Î',
                        0xd4: 'Ô', 0xc7: 'Ç',
                        0xab: '«', 0xbb: '»'
                    };
                    return win1252[code] || String.fromCharCode(code);
                } catch (e) {
                    return '';
                }
            });

            // Unicode RTF : \uN? -> caractère Unicode
            text = text.replace(/\\u(-?\d+)\?/g, (_, code) => {
                const n = parseInt(code);
                return String.fromCharCode(n < 0 ? n + 65536 : n);
            });

            // Gras et italique — tracker l'état
            // On travaille ligne par ligne pour mieux gérer les paragraphes
            const html = this._rtfToHtmlParagraphs(text);
            return html;

        } catch (e) {
            console.warn('[Scrivener] Erreur parsing RTF:', e);
            // Fallback: extraction du texte brut
            return this._extractRtfText(rtfContent);
        }
    },

    /**
     * Convertit les blocs RTF en paragraphes HTML
     */
    _rtfToHtmlParagraphs(rtf) {
        // Séparer le RTF en groupes et le traîter
        let result = '';
        let bold = false;
        let italic = false;
        let underline = false;
        let currentParagraph = '';
        let inGroup = 0;
        let skipGroup = false;
        let skipDepth = 0;

        // Groupes RTF à ignorer (fonttbl, colortbl, stylesheet, etc.)
        const ignoredGroups = /^\\(fonttbl|colortbl|stylesheet|info|pict|object|fldinst|fldrslt|listtable|listoverridetable|rsidtbl|themedata|colorschememapping)/;

        let i = 0;
        while (i < rtf.length) {
            const ch = rtf[i];

            if (ch === '{') {
                inGroup++;
                // Regarder si c'est un groupe à ignorer
                const lookahead = rtf.substring(i + 1, i + 50);
                if (ignoredGroups.test(lookahead)) {
                    skipGroup = true;
                    skipDepth = inGroup;
                }
                i++;
                continue;
            }

            if (ch === '}') {
                if (skipGroup && inGroup === skipDepth) {
                    skipGroup = false;
                    skipDepth = 0;
                }
                inGroup--;
                i++;
                continue;
            }

            if (skipGroup) {
                i++;
                continue;
            }

            if (ch === '\\') {
                // Lire la commande RTF
                i++;
                if (i >= rtf.length) break;

                const nextCh = rtf[i];

                // Caractères d'échappement RTF
                if (nextCh === '\\' || nextCh === '{' || nextCh === '}') {
                    currentParagraph += nextCh;
                    i++;
                    continue;
                }
                if (nextCh === '\n' || nextCh === '\r') {
                    i++;
                    continue;
                }
                if (nextCh === '-') { // Soft hyphen
                    i++;
                    continue;
                }
                if (nextCh === '~') { // Non-breaking space
                    currentParagraph += '\u00A0';
                    i++;
                    continue;
                }
                if (nextCh === '*') { // \* = groupe optionnel (ignorer)
                    i++;
                    continue;
                }
                if (nextCh === '\'') { // \'XX déjà traité avant
                    i++;
                    continue;
                }

                // Lire le nom de la commande
                let cmd = '';
                while (i < rtf.length && /[a-zA-Z]/.test(rtf[i])) {
                    cmd += rtf[i];
                    i++;
                }

                // Lire le paramètre numérique optionnel
                let param = '';
                if (i < rtf.length && (rtf[i] === '-' || /\d/.test(rtf[i]))) {
                    while (i < rtf.length && (/\d/.test(rtf[i]) || (param === '' && rtf[i] === '-'))) {
                        param += rtf[i];
                        i++;
                    }
                }
                if (i < rtf.length && rtf[i] === ' ') i++; // Delimiter space

                const paramNum = param !== '' ? parseInt(param) : null;

                // Interpréter la commande
                switch (cmd) {
                    case 'b': bold = (paramNum !== 0); break;
                    case 'i': italic = (paramNum !== 0); break;
                    case 'ul': underline = (paramNum !== 0); break;
                    case 'ulnone': underline = false; break;
                    case 'par': // Fin de paragraphe
                    case 'pard':
                        if (cmd === 'par') {
                            const trimmed = currentParagraph.trim();
                            if (trimmed) {
                                result += `<p>${trimmed}</p>\n`;
                            } else {
                                result += `<p>&nbsp;</p>\n`;
                            }
                            currentParagraph = '';
                            bold = false;
                            italic = false;
                        }
                        break;
                    case 'line': // Retour à la ligne forcé
                        currentParagraph += '<br>';
                        break;
                    case 'tab':
                        currentParagraph += '\u00A0\u00A0\u00A0\u00A0';
                        break;
                    case 'endash':
                        currentParagraph += '\u2013';
                        break;
                    case 'emdash':
                        currentParagraph += '\u2014';
                        break;
                    case 'lquote':
                        currentParagraph += '\u2018';
                        break;
                    case 'rquote':
                        currentParagraph += '\u2019';
                        break;
                    case 'ldblquote':
                        currentParagraph += '\u201C';
                        break;
                    case 'rdblquote':
                        currentParagraph += '\u201D';
                        break;
                    // Ignorer les commandes de formatage non pertinentes
                    default:
                        break;
                }
                continue;
            }

            // Ignorer les retours à la ligne RTF (non-sémantiques)
            if (ch === '\r' || ch === '\n') {
                i++;
                continue;
            }

            // Caractère texte normal
            let charHtml = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;

            // Appliquer le formatage
            if (bold && italic) {
                charHtml = `<strong><em>${charHtml}</em></strong>`;
            } else if (bold) {
                charHtml = `<strong>${charHtml}</strong>`;
            } else if (italic) {
                charHtml = `<em>${charHtml}</em>`;
            }

            currentParagraph += charHtml;
            i++;
        }

        // Flush le dernier paragraphe
        if (currentParagraph.trim()) {
            result += `<p>${currentParagraph.trim()}</p>\n`;
        }

        return result || '';
    },

    /**
     * Extraction de secours du texte RTF (supprime toutes les commandes)
     */
    _extractRtfText(rtf) {
        let text = rtf;
        // Supprimer les groupes imbriqués
        let prev = '';
        while (prev !== text) {
            prev = text;
            text = text.replace(/\{[^{}]*\}/g, '');
        }
        // Supprimer les commandes RTF
        text = text.replace(/\\[a-zA-Z]+[-]?\d*\s?/g, ' ');
        text = text.replace(/\\\\/g, '\\').replace(/\\\{/g, '{').replace(/\\\}/g, '}');
        text = text.replace(/<[^>]*>/g, '');

        const lines = text.split(/[\r\n]+/).filter(l => l.trim());
        if (lines.length === 0) return '';

        return lines.map(l => `<p>${l.trim()}</p>`).join('\n');
    },

    /**
     * Convertit la structure du binder en structure Plume (actes > chapitres > scènes)
     * @param {Object} binderRoot - Racine du binder parsé
     * @param {Object} rtfMap - Map id -> File
     * @param {string} projectTitle
     * @returns {Promise<Array>} - Liste d'actes au format Plume
     */
    async buildPlumeStructure(binderRoot, rtfMap, projectTitle) {
        const acts = [];

        // Le DraftFolder contient directement nos chapitres/dossiers
        const topLevelItems = binderRoot.children || [];

        if (topLevelItems.length === 0) {
            throw new Error(Localization.t('scrivener.error_empty_manuscript'));
        }

        // Stratégie :
        // Si les enfants directs sont des Folders → chaque Folder = un Acte, ses enfants = chapitres
        // Si les enfants directs sont des Text → tout = un seul acte avec chapitres = chaque Text
        const hasFolders = topLevelItems.some(item => item.type === 'Folder');

        if (hasFolders) {
            // Structure multi-actes
            for (const folderItem of topLevelItems) {
                if (folderItem.type === 'Folder') {
                    const act = await this._buildAct(folderItem, rtfMap);
                    if (act) acts.push(act);
                } else if (folderItem.type === 'Text') {
                    // Text au niveau racine → mettre dans un acte générique
                    let lastAct = acts.find(a => a.title === (projectTitle || Localization.t('scrivener.default_act_title', [1])));
                    if (!lastAct) {
                        lastAct = createAct(projectTitle || Localization.t('scrivener.default_act_title', [1]));
                        acts.push(lastAct);
                    }
                    const chapter = await this._buildChapterFromText(folderItem, rtfMap);
                    if (chapter) lastAct.chapters.push(chapter);
                }
            }
        } else {
            // Tous des texts → un seul acte
            const act = createAct(projectTitle || Localization.t('scrivener.default_manuscript_title'));
            for (const item of topLevelItems) {
                const chapter = await this._buildChapterFromText(item, rtfMap);
                if (chapter) act.chapters.push(chapter);
            }
            if (act.chapters.length > 0) acts.push(act);
        }

        return acts;
    },

    /**
     * Construit un Acte Plume depuis un Folder Scrivener
     */
    async _buildAct(folderItem, rtfMap) {
        const act = createAct(folderItem.title || Localization.t('scrivener.default_act_title', ['']));
        if (folderItem.synopsis) act.metadata.description = folderItem.synopsis;

        const children = folderItem.children || [];

        if (children.length === 0) {
            // Folder vide → chapter virtuel avec le contenu du folder lui-même (si RTF)
            const content = await this._readRtfContent(folderItem.id, rtfMap);
            if (content) {
                const chapter = createChapter(folderItem.title);
                const scene = createScene(Localization.t('scrivener.default_scene_title', [1]), { content });
                chapter.scenes.push(scene);
                act.chapters.push(chapter);
            }
            return act.chapters.length > 0 ? act : null;
        }

        for (const child of children) {
            if (child.type === 'Folder') {
                // Sous-dossier dans un folder → on le traite comme un chapitre avec plusieurs scènes
                const chapter = await this._buildChapterFromFolder(child, rtfMap);
                if (chapter) act.chapters.push(chapter);
            } else {
                const chapter = await this._buildChapterFromText(child, rtfMap);
                if (chapter) act.chapters.push(chapter);
            }
        }

        return act.chapters.length > 0 ? act : null;
    },

    /**
     * Construit un Chapitre Plume depuis un Text Scrivener
     */
    async _buildChapterFromText(textItem, rtfMap) {
        const content = await this._readRtfContent(textItem.id, rtfMap);
        const chapter = createChapter(textItem.title || Localization.t('scrivener.default_chapter_title'));
        if (textItem.synopsis) chapter.metadata.description = textItem.synopsis;

        // Si le Text a des enfants, ce sont des scènes
        if (textItem.children && textItem.children.length > 0) {
            for (const child of textItem.children) {
                const sceneContent = await this._readRtfContent(child.id, rtfMap);
                const scene = createScene(child.title || 'Scène', {
                    content: sceneContent || '',
                    summary: child.synopsis || ''
                });
                chapter.scenes.push(scene);
            }
        } else {
            // Un seul Text = une scène dans ce chapitre
            const scene = createScene(Localization.t('scrivener.default_scene_title', [1]), {
                content: content || '',
                summary: textItem.synopsis || ''
            });
            chapter.scenes.push(scene);
        }

        return chapter;
    },

    /**
     * Construit un Chapitre Plume depuis un Folder Scrivener (les enfants = scènes)
     */
    async _buildChapterFromFolder(folderItem, rtfMap) {
        const chapter = createChapter(folderItem.title || Localization.t('scrivener.default_chapter_title'));
        if (folderItem.synopsis) chapter.metadata.description = folderItem.synopsis;

        const children = folderItem.children || [];

        // Lire le contenu du folder lui-même (parfois dans v3)
        const folderContent = await this._readRtfContent(folderItem.id, rtfMap);

        if (children.length === 0) {
            const scene = createScene(Localization.t('scrivener.default_scene_title', [1]), { content: folderContent || '' });
            chapter.scenes.push(scene);
        } else {
            for (const child of children) {
                const content = await this._readRtfContent(child.id, rtfMap);
                const scene = createScene(child.title || 'Scène', {
                    content: content || '',
                    summary: child.synopsis || ''
                });
                chapter.scenes.push(scene);
            }
        }

        return chapter;
    },

    /**
     * Lit le contenu RTF d'un fichier identifié par son ID
     * @param {string} id - ID du BinderItem
     * @param {Object} rtfMap - Map id -> File
     * @returns {Promise<string>} - Contenu HTML converti
     */
    async _readRtfContent(id, rtfMap) {
        const file = rtfMap[id];
        if (!file) return '';

        try {
            const rtfText = await this._readFileAsText(file);
            if (!rtfText || !rtfText.trim()) return '';
            return this.rtfToHtml(rtfText);
        } catch (e) {
            console.warn(`[Scrivener] Impossible de lire RTF pour ID ${id}:`, e);
            return '';
        }
    },

    /**
     * Lit un File comme texte (avec encodage Windows-1252 pour le RTF)
     */
    _readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error(Localization.t('scrivener.error_read_file', [file.name])));
            // RTF utilise souvent Windows-1252 (latin1)
            reader.readAsText(file, 'windows-1252');
        });
    },

    /**
     * Compte les mots dans du HTML
     */
    countWords(html) {
        if (!html) return 0;
        const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
        return text.split(/\s+/).filter(w => w.length > 0).length;
    }
};
