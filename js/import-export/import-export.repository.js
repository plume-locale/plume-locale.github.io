/**
 * [MVVM : Repository]
 * Import/Export Repository
 * Handles file generation, reading, and downloading.
 */

const ImportExportRepository = {

    /**
     * Download content as a file
     */
    downloadFile: function (content, filename, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); // Required for Firefox sometimes
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Read a file as text
     */
    readFileAsText: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * Generate Markdown content
     */
    generateMarkdown: function (content, options, projectTitle) {
        const divider = this.getSceneDivider(options.sceneDivider);
        let markdown = `# ${projectTitle}\n\n`;

        content.acts.forEach(act => {
            if (options.includeActTitles) {
                markdown += `# ${act.title}\n\n`;
            }

            act.chapters.forEach(chapter => {
                markdown += `## ${chapter.title}\n\n`;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    if (options.includeSceneSubtitles && scene.title) {
                        markdown += `### ${scene.title}\n\n`;
                    }

                    if (options.exportSummaries && scene.summary) {
                        markdown += `> ${scene.summary}\n\n`;
                    }

                    if (options.exportProse && scene.content) {
                        markdown += `${this.stripHTML(scene.content)}\n`;
                    }

                    if (sceneIndex < chapter.scenes.length - 1) {
                        markdown += divider;
                    }
                });

                markdown += '\n\n';
            });
        });

        return markdown;
    },

    /**
     * Generate Plain Text content
     */
    generateTXT: function (content, options, projectTitle) {
        const divider = this.getSceneDivider(options.sceneDivider);
        let text = `${projectTitle}\n${'='.repeat(projectTitle.length)}\n\n`;

        content.acts.forEach(act => {
            if (options.includeActTitles) {
                text += `${act.title}\n${'-'.repeat(act.title.length)}\n\n`;
            }

            act.chapters.forEach(chapter => {
                text += `${chapter.title}\n\n`;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    if (options.includeSceneSubtitles && scene.title) {
                        text += `${scene.title}\n\n`;
                    }

                    if (options.exportSummaries && scene.summary) {
                        text += `[${Localization.t('export.novel.summary_prefix')}: ${scene.summary}]\n\n`;
                    }

                    if (options.exportProse && scene.content) {
                        text += `${this.stripHTML(scene.content)}\n`;
                    }

                    if (sceneIndex < chapter.scenes.length - 1) {
                        text += divider;
                    }
                });

                text += '\n\n';
            });
        });

        return text;
    },

    /**
     * Generate HTML content
     */
    generateHTML: function (content, options, projectTitle) {
        const divider = this.getSceneDivider(options.sceneDivider).replace(/\n/g, '<br>');

        let html = `<!DOCTYPE html>
<html lang="${Localization.getLocale()}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
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
    <h1>${projectTitle}</h1>
`;

        content.acts.forEach(act => {
            if (options.includeActTitles) {
                html += `    <h2>${act.title}</h2>\n`;
            }

            act.chapters.forEach(chapter => {
                html += `    <h3>${chapter.title}</h3>\n`;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    if (options.includeSceneSubtitles && scene.title) {
                        html += `    <h4>${scene.title}</h4>\n`;
                    }

                    if (options.exportSummaries && scene.summary) {
                        html += `    <div class="summary">${scene.summary}</div>\n`;
                    }

                    if (options.exportProse && scene.content) {
                        const plainText = this.stripHTML(scene.content);
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
    },

    /**
     * Generate EPUB (Async)
     */
    generateEPUB: async function (content, options, projectTitle) {
        if (typeof JSZip === 'undefined') {
            throw new Error("JSZip library not loaded");
        }

        const zip = new JSZip();
        // ... (Logic from original 39.export.js, abridged for brevity but kept functional)
        const bookId = 'plume-' + Date.now();
        const timestamp = new Date().toISOString().split('.')[0] + 'Z';

        const escapeXML = (str) => {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        };
        const stripHTML = this.stripHTML;
        const toXHTML = (html) => {
            if (!html) return '';
            const plainText = stripHTML(html);
            const paragraphs = plainText.split('\n').filter(p => p.trim());
            return paragraphs.map(p => `<p>${escapeXML(p)}</p>`).join('\n');
        };

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

        // Basic EPUB Structure
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
        zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);

        // CSS
        zip.file('OEBPS/styles.css', `body{font-family:serif;margin:1em;line-height:1.6}h1,h2,h3{text-align:center;page-break-before:always}.divider{text-align:center;margin:1.5em 0}`);

        // Content
        let manifestItems = [];
        let spineItems = [];
        let navContent = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>TOC</title></head><body><nav epub:type="toc"><ol>`;

        // Title Page
        zip.file('OEBPS/title.xhtml', `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXML(projectTitle)}</title></head><body><div style="text-align:center;margin-top:30%;"><h1>${escapeXML(projectTitle)}</h1></div></body></html>`);
        manifestItems.push('<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>');
        spineItems.push('<itemref idref="title"/>');
        navContent += `<li><a href="title.xhtml">${escapeXML(projectTitle)}</a></li>`;

        let chapterNum = 0;
        content.acts.forEach(act => {
            // simplified nav
            act.chapters.forEach(chapter => {
                chapterNum++;
                const chapterId = `chapter${chapterNum}`;
                const fileName = `${chapterId}.xhtml`;
                let chContent = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXML(chapter.title)}</title><link rel="stylesheet" href="styles.css"/></head><body>`;

                chContent += `<h2>${escapeXML(chapter.title)}</h2>`;

                chapter.scenes.forEach((scene, i) => {
                    if (options.includeSceneSubtitles && scene.title) chContent += `<h3>${escapeXML(scene.title)}</h3>`;
                    if (options.exportProse && scene.content) chContent += toXHTML(scene.content);
                    if (i < chapter.scenes.length - 1) chContent += getDividerXHTML();
                });

                chContent += `</body></html>`;
                zip.file(`OEBPS/${fileName}`, chContent);
                manifestItems.push(`<item id="${chapterId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
                spineItems.push(`<itemref idref="${chapterId}"/>`);
                navContent += `<li><a href="${fileName}">${escapeXML(chapter.title)}</a></li>`;
            });
        });

        navContent += `</ol></nav></body></html>`;
        zip.file('OEBPS/nav.xhtml', navContent);
        manifestItems.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');

        const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="BookId">${bookId}</dc:identifier>
        <dc:title>${escapeXML(projectTitle)}</dc:title>
        <dc:language>${Localization.getLocale()}</dc:language>
        <meta property="dcterms:modified">${timestamp}</meta>
    </metadata>
    <manifest>
        <item id="css" href="styles.css" media-type="text/css"/>
        ${manifestItems.join('\n')}
    </manifest>
    <spine>
        ${spineItems.join('\n')}
    </spine>
</package>`;
        zip.file('OEBPS/content.opf', contentOPF);

        return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    },

    /**
 * Generate DOCX (Async)
 */
    generateDOCX: async function (content, options, projectTitle) {
        if (typeof docx === 'undefined') {
            throw new Error("DOCX library not loaded");
        }
        const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = docx;

        const children = [];
        children.push(new Paragraph({ text: projectTitle, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));

        const divider = options.sceneDivider === 'asterisks' ? '* * *' : options.sceneDivider === 'hash' ? '###' : options.sceneDivider === 'line' ? '---' : '';

        content.acts.forEach(act => {
            if (options.includeActTitles) children.push(new Paragraph({ text: act.title, heading: HeadingLevel.HEADING_1 }));

            act.chapters.forEach(chapter => {
                children.push(new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_2 }));

                chapter.scenes.forEach((scene, i) => {
                    if (options.includeSceneSubtitles && scene.title) children.push(new Paragraph({ text: scene.title, heading: HeadingLevel.HEADING_3 }));
                    if (options.exportProse && scene.content) {
                        const plainText = this.stripHTML(scene.content);
                        const parts = plainText.split('\n');
                        parts.forEach(p => {
                            if (p.trim()) children.push(new Paragraph({ text: p.trim() }));
                        });
                    }
                    if (i < chapter.scenes.length - 1 && divider) {
                        children.push(new Paragraph({ text: divider, alignment: AlignmentType.CENTER }));
                    }
                });
            });
        });

        const doc = new Document({ sections: [{ children: children }] });
        return await Packer.toBlob(doc);
    },

    // --- Helpers ---

    getSceneDivider: function (type) {
        switch (type) {
            case 'asterisks': return '\n\n* * *\n\n';
            case 'hash': return '\n\n###\n\n';
            case 'line': return '\n\n---\n\n';
            case 'space': return '\n\n\n';
            case 'none': return '\n\n';
            default: return '\n\n* * *\n\n';
        }
    },

    stripHTML: function (html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
};
