// Source parsing: front matter, sections, fenced directives and attribute lists.
import * as yaml from 'js-yaml';

export function splitFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: src };
  return { meta: yaml.load(m[1]) || {}, body: src.slice(m[0].length) };
}

// Parses `{#id .cls key=value key="value with spaces"}` into an object.
export function parseAttrs(str) {
  const out = { classes: [] };
  if (!str) return out;
  const s = str.trim().replace(/^\{|\}$/g, '');
  const re = /#([\w:-]+)|\.([\w-]+)|([\w-]+)=("(?:[^"\\]|\\.)*"|'[^']*'|[^\s]+)|([\w-]+)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) out.id = m[1];
    else if (m[2]) out.classes.push(m[2]);
    else if (m[3]) {
      let v = m[4];
      if (/^".*"$/.test(v)) v = v.slice(1, -1).replace(/\\"/g, '"');
      else if (/^'.*'$/.test(v)) v = v.slice(1, -1);
      out[m[3]] = v;
    } else if (m[5]) out[m[5]] = true;
  }
  return out;
}

// Splits a chapter body into an intro chunk and `## ` sections (with `### ` kept inside).
export function splitSections(body) {
  const lines = body.split('\n');
  const sections = [];
  let cur = { heading: null, lines: [] };
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^##\s+(.*?)\s*(\{[^}]*\})?\s*$/);
    if (h && !line.startsWith('###')) {
      sections.push(cur);
      cur = { heading: h[1], attrs: parseAttrs(h[2]), lines: [] };
    } else cur.lines.push(line);
  }
  sections.push(cur);
  return sections.map((s) => ({ ...s, text: s.lines.join('\n') }));
}

// Parses colon-fenced directives into a tree of {type:'md'|'dir'} nodes.
// An opening fence is `:::name{attrs}` (3+ colons); it is closed by a bare fence with the same number of colons.
export function parseBlocks(text, file = '') {
  const lines = text.split('\n');
  const root = { children: [] };
  const stack = [{ node: root, colons: 0 }];
  let buf = [];
  let inFence = false;
  const flush = () => {
    if (buf.length) {
      const t = buf.join('\n');
      if (t.trim()) stack[stack.length - 1].node.children.push({ type: 'md', text: t });
      buf = [];
    }
  };
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) { buf.push(line); return; }
    const open = line.match(/^(:{3,})([a-z][\w-]*)\s*(\{.*\})?\s*$/);
    const close = line.match(/^(:{3,})\s*$/);
    if (open) {
      flush();
      const node = { type: 'dir', name: open[2], attrs: parseAttrs(open[3]), children: [], line: i + 1 };
      stack[stack.length - 1].node.children.push(node);
      stack.push({ node, colons: open[1].length });
    } else if (close && stack.length > 1 && close[1].length === stack[stack.length - 1].colons) {
      flush();
      stack.pop();
    } else buf.push(line);
  });
  flush();
  if (stack.length > 1) {
    const n = stack[stack.length - 1].node;
    throw new Error(`${file}: unclosed directive :::${n.name} opened at line ${n.line}`);
  }
  return root.children;
}
