export const TOWER = {
  wallFrac: 0.24,
  rungHeight: 58,
};

export const ICE_COLORS = {
  skyTop: "#0f1a2e",
  skyBottom: "#4fb3e8",
  wallFill: "#bfe4ff",
  wallShade: "#7fb8e0",
  wallEdge: "#3d6f96",
  wallHighlight: "#eaf7ff",
  spike: "#eaf7ff",
  spikeEdge: "#7fb8e0",
  charBody: "#7c5cff",
  charCap: "#4fd1e8",
  charSkin: "#fbead2",
  snow: "rgba(255,255,255,0.85)",
};

export function drawIceBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camY: number
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, ICE_COLORS.skyTop);
  sky.addColorStop(1, ICE_COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 26; i++) {
    const sx = (i * 137 + 41) % Math.max(1, w);
    const sy = (i * 211 + camY * 0.3) % (h + 40);
    const r = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(sx, ((sy % (h + 40)) + h + 40) % (h + 40) - 20, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawIceWalls(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camY: number
) {
  const wallW = w * TOWER.wallFrac;
  const brickH = 26;
  const offset = ((camY % brickH) + brickH) % brickH;

  [0, w - wallW].forEach((wx, side) => {
    ctx.fillStyle = ICE_COLORS.wallFill;
    ctx.fillRect(wx, 0, wallW, h);

    ctx.strokeStyle = ICE_COLORS.wallEdge;
    ctx.lineWidth = 2;
    for (let y = -brickH; y < h + brickH; y += brickH) {
      const yy = y + offset;
      ctx.beginPath();
      ctx.moveTo(wx, yy);
      ctx.lineTo(wx + wallW, yy);
      ctx.stroke();
      const rowIndex = Math.floor((yy - offset) / brickH);
      const brickOffsetX = rowIndex % 2 === 0 ? 0 : wallW / 2;
      ctx.beginPath();
      ctx.moveTo(wx + ((brickOffsetX + wallW / 2) % wallW), yy);
      ctx.lineTo(wx + ((brickOffsetX + wallW / 2) % wallW), yy + brickH);
      ctx.stroke();
    }

    ctx.fillStyle = ICE_COLORS.wallHighlight;
    ctx.fillRect(side === 0 ? wx + wallW - 4 : wx, 0, 4, h);

    ctx.strokeStyle = ICE_COLORS.wallShade;
    ctx.lineWidth = 3;
    ctx.strokeRect(wx + 1.5, 0, wallW - 3, h);
  });
}

export function drawIceSpike(
  ctx: CanvasRenderingContext2D,
  wallX: number,
  wallW: number,
  y: number,
  side: "left" | "right",
  scale: number
) {
  const size = 22 * scale;
  ctx.save();
  ctx.fillStyle = ICE_COLORS.spike;
  ctx.strokeStyle = ICE_COLORS.spikeEdge;
  ctx.lineWidth = 2;
  const baseX = side === "left" ? wallX + wallW : wallX;
  const dir = side === "left" ? 1 : -1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(baseX, y + i * size * 0.7);
    ctx.lineTo(baseX + dir * size, y + i * size * 0.7 + size * 0.35);
    ctx.lineTo(baseX, y + i * size * 0.7 + size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawIceCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: 1 | -1,
  squash: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale * (1 - squash * 0.25));
  ctx.fillStyle = ICE_COLORS.charBody;
  ctx.beginPath();
  ctx.moveTo(-11, 8);
  ctx.quadraticCurveTo(-13, -6, 0, -8);
  ctx.quadraticCurveTo(13, -6, 11, 8);
  ctx.quadraticCurveTo(11, 16, 0, 17);
  ctx.quadraticCurveTo(-11, 16, -11, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = ICE_COLORS.charCap;
  ctx.beginPath();
  ctx.ellipse(0, -9, 10, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ICE_COLORS.charSkin;
  ctx.beginPath();
  ctx.arc(4, -1, 2.6, 0, Math.PI * 2);
  ctx.arc(-4, -1, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#241938";
  ctx.beginPath();
  ctx.arc(5, -1, 1.3, 0, Math.PI * 2);
  ctx.arc(-3, -1, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawIceFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wallW: number
) {
  ctx.save();
  ctx.strokeStyle = "#eaf7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 46);
  ctx.stroke();
  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x + wallW * 0.5, y - 38);
  ctx.lineTo(x, y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
