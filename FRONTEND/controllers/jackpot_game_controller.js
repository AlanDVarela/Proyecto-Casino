// controllers/jackpot_game_controller.js

// Función para obtener el usuario autenticado desde sessionStorage
function getUser() {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

// Helper: formatea números con separador de miles y sin decimales
function formatCurrency(amount) {
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// IMPORTANTE: getCurrentBalance viene de nav_controller.js,
// y gestiona tanto el balance de usuario como el de invitado en localStorage.
let balance = getCurrentBalance();

const lever           = document.getElementById('lever');
const spinBtn         = document.getElementById('spinBtn');
const reels           = document.querySelectorAll('.reel');
const historyList     = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const balanceDisplay  = document.getElementById('balanceDisplay');
const betDisplay      = document.getElementById('betDisplay');
const winDisplay      = document.getElementById('winDisplay');
const betInput        = document.getElementById('bet');
const symbols         = ['🍒', '🔔', '🍋', '💎', '7'];

// Al cargar la página, si hay usuario cargamos su balance
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    balance = user.balance;
  }
  updateStats(0, 0);
});

// Actualiza las estadísticas en pantalla y en navbar
function updateStats(betAmount, winAmount) {
  balanceDisplay.textContent = formatCurrency(balance);
  betDisplay.textContent    = formatCurrency(betAmount);
  winDisplay.textContent    = formatCurrency(winAmount);
  const totalCreditsElem = document.getElementById('totalCredits');
  if (totalCreditsElem) {
    totalCreditsElem.textContent = formatCurrency(balance);
  }
}

// Animación de un solo carrete
async function spinReel(reel, duration) {
  return new Promise(resolve => {
    const start = Date.now();
    const interval = setInterval(() => {
      reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      if (Date.now() - start >= duration) {
        clearInterval(interval);
        resolve(reel.textContent);
      }
    }, 100);
  });
}

// Comprueba si un invitado todavía puede jugar
function canGuestPlay() {
  const user = getUser();
  if (!user && balance <= 0) {
    alert('No tienes créditos. Debes iniciar sesión para seguir jugando.');
    const loginModal = document.getElementById('loginRegisterModal');
    if (loginModal) new bootstrap.Modal(loginModal).show();
    return false;
  }
  return true;
}

// Gira todos los carretes y gestiona apuesta, ganancias y guardado
async function spinAll() {
  // Primero validamos créditos de invitado
  if (!canGuestPlay()) {
    spinBtn.style.pointerEvents = 'auto';
    return;
  }

  spinBtn.style.pointerEvents = 'none';
  lever.classList.add('active');
  setTimeout(() => lever.classList.remove('active'), 200);

  const betAmount = parseInt(betInput.value, 10) || 0;
  if (betAmount <= 0 || betAmount > balance) {
    alert('Apuesta inválida');
    spinBtn.style.pointerEvents = 'auto';
    return;
  }

  // Deduce la apuesta
  balance -= betAmount;
  updateStats(betAmount, 0);

  // Animar carretes
  const results = await Promise.all([
    spinReel(reels[0],  800),
    spinReel(reels[1], 1200),
    spinReel(reels[2], 1600)
  ]);

  // Calcula ganancia
  let win = 0;
  let result = 'loss';
  if (results.every(s => s === results[0])) {
    win = betAmount * 5;
    balance += win;
    result = 'win';
  }

  const user = getUser();
  if (user) {
    // Usuario autenticado: actualizar backend y sessionStorage
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
      // Refresca sessionStorage y navbar
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      const totalCreditsElem = document.getElementById('totalCredits');
      if (totalCreditsElem) {
        totalCreditsElem.textContent = formatCurrency(updatedUser.balance);
      }
      // Registrar apuesta en el historial de la base de datos
      return fetch('/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth': updatedUser.password
        },
        body: JSON.stringify({
          userId:    updatedUser._id,
          gameType:  'slots',
          betAmount: betAmount,
          result:    result,
          payout:    win,
          slotSymbols: results
        })
      });
    })
    .catch(err => console.error('Error al registrar apuesta o actualizar balance', err));
  } else {
    // Invitado: persistir balance en localStorage
    localStorage.setItem('guestBalance', balance);
  }

  // Mostrar resultado en historial UI
  const li = document.createElement('li');
  li.textContent = `Resultado: ${results.join(' | ')} ${win
    ? `- Ganaste ${formatCurrency(win)}`
    : '- Perdió'}`;
  historyList.prepend(li);

  // Actualizar UI final
  updateStats(0, win);
  spinBtn.style.pointerEvents = 'auto';
}

// Listeners de interacción
lever.addEventListener('click', spinAll);
spinBtn.addEventListener('click', spinAll);
clearHistoryBtn.addEventListener('click', () => {
  historyList.innerHTML = '';
});

// Al cerrar el modal de perfil, refrescar balance si cambió
document.addEventListener('DOMContentLoaded', () => {
  const profileModalEl = document.getElementById('profileModal');
  if (profileModalEl) {
    profileModalEl.addEventListener('hidden.bs.modal', () => {
      const u = getUser();
      if (u) {
        balance = u.balance;
        updateStats(0, 0);
      }
    });
  }
});

