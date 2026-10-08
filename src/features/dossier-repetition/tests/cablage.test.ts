import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

function collectTsFiles(dir: string): string[] {
	const results: string[] = []
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry)
		if (statSync(full).isDirectory()) {
			if (entry !== 'tests') results.push(...collectTsFiles(full))
		} else if (/\.tsx?$/.test(entry)) {
			results.push(full)
		}
	}
	return results
}

describe('dossier-repetition cablage', () => {
	const featureRoot = path.join(__dirname, '..')
	const sourceFiles = collectTsFiles(featureRoot)

	describe('zero_import_ia', () => {
		it.each(sourceFiles.map((f) => [path.relative(featureRoot, f), f]))(
			'%s — aucun CopiloteService/fetch/ia/',
			(_label, filePath) => {
				const content = readFileSync(filePath as string, 'utf-8')

				expect(content).not.toMatch(/CopiloteService/)
				expect(content).not.toMatch(/\bfetch\(/)
				expect(content).not.toMatch(/from ['"].*\/ia\//)
				expect(content).not.toMatch(/from ['"].*\/play-mode\//)
			},
		)

		it('au moins un fichier source scanne', () => {
			expect(sourceFiles.length).toBeGreaterThanOrEqual(3)
		})
	})
})
