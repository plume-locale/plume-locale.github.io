
// ============================================
// MAP FUNCTIONS
// ============================================

// [MVVM : View]
// Gère l'affichage de la carte géographique et de ses marqueurs dans l'interface utilisateur.
function renderMapView() {
    const editorView = document.getElementById('editorView');
    if (!editorView) {
        console.error('editorView not found');
        return;
    }

    // S'assurer que mapLocations et mapImage existent
    if (!project.mapLocations) project.mapLocations = [];
    if (!project.mapImage) project.mapImage = null;

    let mapContent = '';
    if (project.mapImage) {
        mapContent = `
                    <div style="position: relative; display: inline-block; max-width: 100%;">
                        <img src="${project.mapImage}" 
                             id="worldMapImage"
                             style="max-width: 100%; height: auto; display: block; cursor: crosshair; border: 2px solid var(--border-color); border-radius: 4px;" 
                             alt="Carte du monde"
                             onclick="handleMapClick(event)">
                        ${project.mapLocations.map((loc, i) => `
                            <div class="map-location" 
                                 style="position: absolute; left: ${loc.x}%; top: ${loc.y}%; 
                                        width: 20px; height: 20px; 
                                        background: var(--accent-red); 
                                        border: 2px solid white;
                                        border-radius: 50%; 
                                        transform: translate(-50%, -50%);
                                        cursor: pointer;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                        z-index: 10;"
                                 title="${loc.name}"
                                 onclick="event.stopPropagation(); editMapLocation(${i})">
                                <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
                                           background: var(--bg-accent); color: white; padding: 0.25rem 0.5rem;
                                           border-radius: 4px; white-space: nowrap; font-size: 0.75rem;
                                           pointer-events: none; opacity: 0; transition: opacity 0.2s;"
                                     class="map-location-label">${loc.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    <style>
                        .map-location:hover .map-location-label {
                            opacity: 1 !important;
                        }
                    </style>
                `;
    } else {
        mapContent = `
                    <div style="padding: 4rem; text-align: center; background: var(--bg-secondary); border-radius: 8px; border: 2px dashed var(--border-color);">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">???</div>
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">Aucune carte chargée</div>
                        <div style="color: var(--text-muted); margin-bottom: 1.5rem;">Cliquez sur "Charger carte" pour ajouter une image</div>
                        <button class="btn btn-primary" onclick="uploadMapImage()">?? Charger une carte</button>
                    </div>
                `;
    }

    editorView.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                    <h2 style="margin-bottom: 2rem; color: var(--accent-gold);">??? Carte Géographique</h2>
                    
                    <div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="uploadMapImage()">??? Charger carte</button>
                        <button class="btn" onclick="addMapLocation()" ${!project.mapImage ? 'disabled' : ''}>?? Ajouter lieu</button>
                        <button class="btn btn-small" onclick="clearMap()" ${!project.mapImage ? 'disabled' : ''}>??? Effacer carte</button>
                        <button class="btn btn-small" onclick="exportMapData()">?? Exporter données</button>
                    </div>
                    
                    <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; text-align: center;">
                        ${mapContent}
                    </div>
                    
                    ${project.mapLocations.length > 0 ? `
                        <div style="margin-top: 2rem; background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">?? Lieux marqués (${project.mapLocations.length})</h3>
                            <div style="display: grid; gap: 0.5rem;">
                                ${project.mapLocations.map((loc, i) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-primary); border-radius: 4px;">
                                        <span style="font-weight: 500;">${loc.name}</span>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <button class="btn btn-small" onclick="editMapLocation(${i})">??</button>
                                            <button class="btn btn-small" onclick="deleteMapLocation(${i})">???</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6;">
                            ?? <strong>Utilisation:</strong><br>
                            1. Chargez une image de carte (dessinée à la main, générée par IA, etc.)<br>
                            2. Cliquez directement sur la carte pour placer un marqueur<br>
                            3. Cliquez sur un marqueur existant pour le modifier ou le supprimer
                        </p>
                    </div>
                </div>
            `;
}

// [MVVM : Other]
// Group: Use Case | Naming: HandleMapClickUseCase
// Gère le clic sur la carte pour créer un nouveau marqueur à l'emplacement cliqué.
function handleMapClick(event) {
    // S'assurer que mapLocations existe
    if (!project.mapLocations) project.mapLocations = [];

    const img = event.target;
    const rect = img.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const name = prompt('Nom du lieu:');
    if (name) {
        project.mapLocations.push({
            name: name,
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            description: ''
        });
        saveProject();
        renderMapView();
        showNotification(`?? Lieu "${name}" ajouté`);
    }
}

// [MVVM : ViewModel]
// Permet à l'utilisateur de charger une image pour la carte via un sélecteur de fichiers.
function uploadMapImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                project.mapImage = event.target.result;
                saveProject();
                renderMapView();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// [MVVM : ViewModel]
// Ajoute un nouveau lieu à la carte avec des coordonnées par défaut ou aléatoires.
function addMapLocation() {
    if (!project.mapImage) {
        alert('Veuillez d\'abord charger une carte');
        return;
    }
    // S'assurer que mapLocations existe
    if (!project.mapLocations) project.mapLocations = [];

    const name = prompt('Nom du lieu:');
    if (name) {
        project.mapLocations.push({
            name: name,
            x: 50 + Math.random() * 40,
            y: 30 + Math.random() * 40,
            description: ''
        });
        saveProject();
        renderMapView();
    }
}

// [MVVM : ViewModel]
// Permet de modifier le nom d'un marqueur existant sur la carte.
function editMapLocation(index) {
    const loc = project.mapLocations[index];
    const newName = prompt('Modifier le nom:', loc.name);
    if (newName) {
        loc.name = newName;
        saveProject();
        renderMapView();
        showNotification(`?? Lieu modifié: ${newName}`);
    }
}

// [MVVM : ViewModel]
// Supprime un marqueur de la carte après confirmation.
function deleteMapLocation(index) {
    const loc = project.mapLocations[index];
    if (confirm(`Supprimer le lieu "${loc.name}" ?`)) {
        project.mapLocations.splice(index, 1);
        saveProject();
        renderMapView();
        showNotification(`??? Lieu supprimé: ${loc.name}`);
    }
}

// [MVVM : ViewModel]
// Réinitialise complètement la carte et supprime tous les marqueurs associés.
function clearMap() {
    if (confirm('Effacer la carte et tous les lieux ?')) {
        project.mapImage = null;
        project.mapLocations = [];
        saveProject();
        renderMapView();
        showNotification('??? Carte effacée');
    }
}

// [MVVM : ViewModel]
// Exporte les données de localisation de la carte au format JSON.
function exportMapData() {
    const data = {
        image: project.mapImage ? 'Image présente' : 'Pas d\'image',
        locations: project.mapLocations
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carte_${project.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    showNotification('?? Données de la carte exportées');
}
