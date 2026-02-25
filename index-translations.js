// translations.js - Système de traduction pour Plume Landing Page

const translations = {
    fr: {
        meta: {
            title: "Plume - L'atelier d'écriture qui respecte votre vie privée",
            description: "Plume - L'atelier d'écriture qui respecte votre vie privée. Gratuit, sans compte, vos données restent chez vous."
        },
        nav: {
            features: "Fonctionnalités",
            testimonials: "Témoignages",
            documentation: "Documentation",
            faq: "FAQ",
            supportKofi: "Soutenir sur Ko-fi",
            openApp: "Ouvrir l'App"
        },
        hero: {
            trustBadge: {
                free: "100% Gratuit",
                noAccount: "Sans compte",
                dataStays: "Vos données restent chez vous"
            },
            title: "Écrivez sans compromis.",
            titleHighlight: "vous appartiennent",
            titleEnd: "Vos histoires",
            subtitle: "L'atelier d'écriture qui respecte votre vie privée. Puissant comme Scrivener, simple comme Google Docs, et totalement gratuit.",
            ctaPrimary: "Commencer à écrire — Aucune installation",
            ctaSecondary: "Voir l'interface ↓",
            socialProof: {
                localData: "Données 100% locales",
                offline: "Fonctionne hors-ligne",
                openSource: "Open Source"
            },
            stats: {
                free: "Gratuit pour toujours",
                servers: "Serveur qui stocke vos données",
                tools: "Outils pour auteurs"
            }
        },
        preview: {
            title: "Insérez ici un GIF ou une capture d'écran de l'interface",
            description: "Montrez l'éditeur principal, le tableau de liège, ou une transition entre outils. Un simple screencast de 10 secondes transformera cette section.",
            tip: "Utilisez ScreenToGif (gratuit) pour créer un GIF en 30 minutes"
        },
        values: {
            title: "Pourquoi Plume est différent",
            subtitle: "Les trois piliers qui font de Plume l'outil idéal pour votre écriture",
            privacy: {
                title: "Vos données vous appartiennent",
                description: "Pas de cloud obligatoire, pas de serveur, pas de compte. Tout est stocké dans votre navigateur. Vous pouvez sauvegarder sur Google Drive si vous le souhaitez, mais ce n'est jamais imposé."
            },
            instant: {
                title: "Instantané et hors-ligne",
                description: "Aucune installation, aucun téléchargement. Ouvrez votre navigateur et écrivez. Fonctionne parfaitement sans connexion internet. (Si vous téléchargez la version offline !)"
            },
            focused: {
                title: "Tout ce qu'il faut, rien de superflu",
                description: "Des outils pensés pour l'écriture narrative : structure, personnages, chronologie, tension dramatique. Pas de gadgets inutiles, juste ce qui sert vraiment votre créativité."
            }
        },
        usage: {
            title: "Deux façons d'utiliser Plume",
            subtitle: "Choisissez le mode qui vous convient le mieux",
            online: {
                title: "En ligne (Recommandé)",
                badge: "Recommandé",
                feature1: "Aucune installation nécessaire",
                feature2: "Synchronisation automatique avec Google Drive",
                feature3: "Mises à jour automatiques",
                feature4: "Accessible depuis n'importe quel appareil",
                cta: "Utiliser en ligne"
            },
            offline: {
                title: "Téléchargement local",
                badge: "100% Hors-ligne",
                feature1: "Fonctionne sans connexion internet",
                feature2: "Contrôle total de vos données",
                feature3: "Sauvegarde manuelle à faire vers l'emplacement de votre choix",
                feature4: "Aucune dépendance externe",
                cta: "Télécharger la dernière version sur votre ordinateur"
            },
            note: "Dans les deux cas, vos données sont stockées localement dans votre navigateur. Le mode en ligne offre simplement la synchronisation automatique avec Google Drive pour accéder à vos projets depuis plusieurs appareils."
        },
        features: {
            title: "Les outils qui font la différence",
            subtitle: "Commencez simple, explorez quand vous êtes prêt",
            tabs: {
                essentials: "Essentiels",
                creation: "Création",
                analysis: "Analyse"
            },
            essentials: {
                editor: { name: "Éditeur par Scènes", desc: "Organisez votre récit en actes, chapitres et scènes. Réorganisez d'un glisser-déposer." },
                corkboard: { name: "Tableau de Liège", desc: "Visualisez votre structure sous forme de cartes. Idéal pour planifier et restructurer." },
                characters: { name: "Personnages", desc: "Fiches complètes avec psychologie, relations et arcs de transformation." },
                universe: { name: "Univers", desc: "Worldbuilding complet : lieux, cultures, objets, religions. Gardez la cohérence." },
                notes: { name: "Notes Rapides", desc: "Capturez vos idées avant qu'elles ne s'évaporent. Un bloc-notes toujours accessible." },
                stats: { name: "Statistiques", desc: "Suivez votre progression, vos objectifs de mots et votre temps d'écriture." }
            },
            creation: {
                arcs: { name: "Arcs Narratifs", desc: "Suivez l'évolution de vos thèmes et sous-intrigues sur toute l'œuvre." },
                relations: { name: "Graphe de Relations", desc: "Visualisez les liens sociaux entre personnages en temps réel." },
                timeline: { name: "Timeline", desc: "Chronologie multi-arcs pour éviter les anachronismes et incohérences temporelles." },
                plotgrid: { name: "PlotGrid", desc: "Gérez visuellement les points clés de votre narration scène par scène." },
                map: { name: "Carte du Monde", desc: "Cartographiez vos lieux pour ne jamais perdre le fil géographique." },
                investigation: { name: "Enquête", desc: "Tableau d'investigation spécial pour thrillers et romans policiers." }
            },
            analysis: {
                tension: { name: "Analyse de Tension", desc: "Visualisez automatiquement la courbe de tension de vos scènes." },
                text: { name: "Analyse de Texte", desc: "Détectez les répétitions et améliorez la lisibilité de votre prose." },
                mindmap: { name: "Mindmap", desc: "Explorez visuellement les idées et les concepts complexes." },
                codex: { name: "Codex", desc: "Votre encyclopédie personnelle pour garder une cohérence absolue." },
                pomodoro: { name: "Pomodoro", desc: "Timer intégré pour des sessions d'écriture hyper-productives." },
                snapshots: { name: "Snapshots", desc: "Sauvegardez des versions de vos scènes pour comparer les révisions." }
            }
        },
        testimonials: {
            title: "Ce que disent les auteurs",
            subtitle: "Rejoignez une communauté d'écrivains qui ont repris le contrôle de leurs textes",
            marie: {
                quote: "Enfin un outil qui ne m'oblige pas à créer un compte et à confier mes manuscrits à un serveur quelque part. La tranquillité d'esprit de savoir que mes textes sont uniquement chez moi n'a pas de prix.",
                name: "Marie L.",
                role: "Autrice de fantasy · <em>La Saga des Brumes</em>"
            },
            thomas: {
                quote: "J'ai migré depuis Scrivener et je ne regrette rien. L'interface est plus moderne, les outils de visualisation (timeline, graphe) sont géniaux, et c'est totalement gratuit. Le rêve.",
                name: "Thomas R.",
                role: "Romancier policier · Ex-utilisateur Scrivener"
            },
            sophie: {
                quote: "L'analyse de tension m'a fait comprendre pourquoi certains chapitres étaient plats. Voir la courbe m'a permis de restructurer tout mon acte 2. Un game-changer.",
                name: "Sophie D.",
                role: "Écrivaine SF · Roman en cours : <em>87 000 mots</em>"
            }
        },
        cta: {
            title: "Prêt à reprendre le contrôle de votre écriture ?",
            subtitle: "Aucune installation, aucun compte, aucune carte bancaire. Juste vous et vos histoires.",
            button: "Commencer gratuitement maintenant →",
            guarantee: "Vos données ne quittent jamais votre appareil"
        },
        footer: {
            created: "Créé pour les auteurs, par un passionné. © 2026 Plume Locale.",
            privacy: "Vos données restent chez vous"
        },
        carousel: {
            slide1: {
                title: "L'Éditeur Distraction-Free",
                desc: "Une interface épurée pour vous concentrer uniquement sur votre texte."
            },
            slide2: {
                title: "Le Tableau de Liège",
                desc: "Organisez vos scènes et chapitres visuellement par glisser-déposer."
            },
            slide3: {
                title: "Outils d'Analyse",
                desc: "Statistiques sur l'avancement de votre récit"
            },
            slide4: {
                title: "Outils d'Analyse",
                desc: "Visualisez la tension dramatique et la structure de votre récit."
            }
        },
        faq: {
            title: "Questions fréquentes",
            subtitle: "Tout ce que vous voulez savoir avant de commencer",
            q1: "Est-ce vraiment 100% gratuit ? Il y aura des frais cachés ?",
            a1: "Oui, totalement gratuit. Plume est un projet open source sous licence GNU GPL 3.0. Il n'y a pas de version payante, pas de \"premium\", pas de publicités, et pas de collecte de données. Le code source est public sur GitHub. Si vous voulez soutenir le créateur de l'application vous le pouvez sur <a href='https://ko-fi.com/plume_locale' target='_blank'>ko-fi.com/plume_locale</a>",
            q2: "Où sont stockées mes données ? Quelqu'un peut-il y accéder ?",
            a2: "Vos textes sont stockés uniquement dans votre navigateur (localStorage/IndexedDB), sur votre appareil. Aucun serveur ne reçoit vos données. Si vous activez la synchronisation Google Drive, c'est vous qui autorisez l'accès à votre propre Drive — Plume ne voit rien.",
            q3: "Que se passe-t-il si je ferme l'onglet ou redémarre mon ordinateur ?",
            a3: "Rien ne se perd. Plume sauvegarde automatiquement chaque modification dans votre navigateur. Vos projets seront là à la prochaine ouverture. Vous pouvez aussi exporter manuellement en JSON, DOCX ou TXT à tout moment. Par contre <strong>si vous videz le cache de votre navigateur et que vous n'avez pas fait de sauvegarde, vous perdrez tout votre travail !</strong>",
            q4: "Fonctionne-t-il sur mobile ?",
            a4: "L'interface est optimisée pour ordinateur, car l'écriture narrative bénéficie d'un grand écran. L'application reste utilisable sur tablette. L'adaptation mobile complète n'est pas 100% finalisée.",
            q5: "Puis-je importer mes projets Scrivener ou Word ?",
            a5: "Oui. Plume supporte l'import de fichiers DOCX (Word) et de fichiers texte. Un import natif Scrivener (.scriv) est aussi possible."
        }
    },

    en: {
        meta: {
            title: "Plume - The writing workshop that respects your privacy",
            description: "Plume - The writing workshop that respects your privacy. Free, no account, your data stays with you."
        },
        nav: {
            features: "Features",
            testimonials: "Testimonials",
            documentation: "Documentation",
            faq: "FAQ",
            supportKofi: "Support on Ko-fi",
            openApp: "Open App"
        },
        hero: {
            trustBadge: {
                free: "100% Free",
                noAccount: "No account",
                dataStays: "Your data stays with you"
            },
            title: "Write without compromise.",
            titleHighlight: "belong to you",
            titleEnd: "Your stories",
            subtitle: "The writing workshop that respects your privacy. Powerful like Scrivener, simple like Google Docs, and completely free.",
            ctaPrimary: "Start writing — No installation",
            ctaSecondary: "See the interface ↓",
            socialProof: {
                localData: "100% local data",
                offline: "Works offline",
                openSource: "Open Source"
            },
            stats: {
                free: "Always free",
                servers: "Server storing your data",
                tools: "Tools for authors"
            }
        },
        preview: {
            title: "Insert a GIF or screenshot of the interface here",
            description: "Show the main editor, corkboard, or a transition between tools. A simple 10-second screencast will transform this section.",
            tip: "Use ScreenToGif (free) to create a GIF in 30 minutes"
        },
        values: {
            title: "Why Plume is different",
            subtitle: "The three pillars that make Plume the ideal tool for your writing",
            privacy: {
                title: "Your data belongs to you",
                description: "No mandatory cloud, no server, no account. Everything is stored in your browser. You can save to Google Drive if you want, but it's never required."
            },
            instant: {
                title: "Instant and offline",
                description: "No installation, no download. Open your browser and write. Works perfectly without internet connection. Your texts sync automatically."
            },
            focused: {
                title: "Everything you need, nothing superfluous",
                description: "Tools designed for narrative writing: structure, characters, timeline, dramatic tension. No useless gadgets, just what truly serves your creativity."
            }
        },
        usage: {
            title: "Two ways to use Plume",
            subtitle: "Choose the mode that suits you best",
            online: {
                title: "Online (Recommended)",
                badge: "Recommended",
                feature1: "No installation required",
                feature2: "Automatic sync with Google Drive",
                feature3: "Automatic updates",
                feature4: "Accessible from any device",
                cta: "Use online"
            },
            offline: {
                title: "Local download",
                badge: "100% Offline",
                feature1: "Works without internet connection",
                feature2: "Full control over your data",
                feature3: "Manual backup to the cloud of your choice",
                feature4: "No external dependencies",
                cta: "Download directly the last version on you computer"
            },
            note: "In both cases, your data is stored locally in your browser. The online mode simply offers automatic synchronization with Google Drive to access your projects from multiple devices."
        },
        features: {
            title: "The tools that make the difference",
            subtitle: "Start simple, explore when you're ready",
            tabs: {
                essentials: "Essentials",
                creation: "Creation",
                analysis: "Analysis"
            },
            essentials: {
                editor: { name: "Scene Editor", desc: "Organize your story into acts, chapters, and scenes. Reorganize with drag-and-drop." },
                corkboard: { name: "Corkboard", desc: "Visualize your structure as cards. Ideal for planning and restructuring." },
                characters: { name: "Characters", desc: "Complete profiles with psychology, relationships, and transformation arcs." },
                universe: { name: "Universe", desc: "Complete worldbuilding: locations, cultures, objects, religions. Maintain consistency." },
                notes: { name: "Quick Notes", desc: "Capture your ideas before they evaporate. An always-accessible notepad." },
                stats: { name: "Statistics", desc: "Track your progress, word goals, and writing time." }
            },
            creation: {
                arcs: { name: "Narrative Arcs", desc: "Track the evolution of your themes and subplots throughout the work." },
                relations: { name: "Relationship Graph", desc: "Visualize social connections between characters in real-time." },
                timeline: { name: "Timeline", desc: "Multi-arc chronology to avoid anachronisms and temporal inconsistencies." },
                plotgrid: { name: "PlotGrid", desc: "Visually manage key narrative points scene by scene." },
                map: { name: "World Map", desc: "Map your locations to never lose the geographical thread." },
                investigation: { name: "Investigation", desc: "Special investigation board for thrillers and detective novels." }
            },
            analysis: {
                tension: { name: "Tension Analysis", desc: "Automatically visualize the tension curve of your scenes." },
                text: { name: "Text Analysis", desc: "Detect repetitions and improve the readability of your prose." },
                mindmap: { name: "Mindmap", desc: "Visually explore ideas and complex concepts." },
                codex: { name: "Codex", desc: "Your personal encyclopedia to maintain absolute consistency." },
                pomodoro: { name: "Pomodoro", desc: "Integrated timer for hyper-productive writing sessions." },
                snapshots: { name: "Snapshots", desc: "Save versions of your scenes to compare revisions." }
            }
        },
        testimonials: {
            title: "What authors say",
            subtitle: "Join a community of writers who have taken back control of their texts",
            marie: {
                quote: "Finally a tool that doesn't force me to create an account and entrust my manuscripts to a server somewhere. The peace of mind knowing my texts are only at home is priceless.",
                name: "Marie L.",
                role: "Fantasy author"
            },
            thomas: {
                quote: "I migrated from Scrivener and don't regret it. The interface is more modern, the visualization tools (timeline, graph) are great, and it's completely free. The dream.",
                name: "Thomas R.",
                role: "Crime novelist"
            },
            sophie: {
                quote: "The tension analysis helped me understand why certain chapters were flat. Seeing the curve allowed me to restructure my entire act 2. A game-changer.",
                name: "Sophie D.",
                role: "SF writer"
            }
        },
        cta: {
            title: "Ready to take back control of your writing?",
            subtitle: "No installation, no account, no credit card. Just you and your stories.",
            button: "Start for free now →",
            guarantee: "Your data never leaves your device"
        },
        footer: {
            created: "Created for authors, by enthusiasts. © 2026 Plume Locale.",
            privacy: "Your data stays with you"
        },
        carousel: {
            slide1: {
                title: "Distraction-Free Editor",
                desc: "A clean interface to focus solely on your text."
            },
            slide2: {
                title: "The Corkboard",
                desc: "Organize your scenes and chapters visually with drag-and-drop."
            },
            slide3: {
                title: "Analysis Tools",
                desc: "Progress statistics for your story"
            },
            slide4: {
                title: "Analysis Tools",
                desc: "Visualize dramatic tension and story structure."
            }
        },
        faq: {
            title: "Frequently Asked Questions",
            subtitle: "Everything you need to know before getting started",
            q1: "Is it really 100% free? Are there hidden costs?",
            a1: "Yes, totally free. Plume is an open source project under GNU GPL 3.0 license. There is no paid version, no 'premium', no ads, and no data collection. The source code is public on GitHub.",
            q2: "Where is my data stored? Can anyone access it?",
            a2: "Your texts are stored only in your browser (localStorage/IndexedDB), on your device. No server receives your data. If you enable Google Drive sync, you authorize access to your own Drive — Plume sees nothing.",
            q3: "What happens if I close the tab or restart my computer?",
            a3: "Nothing is lost. Plume automatically saves every change in your browser. Your projects will be there next time you open it. You can also manually export to JSON, DOCX or TXT at any time.",
            q4: "Does it work on mobile?",
            a4: "The interface is optimized for desktop, as narrative writing benefits from a large screen. The application remains usable on tablets. Full mobile adaptation is under development.",
            q5: "Can I import my Scrivener or Word projects?",
            a5: "Yes. Plume supports importing DOCX (Word) and text files. Native Scrivener import (.scriv) is under development. In the meantime, copy-pasting from Scrivener works perfectly."
        }
    },

    de: {
        meta: {
            title: "Plume - Die Schreibwerkstatt, die Ihre Privatsphäre respektiert",
            description: "Plume - Die Schreibwerkstatt, die Ihre Privatsphäre respektiert. Kostenlos, kein Konto, Ihre Daten bleiben bei Ihnen."
        },
        nav: {
            features: "Funktionen",
            testimonials: "Erfahrungsberichte",
            documentation: "Dokumentation",
            faq: "FAQ",
            supportKofi: "Auf Ko-fi unterstützen",
            openApp: "App öffnen"
        },
        hero: {
            trustBadge: {
                free: "100% Kostenlos",
                noAccount: "Kein Konto",
                dataStays: "Ihre Daten bleiben bei Ihnen"
            },
            title: "Schreiben Sie ohne Kompromisse.",
            titleHighlight: "gehören Ihnen",
            titleEnd: "Ihre Geschichten",
            subtitle: "Die Schreibwerkstatt, die Ihre Privatsphäre respektiert. Leistungsstark wie Scrivener, einfach wie Google Docs und völlig kostenlos.",
            ctaPrimary: "Jetzt schreiben — Keine Installation",
            ctaSecondary: "Interface ansehen ↓",
            socialProof: {
                localData: "100% lokale Daten",
                offline: "Funktioniert offline",
                openSource: "Open Source"
            },
            stats: {
                free: "Immer kostenlos",
                servers: "Server, der Ihre Daten speichert",
                tools: "Werkzeuge für Autoren"
            }
        },
        preview: {
            title: "Fügen Sie hier ein GIF oder einen Screenshot der Oberfläche ein",
            description: "Zeigen Sie den Haupteditor, das Pinnboard oder einen Übergang zwischen Tools. Ein einfacher 10-Sekunden-Screencast wird diesen Bereich transformieren.",
            tip: "Verwenden Sie ScreenToGif (kostenlos), um in 30 Minuten ein GIF zu erstellen"
        },
        values: {
            title: "Warum Plume anders ist",
            subtitle: "Die drei Säulen, die Plume zum idealen Werkzeug für Ihr Schreiben machen",
            privacy: {
                title: "Ihre Daten gehören Ihnen",
                description: "Keine obligatorische Cloud, kein Server, kein Konto. Alles wird in Ihrem Browser gespeichert. Sie können auf Google Drive speichern, wenn Sie möchten, aber es ist nie erforderlich."
            },
            instant: {
                title: "Sofort und offline",
                description: "Keine Installation, kein Download. Öffnen Sie Ihren Browser und schreiben Sie. Funktioniert perfekt ohne Internetverbindung. Ihre Texte synchronisieren sich automatisch."
            },
            focused: {
                title: "Alles, was Sie brauchen, nichts Überflüssiges",
                description: "Werkzeuge für narratives Schreiben: Struktur, Charaktere, Zeitleiste, dramatische Spannung. Keine nutzlosen Gadgets, nur was Ihrer Kreativität wirklich dient."
            }
        },
        usage: {
            title: "Zwei Möglichkeiten, Plume zu nutzen",
            subtitle: "Wählen Sie den Modus, der am besten zu Ihnen passt",
            online: {
                title: "Online (Empfohlen)",
                badge: "Empfohlen",
                feature1: "Keine Installation erforderlich",
                feature2: "Automatische Synchronisation mit Google Drive",
                feature3: "Automatische Updates",
                feature4: "Von jedem Gerät aus zugänglich",
                cta: "Online nutzen"
            },
            offline: {
                title: "Lokaler Download",
                badge: "100% Offline",
                feature1: "Funktioniert ohne Internetverbindung",
                feature2: "Volle Kontrolle über Ihre Daten",
                feature3: "Manuelle Sicherung in die Cloud Ihrer Wahl",
                feature4: "Keine externen Abhängigkeiten",
                cta: "Laden Sie die neueste Version auf Ihren Computer herunter."
            },
            note: "In beiden Fällen werden Ihre Daten lokal in Ihrem Browser gespeichert. Der Online-Modus bietet einfach die automatische Synchronisation mit Google Drive, um von mehreren Geräten auf Ihre Projekte zuzugreifen."
        },
        features: {
            title: "Die Werkzeuge, die den Unterschied machen",
            subtitle: "Beginnen Sie einfach, erkunden Sie, wenn Sie bereit sind",
            tabs: {
                essentials: "Grundlagen",
                creation: "Erstellung",
                analysis: "Analyse"
            },
            essentials: {
                editor: { name: "Szenen-Editor", desc: "Organisieren Sie Ihre Geschichte in Akten, Kapiteln und Szenen. Neuordnen per Drag-and-Drop." },
                corkboard: { name: "Pinnwand", desc: "Visualisieren Sie Ihre Struktur als Karten. Ideal zum Planen und Umstrukturieren." },
                characters: { name: "Charaktere", desc: "Vollständige Profile mit Psychologie, Beziehungen und Transformationsbögen." },
                universe: { name: "Universum", desc: "Vollständiges Worldbuilding: Orte, Kulturen, Objekte, Religionen. Konsistenz wahren." },
                notes: { name: "Schnellnotizen", desc: "Erfassen Sie Ihre Ideen, bevor sie verdunsten. Ein immer zugänglicher Notizblock." },
                stats: { name: "Statistiken", desc: "Verfolgen Sie Ihren Fortschritt, Wortziele und Schreibzeit." }
            },
            creation: {
                arcs: { name: "Narrative Bögen", desc: "Verfolgen Sie die Entwicklung Ihrer Themen und Nebenhandlungen durch das gesamte Werk." },
                relations: { name: "Beziehungsgraph", desc: "Visualisieren Sie soziale Verbindungen zwischen Charakteren in Echtzeit." },
                timeline: { name: "Zeitleiste", desc: "Multi-Bogen-Chronologie zur Vermeidung von Anachronismen und zeitlichen Inkonsistenzen." },
                plotgrid: { name: "PlotGrid", desc: "Verwalten Sie wichtige Handlungspunkte Szene für Szene visuell." },
                map: { name: "Weltkarte", desc: "Kartieren Sie Ihre Orte, um nie den geografischen Faden zu verlieren." },
                investigation: { name: "Ermittlung", desc: "Spezielle Ermittlungstafel für Thriller und Kriminalromane." }
            },
            analysis: {
                tension: { name: "Spannungsanalyse", desc: "Visualisieren Sie automatisch die Spannungskurve Ihrer Szenen." },
                text: { name: "Textanalyse", desc: "Erkennen Sie Wiederholungen und verbessern Sie die Lesbarkeit Ihrer Prosa." },
                mindmap: { name: "Mindmap", desc: "Erkunden Sie Ideen und komplexe Konzepte visuell." },
                codex: { name: "Kodex", desc: "Ihre persönliche Enzyklopädie zur Aufrechterhaltung absoluter Konsistenz." },
                pomodoro: { name: "Pomodoro", desc: "Integrierter Timer für hochproduktive Schreibsitzungen." },
                snapshots: { name: "Schnappschüsse", desc: "Speichern Sie Versionen Ihrer Szenen zum Vergleich von Überarbeitungen." }
            }
        },
        testimonials: {
            title: "Was Autoren sagen",
            subtitle: "Treten Sie einer Gemeinschaft von Schriftstellern bei, die die Kontrolle über ihre Texte zurückgewonnen haben",
            marie: {
                quote: "Endlich ein Tool, das mich nicht zwingt, ein Konto zu erstellen und meine Manuskripte einem Server irgendwo anzuvertrauen. Die Ruhe zu wissen, dass meine Texte nur zu Hause sind, ist unbezahlbar.",
                name: "Marie L.",
                role: "Fantasy-Autorin"
            },
            thomas: {
                quote: "Ich bin von Scrivener migriert und bereue es nicht. Die Oberfläche ist moderner, die Visualisierungstools (Timeline, Graph) sind großartig, und es ist völlig kostenlos. Der Traum.",
                name: "Thomas R.",
                role: "Kriminalautor"
            },
            sophie: {
                quote: "Die Spannungsanalyse half mir zu verstehen, warum bestimmte Kapitel flach waren. Die Kurve zu sehen, ermöglichte es mir, meinen gesamten Akt 2 umzustrukturieren. Ein Gamechanger.",
                name: "Sophie D.",
                role: "SF-Autorin"
            }
        },
        cta: {
            title: "Bereit, die Kontrolle über Ihr Schreiben zurückzugewinnen?",
            subtitle: "Keine Installation, kein Konto, keine Kreditkarte. Nur Sie und Ihre Geschichten.",
            button: "Jetzt kostenlos starten →",
            guarantee: "Ihre Daten verlassen nie Ihr Gerät"
        },
        footer: {
            created: "Erstellt für Autoren, von Enthusiasten. © 2026 Plume Locale.",
            privacy: "Ihre Daten bleiben bei Ihnen"
        },
        carousel: {
            slide1: {
                title: "Ablenkungsfreier Editor",
                desc: "Eine saubere Oberfläche, um sich ganz auf Ihren Text zu konzentrieren."
            },
            slide2: {
                title: "Die Pinnwand",
                desc: "Organisieren Sie Ihre Szenen und Kapitel visuell per Drag-and-Drop."
            },
            slide3: {
                title: "Analyse-Tools",
                desc: "Fortschrittsstatistiken für Ihre Geschichte"
            },
            slide4: {
                title: "Analyse-Tools",
                desc: "Visualisieren Sie dramatische Spannung und Erzählstruktur."
            }
        },
        faq: {
            title: "Häufig gestellte Fragen",
            subtitle: "Alles, was Sie wissen müssen, bevor Sie anfangen",
            q1: "Ist es wirklich 100% kostenlos? Gibt es versteckte Kosten?",
            a1: "Ja, absolut kostenlos. Plume ist ein Open-Source-Projekt unter der GNU GPL 3.0-Lizenz. Es gibt keine kostenpflichtige Version, kein 'Premium', keine Werbung und keine Datensammlung. Der Quellcode ist öffentlich auf GitHub.",
            q2: "Wo werden meine Daten gespeichert? Kann jemand darauf zugreifen?",
            a2: "Ihre Texte werden nur in Ihrem Browser (localStorage/IndexedDB) auf Ihrem Gerät gespeichert. Kein Server empfängt Ihre Daten. Wenn Sie die Google Drive-Synchronisierung aktivieren, autorisieren Sie den Zugriff auf Ihr eigenes Drive – Plume sieht nichts.",
            q3: "Was passiert, wenn ich den Tab schließe oder meinen Computer neu starte?",
            a3: "Nichts geht verloren. Plume speichert jede Änderung automatisch in Ihrem Browser. Ihre Projekte sind beim nächsten Öffnen wieder da. Sie können jederzeit manuell als JSON, DOCX oder TXT exportieren.",
            q4: "Funktioniert es auf dem Handy?",
            a4: "Die Oberfläche ist für Desktop optimiert, da narratives Schreiben von einem großen Bildschirm profitiert. Die Anwendung bleibt auf Tablets nutzbar. Eine vollständige mobile Anpassung ist in Entwicklung.",
            q5: "Kann ich meine Scrivener- oder Word-Projekte importieren?",
            a5: "Ja. Plume unterstützt den Import von DOCX- (Word) und Textdateien. Ein nativer Scrivener-Import (.scriv) ist in Entwicklung. In der Zwischenzeit funktioniert Copy-Paste aus Scrivener perfekt."
        }
    },

    es: {
        meta: {
            title: "Plume - El taller de escritura que respeta tu privacidad",
            description: "Plume - El taller de escritura que respeta tu privacidad. Gratis, sin cuenta, tus datos se quedan contigo."
        },
        nav: {
            features: "Funciones",
            testimonials: "Testimonios",
            documentation: "Documentación",
            faq: "FAQ",
            supportKofi: "Apoyar en Ko-fi",
            openApp: "Abrir App"
        },
        hero: {
            trustBadge: {
                free: "100% Gratis",
                noAccount: "Sin cuenta",
                dataStays: "Tus datos se quedan contigo"
            },
            title: "Escribe sin compromisos.",
            titleHighlight: "te pertenecen",
            titleEnd: "Tus historias",
            subtitle: "El taller de escritura que respeta tu privacidad. Potente como Scrivener, simple como Google Docs y totalmente gratuito.",
            ctaPrimary: "Empezar a escribir — Sin instalación",
            ctaSecondary: "Ver la interfaz ↓",
            socialProof: {
                localData: "Datos 100% locales",
                offline: "Funciona sin conexión",
                openSource: "Código abierto"
            },
            stats: {
                free: "Gratis para siempre",
                servers: "Servidor que almacena tus datos",
                tools: "Herramientas para autores"
            }
        },
        preview: {
            title: "Inserta aquí un GIF o captura de pantalla de la interfaz",
            description: "Muestra el editor principal, el tablero de corcho o una transición entre herramientas. Un simple screencast de 10 segundos transformará esta sección.",
            tip: "Usa ScreenToGif (gratis) para crear un GIF en 30 minutos"
        },
        values: {
            title: "Por qué Plume es diferente",
            subtitle: "Los tres pilares que hacen de Plume la herramienta ideal para tu escritura",
            privacy: {
                title: "Tus datos te pertenecen",
                description: "Sin nube obligatoria, sin servidor, sin cuenta. Todo se almacena en tu navegador. Puedes guardar en Google Drive si quieres, pero nunca es obligatorio."
            },
            instant: {
                title: "Instantáneo y sin conexión",
                description: "Sin instalación, sin descarga. Abre tu navegador y escribe. Funciona perfectamente sin conexión a internet. Tus textos se sincronizan automáticamente."
            },
            focused: {
                title: "Todo lo necesario, nada superfluo",
                description: "Herramientas diseñadas para escritura narrativa: estructura, personajes, cronología, tensión dramática. Sin gadgets inútiles, solo lo que realmente sirve a tu creatividad."
            }
        },
        usage: {
            title: "Dos formas de usar Plume",
            subtitle: "Elige el modo que mejor te convenga",
            online: {
                title: "En línea (Recomendado)",
                badge: "Recomendado",
                feature1: "No requiere instalación",
                feature2: "Sincronización automática con Google Drive",
                feature3: "Actualizaciones automáticas",
                feature4: "Accesible desde cualquier dispositivo",
                cta: "Usar en línea"
            },
            offline: {
                title: "Descarga local",
                badge: "100% Sin conexión",
                feature1: "Funciona sin conexión a internet",
                feature2: "Control total sobre tus datos",
                feature3: "Respaldo manual a la nube de tu elección",
                feature4: "Sin dependencias externas",
                cta: "Descargue la última versión a su computadora"
            },
            note: "En ambos casos, tus datos se almacenan localmente en tu navegador. El modo en línea simplemente ofrece sincronización automática con Google Drive para acceder a tus proyectos desde múltiples dispositivos."
        },
        features: {
            title: "Las herramientas que marcan la diferencia",
            subtitle: "Empieza simple, explora cuando estés listo",
            tabs: {
                essentials: "Esenciales",
                creation: "Creación",
                analysis: "Análisis"
            },
            essentials: {
                editor: { name: "Editor de Escenas", desc: "Organiza tu relato en actos, capítulos y escenas. Reorganiza arrastrando y soltando." },
                corkboard: { name: "Tablero de Corcho", desc: "Visualiza tu estructura como tarjetas. Ideal para planificar y reestructurar." },
                characters: { name: "Personajes", desc: "Fichas completas con psicología, relaciones y arcos de transformación." },
                universe: { name: "Universo", desc: "Worldbuilding completo: lugares, culturas, objetos, religiones. Mantén la coherencia." },
                notes: { name: "Notas Rápidas", desc: "Captura tus ideas antes de que se evaporen. Un bloc de notas siempre accesible." },
                stats: { name: "Estadísticas", desc: "Sigue tu progreso, objetivos de palabras y tiempo de escritura." }
            },
            creation: {
                arcs: { name: "Arcos Narrativos", desc: "Sigue la evolución de tus temas y subtramas a lo largo de la obra." },
                relations: { name: "Grafo de Relaciones", desc: "Visualiza las conexiones sociales entre personajes en tiempo real." },
                timeline: { name: "Línea de Tiempo", desc: "Cronología multi-arco para evitar anacronismos e inconsistencias temporales." },
                plotgrid: { name: "PlotGrid", desc: "Gestiona visualmente los puntos clave de tu narración escena por escena." },
                map: { name: "Mapa del Mundo", desc: "Cartografía tus lugares para nunca perder el hilo geográfico." },
                investigation: { name: "Investigación", desc: "Tablero de investigación especial para thrillers y novelas policiacas." }
            },
            analysis: {
                tension: { name: "Análisis de Tensión", desc: "Visualiza automáticamente la curva de tensión de tus escenas." },
                text: { name: "Análisis de Texto", desc: "Detecta repeticiones y mejora la legibilidad de tu prosa." },
                mindmap: { name: "Mapa Mental", desc: "Explora visualmente ideas y conceptos complejos." },
                codex: { name: "Códice", desc: "Tu enciclopedia personal para mantener una coherencia absoluta." },
                pomodoro: { name: "Pomodoro", desc: "Temporizador integrado para sesiones de escritura hiperproductivas." },
                snapshots: { name: "Instantáneas", desc: "Guarda versiones de tus escenas para comparar revisiones." }
            }
        },
        testimonials: {
            title: "Lo que dicen los autores",
            subtitle: "Únete a una comunidad de escritores que han recuperado el control de sus textos",
            marie: {
                quote: "Por fin una herramienta que no me obliga a crear una cuenta y confiar mis manuscritos a un servidor en algún lugar. La tranquilidad de saber que mis textos están solo en casa no tiene precio.",
                name: "Marie L.",
                role: "Autora de fantasía"
            },
            thomas: {
                quote: "Migré desde Scrivener y no me arrepiento. La interfaz es más moderna, las herramientas de visualización (línea de tiempo, grafo) son geniales, y es totalmente gratis. El sueño.",
                name: "Thomas R.",
                role: "Novelista de crimen"
            },
            sophie: {
                quote: "El análisis de tensión me ayudó a entender por qué ciertos capítulos eran planos. Ver la curva me permitió reestructurar todo mi acto 2. Un cambio de juego.",
                name: "Sophie D.",
                role: "Escritora de CF"
            }
        },
        cta: {
            title: "¿Listo para recuperar el control de tu escritura?",
            subtitle: "Sin instalación, sin cuenta, sin tarjeta de crédito. Solo tú y tus historias.",
            button: "Comenzar gratis ahora →",
            guarantee: "Tus datos nunca salen de tu dispositivo"
        },
        footer: {
            created: "Creado para autores, por entusiastas. © 2026 Plume Locale.",
            privacy: "Tus datos se quedan contigo"
        },
        carousel: {
            slide1: {
                title: "Editor Sin Distracciones",
                desc: "Una interfaz limpia para concentrarte únicamente en tu texto."
            },
            slide2: {
                title: "El Tablero de Corcho",
                desc: "Organiza tus escenas y capítulos visualmente arrastrando y soltando."
            },
            slide3: {
                title: "Herramientas de Análisis",
                desc: "Estadísticas de progreso de tu historia"
            },
            slide4: {
                title: "Herramientas de Análisis",
                desc: "Visualiza la tensión dramática y la estructura de tu historia."
            }
        },
        faq: {
            title: "Preguntas Frecuentes",
            subtitle: "Todo lo que necesitas saber antes de empezar",
            q1: "¿Es realmente 100% gratis? ¿Habrá costos ocultos?",
            a1: "Sí, totalmente gratis. Plume es un proyecto de código abierto bajo licencia GNU GPL 3.0. No hay versión de pago, ni 'premium', ni anuncios, ni recopilación de datos. El código fuente es público en GitHub.",
            q2: "¿Dónde se almacenan mis datos? ¿Alguien puede acceder a ellos?",
            a2: "Tus textos se almacenan únicamente en tu navegador (localStorage/IndexedDB), en tu dispositivo. Ningún servidor recibe tus datos. Si activas la sincronización con Google Drive, tú autorizas el acceso a tu propio Drive — Plume no ve nada.",
            q3: "¿Qué pasa si cierro la pestaña o reinicio mi computadora?",
            a3: "No se pierde nada. Plume guarda automáticamente cada cambio en tu navegador. Tus proyectos estarán ahí la próxima vez que lo abras. También puedes exportar manualmente a JSON, DOCX o TXT en cualquier momento.",
            q4: "¿Funciona en móvil?",
            a4: "La interfaz está optimizada para escritorio, ya que la escritura narrativa se beneficia de una pantalla grande. La aplicación sigue siendo utilizable en tabletas. La adaptación móvil completa está en desarrollo.",
            q5: "¿Puedo importar mis proyectos de Scrivener o Word?",
            a5: "Sí. Plume soporta la importación de archivos DOCX (Word) y archivos de texto. La importación nativa de Scrivener (.scriv) está en desarrollo. Mientras tanto, copiar y pegar desde Scrivener funciona perfectamente."
        }
    }
};
