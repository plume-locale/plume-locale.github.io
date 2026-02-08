/*
 * REVISION MODULE - VIEW
 * Handles all UI rendering and DOM updates.
 */

const RevisionView = {
    /**
     * Updates the main toolbar based on the revision mode.
     */
    updateToolbar(isRevisionMode, selectedColor, toolbarHTML) {
        let toolbar = document.getElementById('editorToolbar');
        if (!toolbar) {
            toolbar = document.querySelector('.editor-toolbar, .revision-toolbar');
        }
        if (!toolbar) {
            console.error('Toolbar not found!');
            return;
        }

        const editor = document.querySelector('.editor-textarea');
        const panel = document.getElementById('annotationsPanel');

        if (isRevisionMode) {
            toolbar.className = 'editor-toolbar revision-toolbar';
            toolbar.innerHTML = `
                <span class="revision-badge"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('revision.mode_badge')}</span>
                <button class="highlight-btn yellow ${selectedColor === 'yellow' ? 'active' : ''}" 
                        onclick="RevisionViewModel.selectHighlightColor('yellow')">${Localization.t('revision.color.yellow')}</button>
                <button class="highlight-btn green ${selectedColor === 'green' ? 'active' : ''}" 
                        onclick="RevisionViewModel.selectHighlightColor('green')">${Localization.t('revision.color.green')}</button>
                <button class="highlight-btn blue ${selectedColor === 'blue' ? 'active' : ''}" 
                        onclick="RevisionViewModel.selectHighlightColor('blue')">${Localization.t('revision.color.blue')}</button>
                <button class="highlight-btn red ${selectedColor === 'red' ? 'active' : ''}" 
                        onclick="RevisionViewModel.selectHighlightColor('red')">${Localization.t('revision.color.red')}</button>
                <button class="highlight-btn purple ${selectedColor === 'purple' ? 'active' : ''}" 
                        onclick="RevisionViewModel.selectHighlightColor('purple')">${Localization.t('revision.color.purple')}</button>
                <button class="btn" onclick="RevisionViewModel.applyHighlight()"><i data-lucide="highlighter" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('revision.btn.highlight')}</button>
                <button class="btn" onclick="RevisionViewModel.removeHighlight()"><i data-lucide="trash-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('revision.btn.remove')}</button>
                <button class="btn" onclick="RevisionViewModel.openAnnotationPopup()"><i data-lucide="message-square" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('revision.btn.annotate')}</button>
                <div style="flex: 1;"></div>
                <button class="btn btn-primary" onclick="RevisionViewModel.toggleRevisionMode()"><i data-lucide="check" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('revision.btn.quit')}</button>
            `;
            if (editor) editor.contentEditable = 'false';
        } else {
            toolbar.className = 'editor-toolbar';
            toolbar.innerHTML = toolbarHTML; // Expects getEditorToolbarHTML() output
            if (editor) editor.contentEditable = 'true';
            if (panel) panel.classList.add('hidden');

            if (typeof initializeColorPickers === 'function') {
                initializeColorPickers();
            }
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    /**
     * Updates the active state of highlight color buttons.
     */
    updateHighlightButtons(color) {
        document.querySelectorAll('.highlight-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.highlight-btn.${color}`);
        if (activeBtn) activeBtn.classList.add('active');
    },

    /**
     * Wraps current selection in a span with the given class.
     */
    wrapSelectionInSpan(className) {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return false;

        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.className = className;

        try {
            range.surroundContents(span);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Removes the highlight span from the current selection.
     */
    removeHighlightSpan() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return false;

        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;

        if (node.nodeType === 3) {
            node = node.parentElement;
        }

        // Cas des annotations (TODOs, commentaires, etc.)
        const annotationMarker = node.closest('.annotation-marker');
        if (annotationMarker) {
            const annotationId = annotationMarker.getAttribute('data-annotation-id');
            if (annotationId && typeof RevisionViewModel !== 'undefined') {
                RevisionViewModel.deleteAnnotation(parseInt(annotationId));
                return true;
            }
        }

        // Cas des surlignages simples
        if (node.className && node.className.includes('highlight-')) {
            const parent = node.parentNode;
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
            return true;
        }
        return false;
    },

    /**
     * Shows the annotation creation popup.
     */
    showAnnotationPopup() {
        const popup = document.getElementById('annotationPopup');
        const input = document.getElementById('annotationText');
        const guide = document.getElementById('annotationGuide');

        if (popup) popup.classList.add('visible');
        if (guide) guide.classList.add('hidden'); // Ensure guide is closed initially

        if (input) {
            input.value = '';
            input.focus();

            // Re-init mentions listener
            input.oninput = (e) => {
                const value = e.target.value;
                const cursorPos = e.target.selectionStart;
                const textBefore = value.substring(0, cursorPos);
                const atIndex = textBefore.lastIndexOf('@');

                if (atIndex !== -1 && (atIndex === 0 || textBefore[atIndex - 1] === ' ')) {
                    const query = textBefore.substring(atIndex + 1);
                    this.showMentionsList(query, input);
                } else {
                    this.hideMentionsList();
                }
            };
        }
    },

    /**
     * Toggles the inline help guide for annotation types.
     */
    toggleAnnotationGuide() {
        const guide = document.getElementById('annotationGuide');
        if (guide) {
            guide.classList.toggle('hidden');
        }
    },

    /**
     * Shows a list of entities for @ mentions.
     */
    showMentionsList(query, input) {
        let list = document.getElementById('annotationMentions');
        if (!list) {
            list = document.createElement('div');
            list.id = 'annotationMentions';
            list.className = 'mentions-list';
            list.style.cssText = `
                position: absolute;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                max-height: 200px;
                overflow-y: auto;
                width: 220px;
                z-index: 10000;
                display: none;
            `;
            document.body.appendChild(list);

            // Add styles for hover and items once
            if (!document.getElementById('mentionsStyles')) {
                const style = document.createElement('style');
                style.id = 'mentionsStyles';
                style.innerHTML = `
                    .mention-item {
                        padding: 8px 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 0.85rem;
                        color: var(--text-primary);
                        transition: background 0.2s;
                    }
                    .mention-item:hover {
                        background: var(--bg-tertiary);
                    }
                    .mention-item i {
                        color: var(--accent-primary, #4a90e2);
                        opacity: 0.8;
                    }
                `;
                document.head.appendChild(style);
            }
        }

        const entities = RevisionViewModel.getEntities();
        const filtered = entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));

        if (filtered.length > 0) {
            const rect = input.getBoundingClientRect();
            list.style.left = `${rect.left}px`;
            list.style.top = `${rect.top - Math.min(filtered.length * 40, 200) - 10}px`;
            list.style.display = 'block';

            list.innerHTML = filtered.map(e => `
                <div class="mention-item" onclick="RevisionView.insertMention('${e.name.replace(/'/g, "\\'")}', '${query.replace(/'/g, "\\'")}')">
                    <i data-lucide="${e.type}" style="width:14px;height:14px;"></i>
                    <span>${e.name}</span>
                </div>
            `).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            this.hideMentionsList();
        }
    },

    /**
     * Inserts a selected mention into the textarea.
     */
    insertMention(name, query) {
        const input = document.getElementById('annotationText');
        if (!input) return;

        const value = input.value;
        const cursorPos = input.selectionStart;
        const textBefore = value.substring(0, cursorPos);
        const textAfter = value.substring(cursorPos);
        const atIndex = textBefore.lastIndexOf('@');

        const newValue = textBefore.substring(0, atIndex) + name + ' ' + textAfter;
        input.value = newValue;
        input.focus();

        // Position cursor after inserted name
        const newPos = atIndex + name.length + 1;
        input.setSelectionRange(newPos, newPos);

        this.hideMentionsList();
    },

    /**
     * Hides the mentions list.
     */
    hideMentionsList() {
        const list = document.getElementById('annotationMentions');
        if (list) list.style.display = 'none';
    },

    /**
     * Hides the annotation creation popup.
     */
    hideAnnotationPopup() {
        const popup = document.getElementById('annotationPopup');
        if (popup) popup.classList.remove('visible');
        this.hideMentionsList();
    },

    /**
     * Updates the active state of annotation type buttons.
     */
    updateAnnotationTypeButtons(type) {
        document.querySelectorAll('.annotation-type-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.annotation-type-btn.${type}`);
        if (activeBtn) activeBtn.classList.add('active');
    },

    /**
     * Inserts an annotation marker span in the editor.
     */
    insertAnnotationMarker(annotation, range) {
        try {
            const span = document.createElement('span');
            span.id = `annotation-${annotation.id}`;
            span.className = `annotation-marker ${annotation.type}`;
            span.setAttribute('data-annotation-id', annotation.id);
            span.style.cursor = 'pointer';
            span.title = `${RevisionModel.getAnnotationTypeLabel(annotation.type)}: ${annotation.text}`;

            const styles = {
                comment: 'background: rgba(255, 235, 59, 0.3); border-bottom: 2px solid #FBC02D;',
                question: 'background: rgba(33, 150, 243, 0.3); border-bottom: 2px solid #1976D2;',
                todo: 'background: rgba(244, 67, 54, 0.3); border-bottom: 2px solid #D32F2F;'
            };
            span.style.cssText = styles[annotation.type] || '';

            range.surroundContents(span);

            span.onclick = function (e) {
                e.stopPropagation();
                RevisionViewModel.highlightAnnotation(annotation.id);
            };
        } catch (e) {
            console.warn('Could not wrap text for annotation:', e);
        }
    },

    /**
     * Removes an annotation marker span from the editor, keeping its text.
     */
    removeAnnotationMarker(annotationId) {
        const marker = document.getElementById(`annotation-${annotationId}`);
        if (marker) {
            const textContent = marker.textContent;
            const textNode = document.createTextNode(textContent);
            marker.parentNode.replaceChild(textNode, marker);
        }
    },

    /**
     * Renders the annotations panel content.
     */
    renderAnnotationsPanel(scene, annotations, activeVersion) {
        const panel = document.getElementById('annotationsPanelContent');
        const parentPanel = document.getElementById('annotationsPanel');

        if (!panel || !parentPanel) return;

        const versionLabel = activeVersion ? (activeVersion.label || `${Localization.t('revision.panel.version')} ${activeVersion.number}`) : '';
        const filteredAnnotations = annotations.filter(a => a.type !== 'todo');

        let html = `
            <div class="annotations-panel-header">
                <h3 style="margin: 0;">${Localization.t('revision.panel.title_count', [filteredAnnotations.length])}</h3>
                <span class="annotations-panel-close" onclick="RevisionViewModel.toggleAnnotationsPanel()" title="${Localization.t('revision.panel.close')}"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
            </div>
            ${versionLabel ? `<div style="font-size: 0.75rem; color: var(--text-muted); padding: 0.5rem 1rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);"><i data-lucide="pin" style="width:12px;height:12px;vertical-align:middle;margin-right:6px;"></i> ${versionLabel}</div>` : ''}
        `;

        if (filteredAnnotations.length === 0) {
            html += `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">${Localization.t('revision.panel.empty_version')}</p>`;
        } else {
            html += filteredAnnotations.map(a => `
                <div class="annotation-card ${a.type} ${a.completed ? 'completed' : ''}" onclick="RevisionViewModel.scrollToAnnotation(${a.id})">
                    <div class="annotation-type ${a.type}">${RevisionModel.getAnnotationTypeLabel(a.type)}</div>
                    <div class="annotation-content">${a.text}</div>
                    ${a.context ? `<div class="annotation-context">"${a.context}"</div>` : ''}
                    <div class="annotation-actions" style="margin-top: 0.5rem;">
                        <button class="btn btn-small" onclick="event.stopPropagation(); RevisionViewModel.deleteAnnotation(${a.id})">
                            <i data-lucide="trash-2" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('revision.btn.delete')}
                        </button>
                    </div>
                </div>
            `).join('');
        }

        panel.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders the annotations panel in empty state.
     */
    renderAnnotationsEmpty() {
        const panel = document.getElementById('annotationsPanelContent');
        if (!panel) return;

        panel.innerHTML = `
            <div class="annotations-panel-header">
                <h3 style="margin: 0;">${Localization.t('revision.panel.title')}</h3>
                <span class="annotations-panel-close" onclick="RevisionViewModel.toggleAnnotationsPanel()" title="${Localization.t('revision.panel.close')}"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
            </div>
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">${Localization.t('revision.panel.select_scene')}</p>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Toggles the visibility of the annotations panel.
     */
    togglePanel() {
        const panel = document.getElementById('annotationsPanel');
        if (panel) {
            panel.classList.toggle('hidden');
            return panel.classList.contains('hidden');
        }
        return true;
    },

    /**
     * Updates badges on various buttons.
     */
    updateBadges(stats, isOpen) {
        // Sidebar buttons
        const sidebarBtn = document.getElementById('sidebarAnnotationsBtn');
        const sidebarBadge = document.getElementById('annotationsBadge');
        const todosBadge = document.getElementById('todosBadge');

        if (sidebarBtn) sidebarBtn.classList.toggle('active', isOpen);

        if (sidebarBadge) {
            if (stats.annotationCount > 0) {
                sidebarBadge.style.display = 'inline';
                sidebarBadge.textContent = stats.annotationCount > 9 ? '9+' : stats.annotationCount;
            } else {
                sidebarBadge.style.display = 'none';
            }
        }

        if (todosBadge) {
            if (stats.totalTodos > 0) {
                todosBadge.style.display = 'inline';
                todosBadge.textContent = stats.totalTodos > 9 ? '9+' : stats.totalTodos;
            } else {
                todosBadge.style.display = 'none';
            }
        }

        // Toolbar buttons
        const toolAnnotationsBtn = document.getElementById('toolAnnotationsBtn');
        const toolAnnotationsBadge = document.getElementById('toolAnnotationsBadge');
        const toolTodosBtn = document.getElementById('toolTodosBtn');
        const toolTodosBadge = document.getElementById('toolTodosBadge');

        if (toolAnnotationsBtn) toolAnnotationsBtn.classList.toggle('active', isOpen);

        if (toolAnnotationsBadge) {
            if (stats.annotationCount > 0) {
                toolAnnotationsBadge.style.display = 'inline';
                toolAnnotationsBadge.textContent = stats.annotationCount > 9 ? '9+' : stats.annotationCount;
            } else {
                toolAnnotationsBadge.style.display = 'none';
            }
        }

        if (toolTodosBadge) {
            if (stats.totalTodos > 0) {
                toolTodosBadge.style.display = 'inline';
                toolTodosBadge.textContent = stats.totalTodos > 9 ? '9+' : stats.totalTodos;
            } else {
                toolTodosBadge.style.display = 'none';
            }
        }
    },

    /**
     * Gets the current HTML content of the editor.
     */
    getEditorHTML() {
        const editor = document.getElementById('sceneEditor') || document.querySelector('.editor-textarea');
        return editor ? editor.innerHTML : null;
    },

    /**
     * Scrolls the editor to a specific annotation marker.
     */
    scrollToAnnotation(annotationId) {
        const marker = document.getElementById(`annotation-${annotationId}`);

        if (marker) {
            const editorWorkspace = document.querySelector('.editor-workspace');

            if (editorWorkspace) {
                const markerRect = marker.getBoundingClientRect();
                const workspaceRect = editorWorkspace.getBoundingClientRect();
                const targetScroll = editorWorkspace.scrollTop + (markerRect.top - workspaceRect.top) - (workspaceRect.height / 2);

                editorWorkspace.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: 'smooth'
                });
            }
            return true;
        }
        return false;
    },

    /**
     * Triggers a pulse animation on an annotation marker.
     */
    animateMarkerPulse(annotationId) {
        const marker = document.getElementById(`annotation-${annotationId}`);
        if (!marker) return;

        const originalStyle = marker.style.cssText;
        marker.style.cssText = originalStyle + ' background: rgba(212, 175, 55, 0.8) !important; transition: background 0.3s;';

        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            if (pulseCount >= 6) {
                clearInterval(pulseInterval);
                marker.style.cssText = originalStyle;
                return;
            }

            if (pulseCount % 2 === 0) {
                marker.style.cssText = originalStyle + ' background: rgba(212, 175, 55, 0.8) !important;';
            } else {
                marker.style.cssText = originalStyle;
            }
            pulseCount++;
        }, 400);
    },
    /**
     * Updates the heat-map / density indicators on the progress bars.
     */
    updateDensityIndicators() {
        const indicators = document.querySelectorAll('#actProgressIndicator, #chapterProgressIndicator');
        indicators.forEach(indicator => {
            const segments = indicator.querySelectorAll('.progress-scene-segment');
            segments.forEach(segment => {
                const sceneId = segment.dataset.sceneId;
                if (!sceneId) return;

                const count = RevisionRepository.getAnnotationCount(sceneId);

                // Remove existing badge
                const oldBadge = segment.querySelector('.density-badge');
                if (oldBadge) oldBadge.remove();

                if (count > 0) {
                    const badge = document.createElement('div');
                    badge.className = 'density-badge';
                    badge.textContent = count > 9 ? '+' : count;
                    badge.style.cssText = `
                        position: absolute;
                        right: 100%;
                        margin-right: 6px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: var(--accent-gold, #ffd700);
                        color: #000;
                        font-size: 9px;
                        font-weight: 800;
                        width: 14px;
                        height: 14px;
                        min-width: 14px;
                        min-height: 14px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: -1px 1px 3px rgba(0,0,0,0.3);
                        pointer-events: none;
                        z-index: 20;
                        line-height: 1;
                        border: 0.5px solid rgba(0,0,0,0.2);
                    `;
                    segment.style.position = 'relative';
                    segment.style.overflow = 'visible';
                    segment.appendChild(badge);
                }
            });
        });
    }
};
