# Kolorhunt — nuancier

Site statique (HTML/CSS/JS) pour GitHub Pages : poussez ces fichiers à la racine de la branche `main` du dépôt `kolorhunt.github.io`.

- `/` : le nuancier (accueil) ; `#s01`, `#s02`… : les semaines de couleur ; `#f01`… : les semaines de formes.
- `data.js` : les photos et leurs couleurs (généré), puis en bas les réglages à la main : couleurs visées, semaines de formes, vraies dates, affichage des scores (`KH_SHOW_SCORES`).
- `photos/` : chaque photo en grand (`id.jpg`) et en vignette (`id_t.jpg`).

La couleur extraite de chaque photo est calculée à l'avance : c'est la teinte de la photo la plus proche de la couleur visée, en écartant les tons gris (ombres, murs). Rien n'est recalculé dans le navigateur, donc le site fonctionne même en ouvrant `index.html` directement.
