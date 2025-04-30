const lever = document.getElementById('lever');
const spinBtn = document.getElementById('spinBtn');
const reels = document.querySelectorAll('.reel');
const historyList = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const balanceDisplay = document.getElementById('balanceDisplay');
const betDisplay = document.getElementById('betDisplay');
const winDisplay = document.getElementById('winDisplay');

let balance = 1000;
const symbols = ['🍒', '🔔', '🍋', '💎', '7'];

function updateStats(betAmount, winAmount) {
  balanceDisplay.textContent = `$${balance}`;
  betDisplay.textContent = `$${betAmount}`;
  winDisplay.textContent = `$${winAmount}`;
}

function spinReel(reel, duration) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      reel.style.transform = `translateY(${Math.random() * 20 - 10}px)`;
      reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      reel.style.transform = 'translateY(0)';
      const final = symbols[Math.floor(Math.random() * symbols.length)];
      reel.textContent = final;
      resolve(final);
    }, duration);
  });
}

async function spinAll() {
  spinBtn.style.pointerEvents = 'none';
  lever.classList.add('active');
  setTimeout(() => lever.classList.remove('active'), 200);

  const betAmount = parseInt(document.getElementById('bet').value, 10) || 0;
  balance -= betAmount;

  const results = await Promise.all([
    spinReel(reels[0], 800),
    spinReel(reels[1], 1200),
    spinReel(reels[2], 1600)
  ]);

  let win = 0;
  if (results.every(s => s === results[0])) {
    win = betAmount * 5;
  }
  balance += win;

  const li = document.createElement('li');
  li.textContent = `Resultado: ${results.join(' | ')} ${win ? `- Ganaste ${win}` : '- Perdió'}`;
  historyList.prepend(li);

  updateStats(betAmount, win);
  spinBtn.style.pointerEvents = 'auto';
}

lever.addEventListener('click', spinAll);
spinBtn.addEventListener('click', spinAll);
clearHistoryBtn.addEventListener('click', () => {
  historyList.innerHTML = '';
});
