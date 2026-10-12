const D = window.KH, TGT = window.KH_TARGET, SHP = window.KH_SHAPE, FAV = window.KH_FAV || {}, DATES = window.KH_DATES || {};
const SRC = window.KH_SRC || {};
const big = id => SRC[id] || ('photos/' + id + '.jpg'), th = id => SRC[id] || ('photos/' + id + '_t.jpg');
const $ = id => document.getElementById(id);
const PEOPLE = ['Camille', 'Virgil'];
const P = {}; D.photos.forEach(p => P[p.id] = p);
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isLight = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };
const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

// Distance de couleur (Lab)
const lab = h => { let [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c > .04045 ? ((c + .055) / 1.055) ** 2.4 : c / 12.92);
  let x = (r * .4124 + g * .3576 + b * .1805) / .95047, y = r * .2126 + g * .7152 + b * .0722, z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
  const f = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; [x, y, z] = [f(x), f(y), f(z)]; return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
const dE = (a, b) => { a = lab(a); b = lab(b); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };

// Une chasse = ce qu'une personne a cherché une semaine donnée
function hunt(w, who) {
  const title = D.weeks[w][who], all = D.photos.filter(p => p.week == w && p.person == who);
  const h = { title, sel: all.filter(p => !p.bonus && p.selection), extra: all.filter(p => !p.bonus && !p.selection), bonus: all.filter(p => p.bonus) };
  if (SHP[title]) { h.shape = SHP[title]; h.fav = (FAV[w] || {})[who]; }
  else { // couleur : la photo contenant la teinte la plus proche de la visée est entourée
    h.target = TGT[title] || '#888888'; let bd = 1e9;
    h.sel.forEach(p => p.palette.forEach(c => { const d = dE(c, h.target); if (d < bd) { bd = d; h.found = c; h.fav = p.id; } }));
    h.found = (h.found || h.target).toUpperCase();
  }
  return h;
}
function dates(w) {
  if (DATES[w]) return DATES[w];
  const ds = D.photos.filter(p => p.week == w && p.date).map(p => p.date.split('/').reverse().join('')).sort();
  return `semaine ${w}` + (ds.length ? ' · ' + MOIS[+ds[0].slice(0, 2) - 1] + ' 2026' : '');
}
const WEEKS = Object.keys(D.weeks).map(Number).sort((a, b) => a - b);
const H = { color: WEEKS.filter(w => !SHP[D.weeks[w].Camille]), shape: WEEKS.filter(w => SHP[D.weeks[w].Camille]) };
const MARK = note => `<div class="mark"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><use href="#circled"/></svg><div class="note">${note}</div></div>`;

let tab = ['shape', 'echos', 'hasard'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'color';
const pos = { color: H.color.length - 1, shape: H.shape.length - 1 };

// ---------- Color hunt / Shape hunt ----------
function render() {
  const list = H[tab], i = pos[tab], w = list[i];
  if (w == null) { $('people').innerHTML = '<p class="empty">Pas encore de rouleau ici.</p>'; return; }
  const R = Object.fromEntries(PEOPLE.map(k => [k, hunt(w, k)]));

  $('rolls').innerHTML = list.map((x, j) => `
    <button class="${j === i ? 'on' : ''}" data-i="${j}">
      <span>R${pad(j + 1)}</span>
      ${tab === 'color' ? `<span class="bars"><i style="background:${TGT[D.weeks[x].Camille]}"></i><i style="background:${TGT[D.weeks[x].Virgil]}"></i></span>` : ''}
      <span class="sub">${esc(D.weeks[x].Camille + ' / ' + D.weeks[x].Virgil)}</span>
    </button>`).join('');

  $('sheet').textContent = `${tab === 'color' ? 'Color hunt' : 'Shape hunt'} · planche n°${pad(i + 1)} · ${dates(w)}`;
  $('count').textContent = PEOPLE.reduce((n, k) => n + R[k].sel.length, 0);
  $('legend').innerHTML = tab === 'color' ? ' · <span class="legend">○ la plus proche de la couleur visée</span>' : (PEOPLE.some(k => R[k].fav) ? ' · <span class="legend">○ coup de cœur</span>' : '');

  let n = 0;
  $('people').innerHTML = PEOPLE.map(name => {
    const h = R[name];
    const bar = h.target
      ? `<div class="bar">
          <div style="background:${h.target};color:${isLight(h.target) ? '#161513' : '#f4f1ea'}"><span>Visée</span><span>${h.target}</span></div>
          <div style="background:${h.found};color:${isLight(h.found) ? '#161513' : '#f4f1ea'}"><span>Trouvée</span><span>${h.found}</span></div>
        </div>`
      : `<div class="bar shape">Chasse à la forme</div>`;
    n++;
    const k = h.sel.length, cols = 2, rows = Math.max(1, Math.ceil(k / cols));
    const note = tab === 'color' ? 'la plus proche !' : 'celle-là !';
    const cells = h.sel.map(p => `<div class="cell"><img src="${th(p.id)}" loading="lazy" alt="${name} — ${esc(h.title)}" data-id="${p.id}" data-cap="${name} · ${esc(h.title)} · R${pad(i + 1)}">${p.id === h.fav ? MARK(note) : ''}</div>`).join('');
    const frame = `<div class="frame">
        <div class="img grid" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells}</div>
        <div class="edge"><span>▸ ${n}</span><span>${name.toUpperCase()} · ${k} VUE${k > 1 ? 'S' : ''}</span></div>
      </div>`;
    const thumbs = arr => `<div class="thumbs">${arr.map(p => `<img src="${th(p.id)}" loading="lazy" alt="${name}, vue supplémentaire" data-id="${p.id}" data-cap="${name} · ${esc(p.bonus ? 'bonus' : h.title)}">`).join('')}</div>`;
    return `<section class="person">
      <div class="who">${name} cherche</div>
      <h1>${esc(h.title)}</h1>
      ${bar}
      ${k ? `<div class="film">${frame}</div>` : '<p class="empty">Pas encore de sélection.</p>'}
      ${h.extra.length ? `<button class="more" aria-expanded="false">Les ${h.extra.length} autres vues</button><div hidden>${thumbs(h.extra)}</div>` : ''}
      ${h.bonus.length ? `<p class="bonus-t">Bonus</p>${thumbs(h.bonus)}` : ''}
    </section>`;
  }).join('');
  $('prev').setAttribute('aria-disabled', i === 0);
  $('next').setAttribute('aria-disabled', i === list.length - 1);
}
$('rolls').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { pos[tab] = +b.dataset.i; render(); } });
$('people').addEventListener('click', e => { const b = e.target.closest('.more'); if (!b) return;
  const g = b.nextElementSibling, o = g.hidden; g.hidden = !o; b.setAttribute('aria-expanded', o);
  b.textContent = o ? 'Masquer' : `Les ${g.querySelectorAll('img').length} autres vues`; });
const go = d => { const c = pos[tab] + d; if (c >= 0 && c < H[tab].length) { pos[tab] = c; render(); } };
$('prev').onclick = e => { e.preventDefault(); go(-1); };
$('next').onclick = e => { e.preventDefault(); go(1); };

// ---------- Échos ----------
let mode = 'couleur';
const HINT = { couleur: 'Deux vues de semaines différentes, une de chacun, rapprochées par leurs teintes vives. La bande sous chaque photo montre ses couleurs dominantes.',
  forme: 'Deux vues rapprochées par leur texture et l’orientation de leurs lignes. Première approche automatique : elle repère les matières et les compositions, pas encore les formes précises.' };
const single = (p, n, src) => `<div class="frame"><div class="img"><img src="${src || th(p.id)}" loading="lazy" alt="${p.person}, semaine ${p.week}" data-id="${p.id}" data-cap="${p.person} · ${esc(p.bonus ? 'bonus' : D.weeks[p.week][p.person])} · semaine ${p.week}"></div>
  <div class="pal">${p.palette.map(c => `<span style="background:${c}"></span>`).join('')}</div><div class="edge"><span>▸ ${n}</span><span>${n}A</span></div></div>`;
function renderPairs() {
  $('hint').textContent = HINT[mode];
  $('pairs').innerHTML = D.pairs[mode].map(([a, b], i) => { [a, b] = [P[a], P[b]].sort((x, y) => x.person < y.person ? -1 : 1);
    const lbl = p => `${p.person} · ${esc(p.bonus ? 'bonus' : D.weeks[p.week][p.person])}`;
    return `<div><div class="two">${single(a, 'E' + (i + 1))}${single(b, 'E' + (i + 1))}</div><div class="cap2"><span>${lbl(a)}</span><span>${lbl(b)}</span></div></div>`; }).join('');
}
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); renderPairs(); });

// ---------- Au hasard ----------
let last = null;
function renderRandom() {
  let p; do { p = D.photos[Math.floor(Math.random() * D.photos.length)]; } while (D.photos.length > 1 && p === last); last = p;
  const t = D.weeks[p.week][p.person], c = TGT[t];
  $('v-hasard').innerHTML = `<div class="rand"><div>${single(p, '?', big(p.id))}</div>
    <div><span class="sub">${SHP[t] ? 'Shape hunt' : 'Color hunt'} · semaine ${p.week}${p.bonus ? ' · bonus' : ''}</span>
      <h1>${esc(p.bonus ? 'Bonus' : t)}</h1>
      <span class="sub">${c && !p.bonus ? `<span style="display:inline-block;width:7px;height:14px;background:${c};vertical-align:-2px;margin-right:8px"></span>` : ''}Vue par ${p.person}${p.date ? ' · ' + p.date : ''}</span><br>
      <button class="again" id="again">Une autre vue</button></div></div>`;
  $('again').onclick = renderRandom;
}

// ---------- Onglets ----------
const DESC = { color: 'Une planche par semaine de couleur. Le trait de crayon entoure la photo la plus proche de la couleur visée.',
  shape: 'Les semaines de formes : chacun sa forme, chacun sa sélection.',
  echos: 'Deux photos de semaines différentes, une de chacun, qui se répondent.', hasard: 'Une vue tirée au sort dans toute la collection.' };
function show() {
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  $('v-hunt').hidden = !['color', 'shape'].includes(tab); $('v-echos').hidden = tab !== 'echos'; $('v-hasard').hidden = tab !== 'hasard';
  $('tabdesc').textContent = DESC[tab];
  if (!$('v-hunt').hidden) render();
  if (tab === 'hasard') renderRandom();
}
$('tabs').addEventListener('click', e => { const a = e.target.closest('a[data-tab]'); if (!a) return;
  e.preventDefault(); tab = a.dataset.tab; history.replaceState(null, '', '#' + tab); show(); });

// ---------- Agrandissement ----------
const lb = $('lightbox');
document.addEventListener('click', e => { const img = e.target.closest('img[data-id]'); if (!img || lb.contains(img)) return;
  lb.querySelector('img').src = big(img.dataset.id); lb.querySelector('img').alt = img.alt;
  lb.querySelector('p').textContent = img.dataset.cap; lb.hidden = false; });
lb.onclick = () => (lb.hidden = true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') lb.hidden = true;
  if (!lb.hidden || $('v-hunt').hidden) return;
  if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1);
});

renderPairs(); show();
