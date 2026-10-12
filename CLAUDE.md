# Site Digital Solutions — règles de conception

Ces règles valent uniquement pour ce projet (site Digital Solutions), pas pour d'autres sites.

## Fonds animés des sections
- Seulement deux fonds animés, définis dans `ds-scenes.json` et montés par `ds-scenes.js` via `data-bg` sur la `<section>` :
  - `waveInverse` : points bleus (#269CBD) discrets sur **fond blanc #FFFFFF**.
  - `waveCiel` : points bleu ciel sur **fond bleu officiel #269CBD**.
- Toute section sur fond #269CBD reçoit `data-bg="waveCiel"` (y compris le bandeau CTA du footer).
- Sections claires : **blanc uni par défaut**. `waveInverse` uniquement sur une section clé par page (ex. « Par où commencer ? » à l'accueil, « Ce que nous construisons » sur la page IA), jamais en alternance systématique.
- Interdit : network, flow, flowLight, circuit, dial, tokens, wave, waveBlanc et autres variantes.

## Simplicité (pages déjà simplifiées : Accueil, IA)
- Une seule action principale partout : « Réserver 30 min avec un expert » → https://bookings.cloud.microsoft/book/DigitalSolutionsSAAgendadeThibaultPEPIN@digital-solutions.io/?ismsaljsauthenabled (nouvel onglet).
- Un seul très grand titre par page (h1) ; titres de section autour de `clamp(2rem,3.6vw,3.25rem)`, sans numérotation « (03) ».
- Peu d'animations : pas de parallax, de compteurs, de titres ligne par ligne ni de carrousels automatiques. Les démos interactives restent la seule vraie animation.
- Double niveau de lecture : texte grand public par défaut, jargon technique dans un « Détails techniques » repliable.
- Mode sobre et cookies : petit coin en bas à gauche. Assistant « Une question ? » en bas à droite, bouton bleu #269CBD.
