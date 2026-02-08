// ============================================================
// synonyms.dictionary.js - Dictionnaire local de synonymes français
// ============================================================
// [MVVM : Data] - Base de données locale de synonymes français

/**
 * Dictionnaire de synonymes français
 * Structure : mot -> { synonymes: [], antonymes: [], similaires: [] }
 * [MVVM : Data]
 */
const FrenchSynonymsDictionary = {
    // ===== A =====
    "abandonner": {
        synonymes: ["délaisser", "quitter", "lâcher", "renoncer", "céder", "laisser", "déserter", "négliger"],
        antonymes: ["persévérer", "continuer", "maintenir", "garder"]
    },
    "abîmer": {
        synonymes: ["endommager", "détériorer", "dégrader", "gâter", "détruire", "esquinter", "bousiller"],
        antonymes: ["réparer", "restaurer", "arranger"]
    },
    "absence": {
        synonymes: ["manque", "défaut", "carence", "privation", "vide", "lacune"],
        antonymes: ["présence", "existence"]
    },
    "absolu": {
        synonymes: ["total", "complet", "entier", "parfait", "intégral", "inconditionnel"],
        antonymes: ["relatif", "partiel", "limité"]
    },
    "accepter": {
        synonymes: ["admettre", "agréer", "consentir", "accueillir", "approuver", "acquiescer", "tolérer"],
        antonymes: ["refuser", "rejeter", "décliner"]
    },
    "accompagner": {
        synonymes: ["escorter", "suivre", "conduire", "guider", "assister", "seconder"],
        antonymes: ["abandonner", "délaisser"]
    },
    "accord": {
        synonymes: ["entente", "harmonie", "pacte", "alliance", "convention", "traité", "consensus"],
        antonymes: ["désaccord", "conflit", "discorde"]
    },
    "acheter": {
        synonymes: ["acquérir", "procurer", "obtenir", "payer"],
        antonymes: ["vendre", "céder"]
    },
    "adorer": {
        synonymes: ["aimer", "vénérer", "idolâtrer", "chérir", "raffoler", "affectionner"],
        antonymes: ["détester", "haïr", "abhorrer"]
    },
    "agréable": {
        synonymes: ["plaisant", "charmant", "délicieux", "doux", "aimable", "sympathique", "attrayant"],
        antonymes: ["désagréable", "déplaisant", "pénible"]
    },
    "aide": {
        synonymes: ["assistance", "secours", "soutien", "appui", "renfort", "collaboration"],
        antonymes: ["obstacle", "entrave"]
    },
    "aider": {
        synonymes: ["assister", "secourir", "soutenir", "épauler", "appuyer", "collaborer"],
        antonymes: ["gêner", "entraver", "nuire"]
    },
    "aimer": {
        synonymes: ["adorer", "chérir", "affectionner", "apprécier", "estimer", "préférer"],
        antonymes: ["détester", "haïr", "mépriser"]
    },
    "aller": {
        synonymes: ["partir", "se rendre", "marcher", "avancer", "progresser", "fonctionner"],
        antonymes: ["venir", "rester", "revenir"]
    },
    "amour": {
        synonymes: ["affection", "tendresse", "passion", "attachement", "adoration", "sentiment"],
        antonymes: ["haine", "aversion", "dégoût"]
    },
    "ancien": {
        synonymes: ["vieux", "antique", "archaïque", "passé", "révolu", "désuet"],
        antonymes: ["nouveau", "moderne", "récent"]
    },
    "angoisse": {
        synonymes: ["anxiété", "inquiétude", "peur", "crainte", "effroi", "tourment", "stress"],
        antonymes: ["sérénité", "calme", "tranquillité"]
    },
    "apparaître": {
        synonymes: ["surgir", "émerger", "paraître", "se montrer", "se manifester", "naître"],
        antonymes: ["disparaître", "s'évanouir"]
    },
    "apprendre": {
        synonymes: ["étudier", "s'instruire", "assimiler", "découvrir", "enseigner", "informer"],
        antonymes: ["oublier", "ignorer"]
    },
    "argent": {
        synonymes: ["monnaie", "fortune", "richesse", "fonds", "capital", "finances", "sous"],
        antonymes: ["pauvreté", "misère"]
    },
    "arrêter": {
        synonymes: ["stopper", "cesser", "interrompre", "suspendre", "bloquer", "immobiliser"],
        antonymes: ["continuer", "poursuivre", "démarrer"]
    },
    "arriver": {
        synonymes: ["parvenir", "atteindre", "survenir", "advenir", "se produire", "venir"],
        antonymes: ["partir", "échouer"]
    },
    "attendre": {
        synonymes: ["patienter", "espérer", "guetter", "compter sur", "escompter"],
        antonymes: ["agir", "devancer"]
    },
    "attention": {
        synonymes: ["vigilance", "concentration", "soin", "prudence", "intérêt", "considération"],
        antonymes: ["distraction", "inattention", "négligence"]
    },
    "aujourd'hui": {
        synonymes: ["maintenant", "actuellement", "présentement", "à présent", "de nos jours"],
        antonymes: ["hier", "demain", "autrefois"]
    },
    "aussi": {
        synonymes: ["également", "pareillement", "de même", "en outre", "de plus"],
        antonymes: ["non plus"]
    },
    "avant": {
        synonymes: ["auparavant", "précédemment", "antérieurement", "jadis", "autrefois"],
        antonymes: ["après", "ensuite", "plus tard"]
    },
    "avenir": {
        synonymes: ["futur", "lendemain", "destinée", "perspective", "horizon"],
        antonymes: ["passé", "histoire"]
    },
    "avis": {
        synonymes: ["opinion", "point de vue", "jugement", "sentiment", "pensée", "conseil"],
        antonymes: []
    },

    // ===== B =====
    "beau": {
        synonymes: ["joli", "magnifique", "superbe", "splendide", "ravissant", "charmant", "élégant"],
        antonymes: ["laid", "moche", "vilain", "affreux"]
    },
    "beaucoup": {
        synonymes: ["énormément", "considérablement", "abondamment", "amplement", "fortement"],
        antonymes: ["peu", "guère", "rarement"]
    },
    "besoin": {
        synonymes: ["nécessité", "exigence", "envie", "désir", "manque", "demande"],
        antonymes: ["superflu", "luxe"]
    },
    "bien": {
        synonymes: ["correctement", "convenablement", "parfaitement", "admirablement", "avantage"],
        antonymes: ["mal", "incorrectement"]
    },
    "bizarre": {
        synonymes: ["étrange", "curieux", "singulier", "insolite", "inhabituel", "surprenant"],
        antonymes: ["normal", "ordinaire", "banal"]
    },
    "blanc": {
        synonymes: ["immaculé", "pur", "pâle", "clair", "neigeux", "laiteux"],
        antonymes: ["noir", "sombre", "foncé"]
    },
    "blesser": {
        synonymes: ["meurtrir", "léser", "offenser", "vexer", "froisser", "atteindre"],
        antonymes: ["soigner", "guérir", "réconforter"]
    },
    "bonheur": {
        synonymes: ["joie", "félicité", "béatitude", "contentement", "satisfaction", "plaisir"],
        antonymes: ["malheur", "tristesse", "chagrin"]
    },
    "bon": {
        synonymes: ["excellent", "agréable", "délicieux", "généreux", "bienveillant", "valable"],
        antonymes: ["mauvais", "méchant", "néfaste"]
    },
    "bruit": {
        synonymes: ["son", "vacarme", "tapage", "fracas", "tumulte", "brouhaha", "rumeur"],
        antonymes: ["silence", "calme", "tranquillité"]
    },

    // ===== C =====
    "cacher": {
        synonymes: ["dissimuler", "masquer", "camoufler", "occulter", "voiler", "dérober"],
        antonymes: ["montrer", "révéler", "exposer"]
    },
    "calme": {
        synonymes: ["serein", "paisible", "tranquille", "placide", "posé", "silencieux"],
        antonymes: ["agité", "nerveux", "turbulent"]
    },
    "capable": {
        synonymes: ["apte", "compétent", "qualifié", "habile", "doué", "talentueux"],
        antonymes: ["incapable", "inapte", "incompétent"]
    },
    "certain": {
        synonymes: ["sûr", "assuré", "convaincu", "indubitable", "évident", "incontestable"],
        antonymes: ["incertain", "douteux", "hésitant"]
    },
    "changer": {
        synonymes: ["modifier", "transformer", "altérer", "varier", "évoluer", "remplacer"],
        antonymes: ["conserver", "maintenir", "garder"]
    },
    "chercher": {
        synonymes: ["rechercher", "quêter", "fouiller", "explorer", "tenter", "essayer"],
        antonymes: ["trouver", "abandonner"]
    },
    "choisir": {
        synonymes: ["sélectionner", "élire", "opter", "préférer", "désigner", "adopter"],
        antonymes: ["rejeter", "refuser"]
    },
    "clair": {
        synonymes: ["lumineux", "brillant", "limpide", "évident", "net", "distinct"],
        antonymes: ["sombre", "obscur", "confus"]
    },
    "colère": {
        synonymes: ["fureur", "rage", "courroux", "irritation", "emportement", "indignation"],
        antonymes: ["calme", "sérénité", "patience"]
    },
    "commencer": {
        synonymes: ["débuter", "entamer", "amorcer", "initier", "entreprendre", "inaugurer"],
        antonymes: ["finir", "terminer", "achever"]
    },
    "comprendre": {
        synonymes: ["saisir", "concevoir", "assimiler", "percevoir", "interpréter", "entendre"],
        antonymes: ["ignorer", "méconnaître"]
    },
    "confiance": {
        synonymes: ["foi", "crédit", "assurance", "espoir", "certitude", "sécurité"],
        antonymes: ["méfiance", "défiance", "doute"]
    },
    "connaître": {
        synonymes: ["savoir", "maîtriser", "posséder", "fréquenter", "expérimenter"],
        antonymes: ["ignorer", "méconnaître"]
    },
    "content": {
        synonymes: ["heureux", "satisfait", "ravi", "enchanté", "joyeux", "comblé"],
        antonymes: ["mécontent", "triste", "déçu"]
    },
    "continuer": {
        synonymes: ["poursuivre", "persévérer", "prolonger", "maintenir", "persister"],
        antonymes: ["arrêter", "cesser", "interrompre"]
    },
    "courageux": {
        synonymes: ["brave", "vaillant", "intrépide", "audacieux", "héroïque", "téméraire"],
        antonymes: ["lâche", "peureux", "craintif"]
    },
    "créer": {
        synonymes: ["inventer", "concevoir", "produire", "fabriquer", "engendrer", "fonder"],
        antonymes: ["détruire", "supprimer", "abolir"]
    },
    "croire": {
        synonymes: ["penser", "estimer", "supposer", "imaginer", "présumer", "admettre"],
        antonymes: ["douter", "nier"]
    },

    // ===== D =====
    "danger": {
        synonymes: ["péril", "risque", "menace", "hasard", "écueil", "piège"],
        antonymes: ["sécurité", "sûreté", "protection"]
    },
    "décider": {
        synonymes: ["résoudre", "trancher", "déterminer", "choisir", "arrêter", "statuer"],
        antonymes: ["hésiter", "tergiverser"]
    },
    "découvrir": {
        synonymes: ["trouver", "déceler", "révéler", "dévoiler", "explorer", "constater"],
        antonymes: ["cacher", "dissimuler"]
    },
    "demander": {
        synonymes: ["solliciter", "réclamer", "prier", "exiger", "requérir", "interroger"],
        antonymes: ["offrir", "donner", "répondre"]
    },
    "dernier": {
        synonymes: ["ultime", "final", "terminal", "suprême", "extrême", "récent"],
        antonymes: ["premier", "initial", "ancien"]
    },
    "désir": {
        synonymes: ["envie", "souhait", "aspiration", "ambition", "convoitise", "appétit"],
        antonymes: ["dégoût", "aversion", "répulsion"]
    },
    "détester": {
        synonymes: ["haïr", "abhorrer", "exécrer", "abominer", "mépriser", "honnir"],
        antonymes: ["aimer", "adorer", "chérir"]
    },
    "détruire": {
        synonymes: ["anéantir", "démolir", "ruiner", "dévaster", "ravager", "saccager"],
        antonymes: ["construire", "créer", "bâtir"]
    },
    "devenir": {
        synonymes: ["se transformer", "évoluer", "se changer", "passer", "tourner"],
        antonymes: ["rester", "demeurer"]
    },
    "difficile": {
        synonymes: ["ardu", "compliqué", "malaisé", "pénible", "laborieux", "épineux"],
        antonymes: ["facile", "simple", "aisé"]
    },
    "dire": {
        synonymes: ["parler", "énoncer", "exprimer", "affirmer", "déclarer", "raconter"],
        antonymes: ["taire", "cacher"]
    },
    "donner": {
        synonymes: ["offrir", "céder", "accorder", "fournir", "procurer", "remettre"],
        antonymes: ["prendre", "recevoir", "garder"]
    },
    "doute": {
        synonymes: ["incertitude", "hésitation", "scepticisme", "méfiance", "perplexité"],
        antonymes: ["certitude", "assurance", "conviction"]
    },
    "doux": {
        synonymes: ["tendre", "suave", "moelleux", "délicat", "agréable", "clément"],
        antonymes: ["dur", "rude", "âpre"]
    },
    "droit": {
        synonymes: ["rectiligne", "direct", "juste", "légitime", "honnête", "loyal"],
        antonymes: ["courbe", "tordu", "injuste"]
    },
    "dur": {
        synonymes: ["rigide", "solide", "ferme", "sévère", "difficile", "pénible"],
        antonymes: ["mou", "tendre", "doux"]
    },

    // ===== E =====
    "écrire": {
        synonymes: ["rédiger", "composer", "consigner", "noter", "transcrire", "griffonner"],
        antonymes: ["effacer", "supprimer"]
    },
    "effort": {
        synonymes: ["peine", "travail", "labeur", "tentative", "énergie", "application"],
        antonymes: ["repos", "facilité", "aisance"]
    },
    "émotion": {
        synonymes: ["sentiment", "sensation", "trouble", "émoi", "affect", "ressenti"],
        antonymes: ["indifférence", "froideur"]
    },
    "enfant": {
        synonymes: ["petit", "gamin", "gosse", "môme", "bambin", "rejeton", "descendant"],
        antonymes: ["adulte", "parent"]
    },
    "ennui": {
        synonymes: ["lassitude", "monotonie", "désoeuvrement", "souci", "problème", "tracas"],
        antonymes: ["plaisir", "divertissement", "joie"]
    },
    "énorme": {
        synonymes: ["immense", "gigantesque", "colossal", "monumental", "considérable", "massif"],
        antonymes: ["minuscule", "petit", "infime"]
    },
    "ensemble": {
        synonymes: ["collectivement", "conjointement", "simultanément", "unanimement", "globalité"],
        antonymes: ["séparément", "individuellement"]
    },
    "entendre": {
        synonymes: ["ouïr", "écouter", "percevoir", "comprendre", "saisir"],
        antonymes: ["ignorer"]
    },
    "entrer": {
        synonymes: ["pénétrer", "accéder", "s'introduire", "s'engager", "franchir"],
        antonymes: ["sortir", "quitter"]
    },
    "envie": {
        synonymes: ["désir", "souhait", "convoitise", "jalousie", "besoin", "appétit"],
        antonymes: ["dégoût", "répulsion"]
    },
    "erreur": {
        synonymes: ["faute", "méprise", "bévue", "inexactitude", "maladresse", "gaffe"],
        antonymes: ["exactitude", "justesse", "vérité"]
    },
    "espoir": {
        synonymes: ["espérance", "attente", "confiance", "optimisme", "aspiration", "foi"],
        antonymes: ["désespoir", "pessimisme"]
    },
    "essayer": {
        synonymes: ["tenter", "expérimenter", "éprouver", "s'efforcer", "chercher"],
        antonymes: ["réussir", "abandonner"]
    },
    "étrange": {
        synonymes: ["bizarre", "curieux", "singulier", "insolite", "inhabituel", "surprenant"],
        antonymes: ["normal", "ordinaire", "banal"]
    },
    "être": {
        synonymes: ["exister", "vivre", "se trouver", "demeurer", "rester", "subsister"],
        antonymes: ["disparaître", "mourir"]
    },
    "évident": {
        synonymes: ["clair", "manifeste", "flagrant", "patent", "incontestable", "certain"],
        antonymes: ["douteux", "incertain", "obscur"]
    },

    // ===== F =====
    "facile": {
        synonymes: ["simple", "aisé", "élémentaire", "commode", "accessible", "enfantin"],
        antonymes: ["difficile", "ardu", "compliqué"]
    },
    "faible": {
        synonymes: ["fragile", "frêle", "débile", "chétif", "vulnérable", "impuissant"],
        antonymes: ["fort", "puissant", "robuste"]
    },
    "faire": {
        synonymes: ["réaliser", "effectuer", "accomplir", "exécuter", "fabriquer", "créer"],
        antonymes: ["défaire", "détruire"]
    },
    "famille": {
        synonymes: ["parenté", "lignée", "clan", "foyer", "maisonnée", "tribu"],
        antonymes: []
    },
    "fatigue": {
        synonymes: ["lassitude", "épuisement", "usure", "harassement", "abattement"],
        antonymes: ["énergie", "vigueur", "forme"]
    },
    "faux": {
        synonymes: ["inexact", "erroné", "mensonger", "fictif", "artificiel", "contrefait"],
        antonymes: ["vrai", "authentique", "réel"]
    },
    "femme": {
        synonymes: ["dame", "épouse", "compagne", "fille", "demoiselle"],
        antonymes: ["homme"]
    },
    "fermer": {
        synonymes: ["clore", "verrouiller", "barrer", "boucher", "obstruer", "sceller"],
        antonymes: ["ouvrir", "débloquer"]
    },
    "fête": {
        synonymes: ["célébration", "festivité", "réjouissance", "cérémonie", "gala", "soirée"],
        antonymes: ["deuil", "enterrement"]
    },
    "fier": {
        synonymes: ["orgueilleux", "hautain", "digne", "noble", "altier", "satisfait"],
        antonymes: ["humble", "modeste", "honteux"]
    },
    "fin": {
        synonymes: ["terme", "conclusion", "achèvement", "dénouement", "aboutissement", "issue"],
        antonymes: ["début", "commencement", "origine"]
    },
    "finir": {
        synonymes: ["terminer", "achever", "conclure", "accomplir", "clore", "compléter"],
        antonymes: ["commencer", "débuter", "entamer"]
    },
    "force": {
        synonymes: ["puissance", "vigueur", "énergie", "robustesse", "pouvoir", "intensité"],
        antonymes: ["faiblesse", "fragilité"]
    },
    "fort": {
        synonymes: ["puissant", "robuste", "vigoureux", "solide", "résistant", "costaud"],
        antonymes: ["faible", "fragile", "chétif"]
    },
    "fou": {
        synonymes: ["dément", "insensé", "dingue", "cinglé", "toqué", "dérangé"],
        antonymes: ["sain", "sensé", "raisonnable"]
    },
    "froid": {
        synonymes: ["glacé", "glacial", "gelé", "frais", "frigide", "distant"],
        antonymes: ["chaud", "tiède", "chaleureux"]
    },

    // ===== G =====
    "gagner": {
        synonymes: ["remporter", "obtenir", "vaincre", "triompher", "conquérir", "mériter"],
        antonymes: ["perdre", "échouer"]
    },
    "garder": {
        synonymes: ["conserver", "préserver", "maintenir", "retenir", "surveiller", "protéger"],
        antonymes: ["perdre", "abandonner", "donner"]
    },
    "gentil": {
        synonymes: ["aimable", "sympathique", "agréable", "bienveillant", "affable", "doux"],
        antonymes: ["méchant", "désagréable", "hostile"]
    },
    "grand": {
        synonymes: ["immense", "vaste", "énorme", "gigantesque", "important", "majeur"],
        antonymes: ["petit", "minuscule", "insignifiant"]
    },
    "grave": {
        synonymes: ["sérieux", "important", "critique", "préoccupant", "dramatique", "solennel"],
        antonymes: ["léger", "bénin", "insignifiant"]
    },
    "groupe": {
        synonymes: ["ensemble", "équipe", "collectif", "bande", "troupe", "assemblée"],
        antonymes: ["individu", "solitaire"]
    },
    "guerre": {
        synonymes: ["conflit", "combat", "bataille", "hostilités", "affrontement", "lutte"],
        antonymes: ["paix", "harmonie", "concorde"]
    },

    // ===== H =====
    "habiter": {
        synonymes: ["résider", "demeurer", "loger", "vivre", "occuper", "séjourner"],
        antonymes: ["quitter", "partir"]
    },
    "haine": {
        synonymes: ["aversion", "hostilité", "animosité", "répulsion", "exécration", "détestation"],
        antonymes: ["amour", "affection", "sympathie"]
    },
    "hasard": {
        synonymes: ["chance", "fortune", "coïncidence", "aléa", "destin", "sort"],
        antonymes: ["certitude", "préméditation"]
    },
    "heureux": {
        synonymes: ["content", "joyeux", "ravi", "enchanté", "satisfait", "comblé", "béat"],
        antonymes: ["malheureux", "triste", "mécontent"]
    },
    "histoire": {
        synonymes: ["récit", "conte", "narration", "chronique", "anecdote", "passé"],
        antonymes: ["avenir", "futur"]
    },
    "homme": {
        synonymes: ["individu", "personne", "être", "gars", "type", "mâle"],
        antonymes: ["femme"]
    },
    "honte": {
        synonymes: ["humiliation", "déshonneur", "opprobre", "confusion", "embarras", "gêne"],
        antonymes: ["fierté", "honneur", "gloire"]
    },
    "horrible": {
        synonymes: ["affreux", "épouvantable", "effroyable", "atroce", "terrible", "abominable"],
        antonymes: ["magnifique", "merveilleux", "splendide"]
    },

    // ===== I =====
    "idée": {
        synonymes: ["pensée", "concept", "notion", "opinion", "projet", "intention"],
        antonymes: []
    },
    "imaginer": {
        synonymes: ["concevoir", "inventer", "créer", "rêver", "supposer", "envisager"],
        antonymes: ["constater", "observer"]
    },
    "immense": {
        synonymes: ["énorme", "gigantesque", "vaste", "colossal", "infini", "illimité"],
        antonymes: ["minuscule", "petit", "étroit"]
    },
    "important": {
        synonymes: ["considérable", "majeur", "capital", "essentiel", "crucial", "primordial"],
        antonymes: ["insignifiant", "mineur", "négligeable"]
    },
    "impossible": {
        synonymes: ["irréalisable", "impensable", "inconcevable", "inimaginable", "utopique"],
        antonymes: ["possible", "réalisable", "faisable"]
    },
    "inquiet": {
        synonymes: ["anxieux", "soucieux", "préoccupé", "tourmenté", "nerveux", "angoissé"],
        antonymes: ["serein", "calme", "tranquille"]
    },
    "intelligent": {
        synonymes: ["brillant", "astucieux", "malin", "perspicace", "vif", "ingénieux"],
        antonymes: ["stupide", "bête", "idiot"]
    },
    "intéressant": {
        synonymes: ["captivant", "passionnant", "attrayant", "fascinant", "curieux"],
        antonymes: ["ennuyeux", "inintéressant", "banal"]
    },

    // ===== J =====
    "jamais": {
        synonymes: ["aucunement", "nullement", "en aucun cas"],
        antonymes: ["toujours", "souvent", "parfois"]
    },
    "jeter": {
        synonymes: ["lancer", "projeter", "balancer", "abandonner", "se débarrasser"],
        antonymes: ["garder", "conserver", "ramasser"]
    },
    "jeune": {
        synonymes: ["juvénile", "adolescent", "nouveau", "récent", "frais", "novice"],
        antonymes: ["vieux", "âgé", "ancien"]
    },
    "joie": {
        synonymes: ["bonheur", "allégresse", "gaieté", "contentement", "euphorie", "félicité"],
        antonymes: ["tristesse", "chagrin", "peine"]
    },
    "joli": {
        synonymes: ["beau", "mignon", "charmant", "ravissant", "gracieux", "élégant"],
        antonymes: ["laid", "moche", "vilain"]
    },
    "jouer": {
        synonymes: ["s'amuser", "se divertir", "interpréter", "parier", "miser"],
        antonymes: ["travailler", "s'ennuyer"]
    },
    "jour": {
        synonymes: ["journée", "date", "lumière", "clarté"],
        antonymes: ["nuit", "obscurité"]
    },
    "juste": {
        synonymes: ["équitable", "exact", "précis", "correct", "légitime", "honnête"],
        antonymes: ["injuste", "faux", "inexact"]
    },

    // ===== L =====
    "laisser": {
        synonymes: ["abandonner", "quitter", "permettre", "autoriser", "léguer", "confier"],
        antonymes: ["prendre", "garder", "retenir"]
    },
    "large": {
        synonymes: ["ample", "vaste", "spacieux", "étendu", "grand", "généreux"],
        antonymes: ["étroit", "serré", "exigu"]
    },
    "léger": {
        synonymes: ["aérien", "fin", "délicat", "superficiel", "insignifiant", "agile"],
        antonymes: ["lourd", "pesant", "grave"]
    },
    "lent": {
        synonymes: ["lentement", "posé", "graduel", "progressif", "paresseux", "traînant"],
        antonymes: ["rapide", "vif", "prompt"]
    },
    "liberté": {
        synonymes: ["indépendance", "autonomie", "émancipation", "affranchissement", "latitude"],
        antonymes: ["captivité", "esclavage", "servitude"]
    },
    "lire": {
        synonymes: ["parcourir", "déchiffrer", "consulter", "étudier", "bouquiner"],
        antonymes: ["écrire"]
    },
    "loin": {
        synonymes: ["distant", "éloigné", "reculé", "écarté"],
        antonymes: ["près", "proche", "adjacent"]
    },
    "long": {
        synonymes: ["allongé", "étendu", "prolongé", "interminable", "durable"],
        antonymes: ["court", "bref", "succinct"]
    },
    "lourd": {
        synonymes: ["pesant", "massif", "épais", "accablant", "pénible", "oppressant"],
        antonymes: ["léger", "aérien"]
    },
    "lumière": {
        synonymes: ["clarté", "éclat", "lueur", "rayonnement", "brillance", "jour"],
        antonymes: ["obscurité", "ténèbres", "ombre"]
    },

    // ===== M =====
    "magnifique": {
        synonymes: ["splendide", "superbe", "grandiose", "somptueux", "merveilleux", "sublime"],
        antonymes: ["affreux", "horrible", "laid"]
    },
    "maintenant": {
        synonymes: ["actuellement", "présentement", "à présent", "désormais", "aujourd'hui"],
        antonymes: ["autrefois", "jadis", "plus tard"]
    },
    "maison": {
        synonymes: ["demeure", "domicile", "logis", "habitation", "résidence", "foyer"],
        antonymes: []
    },
    "mal": {
        synonymes: ["douleur", "souffrance", "tort", "dommage", "malheur", "difficulté"],
        antonymes: ["bien", "bonheur", "plaisir"]
    },
    "malheur": {
        synonymes: ["infortune", "adversité", "calamité", "tragédie", "catastrophe", "drame"],
        antonymes: ["bonheur", "chance", "joie"]
    },
    "manger": {
        synonymes: ["se nourrir", "consommer", "dévorer", "avaler", "ingérer", "déguster"],
        antonymes: ["jeûner", "vomir"]
    },
    "marcher": {
        synonymes: ["avancer", "déambuler", "cheminer", "progresser", "fonctionner"],
        antonymes: ["s'arrêter", "courir"]
    },
    "mauvais": {
        synonymes: ["méchant", "néfaste", "nuisible", "nocif", "détestable", "défavorable"],
        antonymes: ["bon", "excellent", "favorable"]
    },
    "méchant": {
        synonymes: ["mauvais", "cruel", "malveillant", "vilain", "malicieux", "hostile"],
        antonymes: ["gentil", "bon", "bienveillant"]
    },
    "meilleur": {
        synonymes: ["supérieur", "excellent", "optimal", "idéal", "préférable"],
        antonymes: ["pire", "inférieur"]
    },
    "même": {
        synonymes: ["identique", "semblable", "pareil", "égal", "analogue"],
        antonymes: ["différent", "autre", "distinct"]
    },
    "mentir": {
        synonymes: ["tromper", "duper", "mystifier", "abuser", "falsifier"],
        antonymes: ["dire la vérité", "avouer"]
    },
    "mettre": {
        synonymes: ["placer", "poser", "disposer", "installer", "ranger", "enfiler"],
        antonymes: ["enlever", "retirer", "ôter"]
    },
    "monde": {
        synonymes: ["univers", "terre", "humanité", "société", "gens", "foule"],
        antonymes: []
    },
    "montrer": {
        synonymes: ["indiquer", "présenter", "exhiber", "exposer", "révéler", "démontrer"],
        antonymes: ["cacher", "dissimuler"]
    },
    "mort": {
        synonymes: ["décès", "trépas", "fin", "disparition", "perte"],
        antonymes: ["vie", "naissance"]
    },
    "mourir": {
        synonymes: ["décéder", "périr", "trépasser", "s'éteindre", "succomber", "expirer"],
        antonymes: ["naître", "vivre", "survivre"]
    },
    "mystère": {
        synonymes: ["énigme", "secret", "mystification", "inconnu", "ombre"],
        antonymes: ["évidence", "clarté", "certitude"]
    },

    // ===== N =====
    "naître": {
        synonymes: ["voir le jour", "apparaître", "émerger", "surgir", "commencer"],
        antonymes: ["mourir", "disparaître"]
    },
    "naturel": {
        synonymes: ["authentique", "spontané", "normal", "inné", "simple", "pur"],
        antonymes: ["artificiel", "forcé", "affecté"]
    },
    "nécessaire": {
        synonymes: ["indispensable", "essentiel", "obligatoire", "requis", "vital", "inévitable"],
        antonymes: ["superflu", "inutile", "facultatif"]
    },
    "neuf": {
        synonymes: ["nouveau", "récent", "frais", "moderne", "inédit", "original"],
        antonymes: ["vieux", "ancien", "usé"]
    },
    "noir": {
        synonymes: ["sombre", "obscur", "ténébreux", "foncé", "sinistre"],
        antonymes: ["blanc", "clair", "lumineux"]
    },
    "nom": {
        synonymes: ["appellation", "dénomination", "désignation", "titre", "surnom"],
        antonymes: []
    },
    "normal": {
        synonymes: ["habituel", "ordinaire", "courant", "régulier", "naturel", "usuel"],
        antonymes: ["anormal", "exceptionnel", "bizarre"]
    },
    "nouveau": {
        synonymes: ["neuf", "récent", "moderne", "inédit", "original", "frais"],
        antonymes: ["ancien", "vieux", "usé"]
    },
    "nuit": {
        synonymes: ["obscurité", "ténèbres", "soir", "crépuscule", "noirceur"],
        antonymes: ["jour", "lumière", "clarté"]
    },

    // ===== O =====
    "obscur": {
        synonymes: ["sombre", "ténébreux", "noir", "confus", "incompréhensible", "mystérieux"],
        antonymes: ["clair", "lumineux", "limpide"]
    },
    "obtenir": {
        synonymes: ["acquérir", "gagner", "recevoir", "décrocher", "remporter", "atteindre"],
        antonymes: ["perdre", "manquer"]
    },
    "offrir": {
        synonymes: ["donner", "présenter", "proposer", "accorder", "fournir"],
        antonymes: ["prendre", "refuser", "recevoir"]
    },
    "opinion": {
        synonymes: ["avis", "point de vue", "sentiment", "jugement", "pensée", "conviction"],
        antonymes: []
    },
    "ordre": {
        synonymes: ["commandement", "instruction", "directive", "organisation", "rangement"],
        antonymes: ["désordre", "chaos"]
    },
    "oublier": {
        synonymes: ["omettre", "négliger", "ignorer", "délaisser", "manquer"],
        antonymes: ["se souvenir", "retenir", "mémoriser"]
    },
    "ouvrir": {
        synonymes: ["déboucher", "déverrouiller", "entrouvrir", "inaugurer", "commencer"],
        antonymes: ["fermer", "clore", "verrouiller"]
    },

    // ===== P =====
    "paix": {
        synonymes: ["calme", "tranquillité", "sérénité", "harmonie", "concorde", "quiétude"],
        antonymes: ["guerre", "conflit", "agitation"]
    },
    "parler": {
        synonymes: ["dire", "s'exprimer", "converser", "discuter", "bavarder", "causer"],
        antonymes: ["se taire", "écouter"]
    },
    "partir": {
        synonymes: ["s'en aller", "quitter", "décamper", "filer", "déguerpir", "s'éclipser"],
        antonymes: ["arriver", "rester", "venir"]
    },
    "passer": {
        synonymes: ["traverser", "franchir", "dépasser", "circuler", "s'écouler"],
        antonymes: ["rester", "demeurer"]
    },
    "pauvre": {
        synonymes: ["misérable", "démuni", "indigent", "nécessiteux", "malheureux"],
        antonymes: ["riche", "fortuné", "aisé"]
    },
    "pays": {
        synonymes: ["nation", "état", "patrie", "territoire", "contrée", "région"],
        antonymes: []
    },
    "peine": {
        synonymes: ["chagrin", "tristesse", "douleur", "souffrance", "difficulté", "effort"],
        antonymes: ["joie", "plaisir", "bonheur"]
    },
    "penser": {
        synonymes: ["réfléchir", "songer", "méditer", "croire", "estimer", "juger"],
        antonymes: []
    },
    "perdre": {
        synonymes: ["égarer", "manquer", "gaspiller", "échouer"],
        antonymes: ["gagner", "trouver", "retrouver"]
    },
    "permettre": {
        synonymes: ["autoriser", "laisser", "tolérer", "accepter", "accorder", "consentir"],
        antonymes: ["interdire", "défendre", "empêcher"]
    },
    "personnage": {
        synonymes: ["personne", "individu", "figure", "héros", "protagoniste", "caractère"],
        antonymes: []
    },
    "petit": {
        synonymes: ["minuscule", "menu", "mince", "modeste", "réduit", "court"],
        antonymes: ["grand", "immense", "énorme"]
    },
    "peur": {
        synonymes: ["crainte", "frayeur", "terreur", "angoisse", "effroi", "épouvante"],
        antonymes: ["courage", "audace", "bravoure"]
    },
    "plaisir": {
        synonymes: ["joie", "bonheur", "satisfaction", "contentement", "délice", "agrément"],
        antonymes: ["déplaisir", "peine", "souffrance"]
    },
    "pleurer": {
        synonymes: ["sangloter", "larmoyer", "gémir", "se lamenter", "chialer"],
        antonymes: ["rire", "sourire"]
    },
    "pouvoir": {
        synonymes: ["être capable", "avoir la possibilité", "autorité", "puissance", "force"],
        antonymes: ["impuissance", "incapacité"]
    },
    "premier": {
        synonymes: ["initial", "principal", "primordial", "originel", "antérieur"],
        antonymes: ["dernier", "final"]
    },
    "prendre": {
        synonymes: ["saisir", "attraper", "emporter", "capturer", "s'emparer"],
        antonymes: ["donner", "lâcher", "rendre"]
    },
    "présent": {
        synonymes: ["actuel", "contemporain", "cadeau", "don", "maintenant"],
        antonymes: ["absent", "passé", "futur"]
    },
    "problème": {
        synonymes: ["difficulté", "souci", "ennui", "complication", "obstacle", "question"],
        antonymes: ["solution", "réponse"]
    },
    "proche": {
        synonymes: ["près", "voisin", "adjacent", "imminent", "intime", "similaire"],
        antonymes: ["loin", "éloigné", "distant"]
    },
    "profond": {
        synonymes: ["abyssal", "intense", "sérieux", "grave", "intime", "ancré"],
        antonymes: ["superficiel", "léger"]
    },
    "projet": {
        synonymes: ["plan", "programme", "intention", "dessein", "entreprise", "objectif"],
        antonymes: []
    },
    "proposer": {
        synonymes: ["suggérer", "offrir", "soumettre", "présenter", "recommander"],
        antonymes: ["refuser", "imposer"]
    },
    "protéger": {
        synonymes: ["défendre", "préserver", "sauvegarder", "abriter", "garantir", "couvrir"],
        antonymes: ["exposer", "menacer", "attaquer"]
    },
    "puissant": {
        synonymes: ["fort", "robuste", "vigoureux", "influent", "imposant", "efficace"],
        antonymes: ["faible", "impuissant"]
    },

    // ===== Q =====
    "question": {
        synonymes: ["interrogation", "demande", "problème", "sujet", "affaire", "point"],
        antonymes: ["réponse", "solution"]
    },
    "quitter": {
        synonymes: ["partir", "abandonner", "laisser", "délaisser", "s'en aller"],
        antonymes: ["rester", "demeurer", "rejoindre"]
    },

    // ===== R =====
    "rapide": {
        synonymes: ["vite", "prompt", "véloce", "express", "fulgurant", "instantané"],
        antonymes: ["lent", "lentement"]
    },
    "raison": {
        synonymes: ["motif", "cause", "logique", "jugement", "bon sens", "argument"],
        antonymes: ["tort", "folie"]
    },
    "recevoir": {
        synonymes: ["obtenir", "accueillir", "percevoir", "accepter", "toucher"],
        antonymes: ["donner", "envoyer", "refuser"]
    },
    "rechercher": {
        synonymes: ["chercher", "quêter", "explorer", "poursuivre", "traquer"],
        antonymes: ["trouver", "abandonner"]
    },
    "refuser": {
        synonymes: ["rejeter", "décliner", "repousser", "nier", "récuser"],
        antonymes: ["accepter", "admettre", "consentir"]
    },
    "regarder": {
        synonymes: ["observer", "voir", "contempler", "examiner", "fixer", "scruter"],
        antonymes: ["ignorer", "détourner"]
    },
    "rendre": {
        synonymes: ["restituer", "retourner", "remettre", "faire", "transformer"],
        antonymes: ["garder", "prendre", "conserver"]
    },
    "répondre": {
        synonymes: ["répliquer", "rétorquer", "réagir", "satisfaire", "correspondre"],
        antonymes: ["demander", "questionner"]
    },
    "repos": {
        synonymes: ["détente", "relaxation", "pause", "sommeil", "tranquillité", "calme"],
        antonymes: ["travail", "activité", "fatigue"]
    },
    "résultat": {
        synonymes: ["conséquence", "effet", "aboutissement", "issue", "fruit", "bilan"],
        antonymes: ["cause", "origine"]
    },
    "rêve": {
        synonymes: ["songe", "illusion", "utopie", "chimère", "fantaisie", "aspiration"],
        antonymes: ["réalité", "cauchemar"]
    },
    "riche": {
        synonymes: ["fortuné", "aisé", "opulent", "nanti", "prospère", "cossu"],
        antonymes: ["pauvre", "démuni", "misérable"]
    },
    "rire": {
        synonymes: ["s'esclaffer", "ricaner", "glousser", "pouffer", "se marrer"],
        antonymes: ["pleurer", "sangloter"]
    },
    "rouge": {
        synonymes: ["vermeil", "écarlate", "pourpre", "cramoisi", "rubis", "carmin"],
        antonymes: []
    },
    "route": {
        synonymes: ["chemin", "voie", "trajet", "parcours", "itinéraire", "rue"],
        antonymes: []
    },

    // ===== S =====
    "sage": {
        synonymes: ["prudent", "raisonnable", "sensé", "avisé", "calme", "obéissant"],
        antonymes: ["fou", "turbulent", "imprudent"]
    },
    "savoir": {
        synonymes: ["connaître", "maîtriser", "apprendre", "comprendre", "connaissance"],
        antonymes: ["ignorer", "méconnaître"]
    },
    "secret": {
        synonymes: ["mystère", "confidence", "énigme", "discret", "caché", "intime"],
        antonymes: ["public", "ouvert", "évident"]
    },
    "sentir": {
        synonymes: ["ressentir", "éprouver", "percevoir", "flairer", "humer"],
        antonymes: []
    },
    "sérieux": {
        synonymes: ["grave", "important", "rigoureux", "consciencieux", "appliqué"],
        antonymes: ["léger", "frivole", "amusant"]
    },
    "seul": {
        synonymes: ["unique", "solitaire", "isolé", "abandonné", "esseulé"],
        antonymes: ["accompagné", "ensemble"]
    },
    "silence": {
        synonymes: ["calme", "tranquillité", "mutisme", "paix", "quiétude"],
        antonymes: ["bruit", "vacarme", "tapage"]
    },
    "simple": {
        synonymes: ["facile", "aisé", "élémentaire", "modeste", "naturel", "humble"],
        antonymes: ["compliqué", "complexe", "difficile"]
    },
    "sombre": {
        synonymes: ["obscur", "ténébreux", "noir", "triste", "mélancolique", "lugubre"],
        antonymes: ["clair", "lumineux", "gai"]
    },
    "sortir": {
        synonymes: ["quitter", "partir", "s'échapper", "émerger", "apparaître"],
        antonymes: ["entrer", "rester"]
    },
    "souffrir": {
        synonymes: ["pâtir", "endurer", "subir", "supporter", "peiner"],
        antonymes: ["jouir", "profiter"]
    },
    "soudain": {
        synonymes: ["brusque", "subit", "inattendu", "brutal", "imprévu", "soudainement"],
        antonymes: ["progressif", "graduel", "lent"]
    },
    "souvenir": {
        synonymes: ["mémoire", "réminiscence", "rappel", "évocation", "nostalgie"],
        antonymes: ["oubli"]
    },
    "suivre": {
        synonymes: ["accompagner", "poursuivre", "succéder", "observer", "obéir"],
        antonymes: ["précéder", "fuir", "devancer"]
    },
    "surprendre": {
        synonymes: ["étonner", "stupéfier", "ébahir", "déconcerter", "prendre au dépourvu"],
        antonymes: ["attendre", "prévoir"]
    },

    // ===== T =====
    "temps": {
        synonymes: ["durée", "époque", "moment", "période", "instant", "ère"],
        antonymes: []
    },
    "terminer": {
        synonymes: ["finir", "achever", "conclure", "clore", "accomplir", "compléter"],
        antonymes: ["commencer", "débuter", "entamer"]
    },
    "terre": {
        synonymes: ["sol", "monde", "planète", "terrain", "territoire", "pays"],
        antonymes: ["ciel", "mer"]
    },
    "terrible": {
        synonymes: ["effroyable", "épouvantable", "affreux", "horrible", "redoutable"],
        antonymes: ["merveilleux", "magnifique"]
    },
    "tomber": {
        synonymes: ["chuter", "s'effondrer", "dégringoler", "s'écrouler", "baisser"],
        antonymes: ["monter", "se lever", "grimper"]
    },
    "toucher": {
        synonymes: ["atteindre", "effleurer", "palper", "tâter", "émouvoir", "affecter"],
        antonymes: ["éviter", "manquer"]
    },
    "toujours": {
        synonymes: ["constamment", "perpétuellement", "éternellement", "sans cesse", "encore"],
        antonymes: ["jamais", "parfois"]
    },
    "tourner": {
        synonymes: ["pivoter", "virer", "orienter", "diriger", "changer"],
        antonymes: ["fixer", "immobiliser"]
    },
    "travail": {
        synonymes: ["labeur", "ouvrage", "tâche", "emploi", "métier", "besogne", "effort"],
        antonymes: ["repos", "loisir", "chômage"]
    },
    "travailler": {
        synonymes: ["oeuvrer", "bosser", "besogner", "exercer", "opérer"],
        antonymes: ["se reposer", "chômer"]
    },
    "triste": {
        synonymes: ["malheureux", "mélancolique", "chagriné", "affligé", "morose", "abattu"],
        antonymes: ["joyeux", "heureux", "gai"]
    },
    "trouver": {
        synonymes: ["découvrir", "dénicher", "rencontrer", "localiser", "estimer", "juger"],
        antonymes: ["perdre", "chercher", "égarer"]
    },

    // ===== U =====
    "unique": {
        synonymes: ["seul", "exclusif", "singulier", "rare", "exceptionnel", "incomparable"],
        antonymes: ["multiple", "commun", "ordinaire"]
    },
    "utile": {
        synonymes: ["pratique", "nécessaire", "bénéfique", "profitable", "avantageux"],
        antonymes: ["inutile", "superflu"]
    },

    // ===== V =====
    "venir": {
        synonymes: ["arriver", "se rendre", "approcher", "survenir", "provenir"],
        antonymes: ["partir", "s'en aller"]
    },
    "vérité": {
        synonymes: ["exactitude", "réalité", "authenticité", "sincérité", "justesse"],
        antonymes: ["mensonge", "fausseté", "erreur"]
    },
    "vie": {
        synonymes: ["existence", "vivant", "vitalité", "animation", "biographie"],
        antonymes: ["mort", "décès", "trépas"]
    },
    "vieux": {
        synonymes: ["âgé", "ancien", "antique", "vétuste", "usé", "désuet"],
        antonymes: ["jeune", "neuf", "nouveau"]
    },
    "ville": {
        synonymes: ["cité", "agglomération", "métropole", "commune", "localité"],
        antonymes: ["campagne", "village"]
    },
    "violence": {
        synonymes: ["brutalité", "agressivité", "force", "fureur", "férocité"],
        antonymes: ["douceur", "calme", "paix"]
    },
    "visage": {
        synonymes: ["figure", "face", "traits", "mine", "physionomie", "faciès"],
        antonymes: []
    },
    "vite": {
        synonymes: ["rapidement", "promptement", "prestement", "vélocement", "aussitôt"],
        antonymes: ["lentement", "doucement"]
    },
    "vivre": {
        synonymes: ["exister", "habiter", "résider", "subsister", "durer"],
        antonymes: ["mourir", "périr"]
    },
    "voir": {
        synonymes: ["apercevoir", "regarder", "observer", "contempler", "distinguer", "percevoir"],
        antonymes: ["ignorer", "manquer"]
    },
    "voix": {
        synonymes: ["son", "parole", "ton", "timbre", "organe"],
        antonymes: ["silence"]
    },
    "vouloir": {
        synonymes: ["désirer", "souhaiter", "aspirer", "ambitionner", "exiger"],
        antonymes: ["refuser", "rejeter"]
    },
    "voyage": {
        synonymes: ["trajet", "périple", "expédition", "excursion", "parcours", "déplacement"],
        antonymes: ["séjour", "immobilité"]
    },
    "vrai": {
        synonymes: ["authentique", "véridique", "réel", "sincère", "exact", "juste"],
        antonymes: ["faux", "mensonger", "fictif"]
    },

    // ===== Y =====
    "yeux": {
        synonymes: ["regard", "vue", "prunelles", "orbites"],
        antonymes: []
    }
};

/**
 * Recherche des synonymes dans le dictionnaire local
 * @param {string} word - Mot à rechercher
 * @returns {Array} Liste de synonymes formatés
 * [MVVM : Data]
 */
function searchLocalSynonyms(word) {
    const cleanWord = word.toLowerCase().trim();
    const entry = FrenchSynonymsDictionary[cleanWord];

    if (!entry) {
        // Recherche partielle (mots qui commencent par...)
        const partialMatches = [];
        for (const [key, value] of Object.entries(FrenchSynonymsDictionary)) {
            if (key.startsWith(cleanWord) && value.synonymes) {
                partialMatches.push(...value.synonymes.slice(0, 3));
            }
        }
        if (partialMatches.length > 0) {
            return [...new Set(partialMatches)].slice(0, 10).map((syn, index) => ({
                word: syn,
                score: 100 - index * 5,
                tags: [],
                category: 'autre'
            }));
        }
        return [];
    }

    return (entry.synonymes || []).map((syn, index) => ({
        word: syn,
        score: 100 - index * 5,
        tags: [],
        category: 'autre'
    }));
}

/**
 * Recherche des antonymes dans le dictionnaire local
 * @param {string} word - Mot à rechercher
 * @returns {Array} Liste d'antonymes formatés
 * [MVVM : Data]
 */
function searchLocalAntonyms(word) {
    const cleanWord = word.toLowerCase().trim();
    const entry = FrenchSynonymsDictionary[cleanWord];

    if (!entry || !entry.antonymes) {
        return [];
    }

    return entry.antonymes.map((ant, index) => ({
        word: ant,
        score: 100 - index * 5,
        tags: [],
        category: 'autre'
    }));
}

/**
 * Recherche des mots similaires (qui contiennent le mot recherché)
 * @param {string} word - Mot à rechercher
 * @returns {Array} Liste de mots similaires
 * [MVVM : Data]
 */
function searchLocalSimilar(word) {
    const cleanWord = word.toLowerCase().trim();
    const similar = [];

    for (const key of Object.keys(FrenchSynonymsDictionary)) {
        if (key.includes(cleanWord) && key !== cleanWord) {
            similar.push({
                word: key,
                score: 80,
                tags: [],
                category: 'autre'
            });
        }
    }

    return similar.slice(0, 10);
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FrenchSynonymsDictionary,
        searchLocalSynonyms,
        searchLocalAntonyms,
        searchLocalSimilar
    };
}
