RISQUE — Un champ `consigne` posé `audience: auteur` serait une quête injouable par construction : le PNJ donneur ne pourrait ni la formuler en scène ni juger sa réussite. C'est le risque qui prime sur les deux miens du tour 1.

OBJECTION — Tranche nommée sur les deux points. (1) Nom : `consigne`, retenu sur `enonce`. Un auteur « donne une consigne » à un donneur — vocabulaire naturel de jeu de rôle ; `enonce` sonne énoncé d'examen, hors ton narratif, et n'apporte rien que `consigne` n'ait déjà en évitant `objectif` (KR-198) et l'homonymie `but`/`Personnage.but` que le tech-lead écarte à raison. (2) Audience : `ia`, pas `auteur`. La feature existe pour qu'un modèle narrateur joue le dossier (ROADMAP bascule IA) — le contenu de la demande doit l'atteindre. `echeance` peut rester note d'auteur (mécanique de pacing) ; `consigne` non, ce n'est pas symétrique.

PROPOSITION — `Quete.consigne`, `audience: ia`. `echeance` reste `audience: auteur`, hors sujet aujourd'hui. Ces deux points s'écrivent dans les `resolved_decisions` du lot contrat, pas laissés au hasard de l'implémentation.

Statut de mes objections tour 1 : (a) renommage de `objectif` — retirée, résolue par la décision `consigne` ci-dessus. (b) `etapes[].libelle` CHAMPS_REQUIS — retirée, motif tech-lead accepté (précédent `contre_mesures[].action`). (c) risque de gonflement d'EditeurEffets — maintenue, non résolue en détail ce tour ; pas de veto tant que le lot 1 démontre une seule phrase.

VERDICT — recevable sous réserve : `consigne`/`ia` actés comme décisions écrites ; découpage EditeurEffets à confirmer au lot suivant.
