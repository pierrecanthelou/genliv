# Tour 2 — UX Designer — `dossier-copilote` it1

```
CONTRE-LECTURE

C4 (Tech Lead, TL-1 / registre) — NI 3 NI 8 : 4 entrées, mesurées champ par champ.
Le motif de TL pour élargir est juste dans son principe (mon texte (c) nomme un
libellé d'écran ⇒ il faut l'importer) mais faux dans son périmètre : il ajoute
SYNOPSIS MJ alors que N-R12 (Narratif, non contesté) INTERDIT de rendre
`canon.mj.synopsis_mj` requis. Un champ jamais requis n'est jamais nommé dans un
refus : SYNOPSIS MJ est une entrée sans producteur, exactement le défaut que j'ai
maintenu contre mon propre texte (d) (KR-235 appliqué à un registre). Ce qui EST
atteignable : `canon.ton` (requis, et c'est un des quatre champs de l'amorce — un
dossier neuf y bute au premier essai, donc c'est un chemin de DÉMO, pas un cas
limite). Verdict : le registre porte **4** entrées — FONCTION, APPARENCE,
DESCRIPTION JOUEUR (`BlocIdentite.tsx`) + TON (`PanneauCanon.tsx`, UNE seule
ligne, pas deux). Je retiens la FORME de TL (clé = chemin complet du vocabulaire
`destinations.ts`, `CheminLibelle = keyof typeof …`, `as const satisfies`) —
meilleure que ma proposition de tour 1 (clés courtes), parce qu'elle reste
cohérente si it2-4 y ajoutent une entrée sans renommage. Je corrige donc ma
propre position : `PanneauCanon.tsx` EST touché, mais pour une ligne.

C3 (Tech Lead + QA) — les quatre textes définitifs, et un correctif au TYPE de TL.
J'endosse le remplacement de (d) par un refus de budget, mais je corrige la FORME :
son `Contexte`/`ReponseCopilote` portait `chemin: CheminLibelle` sur LES DEUX motifs
de refus. Appliqué tel quel, « trop-long » désignerait « le champ injecté le plus
long » — qui peut être `but.libelle`, `plan_actions[].action`, `caractere.parler[]`…
des chemins dont le libellé d'écran vit dans des blocs qu'aucun rôle n'a ouverts
(`BlocSituation`/`BlocCaractere`/`BlocPlanActions`). Appliquer le mécanisme de (c) à
(d) rejoue EXACTEMENT l'explosion à 8+ entrées que je viens de refuser, pour un
texte qui n'en a pas besoin : « trop long » ne pointe JAMAIS un champ précis, il
pointe la FICHE. Je retire donc `chemin` du motif `trop-long`.

Les QUATRE textes littéraux de l'it1 :
  (a) « Le copilote est indisponible… Réessayez dans un instant. »
  (b) « Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer. »
  (c) « Il manque « {LIBELLÉ} » pour proposer ce texte — complétez d'abord ce champ. »
      → à l'it1 : « Il manque « TON » pour proposer ce texte — complétez d'abord ce champ. »
      → JE CORRIGE mon propre gabarit de tour 1, qui disait « … dans la fiche » :
        `canon.ton` ne vit PAS dans une fiche de personnage, il vit dans Canon — le
        mot était une faute de précision que la confirmation de l'atteignabilité de
        TON vient de révéler.
  (d) « Le contexte est trop long pour proposer ce texte — raccourcissez d'abord la
        fiche de ce personnage. »

Pouvoir séparateur pour la QA : les quatre partagent « pour proposer ce texte » mais
s'ouvrent et se ferment sur des lexiques opposés — « il manque »/« complétez » (c)
contre « trop long »/« raccourcissez » (d), un champ NOMMÉ dans (c) contre aucun
champ nommé dans (d) ; (a) et (b) ne mentionnent ni champ ni fiche.
`new Set([a,b,c,d]).size===4` est trivialement vrai, mais la propriété que je livre
est plus forte : un auteur qui lit (c) OU (d) sait, au premier mot, dans lequel des
deux il se trouve.

Où part l'ancien texte (d) « vide-mais-réussi » : REPORTÉ à l'it2, ni codé ni gardé
en constante inerte. Motif : « Tisser les indices » (it2) EST son producteur réel —
l'écrire maintenant en dur, même non rendu, c'est l'instrument-fantôme que mon
KR-235 du tour 1 dénonçait, avec le risque concret qu'il diverge en silence du texte
que l'it2 finira par vouloir.

C5 (PM) — REMPLACEMENT reste dans l'it1, je renverse ma position de spectateur.
Ma mesure du tour 1 est décisive dans les DEUX sens, et le PM n'a lu que le premier :
oui, l'amorce ne sème aucun champ de personnage — mais un dossier réel, dès qu'un
auteur a écrit UNE fonction, présente un champ NON VIDE au sélecteur. Rien dans le
contrat REMPLISSAGE-seul n'empêche l'auteur de CIBLER ce champ déjà écrit : le
panneau ne connaît que deux gardes (aucun personnage, aucun champ choisi), aucune ne
teste le CONTENU du champ ciblé. Réponse à la question posée : ça ne se démontre
PAS — ça produit un état non dessiné, où le texte « avant » de l'auteur disparaît
sans trace derrière une proposition qui semble neuve.
Chiffrage demandé : le coût réel de REMPLACEMENT est un `div` statique (4 jetons déjà
validés au tour 1, une légende mono « AVANT ») + le `Field` « après » qui existe DE
TOUTE FAÇON pour REMPLISSAGE — zéro composant neuf, zéro jeton neuf. Et la branche
« ce champ est-il vide ? » doit EXISTER dans le code quoi qu'il arrive : soit pour
choisir la variante, soit pour désactiver l'option si le PM veut vraiment couper — et
CETTE porte-là a SON PROPRE texte à inventer et son propre état vide à dessiner, donc
coûte à peu près le même effort. Différer ne réduit pas le travail, il déplace le
risque vers un état sans design. Recommandation : livrer REMPLACEMENT à l'it1.

TL-13 (`onSelectSection` non exercé) — (a), avec le texte.
Le panneau offre, sur CHAQUE ligne acceptée (pas ailleurs), un lien texte
« → Ouvrir la fiche » (glyphe `→` du jeu canonique, jamais un bouton accent — c'est
une navigation secondaire) qui appelle `onSelectSection('personnages')`. Seul
`SectionId` traverse, exactement la frontière posée par BUG-082. Coût : une ligne de
JSX, un texte, aucun composant neuf. Le préférer à `(_onSelectSection) => …` : un
paramètre nommément ignoré dans `App.tsx` est le genre de chose qu'une revue lit
comme mort, alors que la signature EST imposée précisément pour être exercée un jour.

Narratif — adjectifs évaluatifs : contrôlé, RAS. Aucun adjectif qualifiant la
proposition dans (a)-(d), « Lancer », « Annuler », « → Ouvrir la fiche »,
« Accepté »/« Rejeté ».

Narratif — un seul appel en vol : mon §3 de tour 1 décrivait le FOCUS mais pas
explicitement l'état DÉSACTIVÉ de « Lancer » pendant l'appel — un manque réel.
Corrigé : « Lancer » passe `disabled` DÈS le clic, en même temps que la région
`role="status"` et « Annuler » apparaissent ; il redevient actif au retour.

Découverte propre à ce tour, hors des points nommés : mon annexe de tour 1 ne
spécifiait qu'UN sélecteur (« PERSONNAGE »). Le goal exige pourtant que l'auteur
choisisse aussi le CHAMP — angle mort de ma propre note, corrigé ci-dessous.

MES OBJECTIONS
1. RISQUE (Card « Bientôt » vs Lancer désactivé, même grisé) — MAINTENUE. Non
   contestée ; solution inchangée.
2. OBJECTION (libellés/hints inaccessibles sans lot `contrat`) — RETIRÉE, remplacée
   par la solution jointe avec le Tech Lead en C4 : 4 entrées, forme `CheminLibelle`
   de TL, contenu resserré par ma mesure d'atteignabilité.

VERDICT — recevable sous réserve : (i) registre à 4 entrées exactement ; (ii) les
quatre textes littéraux ci-dessus, sans `chemin` sur `trop-long` ; (iii) REMPLACEMENT
livré à l'it1 ; (iv) l'affordance « → Ouvrir la fiche » ; (v) « Lancer » explicitement
`disabled` pendant l'appel ; (vi) le sélecteur « CHAMP » ajouté à la Card 1.
```

---

# ANNEXE — contrat de design définitif de l'it1

## 0. Jetons (revérifiés)

`--surface-inset` (= `--paper-3`), `--text-muted` (= `--ink-2`), `--border-field` (= `--line-field`), `--r-md` (`6px`), `--surface-sunken`, `--text-disabled`, `--text-on-accent`, `--accent`, `--font-mono`, `--fs-eyebrow`, `--track-eyebrow`, `--text-label`. Tons `Badge` : `accent`/`muted` — jamais `good`/`bad`. Tons `IconButton` : `accent` (`+`), `danger` (`×`).

## 1. Registre de libellés (LOT `contrat`) — 4 entrées, pas plus

```ts
export interface LibelleDeChamp { libelle: string; hint?: string }

/**
 * PARTIELLE PAR CONSTRUCTION — n'entre ici qu'un champ (a) nommé par un écran
 * qui n'est PAS sa fiche d'origine, ET (b) réellement atteignable par une
 * branche de code de l'itération qui le réclame. `canon.mj.synopsis_mj` n'y
 * entre PAS malgré son voisinage avec `canon.ton` : N-R12 lui interdit d'être
 * requis, donc AUCUNE branche ne peut jamais le nommer dans un refus. Une
 * ligne sans producteur réel est une dette (KR-235 appliqué à un registre).
 */
export const LIBELLE_DES_CHAMPS = {
	'monde.personnages[].fonction': { libelle: 'FONCTION', hint: '…verbatim BlocIdentite…' },
	'monde.personnages[].apparence': { libelle: 'APPARENCE', hint: '…verbatim BlocIdentite…' },
	'monde.personnages[].description_joueur': { libelle: 'DESCRIPTION JOUEUR', hint: '…verbatim…' },
	'canon.ton': { libelle: 'TON', hint: '…verbatim PanneauCanon…' },
} as const satisfies Record<string, LibelleDeChamp>

export type CheminLibelle = keyof typeof LIBELLE_DES_CHAMPS
```

`BlocIdentite.tsx` : ses constantes privées (3 `label` inline + 3 `HINT_*`) basculent sur cet import, **chaîne pour chaîne, aucune modifiée**. `PanneauCanon.tsx` : SEULE la paire `label="TON"` / `hint=…` bascule — `SYNOPSIS MJ` et `ACCROCHE JOUEUR` restent inline, **intouchés**.

## 2. Types de refus (LOT `contrat`) — correction du brouillon Tech Lead

```ts
export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }   // canon.ton
	| { motif: 'trop-long' }                         // budget dépassé — JAMAIS de chemin
```

`ReponseCopilote` : la branche `refuse` porte ce `MotifRefusContexte` — l'enveloppe reste à **QUATRE** branches `statut`, seule la charge interne de `refuse` est affinée.

## 3. Les quatre textes littéraux, jamais confondus

| Motif | Texte | Où il se rend |
|---|---|---|
| `indisponible` | « Le copilote est indisponible… Réessayez dans un instant. » | la zone `role="status"` est remplacée par ce texte au retour |
| `illisible` | « Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer. » | idem |
| `refuse` / `a-ecrire` | « Il manque « {LIBELLE_DES_CHAMPS[chemin].libelle} » pour proposer ce texte — complétez d'abord ce champ. » | SYNCHRONE, sous « Lancer », préfixe `⊘ `, `--text-muted` — aucun appel réseau n'est parti |
| `refuse` / `trop-long` | « Le contexte est trop long pour proposer ce texte — raccourcissez d'abord la fiche de ce personnage. » | idem |

`vide-mais-réussi` : **reporté à l'it2** — ni codé, ni gardé en constante inerte.

## 4. Card 1 — « Compléter une fiche » (active à l'it1), anatomie complète

- `CardHead` : `eyebrow="ASSISTANT"`, `title="Compléter une fiche"`.
- Corps : « Propose un texte pour un champ vide ou resté à écrire — fonction, apparence, description lue par le joueur. »
- Sélecteur **PERSONNAGE** : `label="PERSONNAGE"`, options = `localiserEntite('pnj', p, i)`. `value` **toujours défini** (défaut = premier personnage dès qu'il en existe un).
  - État vide (0 personnage) : une option désactivée « Aucun personnage dans ce dossier » ; `Lancer` désactivé, `title="Créez un personnage dans Personnages pour utiliser cet assistant."`
- Sélecteur **CHAMP** (angle mort comblé ce tour) : légende « CHAMP » au-dessus (mono, `--fs-eyebrow`, `--text-label`), valeur par défaut **aucune**. Trois options, libellés tirés du registre : FONCTION, APPARENCE, DESCRIPTION JOUEUR.
- Bouton **Lancer** : désactivé tant qu'aucun CHAMP n'est choisi (`title="Choisissez un champ pour activer Lancer."`) ou s'il n'y a aucun personnage. **Jamais** désactivé pour « champ déjà écrit » — REMPLACEMENT gère ce cas.

## 5. Card 2 / Card 3 — « Bientôt » (inchangé, tour 1)

`Badge tone="muted"` « Bientôt — itération 2 / 4 », corps au futur, **aucun** sélecteur ni bouton Lancer grisé dedans (distinction du RISQUE maintenue).

## 6. `LigneProposition` — anatomie et variantes livrées à l'it1

Props : `chemin: CheminLibelle`, `variante: 'remplissage' | 'remplacement'` (dérivée côté appelant : `remplacement` ssi la valeur actuelle du champ cible est non vide ET ne porte pas `MARQUEUR_A_ECRIRE`), `valeurAvant?: string`, `valeurApres: string`, `decision?: 'acceptee' | 'rejetee'`, `onAccepter`, `onRejeter`.

**REMPLISSAGE** (cible vide ou marquée) : un seul `Field` — `label` et `hint` **tirés du registre**, `value={valeurApres}`, multiligne. **Non éditable à l'it1** (l'édition avant acceptation est une `open_question` non tranchée) : pas de prop `Field.readOnly` (déjà retirée, KR-109) — `onChange={() => {}}` explicite et commenté `// it1 : lecture seule, édition différée (open_question)`.

**REMPLACEMENT** (cible déjà écrite — **livrée à l'it1**) : bloc statique local au-dessus, légende mono `--text-muted` « AVANT », contenu `valeurAvant` sur `--surface-inset` / `--border-field` / `--r-md` ; puis le même `Field` qu'en REMPLISSAGE (label/hint inchangés, non reformulés, non suffixés).

**GROUPE** (six curseurs) : **non livrée à l'it1** — matière de l'it3.

Actions : `IconButton '+'` (`tone="accent"`) accepter, `IconButton '×'` (`tone="danger"`) rejeter — aucun glyphe neuf. Après décision : ligne compacte + `Badge tone="accent"` « Accepté » ou `tone="muted"` « Rejeté », remplaçant la paire d'`IconButton`, PLUS, sur la ligne **acceptée seulement**, un lien texte `→ Ouvrir la fiche` (style texte neutre `--text-body`, jamais accent) qui appelle `onSelectSection('personnages')`.

## 7. État de chargement — `role="status"`, clavier complet

- Au clic sur « Lancer » (cible valide) : « Lancer » passe **`disabled`** **au même instant** où apparaissent, dans une région `role="status"` : « Le copilote réfléchit… » + bouton « Annuler » (`--text-body`, `1px solid var(--border-card)`, `var(--surface-card)` — ton neutre, jamais accent). Focus déplacé sur « Annuler ».
- Échap = même action qu'« Annuler » (abort via `signal`) ET rend le focus à « Lancer », qui redevient actif.
- À l'issue (succès, échec, abandon) : la région disparaît, « Lancer » redevient actif, focus rendu à « Lancer ».
- Deux clics rapprochés sur « Lancer » ⇒ **exactement 1** appel réseau, garanti par la désactivation immédiate (pas par un débounce).

## 8. Rejets et différés (mis à jour)

- **REJETÉ** — glyphe coche pour Accepté (tour 1, inchangé).
- **REJETÉ** — toast / `role="status"` global de confirmation (tour 1, inchangé).
- **REJETÉ** — Badge `accent` sur les Card « Bientôt » (tour 1, inchangé).
- **REJETÉ** — un `Lancer` désactivé identique sur les 3 Card (tour 1, inchangé).
- **REJETÉ (ce tour)** — `chemin: CheminLibelle` sur le motif `trop-long` : rouvrirait `BlocSituation`/`BlocCaractere`/`BlocPlanActions` pour des libellés que le texte (d) n'a pas besoin de nommer.
- **RENVERSÉ (ce tour)** — variante REMPLACEMENT à l'it1 (au lieu de « 1-bis ») : coût marginal nul, état non dessiné sinon.
- **RETENU (ce tour)** — sélecteur « CHAMP » sur la Card 1 : sans lui, aucun mécanisme ne permet à l'auteur de choisir le champ, alors que le goal l'exige.
- **DIFFÉRÉ, pas rejeté** — lien « Aller à Personnages » dans l'état vide (0 personnage) : plomberie maintenant prouvée bon marché, mais hors du texte minimal exigé par le cadrage.
