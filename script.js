const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

const toggleTimeBtn = document.getElementById("toggleTimeBtn");
const toggleWindBtn = document.getElementById("toggleWindBtn");
const togglePauseBtn = document.getElementById("togglePauseBtn");

let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

let isPaused = false;
let timeMode = 0; // 0: Sore Hangat, 1: Pagi Cerah, 2: Senja Lavender
let windMode = 1; // 0: Tenang, 1: Sedang, 2: Semilir Kencang

const palettes = [
  {
    name: "Sore Hangat",
    skyTop: "#6d7ba8",
    skyMid: "#e39aa8",
    skyBottom: "#ffd8be",
    sunColor: "rgba(255, 232, 196, 0.75)",
    hillFar: "#7c8d9c",
    hillNear: "#5c8369",
    waterTop: "#5f8ca3",
    waterBottom: "#2b4d63",
    grassMain: "#5c9460",
    grassLight: "#76b072",
    pathColor: "#e6d5b8",
    sakuraMain: "#f9b8cc",
    sakuraLight: "#ffe3ec",
    sakuraDeep: "#e685a6",
  },
  {
    name: "Pagi Cerah",
    skyTop: "#5aa9e6",
    skyMid: "#9bd1f9",
    skyBottom: "#eaf6ff",
    sunColor: "rgba(255, 250, 224, 0.85)",
    hillFar: "#8ab6c9",
    hillNear: "#6ea878",
    waterTop: "#4ea8de",
    waterBottom: "#1d6fa5",
    grassMain: "#66a863",
    grassLight: "#85c779",
    pathColor: "#efe2c8",
    sakuraMain: "#ffc2d4",
    sakuraLight: "#fff0f5",
    sakuraDeep: "#f08cae",
  },
  {
    name: "Senja Lavender",
    skyTop: "#3d3b6b",
    skyMid: "#8c689c",
    skyBottom: "#f3b5b5",
    sunColor: "rgba(255, 204, 188, 0.65)",
    hillFar: "#574f7d",
    hillNear: "#455d63",
    waterTop: "#445c7d",
    waterBottom: "#212e47",
    grassMain: "#466b5c",
    grassLight: "#5d8772",
    pathColor: "#d6bfa8",
    sakuraMain: "#f7a8c4",
    sakuraLight: "#ffdce8",
    sakuraDeep: "#d96b94",
  },
];

const clothesPalette = [
  "#ff8fab",
  "#72efdd",
  "#ffd166",
  "#a0c4ff",
  "#bdb2ff",
  "#f4a261",
  "#90be6d",
  "#f28482",
];

let petals = [];
let people = [];
let trees = [];
let benches = [];
let picnicSpots = [];
let ripples = [];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildEnvironment();
}

function buildEnvironment() {
  const horizonY = height * 0.46;
  const lakeBottomY = height * 0.66;

  // Pohon-pohon sakura di sepanjang tepi danau
  trees = [];
  const treeCount = Math.max(6, Math.floor(width / 170));
  for (let i = 0; i < treeCount; i++) {
    const x = (width / treeCount) * i + (width / treeCount) * 0.5 + (Math.random() - 0.5) * 60;
    const isForeground = i % 2 === 0;
    const y = isForeground ? horizonY + height * 0.14 + Math.random() * 45 : horizonY - 12 + Math.random() * 25;
    const scale = isForeground ? 1.05 + Math.random() * 0.3 : 0.72 + Math.random() * 0.2;
    trees.push({ x, y, scale, swayOffset: Math.random() * Math.PI * 2 });
  }

  // Bangku taman tepi danau
  benches = [];
  const benchCount = Math.max(3, Math.floor(width / 340));
  for (let i = 0; i < benchCount; i++) {
    benches.push({
      x: width * (0.16 + i * (0.68 / Math.max(1, benchCount - 1))),
      y: lakeBottomY + 26 + (i % 2) * 18,
    });
  }

  // Tikar piknik di rumput
  picnicSpots = [
    { x: width * 0.24, y: height * 0.81, color: "#ff758f" },
    { x: width * 0.74, y: height * 0.79, color: "#56cfe1" },
  ];

  // Orang-orang berjalan, duduk di bangku, dan piknik
  people = [];
  const walkerCount = Math.max(8, Math.floor(width / 130));
  for (let i = 0; i < walkerCount; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    people.push({
      role: "walker",
      x: Math.random() * width,
      y: lakeBottomY + 42 + Math.random() * (height * 0.16),
      speed: (0.45 + Math.random() * 0.55) * dir,
      dir,
      phase: Math.random() * Math.PI * 2,
      scale: 0.88 + Math.random() * 0.24,
      shirt: clothesPalette[i % clothesPalette.length],
      pants: i % 3 === 0 ? "#3d405b" : "#2b2d42",
      hasBag: i % 3 === 0,
    });
  }

  // Orang duduk di bangku taman
  benches.forEach((b, idx) => {
    people.push({
      role: "sitting",
      x: b.x - 14,
      y: b.y - 6,
      dir: 1,
      phase: idx * 1.4,
      scale: 0.95,
      shirt: clothesPalette[(idx + 2) % clothesPalette.length],
      pants: "#2b2d42",
    });
    if (idx % 2 === 0) {
      people.push({
        role: "sitting",
        x: b.x + 14,
        y: b.y - 6,
        dir: -1,
        phase: idx * 1.9 + 1,
        scale: 0.95,
        shirt: clothesPalette[(idx + 4) % clothesPalette.length],
        pants: "#4a4e69",
      });
    }
  });

  // Orang santai di tikar piknik
  picnicSpots.forEach((spot, idx) => {
    people.push({
      role: "picnic",
      x: spot.x - 18,
      y: spot.y - 2,
      dir: 1,
      phase: idx * 2.1,
      scale: 0.95,
      shirt: clothesPalette[(idx + 1) % clothesPalette.length],
      pants: "#3d405b",
    });
    people.push({
      role: "picnic",
      x: spot.x + 20,
      y: spot.y + 3,
      dir: -1,
      phase: idx * 2.7,
      scale: 0.95,
      shirt: clothesPalette[(idx + 5) % clothesPalette.length],
      pants: "#2b2d42",
    });
  });

  // Kelopak bunga sakura
  const petalCount = Math.min(180, Math.floor(width * 0.14));
  petals = Array.from({ length: petalCount }, () => createPetal(true));
}

function createPetal(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -15 - Math.random() * 60,
    size: 4 + Math.random() * 5.5,
    speedY: 0.7 + Math.random() * 1.35,
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: 0.015 + Math.random() * 0.025,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.05,
    tone: Math.random(),
  };
}

function drawSkyAndLake(palette, time) {
  const horizonY = height * 0.46;
  const lakeBottomY = height * 0.66;

  // Langit
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(0.55, palette.skyMid);
  skyGrad.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY + 4);

  // Matahari lembut
  const sunX = width * 0.76;
  const sunY = horizonY * 0.36;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
  sunGlow.addColorStop(0, palette.sunColor);
  sunGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
  ctx.fill();

  // Bukit kejauhan
  ctx.fillStyle = palette.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= width; x += 60) {
    const y = horizonY - 22 - Math.sin(x * 0.004 + 0.8) * 18 - Math.cos(x * 0.01) * 8;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, horizonY + 10);
  ctx.lineTo(0, horizonY + 10);
  ctx.closePath();
  ctx.fill();

  // Danau
  const lakeGrad = ctx.createLinearGradient(0, horizonY, 0, lakeBottomY);
  lakeGrad.addColorStop(0, palette.waterTop);
  lakeGrad.addColorStop(1, palette.waterBottom);
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, horizonY, width, lakeBottomY - horizonY);

  // Pantulan kilau cahaya & kelopak di permukaan danau
  ctx.save();
  ctx.strokeStyle = "rgba(255, 245, 250, 0.24)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) {
    const ry = horizonY + 10 + ((i * 19) % Math.max(30, lakeBottomY - horizonY - 14));
    const rx = ((i * 137 + Math.sin(time * 0.015 + i) * 28) % (width - 80)) + 40;
    const rw = 24 + (i % 5) * 14;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rw, ry);
    ctx.stroke();
  }
  ctx.restore();

  // Area taman rumput depan danau
  const grassGrad = ctx.createLinearGradient(0, lakeBottomY, 0, height);
  grassGrad.addColorStop(0, palette.grassLight);
  grassGrad.addColorStop(0.35, palette.grassMain);
  grassGrad.addColorStop(1, "#3b6643");
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, lakeBottomY, width, height - lakeBottomY);

  // Jalan setapak melengkung di tepi danau
  ctx.fillStyle = palette.pathColor;
  ctx.beginPath();
  ctx.moveTo(0, lakeBottomY + 10);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 46, width, lakeBottomY + 14);
  ctx.lineTo(width, lakeBottomY + 46);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 80, 0, lakeBottomY + 42);
  ctx.closePath();
  ctx.fill();
}

function drawSakuraTree(tree, palette, time) {
  const { x, y, scale, swayOffset } = tree;
  const sway = Math.sin(time * 0.015 + swayOffset) * (3 + windMode * 2.5);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Batang pohon
  ctx.fillStyle = "#5c4033";
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-6, -45, -18 + sway * 0.4, -95);
  ctx.lineTo(14 + sway * 0.4, -95);
  ctx.quadraticCurveTo(6, -45, 10, 0);
  ctx.closePath();
  ctx.fill();

  // Cabang
  ctx.strokeStyle = "#5c4033";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4 + sway * 0.3, -72);
  ctx.quadraticCurveTo(-38, -92, -62 + sway * 0.7, -86);
  ctx.moveTo(4 + sway * 0.3, -78);
  ctx.quadraticCurveTo(36, -100, 64 + sway * 0.7, -90);
  ctx.stroke();

  // Tajuk bunga sakura berlapis
  const puffs = [
    { dx: -48 + sway, dy: -96, r: 38, c: palette.sakuraMain },
    { dx: 48 + sway, dy: -98, r: 40, c: palette.sakuraMain },
    { dx: 0 + sway * 1.1, dy: -116, r: 50, c: palette.sakuraLight },
    { dx: -26 + sway, dy: -108, r: 42, c: palette.sakuraDeep },
    { dx: 28 + sway, dy: -106, r: 42, c: palette.sakuraMain },
    { dx: 0 + sway, dy: -92, r: 36, c: palette.sakuraLight },
  ];

  puffs.forEach((p) => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawBench(bench) {
  const { x, y } = bench;
  ctx.save();
  ctx.translate(x, y);

  // Kaki bangku
  ctx.fillStyle = "#3a3a40";
  ctx.fillRect(-26, -4, 5, 16);
  ctx.fillRect(21, -4, 5, 16);

  // Dudukan & sandaran kayu
  ctx.fillStyle = "#a4633e";
  ctx.fillRect(-32, -8, 64, 6);
  ctx.fillRect(-32, -20, 64, 5);

  ctx.restore();
}

function drawPicnic(spot) {
  const { x, y, color } = spot;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPerson(person, time) {
  const { role, x, y, dir, phase, scale, shirt, pants } = person;
  const walkCycle = Math.sin(time * 0.08 + phase);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * dir, scale);

  // Bayangan di tanah
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (role === "walker") {
    // Kaki melangkah
    ctx.strokeStyle = pants;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-2, -16);
    ctx.lineTo(-2 + walkCycle * 7, -2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, -16);
    ctx.lineTo(2 - walkCycle * 7, -2);
    ctx.stroke();

    // Badan
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-6, -32, 12, 17, 5);
    ctx.fill();

    // Kepala
    ctx.fillStyle = "#f4c2a1";
    ctx.beginPath();
    ctx.arc(0, -39, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rambut
    ctx.fillStyle = "#2b2120";
    ctx.beginPath();
    ctx.arc(0, -40, 6.2, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (role === "sitting") {
    // Duduk di bangku
    ctx.strokeStyle = pants;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(9, -14);
    ctx.lineTo(9, -2);
    ctx.stroke();

    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-6, -28, 12, 15, 5);
    ctx.fill();

    ctx.fillStyle = "#f4c2a1";
    ctx.beginPath();
    ctx.arc(1, -35, 5.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2b2120";
    ctx.beginPath();
    ctx.arc(1, -36, 6, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    // Santai di tikar piknik
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.ellipse(0, -10, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4c2a1";
    ctx.beginPath();
    ctx.arc(6, -17, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2b2120";
    ctx.beginPath();
    ctx.arc(6, -18, 5.7, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPetal(petal, palette) {
  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);

  ctx.fillStyle =
    petal.tone < 0.35
      ? palette.sakuraLight
      : petal.tone < 0.75
      ? palette.sakuraMain
      : palette.sakuraDeep;

  ctx.beginPath();
  ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

let frame = 0;

function update() {
  if (isPaused) return;
  frame += 1;

  const windForce = windMode === 0 ? 0.25 : windMode === 1 ? 0.85 : 1.75;
  const lakeBottomY = height * 0.66;

  // Update orang berjalan
  people.forEach((p) => {
    if (p.role === "walker") {
      p.x += p.speed;
      if (p.x > width + 40) p.x = -40;
      if (p.x < -40) p.x = width + 40;
    }
  });

  // Update kelopak bunga sakura
  petals.forEach((petal, idx) => {
    petal.driftPhase += petal.driftSpeed;
    petal.x += windForce + Math.sin(petal.driftPhase) * 0.9;
    petal.y += petal.speedY;
    petal.rotation += petal.rotSpeed;

    // Riak kecil saat kelopak menyentuh permukaan danau
    if (
      petal.y > height * 0.46 &&
      petal.y < lakeBottomY &&
      Math.random() < 0.015 &&
      ripples.length < 40
    ) {
      ripples.push({ x: petal.x, y: petal.y, r: 2, alpha: 0.55 });
    }

    if (petal.y > height + 20 || petal.x > width + 30 || petal.x < -30) {
      petals[idx] = createPetal(false);
    }
  });

  // Update riak air
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].r += 0.35;
    ripples[i].alpha -= 0.012;
    if (ripples[i].alpha <= 0) ripples.splice(i, 1);
  }
}

function render() {
  const palette = palettes[timeMode];

  ctx.clearRect(0, 0, width, height);
  drawSkyAndLake(palette, frame);

  // Riak air danau
  ripples.forEach((rp) => {
    ctx.strokeStyle = `rgba(255, 240, 246, ${rp.alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.r * 1.8, rp.r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Pohon sakura lapisan belakang
  trees
    .filter((t) => t.scale < 1)
    .forEach((tree) => drawSakuraTree(tree, palette, frame));

  // Tikar piknik & bangku
  picnicSpots.forEach(drawPicnic);
  benches.forEach(drawBench);

  // Urutkan orang berdasarkan posisi Y agar perspektif kedalaman rapi
  const sortedPeople = [...people].sort((a, b) => a.y - b.y);
  sortedPeople.forEach((person) => drawPerson(person, frame));

  // Pohon sakura lapisan depan
  trees
    .filter((t) => t.scale >= 1)
    .forEach((tree) => drawSakuraTree(tree, palette, frame));

  // Kelopak bunga sakura yang berjatuhan
  petals.forEach((petal) => drawPetal(petal, palette));
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// Kontrol tombol
toggleTimeBtn.addEventListener("click", () => {
  timeMode = (timeMode + 1) % palettes.length;
  toggleTimeBtn.textContent = `Suasana: ${palettes[timeMode].name}`;
});

toggleWindBtn.addEventListener("click", () => {
  windMode = (windMode + 1) % 3;
  const labels = ["Tenang", "Sedang", "Semilir Kencang"];
  toggleWindBtn.textContent = `Angin: ${labels[windMode]}`;
});

togglePauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  togglePauseBtn.textContent = isPaused ? "Lanjutkan Animasi" : "Jeda Animasi";
});

window.addEventListener("resize", resize);

resize();
loop();
