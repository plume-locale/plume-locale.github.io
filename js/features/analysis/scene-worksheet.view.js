/**
 * SceneWorksheetView
 * UI implementation for the Scene Analysis Worksheet.
 */
const SceneWorksheetView = {
    /**
     * Renders the analysis worksheet into the specified container.
     * @param {string} containerId - The ID of the container element.
     * @param {Object} params - Parameters containing sceneId.
     */
    render: function (containerId, params) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const sceneId = params.sceneId;
        const scene = findSceneById(sceneId);
        if (!scene) {
            container.innerHTML = `<div class="empty-state">${Localization.t('sidebar.no_scene')}</div>`;
            return;
        }

        // Ensure analysis structure exists
        if (!scene.analysis) {
            scene.analysis = {
                pov: "",
                perspective: "unspecified",
                impact: { char: "", world: "", plot: "" },
                objective: { goal: "", subplot: "", notes: "" },
                progression: { start: "", obstacle: "", resolution: "", twist: "", end: "", consequence: "" }
            };
        }

        const data = scene.analysis;
        if (!data.perspective) data.perspective = "unspecified";

        // Pre-build character options
        const characterOptions = (typeof project !== 'undefined' && project.characters)
            ? project.characters.map(c => `<option value="${c.id}" ${data.pov == c.id ? 'selected' : ''}>${c.name || c.firstName || Localization.t('common.unnamed', 'Sans nom')}</option>`).join('')
            : '';

        if (data.big3 && !data.impact) {
            data.impact = data.big3;
            delete data.big3;
        }

        container.innerHTML = `
            <div class="scene-worksheet-wrapper" style="padding: 20px; height: 100%; overflow-y: auto;">
                <h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">
                    <i data-lucide="clipboard-list" style="margin-right: 10px; vertical-align: middle;"></i>
                    ${Localization.t('scene_analysis.title')} - ${scene.title}
                </h2>

                <div class="worksheet-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    
                    <!-- POV & PERSPECTIVE -->
                    <div class="worksheet-section" style="grid-column: span 2; background: var(--bg-secondary); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color);">
                         <div style="display: flex; gap: 20px; align-items: center;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.field.pov')}</label>
                                <select onchange="SceneWorksheetHandlers.updateField('${sceneId}', 'pov', this.value)"
                                    style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">${Localization.t('scene_analysis.placeholder')}</option>
                                    ${characterOptions}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.field.perspective')}</label>
                                <select onchange="SceneWorksheetHandlers.updateField('${sceneId}', 'perspective', this.value)"
                                    style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="unspecified" ${data.perspective === 'unspecified' ? 'selected' : ''}>${Localization.t('scene_analysis.perspective.unspecified')}</option>
                                    <option value="first" ${data.perspective === 'first' ? 'selected' : ''}>${Localization.t('scene_analysis.perspective.first')}</option>
                                    <option value="third" ${data.perspective === 'third' ? 'selected' : ''}>${Localization.t('scene_analysis.perspective.third')}</option>
                                </select>
                            </div>
                         </div>
                    </div>

                    <!-- IMPACT & REVELATIONS -->
                    <div class="worksheet-section" style="grid-column: span 2; background: #e8f5e9; padding: 20px; border-radius: 12px; border: 1px solid #c8e6c9; color: #2e7d32;">
                        <h3 style="margin-top: 0; margin-bottom: 15px;">${Localization.t('scene_analysis.section.impact')}</h3>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.question.char')}</label>
                            <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'impact', 'char', this.value)"
                                style="width: 100%; height: 60px; padding: 10px; border-radius: 8px; border: 1px solid #c8e6c9; resize: vertical;">${data.impact.char || ''}</textarea>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.question.world')}</label>
                            <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'impact', 'world', this.value)"
                                style="width: 100%; height: 60px; padding: 10px; border-radius: 8px; border: 1px solid #c8e6c9; resize: vertical;">${data.impact.world || ''}</textarea>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.question.plot')}</label>
                            <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'impact', 'plot', this.value)"
                                style="width: 100%; height: 60px; padding: 10px; border-radius: 8px; border: 1px solid #c8e6c9; resize: vertical;">${data.impact.plot || ''}</textarea>
                        </div>
                    </div>

                    <!-- OBJECTIF -->
                    <div class="worksheet-section" style="grid-column: span 2; background: #fff3e0; padding: 20px; border-radius: 12px; border: 1px solid #ffe0b2; color: #e65100;">
                        <h3 style="margin-top: 0; margin-bottom: 15px;">${Localization.t('scene_analysis.section.objective')}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.label.goal')}</label>
                                <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'objective', 'goal', this.value)"
                                    style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ffe0b2; resize: vertical;">${data.objective.goal || ''}</textarea>
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.label.subplot')}</label>
                                <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'objective', 'subplot', this.value)"
                                    style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ffe0b2; resize: vertical;">${data.objective.subplot || ''}</textarea>
                            </div>
                            <div style="grid-column: span 2;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.label.notes')}</label>
                                <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'objective', 'notes', this.value)"
                                    style="width: 100%; height: 60px; padding: 10px; border-radius: 8px; border: 1px solid #ffe0b2; resize: vertical;">${data.objective.notes || ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- PROGRESSION -->
                    <div class="worksheet-section" style="grid-column: span 2; background: #e3f2fd; padding: 20px; border-radius: 12px; border: 1px solid #bbdefb; color: #0d47a1;">
                        <h3 style="margin-top: 0; margin-bottom: 15px;">${Localization.t('scene_analysis.section.progression')}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            ${this.renderProgressionField(sceneId, 'start', data.progression.start)}
                            ${this.renderProgressionField(sceneId, 'obstacle', data.progression.obstacle)}
                            ${this.renderProgressionField(sceneId, 'resolution', data.progression.resolution)}
                            ${this.renderProgressionField(sceneId, 'twist', data.progression.twist)}
                            ${this.renderProgressionField(sceneId, 'end', data.progression.end)}
                            ${this.renderProgressionField(sceneId, 'consequence', data.progression.consequence)}
                        </div>
                    </div>

                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderProgressionField: function (sceneId, key, value) {
        return `
            <div>
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">${Localization.t('scene_analysis.label.' + key)}</label>
                <textarea oninput="SceneWorksheetHandlers.updateNestedField('${sceneId}', 'progression', '${key}', this.value)"
                    style="width: 100%; height: 70px; padding: 10px; border-radius: 8px; border: 1px solid #bbdefb; resize: vertical;">${value || ''}</textarea>
            </div>
        `;
    }
};
