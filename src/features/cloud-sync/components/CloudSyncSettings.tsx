import { useState, useRef, useEffect } from 'react'
import { useBrain } from '../../../brain'
import { Modal } from '../../../brain/components/Modal'
import { Field } from '../../../brain/components/Field'

interface CloudSyncSettingsProps {
	onClose: () => void
}

function isValidUrl(raw: string): boolean {
	try {
		new URL(raw)
		return true
	} catch {
		return false
	}
}

/**
 * Settings modal for Cloudflare KV persistence.  The user enters the URL of
 * their deployed genliv worker and a personal sync key (the shared secret that
 * namespaces their data in the worker's KV store).  Saving triggers a page
 * reload so the brain re-initialises with the new transport.
 */
export function CloudSyncSettings({ onClose }: CloudSyncSettingsProps): JSX.Element {
	const { cloudSettings } = useBrain()
	const [url, setUrl] = useState(cloudSettings.getWorkerUrl() ?? '')
	const [key, setKey] = useState(cloudSettings.getSyncKey() ?? '')
	const [copied, setCopied] = useState(false)
	const [confirmDisable, setConfirmDisable] = useState(false)
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
		}
	}, [])

	const configured = cloudSettings.isConfigured()

	function handleSave() {
		cloudSettings.setWorkerUrl(url.trim() || null)
		cloudSettings.setSyncKey(key.trim() || null)
		window.location.reload()
	}

	function handleDisable() {
		cloudSettings.setWorkerUrl(null)
		cloudSettings.setSyncKey(null)
		window.location.reload()
	}

	function handleGenerate() {
		setKey(crypto.randomUUID())
	}

	async function handleCopy() {
		if (!key) return
		await navigator.clipboard.writeText(key)
		if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
		setCopied(true)
		copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
	}

	const canSave = isValidUrl(url.trim()) && key.trim().length > 0

	if (confirmDisable) {
		return (
			<Modal
				title="Désactiver la synchronisation"
				onClose={() => setConfirmDisable(false)}
				onCancel={() => setConfirmDisable(false)}
				cancelLabel="Annuler"
				confirmLabel="Désactiver"
				confirmTone="error"
				onConfirm={handleDisable}
			>
				<p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
					L'URL du worker et la clé de synchronisation seront effacées sur cet appareil. Vos données cloud restent
					intactes — vous pourrez reconfigurer la sync à tout moment.
				</p>
			</Modal>
		)
	}

	return (
		<Modal
			title="Synchronisation Cloudflare"
			onClose={onClose}
			onCancel={onClose}
			cancelLabel="Annuler"
			confirmLabel={configured ? 'Mettre à jour et recharger' : 'Activer et recharger'}
			confirmDisabled={!canSave}
			onConfirm={handleSave}
			destructive={
				configured ? { label: 'Désactiver la synchronisation', onClick: () => setConfirmDisable(true) } : undefined
			}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
				<p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
					Déployez le worker genliv sur votre compte Cloudflare, puis renseignez son URL et une clé secrète personnelle.
				</p>

				<Field
					label="URL du worker"
					placeholder="https://genliv.votre-compte.workers.dev"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
				/>

				<div>
					<Field
						label="Clé de synchronisation"
						hint="secrète — ne pas partager"
						placeholder="Générez ou collez votre clé"
						value={key}
						onChange={(e) => setKey(e.target.value)}
					/>
					<div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
						<button type="button" onClick={handleGenerate} style={secondaryBtn}>
							Générer une clé
						</button>
						<button
							type="button"
							onClick={handleCopy}
							disabled={!key}
							style={{ ...secondaryBtn, opacity: key ? 1 : 0.4 }}
						>
							{copied ? 'Copié !' : 'Copier'}
						</button>
					</div>
				</div>

				<p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
					La clé sert à isoler vos données dans le KV Cloudflare. Conservez-la — vous en aurez besoin sur chaque
					appareil.
				</p>
			</div>
		</Modal>
	)
}

const secondaryBtn: React.CSSProperties = {
	fontSize: 'var(--fs-xs)',
	color: 'var(--text-muted)',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '5px 10px',
	background: 'none',
	cursor: 'pointer',
	fontFamily: 'var(--font-ui)',
}
