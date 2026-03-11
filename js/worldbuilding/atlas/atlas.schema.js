// [MVVM : Atlas Schema]
// Automatically generated schema based on user prototype


const COMMON_FIELDS = [
  { name: "Nom", id: "nom", type: "text", required: true, note: "Nom canonique de l'élément" },
  { name: "Nom alternatif / Alias", id: "nom_alternatif_alias", type: "tags", note: "Autres noms, surnoms, traductions" },
  { name: "Résumé court", id: "resume_court", type: "textarea-sm", required: true, note: "1-2 phrases, affiché dans les listes" },
  { name: "Statut de développement", id: "statut_de_developpement", type: "select", options: ["Ébauche", "En cours", "Complet", "Archivé"], note: "Maturité de la fiche" },
  { name: "Visibilité", id: "visibilite", type: "select", options: ["Privé (auteur)", "Public (lecteur)"], note: "Pour l'export" },
  { name: "Tags", id: "tags", type: "tags", note: "Mots-clés libres pour la recherche" },
  { name: "Image / Illustration", id: "image_illustration", type: "image", note: "Visuel de référence" },
  { name: "Notes de l'auteur", id: "notes_de_l_auteur", type: "textarea", note: "Réflexions, doutes, TODO — jamais exporté" },
  { name: "Inspirations", id: "inspirations", type: "textarea-sm", note: "Références réelles, œuvres sources" },
];

const SCHEMA = {
  UNIVERS: {
    color: "#52b788",
    accent: "#2d6a4f",
    label: "Univers",
    icon: "🌍",
    categories: {
      "Géographie": {
        icon: "🌍",
        color: "#2d6a4f",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Continent", "Région", "Île", "Chaîne de montagnes", "Désert", "Forêt", "Océan", "Mer", "Fleuve", "Lac", "Volcan", "Plaine", "Autre"] },
              { name: "Superficie", id: "superficie", type: "text", note: "Approximative, avec unité" },
              { name: "Position / Coordonnées", id: "position_coordonnees", type: "text", note: "Sur la carte du monde" },
              { name: "Appartient à", id: "appartient_a", type: "relation", target: "Géographie", note: "Zone parente (ex: région → continent)" },
              { name: "Zones enfants", id: "zones_enfants", type: "relation-multi", target: "Géographie", note: "Sous-zones contenues" },
            ]
          },
          {
            label: "Physique",
            fields: [
              { name: "Relief", id: "relief", type: "textarea-sm", note: "Montagnes, plaines, dénivelés dominants" },
              { name: "Hydrographie", id: "hydrographie", type: "textarea-sm", note: "Fleuves, lacs, côtes, nappes phréatiques" },
              { name: "Climat dominant", id: "climat_dominant", type: "select", options: ["Tropical", "Aride", "Tempéré", "Continental", "Polaire", "Montagnard", "Magique/Atypique"] },
              { name: "Saisons", id: "saisons", type: "textarea-sm", note: "Nombre, durée, particularités" },
              { name: "Phénomènes naturels", id: "phenomenes_naturels", type: "textarea", note: "Tempêtes, marées magiques, tremblements, anomalies" },
              { name: "Ressources naturelles", id: "ressources_naturelles", type: "tags", note: "Minerais, plantes, eau, énergie" },
            ]
          },
          {
            label: "Écologie",
            fields: [
              { name: "Biome(s)", id: "biome_s", type: "tags" },
              { name: "Faune notable", id: "faune_notable", type: "relation-multi", target: "Faune & Flore" },
              { name: "Flore notable", id: "flore_notable", type: "relation-multi", target: "Faune & Flore" },
              { name: "Espèces endémiques", id: "especes_endemiques", type: "textarea-sm" },
              { name: "Dangers environnementaux", id: "dangers_environnementaux", type: "textarea-sm", note: "Prédateurs, plantes toxiques, zones mortelles" },
            ]
          },
          {
            label: "Humain",
            fields: [
              { name: "Peuples présents", id: "peuples_presents", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Lieux notables", id: "lieux_notables", type: "relation-multi", target: "Lieux & Bâtiments" },
              { name: "Accessibilité", id: "accessibilite", type: "textarea-sm", note: "Routes, passes, ports, barrières naturelles" },
              { name: "Enjeux stratégiques", id: "enjeux_strategiques", type: "textarea-sm", note: "Pourquoi ce territoire est convoité" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'histoire", id: "role_dans_l_histoire", type: "textarea-sm" },
            { name: "Scènes qui s'y déroulent", id: "scenes_qui_s_y_deroulent", type: "relation-multi", target: "Scène" },
            { name: "Description sensorielle", id: "description_sensorielle", type: "textarea", note: "Ce qu'on voit, entend, sent — pour l'écriture" },
          ]}
        ]
      },
      "Lieux & Bâtiments": {
        icon: "📍",
        color: "#40916c",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Ville", "Village", "Hameau", "Capitale", "Forteresse", "Château", "Temple", "Taverne", "Auberge", "Port", "Marché", "Ruine", "Donjon", "Tour", "Palais", "Prison", "École / Académie", "Bibliothèque", "Arène", "Nécropole", "Autre"] },
              { name: "Surnom / Épithète", id: "surnom_epithete", type: "text", note: "Ex: 'La Ville Éternelle'" },
              { name: "Statut", id: "statut", type: "select", options: ["Actif", "Abandonné", "En ruine", "Mythique / Légendaire", "Détruit"] },
              { name: "Fondation", id: "fondation", type: "text", note: "Date ou époque de construction" },
              { name: "Fondateur(s)", id: "fondateur_s", type: "relation-multi", target: "Personnage" },
              { name: "Situé dans", id: "situe_dans", type: "relation", target: "Géographie, Lieux & Bâtiments", note: "Lieu ou zone parente (ex: Taverne → Ville, ou Ville → Région)" },
            ]
          },
          {
            label: "Description",
            fields: [
              { name: "Architecture", id: "architecture", type: "textarea-sm", note: "Style, matériaux, époque" },
              { name: "Taille / Population", id: "taille_population", type: "text" },
              { name: "Plan / Structure", id: "plan_structure", type: "textarea-sm", note: "Quartiers, niveaux, zones notables" },
              { name: "Points d'intérêt internes", id: "points_d_interet_internes", type: "textarea", note: "Endroits remarquables à l'intérieur" },
              { name: "Entrées / Accès", id: "entrees_acces", type: "textarea-sm", note: "Portes, passages secrets, accès cachés" },
              { name: "Sécurité / Défenses", id: "securite_defenses", type: "textarea-sm" },
            ]
          },
          {
            label: "Vie & Société",
            fields: [
              { name: "Population dominante", id: "population_dominante", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Gouvernance locale", id: "gouvernance_locale", type: "relation", target: "Politique & Géopolitique" },
              { name: "Dirigeant(s)", id: "dirigeant_s", type: "relation-multi", target: "Personnage" },
              { name: "Économie locale", id: "economie_locale", type: "textarea-sm", note: "Commerce principal, ressources, marchés" },
              { name: "Organisations présentes", id: "organisations_presentes", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Cultes / Religions pratiquées", id: "cultes_religions_pratiquees", type: "relation-multi", target: "Religions & Cultes" },
              { name: "Ambiance / Réputation", id: "ambiance_reputation", type: "textarea-sm", note: "Comment ce lieu est perçu de l'extérieur" },
            ]
          },
          {
            label: "Histoire",
            fields: [
              { name: "Événements fondateurs", id: "evenements_fondateurs", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Anciens noms", id: "anciens_noms", type: "tags" },
              { name: "Propriétaires successifs", id: "proprietaires_successifs", type: "textarea-sm" },
              { name: "Secrets & mystères", id: "secrets_mysteres", type: "textarea", note: "Jamais exporté sauf si révélé" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'histoire", id: "role_dans_l_histoire", type: "textarea-sm" },
            { name: "Personnages associés", id: "personnages_associes", type: "relation-multi", target: "Personnage" },
            { name: "Scènes qui s'y déroulent", id: "scenes_qui_s_y_deroulent", type: "relation-multi", target: "Scène" },
            { name: "Description sensorielle", id: "description_sensorielle", type: "textarea", note: "Odeurs, sons, lumière, température" },
            { name: "Carte / Plan du lieu", id: "carte_plan_du_lieu", type: "image" },
          ]}
        ]
      },
      "Peuples & Ethnies": {
        icon: "👥",
        color: "#52b788",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Espèce intelligente", "Ethnie", "Peuple", "Sous-espèce", "Hybride", "Créature semi-intelligente"] },
              { name: "Autonym", id: "autonym", type: "text", note: "Comment ce peuple se nomme lui-même" },
              { name: "Exonymes", id: "exonymes", type: "tags", note: "Comment les autres les appellent" },
              { name: "Origine géographique", id: "origine_geographique", type: "relation", target: "Géographie" },
              { name: "Zones d'habitation actuelles", id: "zones_d_habitation_actuelles", type: "relation-multi", target: "Géographie" },
              { name: "Population estimée", id: "population_estimee", type: "text" },
              { name: "Statut", id: "statut", type: "select", options: ["Florissant", "En déclin", "Minoritaire", "Dispersé", "Quasi-éteint", "Éteint"] },
            ]
          },
          {
            label: "Biologie",
            fields: [
              { name: "Apparence physique", id: "apparence_physique", type: "textarea", note: "Traits distinctifs, couleurs, taille, morphologie" },
              { name: "Longévité", id: "longevite", type: "text", note: "Espérance de vie, vitesse de vieillissement" },
              { name: "Reproduction", id: "reproduction", type: "textarea-sm", note: "Mode, durée de gestation, nombre de descendants" },
              { name: "Capacités innées", id: "capacites_innees", type: "textarea-sm", note: "Sens, résistances, régénération, pouvoirs naturels" },
              { name: "Faiblesses biologiques", id: "faiblesses_biologiques", type: "textarea-sm" },
              { name: "Régime alimentaire", id: "regime_alimentaire", type: "textarea-sm" },
              { name: "Maladies propres", id: "maladies_propres", type: "textarea-sm" },
              { name: "Sous-espèces / Variants", id: "sous_especes_variants", type: "textarea-sm" },
            ]
          },
          {
            label: "Culture",
            fields: [
              { name: "Langue(s)", id: "langue_s", type: "relation-multi", target: "Linguistique & Grammaire" },
              { name: "Religion(s) dominante(s)", id: "religion_s_dominante_s", type: "relation-multi", target: "Religions & Cultes" },
              { name: "Système social", id: "systeme_social", type: "relation", target: "Systèmes Sociaux & Castes" },
              { name: "Valeurs fondamentales", id: "valeurs_fondamentales", type: "tags" },
              { name: "Tabous majeurs", id: "tabous_majeurs", type: "textarea-sm" },
              { name: "Traditions distinctives", id: "traditions_distinctives", type: "relation-multi", target: "Cultures & Traditions" },
              { name: "Relations avec d'autres peuples", id: "relations_avec_d_autres_peuples", type: "textarea", note: "Alliances, conflits, préjugés, coexistence" },
            ]
          },
          {
            label: "Histoire",
            fields: [
              { name: "Origine mythique", id: "origine_mythique", type: "relation", target: "Mythes & Légendes" },
              { name: "Origine historique", id: "origine_historique", type: "relation", target: "Histoire & Chronologie" },
              { name: "Événements fondateurs", id: "evenements_fondateurs", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Figures historiques notables", id: "figures_historiques_notables", type: "relation-multi", target: "Personnage" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'histoire", id: "role_dans_l_histoire", type: "textarea-sm" },
            { name: "Personnages de ce peuple", id: "personnages_de_ce_peuple", type: "relation-multi", target: "Personnage" },
            { name: "Stéréotypes véhiculés (et leur vérité)", id: "stereotypes_vehicules_et_leur_verite", type: "textarea", note: "Ce que les autres en pensent vs réalité" },
          ]}
        ]
      },
      "Cultures & Traditions": {
        icon: "🎭",
        color: "#74c69d",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Peuple(s) concerné(s)", id: "peuple_s_concerne_s", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Zone géographique", id: "zone_geographique", type: "relation-multi", target: "Géographie" },
              { name: "Période", id: "periode", type: "text", note: "Époque où cette culture est active" },
            ]
          },
          {
            label: "Vie quotidienne",
            fields: [
              { name: "Gastronomie", id: "gastronomie", type: "textarea", note: "Plats, boissons, interdits alimentaires" },
              { name: "Vêtements & Apparence", id: "vetements_apparence", type: "textarea", note: "Habits, coiffures, tatouages, cosmétiques" },
              { name: "Habitat typique", id: "habitat_typique", type: "textarea-sm" },
              { name: "Rythme de vie", id: "rythme_de_vie", type: "textarea-sm", note: "Horaires, semaine, saisons sociales" },
              { name: "Monnaie / Troc", id: "monnaie_troc", type: "relation", target: "Économie & Commerce" },
            ]
          },
          {
            label: "Arts & Expression",
            fields: [
              { name: "Musique", id: "musique", type: "textarea-sm" },
              { name: "Arts visuels", id: "arts_visuels", type: "textarea-sm", note: "Peinture, sculpture, artisanat, calligraphie" },
              { name: "Littérature / Oralité", id: "litterature_oralite", type: "textarea-sm", note: "Contes, épopées, formes poétiques" },
              { name: "Architecture typique", id: "architecture_typique", type: "textarea-sm" },
              { name: "Jeux & Divertissements", id: "jeux_divertissements", type: "textarea-sm" },
            ]
          },
          {
            label: "Rites & Fêtes",
            fields: [
              { name: "Rites de naissance", id: "rites_de_naissance", type: "textarea-sm" },
              { name: "Rites de passage (enfance → adulte)", id: "rites_de_passage_enfance_adulte", type: "textarea-sm" },
              { name: "Rites funéraires", id: "rites_funeraires", type: "textarea-sm" },
              { name: "Mariage / Union", id: "mariage_union", type: "textarea-sm" },
              { name: "Fêtes calendaires", id: "fetes_calendaires", type: "textarea", note: "Noms, dates, déroulement" },
              { name: "Cérémonies religieuses", id: "ceremonies_religieuses", type: "relation-multi", target: "Religions & Cultes" },
            ]
          },
          {
            label: "Codes sociaux",
            fields: [
              { name: "Salutations & Politesse", id: "salutations_politesse", type: "textarea-sm" },
              { name: "Tabous comportementaux", id: "tabous_comportementaux", type: "textarea-sm" },
              { name: "Rôles de genre", id: "roles_de_genre", type: "textarea-sm" },
              { name: "Rapport à l'étranger", id: "rapport_a_l_etranger", type: "textarea-sm" },
              { name: "Codes d'honneur", id: "codes_d_honneur", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'histoire", id: "role_dans_l_histoire", type: "textarea-sm" },
            { name: "Scènes illustrant cette culture", id: "scenes_illustrant_cette_culture", type: "relation-multi", target: "Scène" },
          ]}
        ]
      },
      "Histoire & Chronologie": {
        icon: "📜",
        color: "#95d5b2",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type d'événement", id: "type_d_evenement", type: "select", options: ["Guerre", "Bataille", "Traité", "Fondation", "Chute / Destruction", "Catastrophe naturelle", "Épidémie", "Découverte", "Règne", "Révolution", "Migration", "Naissance", "Mort", "Autre"] },
              { name: "Date de début", id: "date_de_debut", type: "text" },
              { name: "Date de fin", id: "date_de_fin", type: "text" },
              { name: "Ère / Époque", id: "ere_epoque", type: "text", note: "Nom de l'ère dans la chronologie du monde" },
              { name: "Lieu(x)", id: "lieu_x", type: "relation-multi", target: "Lieux & Bâtiments" },
              { name: "Région(s) concernée(s)", id: "region_s_concernee_s", type: "relation-multi", target: "Géographie" },
            ]
          },
          {
            label: "Acteurs",
            fields: [
              { name: "Personnages impliqués", id: "personnages_impliques", type: "relation-multi", target: "Personnage" },
              { name: "Peuples impliqués", id: "peuples_impliques", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Factions impliquées", id: "factions_impliquees", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Instigateur(s)", id: "instigateur_s", type: "relation-multi", target: "Personnage" },
            ]
          },
          {
            label: "Déroulement",
            fields: [
              { name: "Causes", id: "causes", type: "textarea" },
              { name: "Déroulement chronologique", id: "deroulement_chronologique", type: "textarea", note: "Phases de l'événement" },
              { name: "Moment pivot / Tournant", id: "moment_pivot_tournant", type: "textarea-sm" },
              { name: "Issue / Résultat", id: "issue_resultat", type: "textarea" },
              { name: "Pertes & Bilan", id: "pertes_bilan", type: "textarea-sm" },
            ]
          },
          {
            label: "Conséquences",
            fields: [
              { name: "Conséquences immédiates", id: "consequences_immediates", type: "textarea" },
              { name: "Conséquences à long terme", id: "consequences_a_long_terme", type: "textarea" },
              { name: "Événements déclenchés", id: "evenements_declenches", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Événements déclencheurs", id: "evenements_declencheurs", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Objets / Artefacts créés ou détruits", id: "objets_artefacts_crees_ou_detruits", type: "relation-multi", target: "Objets & Artefacts" },
            ]
          },
          { label: "Mémoire",
            fields: [
              { name: "Comment est-il commémoré ?", id: "comment_est_il_commemore", type: "textarea-sm" },
              { name: "Mythes / Légendes associés", id: "mythes_legendes_associes", type: "relation-multi", target: "Mythes & Légendes" },
              { name: "Interprétations divergentes", id: "interpretations_divergentes", type: "textarea", note: "Versions selon les peuples / camps" },
              { name: "Scènes du roman liées", id: "scenes_du_roman_liees", type: "relation-multi", target: "Scène" },
            ]
          }
        ]
      },
      "Faune & Flore": {
        icon: "🐉",
        color: "#b7e4c7",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Règne", id: "regne", type: "select", options: ["Animal", "Végétal", "Fongique", "Minéral-vivant", "Magique / Hybride", "Autre"] },
              { name: "Classification interne", id: "classification_interne", type: "text", note: "Équivalent taxonomique dans ce monde" },
              { name: "Nom vernaculaire", id: "nom_vernaculaire", type: "text" },
              { name: "Noms dans d'autres langues", id: "noms_dans_d_autres_langues", type: "tags" },
              { name: "Statut", id: "statut", type: "select", options: ["Commun", "Rare", "Quasi-éteint", "Éteint", "Légendaire / Non confirmé"] },
              { name: "Habitats", id: "habitats", type: "relation-multi", target: "Géographie" },
            ]
          },
          {
            label: "Biologie",
            fields: [
              { name: "Apparence", id: "apparence", type: "textarea" },
              { name: "Taille & Poids", id: "taille_poids", type: "text" },
              { name: "Longévité", id: "longevite", type: "text" },
              { name: "Reproduction", id: "reproduction", type: "textarea-sm" },
              { name: "Alimentation", id: "alimentation", type: "textarea-sm" },
              { name: "Comportement social", id: "comportement_social", type: "textarea-sm", note: "Solitaire, grégaire, hiérarchique" },
              { name: "Capacités spéciales", id: "capacites_speciales", type: "textarea", note: "Venin, camouflage, régénération, magie innée" },
              { name: "Faiblesses", id: "faiblesses", type: "textarea-sm" },
              { name: "Prédateurs naturels", id: "predateurs_naturels", type: "relation-multi", target: "Faune & Flore" },
              { name: "Proies / Hôtes", id: "proies_hotes", type: "relation-multi", target: "Faune & Flore" },
            ]
          },
          {
            label: "Usages",
            fields: [
              { name: "Usages par les peuples intelligents", id: "usages_par_les_peuples_intelligents", type: "textarea", note: "Chasse, élevage, commerce, magie" },
              { name: "Propriétés médicinales / alchimiques", id: "proprietes_medicinales_alchimiques", type: "textarea-sm" },
              { name: "Danger pour les humains", id: "danger_pour_les_humains", type: "select", options: ["Inoffensif", "Défensif", "Dangereux", "Mortel", "Catastrophique"] },
              { name: "Valeur commerciale", id: "valeur_commerciale", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'histoire", id: "role_dans_l_histoire", type: "textarea-sm" },
            { name: "Mythes / Légendes associés", id: "mythes_legendes_associes", type: "relation-multi", target: "Mythes & Légendes" },
            { name: "Symbole culturel pour", id: "symbole_culturel_pour", type: "relation-multi", target: "Peuples & Ethnies" },
            { name: "Scènes associées", id: "scenes_associees", type: "relation-multi", target: "Scène" },
          ]}
        ]
      },
      "Objets & Artefacts": {
        icon: "⚔️",
        color: "#d8f3dc",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Arme", "Armure", "Outil", "Bijou", "Relique religieuse", "Livre / Grimoire", "Instrument de musique", "Véhicule", "Dispositif technologique", "Contenant", "Vêtement", "Autre"] },
              { name: "Matériaux", id: "materiaux", type: "tags" },
              { name: "Taille / Poids", id: "taille_poids", type: "text" },
              { name: "Valeur estimée", id: "valeur_estimee", type: "text" },
              { name: "Unicité", id: "unicite", type: "select", options: ["Unique", "Série limitée", "Courant", "Produit en masse"] },
              { name: "Statut actuel", id: "statut_actuel", type: "select", options: ["Existant", "Détruit", "Perdu", "Légendaire / Non confirmé", "Fragmenté"] },
            ]
          },
          {
            label: "Histoire",
            fields: [
              { name: "Créateur(s)", id: "createur_s", type: "relation-multi", target: "Personnage" },
              { name: "Date / Époque de création", id: "date_epoque_de_creation", type: "text" },
              { name: "Lieu de création", id: "lieu_de_creation", type: "relation", target: "Lieux & Bâtiments" },
              { name: "Propriétaires successifs", id: "proprietaires_successifs", type: "textarea", note: "Lignée de possession" },
              { name: "Propriétaire actuel", id: "proprietaire_actuel", type: "relation", target: "Personnage" },
              { name: "Lieu actuel", id: "lieu_actuel", type: "relation", target: "Lieux & Bâtiments" },
              { name: "Événements liés", id: "evenements_lies", type: "relation-multi", target: "Histoire & Chronologie" },
            ]
          },
          {
            label: "Capacités",
            fields: [
              { name: "Fonction principale", id: "fonction_principale", type: "textarea-sm" },
              { name: "Propriétés magiques", id: "proprietes_magiques", type: "textarea", note: "Si magique — renvoie vers le système de magie" },
              { name: "Système magique lié", id: "systeme_magique_lie", type: "relation", target: "Magie & Pouvoirs" },
              { name: "Conditions d'utilisation", id: "conditions_d_utilisation", type: "textarea-sm", note: "Prérequis, rituels, restrictions" },
              { name: "Effets secondaires / Malédictions", id: "effets_secondaires_maledictions", type: "textarea-sm" },
              { name: "Faiblesses / Contre-mesures", id: "faiblesses_contre_mesures", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Mythes / Légendes associés", id: "mythes_legendes_associes", type: "relation-multi", target: "Mythes & Légendes" },
            { name: "Personnages liés", id: "personnages_lies", type: "relation-multi", target: "Personnage" },
            { name: "Scènes clés", id: "scenes_cles", type: "relation-multi", target: "Scène" },
            { name: "Description détaillée (pour l'écriture)", id: "description_detaillee_pour_l_ecriture", type: "textarea" },
          ]}
        ]
      },
    }
  },
  CODEX: {
    color: "#c77dff",
    accent: "#7b2d8b",
    label: "Codex",
    icon: "📚",
    categories: {
      "Magie & Pouvoirs": {
        icon: "✨",
        color: "#9d4edd",
        tabs: [
          {
            label: "Système",
            fields: [
              { name: "Nom du système / École", id: "nom_du_systeme_ecole", type: "text" },
              { name: "Type", id: "type", type: "select", options: ["Magie innée", "Magie apprise", "Magie divine", "Magie runique", "Magie psionique", "Technologie magique", "Magie primordiale", "Autre"] },
              { name: "Source de pouvoir", id: "source_de_pouvoir", type: "textarea-sm", note: "D'où vient l'énergie magique ?" },
              { name: "Qui peut l'utiliser ?", id: "qui_peut_l_utiliser", type: "textarea-sm", note: "Conditions d'accès, talents requis" },
              { name: "Prévalence", id: "prevalence", type: "select", options: ["Universelle", "Rare", "Très rare", "Unique"] },
            ]
          },
          {
            label: "Règles",
            fields: [
              { name: "Mécanisme d'activation", id: "mecanisme_d_activation", type: "textarea", note: "Gestes, mots, concentration, outils" },
              { name: "Coût / Ressource consommée", id: "cout_ressource_consommee", type: "textarea-sm", note: "Mana, vie, temps, matériaux" },
              { name: "Limites & Plafonds", id: "limites_plafonds", type: "textarea", note: "Ce qu'on ne peut absolument pas faire" },
              { name: "Temps d'incantation", id: "temps_d_incantation", type: "textarea-sm" },
              { name: "Portée & Durée", id: "portee_duree", type: "textarea-sm" },
              { name: "Effets secondaires", id: "effets_secondaires", type: "textarea", note: "Fatigue, corruption, addiction, séquelles" },
              { name: "Échecs magiques", id: "echecs_magiques", type: "textarea-sm", note: "Ce qui se passe quand ça rate" },
              { name: "Contremesures / Anti-magie", id: "contremesures_anti_magie", type: "textarea-sm" },
            ]
          },
          {
            label: "Taxonomie",
            fields: [
              { name: "Disciplines / Écoles", id: "disciplines_ecoles", type: "textarea", note: "Sous-branches du système" },
              { name: "Sorts / Capacités notables", id: "sorts_capacites_notables", type: "textarea", note: "Exemples représentatifs" },
              { name: "Hiérarchie des praticiens", id: "hierarchie_des_praticiens", type: "textarea-sm", note: "Niveaux de maîtrise, titres" },
              { name: "Systèmes connexes / Compatibles", id: "systemes_connexes_compatibles", type: "relation-multi", target: "Magie & Pouvoirs" },
              { name: "Systèmes opposés / Incompatibles", id: "systemes_opposes_incompatibles", type: "relation-multi", target: "Magie & Pouvoirs" },
            ]
          },
          {
            label: "Impact",
            fields: [
              { name: "Impact sur la société", id: "impact_sur_la_societe", type: "textarea", note: "Économie, politique, guerre, quotidien" },
              { name: "Organisations liées", id: "organisations_liees", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Lien avec les religions", id: "lien_avec_les_religions", type: "relation-multi", target: "Religions & Cultes" },
              { name: "Peuples / Espèces liées", id: "peuples_especes_liees", type: "relation-multi", target: "Peuples & Ethnies" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages qui l'utilisent", id: "personnages_qui_l_utilisent", type: "relation-multi", target: "Personnage" },
            { name: "Scènes clés", id: "scenes_cles", type: "relation-multi", target: "Scène" },
            { name: "Règles que l'auteur peut ignorer (et pourquoi)", id: "regles_que_l_auteur_peut_ignorer_et_pourquoi", type: "textarea", note: "Flexibilité narrative assumée" },
          ]}
        ]
      },
      "Sciences & Technologie": {
        icon: "⚙️",
        color: "#7e6ef5",
        tabs: [
          {
            label: "Définition",
            fields: [
              { name: "Domaine", id: "domaine", type: "select", options: ["Mécanique", "Chimie / Alchimie", "Biologie / Médecine", "Informatique / Automates", "Énergie", "Armement", "Transport", "Communication", "Agriculture", "Architecture", "Autre"] },
              { name: "Niveau technologique", id: "niveau_technologique", type: "select", options: ["Préhistorique", "Antique", "Médiéval", "Renaissance", "Industriel", "Moderne", "Post-moderne", "Futuriste", "Surpassant notre monde"] },
              { name: "Principes physiques sous-jacents", id: "principes_physiques_sous_jacents", type: "textarea", note: "Les lois de la physique propres à ce monde" },
              { name: "Différences avec notre monde réel", id: "differences_avec_notre_monde_reel", type: "textarea-sm" },
            ]
          },
          {
            label: "Applications",
            fields: [
              { name: "Technologies maîtrisées", id: "technologies_maitrisees", type: "textarea", note: "Ce que ce monde sait faire" },
              { name: "Technologies impossibles", id: "technologies_impossibles", type: "textarea-sm", note: "Ce qui ne peut pas exister dans ce monde" },
              { name: "Technologies en développement", id: "technologies_en_developpement", type: "textarea-sm" },
              { name: "Inventions clés", id: "inventions_cles", type: "relation-multi", target: "Objets & Artefacts" },
              { name: "Peuples en avance / retard", id: "peuples_en_avance_retard", type: "relation-multi", target: "Peuples & Ethnies" },
            ]
          },
          {
            label: "Impact",
            fields: [
              { name: "Impact sur la guerre", id: "impact_sur_la_guerre", type: "textarea-sm" },
              { name: "Impact sur l'économie", id: "impact_sur_l_economie", type: "textarea-sm" },
              { name: "Impact sur la vie quotidienne", id: "impact_sur_la_vie_quotidienne", type: "textarea-sm" },
              { name: "Tensions avec la magie", id: "tensions_avec_la_magie", type: "relation-multi", target: "Magie & Pouvoirs" },
              { name: "Organisations de recherche", id: "organisations_de_recherche", type: "relation-multi", target: "Factions & Organisations" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages scientifiques / inventeurs", id: "personnages_scientifiques_inventeurs", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Religions & Cultes": {
        icon: "📖",
        color: "#c77dff",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Monothéisme", "Polythéisme", "Panthéisme", "Animisme", "Culte ancestral", "Culte secret / Interdit", "Philosophie religieuse", "Hérésie", "Autre"] },
              { name: "Statut", id: "statut", type: "select", options: ["Religion officielle", "Religion tolérée", "Religion persécutée", "Religion disparue", "Religion en formation"] },
              { name: "Peuples pratiquants", id: "peuples_pratiquants", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Zones géographiques", id: "zones_geographiques", type: "relation-multi", target: "Géographie" },
              { name: "Nombre de fidèles", id: "nombre_de_fideles", type: "text" },
            ]
          },
          {
            label: "Doctrine",
            fields: [
              { name: "Divinité(s) / Entité(s) vénérée(s)", id: "divinite_s_entite_s_veneree_s", type: "textarea", note: "Nature, attributs, noms" },
              { name: "Textes sacrés", id: "textes_sacres", type: "textarea-sm", note: "Titres et contenu synthétique" },
              { name: "Dogmes fondamentaux", id: "dogmes_fondamentaux", type: "textarea" },
              { name: "Vision de l'après-vie", id: "vision_de_l_apres_vie", type: "textarea-sm" },
              { name: "Vision du monde / Cosmologie", id: "vision_du_monde_cosmologie", type: "relation", target: "Cosmologie & Métaphysique" },
              { name: "Moral & Éthique", id: "moral_ethique", type: "textarea-sm", note: "Ce que la religion prescrit/interdit" },
              { name: "Rapport à la magie", id: "rapport_a_la_magie", type: "relation-multi", target: "Magie & Pouvoirs" },
            ]
          },
          {
            label: "Pratique",
            fields: [
              { name: "Clergé / Hiérarchie", id: "clerge_hierarchie", type: "textarea", note: "Titres, rôles, élection" },
              { name: "Rituels principaux", id: "rituels_principaux", type: "textarea" },
              { name: "Lieux de culte", id: "lieux_de_culte", type: "relation-multi", target: "Lieux & Bâtiments" },
              { name: "Fêtes religieuses", id: "fetes_religieuses", type: "textarea-sm" },
              { name: "Conditions d'appartenance", id: "conditions_d_appartenance", type: "textarea-sm", note: "Conversion, naissance, initiation" },
              { name: "Excommunication / Exclusion", id: "excommunication_exclusion", type: "textarea-sm" },
            ]
          },
          {
            label: "Histoire & Relations",
            fields: [
              { name: "Fondateur(s)", id: "fondateur_s", type: "relation-multi", target: "Personnage" },
              { name: "Date / Époque de fondation", id: "date_epoque_de_fondation", type: "text" },
              { name: "Schismes & Hérésies", id: "schismes_heresies", type: "textarea-sm" },
              { name: "Relations avec d'autres religions", id: "relations_avec_d_autres_religions", type: "textarea" },
              { name: "Relations avec le pouvoir politique", id: "relations_avec_le_pouvoir_politique", type: "relation-multi", target: "Politique & Géopolitique" },
              { name: "Organisations religieuses", id: "organisations_religieuses", type: "relation-multi", target: "Factions & Organisations" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages pratiquants", id: "personnages_pratiquants", type: "relation-multi", target: "Personnage" },
            { name: "Mythes associés", id: "mythes_associes", type: "relation-multi", target: "Mythes & Légendes" },
          ]}
        ]
      },
      "Philosophies & Idéologies": {
        icon: "💡",
        color: "#e0aaff",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Éthique", "Épistémologie", "Politique", "Existentielle", "Esthétique", "Idéologie révolutionnaire", "Idéologie conservatrice", "Autre"] },
              { name: "Fondateur(s)", id: "fondateur_s", type: "relation-multi", target: "Personnage" },
              { name: "Époque d'émergence", id: "epoque_d_emergence", type: "text" },
              { name: "Peuples / Groupes adeptes", id: "peuples_groupes_adeptes", type: "relation-multi", target: "Peuples & Ethnies" },
            ]
          },
          {
            label: "Contenu",
            fields: [
              { name: "Thèses fondamentales", id: "theses_fondamentales", type: "textarea" },
              { name: "Vision de l'être humain / individu", id: "vision_de_l_etre_humain_individu", type: "textarea-sm" },
              { name: "Vision de la société idéale", id: "vision_de_la_societe_ideale", type: "textarea-sm" },
              { name: "Rapport à la religion", id: "rapport_a_la_religion", type: "textarea-sm" },
              { name: "Rapport à la magie / science", id: "rapport_a_la_magie_science", type: "textarea-sm" },
              { name: "Textes fondateurs", id: "textes_fondateurs", type: "textarea-sm" },
              { name: "Oppositions & Contradictions internes", id: "oppositions_contradictions_internes", type: "textarea-sm" },
            ]
          },
          {
            label: "Influence",
            fields: [
              { name: "Influence sur la politique", id: "influence_sur_la_politique", type: "relation-multi", target: "Politique & Géopolitique" },
              { name: "Influence sur les arts", id: "influence_sur_les_arts", type: "textarea-sm" },
              { name: "Mouvements dérivés", id: "mouvements_derives", type: "textarea-sm" },
              { name: "Philosophies opposées", id: "philosophies_opposees", type: "relation-multi", target: "Philosophies & Idéologies" },
              { name: "Philosophies alliées", id: "philosophies_alliees", type: "relation-multi", target: "Philosophies & Idéologies" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages adeptes", id: "personnages_adeptes", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Mythes & Légendes": {
        icon: "🌙",
        color: "#9c89ff",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Mythe de création", "Mythe cosmogonique", "Légende héroïque", "Conte moral", "Prophétie", "Malédiction", "Récit eschatologique", "Autre"] },
              { name: "Peuple(s) d'origine", id: "peuple_s_d_origine", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Époque supposée", id: "epoque_supposee", type: "text" },
              { name: "Véracité dans la fiction", id: "veracite_dans_la_fiction", type: "select", options: ["Vrai (confirmé)", "Partiellement vrai", "Symboliquement vrai", "Faux (propagande)", "Inconnu"] },
            ]
          },
          {
            label: "Contenu",
            fields: [
              { name: "Récit complet", id: "recit_complet", type: "textarea", note: "La version canonique du mythe" },
              { name: "Personnages mythiques", id: "personnages_mythiques", type: "relation-multi", target: "Personnage" },
              { name: "Lieux mentionnés", id: "lieux_mentionnes", type: "relation-multi", target: "Lieux & Bâtiments" },
              { name: "Objets mythiques", id: "objets_mythiques", type: "relation-multi", target: "Objets & Artefacts" },
              { name: "Versions alternatives", id: "versions_alternatives", type: "textarea", note: "Variations selon les cultures" },
              { name: "Interprétations symboliques", id: "interpretations_symboliques", type: "textarea-sm" },
            ]
          },
          {
            label: "Impact",
            fields: [
              { name: "Religions qui l'utilisent", id: "religions_qui_l_utilisent", type: "relation-multi", target: "Religions & Cultes" },
              { name: "Rituels inspirés", id: "rituels_inspires", type: "textarea-sm" },
              { name: "Lien avec l'histoire réelle", id: "lien_avec_l_histoire_reelle", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Impact sur la culture populaire", id: "impact_sur_la_culture_populaire", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "La vérité que l'auteur connaît", id: "la_verite_que_l_auteur_connait", type: "textarea", note: "Jamais exporté — la réalité derrière le mythe" },
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
          ]}
        ]
      },
      "Politique & Géopolitique": {
        icon: "🏛️",
        color: "#7e6ef5",
        tabs: [
          {
            label: "Entité politique",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Empire", "Royaume", "République", "Cité-état", "Théocratie", "Oligarchie", "Anarchie organisée", "Confédération", "Protectorat", "Autre"] },
              { name: "Territoire", id: "territoire", type: "relation-multi", target: "Géographie" },
              { name: "Capitale", id: "capitale", type: "relation", target: "Lieux & Bâtiments" },
              { name: "Population", id: "population", type: "text" },
              { name: "Peuples sous sa juridiction", id: "peuples_sous_sa_juridiction", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Statut actuel", id: "statut_actuel", type: "select", options: ["Actif", "En guerre", "En crise", "Effondré", "Historique"] },
            ]
          },
          {
            label: "Gouvernance",
            fields: [
              { name: "Régime politique", id: "regime_politique", type: "textarea-sm" },
              { name: "Chef(s) d'État", id: "chef_s_d_etat", type: "relation-multi", target: "Personnage" },
              { name: "Mode de succession / d'élection", id: "mode_de_succession_d_election", type: "textarea-sm" },
              { name: "Institutions principales", id: "institutions_principales", type: "textarea", note: "Parlement, conseil, armée, tribunaux" },
              { name: "Idéologie officielle", id: "ideologie_officielle", type: "relation", target: "Philosophies & Idéologies" },
              { name: "Religion d'État", id: "religion_d_etat", type: "relation", target: "Religions & Cultes" },
              { name: "Lois fondamentales", id: "lois_fondamentales", type: "relation-multi", target: "Lois & Justice" },
            ]
          },
          {
            label: "Relations",
            fields: [
              { name: "Alliés", id: "allies", type: "relation-multi", target: "Politique & Géopolitique" },
              { name: "Ennemis / Rivaux", id: "ennemis_rivaux", type: "relation-multi", target: "Politique & Géopolitique" },
              { name: "Traités en vigueur", id: "traites_en_vigueur", type: "textarea" },
              { name: "Conflits en cours", id: "conflits_en_cours", type: "relation-multi", target: "Histoire & Chronologie" },
              { name: "Commerce & Diplomatie", id: "commerce_diplomatie", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Tensions internes", id: "tensions_internes", type: "textarea", note: "Factions, complots, fractures" },
            { name: "Personnages politiques clés", id: "personnages_politiques_cles", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Lois & Justice": {
        icon: "⚖️",
        color: "#6a5acd",
        tabs: [
          {
            label: "Cadre",
            fields: [
              { name: "Entité politique", id: "entite_politique", type: "relation", target: "Politique & Géopolitique" },
              { name: "Époque", id: "epoque", type: "text" },
              { name: "Type de droit", id: "type_de_droit", type: "select", options: ["Droit coutumier", "Droit codifié", "Droit religieux", "Droit féodal", "Droit naturel", "Droit magique", "Hybride"] },
              { name: "Source de l'autorité légale", id: "source_de_l_autorite_legale", type: "textarea-sm", note: "D'où vient le droit de faire des lois ?" },
            ]
          },
          {
            label: "Contenu",
            fields: [
              { name: "Droits reconnus", id: "droits_reconnus", type: "textarea" },
              { name: "Interdits majeurs", id: "interdits_majeurs", type: "textarea" },
              { name: "Tabous non-écrits", id: "tabous_non_ecrits", type: "textarea-sm" },
              { name: "Lois sur la magie", id: "lois_sur_la_magie", type: "relation-multi", target: "Magie & Pouvoirs" },
              { name: "Lois religieuses", id: "lois_religieuses", type: "relation-multi", target: "Religions & Cultes" },
              { name: "Crimes & Délits définis", id: "crimes_delits_definis", type: "textarea" },
              { name: "Peines & Châtiments", id: "peines_chatiments", type: "textarea" },
            ]
          },
          {
            label: "Justice",
            fields: [
              { name: "Institutions judiciaires", id: "institutions_judiciaires", type: "textarea-sm" },
              { name: "Procédure judiciaire", id: "procedure_judiciaire", type: "textarea" },
              { name: "Rôle de la torture / ordalies", id: "role_de_la_torture_ordalies", type: "textarea-sm" },
              { name: "Prisons & Lieux de détention", id: "prisons_lieux_de_detention", type: "relation-multi", target: "Lieux & Bâtiments" },
              { name: "Corruption / Failles notoires", id: "corruption_failles_notoires", type: "textarea" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Loi clé pour l'intrigue", id: "loi_cle_pour_l_intrigue", type: "textarea-sm" },
            { name: "Personnages impliqués (criminels, juges, victimes)", id: "personnages_impliques_criminels_juges_victimes", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Économie & Commerce": {
        icon: "🪙",
        color: "#5c4ab0",
        tabs: [
          {
            label: "Système",
            fields: [
              { name: "Type d'économie", id: "type_d_economie", type: "select", options: ["Troc", "Monétaire", "Féodale", "Mercantiliste", "Capitaliste", "Planifiée", "Magique", "Hybride"] },
              { name: "Monnaie(s)", id: "monnaie_s", type: "textarea", note: "Noms, valeurs relatives, émetteurs" },
              { name: "Entité politique", id: "entite_politique", type: "relation", target: "Politique & Géopolitique" },
              { name: "Niveau de développement", id: "niveau_de_developpement", type: "select", options: ["Subsistance", "Local", "Régional", "Continental", "International / Interplanaire"] },
            ]
          },
          {
            label: "Ressources",
            fields: [
              { name: "Ressources abondantes", id: "ressources_abondantes", type: "tags" },
              { name: "Ressources rares / stratégiques", id: "ressources_rares_strategiques", type: "tags" },
              { name: "Ressources inexistantes", id: "ressources_inexistantes", type: "tags" },
              { name: "Sources d'énergie", id: "sources_d_energie", type: "textarea-sm" },
              { name: "Agriculture & Alimentation", id: "agriculture_alimentation", type: "textarea-sm" },
            ]
          },
          {
            label: "Commerce",
            fields: [
              { name: "Routes commerciales principales", id: "routes_commerciales_principales", type: "relation-multi", target: "Géographie" },
              { name: "Guildes commerciales", id: "guildes_commerciales", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Produits d'exportation", id: "produits_d_exportation", type: "tags" },
              { name: "Produits d'importation", id: "produits_d_importation", type: "tags" },
              { name: "Commerce magique / alchimique", id: "commerce_magique_alchimique", type: "textarea-sm" },
              { name: "Marché noir / Contrebande", id: "marche_noir_contrebande", type: "textarea-sm" },
            ]
          },
          {
            label: "Structure",
            fields: [
              { name: "Classes socio-économiques", id: "classes_socio_economiques", type: "relation", target: "Systèmes Sociaux & Castes" },
              { name: "Fiscalité", id: "fiscalite", type: "textarea-sm", note: "Impôts, taxes, dîmes" },
              { name: "Inégalités notoires", id: "inegalites_notoires", type: "textarea-sm" },
              { name: "Crises économiques historiques", id: "crises_economiques_historiques", type: "relation-multi", target: "Histoire & Chronologie" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages marchands / économistes", id: "personnages_marchands_economistes", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Systèmes Sociaux & Castes": {
        icon: "🔺",
        color: "#4a3a8c",
        tabs: [
          {
            label: "Structure",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Castes héréditaires", "Classes sociales", "Mérite / Méritocratie", "Clans / Lignées", "Hiérarchie magique", "Hiérarchie militaire", "Théocratique", "Hybride"] },
              { name: "Entité politique", id: "entite_politique", type: "relation", target: "Politique & Géopolitique" },
              { name: "Peuples concernés", id: "peuples_concernes", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Nombre de niveaux / Strates", id: "nombre_de_niveaux_strates", type: "text" },
            ]
          },
          {
            label: "Niveaux",
            fields: [
              { name: "Strates (du plus haut au plus bas)", id: "strates_du_plus_haut_au_plus_bas", type: "textarea", note: "Nom, critères, droits, devoirs de chaque strate" },
              { name: "Critères de classement", id: "criteres_de_classement", type: "textarea-sm", note: "Naissance, richesse, magie, mérite, race" },
              { name: "Mobilité sociale", id: "mobilite_sociale", type: "select", options: ["Impossible", "Très rare", "Difficile", "Possible", "Fluide"] },
              { name: "Moyens de mobilité", id: "moyens_de_mobilite", type: "textarea-sm", note: "Mariage, exploit militaire, magie, argent" },
            ]
          },
          {
            label: "Fonctionnement",
            fields: [
              { name: "Marqueurs sociaux visibles", id: "marqueurs_sociaux_visibles", type: "textarea-sm", note: "Vêtements, titres, tatouages, insignes" },
              { name: "Droits différenciés par strate", id: "droits_differencies_par_strate", type: "textarea" },
              { name: "Discrimination institutionnalisée", id: "discrimination_institutionnalisee", type: "textarea-sm" },
              { name: "Tensions & Résistances", id: "tensions_resistances", type: "textarea", note: "Mouvements sociaux, rébellions, inégalités contestées" },
              { name: "Rapport aux lois", id: "rapport_aux_lois", type: "relation-multi", target: "Lois & Justice" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Personnages dans des positions de tension sociale", id: "personnages_dans_des_positions_de_tension_sociale", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Factions & Organisations": {
        icon: "🛡️",
        color: "#3a2d75",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Type", id: "type", type: "select", options: ["Guilde", "Ordre chevaleresque", "Société secrète", "Parti politique", "Armée / Milice", "Ordre religieux", "Académie", "Cartel criminel", "Syndicat", "Confrérie magique", "Autre"] },
              { name: "Statut", id: "statut", type: "select", options: ["Active", "Dissoute", "Clandestine", "Légale", "Proscrite", "Mythique"] },
              { name: "Date de fondation", id: "date_de_fondation", type: "text" },
              { name: "Fondateur(s)", id: "fondateur_s", type: "relation-multi", target: "Personnage" },
              { name: "Siège principal", id: "siege_principal", type: "relation", target: "Lieux & Bâtiments" },
              { name: "Zones d'influence", id: "zones_d_influence", type: "relation-multi", target: "Géographie" },
              { name: "Taille estimée", id: "taille_estimee", type: "text", note: "Nombre de membres" },
            ]
          },
          {
            label: "Structure interne",
            fields: [
              { name: "Hiérarchie", id: "hierarchie", type: "textarea", note: "Niveaux, titres, rôles" },
              { name: "Dirigeant(s) actuel(s)", id: "dirigeant_s_actuel_s", type: "relation-multi", target: "Personnage" },
              { name: "Mode de recrutement", id: "mode_de_recrutement", type: "textarea-sm" },
              { name: "Conditions d'adhésion", id: "conditions_d_adhesion", type: "textarea-sm", note: "Rituels, épreuves, serments" },
              { name: "Conditions d'exclusion", id: "conditions_d_exclusion", type: "textarea-sm" },
              { name: "Financement", id: "financement", type: "textarea-sm", note: "Sources de revenus" },
              { name: "Symboles & Insignes", id: "symboles_insignes", type: "textarea-sm" },
            ]
          },
          {
            label: "Objectifs & Méthodes",
            fields: [
              { name: "Mission officielle", id: "mission_officielle", type: "textarea-sm" },
              { name: "Objectifs réels (si différents)", id: "objectifs_reels_si_differents", type: "textarea-sm", note: "Jamais exporté si secret" },
              { name: "Méthodes", id: "methodes", type: "textarea", note: "Comment ils opèrent" },
              { name: "Codes éthiques internes", id: "codes_ethiques_internes", type: "textarea-sm" },
              { name: "Rapport à la loi", id: "rapport_a_la_loi", type: "select", options: ["Légale et reconnue", "Tolérée", "Dans le flou", "Illégale", "Hors-la-loi"] },
            ]
          },
          {
            label: "Relations",
            fields: [
              { name: "Alliées", id: "alliees", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Rivales / Ennemies", id: "rivales_ennemies", type: "relation-multi", target: "Factions & Organisations" },
              { name: "Rapport au pouvoir politique", id: "rapport_au_pouvoir_politique", type: "relation-multi", target: "Politique & Géopolitique" },
              { name: "Rapport à la religion", id: "rapport_a_la_religion", type: "relation-multi", target: "Religions & Cultes" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Rôle dans l'intrigue", id: "role_dans_l_intrigue", type: "textarea-sm" },
            { name: "Membres importants", id: "membres_importants", type: "relation-multi", target: "Personnage" },
            { name: "Secrets que l'auteur connaît", id: "secrets_que_l_auteur_connait", type: "textarea", note: "Jamais exporté" },
          ]}
        ]
      },
      "Linguistique & Grammaire": {
        icon: "💬",
        color: "#2d2060",
        tabs: [
          {
            label: "Identité",
            fields: [
              { name: "Nom de la langue", id: "nom_de_la_langue", type: "text" },
              { name: "Famille linguistique", id: "famille_linguistique", type: "text" },
              { name: "Langues parentes", id: "langues_parentes", type: "relation-multi", target: "Linguistique & Grammaire" },
              { name: "Langues dérivées", id: "langues_derivees", type: "relation-multi", target: "Linguistique & Grammaire" },
              { name: "Locuteurs", id: "locuteurs", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Statut", id: "statut", type: "select", options: ["Langue vivante", "Langue morte", "Langue liturgique", "Lingua franca", "Argot / Dialecte"] },
              { name: "Nombre de locuteurs", id: "nombre_de_locuteurs", type: "text" },
            ]
          },
          {
            label: "Phonologie",
            fields: [
              { name: "Sons caractéristiques", id: "sons_caracteristiques", type: "textarea-sm", note: "Consonnes, voyelles particulières" },
              { name: "Accent & Prosodie", id: "accent_prosodie", type: "textarea-sm" },
              { name: "Sons inexistants", id: "sons_inexistants", type: "textarea-sm", note: "Ce que cette langue ne peut pas prononcer" },
            ]
          },
          {
            label: "Écriture",
            fields: [
              { name: "Système d'écriture", id: "systeme_d_ecriture", type: "select", options: ["Alphabet", "Abjad", "Syllabaire", "Logogrammes", "Idéogrammes", "Aucun", "Autre"] },
              { name: "Nom de l'alphabet / Script", id: "nom_de_l_alphabet_script", type: "text" },
              { name: "Direction d'écriture", id: "direction_d_ecriture", type: "select", options: ["Gauche → Droite", "Droite → Gauche", "Haut → Bas", "Boustrophédon", "Autre"] },
              { name: "Description visuelle", id: "description_visuelle", type: "textarea-sm" },
              { name: "Exemples de glyphes", id: "exemples_de_glyphes", type: "textarea-sm" },
            ]
          },
          {
            label: "Grammaire",
            fields: [
              { name: "Type morphologique", id: "type_morphologique", type: "select", options: ["Isolant", "Agglutinant", "Flexionnel", "Polysynthétique"] },
              { name: "Ordre des mots", id: "ordre_des_mots", type: "select", options: ["SVO", "SOV", "VSO", "VOS", "OVS", "OSV", "Libre"] },
              { name: "Genres grammaticaux", id: "genres_grammaticaux", type: "textarea-sm" },
              { name: "Nombre de cas", id: "nombre_de_cas", type: "text" },
              { name: "Temps verbaux", id: "temps_verbaux", type: "textarea-sm" },
              { name: "Particularités notables", id: "particularites_notables", type: "textarea", note: "Ce qui rend cette grammaire unique" },
            ]
          },
          {
            label: "Lexique",
            fields: [
              { name: "Mots clés / Glossaire rapide", id: "mots_cles_glossaire_rapide", type: "textarea", note: "Les mots que l'auteur utilisera en roman" },
              { name: "Phrases types", id: "phrases_types", type: "textarea-sm", note: "Salutations, insultes, formules" },
              { name: "Emprunts à d'autres langues", id: "emprunts_a_d_autres_langues", type: "textarea-sm" },
              { name: "Tabous lexicaux", id: "tabous_lexicaux", type: "textarea-sm", note: "Mots interdits, euphémismes obligatoires" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Mots utilisés dans le roman", id: "mots_utilises_dans_le_roman", type: "textarea", note: "Inventaire des mots réellement écrits" },
            { name: "Personnages qui la parlent", id: "personnages_qui_la_parlent", type: "relation-multi", target: "Personnage" },
          ]}
        ]
      },
      "Cosmologie & Métaphysique": {
        icon: "🌌",
        color: "#1a1040",
        tabs: [
          {
            label: "Origine",
            fields: [
              { name: "Théorie de la création", id: "theorie_de_la_creation", type: "textarea", note: "Comment ce monde a été créé (vérité de l'auteur)" },
              { name: "Entités créatrices", id: "entites_creatrices", type: "textarea-sm", note: "Dieux, forces, accidents" },
              { name: "Âge du monde", id: "age_du_monde", type: "text" },
              { name: "Mythes de création associés", id: "mythes_de_creation_associes", type: "relation-multi", target: "Mythes & Légendes" },
            ]
          },
          {
            label: "Structure du cosmos",
            fields: [
              { name: "Plans d'existence", id: "plans_d_existence", type: "textarea", note: "Liste et description de chaque plan" },
              { name: "Plan matériel (monde principal)", id: "plan_materiel_monde_principal", type: "textarea-sm" },
              { name: "Plans divins / spirituels", id: "plans_divins_spirituels", type: "textarea-sm" },
              { name: "Plans démoniaques / sombres", id: "plans_demoniaques_sombres", type: "textarea-sm" },
              { name: "Liens entre les plans", id: "liens_entre_les_plans", type: "textarea", note: "Comment voyager, barrières, portails" },
              { name: "Géographie des plans", id: "geographie_des_plans", type: "relation-multi", target: "Géographie" },
            ]
          },
          {
            label: "Métaphysique",
            fields: [
              { name: "Nature de l'âme", id: "nature_de_l_ame", type: "textarea", note: "Existe-t-elle ? Qu'est-ce qu'elle est ?" },
              { name: "Après-vie", id: "apres_vie", type: "textarea", note: "Ce qui arrive vraiment à la mort (vérité auteur)" },
              { name: "Nature des dieux", id: "nature_des_dieux", type: "textarea-sm", note: "Sont-ils réels ? Que peuvent-ils ?" },
              { name: "Libre arbitre vs Destin", id: "libre_arbitre_vs_destin", type: "textarea-sm" },
              { name: "Lois physiques universelles", id: "lois_physiques_universelles", type: "textarea", note: "Ce qui ne peut pas être violé même par la magie" },
              { name: "Source de la magie", id: "source_de_la_magie", type: "relation-multi", target: "Magie & Pouvoirs" },
            ]
          },
          {
            label: "Eschatologie",
            fields: [
              { name: "Le monde peut-il finir ?", id: "le_monde_peut_il_finir", type: "textarea-sm" },
              { name: "Prophéties de fin du monde", id: "propheties_de_fin_du_monde", type: "relation-multi", target: "Mythes & Légendes" },
              { name: "Menaces cosmiques", id: "menaces_cosmiques", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Vérités cosmiques révélées dans l'histoire", id: "verites_cosmiques_revelees_dans_l_histoire", type: "textarea-sm" },
            { name: "Mystères jamais résolus (intentionnel)", id: "mysteres_jamais_resolus_intentionnel", type: "textarea-sm" },
          ]}
        ]
      },
      "Glossaire & Terminologie": {
        icon: "📋",
        color: "#0d0820",
        tabs: [
          {
            label: "Entrée",
            fields: [
              { name: "Terme", id: "terme", type: "text", required: true },
              { name: "Prononciation", id: "prononciation", type: "text", note: "Phonétique ou indication" },
              { name: "Langue d'origine", id: "langue_d_origine", type: "relation", target: "Linguistique & Grammaire" },
              { name: "Type", id: "type", type: "select", options: ["Nom commun", "Nom propre", "Titre", "Concept", "Abréviation", "Insulte / Argot", "Terme technique", "Terme magique", "Autre"] },
              { name: "Définition", id: "definition", type: "textarea", required: true },
              { name: "Étymologie", id: "etymologie", type: "textarea-sm" },
              { name: "Synonymes / Variantes", id: "synonymes_variantes", type: "tags" },
              { name: "Antonymes", id: "antonymes", type: "tags" },
            ]
          },
          {
            label: "Usage",
            fields: [
              { name: "Contexte d'utilisation", id: "contexte_d_utilisation", type: "textarea-sm", note: "Qui le dit, dans quelles circonstances" },
              { name: "Registre", id: "registre", type: "select", options: ["Formel", "Courant", "Familier", "Argotique", "Sacré", "Vulgaire", "Technique"] },
              { name: "Peuples qui l'utilisent", id: "peuples_qui_l_utilisent", type: "relation-multi", target: "Peuples & Ethnies" },
              { name: "Exemples de phrases", id: "exemples_de_phrases", type: "textarea-sm" },
            ]
          },
          { label: "Narratif", fields: [
            { name: "Première occurrence dans le roman", id: "premiere_occurrence_dans_le_roman", type: "relation", target: "Scène" },
            { name: "Fréquence d'utilisation prévue", id: "frequence_d_utilisation_prevue", type: "select", options: ["Rare (couleur locale)", "Occasionnel", "Fréquent"] },
            { name: "Note de l'auteur", id: "note_de_l_auteur", type: "textarea-sm" },
          ]}
        ]
      },
    }
  }
};


if (typeof window !== 'undefined') {
    window.ATLAS_COMMON_FIELDS = COMMON_FIELDS;
    window.ATLAS_SCHEMA = SCHEMA;
}
