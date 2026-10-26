# NeoCore — Simulador de CPU 8 bits

Simulador didático do ciclo **fetch–decode–execute** de uma CPU de 8 bits, para a disciplina de Arquitetura e Organização de Computadores (trabalho *NeoCore Computer Lab*).

Acesse o site em: https://aclevi.github.io/NeoCore/

## O que demonstra

- Como uma instrução percorre os componentes da CPU a cada **pulso de clock** (T0…T7).
- O papel de cada registrador (**PC, MAR, MDR, IR, ACC**), da **ULA**, da **UC** e da memória.
- Os três barramentos: **endereços, dados e controle**.
- Dispositivos de **entrada e saída** (chaves DIP + display).
- O fluxo de dados em um **diagrama de data-path reativo** (caixas + setas que acendem conforme o caminho ativo).
- A hierarquia de memória com uma **cache** de 4 linhas (mapeamento direto), mostrando **hit/miss** em cada leitura.

## Como rodar

É HTML/CSS/JS puro, sem dependências nem servidor. Basta abrir o `index.html` num navegador.

## Conjunto de instruções (8 bits = 4 opcode + 4 operando)

| Opcode | Mnemônico | Efeito |
|---|---|---|
| `0000` | LDA addr | ACC ← mem[addr] |
| `0001` | ADD addr | ACC ← ACC + mem[addr] |
| `0010` | STA addr | mem[addr] ← ACC |
| `0011` | OUT | mostra ACC na saída |
| `0100` | IN | ACC ← chaves |
| `1111` | HLT | para o clock |

## Programas de demonstração

Dá para alternar entre eles no seletor dos controles.

**soma 5 + 3** → resultado **8**:

| Endereço | Conteúdo | Mnemônico |
|---|---|---|
| 0 | `0000 1000` | LDA 8 |
| 1 | `0001 1001` | ADD 9 |
| 2 | `0010 1010` | STA 10 |
| 3 | `0011 0000` | OUT |
| 4 | `1111 0000` | HLT |

**soma 5 + 5** → resultado **10** (re-lê o endereço 8, demonstrando **cache hit**):

| Endereço | Conteúdo | Mnemônico |
|---|---|---|
| 0 | `0000 1000` | LDA 8 |
| 1 | `0001 1000` | ADD 8 |
| 2 | `0010 1010` | STA 10 |
| 3 | `0011 0000` | OUT |
| 4 | `1111 0000` | HLT |

**IN + 5** → resultado **chaves + 5** (lê o valor das chaves DIP):

| Endereço | Conteúdo | Mnemônico |
|---|---|---|
| 0 | `0100 0000` | IN |
| 1 | `0001 1000` | ADD 8 |
| 2 | `0011 0000` | OUT |
| 3 | `1111 0000` | HLT |

## Controles

- **Clock** — avança um pulso de clock (uma micro-operação).
- **Rodar** — executa automaticamente (vira "Pausar").
- **Reset** — recarrega o programa.
- **Seletor de programa** — alterna entre os programas de demonstração.

## Arquivos

- `index.html` — estrutura, vistas, diagrama de data-path e cache.
- `styles.css` — visual.
- `script.js` — lógica do ciclo fetch–decode–execute, cache e programas.
