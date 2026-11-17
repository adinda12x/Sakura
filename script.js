const canvas = document.getElementById("parkCanvas");
const ctx = canvas.getContext("2d");

const btnTime = document.getElementById("btnTime");
const btnWind = document.getElementById("btnWind");
const btnBurst = document.getElementById("btnBurst");
const btnPause = document.getElementById("btnPause");
const lightingTag = document.getElementById("lightingTag");
const lightingDesc = document.getElementById("lightingDesc");

let width = 0;
let height = 0;
let paused = false;
let timeIndex = 0; // 0: Pagi, 1: Sore, 2: Malam
let windLevel = 1;
let frame = 0;

// Setiap waktu memakai sumber cahaya, arah bayangan, rim light, dan warna shading yang berbeda
const timeProfiles = [
  {
    name: "Pagi",
    tag: "Pagi · Cahaya Samping Kiri",
    desc: "Sinar pagi segar dari kiri atas, bayangan panjang ke kanan, embun di permukaan danau.",
    skyTop: "#4ea8de",
    skyMid: "#9be2fe",
    skyBottom: "#f4fbfd",
    lightPos: [0.18, 0.16],
    lightColor: "rgba(255, 251, 224, 0.88)",
    shadowDir: [1.35, 0.32],
    shadowAlpha: 0.18,
    lakeTop: "#52b6d8",
    lakeBottom: "#1e6f9f",
    lakeSheen: "rgba(255, 255, 255, 0.34)",
    grassLit: "#82cc78",
    grassShade: "#4b8c58",
    pathColor: "#f3e5c8",
    sakuraLit: "#fff2f7",
    sakuraMid: "#ffc2d6",
    sakuraShadow: "#d982a3",
    stamenColor: "#c93b6b",
    lanternLit: false,
    vignetteAlpha: 0.08,
  },
  {
    name: "Sore",
    tag: "Sore · Golden Hour Samping Kanan",
    desc: "Cahaya keemasan rendah dari kanan, rim light hangat pada kelopak sakura dan pantulan jingga.",
    skyTop: "#3d4675",
    skyMid: "#c96a7b",
    skyBottom: "#ffd09b",
    lightPos: [0.84, 0.25],
    lightColor: "rgba(255, 202, 134, 0.9)",
    shadowDir: [-1.55, 0.38],
    shadowAlpha: 0.26,
    lakeTop: "#7a6d96",
    lakeBottom: "#253452",
    lakeSheen: "rgba(255, 196, 130, 0.42)",
    grassLit: "#9a8f58",
    grassShade: "#3d5947",
    pathColor: "#e6c69c",
    sakuraLit: "#ffe8c2",
    sakuraMid: "#f49bb8",
    sakuraShadow: "#9e4d73",
    stamenColor: "#b8295a",
    lanternLit: true,
    vignetteAlpha: 0.22,
  },
  {
    name: "Malam",
    tag: "Malam · Bulan & Lentera Hangat",
    desc: "Kontras gelap-terang dengan cahaya bulan dingin dari atas dan halo hangat dari lentera taman.",
    skyTop: "#0b1024",
    skyMid: "#1b2749",
    skyBottom: "#2e3c68",
    lightPos: [0.5, 0.13],
    lightColor: "rgba(198, 222, 255, 0.72)",
    shadowDir: [0.25, 0.22],
    shadowAlpha: 0.36,
    lakeTop: "#1b3354",
    lakeBottom: "#0a1424",
    lakeSheen: "rgba(186, 214, 255, 0.25)",
    grassLit: "#2f574b",
    grassShade: "#142623",
    pathColor: "#7e788a",
    sakuraLit: "#ffd9e8",
    sakuraMid: "#b87494",
    sakuraShadow: "#59334d",
    stamenColor: "#ff9ebb",
    lanternLit: true,
    vignetteAlpha: 0.45,
  },
];

let trees = [];
let blossoms = []; // bunga sakura 5 kelopak nyata di tajuk
let lanterns = [];
let people = [];
let petals = [];
let ripples = [];
let notes = [];
let boat = { x: 0.3, y: 0.53, targetX: 0.72 };

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildScene();
}

function buildScene() {
  const horizonY = height * 0.44;
  const lakeBottomY = height * 0.63;

  trees = Array.from({ length: 6 }, (_, i) => {
    const isFront = i % 2 === 0;
    return {
      x: width * (0.1 + i * 0.16),
      y: isFront ? lakeBottomY + 20 + (i % 2) * 14 : horizonY + 14,
      scale: isFront ? 1.12 : 0.76,
      shake: 0,
      seed: i * 2.1,
    };
  });

  // Sebarkan kuntum bunga sakura 5-kelopak di sekitar tajuk pohon
  blossoms = [];
  trees.forEach((t, tIdx) => {
    const count = Math.round(26 * t.scale);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + tIdx;
      const dist = (0.25 + ((i * 37) % 75) / 100) * 44 * t.scale;
      blossoms.push({
        treeIndex: tIdx,
        ox: Math.cos(angle) * dist,
        oy: -90 * t.scale + Math.sin(angle) * dist * 0.62,
        size: (5.5 + (i % 4) * 1.4) * t.scale,
        rot: (i * 1.1) % (Math.PI * 2),
        litBias: Math.cos(angle),
      });
    }
  });

  lanterns = [
    { x: width * 0.2, y: lakeBottomY + 24 },
    { x: width * 0.5, y: lakeBottomY + 12 },
    { x: width * 0.8, y: lakeBottomY + 24 },
  ];

  people = Array.from({ length: 11 }, (_, i) => ({
    x: Math.random() * width,
    y: lakeBottomY + 54 + (i % 4) * 32,
    dir: i % 2 === 0 ? 1 : -1,
    speed: 0.55 + (i % 3) * 0.2,
    phase: i * 0.85,
    scale: 0.92 + (i % 3) * 0.08,
    shirt: ["#ff8fab", "#ffd166", "#72efdd", "#a0c4ff", "#bdb2ff", "#f4a261"][i % 6],
    pants: i % 2 === 0 ? "#25283b" : "#3a3e59",
    greetTimer: 0,
  }));

  petals = Array.from({ length: 150 }, () => createPetal(true));
}

function createPetal(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -12,
    size: 4 + Math.random() * 4.5,
    vy: 0.65 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    tumble: Math.random() * Math.PI * 2,
    tumbleSpeed: 0.04 + Math.random() * 0.05,
    yaw: Math.random() * Math.PI * 2,
  };
}

function spawnBurst(x, y, count = 34) {
  for (let i = 0; i < count; i++) {
    petals.push({
      x: x + (Math.random() - 0.5) * 90,
      y: y + (Math.random() - 0.5) * 45,
      size: 4.2 + Math.random() * 4.5,
      vy: 0.55 + Math.random() * 1.25,
      phase: Math.random() * Math.PI * 2,
      tumble: Math.random() * Math.PI * 2,
      tumbleSpeed: 0.05 + Math.random() * 0.05,
      yaw: Math.random() * Math.PI * 2,
    });
  }
  if (petals.length > 270) {
    petals.splice(0, petals.length - 270);
  }
}

// Gambar 1 kuntum bunga sakura 5 kelopak berlekuk V + benang sari
function drawSakuraBlossom(x, y, size, rot, profile, litFactor = 0.5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  const petalColor =
    litFactor > 0.35
      ? profile.sakuraLit
      : litFactor > -0.25
      ? profile.sakuraMid
      : profile.sakuraShadow;

  for (let p = 0; p < 5; p++) {
    ctx.save();
    ctx.rotate((p * Math.PI * 2) / 5);

    ctx.fillStyle = petalColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Lobus kiri berlekuk V di ujung kelopak
    ctx.bezierCurveTo(-size * 0.55, -size * 0.25, -size * 0.65, -size * 0.95, -size * 0.14, -size * 1.05);
    ctx.lineTo(0, -size * 0.82);
    // Lobus kanan berlekuk V
    ctx.lineTo(size * 0.14, -size * 1.05);
    ctx.bezierCurveTo(size * 0.65, -size * 0.95, size * 0.55, -size * 0.25, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Pusat bunga & benang sari halus
  ctx.fillStyle = profile.stamenColor;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = profile.stamenColor;
  ctx.lineWidth = 0.9;
  for (let s = 0; s < 5; s++) {
    const a = (s * Math.PI * 2) / 5 + 0.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size * 0.36, Math.sin(a) * size * 0.36);
    ctx.stroke();
  }

  ctx.restore();
}

// Gambar kelopak jatuh dengan efek 3D-foreshortened (memutar & menyempit saat melayang)
function drawFallingPetal(pt, profile) {
  const foreshorten = 0.28 + Math.abs(Math.cos(pt.tumble)) * 0.72;
  ctx.save();
  ctx.translate(pt.x, pt.y);
  ctx.rotate(pt.yaw);
  ctx.scale(1, foreshorten);

  ctx.fillStyle = Math.sin(pt.tumble) > 0 ? profile.sakuraLit : profile.sakuraMid;
  ctx.beginPath();
  ctx.moveTo(0, -pt.size * 0.45);
  ctx.bezierCurveTo(pt.size * 0.55, -pt.size * 0.55, pt.size * 0.65, pt.size * 0.25, pt.size * 0.15, pt.size * 0.5);
  ctx.lineTo(0, pt.size * 0.28);
  ctx.lineTo(-pt.size * 0.15, pt.size * 0.5);
  ctx.bezierCurveTo(-pt.size * 0.65, pt.size * 0.25, -pt.size * 0.55, -pt.size * 0.55, 0, -pt.size * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawWorld(profile) {
  const horizonY = height * 0.44;
  const lakeBottomY = height * 0.63;
  const lightX = width * profile.lightPos[0];
  const lightY = height * profile.lightPos[1];

  // 1. Langit & sumber cahaya khas waktu
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, profile.skyTop);
  skyGrad.addColorStop(0.55, profile.skyMid);
  skyGrad.addColorStop(1, profile.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY + 3);

  const sunGlow = ctx.createRadialGradient(lightX, lightY, 6, lightX, lightY, 170);
  sunGlow.addColorStop(0, profile.lightColor);
  sunGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(lightX, lightY, 170, 0, Math.PI * 2);
  ctx.fill();

  // 2. Danau & pantulan cahaya
  const lakeGrad = ctx.createLinearGradient(0, horizonY, 0, lakeBottomY);
  lakeGrad.addColorStop(0, profile.lakeTop);
  lakeGrad.addColorStop(1, profile.lakeBottom);
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, horizonY, width, lakeBottomY - horizonY);

  // Kolom pantulan matahari/bulan di air
  const sheenGrad = ctx.createLinearGradient(lightX, horizonY, lightX, lakeBottomY);
  sheenGrad.addColorStop(0, profile.lakeSheen);
  sheenGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(lightX - 42, horizonY, 84, lakeBottomY - horizonY);

  // Perahu kecil
  const bx = boat.x * width;
  const by = boat.y * height + Math.sin(frame * 0.04) * 2;
  ctx.fillStyle = "#6e4220";
  ctx.beginPath();
  ctx.ellipse(bx, by, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rumput taman dengan shading terang-gelap sesuai arah cahaya
  const grassGrad = ctx.createLinearGradient(
    profile.lightPos[0] * width,
    lakeBottomY,
    (1 - profile.lightPos[0]) * width,
    height
  );
  grassGrad.addColorStop(0, profile.grassLit);
  grassGrad.addColorStop(1, profile.grassShade);
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, lakeBottomY, width, height - lakeBottomY);

  // Jalan setapak
  ctx.fillStyle = profile.pathColor;
  ctx.beginPath();
  ctx.moveTo(0, lakeBottomY + 14);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 54, width, lakeBottomY + 18);
  ctx.lineTo(width, lakeBottomY + 46);
  ctx.quadraticCurveTo(width * 0.5, lakeBottomY + 84, 0, lakeBottomY + 42);
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

  // 4. Lentera taman (menyala hangat di Sore & Malam)
  lanterns.forEach((l) => {
    if (profile.lanternLit) {
      const glowR = timeIndex === 2 ? 78 : 42;
      const halo = ctx.createRadialGradient(l.x, l.y - 24, 2, l.x, l.y - 24, glowR);
      halo.addColorStop(0, "rgba(255, 196, 107, 0.72)");
      halo.addColorStop(1, "rgba(255, 196, 107, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(l.x, l.y - 24, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#697180";
    ctx.fillRect(l.x - 5, l.y - 16, 10, 16);
    ctx.fillStyle = profile.lanternLit ? "#ffe099" : "#cfd6e0";
    ctx.fillRect(l.x - 4, l.y - 26, 8, 10);
  });

  // 5. Pohon sakura & kuntum 5 kelopak
  trees.forEach((t, idx) => {
    const sway = Math.sin(frame * 0.018 + t.seed) * 3.5 + Math.sin(t.shake) * 9;

    // Bayangan di tanah sesuai shadowDir tiap waktu
    ctx.fillStyle = `rgba(10, 14, 24, ${profile.shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      t.x + profile.shadowDir[0] * 26 * t.scale,
      t.y + 4,
      36 * t.scale,
      9 * t.scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Batang pohon
    ctx.fillStyle = timeIndex === 2 ? "#2c2229" : "#563d2d";
    ctx.beginPath();
    ctx.moveTo(t.x - 7 * t.scale, t.y);
    ctx.quadraticCurveTo(t.x - 3, t.y - 42 * t.scale, t.x - 11 * t.scale + sway * 0.4, t.y - 82 * t.scale);
    ctx.lineTo(t.x + 11 * t.scale + sway * 0.4, t.y - 82 * t.scale);
    ctx.quadraticCurveTo(t.x + 3, t.y - 42 * t.scale, t.x + 7 * t.scale, t.y);
    ctx.closePath();
    ctx.fill();

    // Tajuk ber-shading
    const puffs = [
      { dx: -32 * t.scale + sway, dy: -84 * t.scale, r: 34 * t.scale, c: profile.sakuraMid },
      { dx: 32 * t.scale + sway, dy: -82 * t.scale, r: 34 * t.scale, c: profile.sakuraShadow },
      { dx: sway, dy: -102 * t.scale, r: 42 * t.scale, c: profile.sakuraLit },
    ];
    puffs.forEach((p) => {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(t.x + p.dx, t.y + p.dy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Kuntum bunga sakura 5-kelopak nyata
    blossoms
      .filter((b) => b.treeIndex === idx)
      .forEach((b) => {
        const sideFactor = (b.ox / 45) * (lightX < t.x ? -1 : 1);
        drawSakuraBlossom(
          t.x + b.ox + sway,
          t.y + b.oy,
          b.size,
          b.rot + sway * 0.02,
          profile,
          sideFactor
        );
      });
  });

  // 6. Orang berjalan / menyapa + bayangan arah cahaya
  people.forEach((p) => {
    const wave = p.greetTimer > 0 ? Math.sin(frame * 0.35) * 6 : 0;
    const step = p.greetTimer > 0 ? 0 : Math.sin(frame * 0.08 + p.phase) * 6;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Bayangan orang
    ctx.fillStyle = `rgba(10, 14, 24, ${profile.shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(profile.shadowDir[0] * 14, 2, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(p.scale * p.dir, p.scale);

    ctx.strokeStyle = p.pants;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2.5, -15);
    ctx.lineTo(-2.5 + step, 0);
    ctx.moveTo(2.5, -15);
    ctx.lineTo(2.5 - step, 0);
    ctx.stroke();

    ctx.fillStyle = p.shirt;
    ctx.beginPath();
    ctx.roundRect(-6, -30, 12, 16, 5);
    ctx.fill();

    ctx.strokeStyle = "#f4c2a1";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(6, -25);
    ctx.lineTo(p.greetTimer > 0 ? 13 : 9, p.greetTimer > 0 ? -36 + wave : -15 - step * 0.5);
    ctx.stroke();

    ctx.fillStyle = "#f4c2a1";
    ctx.beginPath();
    ctx.arc(0, -36, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#231918";
    ctx.beginPath();
    ctx.arc(0, -37, 5.8, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // 7. Kelopak sakura berjatuhan (3D-foreshortened)
  petals.forEach((pt) => drawFallingPetal(pt, profile));

  // 8. Vignette atmosferik per waktu
  const vig = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.25,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, `rgba(5, 8, 18, ${profile.vignetteAlpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // Notifikasi klik
  notes.forEach((n) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${n.alpha})`;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(n.text, n.x - 20, n.y);
  });
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
    pt.tumble += pt.tumbleSpeed;
    pt.yaw += 0.015;
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

  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y -= 0.75;
    notes[i].alpha -= 0.014;
    if (notes[i].alpha <= 0) notes.splice(i, 1);
  }
}

function loop() {
  update();
  drawWorld(timeProfiles[timeIndex]);
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hitTree = trees.find((t) => Math.hypot(x - t.x, y - (t.y - 80 * t.scale)) < 60);
  if (hitTree) {
    hitTree.shake = 12;
    spawnBurst(hitTree.x, hitTree.y - 85 * hitTree.scale, 38);
    notes.push({ x, y: y - 10, text: "Sakura gugur!", alpha: 1 });
    return;
  }

  const hitPerson = people.find((p) => Math.hypot(x - p.x, y - (p.y - 22)) < 26);
  if (hitPerson) {
    hitPerson.greetTimer = 115;
    notes.push({ x, y: y - 14, text: "Halo!", alpha: 1 });
    return;
  }

  if (y >= height * 0.44 && y <= height * 0.63) {
    ripples.push({ x, y, r: 4, alpha: 0.9 });
    boat.targetX = x / width;
    notes.push({ x, y: y - 8, text: "Riak danau", alpha: 1 });
    return;
  }

  spawnBurst(x, y, 24);
});

btnTime.addEventListener("click", () => {
  timeIndex = (timeIndex + 1) % timeProfiles.length;
  const prof = timeProfiles[timeIndex];
  btnTime.textContent = `Waktu: ${prof.name}`;
  lightingTag.textContent = prof.tag;
  lightingDesc.textContent = prof.desc;
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
