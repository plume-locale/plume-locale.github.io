/**
 * [MVVM : Arc Board Import/Export]
 * Handles Excel (XLSX) and Markdown (.md) export/import for the Arc Board.
 */

const ArcBoardImportExport = {
    /**
     * Exports an arc or all arcs to Excel.
     * @param {string|null} arcId - ID of the arc to export, or null for all.
     */
    exportToExcel: function (arcId = null) {
        const arcs = arcId ? [ArcRepository.getById(arcId)] : ArcRepository.getAll();
        if (arcs.length === 0 || !arcs[0]) {
            alert(Localization.t('arc.export.error_no_arc'));
            return;
        }

        const excelData = [];
        // Header
        excelData.push([
            'Export ID',
            Localization.t('arc.export.col_arc'),
            Localization.t('arc.export.col_category'),
            Localization.t('arc.export.col_board_column'),
            Localization.t('arc.export.col_type'),
            Localization.t('arc.export.col_content'),
            Localization.t('arc.export.col_notes'),
            'Links To (IDs)',
            'X', 'Y'
        ]);

        arcs.forEach(arc => {
            if (!arc.board || !arc.board.items) return;

            // Get connections map for this arc
            const connections = arc.board.connections || [];

            // Process items
            arc.board.items.forEach(item => {
                const itemLinks = connections
                    .filter(c => c.fromId === item.id)
                    .map(c => c.toId)
                    .join(',');

                if (item.type === 'column') {
                    // Column
                    excelData.push([
                        item.id,
                        arc.title,
                        arc.category,
                        item.title,
                        'COLUMN',
                        item.title,
                        '',
                        itemLinks,
                        item.x,
                        item.y
                    ]);

                    // Cards in column
                    if (item.cards) {
                        item.cards.forEach(card => {
                            const cardLinks = connections
                                .filter(c => c.fromId === card.id)
                                .map(c => c.toId)
                                .join(',');

                            excelData.push([
                                card.id,
                                arc.title,
                                arc.category,
                                item.title,
                                card.type.toUpperCase(),
                                this._getCardMainContent(card),
                                this._getCardDetails(card),
                                cardLinks,
                                '', ''
                            ]);
                        });
                    }
                } else {
                    // Floating items
                    excelData.push([
                        item.id,
                        arc.title,
                        arc.category,
                        '',
                        item.type.toUpperCase(),
                        this._getItemMainContent(item),
                        this._getItemDetails(item),
                        itemLinks,
                        item.x,
                        item.y
                    ]);
                }
            });
        });

        // Create XLSX
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        const wscols = [
            { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 6 }, { wch: 6 }
        ];
        ws['!cols'] = wscols;

        const sheetName = arcs.length === 1 ? arcs[0].title.substring(0, 31) : 'Arcs Board';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const prefix = arcs.length === 1 ? arcs[0].title : 'Arcs';
        const fileName = `${prefix.replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    },
    /**
     * Triggers the Excel import process.
     */
    importFromExcel: function (file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 1) {
                alert(Localization.t('arc.import.error_empty'));
                return;
            }

            this.processImportData(json);
        };
        reader.readAsArrayBuffer(file);
    },

    /**
     * Processes JSON from Excel to create/update arcs.
     */
    processImportData: function (data) {
        const headers = data[0];
        const rows = data.slice(1);

        const getIdx = (key, fallback) => {
            const localized = Localization.t(key);
            const idx = headers.indexOf(localized);
            if (idx !== -1) return idx;
            // Try common variations
            return [fallback, 'ID', 'Export ID', 'Links', 'Links To'].findIndex(f => headers.includes(f));
        };

        const idIdx = getIdx('arc.export.col_id', 'Export ID');
        const arcIdx = getIdx('arc.export.col_arc', 'Arc');
        const catIdx = getIdx('arc.export.col_category', 'Catégorie');
        const colIdx = getIdx('arc.export.col_board_column', 'Colonne');
        const typeIdx = getIdx('arc.export.col_type', 'Type');
        const contentIdx = getIdx('arc.export.col_content', 'Contenu');
        const notesIdx = getIdx('arc.export.col_notes', 'Notes / Détails');
        const linksIdx = headers.findIndex(h => h && (h.includes('Links') || h.includes('Liens')));
        const xIdx = headers.indexOf('X');
        const yIdx = headers.indexOf('Y');

        let currentArc = null;
        const idMap = new Map(); // Old ID -> New ID mapping
        const connectionsToRebuild = []; // { arcId, fromOldId, toOldIds }

        // --- FIRST PASS: Create Items ---
        rows.forEach(row => {
            const arcTitle = row[arcIdx];
            if (!arcTitle) return;

            // Find or Create Arc
            if (!currentArc || currentArc.title !== arcTitle) {
                currentArc = project.narrativeArcs.find(a => a.title === arcTitle);
                if (!currentArc) {
                    currentArc = ArcRepository.create({
                        title: arcTitle,
                        category: row[catIdx] || 'intrigue'
                    });
                }
            }

            const oldId = row[idIdx];
            const boardColumnName = row[colIdx];
            const type = (row[typeIdx] || 'NOTE').toLowerCase();
            const content = row[contentIdx] || '';
            const notes = row[notesIdx] || '';
            const links = row[linksIdx] || '';

            let newItem = null;

            if (type === 'column') {
                newItem = currentArc.board.items.find(i => i.type === 'column' && i.title === content);
                if (!newItem) {
                    newItem = BoardItemRepository.create(currentArc.id, 'column', { x: row[xIdx] || 100, y: row[yIdx] || 100 }, { title: content });
                }
            } else if (boardColumnName) {
                let col = currentArc.board.items.find(i => i.type === 'column' && i.title === boardColumnName);
                if (!col) {
                    col = BoardItemRepository.create(currentArc.id, 'column', { x: 100, y: 100 }, { title: boardColumnName });
                }
                const cardData = this._parseDetails(type, content, notes);
                newItem = CardRepository.create(currentArc.id, col.id, type, cardData);
            } else {
                const itemData = this._parseDetails(type, content, notes);
                newItem = BoardItemRepository.create(currentArc.id, type, { x: row[xIdx] || 100, y: row[yIdx] || 100 }, itemData);
            }

            if (newItem && oldId) {
                idMap.set(oldId.toString(), newItem.id);
            }

            if (links) {
                connectionsToRebuild.push({
                    arcId: currentArc.id,
                    fromOldId: oldId.toString(),
                    toOldIds: links.toString().split(',')
                });
            }
        });

        // --- SECOND PASS: Rebuild Connections ---
        connectionsToRebuild.forEach(task => {
            const newFromId = idMap.get(task.fromOldId);
            if (!newFromId) return;

            task.toOldIds.forEach(oldToId => {
                const newToId = idMap.get(oldToId.trim());
                if (newToId) {
                    ConnectionRepository.create(task.arcId, newFromId, newToId);
                }
            });
        });

        alert(Localization.t('arc.import.success'));
        if (typeof ArcBoardViewModel !== 'undefined') {
            ArcBoardViewModel.render();
        }
    },

    // --- Helpers ---

    _getItemMainContent: function (item) {
        switch (item.type) {
            case 'column': return item.title;
            case 'note': return item.content;
            case 'comment': return item.content;
            case 'todo': return item.title;
            case 'link': return item.title || item.url;
            case 'scene': return item.sceneTitle;
            case 'image': return item.caption || item.src;
            case 'table': return `Table ${item.rows}x${item.cols}`;
            default: return '';
        }
    },

    _getItemDetails: function (item) {
        switch (item.type) {
            case 'todo': return (item.items || []).map(i => `[${i.completed ? 'x' : ' '}] ${i.text}`).join('\n');
            case 'scene': return item.notes;
            case 'table': return JSON.stringify(item.data);
            case 'link': return item.url;
            default: return '';
        }
    },

    _getCardMainContent: function (card) {
        return this._getItemMainContent(card);
    },

    _getCardDetails: function (card) {
        return this._getItemDetails(card);
    },

    _parseDetails: function (type, content, notes) {
        const data = {};
        switch (type) {
            case 'note':
            case 'comment':
                data.content = content;
                break;
            case 'todo':
                data.title = content;
                data.items = notes.split('\n').filter(l => l.trim()).map(l => {
                    const match = l.match(/^\[(x| )\] (.*)/);
                    if (match) return { completed: match[1] === 'x', text: match[2] };
                    return { completed: false, text: l };
                });
                break;
            case 'scene':
                // Attempt to link to a REAL scene ID from the project
                const actualScene = project.structure.scenes.find(s => s.title === content);
                data.structureId = actualScene ? actualScene.id : null;
                data.sceneTitle = actualScene ? actualScene.title : content;
                data.notes = notes;
                break;
            case 'link':
                data.title = content;
                data.url = notes;
                break;
            default:
                data.content = content;
        }
        return data;
    },
    _downloadFile: function (content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
};
