# Notes du comité — `dossier-format` itération 1

> Composition : **5 rôles** (`pm-produit`, `tech-lead`, `ux-designer`, `qa`, `narratif-ia`).
> Motif du cinquième : l'itération fixe le document que l'IA lira au Temps 2 — la frontière code/IA, le budget de contexte et les identifiants stables s'y décident.
> Notes condensées : `RISQUE / OBJECTION / PROPOSITION / VERDICT` du tour 1, puis le statut de chaque objection au tour 2.

---

## PM — produit

**Tour 1.** RISQUE : personne n'a écrit le « sous-ensemble minimal » ; livré tel quel, l'ouvrier reconstitue la forme complète qu'on vient de couper au 4→5. OBJECTION : sans fixture propre à l'itération 1, distincte du dossier de référence (livrable de it5), les critères d'aller-retour ne sont pas démontrables sans anticiper it5. PROPOSITION : liste de champs racine par racine ; `depart.personnage_joueur.contraintes` **supprimé** du schéma. VERDICT : recevable sous réserve.

**Tour 2.** Adopte le `{id, nom}` générique du Tech Lead et **retire** de sa propre liste `objets.nom_interne/description_joueur` et `indices.verite` — aucun critère d'it1 ne les lit. Retire `objectifs[].reussi_si_texte`, en corrigeant le motif du narratif : ce n'est pas « une forme à renommer », c'est qu'aucun critère d'it1 ne lit `objectifs[]`. **Maintient `Delta[]`** sur `jalons[].effet` et consorts, en signalant que l'effacer rouvrirait une décision tranchée au cadrage. **Ajoute au périmètre** une confirmation de succès nommant le dossier importé — sans elle, « importer » n'est démontrable à personne, et la valeur nulle pour l'auteur est son critère de veto. Fixture propre à it1 : maintenue.

---

## Tech Lead — architecture

**Tour 1.** RISQUE : la scission n'est pas « neuf lignes d'import » ; elle écrit dans `index.ts`, `hooks.ts` et `CloudSyncService.ts` — les trois fichiers que le contrat dossier doit écrire, donc la collision de l'itération refusée, déguisée en refactor mécanique. Second risque : `reconcile()` adopte le cloud par `local.set()` **derrière** le service — un dossier entré par ce chemin n'est ni validé ni gelé, sans qu'un test rougisse. OBJECTION : `create`/`duplicate`/`update`/`rename` n'ont aucun appelant en it1. PROPOSITION : **deux lots séquentiels** — lot 1 `contrat` propriétaire de **tout** `brain/`, lot 2 propriétaire de la feature, zéro fichier de `brain/`. VERDICT : approuvé sous réserve.

**Tour 2.** Concède le `Pick` (voir narratif, objection 1) : « la phrase est fausse, à corriger, pas à propager ». Sauve ce qui reste vrai des trois racines — elles achètent la **non-dérive de l'assembleur** (`{ canon, monde }`, deux identifiants, contre une énumération de dix clés que personne ne maintiendra), pas le confinement de la charge utile. Fixe le décompte à **26** et trouve la pièce manquante : `src/brain/index.ts:6` est un `export type … from './types'`, invisible à un grep sur `import`. **Durcit en veto** : `DossierService.get()` ne rend jamais `persistence.get()` directement, il repasse par `validateDossier`. **Durcit** la réduction du service à quatre méthodes. **Retire** son objection sur `meta` : `ton` remonte sous `canon`, `meta` disparaît. Renvoie `Delta[]` en it2.

---

## UX — design system

**Tour 1.** RISQUE : après un import réussi, rien n'est visible — `LibraryScreen` ne liste que des `Book`, l'action se lit comme un échec silencieux. OBJECTION à son propre contrat de cadrage : le glyphe ⇪ n'appartient pas au jeu de glyphes du système → **⬚**, déjà porteur du sens « réceptacle » dans `ImageUpload` ; et pas de glyphe pour l'« en cours » (↻ signifie déjà « relier », le réutiliser créerait une fausse affordance). PROPOSITION : cinq états (`empty` / `reading` / `file-error` / `invalid` / `valid`), registre d'erreur **fichier** distinct de `DossierIssue`. VERDICT : feu vert sous réserve des deux corrections de glyphe.

**Trouvaille vérifiée** : `--surface-raised` n'est défini dans **aucun** fichier de `src/styles/tokens/` et est utilisé à `src/brain/components/ImageUpload.tsx:185`. Confirmé par l'orchestrateur. `--surface-sunken` existe (`colors.css:69`).

**Tour 2.** Répond à QA en **déplaçant le `JSON.parse` dans `brain/`** plutôt qu'en acceptant son registre hors de portée : une fonction pure, testable avec des littéraux, sans monter de composant — la copie française reste côté feature parce que c'est de la présentation. Maintient le registre fichier séparé (seul son emplacement de code bouge). Maintient son risque d'ouverture **sans le durcir en veto**, en motivant : le périmètre n'est pas son terrain de blocage.

---

## QA — vérification

**Tour 1.** RISQUE : un nouveau SSOT que zéro écran n'appelle avant la n° 2, prouvé seulement par des fixtures inline — le piège nommé au § 1 ter de la roadmap, rejoué. OBJECTION : le critère « sans autre changement que les neuf lignes d'import » est **faux avant qu'on écrive une ligne** et non observable par un diff — veto. PROPOSITION : matrice de rejet à 12 entrées écrite **avant** le code (KR-158), 8 critères `Étant donné / Quand / Alors`. VERDICT : conditionnel.

**Tour 2.** Accepte le défaut `reconcile()` du Tech Lead et **durcit son critère de gel** pour couvrir le chemin cloud. **Refuse le neuvième critère** du narratif en tant que critère autonome et le **fond** dans son critère 3 — le plafond de huit tient. **Confirme** l'unicité des identifiants en périmètre it1. **Accepte** le déplacement du parse par l'UX. Résout le décompte à 26. Retire son objection sur le sous-ensemble non nommé (PM et Tech Lead l'ont livré).

---

## Narratif & IA

**Tour 1.** RISQUE : l'itération fige le seul bloc chargé à chaque tour ; livré sans sa scission d'audience et sans sa borne, `canon` devient omniscient et illimité, et le surcoût se découvre au tour 40 d'une session, pas au commit. **OBJECTION 1 — la plus importante du raffinage** : l'arbitrage du cadrage affirme qu'« à la n° 10 le compilateur prouvera » l'absence de fuite par `Pick<Dossier, 'canon' | 'monde'>`. **C'est faux** — TypeScript est structurel, `JSON.stringify` d'un `Dossier` élargi sérialise `charpente`. `Pick` garantit la lecture, jamais la charge utile. OBJECTION 2 : `canon.mj` / `canon.partage` coûte trois accolades et l'itération 1 écrit validateur, fixture et aller-retour **contre cette forme**. OBJECTION 3 : `meta.ton` et `canon.interdits_ton` sont la même consigne injectée, coupée entre deux racines dont une seule entre dans le contexte. VERDICT : recevable sous réserve.

**Tour 2.** Objection 1 **retirée** (retenue par l'orchestrateur, arbitrage corrigé). Objections 2 et 3 **maintenues**, chiffrées à deux accolades et une clé déplacée. **Adopte** le cadre du Tech Lead (les treize clés existent, it2 remplit) en le jugeant meilleur que son propre sous-ensemble. Sur le budget : ce n'est pas un neuvième critère mais une clause — sans elle, `warnings` est **structurellement toujours vide**, donc `warnings.toEqual([])` n'est pas une assertion discriminante mais une constante (KR-162 mordu de front), et quatre features consommeront un canal que rien n'a jamais rendu rouge. **Repli offert** : si la clause est refusée, `warnings` **sort** de `DossierValidation` en it1 et y rentre en it3 avec son premier producteur. **Aucun veto.**
