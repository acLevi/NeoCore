// NeoCore — simulador de CPU de 8 bits (ciclo fetch–decode–execute)
// Memória simplificada para 16 posições (0x0 a 0xF), endereçável pelo operando de 4 bits.

const MEM_SIZE = 16;

let pc = 0, mar = 0, mdr = 0, ir = 0, acc = 0;
let disp = 0;
let mem = new Array(MEM_SIZE).fill(0);
let step = 0;        // T0..T7 (contador de passos da UC)
let currentOp = 0;   // opcode decodificado em T4
let signal = '—';    // sinal de controle corrente
let halted = false;
let cycle = 0;       // contador global de ciclos de clock
let runTimer = null;

const MNEMONIC = { 0x0: 'LDA', 0x1: 'ADD', 0x2: 'STA', 0x3: 'OUT', 0xF: 'HLT' };

function bin8(v) { return (v & 0xFF).toString(2).padStart(8, '0'); }
function hex2(v) { return (v & 0xFF).toString(16).padStart(2, '0').toUpperCase(); }
function v(id, txt) { document.getElementById(id).textContent = txt; }

function buildMemory() {
  const box = document.getElementById('memory');
  box.innerHTML = '';
  for (let i = 0; i < MEM_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'mem';
    cell.id = 'mem-' + i;
    cell.innerHTML = '<span class="addr">0x' + hex2(i) + '</span><span class="val">00000000</span>';
    box.appendChild(cell);
  }
}

function loadProgram() {
  mem = new Array(MEM_SIZE).fill(0);
  // programa: soma 5 + 3
  mem[0]  = 0x08;  // 0000 1000 = LDA 8
  mem[1]  = 0x19;  // 0001 1001 = ADD 9
  mem[2]  = 0x2A;  // 0010 1010 = STA 10
  mem[3]  = 0x30;  // 0011 0000 = OUT
  mem[4]  = 0xF0;  // 1111 0000 = HLT
  // dados
  mem[8]  = 0x05;  // 5
  mem[9]  = 0x03;  // 3
  mem[10] = 0x00;  // resultado
}

function setActive(ids) {
  clearActive();
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('active'); });
}
function clearActive() {
  document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
}

function log(msg, plain) {
  const ol = document.getElementById('log');
  const li = document.createElement('li');
  li.textContent = plain ? msg : ('ciclo ' + cycle + ' · ' + msg);
  ol.appendChild(li);
  ol.scrollTop = ol.scrollHeight;
}
function clearLog() { document.getElementById('log').innerHTML = ''; }

function tick() {
  if (halted) return;
  cycle++;
  const opcode = (ir >> 4) & 0xF;
  const operand = ir & 0xF;

  switch (step) {
    // ---- Fetch (busca) ----
    case 0: // T0: MAR ← PC
      mar = pc; signal = 'PC→MAR · LoadMAR';
      setActive(['reg-pc', 'reg-mar', 'bus-enderecos', 'd-pc', 'd-mar', 'd-w-pc-mar']);
      log('T0 · MAR ← PC  (' + hex2(mar) + ')');
      step = 1; break;
    case 1: // T1: MDR ← mem[MAR]
      mdr = mem[mar]; signal = 'Read';
      setActive(['reg-mar', 'mem-' + mar, 'reg-mdr', 'bus-dados', 'd-mar', 'd-mem', 'd-mdr', 'd-w-mar-mem', 'd-w-mem-mdr']);
      log('T1 · MDR ← mem[' + hex2(mar) + ']  = ' + bin8(mdr));
      step = 2; break;
    case 2: // T2: IR ← MDR
      ir = mdr; signal = 'LoadIR';
      setActive(['reg-mdr', 'reg-ir', 'bus-dados', 'd-mdr', 'd-ir', 'd-w-mdr-ir']);
      log('T2 · IR ← MDR  = ' + bin8(ir));
      step = 3; break;
    case 3: // T3: PC ← PC + 1
      pc = (pc + 1) & 0xFF; signal = 'IncPC';
      setActive(['reg-pc', 'd-pc']);
      log('T3 · PC ← PC + 1  (' + hex2(pc) + ')');
      step = 4; break;

    // ---- Decode (decodificação) ----
    case 4: // T4: UC lê o opcode
      currentOp = opcode; signal = 'Decode';
      setActive(['reg-ir', 'd-ir', 'd-uc', 'd-w-uc-mem']);
      log('T4 · decode: opcode ' + bin8(currentOp << 4).slice(0, 4) + ' → ' + (MNEMONIC[currentOp] || '?'));
      step = 5; break;

    // ---- Execute (execução) ----
    case 5: // T5
      if (currentOp === 0x0 || currentOp === 0x1 || currentOp === 0x2) {
        mar = operand; signal = 'LoadMAR';
        setActive(['reg-ir', 'reg-mar', 'bus-enderecos', 'd-ir', 'd-mar']);
        log('T5 · ' + MNEMONIC[currentOp] + ': MAR ← ' + hex2(operand));
        step = 6;
      } else if (currentOp === 0x3) { // OUT
        disp = acc; signal = 'LoadOut';
        setActive(['reg-acc', 'output', 'bus-dados', 'd-acc', 'd-out', 'd-w-acc-out']);
        log('T5 · OUT: saída ← ACC  = ' + disp);
        step = 0; // fim da instrução
      } else if (currentOp === 0xF) { // HLT
        signal = 'Halt';
        setActive(['reg-ir', 'd-ir', 'd-uc']);
        log('T5 · HLT: clock para.');
        halted = true;
        stopRun();
      }
      break;

    case 6: // T6
      if (currentOp === 0x0 || currentOp === 0x1) { // LDA / ADD: MDR ← mem[MAR]
        mdr = mem[mar]; signal = 'Read';
        setActive(['reg-mar', 'mem-' + mar, 'reg-mdr', 'bus-dados', 'd-mar', 'd-mem', 'd-mdr', 'd-w-mar-mem', 'd-w-mem-mdr']);
        log('T6 · MDR ← mem[' + hex2(mar) + ']  = ' + bin8(mdr));
      } else if (currentOp === 0x2) { // STA: MDR ← ACC
        mdr = acc; signal = 'LoadMDR';
        setActive(['reg-acc', 'reg-mdr', 'bus-dados', 'd-acc', 'd-mdr']);
        log('T6 · MDR ← ACC  = ' + bin8(mdr));
      }
      step = 7; break;

    case 7: // T7
      if (currentOp === 0x0) { // LDA: ACC ← MDR
        acc = mdr; signal = 'LoadACC';
        setActive(['reg-mdr', 'reg-acc', 'bus-dados', 'd-mdr', 'd-acc', 'd-w-mdr-acc']);
        log('T7 · ACC ← MDR  = ' + bin8(acc));
      } else if (currentOp === 0x1) { // ADD: ACC ← ACC + MDR
        acc = (acc + mdr) & 0xFF; signal = 'ALU';
        setActive(['reg-acc', 'reg-mdr', 'reg-ula', 'bus-dados', 'd-acc', 'd-mdr', 'd-ula', 'd-w-acc-ula']);
        log('T7 · ACC ← ACC + MDR  = ' + bin8(acc) + ' (' + acc + ')');
      } else if (currentOp === 0x2) { // STA: mem[MAR] ← MDR
        mem[mar] = mdr; signal = 'Write';
        setActive(['reg-mdr', 'mem-' + mar, 'bus-dados', 'd-mdr', 'd-mem', 'd-w-mdr-mem']);
        log('T7 · mem[' + hex2(mar) + '] ← MDR  = ' + bin8(mdr));
      }
      step = 0; // fim da instrução
      break;
  }
  render();
}

function render() {
  v('v-pc', bin8(pc)); v('h-pc', hex2(pc));
  v('v-mar', bin8(mar)); v('h-mar', hex2(mar));
  v('v-mdr', bin8(mdr)); v('h-mdr', hex2(mdr));
  v('v-ir', bin8(ir)); v('h-ir', hex2(ir));
  v('v-acc', bin8(acc)); v('h-acc', hex2(acc));
  v('v-bus-enderecos', hex2(mar));
  v('v-bus-dados', bin8(mdr));
  v('v-bus-controle', signal);
  for (let i = 0; i < MEM_SIZE; i++) {
    document.getElementById('mem-' + i).querySelector('.val').textContent = bin8(mem[i]);
  }
  document.getElementById('output').textContent = disp;
  document.getElementById('status').textContent = halted ? 'halt' : ('T' + step + ' · ciclo ' + cycle);
}

function startRun() {
  if (runTimer) return;
  runTimer = setInterval(() => { if (halted) stopRun(); else tick(); }, 700);
  document.getElementById('btn-run').textContent = 'Pausar';
}
function stopRun() {
  if (runTimer) { clearInterval(runTimer); runTimer = null; }
  document.getElementById('btn-run').textContent = 'Rodar';
}

function reset() {
  stopRun();
  pc = mar = mdr = ir = acc = disp = 0;
  step = 0; currentOp = 0; signal = '—'; halted = false; cycle = 0;
  loadProgram();
  clearActive(); clearLog();
  log('Reset: programa carregado (soma 5 + 3).', true);
  render();
}

document.getElementById('btn-step').addEventListener('click', tick);
document.getElementById('btn-run').addEventListener('click', () => { if (runTimer) stopRun(); else startRun(); });
document.getElementById('btn-reset').addEventListener('click', reset);

buildMemory();
reset();
