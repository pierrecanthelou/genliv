import { ESPACES_DE_NOMS, type EspaceDeNoms } from '../dossier/identifiers'
import type { SelectOption } from '../components/Select'

/**
 * LES RÉFÉRENCES DU DOSSIER, CÔTÉ ÉCRAN — comment un sélecteur rend un
 * identifiant que le registre visé ne porte pas.
 *
 * Ce module est le PENDANT D'INTERFACE de `validateDossier` : le validateur EXPOSE
 * une référence orpheline dans son rapport (`reference-pendante`), celui-ci la
 * garde VISIBLE et SÉLECTIONNÉE dans le champ qui l'édite. Les deux disent la même
 * doctrine (KR-021) à deux surfaces : une référence qui ne résout pas ne se filtre
 * pas, ne se réécrit pas, ne se tait pas.
 */

/**
 * Une référence qui NE RÉSOUT PAS reste SÉLECTIONNÉE et VISIBLE, sous une option
 * non résolue qui montre l'identifiant tel quel (KR-021) — jamais une réécriture
 * silencieuse vers la première option du registre, qui ferait dire au dossier
 * autre chose que ce que l'auteur y a mis. Le libellé du TYPE vient du registre
 * `ESPACES_DE_NOMS`, comme celui de `localiserEntite` : « Indice introuvable — … »,
 * « Objet introuvable — … ».
 *
 * PROMUE ICI À L'ITÉRATION 1 DE LA N° 6 (KR-110), et pas un jour plus tôt : elle
 * était privée à `dossier-fiches/components/BlocSavoirs.tsx`, où elle avait un seul
 * appelant de feature. Le registre des indices en est le SECOND, réel et livré le
 * même jour — même seuil que `localiserEntite`, `compterMots` et
 * `frapperIdentifiant`, promues au deuxième appelant identifié, jamais avant. La
 * recopier dans la n° 6 aurait fait diverger deux règles d'affichage de la même
 * doctrine.
 *
 * SON CORPS N'A PAS CHANGÉ D'UNE LIGNE à la promotion : `savoirs.test.tsx`
 * l'éprouve déjà sur ses trois sélecteurs de `BlocSavoirs`, et ce test tourne
 * INCHANGÉ — c'est ce qui rend l'extraction vérifiable plutôt que promise.
 *
 * LA VALEUR VIDE EST CALME, et c'est le point qui compte à l'usage : `''` est ce
 * qu'un sélecteur « aucun » porte quand rien n'est choisi, et ce n'est pas une
 * référence orpheline — c'est une absence de référence. Elle n'ajoute donc aucune
 * option « introuvable — », exactement comme `validateDossier` reste calme sur la
 * chaîne vide d'une référence optionnelle.
 *
 * ⚠ ELLE N'EXCLUT RIEN, ET C'EST L'AUTRE MOITIÉ DU CONTRAT. Une AUTO-RÉFÉRENCE
 * (`valeur` égale à l'identifiant de l'entité éditée) est LÉGALE au schéma (KR-194) :
 * si elle figure dans `options`, cette fonction la laisse résoudre. L'appelant qui
 * exclut l'entité éditée de sa liste d'AJOUT doit donc conserver la liste COMPLÈTE
 * pour ses lignes DÉJÀ ÉCRITES — deux listes distinctes, jamais une seule filtrée —,
 * sans quoi une auto-référence déjà persistée s'afficherait « introuvable » alors
 * qu'elle résout. Le précédent exact est `BlocSavoirs.tsx`, sur
 * `savoirs[].revele_si.apres_indice_id`.
 */
export function avecOrpheline(
	options: SelectOption<string>[],
	valeur: string,
	espace: EspaceDeNoms,
): SelectOption<string>[] {
	if (valeur === '' || options.some((option) => option.value === valeur)) return options
	return [...options, { value: valeur, label: `${ESPACES_DE_NOMS[espace].label} introuvable — ${valeur}` }]
}
