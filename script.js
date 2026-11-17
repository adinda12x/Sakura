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
    name: "Senja Emas",
    skyTop: "#3d4673",
    skyMid: "#b86b8d",
    skyBottom: "#ffd3b6",
    sun: "rgba(255, 235, 196, 0.85)",
    mtnFar: "#636d94",
    mtnNear: "#4a656d",
    lakeTop: "#4f7d99",
    lakeBottom: "#1d384d",
    grassLight: "#6ca66d",
    grassDark: "#3a6345",
    path: "#ead7b7",
    sakuraBase: "#f7a8c4",
    sakuraLight: "#ffe6ef",
    sakuraRim: "#fff6fa",
    lanternGlow: "rgba(255, 198, 115, 0.42)",
  },
  {
    name: "Pagi Jernih",
    skyTop: "#4ea8de",
    skyMid: "#90e0ef",
    skyBottom: "#f1faee",
    sun: "rgba(255, 252, 230, 0.9)",
    mtnFar: "#7fb3c8",
    mtnNear: "#5c9478",
    lakeTop: "#48cae4",
    lakeBottom: "#1b6ca8",
    grassLight: "#7bc473",
    grassDark: "#45824d",
    path: "#f3e5c8",
    sakuraBase: "#ffbfd4",
    sakuraLight: "#fff0f6",
    sakuraRim: "#ffffff",
    lanternGlow: "rgba(255, 235, 175, 0.18)",
  },
  {
    name: "Malam Lentera",
    skyTop: "#12182d",
    skyMid: "#273359",
    skyBottom: "#4c4a78",
    sun: "rgba(235, 242, 255, 0.75)",
    mtnFar: "#27304d",
    mtnNear: "#1e2d3d",
    lakeTop: "#1f3752",
    lakeBottom: "#0c1726",
    grassLight: "#2c4f42",
    grassDark: "#193029",
    path: "#8e8277",
    sakuraBase: "#e898b8",
    sakuraLight: "#ffd6e6",
    sakuraRim: "#ffeef5",
    lanternGlow: "rgba(255, 186, 92, 0.65)",
  },
];

let trees = [];
let lanterns = [];
let people = [];
let petals = [];
let ripples = [];
let floatingNotes = [];
let boat = { x: 0.32, y: 0.53, targetX: 0.72 };

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildWorld();
}

function buildWorld() {
  const horizonY = height * 0.45;
  const lakeBottomY = height * 0.64;

  trees = Array.from({ length: 7 }, (_, i) => {
    const isFront = i % 2 === 0;
    return {
      x: width * (0.08 + i * 0.14),
      y: isFront ? lakeBottomY + 18 + (i % 3) * 16 : horizonY + 16,
      scale: isFront ? 1.12 : 0.76,
      shake: 0,
      seed: i * 1.7,
    };
  });

  lanterns = [
    { x: width * 0.22, y: lakeBottomY + 26 },
    { x: width * 0.78, y: lakeBottomY + 26 },
  ];

  people = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * width,
    y: lakeBottomY + 52 + (i % 4) * 32,
    dir: i % 2 === 0 ? 1 : -1,
    speed: 0.55 + (i % 4) * 0.18,
    phase: i * 0.9,
    scale: 0.92 + (i % 3) * 0.08,
    shirt: ["#ff8fab", "#ffd166", "#72efdd", "#a0c4ff", "#bdb2ff", "#f4a261"][i % 6],
    pants: i % 2 === 0 ? "#2b2d42" : "#3d405b",
    greetTimer: 0,
  }));

  petals = Array.from({ length: 160 }, () => createPetal(true));
}

function createPetal(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -12,
    size: 3.5 + Math.random() * 4.5,
    vy: 0.65 + Math.random() * 1.15,
    phase: Math.random() * Math.PI * 2,
    spin: Math.random() * Math.PI * 2,
    spinSpeed: (Math.random() - 0.5) * 0.05,
  };
}

function spawnBurst(x, y, count = 34) {
  for (let i = 0; i < count; i++) {
    petals.push({
      x: x + (Math.random() - 0.5) * 90,
      y: y + (Math.random() - 0.5) * 45,
      size: 3.5 + Math.random() * 4.5,
      vy: 0.55 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.06,
    });
  }
  if (petals.length > 280) {
    petals.splice(0, petals.length - 280);
  }
}

function drawWorld(theme) {
  const horizonY = height * 0.45;
  const lakeBottomY = height * 0.64;

  // Langit berlapis
  const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizonY + 3);

  // Matahari / Bulan lembut
  const sunX = width * 0.78;
  const sunY = horizonY * 0.34;
  const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 140);
  glow.addColorStop(0, theme.sun);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
  ctx.fill();

  // Pegunungan kejauhan
  ctx.fillStyle = theme.mtnFar;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= width; x += 50) {
    const y = horizonY - 26 - Math.sin(x * 0.004 + 0.5) * 20 - Math.cos(x * 0.011) * 9;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, horizonY + 8);
  ctx.lineTo(0, horizonY + 8);
  ctx.closePath();
  ctx.fill();

  // Danau & pantulan
  const lake = ctx.createLinearGradient(0, horizonY, 0, lakeBottomY);
  lake.addColorStop(0, theme.lakeTop);
  lake.addColorStop(1, theme.lakeBottom);
  ctx.fillStyle = lake;
  ctx.fillRect(0, horizonY, width, lakeBottomY - horizonY);

  // Pantulan kilau air
  ctx.strokeStyle = "rgba(255, 245, 250, 0.22)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    const ry = horizonY + 10 + ((i * 17) % Math.max(24, lakeBottomY - horizonY - 12));
    const rx = ((i * 151 + Math.sin(frame * 0.02 + i) * 24) % (width - 90)) + 45;
    const rw = 24 + (i % 4) * 16;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rw, ry);
    ctx.stroke();
  }

  // Dermaga kayu kecil ke danau
  const pierX = width * 0.5;
  ctx.fillStyle = "#8d5524";
  ctx.beginPath();
  ctx.moveTo(pierX - 24, lakeBottomY);
  ctx.lineTo(pierX + 24, lakeBottomY);
  ctx.lineTo(pierX + 34, horizonY + 42);
  ctx.lineTo(pierX - 34, horizonY + 42);
  ctx.closePath();
  ctx.fill();

  // Perahu kayu
  const bx = boat.x * width;
  const by = boat.y * height + Math.sin(frame * 0.04) * 2;
  ctx.fillStyle = "#7f4f24";
  ctx.beginPath();
  ctx.ellipse(bx, by, 26, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d4a373";
  ctx.beginPath();
  ctx.ellipse(bx, by - 1, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rumput taman & jalan setapak
  const grass = ctx.createLinearGradient(0, lakeBottomY, 0, height);
  grass.addColorStop(0, theme.grassLight);
  grass.addColorStop(1, theme.grassDark);
  ctx.fillStyle = grass;
  ctx.fillRect(0, lakeBottomY, width, height - lakeBottomY);

  ctx.fillStyle = theme.path;
  ctx.beginPath();
  ctx.moveTo(0, lakeBottomY + 14);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 56, width, lakeBottomY + 18);
  ctx.lineTo(width, lakeBottomY + 48);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 86, 0, lakeBottomY + 42);
  ctx.closePath();
  ctx.fill();

  // Riak air saat diklik
  ripples.forEach((rp) => {
    ctx.strokeStyle = `rgba(255, 245, 250, ${rp.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.r * 2, rp.r * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Lentera batu
  lanterns.forEach((l) => {
    const lg = ctx.createRadialGradient(l.x, l.y - 26, 2, l.x, l.y - 26, 48);
    lg.addColorStop(0, theme.lanternGlow);
    lg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(l.x, l.y - 26, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7c8594";
    ctx.fillRect(l.x - 6, l.y - 18, 12, 18);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(l.x - 4, l.y - 28, 8, 10);
    ctx.fillStyle = "#5c6470";
    ctx.fillRect(l.x - 9, l.y - 33, 18, 5);
  });

  // Pohon sakura berlapis (belakang lalu depan)
  trees
    .filter((t) => t.scale < 1)
    .forEach((t) => drawSakuraTree(t, theme));

  // Orang berjalan / menyapa
  people.forEach((p) => drawPerson(p));

  trees
    .filter((t) => t.scale >= 1)
    .forEach((t) => drawSakuraTree(t, theme));

  // Kelopak sakura berjatuhan
  petals.forEach((pt) => {
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.spin);
    ctx.fillStyle = theme.sakuraLight;
    ctx.beginPath();
    ctx.ellipse(0, 0, pt.size, pt.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Notifikasi reaksi klik
  floatingNotes.forEach((n) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${n.alpha})`;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(n.text, n.x - 20, n.y);
  });
}

function drawSakuraTree(tree, theme) {
  const sway = Math.sin(frame * 0.018 + tree.seed) * 3.5 + Math.sin(tree.shake) * 9;

  ctx.save();
  ctx.translate(tree.x, tree.y);
  ctx.scale(tree.scale, tree.scale);

  ctx.fillStyle = "#563d2d";
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-4, -42, -12 + sway * 0.4, -84);
  ctx.lineTo(12 + sway * 0.4, -84);
  ctx.quadraticCurveTo(4, -42, 8, 0);
  ctx.closePath();
  ctx.fill();

  const puffs = [
    { dx: -36 + sway, dy: -88, r: 36, c: theme.sakuraBase },
    { dx: 36 + sway, dy: -86, r: 36, c: theme.sakuraBase },
    { dx: sway, dy: -108, r: 46, c: theme.sakuraLight },
    { dx: -18 + sway, dy: -96, r: 38, c: theme.sakuraRim },
    { dx: 20 + sway, dy: -94, r: 38, c: theme.sakuraBase },
  ];

  puffs.forEach((p) => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawPerson(p) {
  const wave = p.greetTimer > 0 ? Math.sin(frame * 0.35) * 6 : 0;
  const step = p.greetTimer > 0 ? 0 : Math.sin(frame * 0.08 + p.phase) * 6;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.scale * p.dir, p.scale);

  // Bayangan lembut
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 1, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kaki
  ctx.strokeStyle = p.pants;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2.5, -15);
  ctx.lineTo(-2.5 + step, 0);
  ctx.moveTo(2.5, -15);
  ctx.lineTo(2.5 - step, 0);
  ctx.stroke();

  // Badan
  ctx.fillStyle = p.shirt;
  ctx.beginPath();
  ctx.roundRect(-6, -30, 12, 16, 5);
  ctx.fill();

  // Lengan melambai saat diklik
  ctx.strokeStyle = "#f4c2a1";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(6, -25);
  if (p.greetTimer > 0) {
    ctx.lineTo(13, -36 + wave);
  } else {
    ctx.lineTo(9, -15 - step * 0.5);
  }
  ctx.stroke();

  // Kepala & rambut
  ctx.fillStyle = "#f4c2a1";
  ctx.beginPath();
  ctx.arc(0, -36, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#241b1a";
  ctx.beginPath();
  ctx.arc(0, -37, 5.8, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function update() {
  if (paused) return;
  frame += 1;

  const wind = windLevel === 0 ? 0.2 : windLevel === 1 ? 0.95 : 1.9;

  boat.x += (boat.targetX - boat.x) * 0.007;
  if (Math.abs(boat.targetX - boat.x) < 0.02) {
    boat.targetX = boat.targetX > 0.5 ? 0.24 : 0.76;
  }

  people.forEach((p) => {
    if (p.greetTimer > 0) {
      p.greetTimer -= 1;
      return;
    }
    p.x += p.speed * p.dir;
    if (p.x > width + 35) p.x = -35;
    if (p.x < -35) p.x = width + 35;
  });

  trees.forEach((t) => {
    if (t.shake > 0) {
      t.shake *= 0.92;
      if (t.shake < 0.05) t.shake = 0;
    }
  });

  petals.forEach((pt, idx) => {
    pt.phase += 0.03;
    pt.spin += pt.spinSpeed;
    pt.x += wind + Math.sin(pt.phase) * 0.85;
    pt.y += pt.vy;
    if (pt.y > height + 15 || pt.x > width + 25 || pt.x < -25) {
      petals[idx] = createPetal(false);
    }
  });

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].r += 0.55;
    ripples[i].alpha -= 0.014;
    if (ripples[i].alpha <= 0) ripples.splice(i, 1);
  }

  for (let i = floatingNotes.length - 1; i >= 0; i--) {
    floatingNotes[i].y -= 0.75;
    floatingNotes[i].alpha -= 0.014;
    if (floatingNotes[i].alpha <= 0) floatingNotes.splice(i, 1);
  }
}

function loop() {
  update();
  drawWorld(themes[timeIndex]);
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hitTree = trees.find((t) => Math.hypot(x - t.x, y - (t.y - 80 * t.scale)) < 58);
  if (hitTree) {
    hitTree.shake = 12;
    spawnBurst(hitTree.x, hitTree.y - 85 * hitTree.scale, 36);
    floatingNotes.push({ x, y: y - 10, text: "Sakura gugur!", alpha: 1 });
    return;
  }

  const hitPerson = people.find((p) => Math.hypot(x - p.x, y - (p.y - 22)) < 26);
  if (hitPerson) {
    hitPerson.greetTimer = 115;
    floatingNotes.push({ x, y: y - 14, text: "Halo!", alpha: 1 });
    return;
  }

  if (y >= height * 0.45 && y <= height * 0.64) {
    ripples.push({ x, y, r: 4, alpha: 0.9 });
    boat.targetX = x / width;
    floatingNotes.push({ x, y: y - 8, text: "Riak danau", alpha: 1 });
    return;
  }

  spawnBurst(x, y, 22);
});

btnTime.addEventListener("click", () => {
  timeIndex = (timeIndex + 1) % themes.length;
  btnTime.textContent = `Suasana: ${themes[timeIndex].name}`;
});

btnWind.addEventListener("click", () => {
  windLevel = (windLevel + 1) % 3;
  const labels = ["Tenang", "Sedang", "Kencang"];
  btnWind.textContent = `Angin: ${labels[windLevel]}`;
});

btnBurst.addEventListener("click", () => {
  spawnBurst(width * 0.5, height * 0.35, 50);
});

btnPause.addEventListener("click", () => {
  paused = !paused;
  btnPause.textContent = paused ? "Lanjut" : "Jeda";
});

window.addEventListener("resize", resize);
resize();
loop();
