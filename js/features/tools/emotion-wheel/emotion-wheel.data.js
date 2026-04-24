/**
 * [Emotion Wheel Data]
 * Structure purement structurelle — AUCUN TEXTE HARDCODÉ.
 *
 * Toutes les chaînes visibles (labels, mots, signaux) vivent EXCLUSIVEMENT
 * dans les fichiers de locale : fr.js, en.js, es.js, de.js
 *
 * Convention des clés i18n :
 *   emotion.lexicon.<id>.label       -> Label de la catégorie  (ex: "JOIE")
 *   emotion.lexicon.<id>.words       -> JSON array stringifié  (ex: '["HEUREUX",...]')
 *   emotion.body.<index>.category    -> Nom de la catégorie    (ex: "Anticipation")
 *   emotion.body.<index>.signals     -> JSON array stringifié  (ex: '["se frotter les mains",...]')
 */

const EmotionWheelData = {

    /**
     * Retourne les données résolues dans la langue courante.
     * Toutes les chaînes sont récupérées via Localization.t().
     */
    getData() {
        const t = (key) => (typeof Localization !== 'undefined') ? Localization.t(key) : key;

        const wedges = this.wedgeDefs.map(w => ({
            id:    w.id,
            color: w.color,
            label: t(`emotion.lexicon.${w.id}.label`),
            words: this._parseList(t(`emotion.lexicon.${w.id}.words`)),
            groups: this._parseList(t(`emotion.lexicon.${w.id}.groups`))
        }));

        const bodyLanguage = this.bodyDefs.map((b, i) => ({
            icon:     b.icon,
            category: t(`emotion.body.${i}.category`),
            signals:  this._parseList(t(`emotion.body.${i}.signals`))
        }));

        return { wedges, bodyLanguage };
    },

    /** Parse une valeur JSON stringifiée en tableau. Robuste aux erreurs. */
    _parseList(str) {
        if (Array.isArray(str)) return str;
        try { return JSON.parse(str); } catch (e) { return [str]; }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Définitions structurelles — UNIQUEMENT des constantes visuelles.
    // Pas un seul mot visible ici. Tout le texte est dans les locales.
    // ─────────────────────────────────────────────────────────────────────

    /** Lexique : id + couleur par catégorie d'émotion. */
    wedgeDefs: [
        { id: 'joy',      color: '#78b159' },
        { id: 'sadness',  color: '#d4e157' },
        { id: 'disgust',  color: '#f9a825' },
        { id: 'anger',    color: '#e53935' },
        { id: 'fear',     color: '#5e35b1' },
        { id: 'surprise', color: '#1e88e5' }
    ],

    /**
     * Langage corporel : icône Lucide par catégorie.
     * L'index N correspond aux clés emotion.body.N.* dans les fichiers de locale.
     */
    bodyDefs: [
        { icon: 'hourglass'      }, // 0
        { icon: 'sparkles'       }, // 1
        { icon: 'laugh'          }, // 2
        { icon: 'flame'          }, // 3
        { icon: 'angry'          }, // 4
        { icon: 'alert-circle'   }, // 5
        { icon: 'target'         }, // 6
        { icon: 'coffee'         }, // 7
        { icon: 'shield-check'   }, // 8
        { icon: 'help-circle'    }, // 9
        { icon: 'thumbs-down'    }, // 10
        { icon: 'mask'           }, // 11
        { icon: 'eye-off'        }, // 12
        { icon: 'shield'         }, // 13
        { icon: 'heart'          }, // 14
        { icon: 'search'         }, // 15
        { icon: 'frown'          }, // 16
        { icon: 'thumbs-down'    }, // 17
        { icon: 'alert-triangle' }, // 18
        { icon: 'user-x'         }, // 19
        { icon: 'battery-low'    }, // 20
        { icon: 'droplets'       }, // 21
        { icon: 'sun'            }, // 22
        { icon: 'check-circle'   }, // 23
        { icon: 'watch'          }, // 24
        { icon: 'eye'            }, // 25
        { icon: 'layers'         }, // 26
        { icon: 'zap'            }, // 27
        { icon: 'ghost'          }, // 28
        { icon: 'smile'          }, // 29
        { icon: 'lock'           }, // 30
        { icon: 'crown'          }, // 31
        { icon: 'stop-circle'    }, // 32
        { icon: 'cloud-rain'     }, // 33
        { icon: 'key'            }, // 34
        { icon: 'frown'          }, // 35
        { icon: 'zap'            }, // 36
        { icon: 'user'           }, // 37
        { icon: 'award'          }, // 38
        { icon: 'search'         }, // 39
        { icon: 'brain'          }, // 40
        { icon: 'trophy'         }  // 41
    ]
};
