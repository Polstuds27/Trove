# Trove Design ? Color Palette

Apply this palette across frontend work. Centralize it in `web/src/index.css` and
consume via `web/tailwind.config.cjs`.

## Brand palette
- Forest Green: `#294737`
- Sage Green: `#9BA78A`
- Warm Gray: `#D9D3C9`
- Cream: `#F7F0E5`
- Sand: `#DFC5AD`

## Semantic tokens
Light and dark values are defined as CSS variables in `web/src/index.css`.
Use semantic Tailwind names (`canvas`, `surface`, `ink`, `muted`, `primary`,
`income`, `expense`, etc.) rather than raw brand colors in components.
