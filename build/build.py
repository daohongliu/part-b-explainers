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
    hid = ('s' + num.replace('.', '-')) if num else f'h{CHNUM}-{slug}'
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
            return ph(f'<div class="sq" id="SHEETID-{n.lower()}"><div class="sq-n">{n}</div><div class="sq-b">{body}</div></div>')
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
    if kind.startswith('Figure'): return f'fig{a}-{b}'
    if kind.startswith('Section'): return f's{a}-{b}'
    return f'r{a}-{b}'

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
        t = re.sub(r'\bChapter (\d)\b(?!\.\d)', lambda m: f'<a class="chref" href="#ch{m.group(1)}">Chapter {m.group(1)}</a>' if f'ch{m.group(1)}' in EXIST else m.group(0), t)
        out.append(t)
    return ''.join(out)

