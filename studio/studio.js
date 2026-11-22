import { examples, interpret, styleOptions } from "./guide.js";
import { cleanLook, renderWorld, worldLooks } from "./worlds.js";
import { handleWorkspace, renderWorkspace } from "./workspace.js";
import {
  demoDeskLabel,
  handleDemoDesk,
  renderDemoDesk,
} from "./desk-examples.js";
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
const authorSectionIds = ["custom-1", "custom-2", "custom-3"];
const sectionTitleLimit = 70;
const sectionBodyLimit = 420;
const maxSnapshotLength = 45000;
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
starters.reading = {
  about:
    "Читаем вслух, замечаем детали и сверяем свои догадки с текстом. На занятие можно принести вопрос или любимый фрагмент.",
  theme: "warm",
  title: "Образ в одной строке",
  question:
    "«Фонарь зевнул и погас». Как называется приём, при котором фонарь ведёт себя как человек?",
  answer: "олицетворение",
};
for (const [id, item] of Object.entries(examples)) {
  Object.assign(starters[id], { ...item, look: worldLooks[item.world] });
}
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
      ["tools", "Упражнения"],
      ["lesson", "Урок"],
      ["configure", "Настроить по описанию"],
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
let setupSource = "atelier";
let draftDescription = "";
let fromRegistration = false;
function options(name, all, selected) {
  return (
    '<select name="' +
    name +
    '">' +
    Object.entries(all)
      .map(
        ([key, label]) =>
          '<option value="' +
          key +
          '"' +
          (selected === key ? " selected" : "") +
          ">" +
          label +
          "</option>",
      )
      .join("") +
    "</select>"
  );
}
function setupPreview(config) {
  const { look, deskLayout } = config;
  return (
    '<img src="./media/' +
    look.world +
    '.webp" alt=""><div><strong>' +
    styleOptions.layout[look.layout] +
    "</strong><span>" +
    styleOptions.background[look.background] +
    " · " +
    styleOptions.font[look.font] +
    "</span><span>Рабочая область — " +
    styleOptions.deskLayout[deskLayout].toLowerCase() +
    "</span></div>"
  );
}
function start() {
  const editing = state.created;
  if (editing && !draftDescription) {
    setupSource = cleanProfile(state).look.world;
    draftDescription = state.description || "";
  }
  const config = interpret(draftDescription, setupSource);
  return layout(
    '<div class="guide-window"><h1>Каким будет ваш кабинет?</h1>' +
      (fromRegistration && !editing
        ? '<p class="register-note">Регистрация открылась в Клариусе. После регистрации вернитесь в эту вкладку для настройки.</p>'
        : "") +
      '<form id="start-form"><label for="guide-prompt">Расскажите, как вы ведёте занятия</label>' +
      '<textarea id="guide-prompt" name="description" rows="4" maxlength="900" required placeholder="Что преподаёте? С чего начинаете урок? Как выглядит место, в котором вам приятно работать?">' +
      esc(draftDescription) +
      "</textarea>" +
      '<div class="prompt-ideas"><span>Взять за основу</span>' +
      Object.entries(examples)
        .map(
          ([id, item]) =>
            '<button type="button" data-prompt="' +
            id +
            '">' +
            item.short +
            "</button>",
        )
        .join("") +
      "</div>" +
      '<div class="guide-result" id="guide-result">' +
      setupPreview(config) +
      "</div>" +
      '<details class="guide-refine"><summary>Уточнить название и рабочий стол</summary><label>Название вашей страницы<input name="siteTitle" maxlength="100" placeholder="Например, Физика на кухне"></label><label>Вид рабочего стола' +
      options(
        "deskChoice",
        { auto: "Подобрать по описанию", ...styleOptions.deskLayout },
        "auto",
      ) +
      "</label></details>" +
      '<div class="guide-bottom"><button class="primary">' +
      (editing ? "Применить оформление" : "Собрать мой кабинет") +
      "</button>" +
      (editing
        ? '<a href="#desk">Вернуться в кабинет</a>'
        : "<small>Черновик сохранится в этом браузере.</small>") +
      "</div></form></div>",
    true,
  );
}
function desk() {
  return layout(nav() + renderWorkspace(state));
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
  // Keep unpublished text exclusively in the local draft. Both QR and public
  // snapshot consumers receive only these explicitly visible author sections.
  const sections = {};
  for (const id of authorSectionIds) {
    const section = input.sections?.[id];
    if (
      !input.visible?.includes(id) ||
      typeof section?.title !== "string" ||
      typeof section?.body !== "string"
    )
      continue;
    const title = section.title.trim().slice(0, sectionTitleLimit);
    const body = section.body.trim().slice(0, sectionBodyLimit);
    if (title && body) sections[id] = { title, body };
  }
  const list = (arr) =>
    Array.isArray(arr)
      ? [
          ...new Set(
            arr.filter(
              (k) => Object.hasOwn(blocks, k) || Object.hasOwn(sections, k),
            ),
          ),
        ]
      : Object.keys(blocks);
  return {
    name: text("name"),
    headline: text("headline", 100),
    look: cleanLook(
      input.look,
      input.theme === "green"
        ? "observatory"
        : input.theme === "warm"
          ? "library"
          : "atelier",
    ),
    portrait: ["anna", "ilya", "marina"].includes(input.portrait)
      ? input.portrait
      : "",
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
    sections,
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
function profile(input, mini = false, standalone = false) {
  if (mini)
    return '<studio-business-card aria-label="Предпросмотр визитки"></studio-business-card>';
  const p = cleanProfile(input);
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
  return renderWorld(p, { blocksHtml: parts, standalone });
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
  const look = cleanProfile(state).look;
  const selectStyle = (key, label) =>
    "<label>" + label + options(key, styleOptions[key], look[key]) + "</label>";
  const manage = state.order
    .map((id, i) => {
      const custom = authorSectionIds.includes(id);
      if (!custom && !Object.hasOwn(blocks, id)) return "";
      const section = custom && state.sections?.[id];
      const checkLabel = custom ? "Показывать этот раздел" : blocks[id];
      const checked = state.visible.includes(id) ? " checked" : "";
      const controls =
        '<div class="check-row"><label class="check"><input type="checkbox" name="visible" value="' +
        id +
        '"' +
        checked +
        ">" +
        checkLabel +
        "</label>" +
        button("Выше", "up-" + id, i === 0 ? "hidden" : "") +
        "</div>";
      if (!custom) return controls;
      const fields =
        '<label>Заголовок раздела<input name="' +
        id +
        '-title" type="text" maxlength="' +
        sectionTitleLimit +
        '" value="' +
        esc(section?.title || "") +
        '" placeholder="Например, программа занятий"></label>' +
        area(
          "Текст раздела",
          id + "-body",
          section?.body || "",
          sectionBodyLimit,
        );
      return (
        '<div class="wx-author-editor">' +
        fields +
        controls +
        button("Удалить раздел", "delete-" + id) +
        "</div>"
      );
    })
    .join("");
  const canAddSection = authorSectionIds.some(
    (id) => !state.order.includes(id),
  );
  return layout(
    nav() +
      '<h1>Моя страница</h1><p class="lead">Соберите сайт, который отправите ученикам и родителям.</p><div class="editor-split"><form id="profile-form" class="panel editor-controls"><h2>Оформление</h2>' +
      selectStyle("world", "Иллюстрация обложки") +
      selectStyle("layout", "Композиция страницы") +
      selectStyle("font", "Шрифт заголовков") +
      selectStyle("background", "Фон страницы") +
      '<label class="accent-control">Акцентный цвет<input type="color" name="accent" value="' +
      esc(look.accent) +
      '"></label>' +
      "<h2>Содержание</h2>" +
      field(
        "Заголовок страницы",
        "headline",
        state.headline,
        'placeholder="Например, Читаем между строк"',
      ) +
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
      "<fieldset><legend>Публичные блоки</legend>" +
      manage +
      (canAddSection
        ? button("Добавить свой раздел", "add-section")
        : '<p class="hint">Добавлены все три своих раздела.</p>') +
      '</fieldset><div class="controls"><button class="primary">Создать ссылку</button>' +
      button("Скачать визитку", "png") +
      '</div><small>Ссылка содержит снимок выбранных публичных полей. Скопировавший её увидит именно эту версию.</small></form><div class="editor-preview"><div class="controls">' +
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
      '<h1>Мои упражнения</h1><p class="lead">Создайте упражнение для повторения. Шаблон можно менять и использовать на разных уроках.</p><div class="grid2"><form id="tool-form" class="panel"><label>Начать с примера<select name="preset"><option value="">Своё упражнение</option><option value="quiz">Квиз по дробям</option><option value="review">Найти пропущенный корень</option></select></label>' +
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
      '</p></div><details class="board-space"><summary>Место для совместной доски</summary><p>Для совместных записей пока можно открыть демонстрацию экрана в созвоне.</p></details><div class="controls">' +
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
  if (txt.length > maxSnapshotLength) throw Error();
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
  entry.href = state.created ? "#desk" : "https://app.klaryus.ru/signup";
  entry.textContent = state.created ? "Мой кабинет" : "Создать кабинет";
  entry.target = state.created ? "_self" : "_blank";
  activeQuestion = state;
  const create = landing.querySelector("[data-create]");
  create.textContent = state.created
    ? "Открыть мой кабинет"
    : "Создать кабинет";
  create.href = entry.href;
  create.target = entry.target;
  if (home) {
    root.innerHTML = "";
    requestAnimationFrame(() =>
      page === "examples"
        ? document.querySelector("#examples").scrollIntoView()
        : window.scrollTo(0, 0),
    );
    return;
  }
  if (page === "configure" || page === "setup") root.innerHTML = start();
  else if (page === "start") root.innerHTML = state.created ? desk() : start();
  else if (page.startsWith("example-desk/")) {
    const [, id, view] = page.split("/");
    root.innerHTML = layout(renderDemoDesk(id, view), Boolean(view));
  } else if (page.startsWith("exercise/")) {
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
      root.innerHTML =
        '<div class="site-view"><div class="site-toolbar"><a href="' +
        (demo ? "#examples" : "#home") +
        '">' +
        (demo ? "← Все кабинеты" : "← Клариус") +
        "</a>" +
        (demo
          ? '<a href="#example-desk/' +
            id +
            '">' +
            demoDeskLabel(id) +
            '</a><a href="#setup" data-use="' +
            id +
            '">Взять оформление за основу</a>'
          : "") +
        "</div>" +
        profile(p, false, true) +
        "</div>";
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
  const sections = {};
  for (const id of authorSectionIds) {
    if (state.order.includes(id))
      sections[id] = {
        title: v[id + "-title"] || "",
        body: v[id + "-body"] || "",
      };
  }
  Object.assign(state, {
    name: v.name,
    subject: v.subject,
    about: v.about,
    contact: v.contact,
    headline: v.headline,
    look: cleanLook({
      world: v.world,
      layout: v.layout,
      font: v.font,
      background: v.background,
      accent: v.accent,
    }),
    visible: new FormData(form).getAll("visible"),
    sections,
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
  if (form?.id === "start-form") {
    draftDescription = form.elements.description.value;
    const config = interpret(draftDescription, setupSource);
    if (form.elements.deskChoice.value !== "auto")
      config.deskLayout = form.elements.deskChoice.value;
    document.querySelector("#guide-result").innerHTML = setupPreview(config);
  }
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
  if (route().startsWith("example-desk/")) {
    if (handleDemoDesk(form, route().split("/")[1])) redrawDesk(form, false);
    return;
  }
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
  if (form.matches("[data-workspace]") && handleWorkspace(form, state)) {
    redrawDesk(form);
    return;
  }
  if (form.id === "start-form") {
    const description = v.description.trim();
    if (!description) {
      message("Опишите хотя бы одну деталь кабинета.");
      return;
    }
    const config = interpret(description, setupSource);
    const newCabinet = !state.created;
    Object.assign(state, {
      created: true,
      description,
      look: config.look,
      deskLayout: Object.hasOwn(styleOptions.deskLayout, v.deskChoice)
        ? v.deskChoice
        : config.deskLayout,
      name: config.name || state.name,
      subject: config.subject || state.subject,
      headline: v.siteTitle.trim() || config.headline || state.headline || "",
      dashboardOrder: [
        ...new Set([config.priority, ...(state.dashboardOrder || [])]),
      ],
    });
    if (newCabinet)
      Object.assign(state, {
        title: "Моё упражнение",
        question: "",
        answer: "",
        focus: "own",
      });
    save();
    go("desk");
    return;
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
    for (const id of authorSectionIds) {
      if (!state.visible.includes(id)) continue;
      const section = state.sections[id];
      if (!section?.title.trim() || !section.body.trim()) {
        const incomplete = section?.title.trim() ? "body" : "title";
        form.elements.namedItem(id + "-" + incomplete)?.focus();
        message("Заполните заголовок и текст своего раздела или скройте его.");
        return;
      }
    }
    const p = cleanProfile(state);
    if (!p.visible.includes("contact")) p.contact = "";
    if (!p.visible.includes("about")) p.about = "";
    if (!p.visible.includes("sample"))
      Object.assign(p, { question: "", answer: "", title: "", extra: [] });
    if (encode(p).length > maxSnapshotLength) {
      message(
        "Ссылка получилась слишком длинной. Сократите один из текстов или уберите фотографию.",
      );
      return;
    }
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
      const canvas = await businessCard(cleanProfile(state), cardPalette());
      if (this.isConnected) {
        canvas.style.cssText =
          "width:100%;height:auto;border-radius:16px;display:block";
        this.replaceChildren(canvas);
      }
    }
  },
);
function cardPalette() {
  const look = cleanProfile(state).look;
  return [
    "",
    look.accent,
    look.world === "library"
      ? "#f3eee0"
      : look.world === "observatory"
        ? "#dfebea"
        : "#fff0df",
  ];
}
async function png() {
  const canvas = await businessCard(cleanProfile(state), cardPalette());
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
  if (route().startsWith("example-desk/")) {
    const control = e.target.closest(
      "button[data-workspace],button[data-demo]",
    );
    if (control && handleDemoDesk(control, route().split("/")[1]))
      redrawDesk(control, false);
    return;
  }
  const widget = e.target.closest("button[data-workspace]");
  if (widget && handleWorkspace(widget, state)) {
    redrawDesk(widget);
    return;
  }
  const promptId = e.target.closest("[data-prompt]")?.dataset.prompt;
  if (Object.hasOwn(examples, promptId)) {
    const item = examples[promptId];
    setupSource = item.world;
    draftDescription = item.prompt;
    const prompt = document.querySelector("#guide-prompt");
    prompt.value = draftDescription;
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
    prompt.focus();
    return;
  }
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "add-section") {
    const id = authorSectionIds.find((item) => !state.order.includes(item));
    if (!id) return;
    state.order = [...state.order, id];
    state.visible = [...state.visible, id];
    state.sections = { ...state.sections, [id]: { title: "", body: "" } };
    save();
    render();
    document.querySelector('[name="' + id + '-title"]')?.focus();
    return;
  }
  if (
    action.startsWith("delete-") &&
    authorSectionIds.includes(action.slice(7))
  ) {
    const id = action.slice(7);
    state.order = state.order.filter((item) => item !== id);
    state.visible = state.visible.filter((item) => item !== id);
    delete state.sections[id];
    save();
    render();
    document.querySelector('[data-action="add-section"]')?.focus();
    return;
  }
  if (action === "full" || action === "mini") {
    mini = action === "mini";
    document.querySelector("#preview").innerHTML = profile(state, mini);
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
function redrawDesk(control, persist = true) {
  const opened = [...root.querySelectorAll("details")].map((item) => item.open);
  const before = window.scrollY;
  if (persist) save();
  render();
  root.querySelectorAll("details").forEach((item, index) => {
    item.open = Boolean(opened[index]);
  });
  if (control.dataset.workspace === "close-settings") {
    const settings = root.querySelector(".ws-settings");
    settings.open = false;
    settings.querySelector("summary").focus({ preventScroll: true });
  } else {
    const next = [
      ...root.querySelectorAll("[data-workspace], [data-demo]"),
    ].find(
      (item) =>
        item.dataset.workspace === control.dataset.workspace &&
        item.dataset.demo === control.dataset.demo &&
        item.dataset.id === control.dataset.id,
    );
    (next?.matches("form") ? next.querySelector("input,button") : next)?.focus({
      preventScroll: true,
    });
  }
  window.scrollTo({ top: before, behavior: "instant" });
}

const gallery = document.getElementById("example-gallery");
function displayExample(id) {
  const e = examples[id];
  const feature = document.getElementById("feature-cover");
  feature.dataset.world = e.world;
  document.getElementById("feature-image").src = "./media/" + e.world + ".webp";
  document.getElementById("feature-title").textContent = e.headline;
  document.getElementById("feature-author").textContent =
    e.name + " · " + e.subject;
  document.getElementById("feature-link").href = "#example/" + id;
  document
    .getElementById("feature-link")
    .setAttribute("aria-label", "Открыть страницу — " + e.headline);
  document
    .querySelectorAll("[data-feature]")
    .forEach((btn) =>
      btn.setAttribute("aria-pressed", String(btn.dataset.feature === id)),
    );
}
gallery.innerHTML = Object.entries(examples)
  .map(
    ([id, e]) =>
      '<a class="catalog-row" href="#example/' +
      id +
      '"><img src="./media/' +
      e.portrait +
      '.webp" alt="" loading="lazy"><div><strong>' +
      e.name +
      "</strong><small>" +
      e.subject +
      "</small></div><span>" +
      e.description +
      '</span><b>Открыть <span aria-hidden="true">↗</span></b></a>',
  )
  .join("");
const tabs = document.createElement("div");
tabs.className = "folder-tabs";
tabs.setAttribute("aria-label", "Выбрать пример кабинета");
tabs.innerHTML = Object.entries(examples)
  .map(
    ([id, e]) =>
      '<button type="button" data-feature="' +
      id +
      '">' +
      e.short +
      "</button>",
  )
  .join("");
document.getElementById("feature-cover").prepend(tabs);
displayExample("quiz");
document.addEventListener("click", (event) => {
  const el = event.target.closest("a,button");
  if (!el) return;
  if (el.dataset.feature) displayExample(el.dataset.feature);
  if (el.hasAttribute("data-use") && examples[el.dataset.use]) {
    const e = examples[el.dataset.use];
    if (state.created) {
      event.preventDefault();
      if (
        !confirm(
          "Применить оформление примера к вашей странице? Данные и занятия сохранятся.",
        )
      )
        return;
      state.look = { ...worldLooks[e.world] };
      save();
      go("editor");
      return;
    }
    setupSource = e.world;
    draftDescription = e.prompt;
    fromRegistration = false;
  }
  if (el.matches("[data-create], [data-entry]")) {
    if (state.created) {
      event.preventDefault();
      go("desk");
      return;
    }
    fromRegistration = true;
    setTimeout(() => go("setup"), 0);
  }
});
window.addEventListener("hashchange", render);
render();
