# Procédure : Création et Gestion des Product Tours Permanents

Cette procédure explique comment créer des visites guidées (product-tours) et les intégrer de façon permanente dans l'application Plume, afin qu'elles soient disponibles pour tous les utilisateurs sans dépendre de la base de données.

## 1. Accéder à l'Éditeur de Tour
L'éditeur est masqué par défaut. Pour l'activer, vous devez ajouter un paramètre spécial à l'URL de votre application :

1. Ouvrez Plume dans votre navigateur.
2. Modifiez l'URL pour ajouter `?editTour=true`.
   - Exemple : `http://localhost:3000/index.html?editTour=true`
3. Utilisez le raccourci **Ctrl + Alt + T** pour faire apparaître la barre latérale de gestion des étapes.

## 2. Créer ou Modifier les Étapes
Dans la barre latérale :
1. Cliquez sur **"+ Ajouter"**.
2. Survolez l'interface de Plume : un cadre orange indique l'élément sélectionné.
3. Cliquez sur l'élément souhaité. 
4. Remplissez les informations dans le modal :
   - **Titre & Description** : Le contenu de la bulle d'aide.
   - **Image** : Vous pouvez spécifier une URL ou un chemin local.
   - **Position & Alignement** : Où la bulle doit s'afficher par rapport à l'élément.
   - **Actions (Optionnel)** : Vous pouvez forcer un clic `#id` avant ou après l'étape (ex: ouvrir une sidebar avant de montrer un bouton à l'intérieur).
5. Cliquez sur **"Enregistrer l'étape"**.

## 3. Exporter le Tour vers l'Application
Une fois votre tour terminé et testé (via le bouton "œil" pour prévisualiser) :

1. Cliquez sur le bouton **"Exporter JSON pour .data.js"** en bas de la barre latérale.
2. Un message confirmera que le JSON a été copié dans votre presse-papier.

## 4. Rendre le Tour Permanent
C'est l'étape cruciale pour que tous les utilisateurs en profitent :

1. Ouvrez le fichier suivant dans votre éditeur de code :
   `js/product-tour/product-tour.data.js`
2. Repérez la section correspondant à votre vue (ex: `editor`, `characters`, etc.).
3. Collez le JSON exporté à l'intérieur des crochets `[]`.

Exemple de structure finale attendue dans `product-tour.data.js` :
```javascript
const ProductTourData = {
    tours: {
        "editor": [
            {
                "element": "#headerProjectTitle",
                "popover": {
                    "title": "Bienvenue",
                    "description": "Ceci est votre projet Plume."
                }
            },
            // ... reste de votre export
        ],
        "characters": []
    }
};
```

## 5. Comment ça fonctionne (Priorités)
L'application charge les tours selon cet ordre de priorité :
1. **Fichier Statique** : Si un tour est défini dans `product-tour.data.js`, il est chargé en priorité pour TOUS les utilisateurs.
2. **Base de Données Locale** : Si vous enregistrez un tour via le bouton "Sauvegarder (Temp DB)", il est stocké uniquement dans votre navigateur pour vos tests.
3. **Défauts** : Si rien n'est trouvé, l'application utilise les tours génériques définis dans le code.

---
*Note : Pour désactiver le mode édition, retirez simplement `?editTour=true` de votre URL.*
