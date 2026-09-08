# Especificação Técnica e Pedagógica: Regras das Equações de 1º Grau
## Projeto EquaLab ⚖️

---

### 1. Visão Geral e Princípios Pedagógicos

O **EquaLab** é um laboratório virtual interativo projetado para ensinar a resolução de **Equações Polinomiais do 1º Grau** por meio da metáfora da **Balança de Dois Pratos em Equilíbrio**.

O objetivo educacional central é guiar o estudante da manipulação visual-concreta para o raciocínio algébrico formal, fundamentando-se em três pilares:
1. **Princípio da Equivalência (Regra de Ouro da Álgebra):** Tudo o que for executado em um dos membros da igualdade deve, obrigatoriamente, ser executado de maneira idêntica no outro membro, conservando a balança nivelada.
2. **Redução de Termos Semelhantes:** Termos de mesma natureza (variáveis com variáveis, constantes com constantes) no mesmo membro podem e devem ser combinados por adição algébrica (fusão e aniquilação).
3. **Isolamento da Variável (Objetivo Final):** A equação está resolvida quando um dos membros contém estritamente o termo unitário isolado ($1x$ ou simplesmente $x$) e o membro oposto contém uma única quantidade numérica constante $N \in \mathbb{Q}$ ($x = N$ ou $N = x$).

---

### 2. Modelo Matemático Formal

#### 2.1 Forma Canônica e Conjunto Universo
Toda equação tratada no sistema pertence à classe das equações lineares na incógnita $x$ sobre o corpo dos números racionais ($\mathbb{Q}$):

$$ax + b = cx + d \quad \text{onde } a, b, c, d \in \mathbb{Q} \text{ e } a \neq c$$

> **Restrição de Domínio:** Para garantir a solubilidade pedagógica e evitar indefinições, o sistema **rejeita** equações indeterminadas (identidades, $0x = 0$) e impossíveis ($0x = k, k \neq 0$). Toda equação aceita possui uma **solução única bem determinada**:
> $$x = \frac{d - b}{a - c}$$

#### 2.2 Axiomas e Propriedades Aplicadas

| Propriedade Algébrica | Expressão Formal | Aplicação no Jogo |
| :--- | :--- | :--- |
| **Princípio Aditivo da Igualdade** | $A = B \iff A + K = B + K$ | Botões $+N$, $-N$, $+Nx$, $-Nx$ aplicados a ambos os lados |
| **Princípio Multiplicativo da Igualdade** | $A = B \iff A \cdot K = B \cdot K \quad (K \neq 0)$ | Botões $\times N$ e $\div N$ aplicados a ambos os lados |
| **Inverso Aditivo (Simétrico / Oposto)** | $w + (-w) = 0$ | Arrastar termos opostos resulta em aniquilação (parcial ou total) |
| **Inverso Multiplicativo (Recíproco)** | $w \cdot \frac{1}{w} = 1 \quad (w \neq 0)$ | Dividir $ax$ por $a$ resulta em $1x$ |
| **Distributividade sobre a Adição** | $\frac{\sum T_i}{N} = \sum \frac{T_i}{N}$ | A divisão/multiplicação atua sobre cada container existente no prato |
| **Fechamento nos Racionais** | $p/q \in \mathbb{Q}$ | Suporte a frações em qualquer estágio da resolução |

---

### 3. Modelo de Dados e Representação dos Termos

Para permitir números inteiros, fracionários, positivos e negativos de forma unificada, todo termo no prato é modelado matematicamente como um **Racional** $(p, q)$.

#### 3.1 Estrutura de Dados do Container

```typescript
type TermKind = 'variable' | 'constant'; // 'variable' representa termos em x, 'constant' números

interface EquationTerm {
  id: number;            // Identificador único de instância
  kind: TermKind;        // Tipo: variável (x) ou constante numérica
  numerator: number;     // Numerador inteiro (positivo ou negativo)
  denominator: number;   // Denominador inteiro positivo (>= 1)
  side: 'lhs' | 'rhs';   // Prato atual: esquerdo (lhs) ou direito (rhs)
}
```

#### 3.2 Representação Numérica e Regras de Normalização
1. O sinal negativo é mantido sempre no `numerator`:
   $$\frac{-p}{q} \text{ e nunca } \frac{p}{-q}$$
2. Quando `denominator === 1`, o termo é exibido como inteiro puro (ex: $+3$, $-2x$, $1x$).
3. Quando `denominator > 1`:
   - Exibição em formato de fração vertical: $\frac{p}{q}$ ou $\frac{p}{q}x$.
4. **Política de Simplificação:**
   - Se $p$ for múltiplo exato de $q$ ($p \pmod q == 0$), converte-se automaticamente para inteiro (ex: $\frac{4}{4} \to 1$, $\frac{6}{2} \to 3$, $\frac{-8}{2} \to -4$).
   - Se $p$ **não** for múltiplo de $q$, **não é feita simplificação forçada** de imediato (ex: ao dividir por $4$ o valor $-3$, exibe-se $-\frac{3}{4}$; se dividir $4$ por $6$, exibe-se $\frac{4}{6}$), preservando a clareza didática de qual divisor foi aplicado.

---

### 4. Painel de Operações Bilaterais (Entrada do Usuário)

O jogador possui 6 botões de operação simultânea nos dois pratos. Todos acionam um diálogo/modal para entrada do valor $N$:

| Botão | Operação Algébrica | Validação de Entrada | Efeito nos Pratos |
| :---: | :---: | :---: | :--- |
| **$+N$** | Somar constante $N$ aos dois lados | Inteiro ou Fracionário $N \neq 0$ | Adiciona um container constante $+N$ no LHS e RHS |
| **$-N$** | Subtrair constante $N$ dos dois lados | Inteiro ou Fracionário $N \neq 0$ | Adiciona um container constante $-N$ no LHS e RHS |
| **$+Nx$** | Somar $N$ variáveis $x$ aos dois lados | Inteiro $N \neq 0$ | Adiciona um container de variável $+Nx$ no LHS e RHS |
| **$-Nx$** | Subtrair $N$ variáveis $x$ aos dois lados | Inteiro $N \neq 0$ | Adiciona um container de variável $-Nx$ no LHS e RHS |
| **$\times N$** | Multiplicar ambos os lados por $N$ | Inteiro $N \neq 0$ (aceita negativos: $-1, -2, \dots$) | Multiplica o numerador de **todos** os containers por $N$ |
| **$\div N$** | Dividir ambos os lados por $N$ | Inteiro $N \neq 0$ (aceita negativos: $-1, -2, \dots$) | Multiplica o denominador de **todos** os containers por $|N|$ e ajusta sinais |

> [!IMPORTANT]
> **Divisão por Zero é Proibida:** Se o usuário tentar inserir $N = 0$, o sistema rejeita a operação com aviso educativo: *"A divisão por zero é indefinida na matemática e desequilibra a balança."*

> [!TIP]
> **Inversão de Sinais:** Para resolver casos como $-x = 7$, o usuário pode escolher $\div (-1)$ ou $\times (-1)$, invertendo perfeitamente os sinais de ambos os pratos: $x = -7$.

---

### 5. Mecânicas de Interação Direta (Drag & Drop no Mesmo Prato)

Ao contrário das operações bilaterais (que alteram ambos os pratos), o arrastar e soltar ocorre **estritamente dentro do mesmo prato**, representando a simplificação de termos semelhantes.

#### 5.1 Regra de Ouro da Balança
* **Bloqueio entre pratos:** É estritamente proibido arrastar um termo do prato esquerdo diretamente para o prato direito ou vice-versa. Termos só transitam/somem entre pratos mediante aplicação das operações bilaterais.

#### 5.2 Fusão (Termos de Mesmo Tipo e Mesmo Sinal)
* **Condição:** Ambos os termos são da mesma natureza (ambos variáveis ou ambos constantes) e possuem sinais iguais (ambos positivos ou ambos negativos).
* **Mecânica:** Ao soltar o Termo A sobre o Termo B:
  $$\frac{p_A}{q_A} + \frac{p_B}{q_B} = \frac{p_A \cdot q_B + p_B \cdot q_A}{q_A \cdot q_B}$$
* **Resultado:** Os dois containers se fundem em um único container somado.
* **Exemplos:**
  * $+x$ sobre $+x \implies +2x$
  * $+2x$ sobre $+3x \implies +5x$
  * $-1$ sobre $-1 \implies -2$
  * $-2$ sobre $-3 \implies -5$

#### 5.3 Aniquilação / Cancelamento (Termos de Mesmo Tipo e Sinais Opostos)
* **Condição:** Ambos os termos são da mesma natureza (ambos variáveis ou ambos constantes), mas possuem sinais contrários (um positivo e um negativo).
* **Mecânica:**
  1. **Cancelamento Total (Módulos iguais):**
     * Exemplo: $+2x$ arrastado sobre $-2x \implies 0$ (ambos desaparecem em uma explosão completa de poeira cósmica).
     * Exemplo: $+5$ arrastado sobre $-5 \implies 0$.
  2. **Cancelamento Parcial (Módulos diferentes):**
     * Exemplo: $+5x$ arrastado sobre $-2x$:
       $$+5x + (-2x) = +3x$$
       O container menor é aniquilado com efeito visual de partículas, e o container resultante passa a ser $+3x$.
     * Exemplo: $+1x$ arrastado sobre $-4x \implies -3x$.
     * Exemplo: $+6$ arrastado sobre $-2 \implies +4$.

#### 5.4 Imutabilidade do Agrupamento (Sem Desmembramento)
* Uma vez que dois containers foram fundidos, eles permanecem unidos. Não há ação de cisão/desagrupamento manual, reforçando o hábito algébrico de simplificar e manter reduzida a expressão.

---

### 6. Sistema de Divisão Universal e Frações

#### 6.1 Execução Algébrica da Divisão por $N$
Quando a operação $\div N$ ($N \neq 0$) é executada, todo container $T_i = \frac{p_i}{q_i}$ de cada lado da balança é transformado distributivamente:

$$T_i^{\text{novo}} = \frac{p_i}{q_i} \div N = \frac{p_i \cdot \operatorname{sgn}(N)}{q_i \cdot |N|}$$

#### 6.2 Casos de Aplicação da Divisão

1. **Divisão Exata:**
   * Equação: $4x = 8$
   * Operação: $\div 4$
   * LHS: $\frac{4}{1}x \div 4 = \frac{4}{4}x \to 1x$ (ou $x$)
   * RHS: $\frac{8}{1} \div 4 = \frac{8}{4} \to 2$
   * Resultado: $x = 2$ (Vitória imediata).

2. **Divisão com Resultado Fracionário (Exemplo do Usuário):**
   * Equação: $4x = -3$
   * Operação: $\div 4$
   * LHS: $\frac{4}{1}x \div 4 = \frac{4}{4}x \to 1x$ (ou $x$)
   * RHS: $\frac{-3}{1} \div 4 \to -\frac{3}{4}$
   * Resultado: $x = -\frac{3}{4}$ (Válido, aceito e vitória imediata!).

3. **Divisão em Qualquer Fase (Liberdade Total do Jogador):**
   * O jogador é livre para dividir quando desejar, mesmo que não seja a jogada ideal:
   * Exemplo: $2x + 1 = 5 \xrightarrow{\div 2} x + \frac{1}{2} = \frac{5}{2}$.
   * Se depois o jogador aplicar $-\frac{1}{2}$ ou $-1$, o motor aritmético suporta perfeitamente as operações com frações.

---

### 7. Critérios de Validação e Condição de Vitória

#### 7.1 Definição Rigorosa do Estado Vencedor
A vitória de uma fase é disparada se, e somente se, todos os seguintes critérios forem simultaneamente verdadeiros:

1. **Isolamento de Prato:**
   * **Cenário A (x na esquerda):**
     * O prato esquerdo (LHS) possui **exatamente 1 container**.
     * Esse container é do tipo `variable`, com valor $+1x$ (ou seja, $\text{coeficiente} = 1$).
     * O prato direito (RHS) possui **exatamente 1 container**.
     * Esse container é do tipo `constant` (seja ele inteiro ou fração $p/q$).
   * **Cenário B (x na direita):**
     * O prato direito (RHS) possui **exatamente 1 container** de $+1x$.
     * O prato esquerdo (LHS) possui **exatamente 1 container** do tipo `constant`.

2. **Exigência de Redução Completa (Sem Termos Espalhados):**
   * Se o jogador chegar a uma situação com $x = 2$ e outro bloco $+3$ no mesmo lado:
     $$\text{Lado direito: } [+2] \text{ e } [+3]$$
     **A vitória NÃO é concedida ainda.**
   * O jogador deve **arrastar o $+2$ sobre o $+3$** para fundi-los em $+5$, garantindo a compreensão de que a resposta final deve ser um valor único sintetizado.

#### 7.2 Mensagem de Vitória
Ao atingir a condição de vitória:
* Dispara a celebração sonora e visual de confetes.
* O modal exibe a solução exata formatada:
  * Exemplo Inteiro: $x = 3$
  * Exemplo Fracionário: $x = -\frac{3}{4}$ ou $x = \frac{5}{2}$

---

### 8. Casos Canônicos de Teste / Passo a Passo

#### Caso de Teste 1: Divisão Fracionária Direta
* **Estado Inicial:** $4x = -3$
  * LHS: $[+4x]$
  * RHS: $[-3]$
* **Ação 1:** Usuário clica em $\div N$, digita $4$ e confirma.
  * LHS: $[+4x] \div 4 \implies [+1x]$
  * RHS: $[-3] \div 4 \implies [-\frac{3}{4}]$
* **Resultado:** Vitória instantânea com $x = -\frac{3}{4}$.

#### Caso de Teste 2: Inversão com Negativo
* **Estado Inicial:** $-x = 6$
  * LHS: $[-1x]$
  * RHS: $[+6]$
* **Ação 1:** Usuário clica em $\div N$, digita $-1$ e confirma.
  * LHS: $[-1x] \div (-1) \implies [+1x]$
  * RHS: $[+6] \div (-1) \implies [-6]$
* **Resultado:** Vitória instantânea com $x = -6$.

#### Caso de Teste 3: Equação com Variáveis e Constantes Mistas
* **Estado Inicial:** $3x + 5 = x + 11$
  * LHS: $[+3x, +5]$
  * RHS: $[+1x, +11]$
* **Ação 1:** Aplicar $-1x$ nos dois lados.
  * LHS: $[+3x, +5, -1x]$
  * RHS: $[+1x, +11, -1x]$
* **Ação 2 (Manipulação):** No RHS, arrastar $+1x$ em $-1x \implies$ aniquilam-se.
* **Ação 3 (Manipulação):** No LHS, arrastar $-1x$ em $+3x \implies$ resulta em $[+2x]$.
  * Balança agora: $2x + 5 = 11$.
* **Ação 4:** Aplicar $-5$ nos dois lados.
  * LHS: $[+2x, +5, -5]$
  * RHS: $[+11, -5]$
* **Ação 5 (Manipulação):** No LHS, aniquilar $+5$ com $-5$.
* **Ação 6 (Manipulação):** No RHS, aniquilar $-5$ com $+11 \implies [+6]$.
  * Balança agora: $2x = 6$.
* **Ação 7:** Aplicar $\div 2$ nos dois lados.
  * LHS: $[+1x]$
  * RHS: $[+3]$
* **Resultado:** Vitória com $x = 3$.

---

### 9. Roteiro de Adequação da Arquitetura Técnica

Para transformar o código existente no `EquaLab` nesta especificação:

1. **Substituir o array de strings/tipos unitários** (`lhsItems: [{type: '+x'}]`) por instâncias completas de `EquationTerm` com `{ id, kind, numerator, denominator, side }`.
2. **Atualizar os botões do painel** de `+1, -1, +x, -x` para `+N, -N, +Nx, -Nx, ×N, ÷N`, todos conectados ao modal de entrada numérica.
3. **Generalizar o Drag & Drop:**
   - Detectar colisão no mesmo prato.
   - Se `kind` for igual e sinais forem iguais $\to$ Fusão (soma de numeradores/denominadores).
   - Se `kind` for igual e sinais forem opostos $\to$ Cancelamento (parcial ou total).
4. **Remover a restrição de divisibilidade** (`counts % n === 0`), aplicando a divisão distributiva sobre frações em todos os elementos.
5. **Renderizador de Tokens:** Suportar classes CSS para exibir frações com numerador sobre denominador quando `denominator > 1`.
6. **Revisar o validador de vitória:** Validar que cada lado tem estritamente 1 elemento e que a incógnita $x$ possui coeficiente $+1$.
