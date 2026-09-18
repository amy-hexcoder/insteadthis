import json, glob, re, collections, os, sys
POSTS = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/insteadthis-content/content/posts"

TOPICS = ["relationships", "style", "wellness", "food", "travel", "culture", "home"]
CAT_MAP = {  # old WordPress category -> (topic, weight)
    "Personal": ("relationships", 3), "Red": ("relationships", 1),
    "Fashion": ("style", 4), "Beauty": ("style", 4), "Girly": ("style", 2),
    "Growth": ("wellness", 3), "Motivational": ("wellness", 3), "Inspiration": ("wellness", 3), "sports": ("wellness", 3),
    "Food": ("food", 5), "Travel": ("travel", 5),
    "Celebrity": ("culture", 4), "video": ("culture", 2), "News": ("culture", 2),
}
KW = {
    "relationships": r"relationship|love|dating|\bdate\b|marri|wedding|couple|partner|boyfriend|girlfriend|husband|wife|spouse|valentine|breakup|romance|romantic|intimacy|affair|askk?iara|friendship|friends?\b|family|parent|lgbt|kiss|prenup|gaslight|toxic|commit|mother'?s day|siblings?",
    "style": r"fashion|outfit|dress|beauty|makeup|skin|hair|nails?\b|lookbook|style|akira|boots?\b|shoes|jewel|wardrobe|closet|coat|jacket|jeans|skirt|heels|lipstick|perfume|fragrance|product ?reviews?|wallet|online shopping|shopping",
    "wellness": r"health|wellness|mental|anxiety|stress|meditat|yoga|workout|exercise|fitness|sleep|motivat|inspir|growth|productiv|procrastinat|habit|self-?love|self-?care|gratitude|mindful|period|uti\b|disease|immun|money|financ|career|employee|work culture|mentor|success|chess|swim|therapy|smoking|mood|small wins",
    "food": r"food|recipe|breakfast|coffee|drink|diet|eat|snack|fruit|chutney|oats|rice|cuisine|dish|chocolate|ice cream|thandai|bhang|brunch|dinner|lunch|meal",
    "travel": r"travel|trip|vacation|beach|backpack|destination|tour\b|tourism|camping|festival in|places to visit|norway|itinerar|wanderlust|getaway|packing",
    "culture": r"movie|film|netflix|song|music|playlist|spotify|book|novel|celebrit|bollywood|hollywood|diwali|holi\b|christmas|new year|lohri|easter|halloween|thanksgiving|rosh hashanah|losar|ganesh|navratri|festival|litfest|meme|tarot|santa|news|highlights|tech\b|technology|chatgpt|artificial intelligence|gadget|apple watch|nest mini|asmr|youtube|piano|school memories",
    "home": r"\bhome\b|interior|decor|plant|garden|flower|bouquet|bougainvillea|\bpets?\b|\bdogs?\b|\bcats?\b|cleaning|stainless|water waste|kitchen|bedroom|monsoon creatures|diapers",
}
KW = {k: re.compile(v, re.I) for k, v in KW.items()}
PRIORITY = {t: i for i, t in enumerate(["relationships", "style", "food", "travel", "wellness", "culture", "home"])}

def load(f):
    raw = open(f, encoding="utf-8").read()
    _, fm_txt, body = raw.split("---", 2)
    fm = {}
    for line in fm_txt.strip().splitlines():
        k, v = line.split(": ", 1); fm[k] = json.loads(v)
    return fm, body

def classify(fm, body):
    s = collections.Counter()
    for c in fm.get("categories", []):
        if c in CAT_MAP: t, w = CAT_MAP[c]; s[t] += w
    head = fm["title"] + " " + " ".join(fm.get("tags", []))
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)|\]\([^)]*\)", " ", body)
    for t, rx in KW.items():
        s[t] += 3 * min(len(rx.findall(head)), 2)
        s[t] += min(len(rx.findall(text)) / 4, 3)
    if not s or max(s.values()) < 1.5:
        return None, s
    best = sorted(s.items(), key=lambda kv: (-kv[1], PRIORITY[kv[0]]))[0][0]
    return best, s

if __name__ == "__main__":
    res = collections.Counter(); unclear = []
    for f in sorted(glob.glob(f"{POSTS}/*.md")):
        fm, body = load(f); t, s = classify(fm, body)
        res[t] += 1
        if t is None: unclear.append(fm["title"])
    print(res.most_common()); print("unclear:", unclear[:40])
