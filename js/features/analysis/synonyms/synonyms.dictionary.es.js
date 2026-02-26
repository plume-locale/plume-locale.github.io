// ============================================================
// synonyms.dictionary.es.js - Diccionario de sinónimos en español
// ============================================================
// [MVVM : Data] - Base de datos local de sinónimos en español
//
// Estructura: palabra -> { synonymes: [], antonymes: [] }

const SpanishSynonymsDictionary = {

    // ===== A =====
    "abandonar": {
        synonymes: ["dejar", "descuidar", "renunciar", "desistir", "ceder", "desampara"],
        antonymes: ["perseverar", "continuar", "mantener", "quedarse"]
    },
    "aceptar": {
        synonymes: ["admitir", "acoger", "aprobar", "consentir", "tolerar", "reconocer"],
        antonymes: ["rechazar", "negar", "declinar", "rehusar"]
    },
    "afirmar": {
        synonymes: ["asegurar", "declarar", "sostener", "aseverar", "confirmar"],
        antonymes: ["negar", "refutar", "dudar"]
    },
    "agradable": {
        synonymes: ["placentero", "grato", "delicioso", "ameno", "encantador", "apacible"],
        antonymes: ["desagradable", "horrible", "molesto"]
    },
    "alegre": {
        synonymes: ["feliz", "contento", "jovial", "animado", "júbilo", "dichoso"],
        antonymes: ["triste", "melancólico", "sombrío", "apesadumbrado"]
    },
    "amar": {
        synonymes: ["querer", "adorar", "apreciar", "estimar", "venerar", "idolatrar"],
        antonymes: ["odiar", "detestar", "aborrecer", "repudiar"]
    },
    "amigo": {
        synonymes: ["compañero", "camarada", "aliado", "colega", "confidente", "socio"],
        antonymes: ["enemigo", "rival", "adversario", "extraño"]
    },
    "angustia": {
        synonymes: ["ansiedad", "zozobra", "terror", "miedo", "inquietud", "pena"],
        antonymes: ["calma", "serenidad", "tranquilidad", "alegría"]
    },
    "aparecer": {
        synonymes: ["surgir", "emerger", "mostrarse", "manifestarse", "brotar", "nacer"],
        antonymes: ["desaparecer", "ocultarse", "esfumarse"]
    },
    "arrogante": {
        synonymes: ["altivo", "soberbio", "orgulloso", "presumido", "engreído"],
        antonymes: ["humilde", "modesto", "sencillo"]
    },
    "ayudar": {
        synonymes: ["asistir", "apoyar", "auxiliar", "socorrer", "colaborar", "favorecer"],
        antonymes: ["obstaculizar", "dañar", "dificultar"]
    },

    // ===== B =====
    "bello": {
        synonymes: ["hermoso", "bonito", "precioso", "lindo", "atractivo", "radiante"],
        antonymes: ["feo", "horrible", "desagradable"]
    },
    "bondad": {
        synonymes: ["amabilidad", "benevolencia", "generosidad", "clemencia", "ternura"],
        antonymes: ["maldad", "crueldad", "indiferencia"]
    },
    "buscar": {
        synonymes: ["indagar", "investigar", "rastrear", "explorar", "perseguir", "hallar"],
        antonymes: ["encontrar", "hallar", "abandonar"]
    },

    // ===== C =====
    "callar": {
        synonymes: ["guardar silencio", "enmudecer", "callarse", "acallar", "omitir"],
        antonymes: ["hablar", "declarar", "revelar"]
    },
    "cambiar": {
        synonymes: ["alterar", "modificar", "transformar", "variar", "mutar", "convertir"],
        antonymes: ["conservar", "mantener", "preservar"]
    },
    "cansado": {
        synonymes: ["agotado", "extenuado", "fatigado", "exhausto", "abismado"],
        antonymes: ["descansado", "energético", "vigoroso"]
    },
    "claro": {
        synonymes: ["luminoso", "evidente", "transparente", "nítido", "distinto", "lúcido"],
        antonymes: ["oscuro", "turbio", "confuso", "opaco"]
    },
    "comenzar": {
        synonymes: ["iniciar", "empezar", "arrancar", "abrir", "inaugurar", "acometer"],
        antonymes: ["terminar", "concluir", "finalizar"]
    },
    "comprender": {
        synonymes: ["entender", "captar", "asimilar", "percibir", "interpretar", "intuir"],
        antonymes: ["ignorar", "malinterpretar", "desconocer"]
    },
    "confiar": {
        synonymes: ["creer", "depositar fe", "fiarse", "depender", "esperar"],
        antonymes: ["desconfiar", "sospechar", "dudar"]
    },
    "conocer": {
        synonymes: ["saber", "dominar", "comprender", "reconocer", "recordar"],
        antonymes: ["desconocer", "ignorar"]
    },
    "contentarse": {
        synonymes: ["satisfacerse", "conformarse", "alegrarse", "complacerse"],
        antonymes: ["quejarse", "lamentarse", "desear más"]
    },
    "correr": {
        synonymes: ["apresurarse", "galopar", "precipitarse", "huir", "lanzarse"],
        antonymes: ["andar", "detenerse", "descansar"]
    },
    "crear": {
        synonymes: ["inventar", "originar", "elaborar", "producir", "fabricar", "generar"],
        antonymes: ["destruir", "demoler", "eliminar"]
    },

    // ===== D =====
    "daño": {
        synonymes: ["perjuicio", "lesión", "herida", "destrozo", "estropicio"],
        antonymes: ["beneficio", "ayuda", "bien"]
    },
    "decidir": {
        synonymes: ["resolver", "determinar", "optar", "elegir", "concluir", "zanjar"],
        antonymes: ["dudar", "vacilar", "posponer"]
    },
    "defender": {
        synonymes: ["proteger", "amparar", "resguardar", "sostener", "custodiar"],
        antonymes: ["atacar", "agredir", "denunciar", "abandonar"]
    },
    "descubrir": {
        synonymes: ["hallar", "detectar", "revelar", "destapar", "encontrar", "explorar"],
        antonymes: ["ocultar", "tapar", "perder"]
    },
    "destruir": {
        synonymes: ["arrasar", "demoler", "derribar", "arruinar", "aniquilar", "devastar"],
        antonymes: ["construir", "crear", "edificar", "reparar"]
    },
    "diferente": {
        synonymes: ["distinto", "dispar", "singular", "divergente", "variado"],
        antonymes: ["igual", "idéntico", "similar", "análogo"]
    },
    "difícil": {
        synonymes: ["arduo", "complicado", "penoso", "dificultoso", "laborioso"],
        antonymes: ["fácil", "sencillo", "simple"]
    },
    "dolor": {
        synonymes: ["sufrimiento", "pena", "tormento", "angustia", "aflicción", "mal"],
        antonymes: ["placer", "bienestar", "alivio"]
    },
    "duda": {
        synonymes: ["incertidumbre", "vacilación", "escepticismo", "suspicacia", "sospecha"],
        antonymes: ["certeza", "convicción", "seguridad"]
    },

    // ===== E =====
    "egoísta": {
        synonymes: ["egoísta", "avaro", "tacaño", "interesado", "codicioso"],
        antonymes: ["generoso", "altruista", "desprendido"]
    },
    "elegante": {
        synonymes: ["refinado", "distinguido", "estiloso", "sofisticado", "esmerado"],
        antonymes: ["grosero", "vulgar", "descuidado"]
    },
    "emoción": {
        synonymes: ["sentimiento", "sensación", "afecto", "pasión", "excitación"],
        antonymes: ["indiferencia", "frialdad", "apatía"]
    },
    "empezar": {
        synonymes: ["iniciar", "comenzar", "arrancar", "entrar", "inaugurar", "abrir"],
        antonymes: ["terminar", "acabar", "concluir"]
    },
    "energía": {
        synonymes: ["vigor", "vitalidad", "fuerza", "brío", "potencia", "dinamismo"],
        antonymes: ["cansancio", "debilidad", "agotamiento"]
    },
    "enojado": {
        synonymes: ["furioso", "irritado", "iracundo", "enfadado", "indignado"],
        antonymes: ["calmado", "tranquilo", "sereno"]
    },
    "encontrar": {
        synonymes: ["hallar", "localizar", "descubrir", "obtener", "detectar", "topar"],
        antonymes: ["perder", "buscar", "extraviar"]
    },
    "escribir": {
        synonymes: ["redactar", "anotar", "componer", "transcribir", "plasmar"],
        antonymes: ["borrar", "leer", "suprimir"]
    },
    "esperar": {
        synonymes: ["aguardar", "confiar", "anhelar", "aspirar", "desear"],
        antonymes: ["desesperanzarse", "actuar", "renunciar"]
    },
    "estudio": {
        synonymes: ["investigación", "análisis", "examen", "preparación", "aprendizaje"],
        antonymes: ["ignorancia", "descuido", "abstención"]
    },
    "éxito": {
        synonymes: ["triunfo", "logro", "victoria", "consecución", "acierto", "progreso"],
        antonymes: ["fracaso", "derrota", "error"]
    },
    "extraño": {
        synonymes: ["raro", "peculiar", "singular", "inusual", "insólito", "curioso"],
        antonymes: ["normal", "corriente", "habitual"]
    },

    // ===== F =====
    "fácil": {
        synonymes: ["sencillo", "simple", "elemental", "cómodo", "accesible"],
        antonymes: ["difícil", "arduo", "complicado"]
    },
    "falso": {
        synonymes: ["inexacto", "erróneo", "mentiroso", "ficticio", "artificial"],
        antonymes: ["verdadero", "auténtico", "real"]
    },
    "felicidad": {
        synonymes: ["alegría", "dicha", "gozo", "bienestar", "júbilo", "satisfacción"],
        antonymes: ["tristeza", "desdicha", "angustia"]
    },
    "fiel": {
        synonymes: ["leal", "devoto", "constante", "comprometido", "honesto"],
        antonymes: ["infiel", "traidor", "desleal"]
    },
    "fuerza": {
        synonymes: ["poder", "vigor", "energía", "resistencia", "potencia", "brío"],
        antonymes: ["debilidad", "fragilidad", "flaqueza"]
    },

    // ===== G =====
    "generoso": {
        synonymes: ["desprendido", "altruista", "dadivoso", "caritativo", "magnánimo"],
        antonymes: ["egoísta", "avaro", "tacaño"]
    },
    "grande": {
        synonymes: ["inmenso", "enorme", "vasto", "gigantesco", "colosal", "extenso"],
        antonymes: ["pequeño", "diminuto", "minúsculo"]
    },
    "grave": {
        synonymes: ["serio", "crítico", "importante", "severo", "solemne"],
        antonymes: ["leve", "insignificante", "banal"]
    },
    "guerra": {
        synonymes: ["conflicto", "batalla", "combate", "enfrentamiento", "lucha"],
        antonymes: ["paz", "armonía", "concordia"]
    },

    // ===== H =====
    "hablar": {
        synonymes: ["decir", "expresarse", "conversar", "charlar", "platicar", "dialogar"],
        antonymes: ["callar", "escuchar", "guardar silencio"]
    },
    "honesto": {
        synonymes: ["honrado", "sincero", "íntegro", "recto", "veraz", "incorruptible"],
        antonymes: ["deshonesto", "mentiroso", "corrupto"]
    },

    // ===== I =====
    "ignorar": {
        synonymes: ["desconocer", "omitir", "no hacer caso", "pasar por alto"],
        antonymes: ["conocer", "saber", "considerar"]
    },
    "ilusion": {
        synonymes: ["esperanza", "ilusión", "sueño", "quimera", "utopía"],
        antonymes: ["realidad", "desengaño", "decepción"]
    },
    "imaginar": {
        synonymes: ["fantasear", "soñar", "ensoñar", "concebir", "idear", "inventar"],
        antonymes: ["constatar", "observar", "verificar"]
    },
    "importante": {
        synonymes: ["significativo", "esencial", "capital", "vital", "trascendente"],
        antonymes: ["insignificante", "trivial", "nimio"]
    },
    "inteligente": {
        synonymes: ["listo", "hábil", "perspicaz", "astuto", "brillante", "sagaz"],
        antonymes: ["tonto", "torpe", "ignorante"]
    },

    // ===== J =====
    "joven": {
        synonymes: ["juvenil", "adolescente", "nuevo", "fresco", "novato"],
        antonymes: ["viejo", "anciano", "maduro"]
    },

    // ===== L =====
    "lejos": {
        synonymes: ["distante", "alejado", "lejano", "remoto", "apartado"],
        antonymes: ["cerca", "próximo", "adyacente"]
    },
    "lento": {
        synonymes: ["pausado", "tranquilo", "tardío", "moroso", "apacible"],
        antonymes: ["rápido", "veloz", "ágil"]
    },
    "libre": {
        synonymes: ["independiente", "autónomo", "emancipado", "sin ataduras"],
        antonymes: ["preso", "esclavo", "sometido", "dependiente"]
    },
    "luchar": {
        synonymes: ["combatir", "pelear", "batallar", "resistir", "pugnar", "enfrentarse"],
        antonymes: ["rendirse", "ceder", "capitular"]
    },

    // ===== M =====
    "malo": {
        synonymes: ["nocivo", "perjudicial", "cruel", "perverso", "malicioso"],
        antonymes: ["bueno", "bondadoso", "benévolo"]
    },
    "miedo": {
        synonymes: ["terror", "pánico", "espanto", "aprensión", "temor", "pavor"],
        antonymes: ["valentía", "coraje", "audacia"]
    },
    "misterio": {
        synonymes: ["enigma", "secreto", "incógnita", "arcano", "lo desconocido"],
        antonymes: ["evidencia", "claridad", "obviedad"]
    },
    "morir": {
        synonymes: ["fallecer", "perecer", "expirar", "extinguirse", "sucumbir"],
        antonymes: ["nacer", "vivir", "sobrevivir"]
    },

    // ===== N =====
    "necesario": {
        synonymes: ["indispensable", "esencial", "obligatorio", "imprescindible", "vital"],
        antonymes: ["innecesario", "superfluo", "opcional"]
    },
    "nuevo": {
        synonymes: ["reciente", "moderno", "fresco", "novedoso", "original", "renovado"],
        antonymes: ["viejo", "antiguo", "obsoleto", "gastado"]
    },

    // ===== O =====
    "odio": {
        synonymes: ["aversión", "hostilidad", "rencor", "animadversión", "rechazo"],
        antonymes: ["amor", "cariño", "afecto", "simpatía"]
    },
    "oscuro": {
        synonymes: ["sombrío", "tenebroso", "negro", "turbio", "misterioso"],
        antonymes: ["claro", "luminoso", "brillante"]
    },

    // ===== P =====
    "paz": {
        synonymes: ["calma", "tranquilidad", "sosiego", "armonía", "concordia"],
        antonymes: ["guerra", "conflicto", "agitación"]
    },
    "pequeño": {
        synonymes: ["diminuto", "minúsculo", "reducido", "escaso", "módico"],
        antonymes: ["grande", "enorme", "gigantesco"]
    },
    "poder": {
        synonymes: ["fuerza", "capacidad", "autoridad", "dominio", "influencia"],
        antonymes: ["debilidad", "impotencia", "sumisión"]
    },
    "proteger": {
        synonymes: ["defender", "amparar", "resguardar", "preservar", "cuidar"],
        antonymes: ["exponer", "amenazar", "atacar"]
    },
    "perder": {
        synonymes: ["extraviar", "fracasar", "desperdiciar", "ceder"],
        antonymes: ["ganar", "encontrar", "conservar"]
    },

    // ===== R =====
    "rápido": {
        synonymes: ["veloz", "ágil", "presto", "fugaz", "acelerado", "raudo"],
        antonymes: ["lento", "pausado", "moroso"]
    },
    "recordar": {
        synonymes: ["rememorar", "evocar", "traer a la memoria", "acordarse", "retener"],
        antonymes: ["olvidar", "ignorar"]
    },
    "rico": {
        synonymes: ["adinerado", "acomodado", "pudiente", "opulento", "acaudalado"],
        antonymes: ["pobre", "indigente", "miserable"]
    },

    // ===== S =====
    "sabio": {
        synonymes: ["inteligente", "perspicaz", "ilustrado", "erudito", "prudente"],
        antonymes: ["ignorante", "tonto", "imprudente"]
    },
    "secreto": {
        synonymes: ["misterio", "incógnita", "confidencia", "arcano", "intriga"],
        antonymes: ["público", "evidente", "conocido"]
    },
    "sentir": {
        synonymes: ["percibir", "experimentar", "encontrarse", "emocionarse", "notar"],
        antonymes: ["ignorar", "insensibilizarse"]
    },
    "solitario": {
        synonymes: ["solo", "aislado", "abandonado", "solitario", "ermitaño"],
        antonymes: ["acompañado", "sociable", "unido"]
    },
    "sueño": {
        synonymes: ["ensueño", "visión", "ilusión", "quimera", "aspiración", "anhelo"],
        antonymes: ["realidad", "pesadilla", "vigilia"]
    },

    // ===== T =====
    "terminar": {
        synonymes: ["acabar", "concluir", "finalizar", "cerrar", "zanjar", "completar"],
        antonymes: ["comenzar", "iniciar", "abrir"]
    },
    "tiempo": {
        synonymes: ["época", "periodo", "momento", "era", "plazo", "instante"],
        antonymes: []
    },
    "trabajar": {
        synonymes: ["laborar", "esforzarse", "afanarse", "ocuparse", "emplear"],
        antonymes: ["descansar", "holgazanear", "relajarse"]
    },
    "triste": {
        synonymes: ["melancólico", "apesadumbrado", "sombrío", "afligido", "angustiado"],
        antonymes: ["alegre", "feliz", "jovial", "animado"]
    },

    // ===== U =====
    "único": {
        synonymes: ["singular", "exclusivo", "incomparable", "extraordinario", "irrepetible"],
        antonymes: ["común", "ordinario", "repetible"]
    },
    "útil": {
        synonymes: ["provechoso", "beneficioso", "práctico", "valioso", "funcional"],
        antonymes: ["inútil", "innecesario", "superfluo"]
    },

    // ===== V =====
    "valiente": {
        synonymes: ["audaz", "osado", "valeroso", "heroico", "intrépido", "bravo"],
        antonymes: ["cobarde", "miedoso", "pusilánime"]
    },
    "verdad": {
        synonymes: ["realidad", "exactitud", "autenticidad", "sinceridad", "veracidad"],
        antonymes: ["mentira", "falsedad", "engaño"]
    },
    "vida": {
        synonymes: ["existencia", "ser", "vitalidad", "animación", "historia"],
        antonymes: ["muerte", "fallecimiento"]
    },
    "viejo": {
        synonymes: ["anciano", "antiguo", "veterano", "desgastado", "marchito"],
        antonymes: ["joven", "nuevo", "fresco"]
    },
    "vivir": {
        synonymes: ["existir", "habitar", "residir", "sobrevivir", "disfrutar"],
        antonymes: ["morir", "perecer"]
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpanishSynonymsDictionary };
}
