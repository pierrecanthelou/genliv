# Cadrage n°16 `dossier-repetition` — Tour 1 — UX Designer

RISQUE — Le rapport se noie dans Contrôles (chaque ligne y saute vers une section, donc une répétition y serait lue comme une erreur de schéma), ou il invente un 11e « mode » qui casse la navigation par sections. Pire : un rapport de 20 pas lu comme un journal de session, avec les mots « graine », « session », « commande ».

OBJECTION — (1) Pas de composant maison : la répétition n'a rien du schéma, elle ne devient pas une section (`sections.ts` reste à 10). (2) Le rapport ne doit pas réutiliser `ListeControles` (son `onSelectSection` est requis, sa pastille est un NiveauControle) : un composant neuf `ListeConstats`, qui CALQUE le gabarit comme `ListeControles` a calqué `IssueList`. (3) Aucun import mutuel : Contrôles et Répétition sont deux slots de render-prop jumeaux.

PROPOSITION — Option B (code seedé) validée côté UX. Un 3e slot `panneauRepetition` dans `DossierEditorScreen`, à côté de `panneauControles` et `panneauCopilote`. Le panneau est un fichier neuf dans la feature `dossier-repetition`. Le calcul est une fonction pure du brain (`repeterDossier(dossier, graine)`), recalculée en ligne, jamais stockée. Lecture : SYNTHÈSE d'abord (3 CardHead : Blocages / PNJ jamais rencontrés / Indices inatteignables), puis « Voir les 20 pas » en dépliable. Trois itérations : it1 synthèse + états, it2 déroulé des pas, it3 rejouer à l'identique et dette « fin vraie à l'ouverture ».

VERDICT — recevable sous réserve : (a) `ListeConstats` calque sans importer ; (b) les libellés de l'annexe sont repris à l'identique ; (c) état « dossier non jouable » = ligne dédiée, jamais un rapport vide.

## ANNEXE — contrat de design

**Composants** : Card, CardHead, Badge (tones existants), ListRow, boutonPrimaire/Secondaire (play-mode).

**Tokens** : --space-3/4/8/9/10/12, --r-md/xl, --border-divider/field, --bw-strong, --paper-1, --text-strong/body/muted/faint/label, --fs-h1/h2/body/meta/eyebrow, --track-eyebrow, --font-mono/ui, --lh-body, --fw-semibold. Aucune valeur en dur.

**Entrée de navigation** : bouton « RÉPÉTITION À BLANC » dans la barre de l'éditeur, à côté de Contrôles et Copilote. Pas dans SECTIONS.

**Libellés auteur (exacts)** :
- Titre : `RÉPÉTITION À BLANC`
- Déclencheur : `▶ Lancer la répétition` ; relance : `↻ Relancer`
- Aide : `Un joueur automatique parcourt votre dossier pendant 20 tours. Rien n'est modifié.`
- Sections : `BLOCAGES`, `PERSONNAGES JAMAIS RENCONTRÉS`, `INDICES INATTEIGNABLES`, `FINS ATTEINTES`
- Rejouer : `↪ Rejouer à l'identique` ; aide : `Même parcours, mêmes dés.`
- Dépliable : `Voir les 20 pas`. Un pas = ListRow : n° du tour (mono) / `Le joueur {action} — {lieu}` / résultat.

**États** :
- Jamais lancée : bloc pointillé + `Aucune répétition lancée — lancez-la pour savoir où un joueur se perd dans votre aventure.`
- Résultat : synthèse + compteurs en Badge (`3 blocages` tone bad ; `0` tone good).
- Aucun blocage : `Aucun blocage en 20 tours — le joueur a pu avancer partout où il est passé.`
- Dossier non jouable : `Le dossier n'est pas jouable : il manque un départ.` avec `→ Jalons & fins`.

**Registre** : les libellés d'interface restent mono MAJUSCULES. Jamais « graine », « session », « commande ». La graine s'affiche comme `Parcours n°{n}` uniquement derrière le bouton Rejouer.

**Clavier** : autoFocus sur le déclencheur si jamais lancée ; Entrée lance ; Échap replie ; Tab suit l'ordre visuel.

## Fichiers consultés
- src/features/dossier-controles/components/PanneauControles.tsx, ListeControles.tsx
- src/features/play-mode/components/EcranFin.tsx
- docs/EXIGENCE-APERCU-DU-JEU.md
- src/features/dossier-controles/specification.json
- src/App.tsx (slots)
- design_handoff_gamebook_editor/components/primitives/Badge.d.ts
