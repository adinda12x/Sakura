const canvas = document.getElementById("parkCanvas");
const ctx = canvas.getContext("2d");

const btnTime = document.getElementById("btnTime");
const btnWind = document.getElementById("btnWind");
const btnBurst = document.getElementById("btnBurst");
const btnPause = document.getElementById("btnPause");

let width = 0;
let height = 0;
let paused = false;
let timeIndex = 0;
let windLevel = 1;
let frame = 0;

const themes = [
  {
    name: "Senja",
    skyTop: "#4a4e7c",
    skyBottom: "#f5b7b1",
    lakeTop: "#4f7994",
    lakeBottom: "#233d52",
    grass: "#4e7d58",
    path: "#e5d3b3",
    petal: "#ffd6e4",
  },
  {
    name: "Pagi",
    skyTop: "#5aa9e6",
    skyBottom: "#e8f6ff",
    lakeTop: "#56b4d3",
    lakeBottom: "#247ba0",
    grass: "#67a868",
    path: "#efe0c4",
    petal: "#ffe8f0",
  },
  {
    name: "Malam",
    skyTop: "#161b33",
    skyBottom: "#3a456b",
    lakeTop: "#243b55",
    lakeBottom: "#101c2c",
    grass: "#29473b",
    path: "#7d7268",
    petal: "#ffc2d4",
  },
];

let petals = [];
let people = [];
let trees = [];
let ripples = [];
let floatingTexts = [];
let boat = { x: 0.35, y: 0.54, targetX: 0.65, speed: 0.0004 };

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  setupScene();
}

function setupScene() {
  trees = Array.from({ length: 6 }, (_, i) => ({
    x: width * (0.1 + i * 0.16),
    y: height * (i % 2 === 0 ? 0.56 : 0.47),
    scale: i % 2 === 0 ? 1.05 : 0.78,
    shake: 0,
  }));

  people = Array.from({ length: 10 }, (_, i) => ({
    x: Math.random() * width,
    y: height * (0.68 + (i % 4) * 0.06),
    dir: i % 2 === 0 ? 1 : -1,
    speed: 0.5 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    shirt: ["#ff8fab", "#ffd166", "#72efdd", "#a0c4ff", "#bdb2ff"][i % 5],
    greetTimer: 0,
  }));

  petals = Array.from({ length: 130 }, () => makePetal(true));
}

function makePetal(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -10,
    r: 3 + Math.random() * 4,
    vy: 0.7 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
  };
}

function spawnBurst(cx, cy, count = 28) {
  for (let i = 0; i < count; i++) {
    petals.push({
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 40,
      r: 3.5 + Math.random() * 4.5,
      vy: 0.5 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    });
  }
  if (petals.length > 260) {
    petals.splice(0, petals.length - 260);
  }
}

function drawScene(theme) {
  const horizonY = height * 0.46;
  const lakeBottomY = height * 0.65;

  // Langit
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, theme.skyTop);
  skyGrad.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY + 2);

  // Danau
  const lakeGrad = ctx.createLinearGradient(0, horizonY, 0, lakeBottomY);
  lakeGrad.addColorStop(0, theme.lakeTop);
  lakeGrad.addColorStop(1, theme.lakeBottom);
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, horizonY, width, lakeBottomY - horizonY);

  // Perahu kecil di danau
  const bx = boat.x * width;
  const by = boat.y * height + Math.sin(frame * 0.04) * 2;
  ctx.fillStyle = "#8d5524";
  ctx.beginPath();
  ctx.ellipse(bx, by, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rumput taman & jalan setapak
  ctx.fillStyle = theme.grass;
  ctx.fillRect(0, lakeBottomY, width, height - lakeBottomY);

  ctx.fillStyle = theme.path;
  ctx.beginPath();
  ctx.moveTo(0, lakeBottomY + 18);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 52, width, lakeBottomY + 22);
  ctx.lineTo(width, lakeBottomY + 48);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 78, 0, lakeBottomY + 44);
  ctx.closePath();
  ctx.fill();

  // Riak air saat danau diklik
  ripples.forEach((rp) => {
    ctx.strokeStyle = `rgba(255,255,255,${rp.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.r * 1.8, rp.r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Pohon sakura
  trees.forEach((t) => {
    const sway = Math.sin(frame * 0.02 + t.x) * 3 + Math.sin(t.shake) * 8;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.scale, t.scale);

    ctx.fillStyle = "#5c4033";
    ctx.fillRect(-7, -75, 14, 75);

    ctx.fillStyle = theme.petal;
    ctx.beginPath();
    ctx.arc(-28 + sway, -82, 34, 0, Math.PI * 2);
    ctx.arc(28 + sway, -82, 34, 0, Math.PI * 2);
    ctx.arc(sway, -102, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Orang berjalan / menyapa
  people.forEach((p) => {
    const wave = p.greetTimer > 0 ? Math.sin(frame * 0.35) * 6 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Kaki
    const step = p.greetTimer > 0 ? 0 : Math.sin(frame * 0.08 + p.phase) * 5;
    ctx.strokeStyle = "#2b2d42";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, -14);
    ctx.lineTo(-3 + step, 0);
    ctx.moveTo(3, -14);
    ctx.lineTo(3 - step, 0);
    ctx.stroke();

    // Badan
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-6, -28, 12, 15);

    // Tangan melambai saat diklik
    if (p.greetTimer > 0) {
      ctx.strokeStyle = "#f4c2a1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, -24);
      ctx.lineTo(13, -34 + wave);
      ctx.stroke();
    }

    // Kepala
    ctx.fillStyle = "#f4c2a1";
    ctx.beginPath();
    ctx.arc(0, -34, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Kelopak sakura jatuh
  ctx.fillStyle = theme.petal;
  petals.forEach((pt) => {
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y, pt.r, pt.r * 0.55, pt.phase, 0, Math.PI * 2);
    ctx.fill();
  });

  // Teks reaksi kecil saat diklik
  floatingTexts.forEach((ft) => {
    ctx.fillStyle = `rgba(255,255,255,${ft.alpha})`;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(ft.text, ft.x - 18, ft.y);
  });
}

function update() {
  if (paused) return;
  frame += 1;

  const wind = windLevel === 0 ? 0.2 : windLevel === 1 ? 0.9 : 1.8;

  // Gerak perahu
  boat.x += (boat.targetX - boat.x) * 0.008;
  if (Math.abs(boat.targetX - boat.x) < 0.02) {
    boat.targetX = boat.targetX > 0.5 ? 0.25 : 0.75;
  }

  // Gerak orang
  people.forEach((p) => {
    if (p.greetTimer > 0) {
      p.greetTimer -= 1;
      return;
    }
    p.x += p.speed * p.dir;
    if (p.x > width + 30) p.x = -30;
    if (p.x < -30) p.x = width + 30;
  });

  // Redakan goyangan pohon
  trees.forEach((t) => {
    if (t.shake > 0) {
      t.shake *= 0.92;
      if (t.shake < 0.05) t.shake = 0;
    }
  });

  // Gerak kelopak
  petals.forEach((pt, i) => {
    pt.phase += 0.03;
    pt.x += wind + Math.sin(pt.phase) * 0.8;
    pt.y += pt.vy;
    if (pt.y > height + 10 || pt.x > width + 20 || pt.x < -20) {
      petals[i] = makePetal(false);
    }
  });

  // Update riak & teks
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].r += 0.5;
    ripples[i].alpha -= 0.015;
    if (ripples[i].alpha <= 0) ripples.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 0.7;
    floatingTexts[i].alpha -= 0.015;
    if (floatingTexts[i].alpha <= 0) floatingTexts.splice(i, 1);
  }
}

function loop() {
  update();
  drawScene(themes[timeIndex]);
  requestAnimationFrame(loop);
}

// Interaksi klik / sentuh di area taman
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Cek apakah mengklik pohon sakura
  const hitTree = trees.find((t) => Math.hypot(x - t.x, y - (t.y - 70)) < 55);
  if (hitTree) {
    hitTree.shake = 12;
    spawnBurst(hitTree.x, hitTree.y - 75, 32);
    floatingTexts.push({ x, y: y - 10, text: "Sakura gugur!", alpha: 1 });
    return;
  }

  // Cek apakah mengklik orang
  const hitPerson = people.find((p) => Math.hypot(x - p.x, y - (p.y - 20)) < 26);
  if (hitPerson) {
    hitPerson.greetTimer = 110;
    floatingTexts.push({ x, y: y - 16, text: "Halo!", alpha: 1 });
    return;
  }

  // Jika klik di area danau, buat riak air & arahkan perahu
  if (y >= height * 0.46 && y <= height * 0.65) {
    ripples.push({ x, y, r: 4, alpha: 0.85 });
    boat.targetX = x / width;
    floatingTexts.push({ x, y: y - 8, text: "Riak air", alpha: 1 });
    return;
  }

  // Klik di area lain menabur kelopak
  spawnBurst(x, y, 20);
});

btnTime.addEventListener("click", () => {
  timeIndex = (timeIndex + 1) % themes.length;
  btnTime.textContent = `Waktu: ${themes[timeIndex].name}`;
});

btnWind.addEventListener("click", () => {
  windLevel = (windLevel + 1) % 3;
  const labels = ["Tenang", "Sedang", "Kencang"];
  btnWind.textContent = `Angin: ${labels[windLevel]}`;
});

btnBurst.addEventListener("click", () => {
  spawnBurst(width * 0.5, height * 0.35, 45);
});

btnPause.addEventListener("click", () => {
  paused = !paused;
  btnPause.textContent = paused ? "Lanjut" : "Jeda";
});

window.addEventListener("resize", resize);
resize();
loop();
