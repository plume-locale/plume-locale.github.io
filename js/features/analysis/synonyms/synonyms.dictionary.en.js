// ============================================================
// synonyms.dictionary.en.js - English Synonyms Dictionary
// ============================================================
// [MVVM : Data] - Local English synonyms database
//
// Structure: word -> { synonymes: [], antonymes: [] }
// Note: Keys use "synonymes"/"antonymes" for consistency with the FR dictionary

const EnglishSynonymsDictionary = {

    // ===== A =====
    "abandon": {
        synonymes: ["desert", "forsake", "leave", "quit", "relinquish", "surrender", "give up"],
        antonymes: ["keep", "maintain", "stay", "continue", "persist"]
    },
    "able": {
        synonymes: ["capable", "competent", "skilled", "qualified", "proficient", "talented"],
        antonymes: ["unable", "incapable", "incompetent"]
    },
    "accept": {
        synonymes: ["receive", "take", "admit", "agree", "approve", "acknowledge", "welcome"],
        antonymes: ["reject", "refuse", "deny", "decline"]
    },
    "achieve": {
        synonymes: ["accomplish", "attain", "reach", "complete", "fulfill", "succeed", "obtain"],
        antonymes: ["fail", "miss", "lose", "abandon"]
    },
    "admire": {
        synonymes: ["appreciate", "respect", "esteem", "revere", "adore", "praise", "value"],
        antonymes: ["despise", "disdain", "disrespect"]
    },
    "afraid": {
        synonymes: ["scared", "frightened", "terrified", "fearful", "anxious", "nervous", "timid"],
        antonymes: ["brave", "fearless", "courageous", "bold"]
    },
    "agree": {
        synonymes: ["consent", "concur", "approve", "accept", "comply", "assent", "conform"],
        antonymes: ["disagree", "object", "refuse", "deny"]
    },
    "alone": {
        synonymes: ["solitary", "isolated", "lonely", "single", "by oneself", "secluded"],
        antonymes: ["accompanied", "together", "surrounded"]
    },
    "angry": {
        synonymes: ["furious", "enraged", "irate", "livid", "indignant", "annoyed", "wrathful"],
        antonymes: ["calm", "peaceful", "pleased", "content"]
    },
    "answer": {
        synonymes: ["reply", "respond", "retort", "react", "solution", "resolution"],
        antonymes: ["question", "ask", "query", "ignore"]
    },
    "appear": {
        synonymes: ["emerge", "arise", "show up", "surface", "materialize", "seem", "look"],
        antonymes: ["disappear", "vanish", "hide"]
    },
    "ask": {
        synonymes: ["inquire", "question", "request", "demand", "query", "seek", "solicit"],
        antonymes: ["answer", "reply", "respond", "tell"]
    },
    "atrocious": {
        synonymes: ["terrible", "horrible", "dreadful", "awful", "monstrous", "appalling"],
        antonymes: ["wonderful", "excellent", "superb"]
    },
    "authentic": {
        synonymes: ["genuine", "real", "true", "original", "actual", "legitimate", "bona fide"],
        antonymes: ["fake", "false", "counterfeit", "artificial"]
    },

    // ===== B =====
    "bad": {
        synonymes: ["terrible", "awful", "poor", "inferior", "dreadful", "unpleasant", "harmful"],
        antonymes: ["good", "excellent", "great", "wonderful"]
    },
    "beautiful": {
        synonymes: ["lovely", "gorgeous", "stunning", "pretty", "attractive", "elegant", "charming"],
        antonymes: ["ugly", "hideous", "unattractive", "plain"]
    },
    "begin": {
        synonymes: ["start", "commence", "initiate", "launch", "open", "embark", "undertake"],
        antonymes: ["end", "finish", "stop", "conclude"]
    },
    "believe": {
        synonymes: ["think", "assume", "consider", "trust", "suppose", "deem", "reckon"],
        antonymes: ["doubt", "disbelieve", "deny", "question"]
    },
    "big": {
        synonymes: ["large", "huge", "enormous", "vast", "great", "immense", "gigantic"],
        antonymes: ["small", "tiny", "little", "miniature"]
    },
    "bold": {
        synonymes: ["brave", "courageous", "daring", "fearless", "confident", "audacious"],
        antonymes: ["timid", "cowardly", "fearful", "shy"]
    },
    "break": {
        synonymes: ["shatter", "smash", "crack", "fracture", "destroy", "damage", "split"],
        antonymes: ["fix", "repair", "mend", "unite"]
    },
    "bright": {
        synonymes: ["luminous", "radiant", "shining", "vivid", "brilliant", "dazzling", "clever"],
        antonymes: ["dark", "dim", "dull", "gloomy"]
    },
    "busy": {
        synonymes: ["occupied", "active", "engaged", "working", "industrious", "hectic"],
        antonymes: ["idle", "free", "lazy", "inactive"]
    },

    // ===== C =====
    "calm": {
        synonymes: ["peaceful", "serene", "tranquil", "quiet", "composed", "placid", "relaxed"],
        antonymes: ["agitated", "nervous", "anxious", "turbulent"]
    },
    "careful": {
        synonymes: ["cautious", "attentive", "watchful", "meticulous", "thorough", "prudent"],
        antonymes: ["careless", "reckless", "negligent"]
    },
    "change": {
        synonymes: ["alter", "modify", "transform", "vary", "shift", "revise", "amend"],
        antonymes: ["preserve", "maintain", "keep", "remain"]
    },
    "choose": {
        synonymes: ["select", "pick", "opt", "prefer", "decide", "elect", "designate"],
        antonymes: ["reject", "refuse", "discard"]
    },
    "clear": {
        synonymes: ["obvious", "evident", "plain", "transparent", "lucid", "distinct", "bright"],
        antonymes: ["unclear", "vague", "obscure", "confusing"]
    },
    "clever": {
        synonymes: ["smart", "intelligent", "bright", "ingenious", "shrewd", "astute", "witty"],
        antonymes: ["stupid", "dull", "foolish", "ignorant"]
    },
    "close": {
        synonymes: ["near", "adjacent", "nearby", "intimate", "shut", "seal", "end"],
        antonymes: ["far", "open", "distant", "remote"]
    },
    "come": {
        synonymes: ["arrive", "approach", "reach", "appear", "turn up", "show up"],
        antonymes: ["go", "leave", "depart", "exit"]
    },
    "complete": {
        synonymes: ["finish", "accomplish", "fulfill", "achieve", "conclude", "whole", "total"],
        antonymes: ["incomplete", "partial", "begin", "unfinished"]
    },
    "confident": {
        synonymes: ["assured", "certain", "self-assured", "bold", "positive", "secure"],
        antonymes: ["uncertain", "hesitant", "doubtful", "insecure"]
    },
    "confuse": {
        synonymes: ["bewilder", "perplex", "puzzle", "muddle", "mix up", "disorient"],
        antonymes: ["clarify", "explain", "enlighten"]
    },
    "control": {
        synonymes: ["manage", "direct", "command", "govern", "regulate", "restrict", "dominate"],
        antonymes: ["lose control", "release", "free", "abandon"]
    },
    "courageous": {
        synonymes: ["brave", "bold", "fearless", "valiant", "heroic", "daring", "gallant"],
        antonymes: ["cowardly", "timid", "fearful"]
    },
    "create": {
        synonymes: ["make", "produce", "build", "generate", "invent", "design", "craft"],
        antonymes: ["destroy", "demolish", "eliminate", "ruin"]
    },

    // ===== D =====
    "dangerous": {
        synonymes: ["hazardous", "risky", "perilous", "unsafe", "threatening", "harmful"],
        antonymes: ["safe", "secure", "protected", "harmless"]
    },
    "dark": {
        synonymes: ["dim", "shadowy", "gloomy", "murky", "obscure", "sinister", "black"],
        antonymes: ["light", "bright", "luminous", "clear"]
    },
    "decide": {
        synonymes: ["choose", "determine", "resolve", "settle", "conclude", "opt"],
        antonymes: ["hesitate", "waver", "delay", "postpone"]
    },
    "defend": {
        synonymes: ["protect", "guard", "shield", "safeguard", "preserve", "support"],
        antonymes: ["attack", "expose", "abandon", "threaten"]
    },
    "destroy": {
        synonymes: ["demolish", "ruin", "wreck", "devastate", "annihilate", "eliminate"],
        antonymes: ["create", "build", "construct", "restore"]
    },
    "different": {
        synonymes: ["distinct", "unlike", "dissimilar", "varied", "diverse", "unique"],
        antonymes: ["same", "identical", "similar", "alike"]
    },
    "difficult": {
        synonymes: ["hard", "challenging", "tough", "demanding", "complex", "arduous"],
        antonymes: ["easy", "simple", "effortless", "straightforward"]
    },
    "disappear": {
        synonymes: ["vanish", "fade", "evaporate", "dissolve", "hide", "depart"],
        antonymes: ["appear", "emerge", "show up", "materialize"]
    },
    "discover": {
        synonymes: ["find", "uncover", "detect", "reveal", "explore", "identify", "learn"],
        antonymes: ["hide", "conceal", "overlook", "lose"]
    },
    "doubt": {
        synonymes: ["uncertainty", "hesitation", "skepticism", "suspicion", "distrust", "question"],
        antonymes: ["certainty", "confidence", "trust", "belief"]
    },
    "dream": {
        synonymes: ["vision", "fantasy", "aspiration", "hope", "illusion", "wish", "ambition"],
        antonymes: ["reality", "nightmare", "fact"]
    },

    // ===== E =====
    "eager": {
        synonymes: ["enthusiastic", "keen", "ardent", "passionate", "zealous", "willing"],
        antonymes: ["reluctant", "indifferent", "apathetic", "unwilling"]
    },
    "easy": {
        synonymes: ["simple", "effortless", "straightforward", "uncomplicated", "light"],
        antonymes: ["difficult", "hard", "complex", "challenging"]
    },
    "emotion": {
        synonymes: ["feeling", "sentiment", "sensation", "affect", "passion", "response"],
        antonymes: ["indifference", "coldness", "apathy"]
    },
    "end": {
        synonymes: ["finish", "conclusion", "close", "termination", "limit", "goal", "stop"],
        antonymes: ["beginning", "start", "opening", "origin"]
    },
    "energy": {
        synonymes: ["vigor", "vitality", "strength", "power", "dynamism", "force", "stamina"],
        antonymes: ["fatigue", "weakness", "exhaustion", "lethargy"]
    },
    "enjoy": {
        synonymes: ["relish", "appreciate", "delight in", "savor", "love", "like", "revel in"],
        antonymes: ["dislike", "hate", "endure", "suffer"]
    },
    "enormous": {
        synonymes: ["huge", "vast", "immense", "gigantic", "massive", "colossal", "large"],
        antonymes: ["tiny", "small", "miniature", "minute"]
    },
    "error": {
        synonymes: ["mistake", "fault", "blunder", "slip", "flaw", "inaccuracy", "oversight"],
        antonymes: ["accuracy", "correctness", "precision", "truth"]
    },
    "exist": {
        synonymes: ["live", "be", "subsist", "survive", "occur", "remain"],
        antonymes: ["disappear", "die", "cease", "vanish"]
    },

    // ===== F =====
    "fail": {
        synonymes: ["lose", "fall short", "miscarry", "collapse", "stumble", "miss"],
        antonymes: ["succeed", "win", "achieve", "accomplish"]
    },
    "faithful": {
        synonymes: ["loyal", "devoted", "true", "reliable", "steadfast", "dedicated", "constant"],
        antonymes: ["disloyal", "unfaithful", "treacherous", "fickle"]
    },
    "false": {
        synonymes: ["untrue", "incorrect", "inaccurate", "wrong", "fictitious", "fake"],
        antonymes: ["true", "correct", "accurate", "real"]
    },
    "famous": {
        synonymes: ["renowned", "celebrated", "well-known", "prominent", "notable", "distinguished"],
        antonymes: ["unknown", "obscure", "anonymous", "insignificant"]
    },
    "fast": {
        synonymes: ["quick", "rapid", "swift", "speedy", "brisk", "hasty", "prompt"],
        antonymes: ["slow", "gradual", "leisurely", "sluggish"]
    },
    "fear": {
        synonymes: ["fright", "terror", "dread", "anxiety", "panic", "horror", "alarm"],
        antonymes: ["courage", "bravery", "confidence", "calm"]
    },
    "find": {
        synonymes: ["discover", "locate", "uncover", "detect", "identify", "encounter"],
        antonymes: ["lose", "miss", "overlook", "hide"]
    },
    "force": {
        synonymes: ["power", "strength", "energy", "might", "compel", "make", "push"],
        antonymes: ["weakness", "request", "allow", "permit"]
    },
    "free": {
        synonymes: ["liberate", "release", "independent", "unrestricted", "open", "at liberty"],
        antonymes: ["confined", "imprisoned", "restricted", "enslaved"]
    },
    "friend": {
        synonymes: ["companion", "ally", "associate", "pal", "buddy", "comrade", "confidant"],
        antonymes: ["enemy", "foe", "rival", "stranger"]
    },

    // ===== G =====
    "generous": {
        synonymes: ["giving", "charitable", "benevolent", "kind", "magnanimous", "liberal"],
        antonymes: ["selfish", "greedy", "stingy", "mean"]
    },
    "gentle": {
        synonymes: ["tender", "soft", "mild", "kind", "delicate", "calm", "moderate"],
        antonymes: ["rough", "harsh", "violent", "cruel"]
    },
    "give": {
        synonymes: ["offer", "provide", "grant", "donate", "supply", "present", "bestow"],
        antonymes: ["take", "receive", "keep", "withhold"]
    },
    "go": {
        synonymes: ["leave", "depart", "move", "travel", "proceed", "head", "walk"],
        antonymes: ["stay", "come", "arrive", "remain"]
    },
    "good": {
        synonymes: ["excellent", "great", "fine", "wonderful", "superb", "virtuous", "beneficial"],
        antonymes: ["bad", "terrible", "poor", "evil"]
    },
    "great": {
        synonymes: ["magnificent", "superb", "wonderful", "excellent", "grand", "outstanding"],
        antonymes: ["terrible", "awful", "insignificant", "tiny"]
    },
    "grow": {
        synonymes: ["develop", "expand", "increase", "mature", "evolve", "flourish", "rise"],
        antonymes: ["shrink", "decrease", "diminish", "decline"]
    },

    // ===== H =====
    "happy": {
        synonymes: ["joyful", "pleased", "content", "delighted", "cheerful", "elated", "glad"],
        antonymes: ["sad", "unhappy", "miserable", "sorrowful"]
    },
    "hard": {
        synonymes: ["firm", "solid", "rigid", "difficult", "challenging", "tough", "arduous"],
        antonymes: ["soft", "easy", "simple", "gentle"]
    },
    "hate": {
        synonymes: ["detest", "loathe", "despise", "abhor", "dislike", "resent", "abominate"],
        antonymes: ["love", "adore", "like", "cherish"]
    },
    "help": {
        synonymes: ["assist", "aid", "support", "guide", "facilitate", "enable", "back"],
        antonymes: ["hinder", "obstruct", "harm", "hinder"]
    },
    "hide": {
        synonymes: ["conceal", "cover", "mask", "disguise", "secrete", "veil", "obscure"],
        antonymes: ["reveal", "expose", "show", "uncover"]
    },
    "hope": {
        synonymes: ["wish", "aspire", "expect", "anticipate", "trust", "optimism", "faith"],
        antonymes: ["despair", "give up", "pessimism"]
    },
    "horrible": {
        synonymes: ["dreadful", "awful", "terrible", "monstrous", "ghastly", "terrifying"],
        antonymes: ["wonderful", "beautiful", "pleasant"]
    },

    // ===== I =====
    "idea": {
        synonymes: ["concept", "notion", "thought", "plan", "proposal", "suggestion", "vision"],
        antonymes: []
    },
    "imagine": {
        synonymes: ["envision", "picture", "conceive", "dream", "fantasize", "suppose"],
        antonymes: ["observe", "perceive", "know", "confirm"]
    },
    "important": {
        synonymes: ["significant", "vital", "crucial", "essential", "major", "critical", "key"],
        antonymes: ["unimportant", "trivial", "minor", "insignificant"]
    },
    "improve": {
        synonymes: ["enhance", "develop", "advance", "perfect", "better", "upgrade", "refine"],
        antonymes: ["worsen", "deteriorate", "decline", "damage"]
    },
    "intelligent": {
        synonymes: ["smart", "clever", "bright", "wise", "gifted", "sharp", "brilliant"],
        antonymes: ["stupid", "foolish", "ignorant", "dull"]
    },

    // ===== J =====
    "joy": {
        synonymes: ["happiness", "delight", "pleasure", "bliss", "cheerfulness", "elation"],
        antonymes: ["sadness", "sorrow", "grief", "misery"]
    },
    "jump": {
        synonymes: ["leap", "spring", "bound", "hop", "vault", "skip"],
        antonymes: ["fall", "drop", "sink", "stay"]
    },

    // ===== K =====
    "keep": {
        synonymes: ["retain", "preserve", "maintain", "hold", "save", "protect"],
        antonymes: ["lose", "release", "surrender", "abandon"]
    },
    "kind": {
        synonymes: ["gentle", "generous", "caring", "considerate", "compassionate", "warm"],
        antonymes: ["unkind", "cruel", "mean", "harsh"]
    },
    "know": {
        synonymes: ["understand", "comprehend", "grasp", "realize", "recognize", "be aware"],
        antonymes: ["ignore", "forget", "misunderstand"]
    },

    // ===== L =====
    "laugh": {
        synonymes: ["chuckle", "giggle", "snicker", "cackle", "guffaw", "smile"],
        antonymes: ["cry", "weep", "sob"]
    },
    "learn": {
        synonymes: ["study", "discover", "understand", "grasp", "acquire", "absorb"],
        antonymes: ["forget", "ignore", "teach"]
    },
    "light": {
        synonymes: ["bright", "radiant", "luminous", "glow", "illumination", "gentle", "easy"],
        antonymes: ["dark", "heavy", "gloomy", "difficult"]
    },
    "lose": {
        synonymes: ["miss", "fail", "forfeit", "drop", "surrender", "misplace"],
        antonymes: ["win", "find", "keep", "gain"]
    },
    "love": {
        synonymes: ["adore", "cherish", "care for", "treasure", "idolize", "fondly like"],
        antonymes: ["hate", "loathe", "despise", "dislike"]
    },

    // ===== M =====
    "magnificent": {
        synonymes: ["splendid", "glorious", "grand", "superb", "majestic", "impressive"],
        antonymes: ["mediocre", "ordinary", "ugly", "poor"]
    },
    "make": {
        synonymes: ["create", "build", "produce", "construct", "manufacture", "form", "craft"],
        antonymes: ["destroy", "break", "dismantle"]
    },
    "mean": {
        synonymes: ["cruel", "unkind", "harsh", "selfish", "spiteful", "vicious"],
        antonymes: ["kind", "generous", "nice", "compassionate"]
    },
    "move": {
        synonymes: ["travel", "shift", "relocate", "stir", "transfer", "advance", "touch"],
        antonymes: ["stay", "remain", "halt", "freeze"]
    },
    "mysterious": {
        synonymes: ["enigmatic", "secret", "puzzling", "baffling", "cryptic", "puzzling"],
        antonymes: ["clear", "obvious", "plain", "transparent"]
    },

    // ===== N =====
    "new": {
        synonymes: ["fresh", "recent", "modern", "novel", "original", "innovative", "brand-new"],
        antonymes: ["old", "ancient", "outdated", "used"]
    },
    "nice": {
        synonymes: ["pleasant", "agreeable", "lovely", "kind", "friendly", "charming"],
        antonymes: ["unpleasant", "disagreeable", "mean", "rude"]
    },

    // ===== O =====
    "obey": {
        synonymes: ["follow", "comply", "submit", "respect", "heed", "conform"],
        antonymes: ["disobey", "rebel", "defy", "resist"]
    },
    "old": {
        synonymes: ["ancient", "aged", "elderly", "antique", "vintage", "outdated"],
        antonymes: ["new", "young", "modern", "fresh"]
    },
    "open": {
        synonymes: ["unlock", "reveal", "start", "begin", "expand", "accessible", "frank"],
        antonymes: ["close", "shut", "end", "hidden"]
    },

    // ===== P =====
    "patience": {
        synonymes: ["endurance", "perseverance", "tolerance", "calmness", "fortitude"],
        antonymes: ["impatience", "irritability", "impulsiveness"]
    },
    "peace": {
        synonymes: ["calm", "tranquility", "harmony", "serenity", "quiet", "stillness"],
        antonymes: ["war", "conflict", "turmoil", "chaos"]
    },
    "powerful": {
        synonymes: ["strong", "mighty", "forceful", "dominant", "influential", "robust"],
        antonymes: ["weak", "powerless", "frail", "helpless"]
    },
    "problem": {
        synonymes: ["issue", "difficulty", "challenge", "obstacle", "trouble", "complication"],
        antonymes: ["solution", "answer", "result"]
    },

    // ===== Q =====
    "quick": {
        synonymes: ["fast", "speedy", "swift", "rapid", "brisk", "prompt", "agile"],
        antonymes: ["slow", "sluggish", "leisurely"]
    },
    "quiet": {
        synonymes: ["silent", "calm", "peaceful", "still", "tranquil", "hushed"],
        antonymes: ["loud", "noisy", "turbulent"]
    },

    // ===== R =====
    "real": {
        synonymes: ["genuine", "actual", "true", "authentic", "factual", "concrete"],
        antonymes: ["fake", "false", "artificial", "imaginary"]
    },
    "remember": {
        synonymes: ["recall", "recollect", "retain", "memorize", "think back"],
        antonymes: ["forget", "overlook", "ignore"]
    },
    "rise": {
        synonymes: ["ascend", "climb", "increase", "grow", "soar", "lift", "go up"],
        antonymes: ["fall", "drop", "decline", "decrease"]
    },
    "run": {
        synonymes: ["sprint", "dash", "race", "jog", "speed", "rush"],
        antonymes: ["walk", "stop", "rest", "crawl"]
    },

    // ===== S =====
    "sad": {
        synonymes: ["unhappy", "sorrowful", "melancholy", "gloomy", "dejected", "miserable"],
        antonymes: ["happy", "joyful", "cheerful", "pleased"]
    },
    "save": {
        synonymes: ["rescue", "protect", "preserve", "spare", "safeguard", "retain"],
        antonymes: ["lose", "waste", "destroy", "abandon"]
    },
    "say": {
        synonymes: ["speak", "tell", "state", "express", "declare", "utter", "mention"],
        antonymes: ["silence", "conceal", "hide", "listen"]
    },
    "search": {
        synonymes: ["seek", "look for", "hunt", "explore", "investigate", "probe"],
        antonymes: ["find", "discover", "abandon"]
    },
    "show": {
        synonymes: ["display", "reveal", "present", "demonstrate", "exhibit", "indicate"],
        antonymes: ["hide", "conceal", "cover", "obscure"]
    },
    "simple": {
        synonymes: ["easy", "basic", "plain", "clear", "straightforward", "elementary"],
        antonymes: ["complex", "difficult", "complicated", "intricate"]
    },
    "slow": {
        synonymes: ["sluggish", "lagging", "leisurely", "gradual", "plodding", "unhurried"],
        antonymes: ["fast", "quick", "rapid", "swift"]
    },
    "small": {
        synonymes: ["tiny", "little", "miniature", "petite", "minor", "compact", "minute"],
        antonymes: ["big", "large", "huge", "enormous"]
    },
    "smart": {
        synonymes: ["intelligent", "clever", "bright", "sharp", "wise", "astute", "genius"],
        antonymes: ["stupid", "dull", "ignorant", "foolish"]
    },
    "strong": {
        synonymes: ["powerful", "robust", "sturdy", "tough", "vigorous", "mighty", "solid"],
        antonymes: ["weak", "frail", "fragile", "feeble"]
    },
    "success": {
        synonymes: ["achievement", "victory", "triumph", "accomplishment", "win", "fulfillment"],
        antonymes: ["failure", "defeat", "loss"]
    },
    "surprise": {
        synonymes: ["astonishment", "shock", "amazement", "wonder", "stunning", "unexpected"],
        antonymes: ["expectation", "anticipation", "predictability"]
    },

    // ===== T =====
    "tell": {
        synonymes: ["say", "inform", "explain", "describe", "narrate", "reveal", "report"],
        antonymes: ["listen", "hide", "conceal", "ask"]
    },
    "think": {
        synonymes: ["believe", "consider", "ponder", "reflect", "reason", "imagine", "suppose"],
        antonymes: ["act", "ignore", "forget"]
    },
    "tired": {
        synonymes: ["exhausted", "weary", "fatigued", "drained", "worn out", "sluggish"],
        antonymes: ["energetic", "refreshed", "rested", "vigorous"]
    },
    "travel": {
        synonymes: ["journey", "explore", "tour", "roam", "voyage", "wander", "trek"],
        antonymes: ["stay", "remain", "halt"]
    },
    "trust": {
        synonymes: ["believe", "rely on", "confidence", "faith", "depend", "credit"],
        antonymes: ["distrust", "doubt", "suspicion", "mistrust"]
    },
    "truth": {
        synonymes: ["fact", "reality", "honesty", "accuracy", "sincerity", "exactness"],
        antonymes: ["lie", "falsehood", "deception", "fiction"]
    },

    // ===== U =====
    "understand": {
        synonymes: ["comprehend", "grasp", "realize", "follow", "perceive", "know"],
        antonymes: ["misunderstand", "ignore", "confuse"]
    },
    "unique": {
        synonymes: ["rare", "exceptional", "singular", "one-of-a-kind", "unrepeatable"],
        antonymes: ["common", "ordinary", "typical", "usual"]
    },

    // ===== V =====
    "victory": {
        synonymes: ["win", "triumph", "success", "conquest", "achievement"],
        antonymes: ["defeat", "loss", "failure"]
    },
    "vital": {
        synonymes: ["essential", "critical", "crucial", "necessary", "indispensable", "key"],
        antonymes: ["unnecessary", "optional", "trivial"]
    },

    // ===== W =====
    "want": {
        synonymes: ["desire", "wish", "crave", "need", "yearn", "long for", "aspire"],
        antonymes: ["refuse", "reject", "dislike"]
    },
    "wise": {
        synonymes: ["intelligent", "smart", "knowledgeable", "sage", "prudent", "discerning"],
        antonymes: ["foolish", "ignorant", "unwise", "reckless"]
    },
    "work": {
        synonymes: ["labor", "toil", "effort", "task", "job", "occupation", "operate"],
        antonymes: ["rest", "relax", "play", "idle"]
    },
    "worry": {
        synonymes: ["concern", "anxiety", "fret", "unease", "stress", "trouble", "dread"],
        antonymes: ["calm", "reassurance", "relief", "peace"]
    },
    "write": {
        synonymes: ["compose", "draft", "pen", "record", "inscribe", "author", "note"],
        antonymes: ["read", "erase", "delete"]
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnglishSynonymsDictionary };
}
