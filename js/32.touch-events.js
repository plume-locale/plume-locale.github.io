// ========================================
// TOUCH EVENTS FOR MOBILE
// ========================================

// [MVVM : Other]
// Group: Util / Helper | Naming: TouchUtils
// Gère le début d'un événement tactile sur un nœud de la mindmap (déplacement ou sélection)
function handleNodeTouchStart(e) {
    // Empêcher le comportement par défaut mais permettre les boutons
    if (e.target.classList.contains('mindmap-node-link-btn') ||
        e.target.classList.contains('mindmap-node-delete')) {
        return; // Laisser les boutons fonctionner
    }

    e.preventDefault();
    e.stopPropagation();

    const mindmap = project.mindmaps.find(mm => mm.id === currentMindmapId);
    if (!mindmap) return;

    const nodeId = parseInt(e.currentTarget.getAttribute('data-node-id'));
    const touch = e.touches[0];

    // Mode déplacement
    mindmapState.isDragging = true;
    mindmapState.draggedNode = nodeId;
    mindmapState.selectedNode = nodeId;

    const node = mindmap.nodes.find(n => n.id === nodeId);
    const canvas = document.getElementById('mindmapCanvas');
    const rect = canvas.getBoundingClientRect();

    mindmapState.dragOffsetX = (touch.clientX - rect.left) / mindmapState.zoom - node.x;
    mindmapState.dragOffsetY = (touch.clientY - rect.top) / mindmapState.zoom - node.y;

    e.currentTarget.classList.add('dragging');
}

// [MVVM : Other]
// Group: Util / Helper | Naming: TouchUtils
// Gère le début du toucher sur le canvas pour l'initiation du panoramique (panning)
function handleCanvasTouchStart(e) {
    if (e.target.id === 'mindmapCanvasWrapper' || e.target.id === 'mindmapCanvas') {
        e.preventDefault();
        const touch = e.touches[0];
        mindmapState.isPanning = true;
        mindmapState.lastMouseX = touch.clientX;
        mindmapState.lastMouseY = touch.clientY;
        document.getElementById('mindmapCanvas').classList.add('panning');
    }
}

// [MVVM : Other]
// Group: Util / Helper | Naming: TouchUtils
// Gère le mouvement du toucher pour déplacer les nœuds ou effectuer un panoramique
function handleTouchMove(e) {
    const mindmap = project.mindmaps.find(mm => mm.id === currentMindmapId);
    if (!mindmap) return;

    const touch = e.touches[0];

    if (mindmapState.isDragging && mindmapState.draggedNode) {
        e.preventDefault();
        const node = mindmap.nodes.find(n => n.id === mindmapState.draggedNode);
        if (node) {
            const canvas = document.getElementById('mindmapCanvas');
            const rect = canvas.getBoundingClientRect();

            node.x = (touch.clientX - rect.left) / mindmapState.zoom - mindmapState.dragOffsetX;
            node.y = (touch.clientY - rect.top) / mindmapState.zoom - mindmapState.dragOffsetY;

            // Mise à jour en temps réel
            const nodeElem = document.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeElem) {
                nodeElem.style.left = node.x + 'px';
                nodeElem.style.top = node.y + 'px';
            }

            // Redessiner les liens
            document.getElementById('mindmapSvg').innerHTML = renderMindmapLinks(mindmap);
        }
    } else if (mindmapState.isPanning) {
        e.preventDefault();
        const deltaX = touch.clientX - mindmapState.lastMouseX;
        const deltaY = touch.clientY - mindmapState.lastMouseY;

        mindmapState.panX += deltaX / mindmapState.zoom;
        mindmapState.panY += deltaY / mindmapState.zoom;

        mindmapState.lastMouseX = touch.clientX;
        mindmapState.lastMouseY = touch.clientY;

        const canvas = document.getElementById('mindmapCanvas');
        canvas.style.transform = `scale(${mindmapState.zoom}) translate(${mindmapState.panX}px, ${mindmapState.panY}px)`;
    }
}

// [MVVM : Other]
// Group: Util / Helper | Naming: TouchUtils
// Finalise le déplacement ou le panoramique lors du relâchement du toucher
function handleTouchEnd(e) {
    if (mindmapState.isDragging) {
        const mindmap = project.mindmaps.find(mm => mm.id === currentMindmapId);
        if (mindmap) {
            saveProject();
        }

        document.querySelectorAll('.mindmap-node').forEach(node => {
            node.classList.remove('dragging');
        });
    }

    if (mindmapState.isPanning) {
        const canvas = document.getElementById('mindmapCanvas');
        if (canvas) {
            canvas.classList.remove('panning');
        }
    }

    mindmapState.isDragging = false;
    mindmapState.draggedNode = null;
    mindmapState.isPanning = false;
}

// [MVVM : Other]
// Group: Util / Helper | Naming: TouchUtils
// Gère le zoom de la mindmap via la molette de la souris ou le geste de pincement
function handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, mindmapState.zoom * delta));

    mindmapState.zoom = newZoom;

    const canvas = document.getElementById('mindmapCanvas');
    canvas.style.transform = `scale(${mindmapState.zoom}) translate(${mindmapState.panX}px, ${mindmapState.panY}px)`;
}


