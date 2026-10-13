const D = window.KH, TGT = window.KH_TARGET, SHP = window.KH_SHAPE, DATES = window.KH_DATES || {}, SHOW = !!window.KH_SHOW_SCORES;
const SRC = window.KH_SRC || {};
const big = id => SRC[id] || ('photos/' + id + '.jpg'), th = id => SRC[id] || ('photos/' + id + '_t.jpg');
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NM = { Camille: 'C', Virgil: 'V' };
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/* ---------- couleur ---------- */
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgbHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const isLight = h => { const [r, g, b] = hexRgb(h); return (r * 299 + g * 587 + b * 114) / 1000 > 150; };
function lab([r, g, b]) {
  [r, g, b] = [r, g, b].map(v => { v /= 255; return v > .04045 ? ((v + .055) / 1.055) ** 2.4 : v / 12.92; });
  let x = (r * .4124 + g * .3576 + b * .1805) / .95047, y = r * .2126 + g * .7152 + b * .0722, z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
  [x, y, z] = [x, y, z].map(v => v > .008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// Couleur extraite : calculée à l'avance (teinte la plus proche de la cible, tons gris écartés)
const extract = (p, target) => { const hex = (p.near || p.palette[0]).toUpperCase();
  return { hex, rgb: hexRgb(hex), score: Math.max(0, Math.round(100 - dE(lab(hexRgb(hex)), lab(hexRgb(target))) * 2)) }; };
const mean = rs => rgbHex([0, 1, 2].map(k => rs.reduce((s, r) => s + r.rgb[k], 0) / rs.length));

/* ---------- données ---------- */
const nums = Object.keys(D.weeks).map(Number).sort((a, b) => a - b);
const side = (w, who) => { const name = D.weeks[w][who], all = D.photos.filter(p => p.week == w && p.person == who);
  return { name, target: TGT[name], shape: SHP[name], photos: all.filter(p => p.selection), extra: all.filter(p => !p.selection) }; };
const WEEK = w => ({ num: w, c: side(w, 'Camille'), v: side(w, 'Virgil') });
const W = nums.filter(w => !SHP[D.weeks[w].Camille]).map(WEEK);   // semaines de couleur : le nuancier
const S = nums.filter(w => SHP[D.weeks[w].Camille]).map(WEEK);    // semaines de formes
function dates(wk) {
  if (DATES[wk.num]) return DATES[wk.num];
  const ds = D.photos.filter(p => p.week == wk.num && p.date).map(p => p.date.split('/').reverse().join('')).sort();
  return ds.length ? MOIS[+ds[0].slice(0, 2) - 1] + ' 2026' : '';
}
const found = p => mean(p.photos.map(x => extract(x, p.target)));

/* ---------- accueil ---------- */
function renderHome() {
  $('period').textContent = `Nuancier · ${dates(W[0])} → ${dates(W[W.length - 1])}`;
  $('info').innerHTML = `${W.length * 2} teintes · ${W.length} semaines<br>clique une lamelle pour ouvrir sa semaine`;
  const chip = (wk, i, k, p) => `
    <a class="chip" href="#s${pad(i + 1)}" aria-label="Semaine ${wk.num}, ${esc(p.name)}">
      <div class="top" style="background:${p.target};color:${isLight(p.target) ? '#161513' : '#f7f5f0'}"><span>${esc(p.name)}</span></div>
      <div class="bot" style="background:${found(p)}" title="Moyenne trouvée"></div>
      <div class="lab"><b><i class="kh">KH </i>${pad(wk.num)}-${k}</b><span>${p.target}</span></div>
    </a>`;
  $('fan').innerHTML = W.map((wk, i) => `<div class="wk">${chip(wk, i, 'C', wk.c)}${chip(wk, i, 'V', wk.v)}</div>`).join('');
  $('shapes').innerHTML = S.length ? `<div class="kicker shapes-head">Shape hunt</div>
    <div class="shape-links">${S.map((wk, i) => `<a href="#f${pad(i + 1)}"><span class="sh ${wk.c.shape}"></span><span class="sh ${wk.v.shape}"></span>
      <span>KH ${pad(wk.num)} · ${esc(wk.c.name)} / ${esc(wk.v.name)}</span></a>`).join('')}</div>` : '';
}

/* ---------- semaine ---------- */
function renderWeek(list, i, prefix) {
  const wk = list[i], isShape = prefix === 'f';
  $('wnum').textContent = `${isShape ? 'Formes' : 'Semaine'} ${pad(wk.num)}`;
  $('prev').href = `#${prefix}${pad(i)}`; $('prev').classList.toggle('off', i === 0);
  $('next').href = `#${prefix}${pad(i + 2)}`; $('next').classList.toggle('off', i === list.length - 1);
  const total = wk.c.photos.length + wk.v.photos.length;
  $('wdates').textContent = `${dates(wk)} · ${total} photos`;

  const person = (who, p) => {
    const rs = p.target ? p.photos.map(x => extract(x, p.target)) : [], f = rs.length ? mean(rs) : null;
    const ink = h => isLight(h) ? '#161513' : '#f7f5f0';
    return `
    <div class="person">
      <div class="who">${who}.</div>
      <h2>${esc(p.name)}</h2>
      ${p.target ? `<div class="split">
        <div style="background:${p.target};color:${ink(p.target)}"><span>Visée</span><span>${p.target}</span></div>
      </div>` : `<div class="split shape"><div><span>Chasse à la forme</span><span class="sh ${p.shape}"></span></div></div>`}
      <div class="grid">${p.photos.map((x, j) => `<img src="${th(x.id)}" data-id="${x.id}" alt="${who}. — ${esc(p.name)}, photo ${j + 1}" loading="lazy">`).join('')}</div>
      ${p.target ? `<div class="kicker extract">Couleur extraite</div>
      <div class="cards" style="grid-template-columns:repeat(${p.photos.length},minmax(0,1fr))">
        ${rs.map((r, j) => `<div class="card"><i style="background:${r.hex}"></i><div class="lab"><b>N°${j + 1}</b><span>${r.hex}</span>${SHOW ? `<span class="sc">${r.score} %</span>` : ''}</div></div>`).join('')}
      </div>` : ''}
    </div>`;
  };
  $('people').innerHTML = person('C', wk.c) + person('V', wk.v);
  requestAnimationFrame(alignTitles);

  // Hors grille : les autres belles photos des deux, en alternance
  const pools = [wk.c.extra, wk.v.extra], mix = [];
  for (let t = 0; t < Math.max(...pools.map(x => x.length)); t++) pools.forEach(x => x[t] && mix.push(x[t]));
  $('mix').innerHTML = mix.length ? `<div class="kicker extract mix-head"><span>Hors grille</span><span>${mix.length} photo${mix.length > 1 ? 's' : ''}</span></div>
    <div class="mixgrid">${mix.map(x => `<figure><img src="${th(x.id)}" data-id="${x.id}" alt="${NM[x.person]}., hors grille" loading="lazy"><figcaption>${NM[x.person]}.</figcaption></figure>`).join('')}</div>` : '';
}

// Même hauteur de titre des deux côtés (seulement quand ils sont côte à côte)
function alignTitles() {
  const hs = [...document.querySelectorAll('.person h2')]; hs.forEach(h => h.style.minHeight = '');
  if (hs.length === 2 && hs[0].getBoundingClientRect().top === hs[1].getBoundingClientRect().top) {
    const m = Math.max(...hs.map(h => h.offsetHeight)); hs.forEach(h => h.style.minHeight = m + 'px'); }
}
addEventListener('resize', alignTitles);
document.fonts && document.fonts.ready.then(alignTitles);

/* ---------- routeur ---------- */
function route() {
  const m = location.hash.match(/^#([sf])(\d+)/);
  const list = m && m[1] === 'f' ? S : W, i = m ? +m[2] - 1 : -1;
  const isWeek = i >= 0 && i < list.length;
  $('home').hidden = isWeek; $('week').hidden = !isWeek;
  isWeek ? renderWeek(list, i, m[1]) : renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

const lb = $('lightbox');
$('week').addEventListener('click', e => {
  const img = e.target.closest('img[data-id]'); if (!img) return;
  lb.querySelector('img').src = big(img.dataset.id); lb.querySelector('img').alt = img.alt; lb.hidden = false;
});
lb.onclick = () => (lb.hidden = true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { lb.hidden = true; return; }
  if ($('week').hidden || !lb.hidden) return;
  if (e.key === 'ArrowLeft') $('prev').click();
  if (e.key === 'ArrowRight') $('next').click();
});

route();
