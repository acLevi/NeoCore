# NeoCore — Simulador de CPU 8 bits

Simulador didático do ciclo **fetch–decode–execute** de uma CPU de 8 bits, para a disciplina de Arquitetura e Organização de Computadores (trabalho *NeoCore Computer Lab*).

## O que demonstra

- Como uma instrução percorre os componentes da CPU a cada **pulso de clock** (T0…T7).
- O papel de cada registrador (**PC, MAR, MDR, IR, ACC**), da **ULA**, da **UC** e da memória.
- Os três barramentos: **endereços, dados e controle**.
- O fluxo de dados em um **diagrama de data-path reativo** (caixas + setas que acendem conforme o caminho ativo).

## Como rodar

É HTML/CSS/JS puro, sem dependências nem servidor. Basta abrir o `index.html` num navegador.

## Conjunto de instruções (8 bits = 4 opcode + 4 operando)

| Opcode | Mnemônico | Efeito |
|---|---|---|
| `0000` | LDA addr | ACC ← mem[addr] |
| `0001` | ADD addr | ACC ← ACC + mem[addr] |
| `0010` | STA addr | mem[addr] ← ACC |
| `0011` | OUT | mostra ACC na saída |
| `1111` | HLT | para o clock |

## Programa de demonstração (soma 5 + 3)

| Endereço | Conteúdo | Mnemônico |
|---|---|---|
| 0 | `0000 1000` | LDA 8 |
| 1 | `0001 1001` | ADD 9 |
| 2 | `0010 1010` | STA 10 |
| 3 | `0011 0000` | OUT |
| 4 | `1111 0000` | HLT |

Resultado: a saída termina em **8**.

## Controles

- **Clock** — avança um pulso de clock (uma micro-operação).
- **Rodar** — executa automaticamente (vira "Pausar").
- **Reset** — recarrega o programa.

## Arquivos

- `index.html` — estrutura, vistas e o diagrama de data-path.
- `styles.css` — visual.
- `script.js` — lógica do ciclo fetch–decode–execute.
