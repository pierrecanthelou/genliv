# Tour 1 — PM Produit

```
RISQUE — Le risque auteur le plus concret n'est pas le bouton mort (question 6, traitée plus bas) mais un silence symétrique : au moment où `LibraryScreen` bascule sur `DossierService.list()`, tout `Book` existant (book-library a déjà livré 3 itérations dessus) devient invisible sans un mot — rien n'est supprimé en stockage, mais l'auteur qui avait un livre hier ne le retrouve plus nulle part dans son accueil. C'est exactement le silence que KR-179/BUG-048 refuse côté dossier, non traité côté Book.

OBJECTION — Le goal et les critères #1-4 ne disent rien du sort visible des `Book` existants. « aucune écriture nouvelle sur le dossier » couvre le dossier, pas le mutisme fait au `Book`. Une définition qui fait disparaître une classe entière de contenu auteur sans la nommer n'est pas close.

PROPOSITION — (1) Question 6 : je confirme la recommandation — `App.tsx` cesse de monter `<CreateBookEntry/>`, seul `<ImportDossierButton/>` reste comme entrée de la bibliothèque. Je rejette l'alternative « garder les deux listes » : c'est la couche horizontale que je refuse par doctrine, elle double le rendu et la suppression pendant une bascule pour un bénéfice nul. (2) J'ajoute UN critère, zéro nouveau lot, zéro nouvelle méthode `brain/` : si `BookService.listBooks().length > 0` et `DossierService.list().length === 0`, l'état vide nomme explicitement que les anciens livres restent stockés mais ne s'affichent plus ici pendant la bascule — simple lecture d'un service déjà existant, une ligne de copie.

VERDICT — recevable sous réserve : (2) devient le 5e critère d'acceptation de cette itération, sinon veto sur le silence fait aux `Book` existants.
```
