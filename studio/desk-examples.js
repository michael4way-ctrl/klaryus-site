import { examples } from "./guide.js";
import { handleWorkspace, renderWorkspace } from "./workspace.js";

const seeds = {
  quiz: {
    owner: "Анны",
    layout: "board",
    order: ["lesson", "preparation", "tool", "calendar"],
    sessions: [
      [
        "Лиза",
        "Доли на круговой диаграмме",
        "Нарисовать круг, разделить его на восемь секторов и закрасить три. Сравнить рисунок с записью дроби.",
      ],
      [
        "Миша",
        "Симметрия на клетчатой бумаге",
        "Провести ось через центр листа. Дорисовать отражение трёх фигур по клеткам.",
      ],
    ],
    tasks: ["Подготовить цветные круги", "Распечатать лист в клетку"],
    exercises: [
      [
        "Цветные доли",
        "Какую долю круга занимают три сектора из восьми? Запиши дробью.",
        "3/8",
      ],
      ["Ось симметрии", "Сколько осей симметрии у квадрата?", "4"],
    ],
    homework: "Нарисуй пиццу из восьми кусков и подпиши долю трёх из них.",
  },
  review: {
    owner: "Ильи",
    layout: "agenda",
    order: ["homework", "lesson", "calendar", "app"],
    sessions: [
      [
        "Тимур",
        "Ловушка при сокращении дроби",
        "Разобрать решение (x² − 9)/(x − 3). Сначала записать ограничение, затем сократить дробь.",
      ],
      [
        "Саша",
        "Производная и касательная",
        "На рисунке отметить точку касания. Сопоставить наклон прямой и значение производной.",
      ],
    ],
    tasks: [
      "Отметить потерянное ограничение",
      "Подобрать задачу на повторение",
    ],
    exercises: [
      [
        "Найти потерянное условие",
        "Какое значение x нужно исключить у дроби (x² − 9)/(x − 3)?",
        "3",
      ],
      ["Касательная", "Чему равна производная x² в точке x = 2?", "4"],
    ],
    homework:
      "Для двух дробно-рациональных выражений запиши область допустимых значений до сокращения.",
  },
  reading: {
    owner: "Марины",
    layout: "reading",
    order: ["preparation", "lesson", "tool", "calendar"],
    sessions: [
      [
        "Алиса",
        "Кто рассказывает «Капитанскую дочку»",
        "Открыть первую главу. Отделить реплики юного Гринёва от замечаний взрослого рассказчика.",
      ],
      [
        "Павел",
        "Смена настроения в «Парусе»",
        "Прочитать вслух три строфы. Найти в каждой образ, который меняет настроение.",
      ],
    ],
    tasks: ["Выбрать фрагмент первой главы", "Отметить смену голоса на полях"],
    exercises: [
      [
        "Голос рассказчика",
        "Какова фамилия рассказчика «Капитанской дочки»?",
        "Гринёв",
      ],
      [
        "На полях стихотворения",
        "Сколько строф в стихотворении Лермонтова «Парус»? Ответь числом.",
        "3",
      ],
    ],
    homework:
      "Выпиши две реплики рассказчика и объясни, как его возраст меняет взгляд на события.",
  },
};
const desks = new Map();
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function demoDeskLabel(id) {
  return "Рабочий стол " + seeds[id].owner;
}
function createDesk(id) {
  const seed = seeds[id];
  const events = seed.sessions.map(([student, topic, materials], index) => {
    const day = new Date();
    day.setDate(day.getDate() + 1 + index);
    const local = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, "0"),
      String(day.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      id: "lesson-" + index,
      at: local + (index ? "T17:30" : "T15:00"),
      minutes: index ? 60 : 45,
      student,
      topic,
      draft: { student, materials, call: "" },
    };
  });
  const methods = seed.exercises.map(([title, question, answer], index) => ({
    id: "method-" + index,
    focus: id,
    title,
    question,
    answer,
    extra: [],
  }));
  return {
    ...examples[id],
    ...events[0].draft,
    ...methods[0],
    published: true,
    workspaceEvents: events,
    workspaceLessonId: events[0].id,
    workspaceMethods: methods,
    workspaceStudents: events.map((e) => e.student),
    workspaceChecklist: seed.tasks.map((text, index) => ({
      id: "task-" + index,
      text,
      done: index === 0,
    })),
    deskLayout: seed.layout,
    dashboardOrder: seed.order,
  };
}
function deskFor(id) {
  if (!desks.has(id)) desks.set(id, createDesk(id));
  return desks.get(id);
}
function dest(id, view = "") {
  return "#example-desk/" + id + (view ? "/" + view : "");
}
function innerPage(id, view, state) {
  if (view === "lesson") {
    const event = state.workspaceEvents.find(
      (e) => e.id === state.workspaceLessonId,
    );
    return (
      "<h1>" +
      escape(event?.topic || "Экран урока") +
      "</h1><p>" +
      escape(state.student) +
      '</p><section class="panel"><h2>Материалы к занятию</h2><p>' +
      escape(state.materials) +
      '</p></section><section class="panel"><h2>' +
      escape(state.title) +
      '</h2><form data-demo="answer" class="ws-form"><label>' +
      escape(state.question) +
      '<input required name="response" autocomplete="off" maxlength="240"></label><button class="primary">Проверить ответ</button></form>' +
      (state.feedback
        ? '<p role="status">' + escape(state.feedback) + "</p>"
        : "") +
      "</section>"
    );
  }
  if (view === "tools")
    return (
      '<h1>Упражнение к занятию</h1><form data-demo="tool" class="panel ws-form"><label>Название<input name="title" required maxlength="120" value="' +
      escape(state.title) +
      '"></label><label>Вопрос<textarea name="question" required maxlength="420">' +
      escape(state.question) +
      '</textarea></label><label>Ответ<input name="answer" required maxlength="240" value="' +
      escape(state.answer) +
      '"></label><button class="primary">Сохранить упражнение</button></form><a class="ws-link" href="' +
      dest(id, "lesson") +
      '">Попробовать на уроке</a>' +
      (state.toolNotice
        ? '<p role="status">Упражнение сохранено в этом примере.</p>'
        : "")
    );
  if (view === "students")
    return (
      "<h1>Ученики</h1>" +
      state.workspaceStudents
        .map(
          (student) =>
            '<section class="panel"><h2>' +
            escape(student) +
            "</h2>" +
            (state.workspaceEvents
              .filter((e) => e.student === student)
              .map((e) => "<p>" + escape(e.topic) + "</p>")
              .join("") || "<p>Занятий пока нет.</p>") +
            "</section>",
        )
        .join("")
    );
  if (["homework", "assignments"].includes(view))
    return (
      "<h1>" +
      (view === "homework" ? "Домашние работы" : "Выданные работы") +
      '</h1><section class="panel"><h2>' +
      escape(state.workspaceEvents[0].topic) +
      "</h2><p>" +
      escape(seeds[id].homework) +
      "</p><p>Ученик · " +
      escape(state.workspaceEvents[0].student) +
      '</p><button type="button" data-demo="homework" aria-pressed="' +
      Boolean(state.checked) +
      '">' +
      (state.checked
        ? "Проверено · отменить отметку"
        : "Отметить проверенной") +
      "</button></section>"
    );
  return "<h1>Раздел не найден</h1>";
}
export function renderDemoDesk(id, view = "") {
  if (!Object.hasOwn(seeds, id))
    return '<h1>Пример не найден</h1><a href="#examples">Все кабинеты</a>';
  const state = deskFor(id);
  const nav =
    '<nav class="site-toolbar" aria-label="Пример кабинета"><a href="' +
    (view ? dest(id) : "#example/" + id) +
    '">' +
    (view ? "← " + demoDeskLabel(id) : "← Страница преподавателя") +
    '</a><a href="#examples">Все примеры</a></nav>';
  if (view) return nav + innerPage(id, view, state);
  let body = renderWorkspace(state)
    .replace("<h1>Мой кабинет</h1>", "<h1>" + demoDeskLabel(id) + "</h1>")
    .replace(">Редактор страницы</a>", ">Страница преподавателя</a>");
  const targets = {
    "#lesson": dest(id, "lesson"),
    "#tools": dest(id, "tools"),
    "#editor": "#example/" + id,
  };
  for (const page of ["students", "assignments", "homework"])
    targets["https://app.klaryus.ru/app/" + page] = dest(id, page);
  for (const [from, to] of Object.entries(targets))
    body = body.replaceAll('href="' + from + '"', 'href="' + to + '"');
  return nav + body;
}
export function handleDemoDesk(control, id) {
  if (!Object.hasOwn(seeds, id)) return false;
  const state = deskFor(id);
  if (control.dataset.workspace) {
    if (["select-event", "apply-method"].includes(control.dataset.workspace))
      state.feedback = "";
    return handleWorkspace(control, state);
  }
  if (control.dataset.demo === "homework") {
    state.checked = !state.checked;
    return true;
  }
  const fields = new FormData(control);
  if (control.dataset.demo === "answer") {
    const norm = (text) =>
      String(text)
        .trim()
        .toLowerCase()
        .replaceAll("ё", "е")
        .replace(/\s+/g, " ");
    state.feedback =
      norm(fields.get("response")) === norm(state.answer)
        ? "Верно!"
        : "Попробуйте ещё раз.";
    return true;
  }
  if (control.dataset.demo === "tool") {
    for (const name of ["title", "question", "answer"])
      state[name] = String(fields.get(name)).trim();
    state.toolNotice = true;
    state.feedback = "";
    return true;
  }
  return false;
}
