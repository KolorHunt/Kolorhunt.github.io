const D = window.KH, TGT = window.KH_TARGET, SHP = window.KH_SHAPE, FAV = window.KH_FAV || {}, DATES = window.KH_DATES || {};
const SRC = window.KH_SRC || {};
const big = id => SRC[id] || ('photos/' + id + '.jpg'), th = id => SRC[id] || ('photos/' + id + '_t.jpg');
const $ = id => document.getElementById(id);
const PEOPLE = ['Camille', 'Virgil'];
const NM = { Camille: 'C', Virgil: 'V' }; // noms affichés
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

// Teinte d'une photo la plus proche de la couleur visée (sans cible : sa couleur majoritaire)
const near = (p, t) => t ? (p.near || p.palette.reduce((b, c) => dE(c, t) < dE(b, t) ? c : b)) : p.palette[0];

// Une chasse = ce qu'une personne a cherché une semaine donnée
function hunt(w, who) {
  const title = D.weeks[w][who], all = D.photos.filter(p => p.week == w && p.person == who);
  const h = { title, sel: all.filter(p => !p.bonus && p.selection), extra: all.filter(p => !p.bonus && !p.selection), bonus: all.filter(p => p.bonus) };
  if (SHP[title]) { h.shape = SHP[title]; h.fav = (FAV[w] || {})[who]; }
  else { // couleur : la photo contenant la teinte la plus proche de la visée est entourée
    h.target = TGT[title] || '#888888'; let bd = 1e9;
    h.sel.forEach(p => { const c = near(p, h.target), d = dE(c, h.target); if (d < bd) { bd = d; h.found = c; } });
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

let tab = ['shape', 'hasard'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'color';
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
  $('legend').innerHTML = PEOPLE.some(k => R[k].fav) ? ' · <span class="legend">○ coup de cœur</span>' : '';

  let n = 0;
  $('people').innerHTML = PEOPLE.map(key => {
    const h = R[key], name = NM[key];
    const bar = h.target
      ? `<div class="bar">
          <div style="background:${h.target};color:${isLight(h.target) ? '#161513' : '#f4f1ea'}"><span>Visée</span><span>${h.target}</span></div>
          <div style="background:${h.found};color:${isLight(h.found) ? '#161513' : '#f4f1ea'}"><span>Trouvée</span><span>${h.found}</span></div>
        </div>`
      : `<div class="bar shape">Chasse à la forme</div>`;
    n++;
    const k = h.sel.length, cols = 2, rows = Math.max(1, Math.ceil(k / cols));
    const note = 'celle-là !';
    const cells = h.sel.map(p => `<div class="cell"><img src="${th(p.id)}" loading="lazy" alt="${name} — ${esc(h.title)}" data-id="${p.id}" data-cap="${name} · ${esc(h.title)} · R${pad(i + 1)}">${p.id === h.fav ? MARK(note) : ''}</div>`).join('');
    const frame = `<div class="frame">
        <div class="img grid" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells}</div>
        <div class="edge"><span>▸ ${n}</span><span>${name.toUpperCase()} · ${k} VUE${k > 1 ? 'S' : ''}</span></div>
      </div>`;
    const thumbs = arr => `<div class="thumbs">${arr.map(p => `<img src="${th(p.id)}" loading="lazy" alt="${name}, vue supplémentaire" data-id="${p.id}" data-cap="${name} · ${esc(p.bonus ? 'bonus' : h.title)}">`).join('')}</div>`;
    return `<section class="person">
      <div class="who">${name}</div>
      <h1>${esc(h.title)}</h1>
      ${bar}
      ${k ? `<div class="film">${frame}</div>${h.target ? `<div class="maj" style="grid-template-columns:repeat(${cols},1fr)" aria-label="Pour chaque photo, sa teinte la plus proche de la couleur visée">${h.sel.map(p => { const c = near(p, h.target); return `<span style="background:${c}" title="${c.toUpperCase()}"></span>`; }).join('')}</div>` : ''}<p class="vues">${k} vue${k > 1 ? 's' : ''}</p>` : '<p class="empty">Pas encore de sélection.</p>'}
    </section>`;
  }).join('');
  // Hors grille : les autres belles photos des deux, mélangées en alternance
  const pools = PEOPLE.map(k => [...R[k].extra, ...R[k].bonus]), mix = [];
  for (let t = 0; t < Math.max(...pools.map(x => x.length)); t++) pools.forEach(x => x[t] && mix.push(x[t]));
  $('mix').innerHTML = mix.length ? `<div class="mix-head"><span>Hors grille</span><span class="muted">${mix.length} vue${mix.length > 1 ? 's' : ''}</span></div>
    <div class="mix">${mix.map(p => `<figure><img src="${th(p.id)}" loading="lazy" alt="${NM[p.person]}, hors grille" data-id="${p.id}" data-cap="${NM[p.person]} · ${esc(p.bonus ? 'bonus' : D.weeks[p.week][p.person])} · hors grille"><figcaption>${NM[p.person]}${p.bonus ? ' · bonus' : ''}</figcaption></figure>`).join('')}</div>` : '';
  requestAnimationFrame(fitTitles);
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

// ---------- Vignette simple (Au hasard) ----------
const single = (p, n, src) => `<div class="frame"><div class="img"><img src="${src || th(p.id)}" loading="lazy" alt="${NM[p.person]}, semaine ${p.week}" data-id="${p.id}" data-cap="${NM[p.person]} · ${esc(p.bonus ? 'bonus' : D.weeks[p.week][p.person])} · semaine ${p.week}"></div>
  <div class="pal">${p.palette.map(c => `<span style="background:${c}"></span>`).join('')}</div><div class="edge"><span>▸ ${n}</span><span>${n}A</span></div></div>`;
// Réduit la taille des titres pour qu'aucun mot ne dépasse la largeur de la grille
function fitTitles() {
  document.querySelectorAll('.person h1').forEach(el => {
    el.style.fontSize = ''; el.style.minHeight = '';
    let s = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && s > 14) { s -= 1; el.style.fontSize = s + 'px'; }
  });
  // même hauteur de titre des deux côtés, pour que les grilles commencent à la même ligne
  const hs = [...document.querySelectorAll('.person h1')]; hs.forEach(el => el.style.minHeight = '');
  const m = Math.max(...hs.map(el => el.offsetHeight)); hs.forEach(el => el.style.minHeight = m + 'px');
}
addEventListener('resize', fitTitles);
document.fonts && document.fonts.ready.then(fitTitles);

// ---------- Au hasard ----------
let last = null;
function renderRandom() {
  let p; do { p = D.photos[Math.floor(Math.random() * D.photos.length)]; } while (D.photos.length > 1 && p === last); last = p;
  const t = D.weeks[p.week][p.person], c = TGT[t];
  $('v-hasard').innerHTML = `<div class="rand"><div>${single(p, '?', big(p.id))}</div>
    <div><span class="sub">${SHP[t] ? 'Shape hunt' : 'Color hunt'} · semaine ${p.week}${p.bonus ? ' · bonus' : ''}</span>
      <h1>${esc(p.bonus ? 'Bonus' : t)}</h1>
      <span class="sub">${c && !p.bonus ? `<span style="display:inline-block;width:7px;height:14px;background:${c};vertical-align:-2px;margin-right:8px"></span>` : ''}Vue par ${NM[p.person]}${p.date ? ' · ' + p.date : ''}</span><br>
      <button class="again" id="again">Une autre vue</button></div></div>`;
  $('again').onclick = renderRandom;
}

// ---------- Onglets ----------
const DESC = { color: 'Une planche par semaine de couleur : vos deux grilles, puis les autres belles photos de la semaine.',
  shape: 'Les semaines de formes : chacun sa forme, chacun sa sélection.', hasard: 'Une vue tirée au sort dans toute la collection.' };
function show() {
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  $('v-hunt').hidden = !['color', 'shape'].includes(tab); $('v-hasard').hidden = tab !== 'hasard';
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

show();
