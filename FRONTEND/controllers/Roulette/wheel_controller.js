// Configuración del canvas
const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;
const centerX = width / 2;
const centerY = height / 2;
const radius = width / 2;

//global
// Creamos un "listener" de ganador
window.onRouletteWinner = null; // global para que el otro script lo vea

// Números de la ruleta
const rouletteNumbers = [
  { number: 0, color: '#064420' }, // Verde especial
  { number: 32, color: '#8B0000' }, { number: 15, color: '#0A0A0A' }, { number: 19, color: '#8B0000' },
  { number: 4, color: '#0A0A0A' }, { number: 21, color: '#8B0000' }, { number: 2, color: '#0A0A0A' },
  { number: 25, color: '#8B0000' }, { number: 17, color: '#0A0A0A' }, { number: 34, color: '#8B0000' },
  { number: 6, color: '#0A0A0A' }, { number: 27, color: '#8B0000' }, { number: 13, color: '#0A0A0A' },
  { number: 36, color: '#8B0000' }, { number: 11, color: '#0A0A0A' }, { number: 30, color: '#8B0000' },
  { number: 8, color: '#0A0A0A' }, { number: 23, color: '#8B0000' }, { number: 10, color: '#0A0A0A' },
  { number: 5, color: '#8B0000' }, { number: 24, color: '#0A0A0A' }, { number: 16, color: '#8B0000' },
  { number: 33, color: '#0A0A0A' }, { number: 1, color: '#8B0000' }, { number: 20, color: '#0A0A0A' },
  { number: 14, color: '#8B0000' }, { number: 31, color: '#0A0A0A' }, { number: 9, color: '#8B0000' },
  { number: 22, color: '#0A0A0A' }, { number: 18, color: '#8B0000' }, { number: 29, color: '#0A0A0A' },
  { number: 7, color: '#8B0000' }, { number: 28, color: '#0A0A0A' }, { number: 12, color: '#8B0000' },
  { number: 35, color: '#0A0A0A' }, { number: 3, color: '#8B0000' }, { number: 26, color: '#0A0A0A' }
];

// Variables de control
let currentDeg = 0;
let speed = 0;
let maxRotation = 0;
let pause = true;
let winnerIndex = null; // Índice del número ganador

//variables estilo
let blinkState = false;   // Alterna entre dorado y su color original
let blinkInterval = null; // Guarda el intervalo para parpadeo

// Dibujar ruleta
function draw() {
  ctx.clearRect(0, 0, width, height);
  const step = 360 / rouletteNumbers.length;
  let startDeg = currentDeg;

  for (let i = 0; i < rouletteNumbers.length; i++, startDeg += step) {
    const endDeg = startDeg + step;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, toRad(startDeg), toRad(endDeg));
    ctx.closePath();

    ctx.fillStyle = rouletteNumbers[i].color;
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(toRad((startDeg + endDeg) / 2));
    ctx.textAlign = "right";

    // Definir color del número
    if (i === winnerIndex) {
      if (blinkState) {
        ctx.fillStyle = "#d4af37"; // Dorado cuando parpadea
      } else {
        ctx.fillStyle = rouletteNumbers[i].color === "red" ? "red" : "white"; // Su color original
      }
    } else {
      ctx.fillStyle = "white"; // Los demás siempre blancos
    }

    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(rouletteNumbers[i].number, radius - 10, 10);
    ctx.restore();
    // Círculo negro central
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);  // 10% del radio
    ctx.fillStyle = "#10";
    ctx.fill();
    ctx.closePath();
  }
}

// Utilidades
function toRad(deg) {
  return deg * (Math.PI / 180);
}

function easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
}

function getPercent(input, min, max) {
  return (((input - min) * 100) / (max - min)) / 100;
}

// Detectar el número ganador
function getWinner() {
  const normalizedDeg = (360 - (currentDeg % 360)) % 360;
  const step = 360 / rouletteNumbers.length;
  const index = Math.floor(normalizedDeg / step);
  const winner = rouletteNumbers[index];

  winnerIndex = index;
  //console.log(`Ganador: ${winner.number} (${winner.color})`);
  startBlinking();

  if (typeof window.onRouletteWinner === "function") {
    window.onRouletteWinner(winner);
  }
  return winner;
 
}

// Animar ruleta
function animate() {
  if (pause) return;

  speed = easeOutSine(getPercent(currentDeg, maxRotation, 0)) * 20;
  currentDeg += speed;
  draw();

  if (speed < 0.01) {
    speed = 0;
    pause = true;
    currentDeg = currentDeg % 360;
    getWinner();
    return;
  }

  window.requestAnimationFrame(animate);
}

// Iniciar giro
function spin() {
  if (!pause) return;

  winnerIndex = null; // Limpiar ganador anterior
  if (blinkInterval) clearInterval(blinkInterval); // Detener parpadeo si hay
  blinkState = false;
  
  maxRotation = 360 * 2 + Math.random() * 360;
  currentDeg = 0;
  pause = false;
  speed = 20;
  draw();
  window.requestAnimationFrame(animate);
}

function startBlinking() {
  if (blinkInterval) clearInterval(blinkInterval); // Por si había otro

  blinkState = false;
  blinkInterval = setInterval(() => {
    blinkState = !blinkState; // Cambiar entre dorado y original
    draw();
  }, 400); // Cambia cada 400 ms
}

// Primer dibujado
draw();