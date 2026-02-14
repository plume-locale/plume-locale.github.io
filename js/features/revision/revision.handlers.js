/*
 * REVISION MODULE - HANDLERS
 * Global function wrappers for compatibility with existing code and HTML event attributes.
 */

// --- Global Mode Handlers ---
function toggleRevisionMode() {
    RevisionViewModel.toggleRevisionMode();
}

function selectHighlightColor(color) {
    RevisionViewModel.selectHighlightColor(color);
}

function applyHighlight() {
    RevisionViewModel.applyHighlight();
}

function removeHighlight() {
    RevisionViewModel.removeHighlight();
}

// --- Annotation Popup Handlers ---
function openAnnotationPopup() {
    RevisionViewModel.openAnnotationPopup();
}

function closeAnnotationPopup() {
    RevisionViewModel.closeAnnotationPopup();
}

function selectAnnotationType(type) {
    RevisionViewModel.selectAnnotationType(type);
}

function saveAnnotation() {
    RevisionViewModel.saveAnnotation();
}

// --- Panel Handlers ---
function renderAnnotationsPanel() {
    RevisionViewModel.renderAnnotationsPanel();
}

function toggleAnnotationsPanel() {
    RevisionViewModel.toggleAnnotationsPanel();
}

function closeAnnotationsPanel() {
    // Just force hide via View if we want "close" specifically
    if (!document.getElementById('annotationsPanel').classList.contains('hidden')) {
        RevisionViewModel.toggleAnnotationsPanel();
    }
}

function updateAnnotationsButton(isOpen) {
    RevisionViewModel.updateAnnotationsButton(isOpen);
}

// --- Item Handlers ---
function deleteAnnotation(annotationId) {
    RevisionViewModel.deleteAnnotation(annotationId);
}

function scrollToAnnotation(annotationId) {
    RevisionViewModel.scrollToAnnotation(annotationId);
}

function highlightAnnotation(annotationId) {
    RevisionViewModel.highlightAnnotation(annotationId);
}

function toggleAnnotationComplete(annotationId) {
    RevisionViewModel.toggleAnnotationComplete(annotationId);
}

// --- Utility / Legacy Compatibility ---
function getAnnotationTypeLabel(type) {
    return RevisionModel.getAnnotationTypeLabel(type);
}

// --- Version Related Data (Legacy Wrappers) ---
function getActiveVersion(scene) {
    return RevisionRepository.getActiveVersion(scene);
}

function getVersionAnnotations(scene) {
    return RevisionRepository.getVersionAnnotations(scene);
}

function addVersionAnnotation(scene, annotation) {
    RevisionRepository.addAnnotation(scene, annotation);
}

function removeVersionAnnotation(scene, annotationId) {
    RevisionRepository.removeAnnotation(scene, annotationId);
}

function findVersionAnnotation(scene, annotationId) {
    return RevisionRepository.findAnnotation(scene, annotationId);
}

function migrateSceneAnnotationsToVersion(scene) {
    return RevisionRepository.migrate(scene);
}
