// Small helpers shared by visualisation modules: SVG building, hand-drawn strokes, scales, dragging, KaTeX labels.
const NS = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}

export function makeSvg(host, w, h, label) {
  const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label || '' });
  // A light displacement filter gives strokes a slightly hand-drawn edge without moving the geometry much.
  const defs = svg('defs', {}, s);
  const f = svg('filter', { id: `rough-${Math.random().toString(36).slice(2, 8)}`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '2', seed: '3', result: 'n' }, f);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '1.6', xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  s.roughId = f.id;
  host.append(s);
  return s;
}

export const linear = (d0, d1, r0, r1) => {
  const f = (x) => r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
  f.invert = (y) => d0 + ((y - r0) / (r1 - r0)) * (d1 - d0);
  return f;
};

// A wobbly polyline through the given points (deterministic jitter so redraws don't shimmer).
export function handPath(points, wobble = 0.8, seed = 1) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${(x + rnd() * wobble).toFixed(1)},${(y + rnd() * wobble).toFixed(1)}`).join('');
}

// HTML (e.g. KaTeX) label positioned inside the SVG via foreignObject.
export function htmlLabel(parent, x, y, html, { w = 160, h = 40, anchor = 'start', cls = '' } = {}) {
  const dx = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0;
  const fo = svg('foreignObject', { x: x + dx, y: y - h / 2, width: w, height: h }, parent);
  const div = document.createElement('div');
  div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  div.className = `fo-label ${cls}`;
  div.style.cssText = `display:flex;align-items:center;height:${h}px;justify-content:${anchor === 'middle' ? 'center' : anchor === 'end' ? 'flex-end' : 'flex-start'};font-size:14px;line-height:1;white-space:nowrap;color:var(--ink)`;
  div.innerHTML = html;
  fo.append(div);
  return fo;
}

// Pointer dragging on an SVG element, reporting positions in viewBox coordinates.
export function draggable(svgRoot, handle, onMove, { onEnd } = {}) {
  const toLocal = (ev) => {
    const pt = svgRoot.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svgRoot.getScreenCTM().inverse());
  };
  handle.style.cursor = 'grab';
  handle.style.touchAction = 'none';
  handle.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    handle.setPointerCapture(ev.pointerId);
    handle.style.cursor = 'grabbing';
    const move = (e) => onMove(toLocal(e));
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.style.cursor = 'grab'; onEnd?.(); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

export function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}

export function clear(node) { while (node.firstChild) node.firstChild.remove(); }
