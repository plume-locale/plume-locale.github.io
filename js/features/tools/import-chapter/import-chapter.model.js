/**
 * [MVVM : Model]
 * Import Chapter Model - Gestion du parsing et de la détection des chapitres
 * depuis différents formats : .docx, .txt, .md, .epub, .pages
 */

const ImportChapterModel = {
    /**
     * Formats supportés
     */
    supportedFormats: ['.docx', '.txt', '.md', '.epub', '.pages'],

    /**
     * Patterns de détection des chapitres (ordre de priorité)
     */
    chapterPatterns: [
        // Titres avec numéros (ajout de \b pour éviter de couper "Chapitre" en "Chap" + "i")
        /^chapitre[\s:.\-–—]*(\d+|[ivxlcdm]+)\b[\s:.\-–—]*(.*)$/i,
        /^chapter[\s:.\-–—]*(\d+|[ivxlcdm]+)\b[\s:.\-–—]*(.*)$/i,
        /^chap\.?[\s:.\-–—]*(\d+|[ivxlcdm]+)\b[\s:.\-–—]*(.*)$/i,
        // Titres avec mots (Chapitre Un, Chapitre Premier)
        /^chapitre\s+(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|premier|deuxième|troisième|second)\b[\s:.\-–—]*(.*)$/i,
        // Format numéroté simple
        /^(\d+)[\s:.\-–—]+(.+)$/,
        // Format avec tiret ou point
        /^(\d+)\.\s*(.+)$/,
        // Partie/Part
        /^partie[\s:.\-–—]*(\d+|[ivxlcdm]+)\b[\s:.\-–—]*(.*)$/i,
        /^part[\s:.\-–—]*(\d+|[ivxlcdm]+)\b[\s:.\-–—]*(.*)$/i
    ],

    /**
     * Patterns de détection de dates (pour exclusion)
     */
    datePatterns: [
        // JJ/MM/AAAA ou JJ-MM-AAAA ou JJ.MM.AAAA (ex: 12/05/2024)
        /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/,
        // Dates complètes: 12 janvier 2024 ou 1er janvier
        /^\d{1,2}(er)?\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|décembre|decembre|janv|fév|déc|oct|nov|sept)[\s\d]*$/i,
        // AAAA-MM-JJ
        /^\d{4}[./-]\d{1,2}[./-]\d{1,2}/
    ],

    /**
     * Détecte le format du fichier
     * @param {File} file
     * @returns {string} - Extension du fichier
     */
    getFileFormat(file) {
        const name = file.name.toLowerCase();
        for (const format of this.supportedFormats) {
            if (name.endsWith(format)) return format;
        }
        return null;
    },

    /**
     * Point d'entrée principal - convertit n'importe quel format supporté
     * @param {File} file
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertToHtml(file) {
        const format = this.getFileFormat(file);

        switch (format) {
            case '.docx':
                return this.convertDocxToHtml(file);
            case '.txt':
                return this.convertTxtToHtml(file);
            case '.md':
                return this.convertMarkdownToHtml(file);
            case '.epub':
                return this.convertEpubToHtml(file);
            case '.pages':
                return this.convertPagesToHtml(file);
            default:
                throw new Error(Localization.t('import.error.unsupported_format').replace('{0}', file.name));
        }
    },

    /**
     * Convertit un fichier DOCX en HTML via Mammoth.js
     * @param {File} file - Fichier .docx
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertDocxToHtml(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const result = await mammoth.convertToHtml(
                        { arrayBuffer },
                        {
                            styleMap: [
                                "p[style-name='Heading 1'] => h1:fresh",
                                "p[style-name='Heading 2'] => h2:fresh",
                                "p[style-name='Titre 1'] => h1:fresh",
                                "p[style-name='Titre 2'] => h2:fresh",
                                "p[style-name='Title'] => h1:fresh",
                                "p[style-name='Titre'] => h1:fresh"
                            ]
                        }
                    );
                    resolve({
                        html: result.value,
                        messages: result.messages
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error(Localization.t('import.error.read_error')));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Convertit un fichier TXT en HTML
     * @param {File} file - Fichier .txt
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertTxtToHtml(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const html = this.textToHtml(text);
                    resolve({ html, messages: [] });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error(Localization.t('import.error.read_error')));
            reader.readAsText(file, 'UTF-8');
        });
    },

    /**
     * Convertit du texte brut en HTML avec détection des chapitres
     * @param {string} text - Texte brut
     * @returns {string} - HTML
     */
    textToHtml(text) {
        const lines = text.split(/\r?\n/);
        let html = '';
        let inParagraph = false;
        let paragraphContent = '';

        const flushParagraph = () => {
            if (paragraphContent.trim()) {
                html += `<p>${this.escapeHtml(paragraphContent.trim())}</p>\n`;
            }
            paragraphContent = '';
            inParagraph = false;
        };

        lines.forEach(line => {
            const trimmed = line.trim();

            // Ligne vide = fin de paragraphe
            if (!trimmed) {
                flushParagraph();
                return;
            }

            // Détection de titre de chapitre
            const isChapterTitle = this.matchChapterPattern(trimmed);
            if (isChapterTitle) {
                flushParagraph();
                html += `<h1>${this.escapeHtml(trimmed)}</h1>\n`;
                return;
            }

            // Ligne de séparation (---, ***, ===)
            if (/^[-*=]{3,}$/.test(trimmed)) {
                flushParagraph();
                html += '<hr>\n';
                return;
            }

            // Ajouter au paragraphe courant
            if (paragraphContent) {
                paragraphContent += ' ' + trimmed;
            } else {
                paragraphContent = trimmed;
            }
        });

        flushParagraph();
        return html;
    },

    /**
     * Convertit un fichier Markdown en HTML
     * @param {File} file - Fichier .md
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertMarkdownToHtml(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const markdown = e.target.result;
                    const html = this.markdownToHtml(markdown);
                    resolve({ html, messages: [] });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error(Localization.t('import.error.read_error')));
            reader.readAsText(file, 'UTF-8');
        });
    },

    /**
     * Convertit du Markdown en HTML (parser simple)
     * @param {string} markdown - Contenu Markdown
     * @returns {string} - HTML
     */
    markdownToHtml(markdown) {
        let html = markdown;

        // Titres (# à ######)
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Gras et italique
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Séparateurs
        html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

        // Paragraphes (lignes non vides qui ne sont pas déjà des balises)
        const lines = html.split(/\n/);
        let result = '';
        let inParagraph = false;
        let paragraphContent = '';

        const flushParagraph = () => {
            if (paragraphContent.trim()) {
                result += `<p>${paragraphContent.trim()}</p>\n`;
            }
            paragraphContent = '';
        };

        lines.forEach(line => {
            const trimmed = line.trim();

            // Ligne vide ou balise block
            if (!trimmed || /^<(h[1-6]|hr|p|div|blockquote)/.test(trimmed)) {
                flushParagraph();
                if (trimmed) result += trimmed + '\n';
                return;
            }

            // Ajouter au paragraphe
            if (paragraphContent) {
                paragraphContent += ' ' + trimmed;
            } else {
                paragraphContent = trimmed;
            }
        });

        flushParagraph();
        return result;
    },

    /**
     * Convertit un fichier EPUB en HTML
     * @param {File} file - Fichier .epub
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertEpubToHtml(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const zip = await JSZip.loadAsync(arrayBuffer);

                    // Trouver et parser le fichier content.opf pour l'ordre des chapitres
                    let contentOpf = null;
                    let opfPath = '';

                    // Chercher le fichier container.xml pour trouver le chemin du OPF
                    const containerXml = await zip.file('META-INF/container.xml')?.async('string');
                    if (containerXml) {
                        const match = containerXml.match(/full-path="([^"]+\.opf)"/);
                        if (match) {
                            opfPath = match[1];
                            const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
                            contentOpf = await zip.file(opfPath)?.async('string');
                        }
                    }

                    // Collecter tous les fichiers HTML/XHTML
                    const htmlFiles = [];
                    const promises = [];

                    zip.forEach((relativePath, zipEntry) => {
                        if (/\.(x?html?)$/i.test(relativePath) && !relativePath.includes('nav')) {
                            promises.push(
                                zipEntry.async('string').then(content => {
                                    htmlFiles.push({
                                        path: relativePath,
                                        content: content
                                    });
                                })
                            );
                        }
                    });

                    await Promise.all(promises);

                    // Trier par ordre si possible (basé sur l'OPF ou alphabétique)
                    htmlFiles.sort((a, b) => a.path.localeCompare(b.path));

                    // Extraire le contenu de chaque fichier HTML
                    let combinedHtml = '';
                    const messages = [];

                    htmlFiles.forEach(file => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(file.content, 'text/html');
                        const body = doc.body;

                        if (body) {
                            // Chercher un titre dans ce fichier
                            const title = doc.querySelector('h1, h2, title');
                            if (title && title.textContent.trim()) {
                                combinedHtml += `<h1>${title.textContent.trim()}</h1>\n`;
                            }

                            // Ajouter le contenu du body
                            combinedHtml += body.innerHTML + '\n';
                        }
                    });

                    if (!combinedHtml.trim()) {
                        throw new Error(Localization.t('import.error.epub_empty'));
                    }

                    resolve({ html: combinedHtml, messages });
                } catch (error) {
                    reject(new Error(Localization.t('import.error.epub_read_error').replace('{0}', error.message)));
                }
            };
            reader.onerror = () => reject(new Error(Localization.t('import.error.read_error')));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Convertit un fichier Apple Pages en HTML
     * @param {File} file - Fichier .pages
     * @returns {Promise<{html: string, messages: Array}>}
     */
    async convertPagesToHtml(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const zip = await JSZip.loadAsync(arrayBuffer);

                    let textContent = '';
                    const messages = [{ type: 'warning', message: Localization.t('import.warning.pages_format') }];

                    // Pages utilise un format protobuf dans index.zip ou Document.iwa
                    // On va essayer d'extraire le texte du preview ou des fichiers texte

                    // Méthode 1: Chercher preview.pdf ou QuickLook/Preview.pdf (pas de texte)
                    // Méthode 2: Chercher des fichiers texte dans le package

                    // Essayer de lire le fichier Index/Document.iwa (format binaire protobuf)
                    // C'est complexe, on va plutôt chercher des alternatives

                    // Chercher buildVersionHistory.plist pour des infos
                    const plistContent = await zip.file('buildVersionHistory.plist')?.async('string');

                    // Chercher tout fichier texte lisible
                    const textPromises = [];
                    zip.forEach((relativePath, zipEntry) => {
                        // Chercher des fichiers qui pourraient contenir du texte
                        if (/\.(txt|xml|html?)$/i.test(relativePath)) {
                            textPromises.push(
                                zipEntry.async('string').then(content => ({
                                    path: relativePath,
                                    content
                                })).catch(() => null)
                            );
                        }
                    });

                    const textFiles = (await Promise.all(textPromises)).filter(f => f);

                    // Si on trouve des fichiers XML, essayer d'en extraire du texte
                    for (const file of textFiles) {
                        if (file.content && file.content.length > 100) {
                            // Essayer d'extraire le texte des balises XML
                            const textOnly = file.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                            if (textOnly.length > textContent.length) {
                                textContent = textOnly;
                            }
                        }
                    }

                    // Si toujours rien, chercher dans les données brutes (peu probable de fonctionner)
                    if (!textContent) {
                        // Essayer de lire le contenu comme s'il était un ancien format Pages (pre-2013)
                        const indexXml = await zip.file('index.xml')?.async('string');
                        if (indexXml) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(indexXml, 'text/xml');
                            const textNodes = doc.evaluate('//text()', doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < textNodes.snapshotLength; i++) {
                                const node = textNodes.snapshotItem(i);
                                if (node.textContent.trim()) {
                                    textContent += node.textContent + ' ';
                                }
                            }
                        }
                    }

                    if (!textContent.trim()) {
                        throw new Error(Localization.t('import.error.pages_extract_error'));
                    }

                    // Convertir le texte extrait en HTML
                    const html = this.textToHtml(textContent);
                    resolve({ html, messages });

                } catch (error) {
                    reject(new Error(Localization.t('import.error.pages_read_error').replace('{0}', error.message)));
                }
            };
            reader.onerror = () => reject(new Error(Localization.t('import.error.read_error')));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Échappe les caractères HTML
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Parse le HTML et détecte les chapitres automatiquement
     * @param {string} html - HTML converti depuis le fichier source
     * @returns {Array<{title: string, content: string}>}
     */
    parseChaptersFromHtml(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const chapters = [];

        // Stratégie 1: Détection via les titres H1/H2
        const headings = doc.querySelectorAll('h1, h2');
        if (headings.length > 0) {
            return this.parseByHeadings(doc, headings);
        }

        // Stratégie 2: Détection via patterns textuels dans les paragraphes
        const paragraphs = doc.querySelectorAll('p');
        const patternChapters = this.parseByPatterns(paragraphs);
        if (patternChapters.length > 0) {
            return patternChapters;
        }

        // Stratégie 3: Si aucun chapitre détecté, créer un chapitre unique
        const fullContent = doc.body.innerHTML;
        if (fullContent.trim()) {
            chapters.push({
                title: Localization.t('import.default.chapter').replace('{0}', '1'),
                content: this.cleanHtml(fullContent)
            });
        }

        return chapters;
    },

    /**
     * Parse les chapitres en utilisant les balises H1/H2
     * @param {Document} doc - Document HTML parsé
     * @param {NodeList} headings - Liste des titres H1/H2
     * @returns {Array<{title: string, content: string}>}
     */
    parseByHeadings(doc, headings) {
        const chapters = [];
        const body = doc.body;

        headings.forEach((heading, index) => {
            const title = heading.textContent.trim();
            if (!title) return;

            // Collecter tout le contenu jusqu'au prochain heading
            let content = '';
            let sibling = heading.nextElementSibling;

            while (sibling && !['H1', 'H2'].includes(sibling.tagName)) {
                content += sibling.outerHTML;
                sibling = sibling.nextElementSibling;
            }

            // Nettoyer le titre des numéros de chapitre si présent
            const cleanTitle = this.cleanChapterTitle(title);

            chapters.push({
                title: cleanTitle || Localization.t('import.default.chapter').replace('{0}', index + 1),
                content: this.cleanHtml(content)
            });
        });

        // Si du contenu existe avant le premier heading, l'ajouter comme prologue
        const firstHeading = headings[0];
        let prologueContent = '';
        let sibling = body.firstElementChild;

        while (sibling && sibling !== firstHeading) {
            if (sibling.textContent.trim()) {
                prologueContent += sibling.outerHTML;
            }
            sibling = sibling.nextElementSibling;
        }

        if (prologueContent.trim()) {
            chapters.unshift({
                title: Localization.t('import.default.prologue'),
                content: this.cleanHtml(prologueContent)
            });
        }

        return chapters;
    },

    /**
     * Parse les chapitres via patterns textuels
     * @param {NodeList} paragraphs - Paragraphes du document
     * @returns {Array<{title: string, content: string}>}
     */
    parseByPatterns(paragraphs) {
        const chapters = [];
        let currentChapter = null;
        let prologueContent = '';

        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            const matchedPattern = this.matchChapterPattern(text);

            if (matchedPattern) {
                // Sauvegarder le chapitre précédent
                if (currentChapter) {
                    chapters.push(currentChapter);
                } else if (prologueContent.trim()) {
                    // Contenu avant le premier chapitre = prologue
                    chapters.push({
                        title: Localization.t('import.default.prologue'),
                        content: this.cleanHtml(prologueContent)
                    });
                }

                // Nouveau chapitre
                currentChapter = {
                    title: matchedPattern.title,
                    content: ''
                };
            } else if (currentChapter) {
                // Ajouter au chapitre en cours
                currentChapter.content += p.outerHTML;
            } else {
                // Avant le premier chapitre
                prologueContent += p.outerHTML;
            }
        });

        // Ajouter le dernier chapitre
        if (currentChapter) {
            currentChapter.content = this.cleanHtml(currentChapter.content);
            chapters.push(currentChapter);
        }

        return chapters;
    },

    /**
     * Teste si un texte correspond à un pattern de chapitre
     * @param {string} text - Texte à tester
     * @returns {Object|null} - {title, number} ou null
     */
    matchChapterPattern(text) {
        if (!text || text.length > 100) return null; // Trop long pour être un titre

        // Vérifier si c'est une date (pour éviter les faux positifs type journal)
        const isDate = this.datePatterns.some(pattern => pattern.test(text));
        if (isDate) return null;

        for (const pattern of this.chapterPatterns) {
            const match = text.match(pattern);
            if (match) {
                // Extraire le titre propre
                const number = match[1];
                const subtitle = match[2] ? match[2].trim() : '';

                let title;
                if (subtitle) {
                    title = subtitle;
                } else if (/^\d+$/.test(number)) {
                    title = Localization.t('import.default.chapter').replace('{0}', number);
                } else {
                    title = Localization.t('import.default.chapter').replace('{0}', this.romanToArabic(number) || number);
                }

                return { title, number };
            }
        }

        return null;
    },

    /**
     * Nettoie un titre de chapitre
     * @param {string} title - Titre brut
     * @returns {string} - Titre nettoyé
     */
    cleanChapterTitle(title) {
        // Supprimer les préfixes "Chapitre X -" etc.
        let clean = title;

        for (const pattern of this.chapterPatterns) {
            const match = clean.match(pattern);
            if (match && match[2]) {
                return match[2].trim() || clean;
            }
        }

        return clean;
    },

    /**
     * Convertit un nombre romain en arabe
     * @param {string} roman - Nombre romain
     * @returns {number|null}
     */
    romanToArabic(roman) {
        if (!roman || typeof roman !== 'string') return null;

        const romanNumerals = {
            'i': 1, 'v': 5, 'x': 10, 'l': 50,
            'c': 100, 'd': 500, 'm': 1000
        };

        const str = roman.toLowerCase();
        let result = 0;
        let prev = 0;

        for (let i = str.length - 1; i >= 0; i--) {
            const current = romanNumerals[str[i]];
            if (!current) return null;

            if (current < prev) {
                result -= current;
            } else {
                result += current;
            }
            prev = current;
        }

        return result > 0 ? result : null;
    },

    /**
     * Nettoie le HTML pour Plume
     * @param {string} html - HTML brut
     * @returns {string} - HTML nettoyé
     */
    cleanHtml(html) {
        if (!html) return '';

        // Créer un élément temporaire pour manipuler le HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Supprimer les styles inline inutiles
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            // Garder seulement certains styles (bold, italic)
            const style = el.getAttribute('style');
            if (style) {
                const keepStyles = [];
                if (style.includes('font-weight') && style.includes('bold')) {
                    keepStyles.push('font-weight: bold');
                }
                if (style.includes('font-style') && style.includes('italic')) {
                    keepStyles.push('font-style: italic');
                }
                if (keepStyles.length > 0) {
                    el.setAttribute('style', keepStyles.join('; '));
                } else {
                    el.removeAttribute('style');
                }
            }

            // Supprimer les classes inutiles
            el.removeAttribute('class');
        });

        // Convertir les <strong> et <em> pour uniformité
        return temp.innerHTML;
    },

    createPlumeStructure(chapters, actTitle = null) {
        const now = new Date().toISOString();
        if (!actTitle) actTitle = Localization.t('import.default.act');

        const act = createAct(actTitle, {
            description: Localization.t('import.info.imported_on').replace('{0}', new Date().toLocaleDateString(Localization.current === 'fr' ? 'fr-FR' : 'en-US'))
        });

        chapters.forEach((chapter, index) => {
            const plumeChapter = createChapter(chapter.title || Localization.t('import.default.chapter').replace('{0}', index + 1));

            // Créer une scène avec le contenu du chapitre
            const scene = createScene(Localization.t('import.default.scene'), {
                content: chapter.content,
                wordCount: this.countWords(chapter.content)
            });

            plumeChapter.scenes.push(scene);
            act.chapters.push(plumeChapter);
        });

        return act;
    },

    /**
     * Compte les mots dans un contenu HTML
     * @param {string} html - Contenu HTML
     * @returns {number}
     */
    countWords(text) {
        if (typeof StatsModel !== 'undefined' && typeof StatsModel.getWordCount === 'function') {
            return StatsModel.getWordCount(text);
        }
        // Fallback matching StatsModel logic if StatsModel is not available
        if (!text) return 0;
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ');
        return cleanText.split(/\s+/).filter(w => w.length > 0).length;
    }
};
