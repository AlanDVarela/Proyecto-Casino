// controllers/blackjack_controllers.js

// 1. Gestión de usuario y créditos

const DEFAULT_BET = 100;

function getUser() {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

function initNavbarUser() {
  const user = getUser();
  if (!user) return;

  // 1) Ocultamos el botón de login
  document.getElementById("loginBtn")?.classList.add("d-none");

  // 2) Mostramos el dropdown de usuario
  const udc = document.getElementById("userDropdownContainer");
  const ud  = document.getElementById("userDropdown");
  if (udc && ud) {
    udc.classList.remove("d-none");
    // 3) Escribimos el username en el enlace
    ud.textContent = user.username;
  }
}


// --- Invitado: balance en LocalStorage ---
const defaultGuest = 1000;

function getGuestBalance() {
  const val = localStorage.getItem("guestBalance");
  if (!val) {
    localStorage.setItem("guestBalance", defaultGuest);
    return defaultGuest;
  }
  return parseInt(val, 10);
}

function setGuestBalance(amount) {
  localStorage.setItem("guestBalance", String(amount));
}

// --- Actualiza UI de balance y apuesta con formateo ---
function updateBalanceUI(betAmount = 0) {
  const user    = getUser();
  const credits = user ? user.balance : getGuestBalance();

  const total = document.getElementById("totalCredits");
  if (total) {
    total.textContent = `$${credits.toLocaleString()}`;
  }

  const bet = document.getElementById("bet-value");
  if (bet) {
    bet.textContent = `$${betAmount.toLocaleString()}`;
  }
}

// --- Persiste balance de usuario autenticado ---
async function persistBalance(newBalance) {
  const user = getUser();
  if (!user) return;

  user.balance = newBalance;
  sessionStorage.setItem("user", JSON.stringify(user));
  updateBalanceUI();

  try {
    const res = await fetch(`/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBalance })
    });
    if (!res.ok) throw new Error("API error");
    const updated = await res.json();
    sessionStorage.setItem("user", JSON.stringify(updated));
    updateBalanceUI();
  } catch (e) {
    console.error("Error persisting balance:", e);
  }
}

// 2. Inyección de estilos para cartas y overlay
(function injectStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes deal { 
      0% { opacity: 0; transform: translateY(-50px) scale(.8); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .deal-card { opacity: 0; animation: deal .4s ease forwards; }
    .card-img, .deal-card { width: 64px !important; height: auto !important; }
    #game-overlay {
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; color: #fff; font-size: 2rem;
      opacity: 0; visibility: hidden; transition: opacity .3s; z-index: 9999;
    }
    #game-overlay.show { opacity:1; visibility:visible; }
    #game-overlay p { margin: 0; }
    #game-overlay button { margin-top: 1rem; padding: .5rem 1rem; font-size: 1rem; }
  `;
  document.head.appendChild(style);
})();

// 3. Baraja y mano
class Deck {
  constructor() {
    this.cards = [];
    ["S","H","D","C"].forEach(suit =>
      ["A","2","3","4","5","6","7","8","9","0","J","Q","K"].forEach(val =>
        this.cards.push({ code: val + suit })
      )
    );
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  draw() {
    return this.cards.pop();
  }
}

class Hand {
  constructor() {
    this.cards = [];
  }
  add(card) {
    this.cards.push(card);
  }
  value() {
    let total = 0, aces = 0;
    this.cards.forEach(({ code }) => {
      const v = code[0];
      if (v === "A") { total += 11; aces++; }
      else if (["J","Q","K","0"].includes(v)) total += 10;
      else total += parseInt(v, 10);
    });
    while (total > 21 && aces--) total -= 10;
    return total;
  }
}

// 4. Lógica de Blackjack
class Blackjack {
  constructor() {
    const user = getUser();
    this.credits   = user ? user.balance : getGuestBalance();
    this.deck      = null;
    this.player    = null;
    this.dealer    = null;
    this.isOver    = false;
    this.bet       = 0;
    this.animDelay = 400;
    updateBalanceUI();
  }

  start(bet) {
    hideOverlay();
    if (bet <= 0 || bet > this.credits) {
      alert("Apuesta inválida");
      return;
    }
    this.bet       = bet;
    this.credits  -= bet;
    if (!getUser()) setGuestBalance(this.credits);
    updateBalanceUI(bet);

    this.deck   = new Deck();
    this.deck.shuffle();
    this.player = new Hand();
    this.dealer = new Hand();
    this.isOver = false;

    const p0 = this.deck.draw(), d0 = this.deck.draw();
    const p1 = this.deck.draw(), d1 = this.deck.draw();
    this.player.add(p0);
    this.dealer.add(d0);
    this.player.add(p1);
    this.dealer.add(d1);

    this._clearUI();
    this._disableActions();
    [
      { hand: "player", card: p0, hide: false },
      { hand: "dealer", card: d0, hide: false },
      { hand: "player", card: p1, hide: false },
      { hand: "dealer", card: d1, hide: true }
    ].forEach((it, i) =>
      setTimeout(() => this._animateCard(it.hand, it.card, it.hide), i * this.animDelay)
    );
    setTimeout(() => this._enableActions(), 4 * this.animDelay);
  }

  hit() {
    if (this.isOver) return;
    const c = this.deck.draw();
    this.player.add(c);
    this._animateCard("player", c, false);
    if (this.player.value() > 21) {
      this.isOver = true;
      setTimeout(() => this._finish(), this.animDelay);
    }
  }

  stand() {
    if (this.isOver) return;
    this.isOver = true;
    this._disableActions();

    const hole = document.querySelector('.dealer-cards img[data-hidden]');
    if (hole) {
      hole.src = `https://deckofcardsapi.com/static/img/${this.dealer.cards[1].code}.png`;
      hole.removeAttribute("data-hidden");
    }

    const drawDealer = () => {
      if (this.dealer.value() < 17) {
        const c = this.deck.draw();
        this.dealer.add(c);
        this._animateCard("dealer", c, false);
        setTimeout(drawDealer, this.animDelay);
      } else {
        setTimeout(() => this._finish(), this.animDelay);
      }
    };
    setTimeout(drawDealer, this.animDelay);
  }

async _finish() {
  const p = this.player.value(), d = this.dealer.value();
  let msg = "", delta = 0;

  if (p > 21) {
    msg = `¡Te pasaste! Pierdes ${this.bet}`;
  } else if (d > 21 || p > d) {
    msg = `¡Ganaste ${this.bet}!`;
    delta = this.bet * 2;
  } else if (p < d) {
    msg = `Perdiste ${this.bet}`;
  } else {
    msg = `Empate. Recuperas ${this.bet}`;
    delta = this.bet;
  }

  this.credits += delta;

  // Si es invitado, actualiza LocalStorage
  if (!getUser()) {
    setGuestBalance(this.credits);
  }

  // Actualiza siempre la UI con la apuesta por defecto
  updateBalanceUI(DEFAULT_BET);

  showOverlay(msg, async () => {
    await persistBalance(this.credits);
    // para usuarios autenticados, también mantenemos el bet en DEFAULT_BET
    updateBalanceUI(DEFAULT_BET);
  });
}


  _clearUI() {
    document.querySelector(".player-cards").innerHTML = "";
    document.querySelector(".dealer-cards").innerHTML = "";
  }

  _disableActions() {
    document.querySelectorAll(".action-btns .btn").forEach(b => b.disabled = true);
  }

  _enableActions() {
    document.querySelectorAll(".action-btns .btn").forEach(b => b.disabled = false);
  }

  _animateCard(hand, card, hide = false) {
    const cont = document.querySelector(`.${hand}-cards`);
    if (!cont) return;
    const img = document.createElement("img");
    img.className = "deal-card";
    img.src = hide
      ? "https://deckofcardsapi.com/static/img/back.png"
      : `https://deckofcardsapi.com/static/img/${card.code}.png`;
    if (hide) img.setAttribute("data-hidden", "true");
    cont.appendChild(img);
  }
}

// 5. Overlay helpers
function showOverlay(text, onClose) {
  let ov = document.getElementById("game-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "game-overlay";
    ov.innerHTML = `
      <p id="overlay-text"></p>
      <button id="overlay-btn">Jugar de nuevo</button>
    `;
    document.body.appendChild(ov);
    document.getElementById("overlay-btn").onclick = () => {
      hideOverlay();
      onClose && onClose();
    };
  }
  document.getElementById("overlay-text").textContent = text;
  ov.classList.add("show");
}

function hideOverlay() {
  const ov = document.getElementById("game-overlay");
  if (ov) ov.classList.remove("show");
}

// 6. Actions de dropdown
function setupUserDropdownActions() {
  document.getElementById("userDropdownProfile")?.addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("profileModal")).show();
  });
  document.getElementById("userDropdownSettings")?.addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("settingsModal")).show();
  });
  document.getElementById("userDropdownLogout")?.addEventListener("click", () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("guestBalance");
    window.location.href = "login.html";
  });
}

// 7. Inicialización
window.addEventListener("DOMContentLoaded", () => {
  initNavbarUser();
  setupUserDropdownActions();

  const game    = new Blackjack();
  const dealBtn = document.querySelector(".btn-deal");
  const slider  = document.getElementById("bet-slider");
  const valEl   = document.getElementById("bet-value");

  if (slider && valEl) {
    // Establece el valor inicial del slider y la apuesta a 100
    slider.value     = 100;
    valEl.innerText  = slider.value;

    slider.addEventListener("input", () => {
      valEl.innerText = slider.value;
    });
  }

  dealBtn?.addEventListener("click", () => {
    // Si parseInt falla o es 0, usamos 100 como apuesta por defecto
    const raw = valEl.innerText.replace("$", "").replace(/,/g, "");
    const bet = parseInt(raw, 10) || 100;
    game.start(bet);
  });

  document.querySelector(".action-btns")?.addEventListener("click", e => {
    const t = e.target.textContent.trim();
    if (t === "Hit")   game.hit();
    if (t === "Stand") game.stand();
  });
});

  
