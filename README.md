# IGUALAÍ

## Apresentação

IGUALAÍ é um protótipo de jogo para o 7º ano praticar equação do 1º grau. A equação aparece como uma balança: o lado esquerdo vale o mesmo que o direito. Cada operação entra nos dois pratos ao mesmo tempo. Termos iguais no mesmo prato se fundem, opostos se cancelam, e a fase acaba quando o `x` fica sozinho de um lado e um número do outro.

Foi feito para a disciplina Computação e Práticas Extensionistas, 2026/2, do IFRS, por Carlos Dartora, Christopher Marques, Gustavo Bassani e Maycke Young.

Ao entrar no jogo, uma tela de boas-vindas aparece por alguns segundos. Na primeira visita, um tutorial visual apresenta a balança, as operações e o arraste. O Rover acompanha o jogo e pode ler as dicas. A dica de cada fase começa escondida; o primeiro clique em **Dica** conta como um passo, e cliques seguintes na mesma fase não contam passos adicionais.

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

O editor fica em `http://localhost:5173/?editar`. Testes: `npm test`. Build: `npm run build`. O `base` do Vite está configurado como `/`; ajuste `vite.config.js` se o projeto for publicado em um subcaminho.

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

| Arquivo ou pasta | Função |
|------------------|--------|
| `main.js` | Inicializa o jogo, escolhe campanha/atividade/editor, mostra a tela de boas-vindas e inicia o tutorial e o Rover |
| `game.js` | Estado da partida, fases, controles, teclado, dica, tutorial visual e pontuação |
| `operations.js` | Aplica `+N`, `−N`, `+Nx`, `−Nx`, `×` e `÷` aos dois lados |
| `algebra.js` | Aritmética racional, termos, equações, solução, passos mínimos e condição de vitória |
| `levels.js` | As 14 fases da campanha |
| `equation.js` | Faz o parsing e valida as equações criadas no editor |
| `activity-link.js` | Codifica e valida links de atividades e rascunhos do editor |
| `editor.js` | Interface e estado do editor de atividades (`?editar`) |
| `render.js` | Renderiza equações, peças e seletor de fases |
| `drag.js` | Interação de arrastar peças para fundir ou cancelar termos |
| `keys.js` | Mapeia teclas e operações do jogo |
| `tutor.js` | Integração com o Rover, dicas faladas e comemorações |
| `win.js` | Regras de vitória, pontuação por fase e tela de comemoração/fim de jogo |
| `particles.js` | Efeitos de poeira e confete |
| `styles.css` | Estilos do jogo, telas, modais e layouts responsivos |
| `background.png`, `math-pattern.svg` | Imagens referenciadas pelo CSS |
| `test/activity-link.test.js` | Codificação, validação e leitura de links de atividades |
| `test/algebra.test.js`, `test/equation.test.js` | Álgebra, equações e validação do editor |
| `test/drag.test.js`, `test/operations.test.js`, `test/keys.test.js` | Arraste, operações e atalhos |
| `test/editor.test.js`, `test/game.test.js` | Editor, controles, tutorial e fluxo do jogo |
| `test/particles.test.js`, `test/tutor.test.js`, `test/win.test.js` | Partículas, Rover e comemorações |

## Outros arquivos e pastas

| Arquivo ou pasta | Função |
|------------------|--------|
| `index.html` | Estrutura da página, tela de boas-vindas, tabuleiro, editor e modais |
| `packages/sound-engine/package.json` | Configuração do workspace de som |
| `packages/sound-engine/src/index.js` | Exporta a interface pública do motor de som |
| `packages/sound-engine/src/sound-engine.js` | Implementação do motor de som |
| `packages/sound-engine/src/sound-engine.test.js` | Testes do motor de som |
| `public/background.png`, `public/math-pattern.svg` | Cópias dos recursos estáticos servidos pelo Vite |
| `background.png` | Cópia do recurso gráfico de fundo na raiz do projeto |
| `vite.config.js` | Configuração do Vite e descoberta dos testes |
| `package.json` | Scripts, dependências e configuração dos workspaces |
| `package-lock.json` | Versões travadas das dependências |
| `design-rules.md` | Referência de regras visuais do projeto |
| `README.md` | Apresentação, instruções de uso e mapa do projeto |
