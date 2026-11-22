import { businessCard, squareAvatar } from "./business-card.js";
const root = document.querySelector("#workspace");
const landing = document.querySelector("#landing");
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  const content = document.getElementById("content");
  content.focus({ preventScroll: true });
  content.scrollIntoView({ block: "start", behavior: "instant" });
});
const key = "klaryus-studio-v1";
const themes = {
  blue: ["Синяя тетрадь", "#294fa8", "#e6ecfb"],
  green: ["Зелёная доска", "#296347", "#d9eedf"],
  plum: ["Сиреневый альбом", "#69408a", "#eee2f9"],
  warm: ["Терракота", "#9c4530", "#f8e2d6"],
};
const blocks = {
  about: "Как проходят занятия",
  sample: "Попробовать задание",
  contact: "Связаться",
};
const starters = {
  quiz: {
    name: "Анна Миронова",
    subject: "Математика · 5–9 классы",
    about:
      "Заканчиваем занятие коротким квизом. Так мы сразу видим, что уже понятно, а к чему вернуться в следующий раз.",
    theme: "plum",
    title: "Дроби за пять минут",
    question: "Как записать ¾ десятичной дробью?",
    answer: "0,75",
  },
  review: {
    name: "Илья Соколов",
    subject: "Математика · ЕГЭ",
    about:
      "Разбираем ход решения, ищем точку ошибки и пробуем похожую задачу. После урока даю работу по тем местам, где нужна практика.",
    theme: "green",
    title: "Найти пропущенный корень",
    question:
      "Ученик нашёл корень 1 уравнения x² − 1 = 0. Какой корень он пропустил?",
    answer: "-1",
  },
};
const initial = {
  created: false,
  name: "",
  subject: "",
  about: "",
  contact: "",
  theme: "blue",
  order: Object.keys(blocks),
  visible: Object.keys(blocks),
  title: "Мой мини-квиз",
  question: starters.quiz.question,
  answer: starters.quiz.answer,
  focus: "quiz",
  extra: [],
  materials: "",
  call: "",
  student: "",
  published: null,
};
let state = { ...initial };
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) {
    state = { ...initial, ...saved, created: saved.created ?? true };
    if (isLegacyPlaceholder(state))
      Object.assign(state, { question: "", answer: "" });
  }
} catch {
  /* A fresh draft also works without storage. */
}
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    message("Браузер не сохранил черновик. Оставьте вкладку открытой.");
  }
}
function message(value) {
  const area = document.querySelector("#notice");
  if (area) {
    area.textContent = value;
    area.hidden = false;
  }
}
function route() {
  return location.hash.slice(1) || "home";
}
function go(id) {
  if (route() === id) render();
  else location.hash = id;
}
function safeLink(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
function layout(body, narrow = false) {
  return (
    '<section class="shell ' +
    (narrow ? "narrow" : "") +
    '">' +
    body +
    '<p id="notice" class="note" role="status" hidden></p></section>'
  );
}
function nav() {
  return (
    '<nav class="tabs" aria-label="Кабинет">' +
    [
      ["desk", "Мой кабинет"],
      ["editor", "Моя страница"],
      ["tools", "Мой инструмент"],
      ["lesson", "Урок"],
    ]
      .map(
        ([url, name]) =>
          '<a href="#' +
          url +
          '" ' +
          (route() === url ? 'aria-current="page"' : "") +
          ">" +
          name +
          "</a>",
      )
      .join("") +
    "</nav>"
  );
}
function field(label, name, value, opts = "") {
  return (
    "<label>" +
    label +
    '<input name="' +
    name +
    '" value="' +
    esc(value) +
    '" maxlength="140" ' +
    opts +
    "></label>"
  );
}
function area(label, name, value, max = 480) {
  return (
    "<label>" +
    label +
    '<textarea name="' +
    name +
    '" maxlength="' +
    max +
    '">' +
    esc(value) +
    "</textarea></label>"
  );
}
const button = (txt, id, kind = "") =>
  '<button type="button" class="' +
  kind +
  '" data-action="' +
  id +
  '">' +
  txt +
  "</button>";
function start() {
  return layout(
    '<h1>Соберите свой кабинет</h1><p class="lead">С чего обычно начинается или заканчивается ваш урок?</p><form class="panel stack" id="start-form">' +
      field(
        "Как вас представить?",
        "name",
        state.name,
        'required autocomplete="given-name" placeholder="Имя преподавателя"',
      ) +
      field(
        "Что преподаёте?",
        "subject",
        state.subject,
        'required placeholder="Например, математика ЕГЭ"',
      ) +
      '<label>Первый инструмент<select name="focus"><option value="quiz">Короткий квиз в конце урока</option><option value="review">Разбор ошибки с учеником</option><option value="own">Своё упражнение</option></select></label><button class="primary">Открыть кабинет</button><small>Демокабинет сохраняется в этом браузере. Для действующего аккаунта — <a href="https://app.klaryus.ru/login">вход в Клариус</a>.</small></form>',
    true,
  );
}
const dashboardBlocks = {
  lesson: [
    "Следующее занятие",
    () => state.student || "Выберите, для кого готовите урок.",
    "#lesson",
    "Подготовить урок",
  ],
  tool: [
    "Мой инструмент",
    () => state.title,
    "#tools",
    "Редактировать и попробовать",
  ],
  profile: [
    "Страница преподавателя",
    () =>
      state.published
        ? "Сохранена версия страницы для учеников."
        : "Соберите профиль и решите, чем поделиться.",
    "#editor",
    "Открыть редактор",
  ],
  app: [
    "Ученики и домашки",
    () =>
      "Карточки учеников, выдача заданий и проверка решений — в действующем кабинете.",
    "https://app.klaryus.ru",
    "Перейти в Клариус",
  ],
};
function dashboardOrder() {
  const keys = Object.keys(dashboardBlocks);
  return [
    ...new Set([
      ...(Array.isArray(state.dashboardOrder) ? state.dashboardOrder : []),
      ...keys,
    ]),
  ].filter((k) => keys.includes(k));
}
function desk() {
  const order = dashboardOrder(),
    hidden = state.hiddenWidgets || [];
  const panels = order
    .filter((k) => !hidden.includes(k))
    .map((k) => {
      const [title, description, url, label] = dashboardBlocks[k];
      return (
        '<section class="panel"><h2>' +
        title +
        "</h2><p>" +
        esc(description()) +
        '</p><a class="' +
        (k === "lesson" ? "btn primary" : "text-link") +
        '" href="' +
        url +
        '">' +
        label +
        "</a></section>"
      );
    });
  const chooser = order
    .map(
      (k, i) =>
        '<div class="check-row"><label class="check"><input type="checkbox" value="' +
        k +
        '" data-widget ' +
        (hidden.includes(k) ? "" : "checked") +
        ">" +
        dashboardBlocks[k][0] +
        "</label>" +
        (i > 0
          ? '<button type="button" data-action="raise-' +
            k +
            '" aria-label="Поднять блок ' +
            dashboardBlocks[k][0] +
            '">Выше</button>'
          : "") +
        "</div>",
    )
    .join("");
  return layout(
    nav() +
      "<h1>" +
      (state.name.trim() ? esc(state.name) + ", ваш кабинет" : "Мой кабинет") +
      '</h1><p class="lead">Подготовьте занятие, откройте материал вместе с учеником или соберите свою страницу.</p><details class="widget-settings"><summary>Настроить кабинет</summary>' +
      chooser +
      '</details><div class="grid2">' +
      (panels.join("") ||
        "<p>Добавьте нужные блоки в настройках кабинета.</p>") +
      "</div>",
  );
}
function refreshDashboardSettings() {
  render();
  const settings = document.querySelector(".widget-settings");
  if (settings) settings.open = true;
}
function isLegacyPlaceholder(input) {
  return (
    input.focus === "own" &&
    input.question === "Какую главную идею урока вы запомнили?" &&
    input.answer === "Укажите свой ответ"
  );
}
function hasExercise(input) {
  return (
    Boolean(input.question?.trim() && input.answer?.trim()) &&
    !isLegacyPlaceholder(input)
  );
}
function cleanProfile(input) {
  const text = (k, n = 140) =>
    typeof input?.[k] === "string" ? input[k].slice(0, n) : "";
  const list = (arr) =>
    Array.isArray(arr)
      ? [...new Set(arr.filter((k) => Object.hasOwn(blocks, k)))]
      : Object.keys(blocks);
  return {
    name: text("name"),
    avatar:
      typeof input.avatar === "string" &&
      input.avatar.length < 13000 &&
      /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(input.avatar)
        ? input.avatar
        : "",
    subject: text("subject"),
    theme: Object.hasOwn(themes, input.theme) ? input.theme : "blue",
    about: text("about", 480),
    contact: safeLink(text("contact", 500)),
    order: list(input.order),
    visible: list(input.visible),
    title: text("title"),
    question: hasExercise(input) ? text("question", 480) : "",
    answer: hasExercise(input) ? text("answer") : "",
    focus: text("focus"),
    extra: cleanExtra(input.extra),
  };
}
function cleanExtra(items) {
  return (Array.isArray(items) ? items : [])
    .slice(0, 5)
    .filter(
      (item) =>
        typeof item?.question === "string" &&
        typeof item?.answer === "string" &&
        item.question.trim() &&
        item.answer.trim(),
    )
    .map((item) => ({
      question: item.question.slice(0, 350),
      answer: item.answer.slice(0, 140),
    }));
}
function readExtra(source) {
  return cleanExtra(
    source.split("\n").map((line) => {
      const cut = line.lastIndexOf("|");
      return cut > 0
        ? {
            question: line.slice(0, cut).trim(),
            answer: line.slice(cut + 1).trim(),
          }
        : null;
    }),
  );
}
function activity(q, index = 0) {
  if (!hasExercise(q))
    return '<p class="hint">Введите вопрос и правильный ответ, чтобы попробовать упражнение.</p>';
  const questions = [
    { question: q.question, answer: q.answer },
    ...cleanExtra(q.extra),
  ];
  const item = questions[index] || questions[0];
  return (
    '<div class="sheet">' +
    (q.focus === "review"
      ? '<img src="./geometry.webp" alt="Лист с разбором задачи">'
      : "") +
    "<h3>" +
    esc(q.title) +
    '</h3><p class="hint">Вопрос ' +
    (index + 1) +
    " из " +
    questions.length +
    "</p><p>" +
    esc(item.question) +
    '</p><form class="attempt" data-index="' +
    index +
    '">' +
    field("Ваш ответ", "response", "", 'required autocomplete="off"') +
    '<button>Проверить ответ</button><p class="result" role="status" hidden></p></form></div>'
  );
}
function profile(input, mini = false) {
  if (mini)
    return '<studio-business-card aria-label="Предпросмотр визитки"></studio-business-card>';
  const p = cleanProfile(input),
    [, ink, wash] = themes[p.theme];
  const initials = p.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  const parts = {
    about: p.about
      ? '<section class="row-card"><h3>Как проходят занятия</h3><p>' +
        esc(p.about) +
        "</p></section>"
      : "",
    sample: p.question
      ? '<section class="row-card"><h3>Попробовать задание</h3>' +
        activity(p) +
        "</section>"
      : "",
    contact: p.contact
      ? '<section class="row-card"><a class="btn primary" target="_blank" rel="noopener noreferrer" href="' +
        esc(p.contact) +
        '">Связаться с преподавателем</a></section>'
      : "",
  };
  return (
    '<article class="profile" style="--accent:' +
    ink +
    ";--wash:" +
    wash +
    '"><div class="profile-head"><span class="avatar">' +
    (p.avatar
      ? '<img src="' +
        esc(p.avatar) +
        '" width="58" height="58" style="border-radius:inherit" alt="">'
      : esc(initials || "К")) +
    "</span><h2>" +
    esc(p.name || "Имя преподавателя") +
    '</h2><p class="tag">' +
    esc(p.subject) +
    "</p></div>" +
    (!mini
      ? '<div class="profile-body">' +
        p.order
          .filter((k) => p.visible.includes(k))
          .map((k) => parts[k])
          .join("") +
        "</div>"
      : "") +
    "</article>"
  );
}
let mini = false;
let activeQuestion = null;
function publishedLink() {
  if (!state.published) return "";
  const url = location.href.split("#")[0] + "#p/" + encode(state.published);
  return (
    '<div class="row-card"><h3>Ссылка готова</h3><label>Страница для ученика<input id="public-url" readonly value="' +
    esc(url) +
    '"></label><div class="controls">' +
    button("Скопировать", "copy") +
    '<a class="text-link" href="' +
    esc(url) +
    '">Открыть страницу</a></div></div>'
  );
}
function editor() {
  const opt = Object.entries(themes)
    .map(
      ([id, [label]]) =>
        '<option value="' +
        id +
        '" ' +
        (state.theme === id ? "selected" : "") +
        ">" +
        label +
        "</option>",
    )
    .join("");
  const manage = state.order
    .map(
      (k, i) =>
        '<div class="check-row"><label class="check"><input type="checkbox" name="visible" value="' +
        k +
        '" ' +
        (state.visible.includes(k) ? "checked" : "") +
        ">" +
        blocks[k] +
        "</label>" +
        button("Выше", "up-" + k, i === 0 ? "hidden" : "") +
        "</div>",
    )
    .join("");
  return layout(
    nav() +
      '<h1>Моя страница</h1><p class="lead">Настройте то, что увидят ученики и родители.</p><div class="grid2"><form id="profile-form" class="panel">' +
      field("Имя", "name", state.name, "required") +
      field("Предмет и формат", "subject", state.subject, "required") +
      area("О занятиях", "about", state.about) +
      field(
        "Ссылка для связи",
        "contact",
        state.contact,
        'type="url" placeholder="https://t.me/..."',
      ) +
      '<label>Фотография<input type="file" name="avatarFile" accept="image/webp,image/png,image/jpeg"></label>' +
      (state.avatar ? button("Убрать фотографию", "remove-avatar") : "") +
      '<label>Оформление<select name="theme">' +
      opt +
      "</select></label><fieldset><legend>Публичные блоки</legend>" +
      manage +
      '</fieldset><div class="controls"><button class="primary">Создать ссылку</button>' +
      button("Скачать визитку", "png") +
      '</div><small>Ссылка содержит снимок выбранных публичных полей. Скопировавший её увидит именно эту версию.</small></form><div><div class="controls">' +
      button("Страница", "full") +
      button("Визитка", "mini") +
      '</div><div id="preview">' +
      profile(state, mini) +
      '</div></div></div><div id="share-result">' +
      publishedLink() +
      "</div>",
  );
}
function toolsView() {
  return layout(
    nav() +
      '<h1>Мой инструмент</h1><p class="lead">Создайте упражнение для повторения. Шаблон можно менять и использовать на разных уроках.</p><div class="grid2"><form id="tool-form" class="panel"><label>Начать с примера<select name="preset"><option value="">Своё упражнение</option><option value="quiz">Квиз по дробям</option><option value="review">Найти пропущенный корень</option></select></label>' +
      field("Название", "title", state.title, "required") +
      area("Вопрос для ученика", "question", state.question) +
      field("Правильный ответ", "answer", state.answer, "required") +
      area(
        "Ещё вопросы (до пяти)",
        "extraText",
        cleanExtra(state.extra)
          .map((it) => it.question + " | " + it.answer)
          .join("\n"),
        2400,
      ) +
      '<p class="hint">Каждая строка — вопрос и ответ через |. Например: Сколько будет 2 × 3? | 6</p><button class="primary">Сохранить инструмент</button></form><section class="panel"><h2>Глазами ученика</h2><div id="tool-preview">' +
      activity(state) +
      "</div></section></div>",
  );
}
function shareLessonExercise() {
  if (!hasExercise(state)) {
    return '<a class="btn primary" href="#tools">Подготовить упражнение</a>';
  }
  const quiz = {
    title: state.title,
    question: state.question,
    answer: state.answer,
    extra: cleanExtra(state.extra),
    focus: state.focus === "review" ? "review" : "quiz",
  };
  const url = new URL(location.href);
  url.hash = "exercise/" + encode(quiz);
  return (
    button("Запустить упражнение", "run", "primary") +
    '<a class="btn" id="student-exercise" target="_blank" rel="noopener noreferrer" href="' +
    esc(url.href) +
    '">Открыть у ученика</a>' +
    button("Скопировать ссылку ученику", "copy-exercise")
  );
}
function lesson() {
  const call = safeLink(state.call);
  return layout(
    nav() +
      '<h1>Занятие</h1><p class="lead">Соберите материал, откройте созвон и запустите задание, когда придёт время.</p><div class="grid2"><form class="panel" id="lesson-form">' +
      field("Имя ученика", "student", state.student, 'placeholder="Имя"') +
      field(
        "Ссылка на созвон",
        "call",
        state.call,
        'type="url" placeholder="https://..."',
      ) +
      area("Материал занятия", "materials", state.materials, 2400) +
      '<button>Сохранить подготовку</button></form><section class="panel"><h2>' +
      esc(state.student ? "Урок · " + state.student : "Экран занятия") +
      "</h2>" +
      (call
        ? '<a class="text-link" href="' +
          esc(call) +
          '" target="_blank" rel="noopener noreferrer">Открыть созвон</a>'
        : "") +
      '<div class="lesson-stage"><h3>Материал урока</h3><p style="white-space:pre-wrap">' +
      esc(
        state.materials ||
          "Здесь появится материал, который вы подготовите для занятия.",
      ) +
      '</p></div><div class="controls">' +
      shareLessonExercise() +
      '</div><div id="lesson-activity"></div></section></div>',
  );
}
function encode(p) {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
function decode(txt) {
  if (txt.length > 45000) throw Error();
  return cleanProfile(
    JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(txt.replaceAll("-", "+").replaceAll("_", "/")),
          (s) => s.charCodeAt(0),
        ),
      ),
    ),
  );
}
function render() {
  const page = route(),
    home = ["home", "examples"].includes(page);
  landing.hidden = !home;
  root.hidden = home;
  const entry = document.querySelector("[data-entry]");
  entry.href = state.created ? "#desk" : "#start";
  activeQuestion = state;
  if (home) {
    root.innerHTML = "";
    requestAnimationFrame(() =>
      page === "examples"
        ? document.querySelector("#examples").scrollIntoView()
        : window.scrollTo(0, 0),
    );
    return;
  }
  if (page === "start") root.innerHTML = state.created ? desk() : start();
  else if (page.startsWith("exercise/")) {
    try {
      const quiz = decode(page.slice("exercise/".length));
      if (!quiz.title || !quiz.question || !quiz.answer) throw Error();
      activeQuestion = quiz;
      root.innerHTML = layout(
        "<h1>Упражнение к уроку</h1>" + activity(quiz),
        true,
      );
    } catch {
      root.innerHTML = layout(
        "<h1>Не удалось открыть упражнение</h1><p>Попросите преподавателя прислать ссылку ещё раз.</p>",
        true,
      );
    }
  } else if (page.startsWith("example/") || page.startsWith("p/")) {
    try {
      const demo = page.startsWith("example/");
      const id = page.split("/")[1];
      if (demo && !Object.hasOwn(starters, id)) throw Error();
      const p = demo ? { ...initial, ...starters[id], focus: id } : decode(id);
      activeQuestion = p;
      root.innerHTML = layout(
        '<a class="text-link" href="' +
          (demo ? "#examples" : "#home") +
          '">' +
          (demo ? "К примерам" : "Клариус") +
          '</a><p class="lead">' +
          (demo ? "Пример страницы преподавателя" : "Страница преподавателя") +
          "</p>" +
          profile(p) +
          (demo
            ? '<div class="controls"><a class="btn primary" href="#start">Собрать свой кабинет</a></div>'
            : ""),
        true,
      );
    } catch {
      root.innerHTML = layout(
        '<h1>Ссылка не открылась</h1><a href="#home">На главную</a>',
        true,
      );
    }
  } else if (["desk", "editor", "tools", "lesson"].includes(page))
    root.innerHTML = state.created
      ? { desk, editor, tools: toolsView, lesson }[page]()
      : start();
  else
    root.innerHTML = layout(
      '<h1>Страница не найдена</h1><a href="#home">На главную</a>',
    );
  window.scrollTo({ top: 0, behavior: "instant" });
}
function formData(form) {
  return Object.fromEntries(new FormData(form));
}
function updateProfile(form) {
  const v = formData(form);
  Object.assign(state, {
    name: v.name,
    subject: v.subject,
    about: v.about,
    contact: v.contact,
    theme: v.theme,
    visible: new FormData(form).getAll("visible"),
  });
  save();
}
function updateTool(form) {
  const v = formData(form);
  return {
    ...state,
    title: v.title,
    question: v.question,
    answer: v.answer,
    extra: readExtra(v.extraText || ""),
  };
}
root.addEventListener("input", (e) => {
  const form = e.target.form;
  if (form?.id === "profile-form") {
    updateProfile(form);
    document.querySelector("#preview").innerHTML = profile(state, mini);
  }
  if (form?.id === "tool-form" && e.target.name !== "preset") {
    activeQuestion = updateTool(form);
    document.querySelector("#tool-preview").innerHTML =
      activity(activeQuestion);
  }
});
root.addEventListener("change", async (e) => {
  if (e.target.matches("[data-widget]")) {
    const hidden = new Set(state.hiddenWidgets || []);
    if (e.target.checked) hidden.delete(e.target.value);
    else hidden.add(e.target.value);
    state.hiddenWidgets = [...hidden];
    save();
    refreshDashboardSettings();
    return;
  }
  if (e.target.name === "avatarFile" && e.target.files[0]) {
    try {
      state.avatar = await squareAvatar(e.target.files[0]);
      save();
      render();
      message("Фотография добавлена.");
    } catch (err) {
      message(err.message || "Не удалось прочитать изображение.");
    }
    return;
  }
  if (e.target.name === "preset" && starters[e.target.value]) {
    const p = starters[e.target.value];
    const form = e.target.form;
    for (const k of ["title", "question", "answer"])
      form.elements[k].value = p[k];
    activeQuestion = { ...updateTool(form), focus: e.target.value };
    document.querySelector("#tool-preview").innerHTML =
      activity(activeQuestion);
  }
});
root.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const v = formData(form);
  if (form.classList.contains("attempt")) {
    const norm = (str) =>
      str
        .toLowerCase()
        .trim()
        .replaceAll(",", ".")
        .replaceAll("−", "-")
        .replace(/\s+/g, " ");
    const index = Number(form.dataset.index);
    const questions = [activeQuestion, ...cleanExtra(activeQuestion.extra)];
    const ok = norm(v.response) === norm(questions[index].answer);
    const out = form.querySelector(".result");
    out.hidden = false;
    out.textContent = ok ? "Верно!" : "Пока не совпало. Попробуйте ещё раз.";
    if (ok && questions.length > 1) {
      if (index + 1 < questions.length) {
        out.insertAdjacentHTML(
          "beforeend",
          '<div class="controls">' +
            button("Следующий вопрос", "next-" + (index + 1)) +
            "</div>",
        );
      } else out.textContent = "Верно! Квиз завершён.";
    }
    return;
  }
  if (form.id === "start-form") {
    const p = starters[v.focus];
    if (!v.name.trim() || !v.subject.trim()) {
      message("Заполните имя и предмет.");
      return;
    }
    Object.assign(state, {
      created: true,
      name: v.name.trim(),
      subject: v.subject.trim(),
      focus: v.focus,
      title: p?.title || "Моё упражнение",
      question: p?.question || "",
      answer: p?.answer || "",
      about: p?.about || "",
    });
    save();
    go("desk");
  }
  if (form.id === "tool-form") {
    const extraLines = (v.extraText || "")
      .split("\n")
      .filter((line) => line.trim());
    if (extraLines.length !== readExtra(v.extraText || "").length) {
      message(
        "Укажите вопрос и ответ через | в каждой строке. Можно добавить до пяти вопросов.",
      );
      return;
    }
    if (!v.question.trim() || !v.answer.trim() || !v.title.trim()) {
      message("Добавьте название, вопрос и правильный ответ.");
      return;
    }
    Object.assign(state, {
      title: v.title,
      question: v.question,
      answer: v.answer,
      extra: readExtra(v.extraText || ""),
      focus: v.preset || state.focus,
    });
    activeQuestion = state;
    save();
    render();
    message("Упражнение сохранено. Оно доступно на экране урока.");
  }
  if (form.id === "lesson-form") {
    if (v.call && !safeLink(v.call)) {
      message("Укажите ссылку https.");
      return;
    }
    Object.assign(state, {
      student: v.student,
      call: v.call,
      materials: v.materials,
    });
    save();
    render();
    message("Подготовка к уроку сохранена.");
  }
  if (form.id === "profile-form") {
    if (!v.name.trim() || !v.subject.trim()) {
      message("Укажите имя и предмет для публичной страницы.");
      return;
    }
    if (v.contact && !safeLink(v.contact)) {
      message("Укажите ссылку для связи через https.");
      return;
    }
    updateProfile(form);
    const p = cleanProfile(state);
    if (!p.visible.includes("contact")) p.contact = "";
    if (!p.visible.includes("about")) p.about = "";
    if (!p.visible.includes("sample"))
      Object.assign(p, { question: "", answer: "", title: "", extra: [] });
    state.published = p;
    save();
    document.querySelector("#share-result").innerHTML = publishedLink();
    document
      .querySelector("#share-result")
      .scrollIntoView({ block: "nearest" });
  }
});
customElements.define(
  "studio-business-card",
  class extends HTMLElement {
    async connectedCallback() {
      const canvas = await businessCard(
        cleanProfile(state),
        themes[state.theme],
      );
      if (this.isConnected) {
        canvas.style.cssText =
          "width:100%;height:auto;border-radius:16px;display:block";
        this.replaceChildren(canvas);
      }
    }
  },
);
async function png() {
  const canvas = await businessCard(cleanProfile(state), themes[state.theme]);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "klaryus-card.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }, "image/png");
}
root.addEventListener("click", async (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "full" || action === "mini") {
    mini = action === "mini";
    document.querySelector("#preview").innerHTML = profile(state, mini);
  }
  if (action.startsWith("raise-")) {
    const order = dashboardOrder(),
      index = order.indexOf(action.slice(6));
    if (index > 0) {
      [order[index - 1], order[index]] = [order[index], order[index - 1]];
      state.dashboardOrder = order;
      save();
      refreshDashboardSettings();
    }
  }
  if (action.startsWith("up-")) {
    const i = state.order.indexOf(action.slice(3));
    if (i > 0) {
      [state.order[i - 1], state.order[i]] = [
        state.order[i],
        state.order[i - 1],
      ];
      save();
      render();
    }
  }
  if (action === "run") {
    document.querySelector("#lesson-activity").innerHTML = activity(state);
    activeQuestion = state;
  }
  if (action === "copy-exercise") {
    const url = document.querySelector("#student-exercise").href;
    try {
      await navigator.clipboard.writeText(url);
      message("Ссылка на упражнение скопирована.");
    } catch {
      const notice = document.querySelector("#notice");
      notice.innerHTML =
        '<label>Скопируйте ссылку на упражнение<input readonly value="' +
        esc(url) +
        '"></label>';
      notice.hidden = false;
      notice.querySelector("input").select();
    }
  }
  if (action.startsWith("next-")) {
    const sheet = e.target.closest(".sheet");
    sheet.outerHTML = activity(activeQuestion, Number(action.slice(5)));
  }
  if (action === "remove-avatar") {
    state.avatar = "";
    save();
    render();
  }
  if (action === "png") await png();
  if (action === "copy") {
    const input = document.querySelector("#public-url");
    try {
      await navigator.clipboard.writeText(input.value);
      message("Ссылка скопирована.");
    } catch {
      input.select();
      message("Ссылка выделена для копирования.");
    }
  }
});
window.addEventListener("hashchange", render);
render();
