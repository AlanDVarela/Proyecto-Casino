// controllers/jackpot_game_controller.js

// Función para obtener el usuario autenticado desde sessionStorage
function getUser() {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

const lever = document.getElementById('lever');
const spinBtn = document.getElementById('spinBtn');
const reels = document.querySelectorAll('.reel');
const historyList = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const balanceDisplay = document.getElementById('balanceDisplay');
const betDisplay = document.getElementById('betDisplay');
const winDisplay = document.getElementById('winDisplay');
const betInput = document.getElementById('bet');

let balance = 1000;
const symbols = ['🍒', '🔔', '🍋', '💎', '7'];

// Inicializar balance al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    balance = user.balance;
  }
  updateStats(0, 0);
});

function updateStats(betAmount, winAmount) {
  balanceDisplay.textContent = `$${balance}`;
  betDisplay.textContent = `$${betAmount}`;
  winDisplay.textContent = `$${winAmount}`;
  // Actualizar también la barra de navegación si existe
  const totalCreditsElem = document.getElementById('totalCredits');
  if (totalCreditsElem) totalCreditsElem.textContent = `$${balance}`;
}

async function spinReel(reel, duration) {
  return new Promise(resolve => {
    const start = Date.now();
    const interval = setInterval(() => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      reel.textContent = symbol;
      if (Date.now() - start >= duration) {
        clearInterval(interval);
        resolve(symbol);
      }
    }, 100);
  });
}

async function spinAll() {
  spinBtn.style.pointerEvents = 'none';
  lever.classList.add('active');
  setTimeout(() => lever.classList.remove('active'), 200);

  const betAmount = parseInt(betInput.value, 10) || 0;
  if (betAmount <= 0 || betAmount > balance) {
    alert('Apuesta inválida');
    spinBtn.style.pointerEvents = 'auto';
    return;
  }
  balance -= betAmount;
  updateStats(betAmount, 0);

  const results = await Promise.all([
    spinReel(reels[0], 800),
    spinReel(reels[1], 1200),
    spinReel(reels[2], 1600)
  ]);

  let win = 0;
  if (results.every(s => s === results[0])) {
    win = betAmount * 5;
    balance += win;
  }
  
  // Guardar en backend y sessionStorage
  const user = getUser();
  if (user) {
    // Actualizar balance en backend
    fetch(`/users/${user._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-auth': user.password
      },
      body: JSON.stringify({ balance })
    })
    .then(res => res.json())
    .then(updatedUser => {
      // Actualizar sessionStorage y barra de navegación
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      const totalCreditsElem = document.getElementById('totalCredits');
      if (totalCreditsElem) totalCreditsElem.textContent = `$${updatedUser.balance}`;
      // Registrar apuesta en backend
      fetch('/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth': updatedUser.password
        },
        body: JSON.stringify({
          userId: updatedUser._id,
          gameType: 'slots',
          betAmount,
          slotSymbols: results
        })
      }).catch(err => console.error('Error al guardar apuesta', err));
    })
    .catch(err => console.error('Error al actualizar balance', err));
  }

  // Mostrar resultado en UI
  const li = document.createElement('li');
  li.textContent = `Resultado: ${results.join(' | ')} ${win ? `- Ganaste ${win}` : '- Perdió'}`;
  historyList.prepend(li);

  updateStats(0, win);
  spinBtn.style.pointerEvents = 'auto';
}

lever.addEventListener('click', spinAll);
spinBtn.addEventListener('click', spinAll);
clearHistoryBtn.addEventListener('click', () => {
  historyList.innerHTML = '';
});

// Al cerrar el modal de perfil, actualizar balance en la vista de Jackpot
document.addEventListener('DOMContentLoaded', () => {
  const profileModalEl = document.getElementById('profileModal');
  if (profileModalEl) {
    profileModalEl.addEventListener('hidden.bs.modal', () => {
      const user = getUser();
      if (user) {
        balance = user.balance;
        updateStats(0, 0);
      }
    });
  }
});
