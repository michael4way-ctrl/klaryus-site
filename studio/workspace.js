// Local-only teacher workspace. Public profiles are built independently.
const layouts = { agenda: "Ежедневник", board: "Доска", reading: "Тетрадь" };
const fonts = {
  auto: "Как в выбранном виде",
  sans: "Гротеск",
  book: "Литерата",
  hand: "Панголин",
  mono: "Моноширинный",
};
const palettes = {
  auto: "Как в выбранном виде",
  cobalt: "Чернила",
  forest: "Хвоя",
  wine: "Гранат",
};
const backgrounds = {
  auto: "Как в выбранном виде",
  paper: "Тёплая бумага",
  grid: "Клетка",
  clean: "Белый лист",
};
const styleKey = (options, key) => (Object.hasOwn(options, key) ? key : "auto");
const widgets = {
  lesson: "Урок",
  calendar: "Расписание",
  preparation: "Подготовка",
  app: "Ученики",
  homework: "Домашние работы",
  tool: "Методы и инструменты",
  profile: "Моя страница",
};
const app = "https://app.klaryus.ru/app";
const html = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const array = (value) => (Array.isArray(value) ? value : []);
const textLink = (url, text) =>
  `<a class="ws-link" href="${html(url)}">${html(text)}</a>`;
const btn = (action, text, id = "", extra = "") =>
  `<button type="button" class="ws-action" data-workspace="${action}" data-id="${html(id)}" ${extra}>${html(text)}</button>`;
function ordered(state) {
  return [
    ...new Set([...array(state.dashboardOrder), ...Object.keys(widgets)]),
  ].filter((k) => Object.hasOwn(widgets, k));
}
function dateParts(value, options) {
  return new Intl.DateTimeFormat("ru-RU", options).format(value);
}
function localDay(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function nowLocal() {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(0);
  date.setHours(date.getHours() + 1);
  return (
    localDay(date) + "T" + String(date.getHours()).padStart(2, "0") + ":00"
  );
}
function eventTime(event) {
  return dateParts(new Date(event.at), { hour: "2-digit", minute: "2-digit" });
}
function savedEvents(state) {
  return array(state.workspaceEvents)
    .filter((event) => event && Number.isFinite(new Date(event.at).getTime()))
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
}
function upcoming(state) {
  const now = Date.now();
  return savedEvents(state).filter(
    (e) => new Date(e.at).getTime() + Number(e.minutes || 60) * 60000 > now,
  );
}
function uniqueStudents(state) {
  return [
    ...new Set(
      [
        ...array(state.workspaceStudents),
        state.student,
        ...savedEvents(state).map((e) => e.student),
      ].filter(Boolean),
    ),
  ];
}
function weekStrip(events) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const id = localDay(day);
    return `<time class="ws-day${id === localDay(today) ? " current" : ""}" datetime="${id}">
      <span>${dateParts(day, { weekday: "short" })}</span><strong>${day.getDate()}</strong>
      <i class="${events.some((e) => e.at.startsWith(id)) ? "booked" : ""}"></i></time>`;
  }).join("");
}
function header(state, layout) {
  const today = new Date();
  return `<header class="ws-head"><div><p class="ws-dayline">${dateParts(today, { weekday: "long", day: "numeric", month: "long" })}</p>
    <h1>Мой кабинет</h1><p class="ws-byline">${html(state.name || "Преподаватель")}${state.subject ? " · " + html(state.subject) : ""}</p>
    </div><div class="ws-chooser" role="group" aria-label="Вид кабинета">
    ${Object.entries(layouts)
      .map(([key, label]) =>
        btn("layout", label, key, `aria-pressed="${key === layout}"`),
      )
      .join("")}</div></header>`;
}
function styleControl(name, label, options, current) {
  const key = styleKey(options, current);
  return `<label>${label}<select name="${name}">${Object.entries(options)
    .map(
      ([id, title]) =>
        `<option value="${id}" ${id === key ? "selected" : ""}>${title}</option>`,
    )
    .join("")}</select></label>`;
}
function settings(state, order) {
  return `<details class="ws-settings"${state.workspaceSettingsOpen ? " open" : ""}><summary>Настроить блоки кабинета</summary>
    <form data-workspace="style" class="ws-style-form">
    ${styleControl("font", "Шрифт заголовков", fonts, state.workspaceFont)}
    ${styleControl("palette", "Палитра кабинета", palettes, state.workspacePalette)}
    ${styleControl("background", "Фон кабинета", backgrounds, state.workspaceBackground)}
    <button class="ws-confirm">Применить оформление</button></form>
    <div class="ws-settings-rows">${order
      .map((id, i) => {
        const visible = !array(state.hiddenWidgets).includes(id),
          wide =
            state.workspaceWide?.[id] ?? ["lesson", "calendar"].includes(id);
        return `<div class="ws-setting"><strong>${widgets[id]}</strong>
      <div class="ws-options">${btn("toggle", visible ? "Скрыть" : "Показать", id, `aria-label="${visible ? "Скрыть" : "Показать"} блок ${widgets[id]}"`)}
      ${btn("size", wide ? "Уже" : "Шире", id, `aria-label="Сделать блок ${widgets[id]} ${wide ? "уже" : "шире"}"`)}
      ${btn("raise", "Выше", id, `aria-label="Поднять блок ${widgets[id]}" ${i ? "" : "disabled"}`)}
      ${btn("lower", "Ниже", id, `aria-label="Опустить блок ${widgets[id]}" ${i < order.length - 1 ? "" : "disabled"}`)}</div></div>`;
      })
      .join("")}</div>${btn("close-settings", "Готово")}</details>`;
}
function eventLine(event, state) {
  return `<li><div><strong>${html(eventTime(event))} · ${html(event.student)}</strong>
    <small>${html(event.topic)} · ${event.minutes || 60} мин</small></div>
    ${state.workspaceLessonId === event.id ? textLink("#lesson", "К уроку") : btn("select-event", "Подготовить", event.id)}</li>`;
}
function calendar(state) {
  const events = savedEvents(state),
    future = upcoming(state);
  const past = events.filter((e) => !future.some((f) => f.id === e.id));
  let last = "";
  const group = (list) =>
    list
      .map((event) => {
        const day = event.at.slice(0, 10);
        const dayLabel =
          day !== last
            ? `<li class="ws-date-label">${dateParts(new Date(event.at), { weekday: "short", month: "long", day: "numeric" })}</li>`
            : "";
        last = day;
        return dayLabel + eventLine(event, state);
      })
      .join("");
  return `<div class="ws-week">${weekStrip(events)}</div>
    ${future.length ? `<ul class="ws-list">${group(future)}</ul>` : "<p>Ближайшие занятия появятся здесь после планирования.</p>"}
    <details class="ws-fold"><summary>Запланировать занятие</summary><form data-workspace="schedule" class="ws-form">
    <label>Ученик<input required maxlength="90" name="student" list="ws-learners" autocomplete="off"></label>
    <label>Тема урока<input required maxlength="160" name="topic"></label>
    <div class="ws-timing"><label>Дата и время<input required type="datetime-local" name="at" value="${nowLocal()}"></label>
    <label>Длительность<select name="minutes">${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${m === 60 ? "selected" : ""}>${m} мин</option>`).join("")}</select></label></div>
    <button class="ws-confirm">Добавить в расписание</button></form></details>
    ${past.length ? `<details class="ws-fold"><summary>Прошедшие занятия (${past.length})</summary><ul class="ws-list">${group(past.slice().reverse())}</ul></details>` : ""}`;
}
function lesson(state) {
  const selected = savedEvents(state).find(
      (e) => e.id === state.workspaceLessonId,
    ),
    soon = upcoming(state)[0];
  const event = selected || (!state.student && !state.materials ? soon : null);
  const student = state.student || event?.student;
  const nextAction =
    !selected && event
      ? btn("select-event", "Подготовить занятие", event.id)
      : textLink("#lesson", "Открыть экран урока");
  return `<div class="ws-lesson-title">${html(student || "Подготовить занятие")}</div>
    ${event ? `<div class="ws-event-meta">${dateParts(new Date(event.at), { day: "numeric", month: "short" })} · ${eventTime(event)} · ${event.minutes} мин</div>` : ""}
    <p>${html(event?.topic || (state.materials ? state.materials.slice(0, 130) : "Добавьте материалы и выберите инструмент для занятия с учеником."))}</p>
    <div class="ws-actions">${nextAction}${state.workspacePriorLesson ? btn("restore-preparation", "Вернуться к прошлой подготовке") : ""}</div>`;
}
function preparation(state) {
  const tasks = array(state.workspaceChecklist),
    done = tasks.filter((t) => t.done).length;
  return `${state.materials ? `<p class="ws-excerpt">${html(state.materials.slice(0, 450))}</p>` : ""}
    ${
      tasks.length
        ? `<div class="ws-progress"><span style="width:${(100 * done) / tasks.length}%"></span></div>
     <small>Подготовлено ${done} из ${tasks.length}</small><ul class="ws-tasks">${tasks.map((t) => `<li>${btn("check-task", t.text, t.id, `aria-pressed="${Boolean(t.done)}"`)}</li>`).join("")}</ul>`
        : "<p>Составьте список того, что понадобится к уроку.</p>"
    }
    <form data-workspace="add-task" class="ws-inline"><label>Пункт подготовки<input name="text" required maxlength="160" placeholder="Например, подобрать две задачи"></label><button>Добавить</button></form>`;
}
function learners(state) {
  const names = uniqueStudents(state);
  return `${names.length ? `<ul class="ws-learners">${names.map((name) => `<li><span aria-hidden="true">${html(name.slice(0, 1).toUpperCase())}</span>${html(name)}</li>`).join("")}</ul>` : "<p>Добавьте имя ученика, чтобы выбирать его при планировании занятий.</p>"}
    <form data-workspace="add-student" class="ws-inline"><label>Имя ученика<input name="name" required maxlength="90"></label><button>Добавить</button></form>
    ${textLink(app + "/students", "Карточки учеников в Клариусе")}`;
}
function homework() {
  return `<div class="ws-step-link"><strong>Составить работу</strong><p>Подобрать задания и отправить ученику.</p>${textLink(app + "/homework", "К домашним работам")}</div>
  <div class="ws-step-link"><strong>Проверить сдачу</strong><p>Посмотреть решение, оставить баллы и комментарий.</p>${textLink(app + "/assignments", "К выданным работам")}</div>`;
}
function methods(state) {
  const library = array(state.workspaceMethods);
  return `<div class="ws-method"><strong>${html(state.title || "Своё упражнение")}</strong>
  <p>${html(state.question || "Подготовьте первый вопрос и проверьте, как его увидит ученик.")}</p>
  <div class="ws-actions">${textLink("#tools", "Редактировать инструмент")}${state.question?.trim() && state.answer?.trim() ? btn("save-method", "В шаблоны") : ""}</div></div>
  ${library.length ? `<div class="ws-subtitle">Мои шаблоны</div><ul class="ws-list">${library.map((m) => `<li><div><strong>${html(m.title)}</strong><small>${1 + array(m.extra).length} вопр.</small></div>${btn("apply-method", "Выбрать", m.id)}</li>`).join("")}</ul>` : ""}`;
}
const renderers = {
  lesson,
  calendar,
  preparation,
  app: learners,
  homework,
  tool: methods,
  profile: (state) =>
    `<p>${state.published ? "Страница для учеников сохранена." : "Выберите, что увидят новые ученики."}</p>${textLink("#editor", "Редактор страницы")}`,
};
export function renderWorkspace(state) {
  const layout = Object.hasOwn(layouts, state.deskLayout)
    ? state.deskLayout
    : "agenda";
  const order = ordered(state);
  const content = order
    .filter((id) => !array(state.hiddenWidgets).includes(id))
    .map((id) => {
      const wide =
        state.workspaceWide?.[id] ?? ["lesson", "calendar"].includes(id);
      return `<section class="ws-widget ws-${id}${wide ? " ws-wide" : ""}" data-widget-id="${id}"><h2>${widgets[id]}</h2>${renderers[id](state)}</section>`;
    })
    .join("");
  return `<div class="ws ws-${layout}" data-layout="${layout}" data-font="${styleKey(fonts, state.workspaceFont)}" data-palette="${styleKey(palettes, state.workspacePalette)}" data-background="${styleKey(backgrounds, state.workspaceBackground)}">${header(state, layout)}${settings(state, order)}
    <div class="ws-grid">${content || "<p>Выберите блоки в настройках кабинета.</p>"}</div>
    <datalist id="ws-learners">${uniqueStudents(state)
      .map((n) => `<option value="${html(n)}"></option>`)
      .join("")}</datalist></div>`;
}
function addMethod(state) {
  if (!state.title?.trim() || !state.question?.trim() || !state.answer?.trim())
    return;
  const record = {
    title: state.title,
    question: state.question,
    answer: state.answer,
    focus: state.focus,
    extra: array(state.extra).map((q) => ({ ...q })),
  };
  const list = array(state.workspaceMethods);
  const existing = list.find((m) => m.title === record.title);
  state.workspaceMethods = existing
    ? list.map((m) => (m === existing ? { ...record, id: m.id } : m))
    : [...list, { ...record, id: crypto.randomUUID() }];
}
function selectEvent(state, id) {
  const events = savedEvents(state);
  const next = events.find((e) => e.id === id);
  if (!next || id === state.workspaceLessonId) return;
  const current = {
    student: state.student || "",
    materials: state.materials || "",
    call: state.call || "",
  };
  if (state.workspaceLessonId) {
    state.workspaceEvents = events.map((e) =>
      e.id === state.workspaceLessonId ? { ...e, draft: current } : e,
    );
  } else if (current.student || current.materials || current.call)
    state.workspacePriorLesson = current;
  state.workspaceLessonId = id;
  Object.assign(
    state,
    next.draft || { student: next.student, materials: next.topic, call: "" },
  );
}
export function handleWorkspace(element, state) {
  const action = element.dataset.workspace;
  const id = element.dataset.id;
  const data = element.tagName === "FORM" ? new FormData(element) : null;
  const value = (key) => String(data?.get(key) || "").trim();
  switch (action) {
    case "style":
      state.workspaceFont = styleKey(fonts, value("font"));
      state.workspacePalette = styleKey(palettes, value("palette"));
      state.workspaceBackground = styleKey(backgrounds, value("background"));
      state.workspaceSettingsOpen = true;
      break;
    case "layout":
      if (!Object.hasOwn(layouts, id)) return false;
      state.deskLayout = id;
      break;
    case "close-settings":
      state.workspaceSettingsOpen = false;
      break;
    case "toggle":
    case "size":
    case "raise":
    case "lower": {
      if (!Object.hasOwn(widgets, id)) return false;
      state.workspaceSettingsOpen = true;
      if (action === "toggle") {
        const old = array(state.hiddenWidgets);
        state.hiddenWidgets = old.includes(id)
          ? old.filter((k) => k !== id)
          : [...old, id];
      } else if (action === "size") {
        const old = state.workspaceWide || {};
        state.workspaceWide = {
          ...old,
          [id]: !(old[id] ?? ["lesson", "calendar"].includes(id)),
        };
      } else {
        const order = ordered(state),
          i = order.indexOf(id),
          j = i + (action === "raise" ? -1 : 1);
        if (j >= 0 && j < order.length)
          [order[i], order[j]] = [order[j], order[i]];
        state.dashboardOrder = order;
      }
      break;
    }
    case "add-student": {
      const name = value("name");
      if (!name) return false;
      state.workspaceStudents = [
        ...new Set([...array(state.workspaceStudents), name]),
      ];
      break;
    }
    case "schedule": {
      const student = value("student"),
        topic = value("topic"),
        at = value("at");
      if (!student || !topic || !Number.isFinite(new Date(at).getTime()))
        return false;
      const minutes = Number(value("minutes"));
      if (![30, 45, 60, 90, 120].includes(minutes)) return false;
      state.workspaceEvents = [
        ...array(state.workspaceEvents),
        { id: crypto.randomUUID(), student, topic, at, minutes },
      ];
      break;
    }
    case "select-event":
      selectEvent(state, id);
      break;
    case "restore-preparation": {
      if (!state.workspacePriorLesson) return false;
      const draft = {
        student: state.student,
        materials: state.materials,
        call: state.call,
      };
      state.workspaceEvents = savedEvents(state).map((e) =>
        e.id === state.workspaceLessonId ? { ...e, draft } : e,
      );
      Object.assign(state, state.workspacePriorLesson);
      delete state.workspacePriorLesson;
      delete state.workspaceLessonId;
      break;
    }
    case "add-task": {
      const label = value("text");
      if (!label) return false;
      state.workspaceChecklist = [
        ...array(state.workspaceChecklist),
        { id: crypto.randomUUID(), text: label, done: false },
      ];
      break;
    }
    case "check-task":
      state.workspaceChecklist = array(state.workspaceChecklist).map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      break;
    case "save-method":
      addMethod(state);
      break;
    case "apply-method": {
      const m = array(state.workspaceMethods).find((item) => item.id === id);
      if (!m) return false;
      // Keep the active, potentially edited method before switching.
      addMethod(state);
      Object.assign(state, {
        title: m.title,
        question: m.question,
        answer: m.answer,
        focus: m.focus,
        extra: array(m.extra).map((q) => ({ ...q })),
      });
      break;
    }
    default:
      return false;
  }
  return true;
}
