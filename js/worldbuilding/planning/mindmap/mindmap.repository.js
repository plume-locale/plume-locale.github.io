/**
 * @class MindmapRepository
 * @description Data access layer for Mindmaps.
 */
class MindmapRepository {
    constructor(model) {
        this.model = model;
    }

    getAll() {
        return this.model.mindmaps;
    }

    getById(id) {
        return this.model.mindmaps.find(mm => String(mm.id) === String(id));
    }

    add(title) {
        const newMindmap = {
            id: Date.now(),
            title: title || 'Nouvelle mindmap',
            nodes: [],
            links: []
        };
        if (!project.mindmaps) project.mindmaps = [];
        project.mindmaps.push(newMindmap);
        this.save();
        return newMindmap;
    }

    update(id, data) {
        const index = this.model.mindmaps.findIndex(mm => String(mm.id) === String(id));
        if (index !== -1) {
            this.model.mindmaps[index] = { ...this.model.mindmaps[index], ...data };
            this.save();
            return true;
        }
        return false;
    }

    delete(id) {
        const index = this.model.mindmaps.findIndex(mm => String(mm.id) === String(id));
        if (index !== -1) {
            this.model.mindmaps.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    addNode(mindmapId, nodeData) {
        const mindmap = this.getById(mindmapId);
        if (!mindmap) return null;

        const newNode = {
            id: Date.now(),
            ...nodeData,
            x: nodeData.x || 100,
            y: nodeData.y || 100,
            color: nodeData.color || 'var(--bg-primary)'
        };

        mindmap.nodes.push(newNode);
        this.save();
        return newNode;
    }

    deleteNode(mindmapId, nodeId) {
        const mindmap = this.getById(mindmapId);
        if (!mindmap) return false;

        const nodeIndex = mindmap.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            mindmap.nodes.splice(nodeIndex, 1);
            // Delete associated links
            mindmap.links = mindmap.links.filter(l => l.from !== nodeId && l.to !== nodeId);
            this.save();
            return true;
        }
        return false;
    }

    addLink(mindmapId, linkData) {
        const mindmap = this.getById(mindmapId);
        if (!mindmap) return null;

        const newLink = {
            id: Date.now(),
            ...linkData,
            label: linkData.label || '',
            color: linkData.color || '#d4af37'
        };

        mindmap.links.push(newLink);
        this.save();
        return newLink;
    }

    updateLink(mindmapId, linkId, data) {
        const mindmap = this.getById(mindmapId);
        if (!mindmap) return false;

        const link = mindmap.links.find(l => l.id == linkId);
        if (link) {
            Object.assign(link, data);
            this.save();
            return true;
        }
        return false;
    }

    deleteLink(mindmapId, linkId) {
        const mindmap = this.getById(mindmapId);
        if (!mindmap) return false;

        const linkIndex = mindmap.links.findIndex(l => l.id === linkId);
        if (linkIndex !== -1) {
            mindmap.links.splice(linkIndex, 1);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Generates a mindmap automatically based on scene co-occurrences.
     */
    generateAutoMindmap() {
        const title = `Réseau : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        const newMindmap = {
            id: Date.now(),
            title: title,
            nodes: [],
            links: []
        };

        const interactions = new Map();

        const chars = (project.characters || []).map(c => ({ id: String(c.id), type: 'character', title: c.name }));
        const elements = (project.world || []).map(e => ({ id: String(e.id), type: 'element', title: e.name, elementType: e.type }));

        if (chars.length === 0 && elements.length === 0) {
            alert("Rien à afficher ! Créez des personnages ou des lieux.");
            return null;
        }

        const getInteraction = (id1, id2) => {
            const pair = [String(id1), String(id2)].sort().join('---');
            if (!interactions.has(pair)) {
                interactions.set(pair, { weight: 0, labels: new Set() });
            }
            return interactions.get(pair);
        };

        // 1. IMPORT EXPLICIT RELATIONS (Project-wide)
        const explicitRelations = [
            ...(project.relations || []),
            ...(project.relationships || []),
            ...(project.links || [])
        ];

        explicitRelations.forEach(rel => {
            const id1 = rel.char1Id || rel.fromId || rel.from || rel.source;
            const id2 = rel.char2Id || rel.toId || rel.to || rel.target;
            if (id1 && id2) {
                const inter = getInteraction(id1, id2);
                inter.weight += 5; // Heavily weight explicit manual relations
                if (rel.type) inter.labels.add(rel.type);
                if (rel.label) inter.labels.add(rel.label);
                if (rel.description) inter.labels.add(rel.description);
            }
        });

        // 2. DETECT SCENE CO-OCCURRENCES (Dynamic)
        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                chapter.scenes.forEach(scene => {
                    const sceneEntities = [
                        ...(scene.linkedCharacters || scene.characters || scene.actors || []),
                        ...(scene.linkedElements || scene.elements || scene.locations || [])
                    ].map(id => String(id.id || id)); // Handle both ID arrays and Object arrays

                    const uniqueEntities = [...new Set(sceneEntities)];
                    for (let i = 0; i < uniqueEntities.length; i++) {
                        for (let j = i + 1; j < uniqueEntities.length; j++) {
                            const inter = getInteraction(uniqueEntities[i], uniqueEntities[j]);
                            inter.weight += 1;
                        }
                    }
                });
            });
        });

        // Spiral / Clustered Layout (Centered on 3000x3000px canvas)
        const centerX = 3000;
        const centerY = 3000;

        // Characters Cluster (Wide spiral)
        chars.forEach((char, i) => {
            const angle = (i / Math.max(1, chars.length)) * 2 * Math.PI;
            const r = 400 + (i % 2 === 0 ? 0 : 150);
            newMindmap.nodes.push({
                ...char,
                linkedId: char.id,
                x: centerX - 600 + r * Math.cos(angle),
                y: centerY + r * Math.sin(angle),
                color: 'var(--bg-primary)'
            });
        });

        // Elements Cluster (Right spiral)
        elements.forEach((elem, i) => {
            const angle = (i / Math.max(1, elements.length)) * 2 * Math.PI;
            const r = 400 + (i % 2 === 0 ? 0 : 150);
            newMindmap.nodes.push({
                ...elem,
                linkedId: elem.id,
                x: centerX + 600 + r * Math.cos(angle),
                y: centerY + r * Math.sin(angle),
                color: 'var(--bg-secondary)'
            });
        });

        // Links with weight-based styling
        interactions.forEach((data, pair) => {
            const [id1, id2] = pair.split('---');
            if (data.weight === 0) return;

            // Only create links if both entities exist in the current project
            const e1 = chars.find(c => c.id == id1) || elements.find(e => e.id == id1);
            const e2 = chars.find(c => c.id == id2) || elements.find(e => e.id == id2);
            if (!e1 || !e2) return;

            const labelArr = Array.from(data.labels);
            const label = labelArr.length > 0 ? labelArr[0] : (data.weight > 1 ? `${data.weight} scènes` : '');

            const typeColors = {
                'amour': '#e91e63', 'amitie': '#4caf50', 'rivalite': '#f44336',
                'famille': '#2196f3', 'mentor': '#ff9800', 'ennemi': '#9c27b0'
            };
            let color = 'rgba(255,255,255,0.2)';
            for (let type of labelArr) {
                const t = String(type).toLowerCase();
                if (typeColors[t]) { color = typeColors[t]; break; }
            }

            if (color === 'rgba(255,255,255,0.2)' && data.weight > 5) color = '#eab308';

            newMindmap.links.push({
                id: Date.now() + Math.random(),
                from: id1,
                to: id2,
                label: label,
                color: color,
                weight: Math.min(10, 2 + data.weight / 2)
            });
        });


        // Store camera state in the mindmap object
        newMindmap.viewState = {
            zoom: 0.4,
            panX: -centerX + (window.innerWidth / 2) / 0.4,
            panY: -centerY + (window.innerHeight / 2) / 0.4
        };

        this.model.mindmaps.push(newMindmap);
        this.save();

        // Also update local state for immediate feedback
        this.model.mindmapState.panX = newMindmap.viewState.panX;
        this.model.mindmapState.panY = newMindmap.viewState.panY;
        this.model.mindmapState.zoom = newMindmap.viewState.zoom;

        return newMindmap;
    }

    save() {
        if (window.saveProject) {
            window.saveProject();
        }
    }
}

// Export instance
window.mindmapRepository = new MindmapRepository(window.mindmapModel);
