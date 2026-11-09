/**
 * La grilla de puntos de las pantallas de acceso. Sin React ni librerías: cada
 * punto sabe si le toca prenderse para la figura de turno, y las figuras se
 * reemplazan desde el centro hacia afuera.
 */
const NARROW = 640;
const MAX_POINTS = 16e3;
const ICON_BOX = 24;
const SHAPES = ["mark", "email", "password", "ok", "error"];
const LOCK_BODY = { x: 4.5, y: 10.5, w: 15, h: 11, r: 2.4 };
const LOCK_SHACKLE = "M8 10.5V7a4 4 0 0 1 8 0v3.5";
const CHECK = "M4 12.8l5.4 5.4L20 6.8";
const CROSS = "M5.5 5.5l13 13M18.5 5.5l-13 13";
export const createDotsEngine = (canvas, name, reduced) => {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let ratio = 1;
  let area = { x: 0, y: 0, w: 0, h: 0 };
  let points = [];
  let masks = {};
  let ripples = [];
  let colors = { glow: "#000", ground: "#fff", idle: "#000" };
  let mark = null;
  let shape = "mark";
  let leaving = 0;
  let leavingTarget = 0;
  let pointerX = -9999;
  let pointerY = -9999;
  let born = performance.now();
  let frameId = 0;
  const fontFamily = () => getComputedStyle(canvas).fontFamily || "sans-serif";
  const drawText = (mask, word, weight) => {
    mask.fillStyle = "#000";
    mask.textAlign = "center";
    mask.textBaseline = "middle";
    mask.font = `${weight} 100px ${fontFamily()}`;
    const size = Math.min(
      100 * area.w * 0.88 / mask.measureText(word).width,
      area.h * 0.84
    );
    mask.font = `${weight} ${size}px ${fontFamily()}`;
    mask.fillText(word, area.x + area.w / 2, area.y + area.h / 2);
  };
  const drawIcon = (mask, draw2) => {
    const scale = Math.min(area.w, area.h) * 0.8 / ICON_BOX;
    mask.save();
    mask.translate(
      area.x + area.w / 2 - ICON_BOX / 2 * scale,
      area.y + area.h / 2 - ICON_BOX / 2 * scale
    );
    mask.scale(scale, scale);
    mask.fillStyle = "#000";
    mask.strokeStyle = "#000";
    mask.lineCap = "round";
    mask.lineJoin = "round";
    draw2(mask);
    mask.restore();
  };
  const drawShape = (mask, target) => {
    if (target === "email") return drawText(mask, "@", 500);
    if (target === "password")
      return drawIcon(mask, (icon) => {
        icon.lineWidth = 2.5;
        icon.stroke(new Path2D(LOCK_SHACKLE));
        icon.beginPath();
        icon.roundRect(
          LOCK_BODY.x,
          LOCK_BODY.y,
          LOCK_BODY.w,
          LOCK_BODY.h,
          LOCK_BODY.r
        );
        icon.fill();
        icon.globalCompositeOperation = "destination-out";
        icon.beginPath();
        icon.arc(12, 16, 1.7, 0, Math.PI * 2);
        icon.fill();
      });
    if (target === "ok" || target === "error")
      return drawIcon(mask, (icon) => {
        icon.lineWidth = 3.4;
        icon.stroke(new Path2D(target === "ok" ? CHECK : CROSS));
      });
    if (mark?.naturalWidth) {
      const fit = Math.min(
        area.w * 0.74 / mark.naturalWidth,
        area.h * 0.74 / mark.naturalHeight
      );
      const w = mark.naturalWidth * fit;
      const h = mark.naturalHeight * fit;
      mask.drawImage(
        mark,
        area.x + (area.w - w) / 2,
        area.y + (area.h - h) / 2,
        w,
        h
      );
      return;
    }
    drawText(mask, name, 600);
  };
  const buildMask = (target) => {
    const surface = document.createElement("canvas");
    surface.width = Math.ceil(width);
    surface.height = Math.ceil(height);
    const mask = surface.getContext("2d", { willReadFrequently: true });
    const result = new Uint8Array(points.length);
    if (!mask || !surface.width || !surface.height) return result;
    drawShape(mask, target);
    const pixels = mask.getImageData(0, 0, surface.width, surface.height).data;
    points.forEach((point, index) => {
      const offset = (Math.floor(point.y) * surface.width + Math.floor(point.x)) * 4 + 3;
      result[index] = (pixels[offset] ?? 0) > 120 ? 1 : 0;
    });
    return result;
  };
  const centerOf = () => [
    area.x + area.w / 2,
    area.y + area.h / 2
  ];
  const applyShape = (quiet) => {
    const mask = masks[shape];
    if (!mask) return;
    const now = performance.now() / 1e3;
    const [cx, cy] = centerOf();
    const reach = Math.hypot(width, height) * 0.5;
    points.forEach((point, index) => {
      point.target = mask[index] ?? 0;
      point.at = now + Math.hypot(point.x - cx, point.y - cy) / reach * 0.42 + point.seed * 0.1;
      if (reduced) point.w = point.target;
    });
    if (!quiet) ripples.push(now);
    if (reduced) requestFrame();
  };
  const rebuild = () => {
    const narrow = width < NARROW;
    const gap = Math.max(
      narrow ? 8 : 11,
      Math.sqrt(width * height / MAX_POINTS)
    );
    area = narrow ? { x: 0, y: 30, w: width, h: height * 0.3 } : { x: width * 0.42, y: 0, w: width * 0.55, h: height };
    const current = new Map(
      points.map((point) => [`${point.x}:${point.y}`, point.w])
    );
    points = [];
    for (let y = gap / 2; y < height; y += gap)
      for (let x = gap / 2; x < width; x += gap)
        points.push({
          x,
          y,
          w: current.get(`${x}:${y}`) ?? 0,
          target: 0,
          at: 0,
          seed: Math.random()
        });
    masks = {};
    for (const target of SHAPES) masks[target] = buildMask(target);
    applyShape(true);
  };
  const draw = (ms) => {
    if (!context || !width) return;
    const time = ms / 1e3;
    const age = (ms - born) / 1e3;
    const narrow = width < NARROW;
    const big = narrow ? 5 : 7;
    const [cx, cy] = centerOf();
    leaving += (leavingTarget - leaving) * (leavingTarget ? 0.05 : 0.25);
    const fly = leaving * leaving * Math.max(width, height);
    ripples = ripples.filter((start) => time - start < 1.8);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = colors.ground;
    context.fillRect(0, 0, width, height);
    for (const point of points) {
      if (time >= point.at) point.w += (point.target - point.w) * 0.16;
      const phase = time * 0.55 + point.x * 7e-3 + point.y * 0.011;
      let dx = reduced ? 0 : Math.sin(phase) * 1.5;
      let dy = reduced ? 0 : Math.cos(phase * 0.8) * 1.5;
      let boost = 0;
      if (!reduced) {
        const fromX = point.x - pointerX;
        const fromY = point.y - pointerY;
        const distance = Math.hypot(fromX, fromY);
        if (distance < 150) {
          const force = (1 - distance / 150) ** 2;
          dx += fromX / (distance || 1) * force * 26;
          dy += fromY / (distance || 1) * force * 26;
          boost += force;
        }
        const radial = Math.hypot(point.x - cx, point.y - cy);
        for (const start of ripples) {
          const off = Math.abs(radial - (time - start) * 560);
          if (off >= 56) continue;
          const force = (1 - off / 56) * (1 - (time - start) / 1.8);
          dx += (point.x - cx) / (radial || 1) * force * 15;
          dy += (point.y - cy) / (radial || 1) * force * 15;
          boost += force * 0.8;
        }
      }
      const progress = Math.max(
        0,
        Math.min(1, (age - point.x / width * 0.7 - point.seed * 0.3) / 0.9)
      );
      const intro = reduced ? 1 : 1 - (1 - progress) ** 3;
      const angle = Math.atan2(point.y - cy, point.x - cx);
      const x = point.x + dx + Math.cos(angle) * fly;
      const y = point.y + dy - (1 - intro) * 34 + Math.sin(angle) * fly;
      const size = 1.6 + point.w * (big - 1.6) + boost * 2.6;
      context.globalAlpha = Math.min(
        1,
        (0.14 + point.w * 0.84 + boost * 0.5 * (1 - point.w)) * intro
      );
      context.fillStyle = point.w > 0.35 || boost > 0.1 ? colors.glow : colors.idle;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    context.globalAlpha = 1;
  };
  const loop = (ms) => {
    frameId = requestAnimationFrame(loop);
    if (!document.hidden) draw(ms);
  };
  function requestFrame() {
    if (reduced) requestAnimationFrame(draw);
  }
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    rebuild();
    requestFrame();
  };
  return {
    drawable: Boolean(context),
    resize,
    start: () => {
      born = performance.now();
      resize();
      if (!reduced) frameId = requestAnimationFrame(loop);
    },
    stop: () => cancelAnimationFrame(frameId),
    setColors: (next) => {
      colors = next;
      requestFrame();
    },
    setMark: (image) => {
      mark = image;
      masks.mark = buildMask("mark");
      if (shape === "mark") applyShape(true);
    },
    setShape: (next) => {
      if (next === shape) return;
      shape = next;
      applyShape(false);
    },
    ripple: () => {
      ripples.push(performance.now() / 1e3);
    },
    pointer: (x, y) => {
      pointerX = x;
      pointerY = y;
    },
    fly: () => {
      leavingTarget = 1;
    }
  };
};
