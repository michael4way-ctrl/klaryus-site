export const worldLooks = {
  atelier: {
    world: "atelier",
    layout: "collage",
    font: "golos",
    background: "paper",
    accent: "#bc4427",
  },
  observatory: {
    world: "observatory",
    layout: "console",
    font: "mono",
    background: "night",
    accent: "#54bdb5",
  },
  library: {
    world: "library",
    layout: "edition",
    font: "literata",
    background: "paper",
    accent: "#46623f",
  },
};

const accents = {
  blue: "#294fa8",
  green: "#296347",
  plum: "#69408a",
  warm: "#9c4530",
};
const allowed = (value, list, fallback) =>
  list.includes(value) ? value : fallback;
const escapeText = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

export function cleanLook(raw = {}, fallbackWorld = "atelier") {
  const values = raw && typeof raw === "object" ? raw : {};
  const fallback = Object.hasOwn(worldLooks, fallbackWorld)
    ? fallbackWorld
    : "atelier";
  const world = Object.hasOwn(worldLooks, values.world)
    ? values.world
    : fallback;
  const base = worldLooks[world];
  const color = typeof values.accent === "string" ? values.accent.trim() : "";
  return {
    world,
    layout: allowed(
      values.layout,
      ["collage", "console", "edition"],
      base.layout,
    ),
    font: allowed(
      values.font,
      ["golos", "literata", "pangolin", "mono"],
      base.font,
    ),
    background: allowed(
      values.background,
      ["paper", "grid", "night"],
      base.background,
    ),
    accent: /^#[\da-f]{6}$/i.test(color)
      ? color
      : Object.hasOwn(accents, color)
        ? accents[color]
        : base.accent,
  };
}

function identityPhoto(profile) {
  const custom =
    typeof profile.avatar === "string" &&
    /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(
      profile.avatar,
    );
  const portrait = allowed(profile.portrait, ["anna", "ilya", "marina"], "");
  const src = custom
    ? profile.avatar
    : portrait
      ? "./media/" + portrait + ".webp"
      : "";
  if (src)
    return (
      '<img src="' +
      escapeText(src) +
      '" alt="" width="180" height="180" decoding="async">'
    );
  const letters = String(profile.name || "")
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("")
    .toLocaleUpperCase("ru");
  return '<span aria-hidden="true">' + escapeText(letters || "К") + "</span>";
}

// blocksHtml, activityHtml and contactHtml are already rendered by the application's
// own templates. All profile fields and theme options cross the boundary here.
export function renderWorld(
  profile,
  {
    mini = false,
    standalone = false,
    blocksHtml = {},
    activityHtml = "",
    contactHtml = "",
  } = {},
) {
  const look = cleanLook(profile.look);
  const order = Array.isArray(profile.order)
    ? [...new Set(profile.order)]
    : ["about", "sample", "contact"];
  const visible = Array.isArray(profile.visible) ? profile.visible : order;
  const defaults = {
    about: profile.about
      ? "<h3>Как проходят занятия</h3><p>" + escapeText(profile.about) + "</p>"
      : "",
    sample: activityHtml,
    contact: contactHtml,
  };
  for (const id of ["custom-1", "custom-2", "custom-3"]) {
    const section = profile.sections?.[id];
    if (typeof section?.title !== "string" || typeof section.body !== "string")
      continue;
    defaults[id] =
      '<section class="wx-author-section"><h3>' +
      escapeText(section.title) +
      "</h3><p>" +
      escapeText(section.body) +
      "</p></section>";
  }
  const content = order
    .filter((key) => Object.hasOwn(defaults, key) && visible.includes(key))
    .map((key) => {
      const html = Object.hasOwn(blocksHtml, key)
        ? blocksHtml[key]
        : defaults[key];
      return html
        ? '<div class="wx-block wx-block-' + key + '">' + html + "</div>"
        : "";
    })
    .join("");
  const portrait =
    '<div class="wx-avatar">' + identityPhoto(profile) + "</div>";
  const headline = String(profile.headline || "")
    .trim()
    .slice(0, 100);
  const titleText =
    headline || profile.subject || profile.name || "Страница преподавателя";
  const byline = [profile.name, headline && profile.subject]
    .filter((value) => value && value !== titleText)
    .map(escapeText)
    .join(" · ");
  const heading = standalone ? "h1" : "h2";
  const title =
    '<div class="wx-identity"><' +
    heading +
    ">" +
    escapeText(titleText) +
    "</" +
    heading +
    ">" +
    (byline ? "<p>" + byline + "</p>" : "") +
    "</div>";
  const art =
    '<div class="wx-cover" aria-hidden="true"><img src="./media/' +
    look.world +
    '.webp" alt="" width="1560" height="600" decoding="async"></div>';
  let masthead;
  if (look.layout === "console") {
    masthead = art + '<div class="wx-hud">' + portrait + title + "</div>";
  } else if (look.layout === "edition") {
    masthead = '<div class="wx-byline">' + title + portrait + "</div>" + art;
  } else {
    masthead = art + '<div class="wx-signature">' + portrait + title + "</div>";
  }
  return (
    '<article class="profile wx-profile wx-' +
    look.world +
    " wx-" +
    look.layout +
    " wx-" +
    look.background +
    " wx-font-" +
    look.font +
    (mini ? " wx-mini" : "") +
    '" style="--wx-accent:' +
    look.accent +
    '"><div class="wx-mast">' +
    masthead +
    "</div>" +
    (!mini && content ? '<div class="wx-blocks">' + content + "</div>" : "") +
    "</article>"
  );
}
