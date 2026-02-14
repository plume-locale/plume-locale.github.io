/**
 * @file front-matter.model.js
 * @description Modèle de données pour les éléments liminaires et annexes (Front/Back Matter).
 */

const FrontMatterModel = {
    /**
     * Types standard d'éléments liminaires et annexes.
     */
    TYPES: {
        PREFACE: 'preface',
        FOREWORD: 'foreword',
        INTRODUCTION: 'introduction',
        PROLOGUE: 'prologue',
        EPIGRAPH: 'epigraph',
        DEDICATION: 'dedication',
        COPYRIGHT: 'copyright',
        ACKNOWLEDGEMENTS: 'acknowledgements',
        POSTFACE: 'postface',
        EPILOGUE: 'epilogue',
        APPENDIX: 'appendix',
        GLOSSARY: 'glossary',
        BIBLIOGRAPHY: 'bibliography',
        ABOUT_AUTHOR: 'about_author',
        OTHER: 'other'
    },

    /**
     * Crée un nouvel élément liminaire/annexe.
     * @param {Object} data 
     * @returns {Object}
     */
    create(data = {}) {
        return {
            id: data.id || `fm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: data.type || this.TYPES.OTHER,
            title: data.title || '', // Titre personnalisé ou par défaut selon le type
            content: data.content || '',
            order: data.order || 0,
            isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
            updatedAt: Date.now(),
            createdAt: Date.now()
        };
    },

    /**
     * Récupère la clé de traduction locale pour un type donné.
     * @param {string} type 
     * @returns {string} Key locale
     */
    getTypeLabelKey(type) {
        return `front_matter.type.${type}`;
    },

    /**
     * Obtenir le titre par défaut pour un type.
     * @param {string} type 
     * @returns {string} Traduction du type
     */
    getDefaultTitle(type) {
        return Localization.t(this.getTypeLabelKey(type));
    }
};
