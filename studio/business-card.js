import { qrcode } from "./vendor/qrcode.mjs";

const publicUrl = (p) => {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  const value = btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  return location.href.split("#")[0] + "#p/" + value;
};

function cardLink(profile) {
  const publicFields = { ...profile };
  if (!profile.visible.includes("sample")) {
    for (const key of ["title", "answer", "question", "extra"])
      delete publicFields[key];
  }
  if (!profile.visible.includes("about")) delete publicFields.about;
  if (!profile.visible.includes("contact")) delete publicFields.contact;
  const full = publicUrl(publicFields);
  if (full.length < 1800) return [full, "Открыть страницу"];
  const compact = {
    name: profile.name.slice(0, 70),
    subject: profile.subject.slice(0, 80),
    theme: profile.theme,
    contact: publicFields.contact,
    visible: ["contact"],
    order: ["contact"],
  };
  return [publicUrl(compact), "Открыть мини-профиль"];
}

function drawQr(context, url, x, y, space) {
  const code = qrcode(0, "L");
  code.addData(url);
  code.make();
  const count = code.getModuleCount(),
    cell = Math.floor(space / (count + 8)),
    size = (count + 8) * cell;
  const margin = Math.floor((space - size) / 2);
  context.fillStyle = "#fff";
  context.fillRect(x, y, space, space);
  context.fillStyle = "#192433";
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++) {
      if (code.isDark(row, col))
        context.fillRect(
          x + margin + (col + 4) * cell,
          y + margin + (row + 4) * cell,
          cell,
          cell,
        );
    }
}

export async function businessCard(p, palette) {
  const c = document.createElement("canvas");
  c.width = 1500;
  c.height = 840;
  const g = c.getContext("2d");
  const [, accent, paper] = palette;
  g.fillStyle = paper;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#ffffff80";
  for (let n = 0; n < c.width; n += 40) {
    g.beginPath();
    g.moveTo(n, 0);
    g.lineTo(n, c.height);
    g.stroke();
  }
  for (let n = 0; n < c.height; n += 40) {
    g.beginPath();
    g.moveTo(0, n);
    g.lineTo(c.width, n);
    g.stroke();
  }
  g.fillStyle = accent;
  g.beginPath();
  g.roundRect(74, 78, 140, 140, 32);
  g.fill();
  if (p.avatar) {
    const photo = new Image();
    photo.src = p.avatar;
    await photo.decode().catch(() => {});
    if (photo.naturalWidth) {
      g.save();
      g.clip();
      g.drawImage(photo, 74, 78, 140, 140);
      g.restore();
    }
  } else {
    const initials = p.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] || "")
      .join("");
    g.textAlign = "center";
    g.fillStyle = "white";
    g.font = "bold 55px sans-serif";
    g.fillText(initials || "К", 144, 168);
    g.textAlign = "left";
  }
  g.fillStyle = "#20262f";
  g.font = "bold 75px sans-serif";
  g.fillText(p.name || "Имя преподавателя", 74, 347, 800);
  g.font = "36px sans-serif";
  g.fillText(p.subject, 76, 415, 795);
  g.fillStyle = accent;
  g.font = "bold 38px sans-serif";
  g.fillText("Клариус", 75, 750);
  if (p.visible.includes("contact") && p.contact) {
    g.font = "25px sans-serif";
    g.fillText(p.contact.replace(/^https:\/\//, ""), 75, 644, 795);
  }
  const [url, label] = cardLink(p);
  drawQr(g, url, 930, 132, 475);
  g.textAlign = "center";
  g.fillStyle = "#293641";
  g.font = "30px sans-serif";
  g.fillText(label, 1168, 664);
  return c;
}

export async function squareAvatar(file) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Выберите PNG, JPEG или WebP до 8 МБ.");
  const bitmap = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = c.height = 76;
  const side = Math.min(bitmap.width, bitmap.height);
  c.getContext("2d").drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    76,
    76,
  );
  bitmap.close();
  return c.toDataURL("image/webp", 0.55);
}
