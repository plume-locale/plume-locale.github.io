/**
 * @file docx-export.config.js
 * @description Configuration centralisée pour l'export DOCX professionnel.
 * Profil par défaut : manuscrit éditorial français.
 */

const DocxExportConfig = {

    // =====================================================================
    //  PROFIL PAR DÉFAUT — MANUSCRIT ÉDITORIAL FRANÇAIS
    // =====================================================================
    defaults: {

        // --- Mise en page ---
        page: {
            format: 'a4',               // a4, letter, a5
            orientation: 'portrait',     // portrait, landscape
            margins: {
                top: 1700,    // ~3 cm  (en twips, 1 cm ≈ 567 twips)
                bottom: 1700,
                left: 1700,
                right: 1700,
                header: 720,  // ~1.27 cm
                footer: 720
            }
        },

        // --- Polices & taille ---
        font: {
            body: 'Times New Roman',
            heading: 'Times New Roman',
            bodySize: 24,          // en demi-points => 12pt
            headingActSize: 32,    // 16pt
            headingChapterSize: 28,// 14pt
            headingSceneSize: 24   // 12pt
        },

        // --- Interlignes & paragraphes ---
        spacing: {
            lineSpacing: 360,        // 1.5 lignes (en 1/240 de ligne × 240 = unité interne)
            afterParagraph: 0,       // pas d'espace après paragraphe (style roman)
            beforeParagraph: 0,
            firstLineIndent: 709     // ~1.25 cm (alinéa français classique)
        },

        // --- En-tête ---
        header: {
            enabled: true,
            content: 'title',        // 'title' | 'author' | 'custom' | 'title_author'
            customText: '',
            alignment: 'center',     // left, center, right
            font: 'Times New Roman',
            size: 18,                // 9pt
            italic: true
        },

        // --- Pied de page ---
        footer: {
            enabled: true,
            showPageNumber: true,
            alignment: 'center',
            font: 'Times New Roman',
            size: 18,
            startFrom: 1             // numérotation commence à
        },

        // --- Sauts de page ---
        pageBreaks: {
            beforeAct: true,
            beforeChapter: true,
            beforeScene: false
        },

        // --- Mise en forme des titres ---
        titles: {
            act: {
                uppercase: true,
                bold: true,
                centered: true,
                spaceBefore: 2400,  // 60pt avant
                spaceAfter: 1200    // 30pt après
            },
            chapter: {
                uppercase: false,
                bold: true,
                centered: true,
                spaceBefore: 1800,  // 45pt avant
                spaceAfter: 600     // 15pt après
            },
            scene: {
                uppercase: false,
                bold: false,
                italic: true,
                centered: false,
                spaceBefore: 600,
                spaceAfter: 200
            }
        },

        // --- Pages liminaires ---
        frontMatter: {
            includeTitlePage: true,
            includeProjectFrontMatter: true  // intègre les éléments front_matter du projet
        },

        // --- Séparateurs de scène ---
        sceneDivider: {
            style: 'asterisks',    // asterisks, hash, line, space, none
            centered: true
        }
    },

    // =====================================================================
    //  FORMATS DE PAGE PRÉDÉFINIS
    // =====================================================================
    pageSizes: {
        a4: { width: 11906, height: 16838 },   // 210 × 297 mm
        letter: { width: 12240, height: 15840 },   // 8.5 × 11 in
        a5: { width: 8391, height: 11906 },   // 148 × 210 mm
        b5: { width: 9977, height: 14175 },    // 176 × 250 mm
        poche_11_18: { width: 6237, height: 10206 }, // 110 x 180 mm
        broche_13_20: { width: 7371, height: 11340 }, // 130 x 200 mm
        broche_14_22: { width: 7938, height: 12474 },  // 140 x 220 mm
        us_trade: { width: 8640, height: 12960 }, // 6 x 9 in (152 x 229 mm)
        us_digest: { width: 7920, height: 12240 } // 5.5 x 8.5 in (140 x 216 mm)
    },

    // =====================================================================
    //  PRESETS D'INTERLIGNE
    // =====================================================================
    lineSpacingPresets: {
        'simple': 240,   // 1.0
        '1.15': 276,   // 1.15
        '1.5': 360,   // 1.5
        'double': 480    // 2.0
    },

    // =====================================================================
    //  PRESETS MARGES (en twips)
    // =====================================================================
    marginPresets: {
        'narrow': { top: 720, bottom: 720, left: 720, right: 720 },   // ~1.27 cm
        'normal': { top: 1440, bottom: 1440, left: 1440, right: 1440 },  // ~2.54 cm
        'wide': { top: 1700, bottom: 1700, left: 1700, right: 1700 },  // ~3 cm
        'editorial': { top: 1700, bottom: 1700, left: 2268, right: 1700 }, // gauche ~4cm
        'custom': null // sera rempli par l'utilisateur
    },

    // =====================================================================
    //  POLICES DISPONIBLES
    // =====================================================================
    availableFonts: [
        'Times New Roman',
        'Georgia',
        'Garamond',
        'Palatino Linotype',
        'Book Antiqua',
        'Crimson Pro',
        'Arial',
        'Calibri',
        'Cambria',
        'Courier New'
    ],

    // =====================================================================
    //  TAILLES DE POLICE DISPONIBLES
    // =====================================================================
    availableSizes: [
        { label: '10 pt', value: 20 },
        { label: '11 pt', value: 22 },
        { label: '12 pt', value: 24 },
        { label: '13 pt', value: 26 },
        { label: '14 pt', value: 28 }
    ],

    // =====================================================================
    //  HELPER : Fusionne la config utilisateur avec les défauts
    // =====================================================================
    merge(userConfig) {
        const merged = JSON.parse(JSON.stringify(this.defaults));

        if (!userConfig) return merged;

        // Deep merge
        const deepMerge = (target, source) => {
            for (const key of Object.keys(source)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };

        return deepMerge(merged, userConfig);
    }
};
