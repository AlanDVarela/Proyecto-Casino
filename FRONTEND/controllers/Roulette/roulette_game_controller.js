// Variables globales de apuestas
let selectedChipValue = 0;
let selectedChipColor = '';
let balance = 1000;
let totalBet = 0;
let winnings = 0;
let placedBets = {}; // Relacion de apuestas
let chipCounter = 0;
let placedChipsStack = []; // Pila de fichas colocadas

const numRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

document.addEventListener("DOMContentLoaded", () => {
  updateUI();

  window.onRouletteWinner = (winner) => {
    if (!winner) return;
    processWinner(winner);
    enableSpinButton();
  };

  document.getElementById("spinButton")?.addEventListener("click", () => {
    if (pause) {
      spin();
      disableSpinButton();
    }
  });

  document.getElementById("undoButton")?.addEventListener("click", undoLastBet);
  document.getElementById("resetButton")?.addEventListener("click", resetAllBets);

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedChipValue = parseInt(chip.dataset.value);
      selectedChipColor = window.getComputedStyle(chip).backgroundColor;
    });
  });

  document.querySelectorAll("td.cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const name = cell.dataset.name;
      if (!name || selectedChipValue === 0) return;
      if ( balance < selectedChipValue)
      {
         alert("No tienes suficiente balance!")
         return;
      } 

      balance -= selectedChipValue;
      totalBet += selectedChipValue;
      placedBets[name] = (placedBets[name] || 0) + selectedChipValue;

      const chip = document.createElement("div");
      chip.classList.add("chip", "placed-chip");
      chip.textContent = selectedChipValue;
      chip.style.position = "absolute";
      chip.style.zIndex = 100 + chipCounter++;
      chip.style.background = selectedChipColor;
      chip.style.top = `${cell.clientHeight / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
      chip.style.left = `${cell.clientWidth / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
      cell.appendChild(chip);

      placedChipsStack.push({ chip, cell, value: selectedChipValue, name });
      updateUI();
    });
  });
});

//Update
function updateUI() {
  document.getElementById("balanceAmount").textContent = `$${balance}`;
  document.getElementById("totalBet").textContent = `$${totalBet}`;
  document.getElementById("winningAmount").textContent = `$${winnings}`;
}

function processWinner(winner) {
  const result = winner.number;
  const color = winner.color.toLowerCase();
  console.log(`Numero ganador: ${result}, Color: ${color}`);
  calculateWinnings(result, color);
  showResult(result);
}

function calculateWinnings(result, color) {
  let payout = 0;
  const totalBetBeforeRound = totalBet;

  for (const [key, amount] of Object.entries(placedBets)) {
    const num = parseInt(key);
    if (!isNaN(num) && num === result) payout += amount * 36;
    else if (key === "red" && color === "#8b0000") payout += amount * 2;
    else if (key === "black" && color === "#0a0a0a") payout += amount * 2;
    else if (key === "green" && color === "#064420") payout += amount * 36;
    else if (key === "even" && result !== 0 && result % 2 === 0) payout += amount * 2;
    else if (key === "odd" && result % 2 === 1) payout += amount * 2;
    else if (key === "1-18" && result >= 1 && result <= 18) payout += amount * 2;
    else if (key === "19-36" && result >= 19 && result <= 36) payout += amount * 2;
    else if (key === "1st12" && result >= 1 && result <= 12) payout += amount * 3;
    else if (key === "2nd12" && result >= 13 && result <= 24) payout += amount * 3;
    else if (key === "3rd12" && result >= 25 && result <= 36) payout += amount * 3;
    else if (key === "2to1-top" && [3,6,9,12,15,18,21,24,27,30,33,36].includes(result)) payout += amount * 3;
    else if (key === "2to1-middle" && [2,5,8,11,14,17,20,23,26,29,32,35].includes(result)) payout += amount * 3;
    else if (key === "2to1-bottom" && [1,4,7,10,13,16,19,22,25,28,31,34].includes(result)) payout += amount * 3;
  }

  winnings = payout;
  balance += payout;

  const netGain = payout - totalBetBeforeRound;
  gameStats.push({
    result: netGain > 0 ? "win" : "loss",
    amount: netGain,
    number: result // << número de la ruleta
  });




  placedBets = {};
  totalBet = 0;


  document.querySelectorAll(".placed-chip").forEach(ch => ch.remove());
  placedChipsStack = []; // Limpia la pila también
  updateUI();
}

function showResult(result) {
  const overlay = document.createElement("div");
  overlay.innerHTML = `
    <div style="font-size: 8rem; font-weight: bold; ${winnings > 0 ? "color: lightgreen;" : "color: white;"} text-shadow: 2px 2px 10px black;">
      ${result}
    </div>
    ${
      winnings > 0
        ? `<div style="font-size: 3rem; margin-top: 10px; color: lightgreen; font-weight: bold;">+ $${winnings}</div>`
        : ""
    }
  `;

  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    zIndex: 9999,
    pointerEvents: "none"
  });

  document.body.appendChild(overlay);

  setTimeout(() => overlay.remove(), 3000);
  mostrarGanadores(result);
}

function disableSpinButton() {
  document.getElementById("spinButton")?.setAttribute("disabled", "true");
}

function enableSpinButton() {
  document.getElementById("spinButton")?.removeAttribute("disabled");
}

function undoLastBet() {
  if (placedChipsStack.length === 0) return;

  const last = placedChipsStack.pop();
  last.chip.remove();

  balance += last.value;
  totalBet -= last.value;
  placedBets[last.name] -= last.value;

  if (placedBets[last.name] <= 0) delete placedBets[last.name];

  updateUI();
}

function resetAllBets() {
  // Sumar todo el dinero apostado de regreso al balance
  for (const amount of Object.values(placedBets)) {
    balance += amount;
  }

  // Borrar las fichas visuales
  placedChipsStack.forEach(({ chip }) => chip.remove());

  // Limpiar todo
  placedChipsStack = [];
  placedBets = {};
  totalBet = 0;
  
  // Actualizar la UI
  updateUI();
}

const ganadores = [];

function mostrarGanadores(n) {
  ganadores.unshift(n); // Agrega el nuevo al inicio
  if (ganadores.length > 5) ganadores.pop(); // Máximo 4 números

  const container = document.getElementById("ganadoresList");
  if (!container) return;

  container.innerHTML = "";

  ganadores.forEach(num => {
    const item = document.createElement("div");
    const colorClass = num === 0 ? "green" : (numRed.includes(num) ? "red" : "black");
  
    item.className = `ganador-item ${colorClass}`;
    item.innerHTML = `<span class="number">${num}</span>`;
    container.appendChild(item);
  });
}


let gameStats = []; // { result: 'win'|'loss', amount: 100 }

document.getElementById("statsButton").addEventListener("click", () => {
  updateStatsModal();
  document.getElementById("statsModal").style.display = "flex";
});

document.querySelector(".modal .close").addEventListener("click", () => {
  document.getElementById("statsModal").style.display = "none";
});

function logGame(result, amount) {
  gameStats.push({
    result: netGain > 0 ? "win" : "loss",
    amount: netGain,
    number: result 
  });
}

function updateStatsModal() {
  const statsList = document.getElementById("statsList");
  const wins = gameStats.filter(g => g.result === "win");
  const losses = gameStats.filter(g => g.result === "loss");

  let net = 0;
  statsList.innerHTML = "";

  gameStats.forEach((g, index) => {
    const li = document.createElement("li");
    li.className = g.result;

    const resultText = g.result === "win" 
      ? `Ganaste $${g.amount}` 
      : `Perdiste $${Math.abs(g.amount)}`;

    li.textContent = `${index + 1}. ${resultText} - Número: ${g.number}`;
    
    net += g.amount;
    statsList.appendChild(li);
  });

  document.getElementById("ratio").textContent = `${wins.length} / ${losses.length}`;
  document.getElementById("netResult").textContent = net;
}
