// Variables globales
let selectedChipValue = 0;
let selectedChipColor = '';
let totalBet = 0;
let winnings = 0;
let betBalance = getCurrentBalance();
let placedBets = {};
let chipCounter = 0;
let placedChipsStack = [];
let lastTotalBet = 0;

const numRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];


//Funciones auxiliarias
function getUser() {
    const userStr = sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

//Juego
document.addEventListener("DOMContentLoaded", () => {
    const user = getUser();

    if (user) {
        betBalance = user.balance;
    } else {
        betBalance = initGuestBalance();
    }

    updateUI();

    window.onRouletteWinner = (winner) => {
        if (!winner) return;
        processWinner(winner);
        updateSpinButtonState();
        setChipsDisabled(false); 
    };

    document.getElementById("spinButton")?.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
        selectedChipValue = 0;
        setChipsDisabled(true); 
        
        //chip.classList.add("disabled");
        if (pause) {
            spin();
            disableSpinButton();
        }
    });

    document.getElementById("undoButton")?.addEventListener("click", undoLastBet);
    document.getElementById("resetButton")?.addEventListener("click", resetAllBets);

    document.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            if (chip.classList.contains("selected")) {
                chip.classList.remove("selected");
                selectedChipValue = 0;
                selectedChipColor = '';
            } else {
                document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
                chip.classList.add("selected");
                selectedChipValue = parseInt(chip.dataset.value);
                selectedChipColor = window.getComputedStyle(chip).backgroundColor;
            }
        });

    // DRAG AND DROP

    chip.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Previene que seleccione texto
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
        const selectedValue = parseInt(chip.dataset.value);
        const chipColor = window.getComputedStyle(chip).backgroundColor;

        const floatingChip = document.createElement("div");
        floatingChip.classList.add("chip", "floating-chip");
        floatingChip.textContent = selectedValue;
        floatingChip.style.position = "absolute";
        floatingChip.style.zIndex = 9999;
        floatingChip.style.background = chipColor;
        floatingChip.style.pointerEvents = "none";
        document.body.appendChild(floatingChip);

        function moveChip(e) {
            floatingChip.style.left = `${e.pageX - 20}px`;
            floatingChip.style.top = `${e.pageY - 20}px`;
        }

        document.addEventListener("mousemove", moveChip);

        document.addEventListener("mouseup", function mouseUp(e) 
        {
            document.removeEventListener("mousemove", moveChip);
            document.removeEventListener("mouseup", mouseUp);
            floatingChip.remove();

            const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest("td.cell");
            if (cell) {

                if (!canGuestPlay()) return;

                const name = cell.dataset.name;
                if (!name) return;

                if (betBalance < selectedValue) {
                    alert("No tienes suficiente balance!");
                    return;
                }

                betBalance -= selectedValue;
                totalBet += selectedValue;
                placedBets[name] = (placedBets[name] || 0) + selectedValue;

                const placedChip = document.createElement("div");
                placedChip.classList.add("chip", "placed-chip");
                placedChip.textContent = selectedValue;
                placedChip.style.position = "absolute";
                placedChip.style.zIndex = 100 + chipCounter++;
                placedChip.style.background = chipColor;
                placedChip.style.top = `${cell.clientHeight / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
                placedChip.style.left = `${cell.clientWidth / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
                cell.appendChild(placedChip);

                placedChipsStack.push({ chip: placedChip, cell, value: selectedValue, name });
                updateUI();
            }
        });
    });
    // CLICK EN TABLA
    document.querySelectorAll("td.cell").forEach((cell) => {
        // Primero eliminar cualquier listener anterior
        cell.replaceWith(cell.cloneNode(true));
    });
    
    document.querySelectorAll("td.cell").forEach((cell) => {
        cell.addEventListener("click", () => {
            if (!canGuestPlay()) return;
    
            const name = cell.dataset.name;
            if (!name || selectedChipValue === 0) return;
    
            if (betBalance < selectedChipValue) {
                alert("No tienes suficiente balance!");
                return;
            }
    
            placeBet(cell, selectedChipValue, selectedChipColor);
        });
    });




    });

    mostrarGanadores();
});

document.addEventListener('balanceUpdated', (e) => {
    betBalance = e.detail.balance;
    updateUI();
});

function updateUI() {
    document.getElementById("balanceAmount").textContent = formatMoney(betBalance);
    document.getElementById("totalBet").textContent = formatMoney(totalBet);
    document.getElementById("winningAmount").textContent = formatMoney(winnings);

    const totalCredits = document.getElementById("totalCredits");
    if (totalCredits) {
        totalCredits.textContent = formatMoney(betBalance);
    }
    updateSpinButtonState();
}

function processWinner(winner) {
    const result = winner.number;
    const color = winner.color.toLowerCase();
    console.log(`Numero ganador: ${result}, Color: ${color}`);
    calculateWinnings(result, color);
    showResult(result);
    mostrarGanadores();
    setTimeout(() => {
        if (!canGuestPlay()) return;
    }, 4000);
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
    betBalance += payout;
    lastTotalBet = totalBet;

    const user = getUser();
    if (user) {
        user.balance = betBalance;
        sessionStorage.setItem("user", JSON.stringify(user));

        fetch(`/users/${user._id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-auth": user.password
            },
            body: JSON.stringify({ balance: user.balance })
        })
        .then(res => res.json())
        .then(updatedUser => sessionStorage.setItem("user", JSON.stringify(updatedUser)))
        .catch(err => console.error("Error al actualizar balance", err));

        fetch('/bets', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-auth": user.password
            },
            body: JSON.stringify({
                userId: user._id,
                gameType: "roulette",
                betAmount: totalBetBeforeRound,
                result: payout > 0 ? "win" : "loss",
                payout: payout > 0 ? payout : lastTotalBet,
                rouletteNumber: result
            })
        }).catch(err => console.error("Error al guardar apuesta", err));
    }
    else 
    {
        // Invitado actualizar balance en localStorage
        localStorage.setItem("guestBalance", betBalance);
    }

    placedBets = {};
    totalBet = 0;
    document.querySelectorAll(".placed-chip").forEach(ch => ch.remove());
    placedChipsStack = [];
    updateUI();
}

function showResult(result) {
    const overlay = document.createElement("div");

    let winningsText = "";
    if (winnings > 0) {
        winningsText = `<div style="font-size: 3rem; margin-top: 10px; color: lightgreen; font-weight: bold;">+ ${formatMoney(winnings)}</div>`;
    } else {
        winningsText = `<div style="font-size: 3rem; margin-top: 10px; color: red; font-weight: bold;">- ${formatMoney(lastTotalBet)}</div>`;
    }

    overlay.innerHTML = `
        <div style="font-size: 8rem; font-weight: bold; ${winnings > 0 ? "color: lightgreen;" : "color: white;"} text-shadow: 2px 2px 10px black;">
            ${result}
        </div>
        ${winningsText}
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
    mostrarGanadores(result);
    setTimeout(() => overlay.remove(), 3000);
}

function undoLastBet() {
    if (placedChipsStack.length === 0) return;

    const last = placedChipsStack.pop();
    last.chip.remove();

    betBalance += last.value;
    totalBet -= last.value;
    placedBets[last.name] -= last.value;

    if (placedBets[last.name] <= 0) delete placedBets[last.name];

    updateUI();
}

function resetAllBets() {
    for (const amount of Object.values(placedBets)) {
        betBalance += amount;
    }

    placedChipsStack.forEach(({ chip }) => chip.remove());
    placedChipsStack = [];
    placedBets = {};
    totalBet = 0;

    updateUI();
}

function mostrarGanadoresDesdeDB() {
    const user = getUser();
    if (!user) return;

    fetch(`/bets/user/${user._id}`, {
        headers: { "x-auth": user.password }
    })
    .then(res => {
        if (!res.ok) throw new Error("No se pudieron obtener las apuestas");
        return res.json();
    })
    .then(bets => {
        // Solo apuestas de ruleta y ordenar por creación (suponiendo que tienen createdAt o similar)
        const rouletteBets = bets
            .filter(b => b.gameType === "roulette")
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 🔥 ORDENAR DE MÁS NUEVAS A MÁS VIEJAS

        // Tomar las primeras 5 que son las últimas jugadas
        const ultimosNumeros = rouletteBets.slice(0, 5).map(b => b.rouletteNumber);

        const container = document.getElementById("ganadoresList");
        if (!container) return;

        container.innerHTML = "";

        // Mostrar en orden (último primero en pantalla)
        ultimosNumeros.forEach(num => {
            const item = document.createElement("div");
            const colorClass = num === 0 ? "green" : (numRed.includes(num) ? "red" : "black");
            item.className = `ganador-item ${colorClass}`;
            item.innerHTML = `<span class="number">${num}</span>`;
            container.appendChild(item);
        });
    })
    .catch(err => {
        console.error("Error al obtener apuestas del usuario:", err);
    });
}

const ganadores = [];

function mostrarGanadores(n) {
  const user = getUser();

  if (!user) {
    if (n !== undefined && n !== null) {
        ganadores.unshift(n);
    }

    if (ganadores.length > 5) ganadores.pop();

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
  else 
  {
      
      mostrarGanadoresDesdeDB();
  }
}



document.getElementById("statsButton").addEventListener("click", async () => {
  const user = getUser();

  if (!user) {
      alert("Debes iniciar sesión para ver las estadísticas.");
      return;
  }

  await updateStatsModal();
  document.getElementById("stats-modal").style.display = "flex";
});

document.querySelector(".custom-stats-modal-close").addEventListener("click", () => {
  document.getElementById("stats-modal").style.display = "none";
});

//Obtener apuestas
async function fetchUserBets() {
  const user = getUser();
  if (!user) return null;

  try {
      const res = await fetch(`/bets/user/${user._id}`, {
          headers: { "x-auth": user.password }
      });

      if (!res.ok) throw new Error("No se pudieron obtener las apuestas");

      const bets = await res.json();

      // Solo devolver las de ruleta
      return bets.filter(b => b.gameType === "roulette");

  } catch (err) {
      console.error("Error al obtener apuestas del usuario:", err);
      return [];
  }
}


async function updateStatsModal() {
  const statsList = document.getElementById("statsList");
  const user = getUser();
  statsList.innerHTML = "";

  //Si es invitado, salir
  if (!user) {
      return;
  }

  // Si es usuario, obtener apuestas del backend
  const bets = await fetchUserBets();

  const wins = bets.filter(b => b.result === "win");
  const losses = bets.filter(b => b.result === "loss");

  bets.forEach((b, index) => {
      const li = document.createElement("li");

      const result = (b.result ?? "").toLowerCase();

      if (result === "win") {
          li.classList.add("win");
      } else {
          li.classList.add("loss");
      }

      li.textContent = `${index + 1}. ${result === "win" ? "Ganaste" : "Perdiste"} ${formatMoney(Math.abs(b.amount ?? b.payout))} - Número: ${b.number ?? b.rouletteNumber}`;
      statsList.appendChild(li);
  });

    const totalBets = wins.length + losses.length;
    const winPercentage = totalBets > 0 ? (wins.length / totalBets * 100).toFixed(0) : 0;

    document.getElementById("ratio").textContent = `${wins.length} / ${losses.length} (${winPercentage}%)`;

    const netResult = bets.reduce((acc, b) => {
        return acc + (b.result === "win" ? b.payout : -b.betAmount);
    }, 0);
    
    document.getElementById("netResult").textContent = formatMoney(netResult);
}


function updateSpinButtonState() {
    const spinButton = document.getElementById("spinButton");
    if (totalBet <= 0) {
        spinButton.setAttribute("disabled", "true");
        spinButton.classList.add("disabled");
    } else {
        spinButton.removeAttribute("disabled");
        spinButton.classList.remove("disabled");
    }
}


//Funcion guest
function canGuestPlay() {
    const user = getUser();

    // Si es invitado y no tiene balance o no tiene apuesta actual → no puede jugar
    if (!user && (betBalance <= 0 && totalBet <= 0)) {
        alert("No tienes créditos. Debes iniciar sesión para seguir jugando.");

        const loginModal = document.getElementById("loginRegisterModal");
        if (loginModal) {
            const modal = new bootstrap.Modal(loginModal);
            modal.show();
        }

        return false;
    }

    return true;
}


function setChipsDisabled(disabled) {
    document.querySelectorAll(".chip").forEach(chip => {
        chip.style.pointerEvents = disabled ? "none" : "auto";
    });
}

// FUNCION REUTILIZABLE PARA COLOCAR APUESTA
function placeBet(cell, value, color) {
    const name = cell.dataset.name;
    if (!name) return;

    betBalance -= value;
    totalBet += value;
    placedBets[name] = (placedBets[name] || 0) + value;

    const chip = document.createElement("div");
    chip.classList.add("chip", "placed-chip");
    chip.textContent = value;
    chip.style.position = "absolute";
    chip.style.zIndex = 100 + chipCounter++;
    chip.style.background = color;
    chip.style.top = `${cell.clientHeight / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
    chip.style.left = `${cell.clientWidth / 2 - 12 + Math.floor(Math.random() * 8 - 4)}px`;
    cell.appendChild(chip);

    placedChipsStack.push({ chip, cell, value, name });
    updateUI();
}