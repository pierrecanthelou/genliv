# Raffinage `moteur-acteurs` it1 — Tour 1 — UX Designer

## RISQUE
Le générique « RÉCIT » comme `entete` d'`OutcomeBlock`, repris tel quel pour la réplique d'un PNJ, rend indistinguable « le narrateur décrit » et « le personnage parle » — exactement l'ambiguïté que l'`open_questions` du cadrage (domicile de la réplique dans `recit`) laisse ouverte sans trancher la face visuelle.

## OBJECTION
Le texte système unique proposé au cadrage, « {cible} n'est pas ici », est faux dans le cas PNJ mort : un cadavre est encore « ici », il ne peut simplement pas répondre. L'acceptance criterion #2 regroupe absent/mort/sans-identité sous une même garde structurelle, mais ça ne doit pas forcer un seul texte — le registre interface doit rester neutre ET exact.

## PROPOSITION (pixel)
1. `OutcomeBlock` réutilisé tel quel (zéro nouveau composant) mais `entete` = nom du PNJ en mono MAJUSCULES (ex. « GARDE TORVALD »), lu directement du dossier comme chrome d'interface jamais injecté — même légitimité que `monde.indices[].nom` déjà actée pour le carnet (tour2 UX cadrage). `entete="RÉCIT"` reste réservé à R3. Coût nul sur le contrat : une seule prop déjà existante, pas de variante.
2. Message système, registre interface, via `bannierInterface` existant (`⊘ ` + `role="status"`), deux textes distincts :
   - Absent du lieu / sans prose d'identité : `"{cible} n'est pas ici."`
   - Mort : `"{cible} ne peut pas vous répondre."`
   `{cible}` = texte tapé par le joueur, jamais reformulé.
3. Clavier : aucun ajout — `PlayerInputBar` gère déjà Entrée (submit) et le focus reste sur le champ après soumission. Pas de modale en it1, donc pas d'Échap à câbler.
4. Aucun placeholder neuf requis — `PLACEHOLDER_CHAMP` existant couvre « parler » comme tout autre verbe.

## VERDICT
Recevable sous réserve : la distinction d'`entete` (nom du PNJ vs « RÉCIT ») doit être tranchée au tour 3 avec le Tech Lead sur le domicile exact dans `EntreeJournal`, et les deux textes système doivent remplacer le texte unique du cadrage.

---

## ANNEXE — Contrat de design (it1)

**Composants** : `OutcomeBlock` (existant, zéro variante neuve), `Field` + bouton submit de `PlayerInputBar` (existant, inchangés), `bannierInterface` (style existant, `role="status"`, préfixe `⊘ `).

**Textes exacts**
- `entete` réplique PNJ : nom du PNJ tel qu'écrit par l'auteur (`Personnage.nom`), rendu en mono MAJUSCULES par le style `libelleEntete` déjà défini dans `OutcomeBlock.tsx` — **vérifier au code que la casse MAJUSCULE est bien assurée par un `text-transform: uppercase` token, sinon un nom d'auteur en minuscules casse le registre mono-majuscules du reste de l'interface — point à lever par le Tech Lead**.
- `TEXTE_PNJ_ABSENT = (cible) => `${cible} n'est pas ici.``
- `TEXTE_PNJ_MORT = (cible) => `${cible} ne peut pas vous répondre.``
- `replique` du PNJ : fiction 2e personne présent, immersive, zéro chiffre, zéro mot de mécanique — registre déjà posé par le `design_contract` de la spec (liste de mots interdits dérivée KR-270, propriété Narratif-IA).

**États**
- Défaut : champ vide, placeholder `"Décrivez ce que vous tentez…"` (inchangé).
- Verrouillé (`isLocked`) : bouton affiche `…`, champ `disabled` (inchangé, patron `ConsoleCommandes`).
- Réponse PNJ reçue : `OutcomeBlock entete={nomPnj}` contenant `replique`, affiché au même emplacement que le bloc RÉCIT actuel (mutuellement exclusif — jamais les deux pour un même pas, puisque `parler` n'appelle jamais R3).
- PNJ absent/sans identité : bannière `⊘ {cible} n'est pas ici.`
- PNJ mort : bannière `⊘ {cible} ne peut pas vous répondre.`
- Sortie R4 invalide après rejeu (KR-283) : **aucun** `OutcomeBlock`, aucune bannière de repli fictionnelle — seule la bannière `TEXTE_INDISPONIBLE` existante (« Le service est momentanément indisponible. ») peut légitimement s'afficher, déjà registre interface pur et déjà testée.

**Clavier** : Entrée soumet (form existant), focus reste sur le champ, pas de modale en it1 donc pas d'Échap à spécifier. Tab order inchangé (un seul champ + un bouton).

**Discipline de l'accent** : aucun usage nouveau — ni le nom du PNJ en entete, ni les bannières, ne prennent `--accent` (réservé sélection/action primaire).

**Zéro valeur en dur** : tous les styles proviennent de tokens déjà nommés dans `OutcomeBlock.tsx` et `PlayerInputBar.tsx` (`--font-mono`, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--fs-meta`, `--text-muted`) — aucun token neuf requis pour it1.

**ESLint proposée** (complément à celle du cadrage) : interdire toute chaîne littérale « pas ici »/« ne peut pas » codée ailleurs que dans les constantes `TEXTE_*` nommées du fichier — précédent déjà présent dans `PlayerInputBar.tsx` avec `GABARIT_NON_RECONNU`, pattern à répliquer, pas à réinventer.

## Décisions prises en autonomie (Tour 1)
- Casse du nom de PNJ en `entete` (MAJUSCULES visuelles) → supposé porté par le style existant de `OutcomeBlock` → si le CSS ne force pas la casse, un nom d'auteur en minuscules romps le registre mono-majuscules de l'interface ; coût : un `text-transform: uppercase` token à ajouter, trivial mais à vérifier par le Tech Lead avant livraison.
- Deux textes système distincts (absent/sans-identité vs mort) plutôt que le texte unique du cadrage → plus exact, coût : une constante de plus, aucune complexité de flux ajoutée → si le comité préfère un seul texte générique pour réduire la surface de test, le risque est une fausse affirmation narrative mineure (« n'est pas ici » sur un cadavre présent), jugée bénigne mais évitable à coût nul.
