# EquaLab

Protótipo de jogo para o 7º ano praticar equação do 1º grau: a mesma operação nos dois lados, fundir iguais e cancelar opostos no mesmo prato, até o `x` ficar sozinho.

## Como rodar

```bash
npm i
npm run dev
```

Testes: `npm test`. Build: `npm run build`.

## Pasta `src/`

| Arquivo | Função |
|---------|--------|
| `main.js` | Sobe som, partículas e o jogo |
| `game.js` | Nível atual, controles, teclado, painel do número |
| `operations.js` | `+N` `−N` `+Nx` `−Nx` `×` `÷` nos dois lados |
| `algebra.js` | Racionais, fusão, fórmula, vitória |
| `levels.js` | 14 fases prontas |
| `render.js` | Tokens e fórmula |
| `drag.js` | Fundir ou cancelar no mesmo lado |
| `keys.js` | Mapa `1`–`6` → operações |
| `win.js` | Tela de acerto |
| `particles.js` | Poeira / confete |
| `styles.css` | Visual atual (laboratório) |

O som fica em `packages/sound-engine`.

## Como se joga

Cada botão pede um número N (painel inline) e aplica nos dois lados. Arraste termos do mesmo tipo no **mesmo** prato: iguais fundem (`+2` em `+3` vira `+5`), opostos cancelam (`+5x` em `−2x` vira `+3x`). A fase acaba quando cada prato tem um container só: um é `+x` e o outro é um número, inclusive fração.

`×` e `÷` aceitam negativo (`× −1` inverte o sinal). Zero é recusado. `4x = −3` com `÷ 4` vira `x = −3/4`.

A dica da fase começa escondida. O botão **Dica** liga e desliga.

## Atalhos

Valem fora de `input` / `textarea`. Com o campo de número aberto, `1`–`6` digitam no campo.

| Tecla | Operação |
|-------|----------|
| `1` | + N |
| `2` | − N |
| `3` | + Nx |
| `4` | − Nx |
| `5` | × |
| `6` | ÷ |
