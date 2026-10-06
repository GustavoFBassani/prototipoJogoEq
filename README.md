# IGUALAÍ

## Apresentação

IGUALAÍ é um protótipo de jogo para o 7º ano praticar equação do 1º grau. A equação aparece como uma balança: o lado esquerdo vale o mesmo que o direito. Cada operação entra nos dois pratos ao mesmo tempo. Termos iguais no mesmo prato se fundem, opostos se cancelam, e a fase acaba quando o `x` fica sozinho de um lado e um número do outro.

Foi feito para a disciplina Computação e Práticas Extensionistas, 2026/2, do IFRS, por Carlos Dartora, Christopher Marques, Gustavo Bassani e Maycke Young.

Na primeira visita, o Rover explica a balança, os botões e o arraste. A dica de cada fase começa escondida. O botão **Dica** liga e desliga.

## Como usar

O jogo abre de três jeitos.

A raiz é a campanha de 14 fases. Dá para escolher fase, reiniciar a atual e montar uma equação livre com coeficientes inteiros.

A rota `?editar` abre o editor de atividades. Quem monta a atividade dá um nome, escreve de 1 a 8 fases e copia o link da turma. Cada fase pede título, equação e dica. A equação é uma soma de termos em `x`, com um único `=`. Os coeficientes ficam entre −20 e 20. Sem parênteses, fração ou decimal. A fase não pode já estar resolvida e precisa ter uma solução só.

`?a=` abre essa atividade no lugar da campanha. O nome aparece no cabeçalho.

## Como rodar

```bash
npm i
npm run dev
```

O editor fica em `http://localhost:5173/?editar`. Testes: `npm test`. Build: `npm run build`. O `base` do Vite é `/igualai/`.

## Como se joga

Cada botão pede um número N e aplica nos dois lados. Arraste termos do mesmo tipo no **mesmo** prato: iguais fundem, `+2` em `+3` vira `+5`, e opostos cancelam, `+5x` em `−2x` vira `+3x`. A fase acaba quando cada prato tem um termo só. Um é `+x` e o outro é um número, inclusive fração.

`×` e `÷` aceitam negativo. `× −1` inverte o sinal. Zero é recusado. `4x = −3` com `÷ 4` vira `x = −3/4`.

## Atalhos

Valem fora de `input` e `textarea`. Com o campo de número aberto, `1` a `6` digitam no campo.

| Tecla | Operação |
|-------|----------|
| `1` | + N |
| `2` | − N |
| `3` | + Nx |
| `4` | − Nx |
| `5` | × |
| `6` | ÷ |

## Pasta `src/`

| Arquivo | Função |
|---------|--------|
| `main.js` | Escolhe campanha, atividade ou editor |
| `game.js` | Nível atual, controles, teclado, painel do número |
| `operations.js` | `+N` `−N` `+Nx` `−Nx` `×` `÷` nos dois lados |
| `algebra.js` | Racionais, fusão, fórmula, vitória |
| `levels.js` | 14 fases da campanha |
| `equation.js` | Lê e valida a equação do editor |
| `activity-link.js` | Codifica o link da turma e o rascunho |
| `editor.js` | Tela `?editar` |
| `render.js` | Tokens, fórmula e seletor de fases |
| `drag.js` | Fundir ou cancelar no mesmo lado |
| `keys.js` | Mapa `1` a `6` para as operações |
| `tutor.js` | Rover, o tutorial da primeira visita |
| `win.js` | Tela de acerto |
| `particles.js` | Poeira e confete |
| `styles.css` | Visual do laboratório |

O som fica em `packages/sound-engine`.
