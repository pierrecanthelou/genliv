Centered dialog — header + body + a footer that keeps the destructive action (left, terracotta) apart from cancel/confirm (right). Powers the object editor and dangerous-action confirmations.

```jsx
<Modal title="Éditer l'objet"
	destructive={{ label: "Supprimer l'objet", onClick: remove }}
	onCancel={close} onConfirm={save}>
	…fields…
</Modal>
```

For a pure dangerous-action confirm, pass a short body and set `confirmLabel` to the verb; the confirm button is accent (use the destructive slot for the irreversible one).
