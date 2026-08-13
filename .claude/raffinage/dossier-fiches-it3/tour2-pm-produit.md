# Tour 2 — `pm-produit` · `dossier-fiches` it3 (contre-lecture)

## 1. Réponse nommée — UX (tour 1), état « partiel »

UX exige qu'un personnage où seul FO est réglé affiche *FO en `--text-strong`, les 7 autres en « — »*. C'est incompatible avec le modèle TOTAL : `{ ...(p.stats ?? STATS_INITIALES), [carac]: valeur }` écrit les 8 clés dès le premier stepper touché — l'état « 1 seule clé posée, 7 absentes » devient **inatteignable par construction**. Le tableau d'UX décrit un état mort.

Je ne retranche pas la distinction que demande UX — elle a raison sur le fond (« non renseigné » ≠ « réglé à 1 » est une exigence d'auteur légitime, pas un caprice visuel). Je la **redéplace au niveau du bloc**, pas de la clé : un bloc *absent* (aucune des 8 clés) contre un bloc *ouvert* (8 clés, plancher 1 visible comme un vrai chiffre modifiable). La ligne « Partiel » du tableau § 6 d'UX tombe ; « Défaut » et « Complet » suffisent.

## 2. Mes objections du tour 1 — statuées

- **Proposition 1 (pas de mécanisme générique « dispense Record »)** — **RETIRÉE, satisfaite**. `Object.fromEntries(CHARACTERISTIC_VALUES.map(...))` énumère 8 clés d'un registre **fermé et déjà existant**, dans `destinations.ts`/`tables.ts` uniquement — ce n'est pas une API réutilisable qu'it6 pourrait invoquer sans re-décider sa propre forme. C'est la dérivation locale que je demandais, pas le chantier transverse que je refusais (D8 tranché).
- **Proposition 2 (`CARACTERISTIQUE_MIN` nommé, pas littéral)** — **RETIRÉE, satisfaite**. Tech-lead et narratif-ia convergent sur `dossier/types.ts`, hors de `characteristics.ts` — D6 confirmé, pour le motif qu'ils donnent (cliquet mutation évité pour zéro bénéfice).

**Aucun veto.**

## 3. D1 tranché — du point de vue de l'auteur

**Non, il n'est pas acceptable que le document se remplisse silencieusement de 7 valeurs que l'auteur n'a pas écrites au fil d'un simple clic sur un seul stepper.** Un `CA=1` ou un `IN=1` n'est pas un espace vide — d'après narratif-ia, `1` est une vraie valeur mécanique (des monstres au bestiaire ont `FO 1`), qui produira un vrai seuil de jet en Temps 2. Si l'auteur règle Force à 3 pour un PNJ et ne remarque jamais que Caractère est resté à 1, il a signé un chiffre qu'il n'a pas choisi, et ce chiffre jouera.

**Ce que j'exige à la place** : le passage de « non réglé » à « réglé » doit être un **geste explicite de l'auteur**, pas un effet de bord de la première caractéristique touchée. Je retiens l'alternative que le tech-lead a lui-même nommée et laissée en arbitrage — l'état vide **« + Régler les caractéristiques… »** qui écrit les 8 clés au clic, plutôt que le défaut silencieux. Elle est déjà chiffrée **dans le même lot 2**, sans fichier ni lot supplémentaire : ce n'est pas un ajout, c'est un choix entre deux options déjà sur la table. Elle correspond en plus à l'idiome déjà écrit dans CLAUDE.md (« Empty states » : placeholder engageant, `+ Ajouter…`) — pas un vocabulaire produit neuf.

Ce qui rend la chose honnête une fois le geste posé : le plancher `1` sur les 8 caractéristiques n'est plus un artefact — c'est le point de départ visible d'une action que l'auteur vient de déclencher, qu'il ajuste ensuite caractéristique par caractéristique.

## 4. D5 — correction de `docs/REGLES-DU-JEU.md` § 1

**RETENU, dans le lot contrat, tel que borné par narratif-ia** — deux lignes, un seul fait (le plancher de l'échelle), pas une réécriture. Ce n'est pas une réouverture de décision actée (aucun `resolved_decision` ne fixe la borne basse) et ce n'est pas un élargissement du périmètre démontrable : la doc ne devient pas une deuxième capacité livrée à l'auteur, c'est la dépendance documentaire que KR-130 impose avant d'écrire `CARACTERISTIQUE_MIN`. Un `.md` de plus dans le lot 1 ne change ni le compte de lots (toujours 2) ni la phrase de démo.

## 5. D9 — élargir l'`open_questions` existante

Pas mon domaine à trancher (propriétaire n° 10), mais rien à objecter : élargir une entrée plutôt qu'en ouvrir une neuve va dans le sens de la discipline de budget de contexte. Aucune objection PM.

## 6. Périmètre final — la phrase de démo tient toujours

Toujours **une** phrase, aucun « et » de capacité. Ce que les quatre autres rôles ont ajouté est de la **plomberie et de la preuve**, pas une deuxième tranche :

- 8 lignes × 2 tables — mécanique du « 8 caractéristiques », connue au cadrage, dans le lot 1 existant ;
- correction doc 2 lignes — dépendance KR-130, dans le lot 1, pas un lot neuf ;
- test-grep — preuve, pas fonctionnalité ;
- extension `Stepper` — **retirée par l'UX elle-même au tour 2**, donc plus rien à compter.

Toujours **2 lots**, 8 critères max. Aucun signal de gonflement. Rien à couper.

## 7. Hors périmètre (à écrire dans le plan)

- Mécanisme générique de « dispense Record » réutilisable pour it6 (curseurs) — refusé, décision fermée ici.
- `src/brain/characteristics.ts` — non touché ; `CARACTERISTIQUE_MIN` va dans `dossier/types.ts`.
- Libellé narratif dérivé du chiffre (« FO élevée ») pour le contexte modèle — n° 10.
- Toute résolution de jet / lecture runtime des caractéristiques par le moteur — Temps 2.
- `plan_actions[]` / `contre_mesures[]` et l'extraction `hooks/useEcriturePersonnages.ts` — it4, datée par le tech-lead.
- Nouveau chemin de refus/bandeau pour ce bloc — inatteignable par construction, non construit.
- Teinte `--good`/`--bad` sur le PV — exclue.
- `BrouillonPersonnage` / `ChampTexte` / `commit()` / `RefusEnCours` — inchangés, non rouverts (BUG-058, KR-197).
- Réécriture de `REGLES-DU-JEU.md` § 1 au-delà de la phrase d'échelle — pas une refonte du chapitre.
- Rediscussion des dispenses `LIBRES`/`SANS_DESTINATION` posées à it2 — non rouverte.
- Retrait d'un personnage — it5, inchangé.
