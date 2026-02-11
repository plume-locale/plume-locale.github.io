/**
 * [Project Templates]
 * Définition des structures narratives pré-remplies.
 * Inclut Plot Grid, Actes/Chapitres et Personnages (Archetypes).
 */

const ProjectTemplates = {
    /**
     * Structure classique en 3 actes.
     */
    acts3: {
        id: 'acts3',
        name: 'Structure en 3 Actes',
        description: 'La base universelle : Exposition, Confrontation, Résolution.',
        plotGrid: {
            columns: ['Résumé de Scène', 'Objectif', 'Obstacle', 'Tension'],
            cards: [
                { actIndex: 0, chapterIndex: 1, columnIndex: 2, title: 'Conflit', content: 'Établir clairement ce que le héros perdra s\'il n\'agit pas.' },
                { actIndex: 1, chapterIndex: 1, columnIndex: 4, title: 'Pic de Tension', content: 'Le milieu de l\'histoire doit marquer un tournant émotionnel fort.' },
                { actIndex: 2, chapterIndex: 0, columnIndex: 3, title: 'Obstacle Final', content: 'L\'antagoniste utilise sa dernière ressource.' }
            ]
        },
        characters: [
            { name: 'Protagoniste', role: 'Leader', description: 'Le personnage principal qui porte l\'action.' },
            { name: 'Antagoniste', role: 'Opposant', description: 'La force qui s\'oppose aux objectifs du héros.' }
        ],
        world: [
            { name: 'Lieu de l\'Action', type: 'Lieu', description: 'Où se déroule la majeure partie de l\'histoire.' }
        ],
        acts: [
            {
                title: 'Acte I : Exposition',
                chapters: [
                    { title: 'L\'Ordre des Choses', description: 'Présentez la vie normale du héros.' },
                    { title: 'L\'Incident Déclencheur', description: 'Un événement bouleverse sa routine.' },
                    { title: 'Le Premier Seuil', description: 'Le héros s\'engage dans l\'aventure.' }
                ]
            },
            {
                title: 'Acte II : Confrontation',
                chapters: [
                    { title: 'Nouveau Monde', description: 'Découverte des enjeux et des alliés.' },
                    { title: 'Le Point de Non-Retour', description: 'Les enjeux montent d\'un cran.' },
                    { title: 'Toutes les Lumières s\'éteignent', description: 'Le héros subit une défaite majeure.' }
                ]
            },
            {
                title: 'Acte III : Résolution',
                chapters: [
                    { title: 'Le Climax', description: 'La confrontation finale contre l\'antagoniste.' },
                    { title: 'Le Retour', description: 'La nouvelle vie du héros après le changement.' }
                ]
            }
        ]
    },

    /**
     * Le Voyage du Héros (Campion/Vogler).
     */
    hero_journey: {
        id: 'hero_journey',
        name: 'Le Voyage du Héros',
        description: 'La structure mythique utilisée dans les plus grandes épopées.',
        plotGrid: {
            columns: ['Résumé', 'Étape Mythique', 'Intervention Mentor', 'Tension'],
            cards: [
                { actIndex: 0, chapterIndex: 0, columnIndex: 2, title: 'Étape 1', content: 'Le héros est dans son élément naturel. Montrez sa vie quotidienne.' },
                { actIndex: 0, chapterIndex: 1, columnIndex: 2, title: 'Étape 2', content: 'Un défi oblige le héros à sortir de sa zone de confort.' },
                { actIndex: 0, chapterIndex: 3, columnIndex: 3, title: 'Aide ext.', content: 'Le mentor fournit un outil ou une leçon cruciale.' },
                { actIndex: 1, chapterIndex: 2, columnIndex: 2, title: 'Point Central', content: 'Le héros affronte sa plus grande peur.' }
            ]
        },
        characters: [
            { name: 'Le Héros', role: 'Protagoniste', description: 'Celui qui part à l\'aventure.' },
            { name: 'Le Mentor', role: 'Guide', description: 'Celui qui donne les outils et conseils.' },
            { name: 'Le Gardien du Seuil', role: 'Obstacle', description: 'Celui qui teste la résolution du héros.' },
            { name: 'L\'Ombre', role: 'Antagoniste', description: 'Le reflet inversé du héros, le grand ennemi.' }
        ],
        world: [
            { name: 'Monde Ordinaire', type: 'Lieu', description: 'Où tout commence.' },
            { name: 'Monde Spécial', type: 'Lieu', description: 'L\'inconnu où se déroule l\'aventure.' }
        ],
        codex: [
            { title: 'Les Règles du Monde Spécial', category: 'Culture', summary: 'Ce qu\'il faut savoir pour survivre.' }
        ],
        acts: [
            {
                title: 'Départ (Acte I)',
                chapters: [
                    { title: '1. Monde Ordinaire', description: 'Le héros dans son environnement habituel.' },
                    { title: '2. Appel à l\'Aventure', description: 'Un problème ou un défi est présenté.' },
                    { title: '3. Refus de l\'Appel', description: 'Le héros hésite ou a peur.' },
                    { title: '4. Rencontre avec le Mentor', description: 'Un guide donne un conseil ou un objet.' },
                    { title: '5. Passage du Premier Seuil', description: 'Le héros s\'engage pleinement dans l\'autre monde.' }
                ]
            },
            {
                title: 'Initiation (Acte II)',
                chapters: [
                    { title: '6. Tests, Alliés et Ennemis', description: 'Apprentissage des règles du nouveau monde.' },
                    { title: '7. Approche de la Caverne', description: 'Préparation au défi central.' },
                    { title: '8. L\'Épreuve Suprême', description: 'Affrontement de la peur la plus grande.' },
                    { title: '9. La Récompense', description: 'Le héros obtient ce qu\'il cherchait.' }
                ]
            },
            {
                title: 'Retour (Acte III)',
                chapters: [
                    { title: '10. Le Chemin du Retour', description: 'Conséquences de l\'épreuve.' },
                    { title: '11. Résurrection', description: 'Dernier test ultime de changement.' },
                    { title: '12. Retour avec l\'Élixir', description: 'Retour au monde ordinaire avec un savoir.' }
                ]
            }
        ]
    },

    /**
     * Save the Cat! (Blake Snyder).
     */
    save_the_cat: {
        id: 'save_the_cat',
        name: 'Save the Cat!',
        description: 'La méthode des 15 "beats" pour un rythme hollywoodien parfait.',
        plotGrid: {
            columns: ['Beat Snyder', 'Action', 'Valeur Emotionnelle', 'Tension'],
            cards: [
                { actIndex: 0, chapterIndex: 0, columnIndex: 1, title: 'Beat 1', content: 'Image d\'ouverture : Le "Avant".' },
                { actIndex: 0, chapterIndex: 3, columnIndex: 1, title: 'Beat 4', content: 'Le catalyseur : L\'appel qui change tout.' },
                { actIndex: 1, chapterIndex: 1, columnIndex: 2, title: 'B-Story', content: 'Introduction du personnage thématique (amitié/amour).' },
                { actIndex: 3, chapterIndex: 1, columnIndex: 3, title: 'Valeur', content: 'Résolution : Le héros a appris sa leçon.' }
            ]
        },
        characters: [
            { name: 'Héros à Défaille', role: 'Protagoniste', description: 'Un héros qui doit apprendre quelque chose sur lui-même.' },
            { name: 'Antagoniste de Force', role: 'Obstacle', description: 'Celui qui pousse le héros dans ses retranchements.' }
        ],
        acts: [
            {
                title: 'Acte I',
                chapters: [
                    { title: 'Image d\'Ouverture', description: 'Instantané du monde avant le changement.' },
                    { title: 'Thème Suggéré', description: 'De quoi parle VRAIMENT l\'histoire ?' },
                    { title: 'Mise en Place', description: 'Le monde "tel quel" et ses failles.' },
                    { title: 'Catalyseur', description: 'L\'incident déclencheur.' },
                    { title: 'Débat', description: 'Le héros hésite avant de plonger.' }
                ]
            },
            {
                title: 'Acte II-A',
                chapters: [
                    { title: 'Basculement dans l\'Acte II', description: 'Le choix proactif du héros.' },
                    { title: 'B-Story', description: 'L\'histoire d\'amour ou d\'amitié parallèle.' },
                    { title: 'Jeux et Divertissements', description: 'La promesse du concept (action, fun).' },
                    { title: 'Point de Milieu', description: 'Les enjeux montent ou fausse victoire.' }
                ]
            },
            {
                title: 'Acte II-B',
                chapters: [
                    { title: 'Les méchants se rapprochent', description: 'La pression augmente.' },
                    { title: 'Tout est Perdu', description: 'Faillite totale, odeur de mort.' },
                    { title: 'Nuit Noire de l\'Âme', description: 'Désespoir avant l\'épiphanie.' }
                ]
            },
            {
                title: 'Acte III',
                chapters: [
                    { title: 'Basculement dans l\'Acte III', description: 'La nouvelle solution est trouvée.' },
                    { title: 'Final', description: 'Le héros applique sa leçon et gagne.' },
                    { title: 'Image Finale', description: 'Reflet inversé de l\'image d\'ouverture.' }
                ]
            }
        ]
    },

    /**
     * Thriller / Enquête.
     */
    thriller: {
        id: 'thriller',
        name: 'Thriller / Enquête',
        description: 'Suspense, fausses pistes et révélations finales.',
        plotGrid: {
            columns: ['Indices', 'Suspects', 'Fausses Pistes', 'Tension']
        },
        characters: [
            { name: 'L\'Enquêteur', role: 'Protagoniste', description: 'Celui qui cherche la vérité.' },
            { name: 'Le Criminel', role: 'Antagoniste', description: 'Agissant dans l\'ombre.' },
            { name: 'Le Témoin Crucial', role: 'Allié/Clé', description: 'Possède une information mais a peur.' }
        ],
        world: [
            { name: 'Scène du Crime', type: 'Lieu', description: 'Où tout a commencé.' },
            { name: 'QG de l\'Enquête', type: 'Lieu', description: 'Où les indices sont analysés.' }
        ],
        codex: [
            { title: 'Modus Operandi', category: 'Politique', summary: 'La manière dont le crime a été commis.' }
        ],
        acts: [
            {
                title: 'Acte I : Le Crime',
                chapters: [
                    { title: 'L\'Événement', description: 'Découverte du crime ou du danger.' },
                    { title: 'Les Premiers Indices', description: 'Ouverture de l\'enquête.' },
                    { title: 'Le Duel Initial', description: 'Premier contact avec la force opposée.' }
                ]
            },
            {
                title: 'Acte II : La Toile',
                chapters: [
                    { title: 'Accumulation de Preuves', description: 'L\'étau se resserre.' },
                    { title: 'La Fausse Piste', description: 'Le héros se trompe de cible.' },
                    { title: 'Péril Personnel', description: 'L\'enquêteur devient la cible.' }
                ]
            },
            {
                title: 'Acte III : La Vérité',
                chapters: [
                    { title: 'La Révélation', description: 'Le dernier morceau du puzzle.' },
                    { title: 'Confrontation Finale', description: 'Face à face avec le coupable.' },
                    { title: 'Épilogue', description: 'Conséquences et justice.' }
                ]
            }
        ]
    },

    /**
     * Romance.
     */
    romance: {
        id: 'romance',
        name: 'Romance',
        description: 'De la rencontre à l\'union sacrée.',
        plotGrid: {
            columns: ['Attirance', 'Obstacle Intérieur', 'Rapprochement', 'Emotion']
        },
        characters: [
            { name: 'Point de vue A', role: 'Protagoniste 1', description: 'Le premier membre du couple.' },
            { name: 'Point de vue B', role: 'Protagoniste 2', description: 'Le second membre du couple.' },
            { name: 'L\'obstacle vivant', role: 'Antagoniste/Ami', description: 'Celui qui empêche (ou aide malencontreusement) l\'union.' }
        ],
        world: [
            { name: 'Lieu de Rencontre', type: 'Lieu', description: 'Un endroit spécial pour le couple.' }
        ],
        acts: [
            {
                title: 'Acte I : La Rencontre',
                chapters: [
                    { title: 'Vie en Solo', description: 'Le manque ou le besoin du protagoniste.' },
                    { title: 'Meet-Cute', description: 'La rencontre mémorable ou conflictuelle.' },
                    { title: 'L\'Attirance Initiale', description: 'Quelque chose les pousse l\'un vers l\'autre.' }
                ]
            },
            {
                title: 'Acte II : La Tension',
                chapters: [
                    { title: 'Se Connaître', description: 'Moments partagés et vulnérabilité.' },
                    { title: 'Le Premier Baiser / Rapprochement', description: 'L\'engagement émotionnel monte d\'un cran.' },
                    { title: 'Le Conflit Externe', description: 'Un obstacle extérieur menace leur union.' },
                    { title: 'La Grande Dispute', description: 'Le moment où tout semble fini.' }
                ]
            },
            {
                title: 'Acte III : L\'Union',
                chapters: [
                    { title: 'Le Grand Geste', description: 'Preuve d\'amour ou sacrifice ultime.' },
                    { title: 'HEA (Happily Ever After)', description: 'Ils finissent ensemble.' }
                ]
            }
        ]
    },

    /**
     * Méthode Snowflake.
     */
    snowflake: {
        id: 'snowflake',
        name: 'Méthode Snowflake',
        description: 'Construisez votre histoire par itérations successives.',
        plotGrid: {
            columns: ['Phrase de Résumé', 'Objectif du Chapitre', 'Conflit Majeur']
        },
        characters: [
            { name: 'Protagoniste Snowflake', role: 'L\'ancre', description: 'Le personnage autour duquel l\'histoire grandit.' }
        ],
        world: [
            { name: 'Contexte Global', type: 'Lieu', description: 'L\'environnement où se déploie l\'itération.' }
        ],
        codex: [
            { title: 'Note d\'Intention', category: 'Autre', summary: 'Pourquoi cette histoire ?' }
        ],
        acts: [
            {
                title: 'Étape 1 : Le Coeur',
                chapters: [
                    { title: 'Concept Central', description: 'Résumez votre histoire en une seule phrase.' },
                    { title: 'Expansion du Paragraphe', description: 'Développez la phrase en un paragraphe d\'exposition.' },
                    { title: 'Les Scènes Piliers', description: 'Listez ici les 3-4 moments les plus importants.' }
                ]
            }
        ]
    },

    /**
     * Science-Fiction / Worldbuilding avancé.
     */
    scifi: {
        id: 'scifi',
        name: 'Science-Fiction (Worldbuilding)',
        description: 'Focalisé sur la technologie, la politique galactique et le sens de l\'émerveillement.',
        plotGrid: {
            columns: ['Technologie/Science', 'Système Politique', 'Lieu Clé', 'Tension']
        },
        characters: [
            { name: 'L\'Explorateur/Scientifique', role: 'Protagoniste', description: 'Celui qui comprend la technologie.' },
            { name: 'Le Bureaucrate/Tyran', role: 'Antagoniste', description: 'Celui qui contrôle les ressources.' },
            { name: 'L\'Etranger/L\'Autre', role: 'Allié', description: 'Celui qui apporte un point de vue différent sur le monde.' }
        ],
        world: [
            { name: 'Secteur Alpha', type: 'Lieu', description: 'Le centre technologique.' },
            { name: 'Planète en Bordure', type: 'Lieu', description: 'Frontière sauvage et inexplorée.' }
        ],
        codex: [
            { title: 'Historique de la Faction Majoritaire', category: 'Politique', summary: 'Comment ils ont pris le pouvoir.' },
            { title: 'Dictionnaire Technologique', category: 'Technologie', summary: 'Lexique des outils SF de votre univers.' }
        ],
        acts: [
            {
                title: 'Acte I : Le Monde de Demain',
                chapters: [
                    { title: 'La Nouvelle Normale', description: 'Montrez la technologie et ses conséquences sociales.' },
                    { title: 'L\'Anomalie', description: 'Un élément vient perturber l\'équilibre technologique ou politique.' },
                    { title: 'L\'Enquête au-delà des Frontières', description: 'Le héros part explorer l\'inconnu.' }
                ]
            },
            {
                title: 'Acte II : La Complexité Galactique',
                chapters: [
                    { title: 'Les Factions en jeu', description: 'Conflit entre différentes organisations ou IA.' },
                    { title: 'Révélation Scientifique', description: 'Compréhension profonde du phénomène.' },
                    { title: 'L\'escalade', description: 'Le conflit devient global ou interplanétaire.' }
                ]
            },
            {
                title: 'Acte III : Le Destin de l\'Espèce',
                chapters: [
                    { title: 'Sacrifice Technologique', description: 'Le héros doit faire un choix difficile.' },
                    { title: 'Singularité / Climax', description: 'Le point de bascule pour l\'humanité.' },
                    { title: 'Héritage', description: 'Les conséquences à long terme du changement.' }
                ]
            }
        ]
    },

    /**
     * Story Circle (Dan Harmon).
     */
    story_circle: {
        id: 'story_circle',
        name: 'Story Circle (Dan Harmon)',
        description: 'Une structure circulaire simple et puissante en 8 étapes.',
        plotGrid: {
            columns: ['Étape du Cercle', 'Changement Interne', 'Action', 'Tension']
        },
        characters: [
            { name: 'Le Protagoniste', role: 'Celui qui change', description: 'Le voyageur du cercle.' }
        ],
        acts: [
            {
                title: 'Le Cercle',
                chapters: [
                    { title: '1. You (Le Héros)', description: 'Le héros est dans sa zone de confort.' },
                    { title: '2. Need (Le Besoin)', description: 'Mais il veut quelque chose.' },
                    { title: '3. Go (Le Départ)', description: 'Il entre dans une situation inhabituelle.' },
                    { title: '4. Search (La Recherche)', description: 'Il s\'adapte à cette situation.' },
                    { title: '5. Find (La Trouvaille)', description: 'Il obtient ce qu\'il voulait.' },
                    { title: '6. Take (Le Prix)', description: 'Mais il en paie le prix fort.' },
                    { title: '7. Return (Le Retour)', description: 'Il revient dans sa situation d\'origine.' },
                    { title: '8. Change (Le Changement)', description: 'Il a changé.' }
                ]
            }
        ]
    },

    /**
     * Courbe de Fichte (Action & Suspense continu).
     */
    fichtean_curve: {
        id: 'fichtean_curve',
        name: 'Courbe de Fichte',
        description: 'Une structure d\'action intense avec des crises successives.',
        plotGrid: {
            columns: ['Crise Actuelle', 'Intensité', 'Conséquence', 'Tension']
        },
        characters: [
            { name: 'Protagoniste Résistant', role: 'Survivant', description: 'Celui qui endure les crises successives.' },
            { name: 'L\'Antagoniste Implacable', role: 'Force de la nature', description: 'Celui qui génère les crises.' }
        ],
        acts: [
            {
                title: 'Phase de Crises',
                chapters: [
                    { title: 'Exposition & Crise 1', description: 'Plongez directement dans l\'action.' },
                    { title: 'Crise 2', description: 'L\'intensité monte.' },
                    { title: 'Crise 3', description: 'Les enjeux deviennent critiques.' },
                    { title: 'Crise 4', description: 'Le moment de tension maximale avant le climax.' },
                    { title: 'Climax', description: 'La confrontation finale.' },
                    { title: 'Action Décroissante', description: 'Résolution rapide des tensions.' }
                ]
            }
        ]
    }
};
