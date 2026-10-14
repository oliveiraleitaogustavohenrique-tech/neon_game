const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

const keys = {};
let running = false;
let gameOver = false;
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let speed = 230;
let stars = [];

const player = {
  x: 100,
  y: 250,
  size: 22,
  speed: 330
};

let obstacles = [];

for (let i = 0; i < 90; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 35 + 15
  });
}

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
  if (gameOver && e.key === "Enter") startGame();
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

startBtn.addEventListener("click", startGame);

function startGame() {
  running = true;
  gameOver = false;
  score = 0;
  speed = 230;
  spawnTimer = 0;
  obstacles = [];
  player.x = 100;
  player.y = canvas.height / 2;
  scoreEl.textContent = "0";
  startBtn.textContent = "REINICIAR";
  message.textContent = "Boa sorte! Desvie dos blocos!";
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function spawnObstacle() {
  const size = 25 + Math.random() * 42;
  obstacles.push({
    x: canvas.width + size,
    y: 30 + Math.random() * (canvas.height - size - 60),
    w: size,
    h: size,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 4
  });
}

function update(dt) {
  let dx = 0;
  let dy = 0;

  if (keys["arrowup"] || keys["w"]) dy -= 1;
  if (keys["arrowdown"] || keys["s"]) dy += 1;
  if (keys["arrowleft"] || keys["a"]) dx -= 1;
  if (keys["arrowright"] || keys["d"]) dx += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    player.x += (dx / length) * player.speed * dt;
    player.y += (dy / length) * player.speed * dt;
  }

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

  spawnTimer += dt;
  const spawnEvery = Math.max(0.28, 0.8 - score / 1200);
  if (spawnTimer >= spawnEvery) {
    spawnTimer = 0;
    spawnObstacle();
  }

  speed += dt * 5;
  score += dt * 10;
  scoreEl.textContent = Math.floor(score);

  for (const star of stars) {
    star.x -= star.speed * dt;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
  }

  for (const obstacle of obstacles) {
    obstacle.x -= speed * dt;
    obstacle.rotation += obstacle.spin * dt;
  }

  obstacles = obstacles.filter(o => o.x > -100);

  for (const o of obstacles) {
    if (circleRectCollision(player.x, player.y, player.size * 0.72, o)) {
      endGame();
      return;
    }
  }
}

function circleRectCollision(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#111044");
  gradient.addColorStop(1, "#050516");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = "rgba(120, 110, 255, .10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Stars
  for (const star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fill();
  }

  // Player glow
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#7cf7ff";
  ctx.fillStyle = "#7cf7ff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.size, player.y);
  ctx.lineTo(player.x - player.size, player.y - player.size * .75);
  ctx.lineTo(player.x - player.size * .45, player.y);
  ctx.lineTo(player.x - player.size, player.y + player.size * .75);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Obstacles
  for (const o of obstacles) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.rotation);
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff4f9a";
    ctx.fillStyle = "#ff4f9a";
    ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    ctx.strokeStyle = "#ffd2e5";
    ctx.lineWidth = 2;
    ctx.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
    ctx.restore();
  }

  if (!running) {
    ctx.fillStyle = "rgba(0,0,0,.38)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 38px Arial";
    ctx.fillText(gameOver ? "FIM DE JOGO" : "NEON RUNNER", canvas.width / 2, 215);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#c9c8e7";
    ctx.fillText(
      gameOver ? `Pontuação: ${Math.floor(score)} — pressione REINICIAR` : "Pressione JOGAR para começar",
      canvas.width / 2, 255
    );
  }
}

function endGame() {
  running = false;
  gameOver = true;
  message.textContent = `Você fez ${Math.floor(score)} pontos! Tente superar sua pontuação.`;
  draw();
}

function loop(time) {
  if (!running) {
    draw();
    return;
  }

  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  update(dt);
  draw();

  if (running) requestAnimationFrame(loop);
}

draw();
