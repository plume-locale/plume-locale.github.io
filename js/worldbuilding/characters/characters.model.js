/**
 * [MVVM : Characters Model]
 * Définition de la structure de données et usines pour les personnages.
 */

const CharacterModel = {
    /**
     * Crée un nouvel objet personnage avec les valeurs par défaut.
     */
    create(data = {}) {
        // Génération d'un ID plus robuste pour éviter les collisions (Timestamp + Random)
        const id = data.id || (Date.now() + Math.floor(Math.random() * 1000)).toString();
        const name = data.name || '';

        return {
            id: id,
            // État civil
            firstName: data.firstName || name.split(' ')[0] || '',
            lastName: data.lastName || name.split(' ').slice(1).join(' ') || '',
            nickname: data.nickname || '',
            pronouns: data.pronouns || '',
            sex: data.sex || '',
            race: data.race || 'Humain',
            group: data.group || '',
            age: data.age || '',
            birthDate: data.birthDate || '',
            deathDate: data.deathDate || '',
            birthPlace: data.birthPlace || '',
            deathPlace: data.deathPlace || '',
            residence: data.residence || '',
            occupation: data.occupation || '',
            // Header
            name: name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            role: data.role || '',
            roleImportance: data.roleImportance || 3, // 1-5 stars
            avatarEmoji: data.avatarEmoji || '👤',
            avatarImage: data.avatarImage || '',
            // Physique
            height: data.height || '',
            weight: data.weight || '',
            bodyType: data.bodyType || '',
            hairColor: data.hairColor || '',
            eyeColor: data.eyeColor || '',
            voice: data.voice || '',
            clothing: data.clothing || '',
            accessories: data.accessories || '',
            physicalDescription: data.physicalDescription || data.appearance || '',
            // Caractère
            traits: data.traits || [],
            tastes: data.tastes || '',
            habits: data.habits || '',
            fears: data.fears || '',
            // Personnalité radar (0-20)
            personality: data.personality || {
                intelligence: 10,
                force: 10,
                robustesse: 10,
                empathie: 10,
                perception: 10,
                agilite: 10,
                sociabilite: 10
            },
            // Profil
            education: data.education || '',
            wealth: data.wealth !== undefined ? data.wealth : 50, // 0-100 slider
            secrets: data.secrets || '',
            beliefs: data.beliefs || '',
            importantPlaces: data.importantPlaces || '',
            catchphrases: data.catchphrases || '',
            // Évolution (Timeline)
            goals: data.goals || '',
            evolution: data.evolution || {
                past: Array.isArray(data.past) ? data.past : [{ id: (Date.now() - 3).toString(), sceneId: null, text: data.past || data.background || '', isInitial: true }],
                present: Array.isArray(data.present) ? data.present : [{ id: (Date.now() - 2).toString(), sceneId: null, text: data.present || '', isInitial: true }],
                future: Array.isArray(data.future) ? data.future : [{ id: (Date.now() - 1).toString(), sceneId: null, text: data.future || '', isInitial: true }]
            },
            // Legacy fallback (maintained for compatibility if needed elsewhere, but primarily using evolution object)
            past: data.past || data.background || '',
            present: data.present || '',
            future: data.future || '',
            // Inventaire & Possessions
            inventory: data.inventory || [],
            possessions: data.possessions || [],
            // Autres
            notes: data.notes || '',
            // Legacy / metadata
            updatedAt: data.updatedAt || Date.now(),
            createdAt: data.createdAt || id
        };
    },

    /**
     * Migre un ancien objet personnage vers la nouvelle structure.
     */
    migrate(char) {
        if (!char) return null;

        // Si déjà migré (présence de firstName par exemple), on vérifie juste les champs manquants
        const migrated = this.create(char);

        // Migration de l'évolution
        if (!char.evolution) {
            migrated.evolution = {
                past: [{ id: (Date.now() - 3).toString(), sceneId: null, text: char.past || char.background || '', isInitial: true }],
                present: [{ id: (Date.now() - 2).toString(), sceneId: null, text: char.present || '', isInitial: true }],
                future: [{ id: (Date.now() - 1).toString(), sceneId: null, text: char.future || '', isInitial: true }]
            };
        }

        // Cas particuliers de migration de personnalité
        if (!char.personality || typeof char.personality === 'string') {
            const oldPersonality = char.personality || '';
            migrated.personality = {
                intelligence: 10,
                force: 10,
                robustesse: 10,
                empathie: 10,
                perception: 10,
                agilite: 10,
                sociabilite: 10
            };
            if (oldPersonality) migrated.notes = (migrated.notes || '') + '\n\nPersonnalité (ancien):\n' + oldPersonality;
        }

        return migrated;
    }
};

/**
 * Configuration des sections de traits de caractère
 */
const TRAIT_SECTIONS = {
    'emotional': {
        icon: 'brain-circuit',
        label: 'Aspect Émotionnel',
        categories: {
            'adversity': { icon: 'shield-half', label: 'Réaction face à l\'adversité', traits: ['Résilient', 'Fragile', 'Agressif', 'Évasif', 'Persévérant', 'Courageux'] },
            'information': { icon: 'brain', label: 'Traitement de l\'information', traits: ['Analytique', 'Intuitif', 'Réfléchi', 'Impulsif', 'Distrait'] },
            'emotions': { icon: 'heart', label: 'Gestion des émotions', traits: ['Expressif', 'Réservé', 'Explosif', 'Équilibré', 'Empathique', 'Apathique', 'Passionné', 'Téméraire'] },
            'motivations': { icon: 'target', label: 'Motivations principales', traits: ['Ambition', 'Curiosité', 'Besoin de sécurité', 'Besoin d\'approbation', 'Quête de sens'] },
            'social': { icon: 'user-check', label: 'Interactions sociales', traits: ['Leader', 'Suiveur', 'Confiant', 'Timide', 'Solitaire', 'Mystérieux', 'Médiateur', 'Manipulateur', 'Pédagogue'] },
            'change': { icon: 'repeat-2', label: 'Gestion du changement', traits: ['Adaptatif', 'Résistant', 'Enthousiaste', 'Craintif', 'Indécis'] },
            'self': { icon: 'eye', label: 'Vision de soi', traits: ['Confiant', 'Insécure', 'Narcissique', 'Humble', 'Critique'] },
            'intimacy': { icon: 'heart-handshake', label: 'Rapport à l\'intimité', traits: ['Prude', 'Pudique', 'Romantique', 'Discret', 'Réservé', 'Ouvert', 'Extraverti'] },
            'sexuality': { icon: 'flame', label: 'Rapport à la sexualité', traits: ['Sensuel', 'Chaste', 'Timide', 'Décomplexé', 'Romantique', 'Passionné', 'Libertin', 'Asexuel'] },
            'pain': { icon: 'bandage', label: 'Rapport à la douleur', traits: ['Sadique', 'Masochiste', 'Stoïque', 'Sensible', 'Endurant', 'Douillet', 'Vulnérable'] },
            'time': { icon: 'clock', label: 'Rapport au temps', traits: ['Nostalgique', 'Tourné vers l\'avenir', 'Carpe Diem', 'Cynique', 'Patient', 'Impatient'] }
        }
    },
    'evolution': {
        icon: 'trending-up',
        label: 'Évolution Personnelle',
        categories: {
            'initial': { icon: 'sparkles', label: 'État initial', traits: ['Innocent', 'Naïf', 'Ferme dans ses convictions', 'Curieux', 'Méfiant', 'Mystérieux', 'Téméraire'] },
            'learning': { icon: 'book-open', label: 'Approche face à l\'apprentissage', traits: ['Autodidacte', 'Chercheur de mentors', 'Expérimentateur', 'Sceptique', 'Réfractaire au changement'] },
            'failure': { icon: 'alert-triangle', label: 'Gestion des échecs', traits: ['Persévérant', 'Résilient', 'Facilement découragé', 'Fuyant', 'Auto-compassion', 'Revanchard', 'Défaitiste'] },
            'quest': { icon: 'compass', label: 'Quête personnelle', traits: ['Chercheur d\'identité', 'Chercheur de vérité', 'Chercheur de sensations', 'Chercheur d\'équilibre', 'Chercheur de pouvoir'] },
            'adaptability': { icon: 'shuffle', label: 'Adaptabilité à l\'évolution', traits: ['Flexible', 'Rigide', 'Conservateur', 'Caméléon'] },
            'world': { icon: 'globe', label: 'Interaction avec le monde', traits: ['Explorateur', 'Protecteur', 'Observateur', 'Pionnier', 'Réformateur'] },
            'relationships': { icon: 'user-heart', label: 'Gestion des relations', traits: ['Loyal', 'Solidaire', 'Indépendant', 'Codépendant'] },
            'death': { icon: 'skull', label: 'Rapport à la mort', traits: ['Stoïque', 'Anxieux', 'Fataliste', 'Spirituel', 'Déni'] }
        }
    },
    'daily': {
        icon: 'home',
        label: 'Au Quotidien',
        categories: {
            'order': { icon: 'list-checks', label: 'Organisation et ordre', traits: ['Désordonné', 'Méticuleux', 'Négligent', 'Soigneux'] },
            'appearance': { icon: 'shirt', label: 'Apparence et style', traits: ['Coquet', 'Négligé', 'Élégant', 'Décontracté', 'Mystérieux', 'Inspirant'] },
            'physical': { icon: 'dumbbell', label: 'Habileté physique', traits: ['Adroit', 'Maladroit', 'Agile', 'Fort', 'Fragile', 'Précis', 'Souple'] },
            'timeManagement': { icon: 'timer', label: 'Gestion du temps', traits: ['Ponctuel', 'Retardataire', 'Organisé', 'Procrastinateur'] }
        }
    },
    'others': {
        icon: 'users',
        label: 'Rapport aux Autres',
        categories: {
            'norms': { icon: 'ban', label: 'Réponse aux normes culturelles', traits: ['Conformiste', 'Rebelle', 'Innovateur', 'Traditionaliste', 'Indifférent'] },
            'group': { icon: 'group', label: 'Rapport au groupe', traits: ['Leader', 'Suiveur', 'Autoritaire', 'Solitaire', 'Médiateur', 'Esprit de contradiction'] },
            'maturity': { icon: 'gem', label: 'Maturité émotionnelle', traits: ['Candide', 'Immature', 'Mature', 'Naïf', 'Sage'] },
            'communication': { icon: 'message-square', label: 'Communication', traits: ['Expressif', 'Réservé', 'Enthousiaste', 'Observateur', 'Provocateur', 'Éloquent', 'Persuasif', 'À l\'écoute', 'Franc'] },
            'diversity': { icon: 'dices', label: 'Réaction à la diversité', traits: ['Tolérant', 'Intolérant', 'Curieux', 'Ignorant', 'Ambivalent'] },
            'pressure': { icon: 'gauge', label: 'Gestion de la pression sociale', traits: ['Influençable', 'Résistant', 'Indécis', 'Évitant'] },
            'identity': { icon: 'user-circle', label: 'Quête d\'identité sociale', traits: ['Cherche l\'appartenance', 'Caméléon social', 'Loup solitaire', 'Conformiste', 'Cosmopolite'] },
            'success': { icon: 'trophy', label: 'Vision de la réussite', traits: ['Ambitieux', 'Minimaliste', 'Opportuniste', 'Idéaliste', 'Pessimiste'] },
            'institutions': { icon: 'gavel', label: 'Interactions avec les institutions', traits: ['Respectueux', 'Critique', 'Manipulateur', 'Défenseur', 'Détaché'] }
        }
    },
    'age': {
        icon: 'hourglass',
        label: 'Personnalité selon l\'Âge',
        categories: {
            'childhood': { icon: 'baby', label: 'Enfance et adolescence', traits: ['Curieux', 'Rebelle', 'Suiveur', 'Protecteur', 'Rêveur'] },
            'youngAdult': { icon: 'briefcase', label: 'Jeunes adultes', traits: ['Ambitieux', 'Aventurier', 'Stable', 'Introspectif', 'Social', 'Téméraire'] },
            'midLife': { icon: 'building-2', label: 'Milieu de vie', traits: ['Responsable', 'Pédagogue', 'Entrepreneur', 'Nostalgique', 'Philanthrope', 'Mentor', 'Sage', 'Expérimenté', 'Accompli'] },
            'mature': { icon: 'library', label: 'Âge mûr', traits: ['Sage', 'Conservateur', 'Libéré', 'Prudent', 'Gardien de la tradition'] },
            'generations': { icon: 'tree-pine', label: 'Interactions entre générations', traits: ['Respectueux', 'Aime les défier', 'Guide', 'Élève', 'Indifférent'] }
        }
    },
    'moral': {
        icon: 'scale',
        label: 'La Morale',
        categories: {
            'virtues': { icon: 'check-circle', label: 'Vertus', traits: ['Courageux', 'Juste', 'Sage', 'Tempéré', 'Tolérant', 'Intègre', 'Honnête', 'Loyal', 'Compatissant', 'Bienveillant', 'Sincère', 'Désintéressé', 'Responsable'] },
            'neutral': { icon: 'circle', label: 'Traits neutres', traits: ['Modéré', 'Prudent', 'Réfléchi', 'Objectif', 'Réaliste', 'Modeste', 'Patient'] },
            'ambiguous': { icon: 'infinity', label: 'Ambiguïté morale', traits: ['Astucieux', 'Manipulateur', 'Séducteur', 'Rusé', 'Stratège', 'Entêté'] },
            'minorVices': { icon: 'alert-circle', label: 'Vices mineurs', traits: ['Paresseux', 'Égoïste', 'Impulsif', 'Moqueur', 'Malhonnête', 'Hypocrite', 'Lâche', 'Cupide', 'Envieux'] },
            'majorVices': { icon: 'skull', label: 'Vices majeurs', traits: ['Cruel', 'Tyrannique', 'Malveillant', 'Traître', 'Violent', 'Sadique'] },
            'redemption': { icon: 'rotate-ccw', label: 'Traits rédempteurs', traits: ['Repentant', 'Humble', 'Reconnaissant', 'Miséricordieux', 'Compatissant'] },
            'moralApproach': { icon: 'compass', label: 'Approche de la moralité', traits: ['Amoral', 'Nihiliste', 'Utilitariste', 'Paragon de vertu'] },
            'values': { icon: 'diamond', label: 'Principes et valeurs', traits: ['Conformiste', 'Conventionnel', 'Éthique', 'Honnête', 'Idéaliste', 'Incorruptible', 'Intransigeant', 'Non-conformiste', 'Pragmatique', 'Rebelle', 'Respectueux', 'Révolutionnaire', 'Traditionnel', 'Transgressif'] }
        }
    },
    'past': {
        icon: 'history',
        label: 'En Fonction du Passé',
        categories: {
            'privileged': { icon: 'crown', label: 'Enfance privilégiée', traits: ['Confiant', 'Naïf', 'Entreprenant', 'Éduqué'] },
            'trauma': { icon: 'x-circle', label: 'Traumatismes passés', traits: ['Méfiant', 'Résilient', 'Tourmenté', 'Secret', 'Vigilant', 'MystÉRIEUX'] },
            'hardship': { icon: 'pickaxe', label: 'Enfance dans l\'adversité', traits: ['Combattif', 'Ingénieux', 'Méfiant', 'Endurci', 'Tenace'] },
            'nomad': { icon: 'tent', label: 'Passé nomade', traits: ['S\'adapte facilement', 'Curieux', 'Indépendant', 'Nomade', 'Polyglotte'] },
            'educated': { icon: 'microscope', label: 'Éducation formelle', traits: ['Analytique', 'Érudit', 'Précis', 'Structuré', 'Sceptique'] },
            'artist': { icon: 'palette', label: 'Passé d\'artiste', traits: ['Imaginatif', 'Sensible', 'Non-conformiste', 'Passionné', 'Perfectionniste'] },
            'delinquent': { icon: 'handcuffs', label: 'Ancien délinquant', traits: ['Rusé', 'Secret', 'Rebelle', 'Débrouillard', 'Insoumis'] },
            'noble': { icon: 'castle', label: 'Origines nobles', traits: ['Digne', 'Autoritaire', 'Élitiste', 'Gracieux', 'Maniéré', 'Conservateur'] }
        }
    },
    'elements': {
        icon: 'leaf',
        label: 'Éléments Naturels',
        categories: {
            'earth': { icon: 'mountain', label: 'Terre', traits: ['Ancré', 'Résistant', 'Patient', 'Pratique', 'Loyal'] },
            'water': { icon: 'water', label: 'Eau', traits: ['Sensible', 'Profond', 'Réfléchi', 'Adaptable', 'Empathique'] },
            'fire': { icon: 'flame', label: 'Feu', traits: ['Enthousiaste', 'Colérique', 'Charismatique', 'Audacieux', 'Créatif', 'Impulsif'] },
            'air': { icon: 'wind', label: 'Air', traits: ['Analytique', 'Expressif', 'Léger', 'Intuitif', 'Curieux'] },
            'metal': { icon: 'hammer', label: 'Métal', traits: ['Organisé', 'Tenace', 'Réfléchi', 'Précis', 'Discipliné'] },
            'wood': { icon: 'tree-pine', label: 'Bois', traits: ['Innovateur', 'Visionnaire', 'Ambitieux', 'Flexible', 'Énergique'] },
            'space': { icon: 'satellite', label: 'Espace', traits: ['Indépendant', 'Mystérieux', 'Rêveur', 'Explorateur', 'Contemplatif'] },
            'light': { icon: 'sun', label: 'Lumière', traits: ['Lumineux', 'Optimiste', 'Inspirant', 'Chaleureux', 'Rayonnant', 'Bienveillant', 'Leader'] }
        }
    }
};
