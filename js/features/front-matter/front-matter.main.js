/**
 * @file front-matter.main.js
 * @description Point d'entrée pour le module Liminaires et Annexes.
 */

// Initialisation des composants
const frontMatterRepository = new FrontMatterRepository();
const frontMatterViewModel = new FrontMatterViewModel(frontMatterRepository);
const frontMatterView = new FrontMatterView(frontMatterViewModel);

// Exposition globale pour accès depuis l'interface
window.FrontMatterView = frontMatterView;

// Helpers globaux pour les onclick dans le HTML généré
FrontMatterView.openItem = (id) => frontMatterView.openItem(id);
FrontMatterView.deleteItem = (id) => frontMatterView.deleteItem(id);
FrontMatterView.updateTitle = (id, val) => frontMatterView.updateTitle(id, val);
FrontMatterView.openAddModal = () => frontMatterView.openAddModal();
FrontMatterView.addItem = (type) => frontMatterView.addItem(type);
FrontMatterView.openOrganizeModal = () => frontMatterView.openOrganizeModal();
FrontMatterView.moveItem = (id, direction) => frontMatterView.moveItem(id, direction);

// Debounce pour la sauvegarde du contenu
let debounceTimer;
FrontMatterView.debounceUpdateContent = (id) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        frontMatterView.updateContent(id);
    }, 1000); // Sauvegarde après 1 seconde d'inactivité
};

console.log('FrontMatter module initialized');
