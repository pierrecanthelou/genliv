#!/usr/bin/env node
// Hook Stop — exporte la consommation Claude (type /status) à la fin de chaque
// réponse : une ligne ajoutée à .claude/usage.log (gitignoré) + un rappel court
// affiché à l'utilisateur via systemMessage. JAMAIS bloquant : toute erreur se
// termine en exit 0 silencieux — un hook de télémétrie n'a pas le droit de
// casser un tour.
import { readFileSync, statSync, openSync, readSync, closeSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

try {
	const input = JSON.parse(readFileSync(0, 'utf8'))
	const transcript = input.transcript_path
	if (!transcript) process.exit(0)

	// Le dernier message assistant du transcript JSONL porte l'usage du tour :
	// on ne lit que la fin du fichier (512 Ko) et on balaie à rebours — un
	// transcript de fin de session pèse des dizaines de Mo, le relire en entier
	// à chaque tour serait exactement la lenteur qu'on reproche aux hooks.
	const taille = statSync(transcript).size
	const fenetre = Math.min(taille, 512 * 1024)
	const fd = openSync(transcript, 'r')
	const tampon = Buffer.alloc(fenetre)
	readSync(fd, tampon, 0, fenetre, taille - fenetre)
	closeSync(fd)

	const lignes = tampon.toString('utf8').split('\n')
	let usage = null
	let modele = ''
	for (let i = lignes.length - 1; i >= 0; i--) {
		const brute = lignes[i]
		if (!brute.includes('"usage"')) continue
		try {
			const entree = JSON.parse(brute)
			const message = entree && entree.message
			if (entree.type === 'assistant' && message && message.usage && !entree.isSidechain) {
				usage = message.usage
				modele = message.model || ''
				break
			}
		} catch {
			// première ligne de la fenêtre potentiellement tronquée — on continue
		}
	}
	if (!usage) process.exit(0)

	const contexte =
		(usage.input_tokens || 0) +
		(usage.cache_read_input_tokens || 0) +
		(usage.cache_creation_input_tokens || 0)
	const ligne = [
		new Date().toISOString(),
		String(input.session_id || '').slice(0, 8),
		modele,
		`contexte=${contexte}`,
		`entree=${usage.input_tokens || 0}`,
		`cache_lu=${usage.cache_read_input_tokens || 0}`,
		`cache_ecrit=${usage.cache_creation_input_tokens || 0}`,
		`sortie=${usage.output_tokens || 0}`,
	].join('  ')

	const racine = process.env.CLAUDE_PROJECT_DIR || process.cwd()
	appendFileSync(join(racine, '.claude', 'usage.log'), ligne + '\n')

	const fmt = (n) => n.toLocaleString('fr-FR')
	process.stdout.write(
		JSON.stringify({
			systemMessage: `Conso Claude — contexte ${fmt(contexte)} tokens · sortie ${fmt(usage.output_tokens || 0)} · journal : .claude/usage.log`,
		}),
	)
} catch {
	// silencieux par contrat
}
process.exit(0)
