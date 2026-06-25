require('@testing-library/jest-dom')

// crypto.randomUUID is available in Node 19+ and modern jsdom but not every
// CI environment. Polyfill once here so any test can call it safely.
if (typeof globalThis.crypto.randomUUID !== 'function') {
	globalThis.crypto.randomUUID = function randomUUID() {
		return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
			const n = parseInt(c, 10)
			return (n ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16)
		})
	}
}
