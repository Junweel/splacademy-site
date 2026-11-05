#!/usr/bin/env python3
"""SPLA site v1 — gerador estático simples (sem dependências).
Uso: python3 build.py [--prod]
  padrão  = PRÉVIA (noindex + robots Disallow), para github.io
  --prod  = produção (indexável), só quando o Joël aprovar o domínio.
"""
import json, re, shutil, sys, html
from pathlib import Path

ROOT = Path(__file__).parent
PROD = '--prod' in sys.argv
SRC, OUT = ROOT / 'src', ROOT / ('site-prod' if PROD else 'site')  # prod vai para pasta separada; a prévia não é sobrescrita
CANON = 'https://splacademy.com.br/'
VERSION = '1.0.0'
PREVIEW_BASE = '/splacademy-site/'  # caminho no github.io (prévia)
WA = 'https://wa.me/5511981783554'
EMAIL = 'contact@splacademy.com.br'

ICON = {
 'wa': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.8 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.6.4 1 .6 1.3.7.2.1.4 0 .5-.1l.6-.8c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .5-.2 1.2-.8 1.5-.5.3-1.3.5-2.6 0a10 10 0 0 1-4.6-4.2c-.6-1.1-.8-2-.4-2.9Z" fill="currentColor"/></svg>',
 'mail': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 'menu': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 'close': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 'send': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}
MARK = ('<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0B1119"/>'
        '<path transform="translate(12.16 12.16) scale(0.496)" d="M20 10 10 10 0 0 0 10 0 20 10 20ZM40 20 50 20 60 10 50 10 40 0 30 0 20 10 30 10ZM0 30 10 30 20 40 30 40 40 30 30 30 20 20 10 20ZM10 60 20 50 10 50 0 40 0 50 0 60ZM20 50 30 50 40 60 50 60 60 50 50 50 40 40 30 40ZM20 80 30 80 40 70 30 70 20 60 10 60 0 70 10 70ZM40 30 50 30 60 40 70 40 80 30 70 30 60 20 50 20ZM60 80 70 80 80 70 70 70 60 60 50 60 40 70 50 70ZM80 10 80 0 70 0 60 10 70 10 80 20ZM80 60 80 50 80 40 70 40 60 50 70 50Z" fill="#F3EBDD"/></svg>')

def load(p): return json.loads((SRC / p).read_text(encoding='utf-8'))

def page_meta(text):
    m = re.match(r'\s*<!--meta\s*(\{.*?\})\s*-->', text, re.S)
    if not m: raise SystemExit('meta ausente')
    return json.loads(m.group(1)), text[m.end():]

def pic_html(m, root):
    """{{pic:nome|alt|sizes}} -> <picture> avif+webp 360/720 (3:4) com lazy-load."""
    parts = m.group(1).split('|')
    name, alt = parts[0], parts[1] if len(parts) > 1 else ''
    sizes = parts[2] if len(parts) > 2 else '(min-width:1000px) 380px, 84vw'
    base = f'{root}assets/img/v1/{name}'
    return (f'<picture><source type="image/avif" srcset="{base}-360.avif 360w, {base}-720.avif 720w" sizes="{sizes}">'
            f'<img src="{base}-720.webp" srcset="{base}-360.webp 360w, {base}-720.webp 720w" sizes="{sizes}" width="720" height="960" alt="{html.escape(alt)}" loading="lazy" decoding="async"></picture>')

def faq_html(faq, root):
    out = ['<div class="faq">']
    for f in faq:
        a = f['a'].replace('{{root}}', root)
        out.append(f'<details id="faq-{f["id"]}"><summary>{html.escape(f["q"])}</summary><div>{a}</div></details>')
    out.append('</div>')
    return '\n'.join(out)

def layout(t, meta, body, slug, lang_codes, url_path, root):
    is_pt = t['lang'] == 'pt-BR'
    title = meta['title']
    full_title = title if title.startswith('SPLA') else f'{title} · SPLA São Paulo Languages Academy'
    desc = meta['description']
    canon = CANON + url_path
    nav = ''.join(f'<li><a href="{root}{s}/"{" aria-current=\"page\"" if s == slug else ""}>{l}</a></li>' for s, l in t['nav'])
    drawer = ''.join(f'<li><a href="{root}{s}/"{" aria-current=\"page\"" if s == slug else ""}>{l}</a></li>' for s, l in t['nav'])
    # alternates
    alts = ''
    if meta.get('alt_en', slug == 'home'):
        alts = (f'<link rel="alternate" hreflang="pt-BR" href="{CANON}{"" if slug=="home" else slug+"/"}">'
                f'<link rel="alternate" hreflang="en" href="{CANON}en/">'
                f'<link rel="alternate" hreflang="x-default" href="{CANON}">')
    pt_href = f'{root}' if not is_pt else f'{root}{"" if slug=="home" else slug+"/"}'
    en_href = f'{root}en/'
    lang_sw = (f'<nav class="lang" aria-label="Idioma / Language">'
               f'<a href="{pt_href}" hreflang="pt-BR" lang="pt-BR"{" aria-current=\"true\"" if is_pt else ""}>PT</a>'
               f'<a href="{en_href}" hreflang="en" lang="en"{"" if is_pt else " aria-current=\"true\""}>EN</a></nav>')
    robots = '' if PROD else '<meta name="robots" content="noindex, nofollow">'
    wa_top = WA + '?text=' + ('Oi%2C%20SPLA!%20Quero%20come%C3%A7ar.' if is_pt else 'Hi%2C%20SPLA!')
    cta_top = f'<a class="btn" href="{root}contato/#diagnostico">{t["cta_top"]}</a>' if is_pt else f'<a class="btn" href="mailto:{EMAIL}">{t["cta_top"]}</a>'
    head_extra = meta.get('head', '')
    scripts = ''
    if is_pt:
        scripts += f'<script>window.SPLA_I18N={json.dumps(t["js"], ensure_ascii=False)};</script>'
        scripts += f'<script src="{root}assets/js/faq.pt-BR.js?v={VERSION}" defer></script>'
    if meta.get('dialogs'):
        scripts += f'<script>window.SPLA_DIALOGS={json.dumps(load("data/dialogs.pt-BR.json"), ensure_ascii=False)};</script>'
    scripts += f'<script src="{root}assets/js/site.js?v={VERSION}" defer></script>'
    sophia = ''
    if is_pt:
        sophia = f'''
<button class="sophia-fab" type="button" aria-controls="sophia" aria-expanded="false" data-magnetic><span class="sophia-fab__face"><img src="{root}assets/img/v1/sophia-face-96.webp" alt="" width="44" height="44"></span><span class="sophia-fab__t">{t["sp_open"]}</span></button>
<section class="sp" id="sophia" role="dialog" aria-modal="false" aria-labelledby="sp-title" aria-hidden="true">
  <div class="sp__head">
    <div class="sp__face"><img src="{root}assets/img/v1/sophia-face-192.webp" alt="Sophia, tutora de IA da SPLA, em 3D" width="64" height="64"></div>
    <div class="sp__title" id="sp-title">{t["sp_title"]}<small>{t["sp_sub"]}</small></div>
    <button class="iconbtn sp__close" type="button" aria-label="{t["sp_close"]}">{ICON["close"]}</button>
  </div>
  <div class="sp__log" aria-live="polite"></div>
  <div class="sp__chips"></div>
  <form class="sp__form" autocomplete="off"><label class="sr-only" for="sp-in">{t["sp_placeholder"]}</label><input id="sp-in" type="text" placeholder="{t["sp_placeholder"]}" maxlength="200"><button type="submit" aria-label="{t["sp_send"]}">{ICON["send"]}</button></form>
  <p class="sp__note">{t["sp_note"]}</p>
</section>'''
    foot_links = ''.join(f'<li><a href="{root}{s}/">{l}</a></li>' for s, l in t['nav'])
    preview_note = '' if PROD else f'<span>{t["foot_preview"]} v{VERSION}.</span>'
    ogimg = CANON + 'assets/img/og.png'
    jsonld = '<script type="application/ld+json">' + json.dumps({
        '@context': 'https://schema.org', '@type': ['EducationalOrganization', 'LocalBusiness'],
        'name': 'SPLA · São Paulo Languages Academy', 'url': CANON, 'logo': CANON + 'assets/img/icon-512.png', 'image': ogimg,
        'email': EMAIL, 'telephone': '+55 11 98178-3554',
        'address': {'@type': 'PostalAddress', 'streetAddress': 'Av. Paulista, 1106, Sala 01, Andar 16', 'addressLocality': 'São Paulo',
                    'addressRegion': 'SP', 'postalCode': '01310-914', 'addressCountry': 'BR'},
        'parentOrganization': {'@type': 'Organization', 'name': 'SIIN ANALYTICS SISTEMAS INFORMATICOS LTDA', 'url': 'https://siincompany.com', 'taxID': '54.575.722/0001-01'},
        'areaServed': 'BR', 'inLanguage': ['pt-BR', 'en']}, ensure_ascii=False) + '</script>'
    return f'''<!doctype html>
<html lang="{t["lang"]}" data-root="{root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(full_title)}</title>
<meta name="description" content="{html.escape(desc)}">
{robots}
<link rel="canonical" href="{canon}">
{alts}
<meta name="theme-color" content="#FAF7F1">
<meta name="generator" content="SPLA build v{VERSION} · SIIN">
<link rel="icon" href="{root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{root}assets/img/apple-touch-icon.png">
<link rel="manifest" href="{root}manifest.webmanifest">
<link rel="preload" href="{root}assets/fonts/source-sans-3-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{root}assets/fonts/space-grotesk-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{root}assets/css/site.css?v={VERSION}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SPLA · São Paulo Languages Academy">
<meta property="og:locale" content="{t["og_locale"]}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{ogimg}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SPLA · Sophia, a tutora de IA em 3D, numa chamada de voz">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(title)}">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{ogimg}">
{jsonld if slug == 'home' else ''}
{head_extra}
</head>
<body>
<a class="skip" href="#main">{t["skip"]}</a>
<div class="progress" aria-hidden="true"><i></i></div>
<header class="top">
  <div class="wrap top__in">
    <a class="logo" href="{root}{t["prefix"]}">{MARK}<span class="logo__t"><b>São Paulo</b> <span>Languages Academy</span></span></a>
    {f'<nav class="nav" aria-label="Principal"><ul>{nav}</ul></nav>' if nav else ''}
    <div class="top__end">{lang_sw}{cta_top}
    {f'<button class="burger" type="button" aria-controls="drawer" aria-expanded="false" aria-label="{t["menu"]}">{ICON["menu"]}</button>' if nav else ''}</div>
  </div>
</header>
{f'<nav class="drawer" id="drawer" aria-label="Menu"><ul><li><a href="{root}">Início</a></li>{drawer}</ul><a class="btn btn--yellow" href="{root}contato/#diagnostico">{t["cta_top"]}</a></nav>' if nav else ''}
<main id="main">
{body}
</main>
<footer class="foot">
  <div class="foot__strip" aria-hidden="true"></div>
  <div class="wrap">
    <p class="foot__big" aria-hidden="true" data-foot-big>São Paulo · Tamo junto ·</p>
    <div class="foot__grid">
      <div><a class="logo" href="{root}{t["prefix"]}">{MARK}<span class="logo__t"><b>São Paulo</b> <span>Languages Academy</span></span></a><p>{t["foot_about"]}</p></div>
      <div><h2>{t["foot_site"]}</h2><ul>{foot_links or f'<li><a href="{root}">Português</a></li>'}</ul></div>
      <div><h2>{t["foot_more"]}</h2><ul><li><a href="{root}contato/#faq">{t["foot_faq"]}</a></li>{'<li><a href="#sophia" data-open-sophia>'+t["foot_sophia"]+'</a></li>' if is_pt else ''}<li><a href="{root}privacidade/">{t["foot_privacy"]}</a></li></ul></div>
      <div><h2>{t["foot_talk"]}</h2><ul><li><a href="mailto:{EMAIL}">{EMAIL}</a></li><li><a href="{wa_top}" target="_blank" rel="noopener">{t["wa_label"]} +55 11 9 8178-3554</a></li><li><span>São Paulo, SP</span></li></ul></div>
    </div>
    <div class="foot__legal"><a class="foot__siin" href="https://siincompany.com" target="_blank" rel="noopener"><img src="{root}assets/img/siin/siin-icon.svg" alt="" width="28" height="28" loading="lazy"><span>{t["foot_tech"]}</span></a><span>{t["foot_legal"]}</span><span>{t["foot_chars"]}</span><span>{t["foot_credit"]}</span>{preview_note}</div>
  </div>
</footer>
{sophia}
{scripts}
</body>
</html>'''

def minify_css(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s*([{};,>])\s*', r'\1', s)
    return s.replace(';}', '}').strip()

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    # assets
    for sub in ['fonts', 'img', 'js', 'vendor', 'media', 'audio']:
        shutil.copytree(SRC / 'assets' / sub, OUT / 'assets' / sub)
    (OUT / 'assets/css').mkdir(parents=True)
    (OUT / 'assets/css/site.css').write_text(minify_css((SRC / 'assets/css/site.css').read_text(encoding='utf-8')), encoding='utf-8')
    faq = load('data/faq.pt-BR.json')
    (OUT / 'assets/js/faq.pt-BR.js').write_text('window.SPLA_FAQ=' + json.dumps(faq, ensure_ascii=False) + ';', encoding='utf-8')
    urls = []
    for lang_dir in ['pt-BR', 'en']:
        t = load(f'i18n/{lang_dir}.json')
        for f in sorted((SRC / 'pages' / lang_dir).glob('*.html')):
            slug = f.stem
            meta, body = page_meta(f.read_text(encoding='utf-8'))
            if slug == 'home': rel = t['prefix']
            elif slug == '404': rel = None
            else: rel = t['prefix'] + slug + '/'
            depth = 0 if rel is None else rel.count('/')
            root = '../' * depth
            body = re.sub(r'\{\{pic:([^}]*)\}\}', lambda m: pic_html(m, root), body)
            body = body.replace('{{root}}', root).replace('{{wa}}', WA).replace('{{email}}', EMAIL)
            for k, v in ICON.items(): body = body.replace('{{icon:' + k + '}}', v)
            if '{{faq}}' in body: body = body.replace('{{faq}}', faq_html(faq, root))
            if slug == '404':
                # 404 é servido em qualquer profundidade: caminhos absolutos do projeto
                root = '/' if PROD else PREVIEW_BASE
                body = body.replace('{{root}}', root)
            html_out = layout(t, meta, body, slug, None, ('404.html' if rel is None else rel), root if slug != '404' else root)
            dest = OUT / (rel or '') / ('index.html' if rel is not None else '404.html')
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(html_out, encoding='utf-8')
            if rel is not None and not meta.get('nositemap'):
                urls.append((rel, meta.get('priority', '0.7')))
    # sitemap, robots, manifest, nojekyll
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for rel, pr in urls: sm.append(f'  <url><loc>{CANON}{rel}</loc><priority>{pr}</priority></url>')
    sm.append('</urlset>')
    (OUT / 'sitemap.xml').write_text('\n'.join(sm) + '\n', encoding='utf-8')
    robots = (f'User-agent: *\nAllow: /\n\nSitemap: {CANON}sitemap.xml\n' if PROD else
              '# PRÉVIA: não indexar. Trocar ao publicar no domínio oficial (python3 build.py --prod).\nUser-agent: *\nDisallow: /\n')
    (OUT / 'robots.txt').write_text(robots, encoding='utf-8')
    (OUT / 'manifest.webmanifest').write_text(json.dumps({
        'name': 'SPLA · São Paulo Languages Academy', 'short_name': 'SPLA', 'lang': 'pt-BR', 'start_url': './',
        'display': 'browser', 'background_color': '#FAF7F1', 'theme_color': '#FAF7F1',
        'icons': [{'src': 'assets/img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, ensure_ascii=False), encoding='utf-8')
    (OUT / '.nojekyll').write_text('')
    print(f'ok · {len(urls)} páginas no sitemap · {"PRODUÇÃO" if PROD else "PRÉVIA (noindex)"}')

if __name__ == '__main__':
    main()
