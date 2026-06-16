Draggable row for objects to take, dropped loot, or outgoing choices — drag handle + title/subtitle + trailing controls.

```jsx
<ListRow
	title="Chandelier en argent"
	subtitle="Lourd, terni, gravé d'initiales effacées."
	leading={<Badge tone="accent">scénario</Badge>}
	trailing={<><Toggle checked /> <IconButton tone="danger" label="Supprimer">✕</IconButton></>}
	selected
/>
```
