# Tour 2 — UX — `dossier-canon` it1

RISQUE — Le revert proposé par le tech-lead perdrait plus que le champ fautif : `update()` recompose TOUT `canon` depuis un brouillon partagé à chaque blur ; si l'auteur a aussi corrigé un autre champ valide dans la même session, un revert global l'effacerait avec le fautif — un dégât plus large que celui qu'il cherche à éviter.

OBJECTION — Je confirme nommément mon modèle mental : un **état de brouillon local explicite**, un seul objet `{synopsis_mj, accroche_joueur, ton, interdits_ton}`, initialisé depuis `dossier.canon` à l'ouverture du panneau, **jamais réinitialisé** par un `dossier:updated` du MÊME dossier (même garde que `useOpenDossier` applique déjà pour ne pas écraser une frappe en cours par un écho de réconciliation cloud), committé à chaque `blur`. Sur refus, il ne se réinitialise PAS : la divergence écran/dossier est **nommée** par le bandeau — attendue et documentée, pas accidentelle. Ce n'est pas une seconde source de vérité au sens KR-013, qui vise l'état DÉRIVÉ recopié par un `useEffect` invisible à la revue ; c'est un brouillon d'ÉDITION, le patron universel de tout champ de texte avant commit. Le tech-lead peut lever son objection sur cette base. J'ajoute à sa liste de fichiers du lot 1 (Annexe 2) mes 3 préalables manquants : `IssueList`→`brain/components/`, `compterMots` exporté, `Field.maxLength`/`showCounter`.

PROPOSITION — Je concède `role="status"` sur le conteneur du compteur : zéro changement visuel, pur hook de test, précédent déjà posé par `role="note"` de `book-library`. Bandeau de refus ET compteur d'avertissement portent tous deux `role="status"` — l'a11y étant hors cadre du projet, la distinction `alert`/`status` que j'aurais autrement tranchée ne se pose pas ici.

VERDICT — recevable.

---

## Annexe révisée

### §2 · Compteurs (révision : `role`)
Le bloc compteur rendu par `Field` (actif si `showCounter`) porte désormais `role="status"` sur son élément conteneur (`<p role="status">{n}/{maxLength} mots</p>`) — attribut seul, aucun `aria-live` explicite requis (l'a11y réelle est hors cadre ; c'est un ancrage de requête RTL, pas une région annoncée). Formule, couleur (`--text-faint` sous 90 %, `--bad` au-delà), position (droite, mono) : inchangées.

### §5 · Refus vs avertissement (révision : modèle de brouillon + `role`)
**Brouillon local** : le panneau Canon tient un unique état `{synopsis_mj, accroche_joueur, ton, interdits_ton}`, initialisé depuis `dossier.canon`, jamais réinitialisé automatiquement — y compris après un refus. `interdits_ton` committe immédiatement à l'ajout/suppression d'une ligne (pas de `blur` sur une action de bouton) ; les 3 champs de prose committent à leur `blur` respectif, chacun envoyant le brouillon **complet** des 4 champs à `update()`.

**Refus** (`statut: 'refuse'`) : le brouillon reste intact, focus reste sur le champ actif, bandeau `« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »` (`--bad`) — **porte désormais `role="status"`** — suivi d'`IssueList` (déplacé en `brain/`) listant `errors[]`.

**Avertissement seul** (`statut: 'ecrit'`, ex. dépassement de budget) : le brouillon se réaligne avec le dossier retourné (déjà identique, aucun revert visible) ; aucun bandeau ; seul signal = le compteur du champ concerné, `--bad` dès 90 % du budget, **`role="status"`** (§2) — suffisant comme rendu-à-l'écran de l'avertissement pour cette itération, seul code de warning atteignable sur Canon (`texte-trop-long`).

---

## Note de l'orchestrateur (tour 3)

Deux points restent en tension légère après ce tour, tranchés en arbitrage (§8 du plan) plutôt que rejoués en tour 3 : (1) `Field.maxLength`/`showCounter` vs. compteur local à `PanneauCanon` — le tech-lead objecte qu'avec un seul appelant réel, promouvoir `Field` est prématuré (même règle que celle qui a promu `IssueList` avec 2 appelants) ; (2) `role="status"` sur le compteur — le tech-lead et la QA (qui a proposé `data-etat` en alternative testable) convergent sur « aucun rôle sur le compteur, `status` réservé au bandeau », l'UX est seule à le vouloir aussi sur le compteur, sans changement visuel en jeu.
