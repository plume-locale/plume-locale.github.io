/**
 * [MVVM : Plot Grid Import/Export]
 * Handles Excel export and import for the Plot Grid.
 */

const PlotGridImportExport = {
    /**
     * Exports the Plot Grid to an Excel file.
     */
    exportToExcel: function () {
        const data = PlotGridViewModel.getGridData();
        const columns = data.columns;
        const rows = data.rows;
        const cards = data.cards;

        // 1. Prepare Headers
        // We'll have: Act, Chapter, Scene, Synopsis, then each custom column
        const headers = [Localization.t('plotgrid.export.act'), Localization.t('plotgrid.export.chapter'), Localization.t('plotgrid.export.scene'), Localization.t('plotgrid.export.synopsis')];
        const customColumns = columns.filter(c => c.type !== 'structure');
        customColumns.forEach(col => headers.push(col.titulo || col.title));

        const excelData = [headers];

        // 2. Prepare Rows
        rows.forEach(row => {
            const excelRow = [];

            if (row.type === 'structure') {
                excelRow.push(row.parentActTitle || "");
                excelRow.push(row.parentChapterTitle || "");
                excelRow.push(row.title || "");
                excelRow.push(row.synopsis || "");
            } else {
                excelRow.push("");
                excelRow.push("");
                excelRow.push(row.title || Localization.t('plotgrid.export.custom_row'));
                excelRow.push("");
            }

            // Cards for custom columns
            customColumns.forEach(col => {
                const card = cards.find(c => c.rowId === row.id && c.colId === col.id);
                if (card) {
                    const cellTitle = card.title || Localization.t('plotgrid.export.untitled');
                    const cellContent = card.content || "";
                    excelRow.push(cellContent ? `${cellTitle}\n${cellContent}` : cellTitle);
                } else {
                    excelRow.push("");
                }
            });

            excelData.push(excelRow);
        });

        // 3. Create XLSX
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);



        const wscols = headers.map(h => ({ wch: Math.max(h.length, 15) }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, Localization.t('plotgrid.export.sheet_name'));

        // 4. Download
        const fileName = `${Localization.t('plotgrid.export.filename_prefix', [project.title || Localization.t('plotgrid.export.default_filename')])}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    },

    /**
     * Triggers the Excel import process.
     */
    importFromExcel: function (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 1) {
                alert(Localization.t('plotgrid.import.error_empty'));
                return;
            }

            this.processImportData(json);
        };
        reader.readAsArrayBuffer(file);
    },

    /**
     * Processes the JSON data from Excel and updates the Plot Grid.
     * @param {Array[]} data 2D array from Excel
     */
    processImportData: function (data) {
        const headers = data[0];
        const rowsData = data.slice(1);

        // Map standard columns
        const sceneIdx = headers.indexOf(Localization.t('plotgrid.export.scene')) !== -1 ? headers.indexOf(Localization.t('plotgrid.export.scene')) : headers.indexOf("Scène");
        const synIdx = headers.indexOf(Localization.t('plotgrid.export.synopsis')) !== -1 ? headers.indexOf(Localization.t('plotgrid.export.synopsis')) : headers.indexOf("Résumé");
        const actIdx = headers.indexOf(Localization.t('plotgrid.export.act')) !== -1 ? headers.indexOf(Localization.t('plotgrid.export.act')) : headers.indexOf("Acte");
        const chapIdx = headers.indexOf(Localization.t('plotgrid.export.chapter')) !== -1 ? headers.indexOf(Localization.t('plotgrid.export.chapter')) : headers.indexOf("Chapitre");

        if (sceneIdx === -1) {
            alert(Localization.t('plotgrid.import.error_no_scene_col'));
            return;
        }

        // Identify custom columns (starting from index 4 or based on headers not in standard list)
        const standardHeaders = [Localization.t('plotgrid.export.act'), Localization.t('plotgrid.export.chapter'), Localization.t('plotgrid.export.scene'), Localization.t('plotgrid.export.synopsis'), "Acte", "Chapitre", "Scène", "Résumé"];
        const customColMappings = []; // { title, index, colId }

        headers.forEach((h, idx) => {
            if (!standardHeaders.includes(h) && h) {
                // Check if column already exists in Plot Grid, or create it
                let col = project.plotGrid.columns.find(c => c.title === h || c.titulo === h);
                if (!col) {
                    col = PlotGridViewModel.addNewColumn(h);
                }
                customColMappings.push({ title: h, index: idx, colId: col.id });
            }
        });

        let updatedCount = 0;
        let createdCards = 0;

        // Process rows
        rowsData.forEach(rowData => {
            const sceneTitle = rowData[sceneIdx];
            if (!sceneTitle) return;

            // Find matching row in Plot Grid
            // Priority: Match by Scene title, but also check Act and Chapter to be sure
            let targetRow = project.plotGrid.rows.find(r => {
                const matchScene = r.title === sceneTitle;
                if (!matchScene) return false;

                if (r.type === 'structure') {
                    const matchAct = actIdx !== -1 ? (r.parentActTitle === rowData[actIdx]) : true;
                    const matchChap = chapIdx !== -1 ? (r.parentChapterTitle === rowData[chapIdx]) : true;
                    return matchAct && matchChap;
                }
                return true;
            });

            if (!targetRow) {
                // If not found, we could potentially create a custom row, but maybe it's better to stay safe
                return;
            }

            // Update Synopsis if structural
            if (targetRow.type === 'structure' && synIdx !== -1 && rowData[synIdx]) {
                PlotGridViewModel.updateSceneSynopsis(targetRow.structureId, rowData[synIdx]);
            }

            // Update/Create Cards for custom columns
            customColMappings.forEach(mapping => {
                const content = rowData[mapping.index];
                if (content === undefined || content === null) return;

                const existingCard = project.plotGrid.cards.find(c => c.rowId === targetRow.id && c.colId === mapping.colId);

                // Logic to split title and content from the Excel cell
                const cellText = String(content).trim();
                if (cellText === "") return;

                const lines = cellText.split('\n');
                let newTitle, newContent;

                if (lines.length > 1) {
                    // Si on a plusieurs lignes : la première est le titre, le reste est le contenu
                    newTitle = lines[0].trim();
                    newContent = lines.slice(1).join('\n').trim();
                } else {
                    // Si on n'a qu'une seule ligne : on la met en contenu, et on met un titre par défaut
                    newTitle = ""; // Sera remplacé par 'Sans titre' via le ViewModel ou le fallback ci-dessous
                    newContent = cellText;
                }

                if (existingCard) {
                    if (existingCard.content !== newContent || (newTitle && existingCard.title !== newTitle)) {
                        PlotGridViewModel.updateCard(existingCard.id, {
                            title: newTitle || existingCard.title || Localization.t('plotgrid.import.default_card_title'),
                            content: newContent
                        });
                        updatedCount++;
                    }
                } else {
                    PlotGridViewModel.addCard(targetRow.id, mapping.colId, newTitle || Localization.t('plotgrid.import.default_card_title'), newContent);
                    createdCards++;
                }
            });
        });

        alert(Localization.t('plotgrid.import.success', [updatedCount, createdCards]));

        // Refresh UI
        if (typeof PlotGridUI !== 'undefined') {
            PlotGridUI.conditionalRender();
        }
    }
};
