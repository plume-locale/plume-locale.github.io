
/**
 * MapHandlers.js
 * Exposes functions to the global scope for backward compatibility
 * or for use in other parts of the application.
 */

/**
 * Renders the map view.
 * This is the entry point used by the sidebar/navigation/splitview.
 */
function renderMapView() {
    mapView.render();
}

/**
 * Handle map image upload.
 */
function uploadMapImage() {
    mapViewModel.uploadImage().then(success => {
        if (success) mapView.render();
    });
}

/**
 * Handle bulk clearance.
 */
function clearMap() {
    if (mapViewModel.clearMap()) {
        mapView.render();
    }
}

/**
 * Handle data export.
 */
function exportMapData() {
    mapViewModel.exportData();
}

/**
 * Legacy handlers (can be called from other modules or earlier versions)
 * Now they route through the new MapView modal system.
 */
function addMapLocation() {
    mapView.openModal();
}

function editMapLocation(index) {
    mapView.openModal(index);
}

function deleteMapLocation(index) {
    if (mapViewModel.deleteLocation(index)) {
        mapView.render();
    }
}

// Global click handler used by split view or external triggers
function handleMapClick(event) {
    const img = event.target;
    const rect = img.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    mapView.tempCoords = { x, y };
    mapView.openModal();
}
