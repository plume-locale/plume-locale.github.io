/**
 * [Import/Export — Structured ZIP Export]
 *
 * Generates a structured ZIP folder with one .md file per item,
 * organized in thematic subfolders. Non-text data (mindmaps, globalnotes,
 * map image) are exported as .json or .png.
 *
 * Data sources:
 *  - project.acts[]                     → manuscript/
 *  - project.frontMatter[]              → front-matter/
 *  - project.characters[]               → characters/
 *  - project.world[]                    → world/{type}/
 *  - project.codex[]                    → codex/{category}/
 *  - project.timeline[]                 → timeline/
 *  - project.notes[]                    → notes/
 *  - project.relationships[]            → relations/
 *  - project.narrativeArcs[]            → arcs/
 *  - project.plotGrid / plotPoints      → plotgrid/
 *  - project.investigationBoard         → investigation/
 *  - project.mindmaps[]                 → mindmaps/
 *  - project.globalnotes                → globalnotes/
 *  - project.mapLocations / mapImage    → map/
 */

const StructuredExport = {

    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Convert a string to a safe filename slug.
     * @param {string} str
     * @returns {string}
     */
    slugify(str) {
        if (!str) return Localization.t('common.no_title', 'no-title');
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')   // strip accents
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')  // strip forbidden chars
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9\-_]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 80) || Localization.t('common.item', 'item');
    },

    /**
     * Strip HTML tags and return plain text.
     * @param {string} html
     * @returns {string}
     */
    stripHTML(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
    },

    /**
     * Format a date string for display.
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            return dateStr;
        }
    },

    // ─── File Generators ────────────────────────────────────────────────────

    /**
     * README.md — master index of the project.
     */
    generateReadme(project, selection) {
        const d = new Date().toLocaleDateString();
        let md = `# ${project.title || Localization.t('export.structured.readme.title_default', 'Projet')}\n\n`;
        md += `> ${Localization.t('export.structured.readme.exported_on', 'Exporté le {0}', d)}\n\n`;
        if (project.description) md += `${this.stripHTML(project.description)}\n\n`;
        if (project.genre) md += `**${Localization.t('export.structured.readme.genre', 'Genre')}** : ${project.genre}\n\n`;

        md += `## ${Localization.t('export.structured.readme.content_title', 'Contenu de cet export')}\n\n`;
        const sections = [
            { key: 'frontMatter', label: Localization.t('export.structured.readme.label.front_matter', 'Liminaires & annexes'), path: 'front-matter/' },
            { key: 'manuscript', label: Localization.t('export.structured.readme.label.manuscript', 'Manuscrit'), path: 'manuscript/' },
            { key: 'analysis', label: Localization.t('export.structured.readme.label.analysis', 'Préparation de scène'), path: 'manuscript/ (fichiers *-prep.md)' },
            { key: 'characters', label: Localization.t('export.structured.readme.label.characters', 'Personnages'), path: 'characters/' },
            { key: 'world', label: Localization.t('export.structured.readme.label.world', 'Univers'), path: 'world/' },
            { key: 'codex', label: Localization.t('export.structured.readme.label.codex', 'Codex'), path: 'codex/' },
            { key: 'timeline', label: Localization.t('export.structured.readme.label.timeline', 'Frise chronologique'), path: 'timeline/' },
            { key: 'notes', label: Localization.t('export.structured.readme.label.notes', 'Notes'), path: 'notes/' },
            { key: 'relations', label: Localization.t('export.structured.readme.label.relations', 'Relations'), path: 'relations/' },
            { key: 'arcs', label: Localization.t('export.structured.readme.label.arcs', 'Arcs narratifs'), path: 'arcs/' },
            { key: 'plotgrid', label: Localization.t('export.structured.readme.label.plotgrid', 'Grille narrative'), path: 'plotgrid/' },
            { key: 'investigation', label: Localization.t('export.structured.readme.label.investigation', 'Tableau d\'enquête'), path: 'investigation/' },
            { key: 'mindmaps', label: Localization.t('export.structured.readme.label.mindmaps', 'Cartes mentales'), path: 'mindmaps/' },
            { key: 'globalnotes', label: Localization.t('export.structured.readme.label.globalnotes', 'Notes globales'), path: 'globalnotes/' },
            { key: 'map', label: Localization.t('export.structured.readme.label.map', 'Carte du monde'), path: 'map/' },
        ];
        sections.forEach(s => {
            if (selection[s.key]) {
                md += `- [${s.label}](${s.path})\n`;
            }
        });

        return md;
    },

    /**
     * front-matter/ — one .md file per liminaire/annexe.
     */
    generateFrontMatter(project, zip, rootFolder) {
        const items = project.frontMatter || [];
        if (items.length === 0) return;

        const folder = rootFolder + 'front-matter/';
        const sorted = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

        sorted.forEach(item => {
            if (!item.isEnabled) return;
            const title = item.title || item.type || Localization.t('export.structured.front_matter.default_title', 'liminaire');
            const slug = this.slugify(title);
            let md = `---\ntype: ${item.type || 'other'}\norder: ${item.order || 0}\nenabled: true\n---\n\n`;
            md += `# ${title}\n\n`;
            if (item.content) md += this.stripHTML(item.content) + '\n';

            zip.file(folder + slug + '.md', md);
        });
    },

    /**
     * manuscript/ — acts/chapters/scenes with versions sub-folder.
     */
    generateManuscript(project, selectionState, zip, rootFolder) {
        const acts = project.acts || [];
        if (acts.length === 0) return;

        acts.forEach((act, actIdx) => {
            if (selectionState && !selectionState[`act-${act.id}`]) return;

            const actTitle = act.title || Localization.t('export.structured.manuscript.act_default', 'Acte {0}', actIdx + 1);
            const actSlug = `act-${String(actIdx + 1).padStart(2, '0')}-${this.slugify(actTitle)}`;
            const actFolder = rootFolder + 'manuscript/' + actSlug + '/';

            (act.chapters || []).forEach((chapter, chapIdx) => {
                if (selectionState && !selectionState[`chapter-${chapter.id}`]) return;

                const chapTitle = chapter.title || Localization.t('export.structured.manuscript.chapter_default', 'Chapitre {0}', chapIdx + 1);
                const chapSlug = `chapter-${String(chapIdx + 1).padStart(2, '0')}-${this.slugify(chapTitle)}`;
                const chapFolder = actFolder + chapSlug + '/';

                (chapter.scenes || []).forEach((scene, sceneIdx) => {
                    if (selectionState && !selectionState[`scene-${scene.id}`]) return;

                    const sceneTitle = scene.title || Localization.t('export.structured.manuscript.scene_default', 'Scène {0}', sceneIdx + 1);
                    const sceneSlug = `scene-${String(sceneIdx + 1).padStart(2, '0')}-${this.slugify(sceneTitle)}`;

                    // Determine active version content
                    const versions = scene.versions || [];
                    const activeVersion = versions.find(v => v.isActive) || null;
                    const activeContent = activeVersion ? activeVersion.content : (scene.content || '');

                    if (selectionState.exportManuscript) {
                        // Main scene file
                        let md = `---\ntitle: ${sceneTitle}\n`;
                        if (versions.length > 0) {
                            const activeV = activeVersion || versions[versions.length - 1];
                            md += `version: ${activeV.number || versions.length}\n`;
                            md += `is_final: ${activeV.isFinal || false}\n`;
                            if (activeV.label) md += `version_label: "${activeV.label}"\n`;
                            md += `word_count: ${activeV.wordCount || scene.wordCount || 0}\n`;
                        } else {
                            md += `word_count: ${scene.wordCount || 0}\n`;
                        }
                        if (scene.summary) md += `summary: "${scene.summary.replace(/"/g, '\\"')}"\n`;
                        md += `---\n\n`;
                        md += `# ${sceneTitle}\n\n`;
                        if (scene.summary) md += `> ${scene.summary}\n\n`;
                        if (activeContent) md += this.stripHTML(activeContent) + '\n';

                        zip.file(chapFolder + sceneSlug + '.md', md);
                    }

                    // Scene Analysis / Preparation
                    if (selectionState.exportAnalysis && scene.analysis) {
                        const analysis = scene.analysis;
                        const prepSlug = sceneSlug + '-prep';
                        let amd = `---\ntitle: ${Localization.t('export.structured.analysis.title_prefix', 'Préparation : ')}${sceneTitle}\nscene_id: ${scene.id}\n---\n\n`;
                        amd += `# ${Localization.t('export.structured.analysis.header_prefix', 'Préparation de scène : ')}${sceneTitle}\n\n`;

                        if (analysis.pov) amd += `**${Localization.t('export.structured.analysis.pov', 'Point de Vue (POV)')}** : ${analysis.pov}\n\n`;
                        if (analysis.sceneNumber) amd += `**${Localization.t('export.structured.analysis.scene_number', 'Numéro de scène')}** : ${analysis.sceneNumber}\n\n`;

                        if (analysis.impact || analysis.big3) {
                            const impact = analysis.impact || analysis.big3;
                            amd += `## ${Localization.t('export.structured.analysis.big3_title', 'Les 3 Piliers (Big 3)')}\n`;
                            amd += `- **${Localization.t('export.structured.analysis.big3.char', 'Personnage')}** : ${impact.char || ''}\n`;
                            amd += `- **${Localization.t('export.structured.analysis.big3.world', 'Univers')}** : ${impact.world || ''}\n`;
                            amd += `- **${Localization.t('export.structured.analysis.big3.plot', 'Intrigue')}** : ${impact.plot || ''}\n\n`;
                        }

                        if (analysis.objective) {
                            amd += `## ${Localization.t('export.structured.analysis.objective_title', 'Objectifs')}\n`;
                            amd += `**${Localization.t('export.structured.analysis.objective.goal', 'But principal')}** : ${analysis.objective.goal || ''}\n\n`;
                            if (analysis.objective.subplot) amd += `**${Localization.t('export.structured.analysis.objective.subplot', 'Sous-intrigue')}** : ${analysis.objective.subplot}\n\n`;
                            if (analysis.objective.notes) amd += `### ${Localization.t('export.structured.analysis.objective.notes', "Notes d'intention")}\n${this.stripHTML(analysis.objective.notes)}\n\n`;
                        }

                        if (analysis.progression) {
                            const p = analysis.progression;
                            amd += `## ${Localization.t('export.structured.analysis.progression_title', 'Progression Narrative')}\n`;
                            amd += `1. **${Localization.t('export.structured.analysis.progression.start', 'Situation Initiale')}** : ${p.start || ''}\n`;
                            amd += `2. **${Localization.t('export.structured.analysis.progression.obstacle', 'Obstacle / Conflit')}** : ${p.obstacle || ''}\n`;
                            amd += `3. **${Localization.t('export.structured.analysis.progression.resolution', 'Action / Résolution')}** : ${p.resolution || ''}\n`;
                            amd += `4. **${Localization.t('export.structured.analysis.progression.twist', 'Péripétie / Twist')}** : ${p.twist || ''}\n`;
                            amd += `5. **${Localization.t('export.structured.analysis.progression.end', 'Situation Finale')}** : ${p.end || ''}\n`;
                            amd += `6. **${Localization.t('export.structured.analysis.progression.consequence', 'Conséquence / Suite')}** : ${p.consequence || ''}\n`;
                        }

                        zip.file(chapFolder + prepSlug + '.md', amd);
                    }

                    // Archived versions (only if more than 1)
                    if (versions.length > 1) {
                        const versionsFolder = chapFolder + sceneSlug + '-versions/';
                        versions.forEach(v => {
                            const label = v.label || `v${v.number}`;
                            const vSlug = `v${v.number}-${this.slugify(label)}`;
                            let vmd = `---\nversion_number: ${v.number}\n`;
                            if (v.label) vmd += `label: "${v.label}"\n`;
                            vmd += `is_active: ${v.isActive || false}\n`;
                            vmd += `is_final: ${v.isFinal || false}\n`;
                            vmd += `word_count: ${v.wordCount || 0}\n`;
                            if (v.createdAt) vmd += `created_at: "${v.createdAt}"\n`;
                            vmd += `---\n\n`;
                            vmd += `# ${sceneTitle} — ${v.label || Localization.t('export.structured.manuscript.version_default', 'Version {0}', v.number)}\n\n`;
                            if (v.content) vmd += this.stripHTML(v.content) + '\n';

                            zip.file(versionsFolder + vSlug + '.md', vmd);
                        });
                    }
                });
            });
        });
    },

    /**
     * characters/ — one .md per character.
     */
    generateCharacters(project, zip, rootFolder) {
        const chars = project.characters || [];
        if (chars.length === 0) return;

        chars.forEach(char => {
            const name = char.name || Localization.t('export.structured.character.default_name', 'Personnage');
            const slug = this.slugify(name);
            let md = `---\nname: "${name}"\n`;
            if (char.role) md += `role: "${char.role}"\n`;
            md += `---\n\n`;
            md += `# ${name}\n\n`;
            if (char.role) md += `**${Localization.t('export.structured.character.role', 'Rôle')}** : ${char.role}\n\n`;
            const fullName = [char.firstName, char.lastName].filter(Boolean).join(' ');
            if (fullName) md += `**${Localization.t('export.structured.character.fullname', 'Prénom / Nom')}** : ${fullName}\n\n`;
            if (char.physicalDescription) {
                md += `## ${Localization.t('export.structured.character.physical', 'Apparence physique')}\n\n${this.stripHTML(char.physicalDescription)}\n\n`;
            }
            if (char.past) {
                md += `## ${Localization.t('export.structured.character.past', 'Passé')}\n\n${this.stripHTML(char.past)}\n\n`;
            }
            if (char.notes) {
                md += `## ${Localization.t('export.structured.character.notes', 'Notes')}\n\n${this.stripHTML(char.notes)}\n\n`;
            }
            if (char.backstory) md += `## ${Localization.t('export.structured.character.backstory', 'Backstory')}\n\n${this.stripHTML(char.backstory)}\n\n`;
            if (char.motivations) md += `## ${Localization.t('export.structured.character.motivations', 'Motivations')}\n\n${this.stripHTML(char.motivations)}\n\n`;
            if (char.arc) md += `## ${Localization.t('export.structured.character.arc', 'Arc')}\n\n${this.stripHTML(char.arc)}\n\n`;

            zip.file(rootFolder + 'characters/' + slug + '.md', md);
        });
    },

    /**
     * world/{type}/ — one .md per world item, subfoldered by type.
     */
    generateWorld(project, zip, rootFolder) {
        const world = project.world || [];
        if (world.length === 0) return;

        world.forEach(item => {
            const name = item.name || Localization.t('export.structured.world.default_name', 'Élément');
            const type = this.slugify(item.type || 'other');
            const slug = this.slugify(name);
            let md = `---\nname: "${name}"\ntype: "${item.type || 'other'}"\n---\n\n`;
            md += `# ${name}\n\n`;
            if (item.type) md += `**${Localization.t('export.structured.world.type', 'Type')}** : ${item.type}\n\n`;
            if (item.description) md += `## ${Localization.t('export.structured.world.description', 'Description')}\n\n${this.stripHTML(item.description)}\n\n`;
            if (item.details) md += `## ${Localization.t('export.structured.world.details', 'Détails')}\n\n${this.stripHTML(item.details)}\n\n`;
            if (item.history) md += `## ${Localization.t('export.structured.world.history', 'Histoire')}\n\n${this.stripHTML(item.history)}\n\n`;
            if (item.notes) md += `## ${Localization.t('export.structured.character.notes', 'Notes')}\n\n${this.stripHTML(item.notes)}\n\n`;

            zip.file(rootFolder + 'world/' + type + '/' + slug + '.md', md);
        });
    },

    /**
     * codex/{category}/ — one .md per codex entry.
     */
    generateCodex(project, zip, rootFolder) {
        const codex = project.codex || [];
        if (codex.length === 0) return;

        codex.forEach(entry => {
            const title = entry.title || Localization.t('export.structured.codex.default_title', 'Entrée');
            const category = this.slugify(entry.category || 'general');
            const slug = this.slugify(title);
            let md = `---\ntitle: "${title}"\ncategory: "${entry.category || 'general'}"\n---\n\n`;
            md += `# ${title}\n\n`;
            if (entry.category) md += `**${Localization.t('export.structured.codex.category', 'Catégorie')}** : ${entry.category}\n\n`;
            if (entry.summary) md += `> ${entry.summary}\n\n`;
            if (entry.content) md += `## ${Localization.t('export.structured.codex.content', 'Contenu')}\n\n${this.stripHTML(entry.content)}\n\n`;

            zip.file(rootFolder + 'codex/' + category + '/' + slug + '.md', md);
        });
    },

    /**
     * timeline/ — one .md per event, prefixed with date for sort order.
     */
    generateTimeline(project, zip, rootFolder) {
        const events = project.timeline || [];
        if (events.length === 0) return;

        events.forEach((event, idx) => {
            const title = event.title || Localization.t('export.structured.timeline.default_title', 'Événement {0}', idx + 1);
            const datePrefix = event.date ? this.slugify(event.date) + '-' : '';
            const slug = datePrefix + this.slugify(title);
            let md = `---\ntitle: "${title}"\n`;
            if (event.date) md += `date: "${event.date}"\n`;
            md += `---\n\n`;
            md += `# ${event.date ? event.date + ' — ' : ''}${title}\n\n`;
            if (event.content) md += this.stripHTML(event.content) + '\n';

            zip.file(rootFolder + 'timeline/' + slug + '.md', md);
        });
    },

    /**
     * notes/ — one .md per note.
     */
    generateNotes(project, zip, rootFolder) {
        const notes = project.notes || [];
        if (notes.length === 0) return;

        notes.forEach((note, idx) => {
            const title = note.title || Localization.t('export.structured.notes.default_title', 'Note {0}', idx + 1);
            const slug = this.slugify(title);
            let md = `---\ntitle: "${title}"\n---\n\n`;
            md += `# ${title}\n\n`;
            if (note.content) md += this.stripHTML(note.content) + '\n';

            zip.file(rootFolder + 'notes/' + slug + '.md', md);
        });
    },

    /**
     * relations/relations.md — table of all relationships.
     */
    generateRelations(project, zip, rootFolder) {
        const rels = project.relationships || [];
        let md = `# ${Localization.t('export.structured.relations.title', 'Relations entre personnages')}\n\n`;
        if (rels.length === 0) {
            md += `_${Localization.t('export.structured.relations.empty', 'Aucune relation définie.')}_\n`;
        } else {
            md += `| ${Localization.t('export.structured.relations.col_source', 'Source')} | ${Localization.t('export.structured.relations.col_type', 'Type')} | ${Localization.t('export.structured.relations.col_target', 'Cible')} | ${Localization.t('export.structured.relations.col_description', 'Description')} |\n`;
            md += `|--------|------|-------|-------------|\n`;
            rels.forEach(rel => {
                const src = rel.sourceName || rel.sourceId || '?';
                const tgt = rel.targetName || rel.targetId || '?';
                const type = rel.type || '';
                const desc = rel.description || '';
                md += `| ${src} | ${type} | ${tgt} | ${desc} |\n`;
            });
        }
        zip.file(rootFolder + 'relations/relations.md', md);
    },

    /**
     * arcs/ — one .md per narrative arc.
     */
    generateArcs(project, zip, rootFolder) {
        const arcs = project.narrativeArcs || [];
        let indexMd = `# Arcs narratifs\n\n`;

        if (arcs.length === 0) {
            indexMd += '_Aucun arc défini._\n';
            zip.file(rootFolder + 'arcs/arcs.md', indexMd);
            return;
        }

        arcs.forEach(arc => {
            const title = arc.title || Localization.t('export.structured.readme.label.arcs', 'Arc');
            const slug = this.slugify(title);

            // Update global index
            indexMd += `## ${title}\n`;
            if (arc.description) indexMd += `> ${this.stripHTML(arc.description)}\n`;
            if (arc.category) indexMd += `**${Localization.t('export.structured.arcs.category', 'Catégorie')}** : ${arc.category}\n`;
            if (arc.color) indexMd += `**${Localization.t('export.structured.arcs.color', 'Couleur')}** : ${arc.color}\n`;
            indexMd += '\n';

            // Individual arc file with board contents
            let md = `---\ntitle: "${title}"\n`;
            if (arc.category) md += `category: "${arc.category}"\n`;
            if (arc.color) md += `color: "${arc.color}"\n`;
            if (arc.created) md += `created: "${arc.created}"\n`;
            md += `---\n\n`;
            md += `# ${title}\n\n`;
            if (arc.description) md += `> ${this.stripHTML(arc.description)}\n\n`;

            const board = arc.board || {};
            const items = board.items || [];
            const columns = items.filter(i => i.type === 'column');
            const floatingItems = items.filter(i => i.type !== 'column');

            if (columns.length > 0) {
                md += `## ${Localization.t('export.structured.arcs.columns_title', 'Colonnes')}\n\n`;
                columns.forEach(col => {
                    md += `### ${col.title || Localization.t('export.structured.arcs.column_default', 'Colonne')}\n\n`;
                    (col.cards || []).forEach(card => {
                        const cardTitle = card.title || card.label || '';
                        const cardContent = this.stripHTML(card.content || card.description || '');
                        md += `- **${cardTitle}**`;
                        if (card.type && card.type !== 'text') md += ` *(${card.type})*`;
                        if (cardContent) md += `\n  ${cardContent}`;
                        md += '\n';
                    });
                    md += '\n';
                });
            }

            if (floatingItems.length > 0) {
                md += `## ${Localization.t('export.structured.arcs.free_items_title', 'Éléments libres')}\n\n`;
                floatingItems.forEach(item => {
                    const itemTitle = item.title || item.label || '';
                    const itemContent = this.stripHTML(item.content || item.description || '');
                    md += `- **${itemTitle}**`;
                    if (item.type) md += ` *(${item.type})*`;
                    if (itemContent) md += `\n  ${itemContent}`;
                    md += '\n';
                });
            }

            // Scene presence (which scenes are in this arc)
            if (arc.scenePresence && arc.scenePresence.length > 0) {
                md += `## ${Localization.t('export.structured.arcs.presence_title', 'Présence dans les scènes')}\n\n`;
                arc.scenePresence.forEach(sp => {
                    md += `- Scène ID: ${sp.sceneId}`;
                    if (sp.columnId) md += ` (${Localization.t('export.structured.arcs.column_default', 'colonne')}: ${sp.columnId})`;
                    md += '\n';
                });
            }

            zip.file(rootFolder + 'arcs/' + slug + '.md', md);
        });

        zip.file(rootFolder + 'arcs/index.md', indexMd);
    },

    /**
     * plotgrid/plotgrid.md — plot grid cards.
     */
    generatePlotgrid(project, zip, rootFolder) {
        const plotGrid = project.plotGrid || {};
        const cards = plotGrid.cards || project.plotPoints || [];
        let md = `# ${Localization.t('export.structured.plotgrid.title', 'Grille narrative')}\n\n`;

        if (cards.length === 0) {
            md += `_${Localization.t('export.structured.plotgrid.empty', 'Aucune carte dans la grille narrative.')}_\n`;
        } else {
            cards.forEach(card => {
                const title = card.title || card.label || Localization.t('export.structured.plotgrid.card_default', 'Carte');
                md += `## ${title}\n\n`;
                if (card.content) md += this.stripHTML(card.content) + '\n\n';
                if (card.type) md += `**${Localization.t('export.structured.plotgrid.type', 'Type')}** : ${card.type}\n\n`;
                if (card.character) md += `**${Localization.t('export.structured.plotgrid.character', 'Personnage')}** : ${card.character}\n\n`;
            });
        }

        zip.file(rootFolder + 'plotgrid/plotgrid.md', md);
    },

    /**
     * investigation/{case}/ — one folder per case.
     */
    generateInvestigation(project, zip, rootFolder) {
        const board = project.investigationBoard || {};
        const cases = board.cases || [];
        const allFacts = board.facts || [];
        const knowledge = board.knowledge || [];
        const suspectLinks = board.suspectLinks || [];

        if (cases.length === 0 && allFacts.length === 0) return;

        // If no cases, dump everything in a default folder
        const caseList = cases.length > 0 ? cases : [{ id: null, title: Localization.t('export.structured.investigation.case_default', 'Enquête'), description: '' }];

        caseList.forEach(c => {
            const caseTitle = c.title || c.name || Localization.t('export.structured.investigation.case_default', 'Enquête');
            const caseSlug = this.slugify(caseTitle);
            const caseFolder = rootFolder + 'investigation/' + caseSlug + '/';

            // case.md
            let caseMd = `---\ntitle: "${caseTitle}"\n---\n\n# ${caseTitle}\n\n`;
            if (c.description) caseMd += this.stripHTML(c.description) + '\n';
            zip.file(caseFolder + 'case.md', caseMd);

            // facts.md
            const facts = c.id
                ? allFacts.filter(f => f.caseId === c.id)
                : allFacts;

            let factsMd = `# ${Localization.t('export.structured.investigation.facts_title', 'Faits & Indices')}\n\n`;
            if (facts.length === 0) {
                factsMd += `_${Localization.t('export.structured.investigation.facts_empty', 'Aucun fait enregistré.')}_\n`;
            } else {
                factsMd += `| ${Localization.t('export.structured.investigation.facts.col_fact', 'Fait')} | ${Localization.t('export.structured.world.type', 'Type')} | ${Localization.t('export.structured.investigation.facts.col_status', 'Statut')} | ${Localization.t('export.structured.world.description', 'Description')} |\n`;
                factsMd += `|------|------|--------|-------------|\n`;
                facts.forEach(f => {
                    const label = f.label || '';
                    const type = f.type || '';
                    const status = f.truthStatus || '';
                    const desc = f.description || '';
                    factsMd += `| ${label} | ${type} | ${status} | ${desc} |\n`;
                });
            }
            zip.file(caseFolder + 'facts.md', factsMd);

            // suspects.md (MMO)
            const links = c.id
                ? suspectLinks.filter(l => l.caseId === c.id)
                : suspectLinks;

            let suspectsMd = `# ${Localization.t('export.structured.investigation.suspects_title', 'Suspects — Motif / Moyen / Opportunité')}\n\n`;
            if (links.length === 0) {
                suspectsMd += `_${Localization.t('export.structured.investigation.suspects_empty', 'Aucun lien suspect enregistré.')}_\n`;
            } else {
                suspectsMd += `| ${Localization.t('export.structured.investigation.suspects.col_suspect', 'Suspect')} | ${Localization.t('export.structured.investigation.suspects.col_victim', 'Victime')} | ${Localization.t('export.structured.investigation.suspects.col_motive', 'Motif')} | ${Localization.t('export.structured.investigation.suspects.col_means', 'Moyen')} | ${Localization.t('export.structured.investigation.suspects.col_opportunity', 'Opportunité')} |\n`;
                suspectsMd += `|---------|---------|-------|-------|-------------|\n`;
                // Group by pair (suspect + victim), get latest global state
                const seen = new Set();
                links.forEach(l => {
                    const key = `${l.suspectId}_${l.victimId}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    const motif = l.motive ? `${l.motive.description || ''} (niv. ${l.motive.level || 0})` : '';
                    const means = l.means ? `${l.means.description || ''} (niv. ${l.means.level || 0})` : '';
                    const opp = l.opportunity ? `${l.opportunity.description || ''} (niv. ${l.opportunity.level || 0})` : '';
                    suspectsMd += `| ID:${l.suspectId} | ID:${l.victimId} | ${motif} | ${means} | ${opp} |\n`;
                });
            }
            zip.file(caseFolder + 'suspects.md', suspectsMd);

            // knowledge-matrix.md
            const caseKnowledge = c.id
                ? knowledge.filter(k => {
                    const fact = allFacts.find(f => f.id === k.factId);
                    return fact && fact.caseId === c.id;
                })
                : knowledge;

            if (caseKnowledge.length > 0) {
                let knowledgeMd = `# ${Localization.t('export.structured.investigation.matrix_title', 'Matrice de connaissance')}\n\n`;
                knowledgeMd += `| ${Localization.t('export.structured.investigation.matrix.col_character', 'Personnage')} | ${Localization.t('export.structured.investigation.matrix.col_fact', 'Fait')} | ${Localization.t('export.structured.investigation.matrix.col_scene', 'Scène')} | ${Localization.t('export.structured.investigation.matrix.col_knowledge', 'Connaissance')} |\n`;
                knowledgeMd += `|-----------|------|-------|-------------|\n`;
                caseKnowledge.forEach(k => {
                    const fact = allFacts.find(f => f.id === k.factId);
                    const factLabel = fact ? fact.label : `ID:${k.factId}`;
                    knowledgeMd += `| ID:${k.characterId} | ${factLabel} | ID:${k.sceneId || '-'} | ${k.state || ''} |\n`;
                });
                zip.file(caseFolder + 'knowledge-matrix.md', knowledgeMd);
            }
        });
    },

    /**
     * mindmaps/*.json — one JSON per mindmap (graph structure).
     */
    generateMindmaps(project, zip, rootFolder) {
        const mindmaps = project.mindmaps || [];
        if (mindmaps.length === 0) return;

        mindmaps.forEach(mm => {
            const title = mm.title || mm.name || 'mindmap';
            const slug = this.slugify(title);
            zip.file(rootFolder + 'mindmaps/' + slug + '.json', JSON.stringify(mm, null, 2));
        });

        // Also export flat node list if present (legacy)
        if (project.mindmapNodes && project.mindmapNodes.length > 0) {
            zip.file(rootFolder + 'mindmaps/_nodes-legacy.json',
                JSON.stringify(project.mindmapNodes, null, 2));
        }
    },

    /**
     * globalnotes/*.json — one JSON per board.
     */
    generateGlobalNotes(project, zip, rootFolder) {
        const gnotes = project.globalnotes || {};
        const boards = gnotes.boards || [];
        const allItems = gnotes.items || [];

        if (boards.length === 0 && allItems.length === 0) return;

        if (boards.length > 0) {
            boards.forEach(board => {
                const title = board.title || board.name || 'board';
                const slug = this.slugify(title);
                const boardItems = allItems.filter(i => i.boardId === board.id);
                const payload = { ...board, items: boardItems };
                zip.file(rootFolder + 'globalnotes/' + slug + '.json',
                    JSON.stringify(payload, null, 2));
            });
        } else if (allItems.length > 0) {
            // No boards, just dump all items
            zip.file(rootFolder + 'globalnotes/notes.json',
                JSON.stringify(allItems, null, 2));
        }
    },

    /**
     * map/ — PNG image + locations.md table.
     */
    generateMap(project, zip, rootFolder) {
        const locations = project.mapLocations || [];
        const mapImage = project.mapImage || null;

        if (!mapImage && locations.length === 0) return;

        // Map image: stored as base64 data URL → extract and save as PNG
        if (mapImage) {
            try {
                // mapImage is typically "data:image/png;base64,..." or "data:image/jpeg;..."
                const matches = mapImage.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    const ext = mimeType.split('/')[1] || 'png';
                    // JSZip handles base64 directly with {base64: true}
                    zip.file(rootFolder + 'map/map.' + ext, base64Data, { base64: true });
                }
            } catch (e) {
                console.warn('StructuredExport: could not decode map image', e);
            }
        }

        // Locations table
        let md = `# ${Localization.t('export.structured.map.title', 'Points sur la carte')}\n\n`;
        if (locations.length === 0) {
            md += `_${Localization.t('export.structured.map.empty', 'Aucun point défini sur la carte.')}_\n`;
        } else {
            md += `| ${Localization.t('export.structured.map.col_location', 'Lieu')} | X% | Y% | ${Localization.t('export.structured.world.description', 'Description')} |\n`;
            md += `|------|----|----|-------------|\n`;
            locations.forEach(loc => {
                const name = loc.name || loc.title || '?';
                const x = typeof loc.x === 'number' ? loc.x.toFixed(1) : (loc.x || '');
                const y = typeof loc.y === 'number' ? loc.y.toFixed(1) : (loc.y || '');
                const desc = loc.description || loc.notes || '';
                md += `| ${name} | ${x} | ${y} | ${desc} |\n`;
            });
        }
        zip.file(rootFolder + 'map/locations.md', md);
    },

    // ─── Main Entry Point ───────────────────────────────────────────────────

    /**
     * Build the ZIP and trigger download.
     * @param {Object} project             — the full project object
     * @param {Object} selection           — { manuscript, frontMatter, characters, world, ... }
     * @param {Object} manuscriptSelection — ImportExportModel.selectionState (acts/chapters/scenes)
     */
    async buildZIP(project, selection, manuscriptSelection) {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded — ZIP export unavailable.');
        }

        const zip = new JSZip();
        const projectTitle = project.title || 'Projet';
        const rootFolder = this.slugify(projectTitle) + '/';

        // README
        zip.file(rootFolder + 'README.md', this.generateReadme(project, selection));

        // Sections
        if (selection.frontMatter) this.generateFrontMatter(project, zip, rootFolder);
        if (selection.manuscript || selection.analysis) {
            // If manuscript is not selected but analysis is, we still use the manuscript selection state
            // to know which scenes to iterate over, but we pass flags to generateManuscript
            const mSelection = {
                ...manuscriptSelection,
                exportManuscript: selection.manuscript,
                exportAnalysis: selection.analysis
            };
            this.generateManuscript(project, mSelection, zip, rootFolder);
        }
        if (selection.characters) this.generateCharacters(project, zip, rootFolder);
        if (selection.world) this.generateWorld(project, zip, rootFolder);
        if (selection.codex) this.generateCodex(project, zip, rootFolder);
        if (selection.timeline) this.generateTimeline(project, zip, rootFolder);
        if (selection.notes) this.generateNotes(project, zip, rootFolder);
        if (selection.relations) this.generateRelations(project, zip, rootFolder);
        if (selection.arcs) this.generateArcs(project, zip, rootFolder);
        if (selection.plotgrid) this.generatePlotgrid(project, zip, rootFolder);
        if (selection.investigation) this.generateInvestigation(project, zip, rootFolder);
        if (selection.mindmaps) this.generateMindmaps(project, zip, rootFolder);
        if (selection.globalnotes) this.generateGlobalNotes(project, zip, rootFolder);
        if (selection.map) this.generateMap(project, zip, rootFolder);

        // Generate zip
        const dateStr = new Date().toISOString().split('T')[0];
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const filename = `${this.slugify(projectTitle)}_export_${dateStr}.zip`;

        ImportExportRepository.downloadFile(zipBlob, filename, 'application/zip');
        return filename;
    }
};

window.StructuredExport = StructuredExport;
