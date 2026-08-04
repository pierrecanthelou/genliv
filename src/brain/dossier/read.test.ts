import fs from 'node:fs'
import path from 'node:path'
import { inspectDossierFile } from './read'

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

/** Le TEXTE du fichier réel, lu du disque (KR-156). */
function texteFixture(): string {
	return fs.readFileSync(CHEMIN_FIXTURE, 'utf8')
}

describe('read', () => {
	it('un fichier vide est refuse', () => {
		for (const texte of ['', '   ', '\n\t\n']) {
			const inspection = inspectDossierFile(texte)
			expect(inspection).toEqual({ statut: 'file-error', code: 'fichier-vide' })
		}
	})

	it('un JSON malforme est refuse', () => {
		for (const texte of ['{ "schema": 1,', '{ schema: 1 }', 'not json at all', '{{}']) {
			const inspection = inspectDossierFile(texte)
			expect(inspection).toEqual({ statut: 'file-error', code: 'json-invalide' })
		}
	})

	it('une racine qui n est pas un objet est refusee, distinctement du JSON malforme', () => {
		// Ces textes PARSENT sans lever : ce n'est pas un fichier tronqué, c'est un
		// fichier qui ne contient pas un dossier. Deux causes, deux messages.
		for (const texte of ['[]', '[{"schema":1}]', '42', '"un texte"', 'null']) {
			const inspection = inspectDossierFile(texte)
			expect(inspection).toEqual({ statut: 'file-error', code: 'racine-non-objet' })
		}
	})

	it('la fixture lue du disque est inspectee valide', () => {
		const inspection = inspectDossierFile(texteFixture())

		expect(inspection.statut).toBe('valid')
		if (inspection.statut !== 'valid') return
		expect(inspection.dossier.id).toBe('dossier-minimal')
		expect(inspection.warnings).toEqual([])
	})

	it('un dossier non conforme ressort invalide, avec ses anomalies', () => {
		const doc = JSON.parse(texteFixture()) as Record<string, unknown>
		doc.schema = 2

		const inspection = inspectDossierFile(JSON.stringify(doc))

		expect(inspection.statut).toBe('invalid')
		if (inspection.statut !== 'invalid') return
		expect(inspection.errors.map((e) => e.code)).toEqual(['schema-inconnu'])
		// Discriminant : la branche `invalid` ne porte AUCUN dossier — un document
		// refusé ne doit jamais pouvoir être importé par inadvertance.
		expect('dossier' in inspection).toBe(false)
	})

	it('un avertissement accompagne un dossier VALIDE, jamais un refus', () => {
		const doc = JSON.parse(texteFixture()) as Record<string, unknown>
		const canon = doc.canon as Record<string, unknown>
		;(canon.mj as Record<string, unknown>).synopsis_mj = 'mot '.repeat(601)

		const inspection = inspectDossierFile(JSON.stringify(doc))

		expect(inspection.statut).toBe('valid')
		if (inspection.statut !== 'valid') return
		expect(inspection.warnings.map((w) => w.code)).toEqual(['canon-trop-long'])
	})
})
