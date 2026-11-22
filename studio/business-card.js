import { qrcode } from "./vendor/qrcode.mjs";
import { cleanLook } from "./worlds.js";

const assets = new Map();
const fonts = {
  golos: '"Golos Text", sans-serif',
  literata: "Literata, Georgia, serif",
  pangolin: "Notes, sans-serif",
  mono: "ui-monospace, Menlo, monospace",
};
const cardWidth = 1500;
const cardHeight = 840;
const qrBudget = 1750;

function publicUrl(profile) {
  const bytes = new TextEncoder().encode(JSON.stringify(profile));
  const encoded = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  return location.href.split("#")[0] + "#p/" + encoded;
}

function cardLink(profile, look) {
  const fields = { ...profile, look };
  if (!fields.visible.includes("sample")) {
    for (const key of ["title", "answer", "question", "extra"])
      delete fields[key];
  }
  if (!fields.visible.includes("about")) delete fields.about;
  if (!fields.visible.includes("contact")) delete fields.contact;
  const full = publicUrl(fields);
  if (full.length <= qrBudget) return [full, "Страница преподавателя"];
  const compact = {
    name: profile.name.slice(0, 70),
    subject: profile.subject.slice(0, 80),
    headline: (profile.headline || "").slice(0, 100),
    look,
    portrait: profile.portrait || undefined,
    contact: fields.contact || undefined,
    visible: fields.contact ? ["contact"] : [],
    order: ["contact"],
  };
  // A contact URL is indivisible. Never shorten it to a different destination.
  if (publicUrl(compact).length > qrBudget) {
    delete compact.contact;
    compact.visible = [];
  }
  return [publicUrl(compact), "Мини-профиль"];
}

function qr(g, link, x, y, space) {
  const code = qrcode(0, "L");
  code.addData(link);
  code.make();
  const count = code.getModuleCount();
  const pitch = Math.floor(space / (count + 8));
  const inset = Math.floor((space - count * pitch) / 2);
  g.fillStyle = "#fff";
  g.fillRect(x, y, space, space);
  g.fillStyle = "#101820";
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++)
      if (code.isDark(row, col))
        g.fillRect(
          x + inset + col * pitch,
          y + inset + row * pitch,
          pitch,
          pitch,
        );
}

function loadImage(src, cache = true) {
  if (!src) return Promise.resolve(null);
  if (cache && assets.has(src)) return assets.get(src);
  const img = new Image();
  img.src = src;
  const promise = img
    .decode()
    .then(() => img)
    .catch(() => null);
  if (cache) assets.set(src, promise);
  return promise;
}

function photoFill(g, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale,
    sh = h / scale;
  g.drawImage(
    img,
    (img.width - sw) / 2,
    (img.height - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h,
  );
}

function fill(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function grid(g, x, y, w, h, step, color) {
  g.beginPath();
  for (let i = 0; i < w; i += step) {
    g.moveTo(x + i + 0.5, y);
    g.lineTo(x + i + 0.5, y + h);
  }
  for (let i = 0; i < h; i += step) {
    g.moveTo(x, y + i + 0.5);
    g.lineTo(x + w, y + i + 0.5);
  }
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.stroke();
}

function drawCover(g, image, look, x, y, w, h) {
  if (image) photoFill(g, image, x, y, w, h);
  else {
    fill(g, look.accent, x, y, w, h);
    grid(g, x, y, w, h, 40, "#ffffff70");
  }
}

function drawAvatar(g, profile, image, frame, size, circular = false) {
  const border = 6;
  g.save();
  g.beginPath();
  if (circular) g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  else g.rect(0, 0, size, size);
  g.clip();
  fill(g, frame, 0, 0, size, size);
  g.beginPath();
  if (circular) g.arc(size / 2, size / 2, size / 2 - border, 0, Math.PI * 2);
  else g.rect(border, border, size - 2 * border, size - 2 * border);
  g.clip();
  if (image)
    photoFill(g, image, border, border, size - 2 * border, size - 2 * border);
  else {
    fill(g, "#283641", 0, 0, size, size);
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "700 " + Math.round(size * 0.39) + 'px "Golos Text", sans-serif';
    const initials = (profile.name || "К")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => Array.from(w)[0])
      .join("");
    g.fillText(initials, size / 2, size / 2);
  }
  g.restore();
}

function linesFor(g, value, width) {
  const lines = [];
  let current = "";
  for (const word of value.trim().split(/\s+/)) {
    const next = current ? current + " " + word : word;
    if (g.measureText(next).width <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = "";
    for (const char of word) {
      if (current && g.measureText(current + char).width > width) {
        lines.push(current);
        current = "";
      }
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textBlock(
  g,
  value,
  x,
  y,
  width,
  maxLines,
  size,
  family,
  weight = 600,
) {
  let lines,
    px = size;
  const min = Math.round(size * 0.62);
  do {
    g.font = weight + " " + px + "px " + family;
    lines = linesFor(g, String(value || ""), width);
    if (lines.length <= maxLines || px <= min) break;
    px -= 2;
  } while (px >= min);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let end = lines[maxLines - 1];
    while (end && g.measureText(end + "…").width > width)
      end = end.slice(0, -1);
    lines[maxLines - 1] = end.trimEnd() + "…";
  }
  const lineHeight = Math.round(px * 1.23);
  g.textBaseline = "top";
  for (const line of lines) {
    g.fillText(line, x, y + 3);
    y += lineHeight;
  }
  return y;
}

export async function businessCard(profile) {
  const look = cleanLook(
    profile.look,
    profile.theme === "green"
      ? "observatory"
      : profile.theme === "warm"
        ? "library"
        : "atelier",
  );
  const family = fonts[look.font],
    plain = fonts.golos;
  const portrait = ["anna", "ilya", "marina"].includes(profile.portrait)
    ? "./media/" + profile.portrait + ".webp"
    : "";
  const [cover, avatar] = await Promise.all([
    loadImage("./media/" + look.world + ".webp"),
    loadImage(profile.avatar || portrait, !profile.avatar),
    document.fonts.load("600 60px " + family, "Клариус Аа"),
    document.fonts.load("600 35px " + plain, "Имя преподавателя"),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const g = canvas.getContext("2d");
  const night = look.background === "night";
  const paper = night
    ? "#10232d"
    : look.world === "library"
      ? "#faf5e8"
      : "#f9f6ed";
  const ink = night ? "#f5f6eb" : "#18252d";
  const rule = night ? "#5f7680" : "#bfbbb0";
  fill(g, paper, 0, 0, cardWidth, cardHeight);
  if (look.background === "grid")
    grid(g, 0, 0, cardWidth, cardHeight, 32, "#8c9b943b");

  let titleX, titleY, textWidth, qrX, qrY, portraitX, portraitY, portraitSize;
  if (look.layout === "console") {
    drawCover(g, cover, look, 820, 0, 680, cardHeight);
    fill(g, look.accent, 802, 0, 18, cardHeight);
    grid(g, 0, 0, 800, cardHeight, 80, night ? "#9bb6ab26" : "#6a7e7924");
    portraitX = 64;
    portraitY = 77;
    portraitSize = 185;
    titleX = 65;
    titleY = 327;
    textWidth = 688;
    qrX = 986;
    qrY = 318;
  } else if (look.layout === "edition") {
    drawCover(g, cover, look, 0, 0, 625, cardHeight);
    fill(g, look.accent, 625, 0, 8, cardHeight);
    fill(g, rule, 696, 90, 730, 2);
    portraitX = 699;
    portraitY = 132;
    portraitSize = 142;
    titleX = 695;
    titleY = 312;
    textWidth = 715;
    qrX = 71;
    qrY = 316;
  } else {
    drawCover(g, cover, look, 0, 0, cardWidth, 315);
    fill(g, look.accent, 0, 308, cardWidth, 10);
    portraitX = 81;
    portraitY = 224;
    portraitSize = 168;
    titleX = 68;
    titleY = 425;
    textWidth = 824;
    qrX = 968;
    qrY = 318;
  }
  g.save();
  g.translate(portraitX, portraitY);
  if (look.layout === "collage") g.rotate(-0.055);
  drawAvatar(
    g,
    profile,
    avatar,
    paper,
    portraitSize,
    look.layout === "edition",
  );
  g.restore();

  g.fillStyle = ink;
  const title =
    profile.headline ||
    profile.subject ||
    profile.name ||
    "Страница преподавателя";
  const y = textBlock(
    g,
    title,
    titleX,
    titleY,
    textWidth,
    look.layout === "collage" ? 2 : 3,
    68,
    family,
  );
  const byline = [profile.name, profile.subject]
    .filter((v, i, a) => v && v !== title && a.indexOf(v) === i)
    .join(" · ");
  textBlock(g, byline, titleX, y + 20, textWidth, 2, 33, plain, 500);
  fill(g, look.accent, titleX, 750, 70, 8);
  g.fillStyle = ink;
  textBlock(g, "Клариус", titleX + 87, 734, 230, 1, 34, plain, 700);
  if (profile.visible.includes("contact") && profile.contact) {
    const address = profile.contact.replace(/^https:\/\//, "");
    textBlock(
      g,
      address,
      titleX + 300,
      740,
      textWidth - 300,
      1,
      23,
      plain,
      500,
    );
  }

  const [url, label] = cardLink(profile, look);
  // The caption sits on a solid sheet even when the cover is photographic.
  fill(g, "#fff", qrX - 10, qrY - 10, 470, 509);
  qr(g, url, qrX, qrY, 450);
  g.fillStyle = "#1d2931";
  g.textAlign = "center";
  g.textBaseline = "top";
  g.font = "600 24px " + plain;
  g.fillText(label, qrX + 225, qrY + 455);
  return canvas;
}

export async function squareAvatar(file) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Выберите PNG, JPEG или WebP до 8 МБ.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const side = Math.min(bitmap.width, bitmap.height);
  try {
    for (const size of [260, 208, 160, 128, 96, 72]) {
      canvas.width = canvas.height = Math.min(size, side);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      for (const quality of [0.85, 0.72, 0.57, 0.42]) {
        const output = canvas.toDataURL("image/webp", quality);
        if (
          output.startsWith("data:image/webp;base64,") &&
          output.length < 13000
        )
          return output;
      }
    }
    throw Error("Не удалось подготовить фото для визитки.");
  } finally {
    bitmap.close();
  }
}
