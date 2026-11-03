"""Builds the French nav / footer fragments (content/fr/nav.plain.html, content/fr/footer.plain.html)
from the English ones, using the alc.ca header / footer experience fragments as a dictionary.

The EN and FR experience fragments on alc.ca have the same structure, so their text / link / image
tokens align 1:1. That alignment gives EN->FR maps for texts, alt texts, placeholders, link targets
(French slugs can differ, e.g. lottomax -> lotto-max) and images (French artwork). The English
fragment is then rewritten through those maps.

usage: python3 -I tools/importer/build-fr-fragments.py <en-home.html> <fr-home.html>
  (rendered DOM of alc.ca /content/alc/en.html and /content/alc/fr.html, saved by
   migration-work/scripts/render-signin.mjs)
Prints any text it could not translate. Downloads French images into content/images/fr-*.
"""
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ORIGIN = 'https://www.alc.ca'
SKIP = {'script', 'style', 'noscript', 'svg'}


class Tokens(HTMLParser):
    def __init__(self, marker):
        super().__init__(convert_charrefs=True)
        self.marker, self.depth, self.skip, self.out = marker, 0, 0, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.depth == 0:
            if tag == 'div' and (a.get('id') == self.marker or self.marker in (a.get('class') or '').split()):
                self.depth = 1
            return
        if tag == 'div':
            self.depth += 1
        if tag in SKIP:
            self.skip += 1
        if self.skip:
            return
        if tag == 'a':
            self.out.append(('A', a.get('href', ''), a.get('title', '') or ''))
        if tag == 'img':
            self.out.append(('IMG', a.get('src', '') or a.get('data-src', ''), a.get('alt', '') or ''))
        if tag == 'input' and a.get('placeholder'):
            self.out.append(('PH', a.get('placeholder'), ''))

    def handle_endtag(self, tag):
        if self.depth == 0:
            return
        if tag in SKIP and self.skip:
            self.skip -= 1
        if tag == 'div':
            self.depth -= 1

    def handle_data(self, data):
        if self.depth and not self.skip and data.strip():
            self.out.append(('T', ' '.join(data.split()), ''))


def tokens(path, marker):
    p = Tokens(marker)
    p.feed(open(path, encoding='utf-8').read())
    return p.out


def seg(s):
    s = unicodedata.normalize('NFD', urllib.parse.unquote(s).lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub('[^a-z0-9]+', '-', s).strip('-')


def doc(href):
    """alc.ca href -> migrated path (same rule as alc-cleanup.js rewriteLink)"""
    path = urllib.parse.urlparse(href).path
    if not path.startswith('/content/alc/'):
        return None
    p = re.sub(r'\.html?$', '', path[len('/content/alc'):].rstrip('/'))
    if p in ('', '/en'):
        return '/'
    if p == '/fr':
        return '/fr/'
    return '/' + '/'.join(seg(x) for x in p.split('/') if x)


def link_texts(toks):
    """{alc.ca path without the /content/alc/<lang> prefix: link text}"""
    out = {}
    for i, t in enumerate(toks):
        if t[0] == 'A' and i + 1 < len(toks) and toks[i + 1][0] == 'T':
            key = re.sub(r'^/content/alc/(en|fr)', '', urllib.parse.urlparse(t[1]).path)
            out.setdefault(key, toks[i + 1][1])
    return out


def build_maps(en_html, fr_html):
    text, href, img, link_text = {}, {}, {}, {}
    conflicts = set()
    # header and footer experience fragments (the sign-in panel does not align: see SIGN_IN)
    for part in ('cmp-experiencefragment--header', 'cmp-experiencefragment--footer'):
        en, fr = tokens(en_html, part), tokens(fr_html, part)
        if [t[0] for t in en] != [t[0] for t in fr]:
            sys.exit(f'{part}: EN/FR token streams do not align ({len(en)} vs {len(fr)})')
        # link texts by target: list order can differ between languages (footer lists do)
        en_links, fr_links = link_texts(en), link_texts(fr)
        for key, et in en_links.items():
            if key in fr_links and key not in ('', '.html'):
                link_text[(doc('/content/alc/en' + key), et)] = fr_links[key]
                link_text.setdefault((doc('/content/alc/en' + key), None), fr_links[key])
        last_href = None
        prev = None
        for (kind, ev, ex), (_, fv, fx) in zip(en, fr):
            after_link, prev = prev == 'A', kind
            if kind == 'T' and after_link and part.endswith('--footer'):
                continue  # footer link texts come from link_text (list order differs)
            if kind in ('T', 'PH'):
                if ev in text and text[ev] != fv:
                    conflicts.add(ev)
                text.setdefault(ev, fv)
            if kind == 'A':
                if ex and fx:
                    text.setdefault(ex, fx)
                de, df = doc(ev), doc(fv)
                # French slugs that differ (lottomax -> lotto-max): only the header keeps the same
                # order in both languages, so positional link pairs are trusted there only
                if part.endswith('--header') and de and df and de.startswith('/en/') \
                        and df.startswith('/fr/') and df != '/fr' + de[3:]:
                    href.setdefault(de, df)
                last_href = de
            if kind == 'IMG':
                if ex and fx:
                    text.setdefault(ex, fx)
                if ev != fv:
                    img[(last_href, ex)] = fv
                    img.setdefault((None, ex), fv)
    return text, href, img, link_text, conflicts


# The sign-in panel (#modal-login, rendered after clicking Sign In) is worded differently in French,
# so its tokens do not align: texts taken from the French panel on alc.ca.
SIGN_IN = {
    'Email': 'Adresse électronique',
    'Password': 'Mot de passe',
    'Show': 'Afficher',
    'Hide': 'Masquer',
    'Remember me': 'Mémoriser',
    'By signing in you confirm that you are 19 years of age or older, a resident of and physically located in Atlantic Canada.':
        "En ouvrant une session, vous confirmez être âgé d'au moins 19 ans, que vous êtes résident du Canada "
        'atlantique et que vous vous y trouvez bien.',
    'Forgot Password?': 'Mot de passe oublié?',
    'Forgot Email?': 'Adresse courriel oubliée?',
    'Create an Account': 'Créer un compte',
    'Register today to start playing': 'Créer un compte et commencer à jouer',
    'Buy lottery tickets': 'Achetez vos billets de loterie',
    'on the go.': 'en déplacement.',
    'Subscribe': 'Inscrivez-vous',
    'to your favourite draw games.': 'à vos jeux de loterie préférés.',
    'It’s fast, safe and secure.': 'C’est rapide et sécuritaire.',
    'Atlantic Lottery': 'Loto Atlantique',
    'Facebook': 'Facebook',
    'Instagram': 'Instagram',
    # footer: texts whose English wording / link target changed during the English migration
    'Are you sure you want to receive emails from Atlantic Lottery to the following address':
        'Êtes-vous sûr que tu veux recevoir des courriels par Loto Atlantique aux courriel suivant',
    'LEGAL AND PRIVACY': 'AVIS JURIDIQUE/VIE PRIVÉE',
    'Shopping Cart': 'Panier',  # icon link: alc.ca keeps the English title on both languages
    'HEALTHY PLAY POLICY': 'POLITIQUE DE JEU SAIN',
}
# Markup whose word order differs in French
HTML_FIXES = [
    ('<strong>Play</strong> <strong>Casino</strong> and <strong>Instant Win</strong> games.',
     '<strong>Jouez</strong> <strong>casino</strong> et <strong>lots instantanés</strong>.'),
]


def fr_href(h, href_map):
    if h == '/fr':
        return '/'  # language toggle -> English homepage
    if h == '/':
        return '/fr/'
    if h.startswith('/en/'):
        base, _, rest = h.partition('#')
        mapped = href_map.get(base, '/fr/' + base[len('/en/'):])
        return mapped + (f'#{rest}' if rest else '')
    return h


def localize(html, text_map, href_map, img_map, link_text, missing):
    done = set(link_text.values()) | set(text_map.values())  # already French
    for _, fr_fix in HTML_FIXES:
        done.update(re.findall(r'>([^<>]+)<', f'>{fr_fix}<'))
    done = {' '.join(d.split()) for d in done}

    def tr(s):
        key = ' '.join(s.split())
        if not key or key in done or not re.search('[A-Za-z]', key):
            return s
        if text_map.get(key):
            lead = s[:len(s) - len(s.lstrip())]
            trail = s[len(s.rstrip()):]
            return lead + text_map[key] + trail
        missing.add(key)
        return s

    # images: <a href="H"><img src="images/x" alt="A"> or bare <img>
    def img_sub(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        alt = (re.search(r'alt="([^"]*)"', tag) or [None, ''])[1]
        before = html[:m.start()]
        a = re.findall(r'<a href="([^"]+)"[^>]*>\s*$', before[-300:])
        key_href = a[-1] if a else None
        fr_src = img_map.get((key_href, alt)) or img_map.get((None, alt))
        if fr_src and src.startswith('images/'):
            local = f'images/fr-{os.path.basename(src)}'
            dest = os.path.join('content', local)
            if not os.path.exists(dest):
                urllib.request.urlretrieve(ORIGIN + fr_src, dest)
            tag = tag.replace(f'src="{src}"', f'src="{local}"')
        if alt:
            tag = tag.replace(f'alt="{alt}"', f'alt="{tr(alt)}"')
        # the French fragments live in /fr/: images are in the root images folder
        return tag.replace('src="images/', 'src="../images/')

    for en_html, fr_html in HTML_FIXES:
        html = html.replace(en_html, fr_html)
    out = re.sub(r'<img [^>]*>', img_sub, html)
    # link texts by target first (same English text can translate differently per link)
    def link_sub(m):
        target = m.group(1).partition('#')[0]
        key = (target, ' '.join(m.group(3).split()))
        # by target + English text; by target alone only when the English text is unknown
        fr_text = link_text.get(key) or (None if key[1] in text_map else link_text.get((target, None)))
        return f'{m.group(0)[:m.start(3) - m.start(0)]}{fr_text}</a>' if fr_text else m.group(0)
    out = re.sub(r'<a href="([^"]+)"([^>]*)>([^<>]+)</a>', link_sub, out)
    out = re.sub(r'href="([^"]+)"', lambda m: f'href="{fr_href(m.group(1), href_map)}"', out)
    out = re.sub(r'>([^<>]+)<', lambda m: f'>{tr(m.group(1))}<', out)
    return out


def main():
    text_map, href_map, img_map, link_text, conflicts = build_maps(sys.argv[1], sys.argv[2])
    text_map.update(SIGN_IN)
    # nav entries that differ from the alc.ca markup (rewritten during the English migration)
    href_map.setdefault('/en/play-online/lotto-games', '/fr/play-online/lotto-games')
    os.makedirs('content/fr', exist_ok=True)
    missing = set()
    for name in ('nav', 'footer'):
        src = open(f'content/{name}.plain.html', encoding='utf-8').read()
        out = localize(src, text_map, href_map, img_map, link_text, missing)
        open(f'content/fr/{name}.plain.html', 'w', encoding='utf-8').write(out)
        print(f'wrote content/fr/{name}.plain.html')
    for m in sorted(missing):
        print('UNTRANSLATED:', m)
    for c in sorted(conflicts):
        print('AMBIGUOUS (first FR used):', c, '->', text_map[c])


if __name__ == '__main__':
    main()
