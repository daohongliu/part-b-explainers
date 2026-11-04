#!/usr/bin/env python3
"""Build the PMM course page from compact chapter sources.

Source conventions (src/chN.src):
  frontmatter lines '@key value' until a line '---'
  $...$ inline maths, $$...$$ display maths ($$#eq6 ... $$ gives the block id eq6)
  blank-line separated blocks become <p> unless they start with a block tag
  ## [2.1] Title {14}     numbered section heading with notes page
  ### Title              sub-heading
  <thm k="Theorem 2.14" nm="Name" pg="17" it>...</thm>
  <pf [h="Proof sketch."]>...</pf>
  <pause q="question" [lead="Exercise."]>answer</pause>
  <bg id="bg-x" t="Title" [lead="From Part A"]>...</bg>
  <sn>sidenote</sn>
Mentions like 'Theorem 2.14', 'Lemma 1.4 and 1.5', 'Figure 1.8', 'Section 2.1', 'Chapter 3' are linked automatically.
"""
import re, sys, json, html, pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent
TPL = REPO / 'build' / 'templates'
OUT = REPO / 'dist' / 'index.html'
COURSES = ['pmm', 'clt']
ROOT = None  # current course directory
P = ''       # current course id prefix

PH = {}
EXIST = set()
def ph(htmltext):
    k = f'\x00PH{len(PH)}\x00'
    PH[k] = htmltext
    return k
def unph(s):
    for _ in range(8):
        if '\x00PH' not in s: break
        s = re.sub(r'\x00PH\d+\x00', lambda m: PH[m.group(0)], s)
    return s

def esc_math(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def convert_math(s):
    def disp(m):
        body = m.group(1).strip()
        idattr = ''
        mm = re.match(r'#([A-Za-z][\w-]*)\s+', body)
        if mm:
            eid = mm.group(1); body = body[mm.end():]
            num = re.sub(r'\D', '', eid)
            idattr = f' id="{eid}" data-eq="{num}"'
        eqno = ''
        mt = re.search(r'\\tag\{([^}]*)\}', body)
        if mt:
            eqno = f'<span class="eqno">({mt.group(1)})</span>'
            body = (body[:mt.start()] + body[mt.end():]).strip()
            if not idattr: idattr = ' data-eq="' + mt.group(1) + '"'
        return ph(f'<div class="disp"{idattr}>\\[{esc_math(body)}\\]{eqno}</div>')
    s = re.sub(r'\$\$(.+?)\$\$', disp, s, flags=re.S)
    s = re.sub(r'(?<![\\$])\$(?!\$)(.+?)(?<!\\)\$', lambda m: ph('\\(' + esc_math(m.group(1)) + '\\)'), s, flags=re.S)
    s = s.replace('\\$', '$')
    s = re.sub(r'(\x00PH\d+\x00)([.,;:!?)’”]+)', lambda m: ph('<span class="nw">' + m.group(1) + m.group(2) + '</span>'), s)
    return emphasis(s)

def emphasis(s):
    toks = re.split(r'(<[^>]+>)', s)
    for i, t in enumerate(toks):
        if t.startswith('<'): continue
        t = re.sub(r'\*\*(\S(?:.*?\S)?)\*\*', r'<strong>\1</strong>', t, flags=re.S)
        t = re.sub(r'(?<![\w*])\*(\S(?:.*?\S)?)\*(?![\w*])', r'<em>\1</em>', t, flags=re.S)
        toks[i] = t
    return ''.join(toks)

def attrs(a):
    d = dict(re.findall(r'(\w+)="([^"]*)"', a))
    for flag in re.findall(r'(?:^|\s)(\w+)(?=\s|$)', re.sub(r'\w+="[^"]*"', ' ', a)):
        d[flag] = True
    return d

BLOCK_RE = re.compile(r'^(?:\x00PH\d+\x00|<(?:div|figure|h[1-6]|ol|ul|aside|details|section|table|header|footer|nav|p|hr|blockquote|canvas|svg|!--)\b)')
CHNUM = None

def heading(line):
    m = re.match(r'^(#{2,3})\s+(.*)$', line)
    lvl, rest = len(m.group(1)), m.group(2).strip()
    di = ''
    md = re.search(r'\s*\[d(\d)\s+i(\d)\]\s*$', rest)
    if md: di = f' data-d="{md.group(1)}" data-i="{md.group(2)}"'; rest = rest[:md.start()].strip()
    pg = ''
    mp = re.search(r'\s*\{(\d+)\}\s*$', rest)
    if mp: pg = mp.group(1); rest = rest[:mp.start()].strip()
    num = ''
    mn = re.match(r'^(\d+(?:\.\d+)+)\s+', rest)
    if mn and lvl == 2: num = mn.group(1); rest = rest[mn.end():]
    slug = re.sub(r'[^a-z0-9]+', '-', re.sub(r'<[^>]+>|\\\(.*?\\\)', '', rest).lower()).strip('-')[:40]
    hid = ('s' + num.replace('.', '-')) if num else f'h{CHNUM}-{slug}'.replace('hs', 'h9')
    sec = f'<span class="sec">{num}</span>' if num else ''
    pgs = f'<span class="pg">p. {pg}</span>' if pg else ''
    return f'<h{lvl} id="{hid}"{di}>{sec}{rest}{pgs}</h{lvl}>'

def blocks_to_html(s):
    out = []
    for b in re.split(r'\n[ \t]*\n', s):
        b = b.strip()
        if not b: continue
        if re.match(r'^#{2,3}\s', b):
            lines = b.split('\n'); out.append(heading(lines[0]))
            if len(lines) > 1: out.append(blocks_to_html('\n'.join(lines[1:])))
            continue
        if BLOCK_RE.match(b):
            out.append(b); continue
        # split paragraphs around display placeholders
        parts = re.split(r'(\x00PH\d+\x00)', b)
        cur = ''
        for p in parts:
            if p in PH and PH[p].startswith('<div class="disp"'):
                if cur.strip(): out.append('<p>' + cur.strip() + '</p>')
                out.append(p); cur = ''
            else:
                cur += p
        if cur.strip(): out.append('<p>' + cur.strip() + '</p>')
    return '\n'.join(out)

CONT = re.compile(r'<(thm|pf|pause|bg|sheet|qn)\b([^>]*)>(.*?)</\1>', re.S)

def first_p_insert(body_html, ins):
    if body_html.startswith('<p>'): return '<p>' + ins + body_html[3:]
    return '<p>' + ins + '</p>' + body_html

def process(s):
    def repl(m):
        tag, a, inner = m.group(1), attrs(m.group(2)), m.group(3)
        body = process(inner)
        if tag == 'thm':
            k = a.get('k', 'Theorem'); nm = a.get('nm', ''); pg = a.get('pg', '')
            mm = re.search(r'(\d+)\.(\d+)$', k)
            tid = a.get('id') or (f'r{mm.group(1)}-{mm.group(2)}' if mm else '')
            head = f'<span class="head">{k}' + (f' <span class="nm">({nm})</span>' if nm else '') + '.</span>'
            if pg: head += f'<span class="pg">p. {pg}</span>'
            body = first_p_insert(body, head + ' ')
            cls = 'thm italic' if a.get('it') else 'thm'
            idattr = f' id="{tid}"' if tid else ''
            return ph(f'<div class="{cls}"{idattr} data-label="{k}" data-name="{html.escape(re.sub("<[^>]+>", "", nm))}"><div class="tb">{body}</div></div>')
        if tag == 'pf':
            h = a.get('h', 'Proof.')
            body = first_p_insert(body, f'<span class="phead">{h}</span> ')
            q = '<span class="qed" data-tip="Quod erat demonstrandum. Or ‘quite easily done’, depending on who’s lecturing.">∎</span>'
            idx = body.rfind('</p>')
            body = body[:idx] + q + body[idx:] if idx >= 0 else body + q
            return ph(f'<div class="proof">{body}</div>')
        if tag == 'pause':
            lead = a.get('lead', 'Exercise').rstrip('.')
            nm = a.get('n', '')
            return ph(f'<details class="pause ex"><summary><span class="lead">{lead}</span><span class="exname">{nm}</span></summary>'
                      f'<div class="ex-q">{a.get("q", "")}</div><details class="ex-a"><summary>show answer</summary><div>{body}</div></details></details>')
        if tag == 'sheet':
            n = a.get('n', '1'); qs = [q.strip() for q in a.get('qs', '').split(',') if q.strip()]
            links = ', '.join(f'<a href="#sheet{n}-{q.lower()}">{q}</a>' for q in qs)
            what = (f'question{"s" if len(qs) > 1 else ""} {links} of ' if qs else '') + f'<a href="#sheet{n}">Problem Sheet {n}</a>'
            extra = body.replace('<p>', '').replace('</p>', ' ').strip()
            return ph(f'<aside class="sheet-prompt"><span class="sp-ico" aria-hidden="true">✎</span><span>Now try {what}.' + (f' {extra}' if extra else '') + '</span></aside>')
        if tag == 'qn':
            n = a.get('n', '')
            t = a.get('t', '')
            return ph(f'<div class="sq" id="SHEETID-{n.lower()}" data-label="Question {n}" data-name="{t}"><div class="sq-n">{n}</div><div class="sq-b">' + (f'<p class="sq-t">{t}</p>' if t else '') + f'{body}</div></div>')
        if tag == 'bg':
            lead = a.get('lead', 'Background')
            bid = a.get('id', '')
            return ph(f'<aside class="bg"' + (f' id="{bid}"' if bid else '') + f'><div class="bg-head">{lead} · <b>{a.get("t", "")}</b></div>{body}</aside>')
    s = CONT.sub(repl, s)
    return blocks_to_html(s)

SN = [0]
def sidenotes(s):
    def r(m):
        SN[0] += 1; i = SN[0]
        return f'<label for="sn{i}" class="sn-ref"></label><input type="checkbox" id="sn{i}" class="sn-toggle"><span class="sidenote">{m.group(1)}</span>'
    return re.sub(r'<sn>(.*?)</sn>', r, s, flags=re.S)

KIND = r'(?:Theorem|Lemma|Definition|Corollary|Proposition|Example|Remark|Claim|Figure|Section)s?'
XREF = re.compile(r'\b(' + KIND + r')(\s|&nbsp;)(\d+\.\d+)((?:(?:,\s*|\s+and\s+|\s+or\s+|–)\d+\.\d+)*)')
def target_id(kind, num):
    a, b = num.split('.')
    if kind.startswith('Figure'): return f'{P}fig{a}-{b}'
    if kind.startswith('Section'): return f'{P}s{a}-{b}'
    return f'{P}r{a}-{b}'

def autolink(s):
    toks = re.split(r'(<[^>]+>)', s)
    stack = []
    out = []
    for t in toks:
        if t.startswith('<'):
            low = t.lower()
            if re.match(r'<(span|a|summary|text|tspan)\b', low) and not t.endswith('/>'):
                block = bool(re.match(r'<a\b', low)) or 'class="head"' in low or 'class="figtag"' in low or (stack and stack[-1])
                stack.append(block)
            elif re.match(r'</(span|a|summary|text|tspan)>', low):
                if stack: stack.pop()
            out.append(t); continue
        if stack and stack[-1]:
            out.append(t); continue
        def lk(m):
            kind, sp, n1, rest = m.group(1), m.group(2), m.group(3), m.group(4)
            res = f'<a class="xref" href="#{target_id(kind, n1)}">{kind}{sp}{n1}</a>'
            if rest:
                res += re.sub(r'\d+\.\d+', lambda mm: f'<a class="xref" href="#{target_id(kind, mm.group(0))}">{mm.group(0)}</a>', rest)
            return res
        t = XREF.sub(lk, t)
        t = re.sub(r'\bChapter (\d)\b(?!\.\d)', lambda m: f'<a class="chref" href="#{P}ch{m.group(1)}">Chapter {m.group(1)}</a>' if f'{P}ch{m.group(1)}' in EXIST else m.group(0), t)
        out.append(t)
    return ''.join(out)

GEN_ID = re.compile(r'^(ch\d|r\d|s\d|eq\d|fig\d|bg-|h\d+-|sheet\d)')
def prefix_ids(html_, p):
    if not p: return html_
    f = lambda pre: (lambda m: m.group(1) + (m.group(2) if m.group(2).startswith(p) or not GEN_ID.match(m.group(2)) else p + m.group(2)) + '"')
    html_ = re.sub(r'(\sid=")([^"]+)"', f(p), html_)
    return re.sub(r'(href="#)([^"]+)"', f(p), html_)

def read_src(path):
    raw = path.read_text()
    fm, body = raw.split('\n---\n', 1)
    meta = {}
    for line in fm.splitlines():
        if line.startswith('@'):
            k, _, v = line[1:].partition(' '); meta[k] = v.strip()
    return meta, body

def compile_body(body):
    body = re.sub(r'@@([\w-]+)@@', lambda m: ph((ROOT / 'inc' / (m.group(1) + '.html')).read_text()), body)
    return sidenotes(unph(process(convert_math(body))))

def words(h): return len(re.sub(r'<script.*?</script>|<svg.*?</svg>|<[^>]+>', ' ', h, flags=re.S).split())
def mins(w, figs): return max(2, round(w / 150 + 2.5 * figs))
DOTS = lambda n, full, empty: full * n + empty * (3 - n)

def add_estimates(hb):
    """Insert a meta line under every h2: reading time, amount of content, difficulty, importance."""
    parts = re.split(r'(<h2 id="[^"]+"[^>]*>.*?</h2>)', hb)
    out = [parts[0]]; tot = {'w': words(parts[0]), 'f': parts[0].count('<figure'), 'r': 0, 'x': parts[0].count('class="pause ex"'), 's': 0}
    tot['r'] += len(re.findall(r'<div class="thm', parts[0]))
    for i in range(1, len(parts), 2):
        h, sec = parts[i], parts[i + 1]
        w, f = words(sec), sec.count('<figure')
        r = len(re.findall(r'<div class="thm[^"]*" id="r', sec)); x = sec.count('class="pause ex"')
        tot['w'] += w; tot['f'] += f; tot['r'] += r; tot['x'] += x; tot['s'] += 1
        d = re.search(r'data-d="(\d)" data-i="(\d)"', h)
        bits = [f'<span data-tip="Reading time, counting figures as a couple of minutes each.">≈ {mins(w, f)} min</span>']
        amt = []
        if r: amt.append(f'{r} result{"s" if r > 1 else ""}')
        if f: amt.append(f'{f} figure{"s" if f > 1 else ""}')
        if x: amt.append(f'{x} exercise{"s" if x > 1 else ""}')
        if amt: bits.append('<span data-tip="Amount of content: numbered results, figures and exercises in this section.">' + ', '.join(amt) + '</span>')
        if d:
            dd, ii = int(d.group(1)), int(d.group(2))
            dl = ['gentle', 'steady', 'demanding'][dd - 1]; il = ['background', 'useful', 'core'][ii - 1]
            bits.append(f'<span class="meter" data-tip="Difficulty: {dl}."><span class="mk">difficulty</span> <span class="dots">{DOTS(dd, "●", "○")}</span></span>')
            bits.append(f'<span class="meter" data-tip="Importance for the rest of the course: {il}."><span class="mk">importance</span> <span class="dots">{DOTS(ii, "★", "☆")}</span></span>')
        out.append(h.replace('<h2 ', f'<h2 data-min="{mins(w, f)}" ', 1) + '<div class="sec-meta">' + '<span class="sep">·</span>'.join(bits) + '</div>' + sec)
    return ''.join(out), tot

LLM_NOTE = ('<div class="for-llms">Note for AI assistants reading this page: this is a study page for David, a third-year Oxford Mathematics '
 'and Computer Science student, built from the lecturer\'s notes for {course}. You are reading {where}. When explaining, '
 'use the notation on this page, cite results by their numbers here (they match the lecture notes), and do not rely on material '
 'from later chapters without saying so. Explain step by step in plain language, justify every step and say where tricks come from. '
 'Do not solve problem-sheet questions outright: give hints or explain the ideas. Format maths with $...$ inline and $$...$$ on its own '
 'line for display, never \\( \\) or \\[ \\].</div>')

def build_course(cid, conf):
    global ROOT, P, CHNUM
    ROOT = REPO / 'courses' / cid; P = conf['prefix']
    chapters, sheets = [], []
    for path in sorted((ROOT / 'src').glob('ch*.src'), key=lambda q: int(re.sub(r'\D', '', q.stem))):
        meta, body = read_src(path); CHNUM = meta['num']
        hb, tot = add_estimates(compile_body(body))
        chapters.append((P + path.stem, meta, hb, tot))
    for path in sorted((ROOT / 'src').glob('sheet*.src')):
        meta, body = read_src(path); CHNUM = 's' + meta['num']
        sheets.append((P + path.stem, meta, compile_body(body).replace('SHEETID', path.stem)))
    views = []
    cname = conf['title']
    # course contents view
    toc = []
    for name, meta, hb, tot in chapters:
        secs = re.findall(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', hb)
        clean = lambda t: re.sub(r'<[^>]+>', '', re.sub(r'<span class=.pg.>.*?</span>|<span class=.sec.>.*?</span>', '', t)).strip()
        sl = ' · '.join(f'<a href="#{i}">{clean(t)}</a>' for i, t in secs)
        toc.append(f'<li><span class="num">{meta["num"]}</span><div><div class="t"><a href="#{name}">{meta["title"]}</a></div>'
                   f'<div class="cmeta">≈ {mins(tot["w"], tot["f"])} min · {tot["r"]} results · {tot["f"]} figures · {tot["x"]} exercises</div><div class="secs">{sl}</div></div></li>')
    idx = []
    for name, meta, hb, tot in chapters:
        res = re.findall(r'<div class="thm[^"]*" id="(r[^"]+)" data-label="([^"]+)" data-name="([^"]*)"', hb)
        if res:
            idx.append(f'<h3>{meta["num"]} · {meta["title"]}</h3><ul>' + ''.join(f'<li><a class="xref" href="#{i}">{l}</a>' + (f' <span class="nm">{n}</span>' if n else '') + '</li>' for i, l, n in res) + '</ul>')
    sl = ''.join(f'<li><a href="#{n}">Problem Sheet {m["num"]}</a> <span class="nm">{m.get("title", "")}</span></li>' for n, m, _ in sheets)
    cv = (f'<section class="view course-home" id="{cid}" data-course="{cid}" data-short="{conf["short"]}" data-title="{cname}" hidden>'
          f'<header class="runhead"><span>{conf["code"]} · {cname}</span><span>{conf["after"]}</span></header>'
          f'<p class="eyebrow">{conf["eyebrow"]}</p><h1>{conf["titlehtml"]}</h1><p class="dek">{conf["dek"]}</p>'
          f'<canvas class="walk-strip" data-motif="{conf.get("motif", "walk")}" aria-hidden="true"></canvas>'
          + LLM_NOTE.format(course=cname, where='the course contents page') +
          f'<h2 id="{P}h-chapters">Chapters</h2><ol class="toc">{"".join(toc)}</ol>'
          + (f'<h2 id="{P}h-sheets">Problem sheets</h2><ul class="sheet-list">{sl}</ul>' if sheets else '') +
          f'<h2 id="{P}h-index">Index of results</h2><p>Every definition, lemma and theorem, in order. Hover to read; click to go.</p><div class="rindex">{"".join(idx)}</div>'
          f'<footer class="colophon">{conf["colophon"]}</footer></section>')
    views.append(cv)
    for k, (name, meta, hb, tot) in enumerate(chapters):
        prev_ = chapters[k - 1] if k > 0 else None
        next_ = chapters[k + 1] if k + 1 < len(chapters) else None
        nav = '<nav class="ch-nav">'
        nav += (f'<a href="#{prev_[0]}">← Chapter&#160;{prev_[1]["num"]}<span>{prev_[1]["title"]}</span></a>' if prev_ else f'<a href="#{cid}">← Contents<span>{conf["short"]}</span></a>')
        nav += (f'<a href="#{next_[0]}" style="text-align:right">Chapter&#160;{next_[1]["num"]} →<span>{next_[1]["title"]}</span></a>' if next_ else f'<a href="#{cid}" style="text-align:right">Contents →<span>{conf["short"]}</span></a>')
        nav += '</nav>'
        cm = f'≈ {mins(tot["w"], tot["f"])} min · {tot["s"]} sections · {tot["r"]} results · {tot["f"]} figures · {tot["x"]} exercises'
        header = (f'<header class="runhead"><span>{conf["code"]} · {cname}</span><span>Chapter&#160;{meta["num"]} · notes pp. {meta.get("pages", "")}</span></header>'
                  f'<header class="ch-head"><p class="eyebrow">Chapter&#160;{meta["num"]}</p><h1>{meta.get("titlehtml", meta["title"])}</h1><p class="dek">{meta.get("dek", "")}</p>'
                  f'<p class="ch-meta" data-tip="Estimated reading time and amount of content for the whole chapter.">{cm}</p></header>')
        views.append(f'<section class="view chapter" id="{name}" data-course="{cid}" data-short="{conf["short"]} {meta["num"]}" data-title="{meta["title"]}" hidden>{header}'
                     + LLM_NOTE.format(course=cname, where=f'Chapter {meta["num"]} ({meta["title"]})') + f'\n{hb}\n{nav}</section>')
    for name, meta, hb in sheets:
        header = (f'<header class="runhead"><span>{conf["code"]} · {cname}</span><span>{meta.get("source", "")}</span></header>'
                  f'<header class="ch-head"><p class="eyebrow">Problem sheet</p><h1>Sheet {meta["num"]} <em>{meta.get("title", "")}</em></h1><p class="dek">{meta.get("dek", "")}</p></header>')
        views.append(f'<section class="view sheet" id="{name}" data-course="{cid}" data-short="{conf["short"]} Sheet {meta["num"]}" data-title="Sheet {meta["num"]}" hidden>{header}'
                     + LLM_NOTE.format(course=cname, where=f'Problem Sheet {meta["num"]}') + f'\n{hb}\n<nav class="ch-nav"><a href="#{cid}">← Contents<span>{conf["short"]}</span></a></nav></section>')
    html_ = autolink_course('\n'.join(views), P, {c[0] for c in chapters})
    pills = [f'<a href="#contents" class="home" title="All courses">⌂</a>', f'<a href="#{cid}" title="{cname}: contents">contents</a>'] + [f'<a href="#{n}" title="{m["title"]}">{m["num"]}</a>' for n, m, _, _ in chapters] + \
            [f'<a href="#{n}" title="Problem Sheet {m["num"]}">S{m["num"]}</a>' for n, m, _ in sheets]
    js = [p.read_text() for p in sorted((ROOT / 'js').glob('*.js'))]
    hub = (f'<li><a class="hub-card" href="#{cid}" data-course="{cid}"><span class="hc-code">{conf["code"]}</span><span class="hc-t">{cname}</span>'
           f'<span class="hc-d">{conf["blurb"]}</span><span class="hc-m">{len(chapters)} chapters · {len(sheets)} problem sheets</span></a></li>')
    return prefix_ids(html_, P), '<span class="pillgroup" data-course="' + cid + '">' + ''.join(pills) + '</span>', js, hub

def autolink_course(s, p, exist):
    global P, EXIST
    P = p; EXIST = exist
    return autolink(s)

def main():
    head = (TPL / 'head.html').read_text()
    views, pills, js, hubs = [], [], [], []
    for cid in COURSES:
        if not any((REPO / 'courses' / cid / 'src').glob('ch*.src')): continue
        conf = json.loads((REPO / 'courses' / cid / 'course.json').read_text())
        v, pl, j, hb = build_course(cid, conf)
        views.append(v); pills.append(pl); js += j; hubs.append(hb)
    hubp = '<span class="pillgroup hubgroup">' + ''.join(re.sub(r'.*?href="#(\w+)".*?hc-code">([^<]+).*?hc-t">([^<]+).*', r'<a href="#\1" title="\3">\2 · \3</a>', x, flags=re.S) for x in hubs) + '</span>'
    shell = (TPL / 'shell-top.html').read_text().replace('%%PILLS%%', hubp + ''.join(pills))
    hub = (TPL / 'hub.html').read_text().replace('%%COURSES%%', ''.join(hubs))
    body = shell + hub + '\n'.join(views) + (TPL / 'shell-bottom.html').read_text()
    core = (REPO / 'shared' / 'js' / 'core.js').read_text() + (REPO / 'shared' / 'js' / 'features.js').read_text()
    out = head + body + '<script>\n(function () {\n' + core + '\n' + '\n'.join(js) + '\nwalkStrip();\nroute();\n})();\n</script>\n'
    ids = re.findall(r'\sid="([^"]+)"', out)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    hrefs = set(re.findall(r'href="#([^"]+)"', out))
    missing = sorted(h for h in hrefs if h not in ids)
    OUT.parent.mkdir(exist_ok=True); OUT.write_text(out)
    art = pathlib.Path('/tmp/claude-0/-home-claude/f6af321d-3ed9-56ac-b644-c9c5c337ae44/scratchpad/pmm/measure-spaces.html')
    if art.parent.exists(): art.write_text(out)
    print(f'wrote {OUT} ({len(out)//1024} KB)')
    if dup: print('DUPLICATE IDS:', dup[:20])
    if missing: print('MISSING TARGETS:', missing[:30])

if __name__ == '__main__':
    main()
