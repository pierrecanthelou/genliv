# Tour 2 — pm-produit — moteur-dossier it2

RÉPONSE — Tech-lead propose de couper it2 en deux si le comité veut le trio `lire`/`ecrire`/`effacer`. **Je décline le trio, donc la coupe** : port réduit à `ecrire` seul, reprise (T-3) explicitement hors périmètre — ma réserve de tour 1 est déjà close. La reprise n'a rien à démontrer tant qu'aucune session n'est observablement perdue/retrouvée par l'auteur ; couper maintenant gonflerait le compteur d'itérations pour zéro capacité nouvelle.

MES OBJECTIONS —
1. « Le port doit nommer son second appelant réel, sinon veto » → **RETIRÉE** (motif : la substitution — frontière magasin brut/synchronisé, plutôt qu'extractibilité — me convient : elle est vérifiable aujourd'hui, non spéculative ; couplée à `ecrire` seul et zéro méthode fantôme, KR-109 est réglé par **coupe de périmètre**, pas par appelant inventé).
2. « La reprise doit être tranchée avant l'ouverture des lots » → **RETIRÉE** (motif : T-3 la tranche **par écrit**, hors périmètre — c'est trancher, pas hériter).

POSITION — **X-3** : un critère sans pouvoir séparateur ne livre rien à l'auteur, un chiffre de plus au tableau ; je rejoins la QA, le replay littéral sort vers la n° 11. **X-4** : tranché — motif substitué, port réduit, écrit noir sur blanc (QA C6).

VERDICT — **recevable** : 2 lots (≤ 4), 6 critères (≤ 8, aucun 7ᵉ ajouté), une seule feature (`play-mode`) + `brain/` en contrat — la démo tient sans « et ».

REJETÉ — **couper it2 en deux maintenant** : aucune capacité auteur nouvelle tant que la reprise n'est pas elle-même démontrable.
REJETÉ — **garder le replay littéral en it2** (rejoint la QA, tech-lead T-4) : aucun scénario séparateur avant la n° 11.
REJETÉ — **ajouter un 7ᵉ critère d'immutabilité en compensation** du retrait du replay : stratégie de test, hors mon domaine — laissée à QA/tech-lead s'ils la jugent nécessaire, je ne la demande pas.

---

## ANNEXE

**QA — plafond à 6 critères** : je l'adopte, il resserre mon propre seuil (≤ 8) sans le contredire. Avec le replay retiré, it2 tient exactement à 6 (C1–C5 + C6 « port »), sans 7ᵉ ajout.

**M-13 (le mot « tour »), du seul point de vue de la valeur auteur** : l'écran **ne doit jamais afficher le mot « tour »**. `JournalRow` est en registre développeur-débogueur, mais c'est l'auteur qui le lit en testant son propre dossier — un lecteur à qui `REGLES-DU-JEU.md` vient de réserver « tour »/round au combat le lirait ici comme une promesse de mécanique de jeu qu'elle n'est pas. Je retiens l'**option (b)** : `JournalRow` rend `#{n}` nu, sans libellé. Le champ interne `horloge.tour` garde son nom — ce n'est pas mon domaine, c'est au narratif de trancher la doctrine (`§ J1`) — mais l'écran, lui, ne dit pas « tour ». Rien à retirer en échange : c'est un rendu plus pauvre, pas un ajout.

Fichiers lus : les six notes de `.claude/raffinage/moteur-dossier-it2/`.
