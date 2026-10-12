# Kolorhunt — site statique

- `index.html`, `style.css`, `app.js` : le site.
- `data.js` : les photos et leurs couleurs (généré), puis en bas les réglages à la main :
  teintes visées (`KH_TARGET`), semaines de formes (`KH_SHAPE`), coups de cœur des shape hunts (`KH_FAV`), vraies dates (`KH_DATES`).
- `photos/` : chaque photo en grand (`id.jpg`) et en vignette (`id_t.jpg`).

En color hunt, la photo entourée est calculée toute seule : c'est celle qui contient la teinte la plus proche de la couleur visée.
Clic sur une photo : agrandissement. Flèches ← → : rouleau précédent/suivant. Échap : fermer.
