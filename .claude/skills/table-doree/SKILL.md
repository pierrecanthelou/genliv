---
name: table-doree
description: Concevoir, poser et prouver une table dorée — le test qui épingle valeur par valeur un registre de données sorti du score de mutation. À charger avant d'écrire ou de relire une table dorée, ou d'ajouter une entrée à un registre qu'elle couvre (BESTIARY, CHALLENGE_TIERS, CHARACTERISTICS, POSTURES).
---

# Table dorée — concevoir, poser, prouver

**La source qui fait foi dans ce projet** : `docs/REGLES-DU-JEU.md` (KR-130). Toute ambiguïté de mécanique se tranche là, jamais dans le code.
**L'instance en place** : `src/brain/rules.golden.test.ts` — 5 tests, dans la porte de commit. C'est l'exemple de référence : lis-le avant d'en écrire une autre.

## 1 — Ce que c'est, et ce que ce n'est pas

Une table dorée est un test qui épingle **valeur par valeur** le contenu d'un registre de données, pour compenser la sortie de ce registre du dénominateur du score de mutation.

Ce n'est **pas** un test de comportement : elle n'appelle aucune fonction du domaine. Ce n'est **pas** un instantané (`toMatchSnapshot`) : un instantané se régénère depuis le code, donc il enregistre ce que le code produit — y compris quand le code est faux. C'est exactement le mode de panne que la table dorée existe pour éviter.

> **Son unique mode de panne** : être **verte et fausse**. Une table écrite depuis la sortie du code fige le défaut au lieu de le verrouiller, et rien en aval ne le verra — le vert est ce qu'elle sert à produire. Toute la conception ci-dessous ne vise que ça.

## 2 — Est-ce qu'il en faut une ? L'arbre de décision

Trois questions, dans l'ordre. La première qui répond tranche.

1. **Est-ce une donnée ou un calcul ?**
   Un calcul (`challenge.ts`, `combat.ts`, `xp.ts` — une fonction qui transforme) → **score de mutation + tests unitaires de valeur**. Pas de table dorée : elle n'a rien à épingler et deviendrait fragile au moindre refactor.
   Une donnée (registre, table de constantes nommées, énumération porteuse de valeurs) → question 2.
2. **Est-elle neutralisée dans la config de mutation** (`// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration`) ou hors du périmètre muté ?
   Oui → **table dorée obligatoire, livrée dans le même lot**. Neutraliser sans épingler est un relâchement déguisé en durcissement.
   Non, et on ne compte pas la neutraliser → question 3.
3. **A-t-elle une source externe qui fait foi ?**
   Oui (une section de `docs/REGLES-DU-JEU.md`) → table dorée **recommandée** même sans neutralisation : c'est le seul instrument qui relie une constante du code à l'autorité qui la fixe.
   Non → ce n'est pas un registre, c'est un choix d'implémentation. Un test de comportement suffit.

**Couverts aujourd'hui** : `BESTIARY` (22 lignes, 11 champs), `CHALLENGE_TIERS` + `DEFAULT_CHALLENGE_TIER`, `CHARACTERISTICS` + `MONSTER_CHARACTERISTICS` + `CHARACTERISTIC_MAX`, les libellés et facteurs de `POSTURES`.

## 3 — La règle de couverture : exactement la surface neutralisée

**Ni moins, ni plus.**

- **Moins** est le piège coûteux : un littéral neutralisé et non épinglé sort du dénominateur **et** de tout test — il n'est plus vérifié par rien, et le score monte pendant que la couverture réelle baisse. **Mesuré ici** : sans l'extension de la table aux libellés, **31 `StringLiteral`** (24 de `CHARACTERISTICS`, 4 libellés de tiers, 3 de postures) auraient disparu des deux côtés. Ils étaient dans la région neutralisée sans être dans la liste des champs « intéressants » du plan. **Les libellés comptent.**
- **Plus** rend la table fragile : épingler une valeur de retour de fonction la fait rougir à chaque refactor légitime, et une table qui crie pour rien finit désactivée. C'est le même piège qu'un `// Stryker restore` posé trop loin — le cas d'`ecartBand` dans `combat.ts`.

**Procédure** : ouvre le fichier de registre, lis les bornes `disable` / `restore`, liste **tout** ce qu'elles couvrent, et donne à chaque élément son assertion. Si tu n'arrives pas à lister la surface, c'est que le `restore` est posé trop loin — corrige la neutralisation d'abord.

## 4 — La structure : cinq assertions, dans cet ordre

Le patron est celui de `rules.golden.test.ts` ; l'exemple ci-dessous en est la forme minimale.

```ts
// 1. Une forme attendue DÉCLARÉE À PART — jamais le type de production.
//    Si le type de prod change, la table doit rougir ; en réutilisant le type,
//    elle suivrait le changement en silence.
interface GoldenTier {
	id: string
	label: string
	seuil: number
}

// 2. La table littérale, écrite à la main, relue dans docs/REGLES-DU-JEU.md.
//    Une ligne = une entrée. Aucune génération, aucune boucle, aucun spread.
const EXPECTED_TIERS: GoldenTier[] = [
	{ id: 'TC1', label: '…', seuil: 0 },
	// …
]

describe('table doree — <registre> (§ <section des règles>)', () => {
	it('la table est figee (N entrees, tous champs)', () => {
		// 3. Cardinal épinglé DES DEUX CÔTÉS.
		//    Le premier interdit de retirer une ligne de l'attendu pour faire passer ;
		//    le second fait échouer toute addition ou suppression en production.
		expect(EXPECTED_TIERS).toHaveLength(4)
		expect(TIERS).toHaveLength(EXPECTED_TIERS.length)

		// 4. Jeu de clés épinglé quand le registre est un objet.
		//    toEqual, pas toContain : l'ordre et l'exhaustivité comptent.
		expect(Object.keys(CHALLENGE_TIERS)).toEqual(['TC1', 'TC2', 'TC3', 'TC4'])

		// 5. Comparaison champ à champ, en bouclant sur L'ATTENDU.
		EXPECTED_TIERS.forEach((attendu) => {
			const reel = TIERS[attendu.id]
			expect(reel.label).toBe(attendu.label)
			expect(reel.seuil).toBe(attendu.seuil)
		})
	})

	it('chaque entree a un identifiant unique', () => {
		const ids = EXPECTED_TIERS.map((t) => t.id)
		expect(new Set(ids).size).toBe(ids.length)
	})
})
```

Deux détails qui décident de la valeur du test :

- **Boucler sur l'attendu, jamais sur la production.** Une boucle sur le registre de production ne voit pas une ligne supprimée — elle itère simplement une fois de moins et passe au vert. C'est l'assertion de cardinal qui rattrape ça, d'où son caractère non facultatif.
- **Un `expect` par champ**, pas un `toEqual` sur l'objet entier : le message d'échec doit nommer le champ fautif, sinon la sonde du § 6 ne prouve rien de lisible.

*(Rappel de style du dépôt : pas d'apostrophe dans les libellés `describe`/`it`.)*

## 5 — Les cinq anti-patrons

| Anti-patron | Pourquoi c'est vert et faux |
|---|---|
| `toMatchSnapshot()` / `toMatchInlineSnapshot()` | Se régénère depuis le code. Enregistre le défaut au lieu de le refuser. **Interdit dans une table dorée.** |
| Dériver l'attendu de l'import (`expect(X).toEqual({ ...X })`) | Tautologie : le test compare le code à lui-même. |
| Recopier la valeur affichée en `received` par un test rouge | Même tautologie, en deux temps — et beaucoup plus difficile à voir en revue. |
| Recopier depuis une maquette, un `.dc.html`, un jeu de données de démo | Ces données sont factices par construction. Elles ont l'air justes. |
| Écrire la table **après** le code, « pour verrouiller ce qui marche » | Personne n'a vérifié que ce qui marche est ce que `REGLES-DU-JEU.md` demande. |

Le fil commun : dans les cinq cas, la valeur attendue vient du **code**. Elle doit venir de la **source**.

## 6 — Prouver que le verrou tient : la sonde (obligatoire, une fois par table)

Une neutralisation n'est légitime que si sa contrepartie **échoue quand la valeur bouge**. Tant que ça n'a pas été constaté, la table est une intention.

1. Copie le fichier de registre dans une sauvegarde hors du dépôt ; note son empreinte (`md5sum`).
2. Modifie **une seule valeur** dans le fichier de registre — de préférence un libellé, le champ qu'on oublie le plus souvent d'épingler.
3. Lance **le seul fichier de test doré**. Il doit **rougir**, et le message doit **nommer le champ**.
4. Restaure **par copie de la sauvegarde**, puis re-vérifie l'empreinte : identique.
5. Recopie les deux empreintes et la sortie rouge dans la revue d'itération.

> ⚠️ **Ne restaure jamais par `git checkout`** (KR-172). La commande touche l'index partagé : si un autre agent lit ou écrit le même arbre non commité, elle efface son travail — c'est arrivé, 409 lignes perdues, diagnostiquées seulement parce que le revert était exact. Une sauvegarde de fichier vérifiée par empreinte est la seule restauration sûre.

**Précédent à imiter** : `outillage-it1.revue.md` § 3 — `describe` d'`AG` modifié dans `characteristics.ts`, run du seul fichier doré, restauration vérifiée (`b0b6273eb3d11017874a37e972846ca0` avant et après).

Si la sonde **ne rougit pas** : la table ne couvre pas ce champ. C'est un défaut de la table, à corriger avant toute autre chose.

## 7 — Faire évoluer une valeur : le seul chemin autorisé

**`docs/REGLES-DU-JEU.md` → table dorée → code**, dans cet ordre, avec un test rouge entre les deux dernières étapes.

1. Lis la section des règles qui fixe la valeur. Si elle ne la porte pas : **on corrige les règles d'abord**, jamais l'inverse (KR-130). Si tu n'as pas autorité pour ça : `BLOCAGE`.
2. Modifie la **table dorée**. Le test doit passer au **rouge** — c'est la preuve que la table mordait vraiment sur ce champ. S'il reste vert, retourne au § 3 : la couverture était incomplète.
3. Modifie le **code**. Le test repasse au vert.
4. Cite la section source dans la revue d'itération, une ligne par valeur touchée.

Ajouter un monstre au bestiaire suit le même chemin : la ligne entre dans `EXPECTED_BESTIARY` d'abord, le cardinal (22) rougit, puis le code la produit.

## 8 — Où elle vit

`src/brain/rules.golden.test.ts`, **dans la porte de commit** (le run `jest` ordinaire), et **hors** du run de mutation (`jest.mutation.cjs`). Une table dorée qui ne tournerait qu'en fin d'itération ne protégerait rien entre deux itérations.

## 9 — Ce qu'elle ne remplace pas

Le score de mutation sur `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`. Les tests de comportement. La validation des entrées. Une table dorée prouve qu'une donnée est celle que les règles demandent — rien de plus, et c'est déjà ce que rien d'autre ne fait.

## 10 — Liste de contrôle de revue

- [ ] Chaque registre neutralisé a sa table, livrée **dans le même lot** que la neutralisation
- [ ] La table couvre **exactement** la surface `disable`/`restore` — libellés compris
- [ ] La forme attendue est déclarée à part, pas réutilisée du type de production
- [ ] Cardinal épinglé des deux côtés · jeu de clés épinglé · unicité des identifiants
- [ ] La boucle porte sur l'attendu, un `expect` par champ
- [ ] Aucun instantané, aucune valeur dérivée de l'import
- [ ] Chaque valeur porte, dans la revue, la **section de `REGLES-DU-JEU.md`** d'où elle est relue
- [ ] **Sonde exécutée**, sortie rouge et empreintes avant/après recopiées dans la revue
- [ ] Le fichier tourne dans la porte de commit, pas seulement en fin d'itération
