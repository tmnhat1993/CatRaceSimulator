import {
  CAT_ASPECT,
  CAT_W,
  CAT_H,
  H,
  FINISH_PACE_BOOST,
  FINISH_RUSH_EXPONENT,
  FINISH_SLUMP_DECAY,
  FINISH_SURGE_BOOST,
  LEADER_SCREEN_X,
  RACE_VIEW_EXIT_MARGIN,
  SPEED_FACTOR_CAP,
  SPEED_FACTOR_FLOOR,
  SPEED_FACTOR_FLOOR_LEAD_PACK,
  TOP_LEAD_FLOOR_FRACTION,
  SURGE_FATIGUE_BUILD,
  SURGE_FATIGUE_DAMP,
  SURGE_FATIGUE_ESCALATION,
  SURGE_FATIGUE_RECOVERY,
  SURGE_STRAIN_CAP,
  SURGE_STRAIN_DECAY,
  SURGE_STRAIN_WEIGHT,
  NUM_SPRITES,
  RACE_SECS,
  RANK_BAR_H,
  STATES,
  TOP_PACK_RANK_COUNT,
  TOP_PACK_PACE_MULT,
  TOP_PACK_SURGE_MULT,
  TAIL_PACK_FRACTION,
  TAIL_PACK_SURGE_MULT,
  TRACK_LENGTH,
  W,
} from "../constants.js";

const ASSET_BASE = new URL("../../assets/images", import.meta.url).href.replace(/\/$/, "");

export default class CatRace {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.state = STATES.START;
    this.images = {};
    this.cats = [];
    this.numCats = 6;

    this.bgX = 0;

    this.lastT = 0;
    this.stagingT = 0;
    this.cdValue = 3;
    this.cdTimer = 0;
    this.raceElapsed = 0;
    this.winner = null;
    this.finishLine = 0;

    this.rankSlots = [];
    this.prevTopIds = [];
    this.confetti = [];
    this.finishOrder = [];
    this.simFrozen = false;
    this.freezeAnimT = 0;
    this.spriteCache = {};
    this.catH = CAT_H;
    this.catW = CAT_W;
    this.roadTop = Math.round(H * 0.63);
    this.roadH = Math.round(H * 0.35);

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.loadAssets().then(() => {
      document.getElementById("startBtn").addEventListener("click", () => this.onStart());
      this.canvas.addEventListener("click", () => {
        if (this.state === STATES.FINISHED) this.resetToStart();
      });
      requestAnimationFrame((t) => this.loop(t));
    });
  }

  async loadAssets() {
    const pairs = [
      ["mainBg", `${ASSET_BASE}/main-bg.jpg`],
      ["road", `${ASSET_BASE}/road-sprite.png`],
      ["winner", `${ASSET_BASE}/winner.png`],
      ["beginTxt", `${ASSET_BASE}/begin-txt.png`],
      ["num3", `${ASSET_BASE}/number-3.png`],
      ["num2", `${ASSET_BASE}/number-2.png`],
      ["num1", `${ASSET_BASE}/number-1.png`],
    ];
    for (let i = 1; i <= NUM_SPRITES; i++) {
      pairs.push([`cat${i}`, `${ASSET_BASE}/cat-${i}.png`]);
    }
    await Promise.all(pairs.map(([k, s]) => this.loadImg(k, s)));
  }

  loadImg(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  resize() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    this.canvas.width = W;
    this.canvas.height = H;
    this.canvas.style.width = `${W * s}px`;
    this.canvas.style.height = `${H * s}px`;
  }

  onStart() {
    const v = parseInt(document.getElementById("catCount").value, 10);
    this.numCats = Math.max(2, Math.min(300, Number.isNaN(v) ? 6 : v));
    document.getElementById("startScreen").style.display = "none";
    this.enterStaging();
  }

  resetToStart() {
    document.getElementById("startScreen").style.display = "flex";
    this.state = STATES.START;
    this.bgX = 0;
    this.winner = null;
    this.finishOrder = [];
    this.simFrozen = false;
    this.freezeAnimT = 0;
    this.cats = [];
  }

  enterStaging() {
    this.state = STATES.STAGING;
    this.bgX = 0;
    this.winner = null;
    this.finishOrder = [];
    this.simFrozen = false;
    this.freezeAnimT = 0;
    this.raceElapsed = 0;
    this.stagingT = 0;
    this.catH = CAT_H;
    this.catW = CAT_W;

    this.buildSpriteCache();

    const stageX = W * 0.01;
    const laneTop = this.roadTop + this.catH + 8;
    const laneBottom = this.roadTop + this.roadH - 8;
    const stageW = W * 0.05;
    const jostleScale = Math.min(1, this.catH / 50);
    const laneSpan = Math.max(1, laneBottom - laneTop);
    const ySlots = Array.from({ length: this.numCats }, (_, i) => {
      const ratio = (i + 0.5) / this.numCats;
      const jitter = (Math.random() - 0.5) * Math.min(10, laneSpan / Math.max(1, this.numCats));
      return laneTop + ratio * laneSpan + jitter;
    }).sort(() => Math.random() - 0.5);

    this.cats = Array.from({ length: this.numCats }, (_, i) => ({
      id: i + 1,
      sprite: Math.floor(Math.random() * NUM_SPRITES) + 1,
      worldX: stageX + Math.random() * stageW,
      y: ySlots[i],
      baseSpeed: 0,
      sineA: [0.14 + Math.random() * 0.1, 0.07 + Math.random() * 0.07],
      sineFreq: [0.1 + Math.random() * 0.13, 0.28 + Math.random() * 0.22],
      sinePhase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
      bounceFreq: 2.5 + Math.random() * 1.5,
      bounceAmp: (4 + Math.random() * 4) * Math.min(1, this.catH / 60),
      bouncePhase: Math.random() * Math.PI * 2,
      jostleFreq: 0.25 + Math.random() * 0.35,
      jostleAmp: (6 + Math.random() * 8) * jostleScale,
      jostlePhase: Math.random() * Math.PI * 2,
      tempoBias: 0.7 + Math.random() * 0.75,
      surgeA: 0.22 + Math.random() * 0.28,
      surgeFreq: 0.06 + Math.random() * 0.2,
      surgePhase: Math.random() * Math.PI * 2,
      surgeFatigue: 0,
      surgeStrain: 0,
      slumpA: 0.14 + Math.random() * 0.22,
      slumpFreq: 0.08 + Math.random() * 0.2,
      slumpPhase: Math.random() * Math.PI * 2,
      hasFinished: false,
    }));

    this.initRankSlots();
  }

  enterCountdown() {
    this.state = STATES.COUNTDOWN;
    this.cdValue = 3;
    this.cdTimer = 0;
  }

  enterRacing() {
    this.state = STATES.RACING;
    this.raceElapsed = 0;
    this.bgX = 0;
    this.finishLine = TRACK_LENGTH;

    const avgSpd = this.finishLine / RACE_SECS;
    for (const c of this.cats) {
      c.surgeFatigue = 0;
      c.surgeStrain = 0;
      c.baseSpeed = avgSpd * (0.76 + Math.random() * 0.62) * c.tempoBias;
    }
    this.initRankSlots();
  }

  buildSpriteCache() {
    this.spriteCache = {};
    for (let i = 1; i <= NUM_SPRITES; i++) {
      const img = this.images[`cat${i}`];
      if (!img) continue;
      let oc;
      let octx;
      if (typeof OffscreenCanvas !== "undefined") {
        oc = new OffscreenCanvas(this.catW, this.catH);
        octx = oc.getContext("2d");
      } else {
        oc = document.createElement("canvas");
        oc.width = this.catW;
        oc.height = this.catH;
        octx = oc.getContext("2d");
      }
      octx.drawImage(img, 0, 0, this.catW, this.catH);
      this.spriteCache[i] = oc;
    }
  }

  initRankSlots() {
    const show = Math.min(5, this.numCats);
    const slotW = 200;
    const startX = Math.round((W - show * slotW) / 2);
    const sorted = [...this.cats].sort((a, b) => b.worldX - a.worldX);

    this.rankSlots = sorted.slice(0, show).map((c, i) => ({
      catId: c.id,
      dispX: startX + i * slotW,
      targetX: startX + i * slotW,
      rank: i,
    }));
    this.prevTopIds = this.rankSlots.map((s) => s.catId);
  }

  loop(t) {
    const dt = Math.min((t - this.lastT) / 1000, 0.05);
    this.lastT = t;
    this.update(dt, t / 1000);
    this.draw(t / 1000);
    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt, t) {
    if (this.state === STATES.STAGING) {
      this.stagingT += dt;
      if (this.stagingT >= 2.5) this.enterCountdown();
    } else if (this.state === STATES.COUNTDOWN) {
      this.cdTimer += dt;
      if (this.cdTimer >= 1) {
        this.cdTimer = 0;
        this.cdValue -= 1;
        if (this.cdValue < 0) this.enterRacing();
      }
    } else if (this.state === STATES.RACING || this.state === STATES.FINISHED) {
      if (this.state === STATES.RACING) this.raceElapsed += dt;

      if (!this.simFrozen) {
        let maxX = 0;
        for (const c of this.cats) maxX = Math.max(maxX, c.worldX);
        const leadProgress = Math.min(1, maxX / this.finishLine);
        const rush = Math.pow(leadProgress, FINISH_RUSH_EXPONENT);
        const paceMult = 1 + FINISH_PACE_BOOST * rush;
        const surgeMult = 1 + FINISH_SURGE_BOOST * rush;
        const slumpMult = 1 - FINISH_SLUMP_DECAY * rush;

        const sortedByX = [...this.cats].sort((a, b) => b.worldX - a.worldX);
        const topPack = new Set(
          sortedByX.slice(0, Math.min(TOP_PACK_RANK_COUNT, sortedByX.length)).map((c) => c.id),
        );
        const leadFloorN = Math.max(
          1,
          Math.ceil(this.numCats * TOP_LEAD_FLOOR_FRACTION),
        );
        const leadFloorPack = new Set(
          sortedByX.slice(0, Math.min(leadFloorN, sortedByX.length)).map((c) => c.id),
        );
        const tailN = Math.ceil(this.numCats * TAIL_PACK_FRACTION);
        const sortedAsc = [...this.cats].sort((a, b) => a.worldX - b.worldX);
        const tailPack = new Set(
          sortedAsc.slice(0, Math.min(tailN, sortedAsc.length)).map((c) => c.id),
        );

        for (const c of this.cats) {
          const surgeSin = Math.sin(t * c.surgeFreq * Math.PI * 2 + c.surgePhase);
          if (surgeSin > 0) {
            c.surgeStrain += dt * surgeSin;
            const strainMult =
              1 + SURGE_STRAIN_WEIGHT * Math.min(c.surgeStrain, SURGE_STRAIN_CAP);
            const escalate = 1 + SURGE_FATIGUE_ESCALATION * c.surgeFatigue;
            c.surgeFatigue = Math.min(
              1,
              c.surgeFatigue + dt * SURGE_FATIGUE_BUILD * surgeSin * strainMult * escalate,
            );
          } else {
            c.surgeFatigue = Math.max(0, c.surgeFatigue - dt * SURGE_FATIGUE_RECOVERY);
            c.surgeStrain = Math.max(0, c.surgeStrain - dt * SURGE_STRAIN_DECAY);
          }
          const surgeEff = 1 - SURGE_FATIGUE_DAMP * c.surgeFatigue;
          let packSurgeMult = topPack.has(c.id) ? TOP_PACK_SURGE_MULT : 1;
          if (tailPack.has(c.id)) packSurgeMult *= TAIL_PACK_SURGE_MULT;

          let sf = 1
            + c.sineA[0] * Math.sin(t * c.sineFreq[0] * Math.PI * 2 + c.sinePhase[0])
            + c.sineA[1] * Math.sin(t * c.sineFreq[1] * Math.PI * 2 + c.sinePhase[1])
            + c.surgeA * surgeMult * surgeEff * packSurgeMult * surgeSin
            - c.slumpA * slumpMult * Math.sin(t * c.slumpFreq * Math.PI * 2 + c.slumpPhase);
          const sfFloor = leadFloorPack.has(c.id)
            ? SPEED_FACTOR_FLOOR_LEAD_PACK
            : SPEED_FACTOR_FLOOR;
          sf = Math.min(SPEED_FACTOR_CAP, Math.max(sfFloor, sf));
          const frontPace = topPack.has(c.id) ? TOP_PACK_PACE_MULT : 1;
          c.worldX += c.baseSpeed * paceMult * sf * frontPace * dt;
        }

        const newlyFinished = this.cats.filter(
          (c) => c.worldX >= this.finishLine && !c.hasFinished,
        );
        newlyFinished.sort((a, b) => b.worldX - a.worldX);
        for (const c of newlyFinished) {
          c.hasFinished = true;
          this.finishOrder.push(c);
        }

        const leader = this.cats.reduce((best, c) =>
          c.worldX > best.worldX ? c : best,
        this.cats[0]);
        const target = -(leader.worldX - LEADER_SCREEN_X);
        const nextBgX = Math.min(0, target);
        const bgClamp = LEADER_SCREEN_X - this.finishLine;
        this.bgX = Math.max(nextBgX, bgClamp);

        let minWX = Infinity;
        for (const c of this.cats) minWX = Math.min(minWX, c.worldX);
        const trailerScreenCenter = minWX + this.bgX;
        if (trailerScreenCenter + this.catW * 0.5 > W + RACE_VIEW_EXIT_MARGIN) {
          this.simFrozen = true;
          this.freezeAnimT = t;
        }

        if (this.state === STATES.RACING && !this.winner && this.finishOrder.length > 0) {
          this.winner = this.finishOrder[0];
          this.state = STATES.FINISHED;
          this.spawnConfetti();
        }
      }

      if (!this.simFrozen) this.updateRankSlots(dt);
      if (this.state === STATES.FINISHED && !this.simFrozen) this.updateConfetti(dt);
    }
  }

  updateRankSlots(dt) {
    const show = Math.min(5, this.numCats);
    const slotW = 200;
    const startX = Math.round((W - show * slotW) / 2);
    const sorted = [...this.cats].sort((a, b) => b.worldX - a.worldX);
    const topIds = sorted.slice(0, show).map((c) => c.id);

    if (topIds.some((id, i) => id !== this.prevTopIds[i])) {
      this.prevTopIds = topIds;
      this.rankSlots = topIds.map((id, i) => {
        const prev = this.rankSlots.find((s) => s.catId === id);
        return {
          catId: id,
          dispX: prev ? prev.dispX : W + 300,
          targetX: startX + i * slotW,
          rank: i,
        };
      });
    }

    for (const s of this.rankSlots) {
      s.dispX += (s.targetX - s.dispX) * Math.min(1, 7 * dt);
    }
  }

  draw(t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    this.drawBg();
    this.drawRoad();

    if (this.state !== STATES.START) {
      this.drawStartLine();
      if (this.state === STATES.RACING || this.state === STATES.FINISHED) {
        this.drawFinishLine();
      }
      this.drawCats(this.simFrozen ? this.freezeAnimT : t);
    }

    if (this.state === STATES.COUNTDOWN) this.drawCountdown(t);

    if (this.state === STATES.RACING || this.state === STATES.FINISHED) {
      this.drawRankBar();
      this.drawProgressBar();
    }

    if (this.state === STATES.FINISHED) {
      this.drawWinner();
      this.drawConfetti();
    }
  }

  drawBg() {
    if (this.images.mainBg) {
      this.ctx.drawImage(this.images.mainBg, 0, 0, W, H);
    } else {
      this.ctx.fillStyle = "#5ba3d0";
      this.ctx.fillRect(0, 0, W, H);
    }
  }

  drawRoad() {
    const ctx = this.ctx;
    const road = this.images.road;
    if (!road) return;

    const tileH = this.roadH;
    const tileW = Math.max(1, Math.ceil((road.width / road.height) * tileH));
    // Keep road movement locked to camera/line movement.
    const roadScrollX = -this.bgX;
    const offset = ((roadScrollX % tileW) + tileW) % tileW;
    let x = -offset;
    while (x < W + tileW) {
      ctx.drawImage(
        road,
        0,
        0,
        road.width,
        road.height,
        Math.round(x),
        this.roadTop,
        tileW + 4,
        tileH
      );
      x += tileW;
    }
  }

  drawVerticalLine(worldX, isFinish) {
    const ctx = this.ctx;
    const sx = Math.round(worldX + this.bgX);
    if (sx < -80 || sx > W + 80) return;

    const sq = 18;
    const cols = 3;
    const stripW = sq * cols;
    const lineTop = this.roadTop;
    const lineBottom = this.roadTop + this.roadH;
    const rows = Math.ceil((lineBottom - lineTop) / sq);

    for (let row = 0; row < rows; row += 1) {
      const topY = lineTop + row * sq;
      const botY = Math.min(lineBottom, topY + sq);

      for (let col = 0; col < cols; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#000" : "#fff";

        const leftOff = col * sq - stripW / 2;
        const rightOff = leftOff + sq;

        ctx.beginPath();
        ctx.moveTo(sx + leftOff, topY);
        ctx.lineTo(sx + rightOff, topY);
        ctx.lineTo(sx + rightOff, botY);
        ctx.lineTo(sx + leftOff, botY);
        ctx.closePath();
        ctx.fill();
      }
    }

    const labelY = lineTop - 10;
    ctx.save();
    ctx.font = "bold 14px Arial Black, Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.fillStyle = isFinish ? "#ff2222" : "#22ff22";
    const label = isFinish ? "FINISH" : "START";
    ctx.strokeText(label, sx, labelY);
    ctx.fillText(label, sx, labelY);
    ctx.restore();
  }

  drawFinishLine() {
    if (!this.finishLine) return;
    this.drawVerticalLine(this.finishLine, true);
  }

  drawStartLine() {
    this.drawVerticalLine(W * 0.09, false);
  }

  drawCats(t) {
    const ctx = this.ctx;
    const racing = this.state === STATES.RACING || this.state === STATES.FINISHED;

    const badgeR = Math.max(6, Math.round(this.catH * 0.2));
    const fontSize = Math.max(7, Math.round(this.catH * 0.225));
    ctx.font = `bold ${fontSize}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const c of this.cats) {
      const sx = this.state === STATES.STAGING || this.state === STATES.COUNTDOWN ? c.worldX : c.worldX + this.bgX;

      if (sx + this.catW < 0 || sx - this.catW > W) continue;

      const bounce = racing ? -Math.abs(Math.sin(t * c.bounceFreq * 1.6 * Math.PI + c.bouncePhase)) * c.bounceAmp : Math.sin(t * c.bounceFreq * 0.5 * Math.PI * 2 + c.bouncePhase) * c.bounceAmp * 0.55;
      const jx = racing ? Math.sin(t * c.jostleFreq * Math.PI * 2 + c.jostlePhase) * c.jostleAmp * 0.4 : 0;
      const drawX = Math.round(sx + jx - this.catW / 2);
      const drawY = Math.round(c.y + bounce - this.catH);

      const src = this.spriteCache[c.sprite] || this.images[`cat${c.sprite}`];
      if (src) ctx.drawImage(src, drawX, drawY, this.catW, this.catH);

      const lx = Math.round(drawX + this.catW * 0.5);
      const ly = Math.round(drawY + this.catH * 0.7);
      ctx.fillStyle = "rgba(0,0,60,0.80)";
      ctx.beginPath();
      ctx.arc(lx, ly, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe44d";
      ctx.fillText(String(c.id), lx, ly);
    }
    ctx.textBaseline = "alphabetic";
  }

  drawCountdown(t) {
    const ctx = this.ctx;
    const pulse = 1 + 0.05 * Math.sin(t * 9);
    const imgKey = this.cdValue === 3 ? "num3" : this.cdValue === 2 ? "num2" : this.cdValue === 1 ? "num1" : null;
    const img = imgKey ? this.images[imgKey] : null;

    if (img) {
      const scale = Math.min(220 / img.width, 280 / img.height) * pulse;
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2 - 10, iw, ih);
      ctx.restore();
    } else {
      const beginImg = this.images.beginTxt;
      if (beginImg && beginImg.complete && beginImg.naturalWidth) {
        const maxW = Math.min(W * 0.88, 560);
        const scale =
          Math.min(maxW / beginImg.width, (H * 0.22) / beginImg.height) * pulse;
        const iw = beginImg.width * scale;
        const ih = beginImg.height * scale;
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(beginImg, (W - iw) / 2, (H - ih) / 2 - 10, iw, ih);
        ctx.restore();
      } else {
        const sz = Math.round(100 * pulse);
        ctx.save();
        ctx.font = `bold ${sz}px Arial Black, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#000";
        ctx.strokeText("BEGIN!", W / 2, H / 2);
        ctx.fillStyle = "#00ee88";
        ctx.fillText("BEGIN!", W / 2, H / 2);
        ctx.textBaseline = "alphabetic";
        ctx.restore();
      }
    }
  }

  drawRankBar() {
    const ctx = this.ctx;
    const slotW = 200;
    const slotH = RANK_BAR_H - 12;
    const barY = 6;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, W, RANK_BAR_H);

    ctx.strokeStyle = "rgba(255,215,0,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, RANK_BAR_H - 1);
    ctx.lineTo(W, RANK_BAR_H - 1);
    ctx.stroke();

    const medal = ["#FFD700", "#C0C0C0", "#CD7F32", "#778899", "#778899"];

    for (const slot of this.rankSlots) {
      const x = Math.round(slot.dispX);
      const cat = this.cats.find((c) => c.id === slot.catId);
      if (!cat) continue;

      ctx.beginPath();
      ctx.roundRect(x + 3, barY, slotW - 6, slotH, 7);
      ctx.fillStyle = `${medal[slot.rank]}28`;
      ctx.fill();
      ctx.strokeStyle = `${medal[slot.rank]}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      const bx = x + 3;
      const by = barY;
      const bw = 26;
      const bh = slotH;
      const br = 7;
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
      ctx.lineTo(bx, by + br);
      ctx.arcTo(bx, by, bx + br, by, br);
      ctx.closePath();
      ctx.fillStyle = medal[slot.rank];
      ctx.fill();

      ctx.font = "bold 16px Arial Black, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = slot.rank < 3 ? "#000" : "#EEE";
      ctx.fillText(slot.rank + 1, x + 16, barY + slotH / 2);

      const img = this.images[`cat${cat.sprite}`];
      if (img) {
        const mh = slotH - 4;
        const mw = Math.round(mh * CAT_ASPECT);
        ctx.drawImage(img, x + 32, barY + 2, mw, mh);
      }

      ctx.font = "bold 15px Arial Black, Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText(`Cat #${cat.id}`, x + 95, barY + slotH / 2);
      ctx.textBaseline = "alphabetic";
    }
  }

  spawnConfetti() {
    const colors = ["#FFD700", "#FF4444", "#44AAFF", "#44FF88", "#FF88FF", "#FF8800"];
    this.confetti = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      vx: (Math.random() - 0.5) * 160,
      vy: 120 + Math.random() * 200,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 8,
      w: 8 + Math.random() * 10,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    }));
  }

  updateConfetti(dt) {
    for (const p of this.confetti) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.vy += 180 * dt;
      if (p.y > H + 20) p.alpha = Math.max(0, p.alpha - dt * 1.5);
    }
    this.confetti = this.confetti.filter((p) => p.alpha > 0);
  }

  drawConfetti() {
    const ctx = this.ctx;
    for (const p of this.confetti) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }

  drawProgressBar() {
    if (!this.cats.length) return;
    const ctx = this.ctx;
    const leader = this.cats.reduce((best, c) => (c.worldX > best.worldX ? c : best), this.cats[0]);
    const pct = Math.min(1, leader.worldX / this.finishLine);
    const bx = 60;
    const by = H - 14;
    const bw = W - 120;
    const bh = 8;
    const r = 4;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, r);
    ctx.fill();

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, "#FFD700");
    grad.addColorStop(0.7, "#FF8C00");
    grad.addColorStop(1, "#FF2200");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw * pct, bh, r);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillRect(bx + bw - 2, by - 4, 2, bh + 8);

    ctx.font = "bold 11px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${Math.round(pct * 100)}%`, bx + bw + 50, by + bh);
  }

  drawWinner() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, W, H);

    if (this.images.winner) {
      const img = this.images.winner;
      const scale = Math.min(580 / img.width, 280 / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (W - iw) / 2, H * 0.03, iw, ih);
    }

    const podium = this.finishOrder.slice(0, 3);
    if (!podium.length) return;

    const baseY = H * 0.54;

    const drawPodiumCat = (cat, cxCenter, ch, medalFill, medalStroke, medalLabel) => {
      const img = this.images[`cat${cat.sprite}`];
      const cw = Math.round(ch * CAT_ASPECT);
      const cx = Math.round(cxCenter - cw / 2);
      const top = Math.round(baseY - ch);
      if (img) ctx.drawImage(img, cx, top, cw, ch);

      ctx.font = `bold ${Math.max(22, Math.round(ch * 0.26))}px Arial Black, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(String(cat.id), cxCenter, top + ch * 0.72);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(cat.id), cxCenter, top + ch * 0.72);

      ctx.font = "bold 26px Arial Black, Arial";
      ctx.lineWidth = 4;
      ctx.strokeStyle = medalStroke;
      ctx.strokeText(medalLabel, cxCenter, baseY + 22);
      ctx.fillStyle = medalFill;
      ctx.fillText(medalLabel, cxCenter, baseY + 22);
    };

    const first = podium[0];
    const second = podium[1];
    const third = podium[2];

    if (podium.length >= 3) {
      drawPodiumCat(second, W * 0.28, 128, "#e8e8e8", "#333", "NHÌ");
      drawPodiumCat(first, W / 2, 172, "#FFD700", "#000", "NHẤT");
      drawPodiumCat(third, W * 0.72, 128, "#CD7F32", "#2a1206", "BA");
    } else if (podium.length === 2) {
      drawPodiumCat(second, W * 0.36, 138, "#e8e8e8", "#333", "NHÌ");
      drawPodiumCat(first, W * 0.58, 178, "#FFD700", "#000", "NHẤT");
    } else {
      drawPodiumCat(first, W / 2, 188, "#FFD700", "#000", "NHẤT");
    }

    const footerMsg =
      podium.length >= 3
        ? "Nhất · Nhì · Ba — chúc mừng!"
        : podium.length === 2
          ? "Nhất · Nhì — đàn vẫn đang về đích…"
          : "Nhất — đàn vẫn đang về đích…";

    ctx.font = "bold 26px Arial Black, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#000";
    ctx.strokeText(footerMsg, W / 2, H * 0.9);
    ctx.fillStyle = "#ffe866";
    ctx.fillText(footerMsg, W / 2, H * 0.9);

    ctx.font = "18px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("Click để chơi lại", W / 2, H * 0.96);
    ctx.textBaseline = "alphabetic";
  }
}
