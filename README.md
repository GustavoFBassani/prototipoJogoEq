# EquaLab

Protótipo de jogo para o 7º ano praticar equação do 1º grau: a mesma operação nos dois lados, cancelar opostos no mesmo lado, até o `x` ficar sozinho.

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
| `operations.js` | Aplica `+1` `-1` `+x` `-x` nos dois lados; `×`/`÷` pedem um inteiro > 1 |
| `algebra.js` | Conta tokens, formata a equação, detecta `x` isolado |
| `levels.js` | 11 fases prontas |
| `render.js` | Tokens e fórmula |
| `drag.js` | Arrastar um token no oposto do mesmo lado |
| `keys.js` | Mapa `1`–`6` → operações |
| `win.js` | Tela de acerto |
| `particles.js` | Poeira / confete |
| `styles.css` | Visual atual (laboratório) |

O som fica em `packages/sound-engine`.

## Como se joga

Cada botão de operação atinge os dois lados. Arraste `+1` em `-1`, ou `+x` em `-x`, no **mesmo** lado para os dois sumirem. A fase acaba quando um lado é só `x` e o outro é um número.

`×` e `÷` não usam modal. O painel de operações vira um campo: *Qual número você quer usar na operação?* Inteiro maior que 1. Enter confirma, Esc cancela. Dividir só vale se as quantidades de cada tipo, nos dois lados, forem divisíveis por esse número.

A dica da fase começa escondida. O botão **Dica da Jogada** liga e desliga.

## Atalhos

Valem fora de `input` / `textarea`. Com o campo de número aberto, `1`–`6` digitam no campo.

| Tecla | Operação |
|-------|----------|
| `1` | +1 |
| `2` | −1 |
| `3` | +x |
| `4` | −x |
| `5` | × |
| `6` | ÷ |

As teclas também estão nos botões.
