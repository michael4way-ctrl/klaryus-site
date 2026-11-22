import { cleanLook, worldLooks } from "./worlds.js";

export const examples = {
  quiz: {
    world: "atelier",
    portrait: "anna",
    name: "Анна Миронова",
    subject: "Математика · 5–9 классы",
    headline: "Математика в картинках",
    short: "Мастерская",
    prompt:
      "Преподаю математику через рисунки. Хочу яркий кабинет с коллажами, на столе — материалы для урока и короткие квизы.",
    description: "Наглядные задачи, коллажи и квиз в конце урока.",
  },
  review: {
    world: "observatory",
    portrait: "ilya",
    name: "Илья Соколов",
    subject: "Математика · ЕГЭ",
    headline: "Лаборатория решений",
    short: "Лаборатория",
    prompt:
      "Готовлю к ЕГЭ по математике. Хочу тёмную страницу с чертежами, а в кабинете первым делом проверяю домашние работы.",
    description: "Чертежи, разбор решений и работа над ошибками.",
  },
  reading: {
    world: "library",
    portrait: "marina",
    name: "Марина Белова",
    subject: "Литература · старшие классы",
    headline: "Читаем между строк",
    short: "Читальный зал",
    prompt:
      "Веду литературу как книжный клуб. Хочу светлую страницу в стиле журнала с засечками и рабочий стол для текстов и обсуждений.",
    description: "Книжные развороты, заметки на полях и разговор о тексте.",
  },
};

export const styleOptions = {
  world: {
    atelier: "Художественная мастерская",
    observatory: "Обсерватория",
    library: "Книжный натюрморт",
  },
  layout: {
    collage: "Коллаж",
    console: "Лаборатория",
    edition: "Журнальный разворот",
  },
  font: {
    golos: "Голос — простой",
    literata: "Литерата — книжный",
    pangolin: "Панголин — рукописный",
    mono: "Моноширинный",
  },
  background: { paper: "Бумага", grid: "Клетка", night: "Ночное небо" },
  deskLayout: {
    agenda: "Расписание",
    board: "Доска подготовки",
    reading: "Стол с материалами",
  },
};

const subjects = [
  [/английск/i, "Английский язык"],
  [/немецк/i, "Немецкий язык"],
  [/французск/i, "Французский язык"],
  [/испанск/i, "Испанский язык"],
  [/русск/i, "Русский язык"],
  [/литератур/i, "Литература"],
  [/математ|алгебр|геометр/i, "Математика"],
  [/физик/i, "Физика"],
  [/хими/i, "Химия"],
  [/биолог/i, "Биология"],
  [/музык|фортепиано|гитар/i, "Музыка"],
  [/истори/i, "История"],
  [/информатик|программи/i, "Информатика"],
];
const colors = [
  [/красн/, "#ad382c"],
  [/син(ий|яя|ее|им|его)/, "#244ca9"],
  [/зел[её]н/, "#32633f"],
  [/сирен|фиолет/, "#795199"],
  [/оранж/, "#bb5422"],
  [/розов/, "#b04d71"],
];
export function interpret(description, preferred = "atelier") {
  const d = description.toLocaleLowerCase("ru");
  const isReading = /книж|литератур|чита[ел]|журнал|поэзи/.test(d);
  const isLab = /обсерватор|лаборатор|черт[её]ж|егэ|физик|космо/.test(d);
  const world = /коллаж|мастерск|рисунк|рисован/.test(d)
    ? "atelier"
    : isReading
      ? "library"
      : isLab
        ? "observatory"
        : preferred;
  const look = { ...worldLooks[world], world };
  if (/т[её]мн|ночн/.test(d)) look.background = "night";
  else if (/клетк|сетк/.test(d)) look.background = "grid";
  else if (/светл|бумаг/.test(d)) look.background = "paper";
  if (/без засеч/.test(d)) look.font = "golos";
  else if (/с засеч|засечк|книжный шрифт/.test(d)) look.font = "literata";
  else if (/от руки|рукопис/.test(d)) look.font = "pangolin";
  else if (/моноши|машинопис/.test(d)) look.font = "mono";
  if (/коллаж/.test(d)) look.layout = "collage";
  else if (/разворот|журнал/.test(d)) look.layout = "edition";
  else if (/консоль/.test(d)) look.layout = "console";
  const accent =
    d.match(/#[a-f0-9]{6}\b/i)?.[0] || colors.find(([r]) => r.test(d))?.[1];
  if (accent) look.accent = accent;
  const deskLayout = /расписан|календар/.test(d)
    ? "agenda"
    : /подготовк|квиз|доск/.test(d)
      ? "board"
      : /чтени|материал|текст|книж/.test(d)
        ? "reading"
        : world === "library"
          ? "reading"
          : world === "atelier"
            ? "board"
            : "agenda";
  const discipline = description
    .match(/(?:преподаю|веду занятия по|обучаю)\s+([^.!?,\n]{2,65})/iu)?.[1]
    .split(/\s+(?:через|для|в формате|как|и хочу|по вечерам)\s+/iu)[0]
    .trim();
  const subject =
    subjects.find(([r]) => r.test(d))?.[1] ||
    (discipline
      ? discipline[0].toLocaleUpperCase("ru") + discipline.slice(1)
      : "");
  const name =
    description.match(
      /(?:[Мм]еня зовут|[Мм]о[её] имя)\s+([А-ЯЁ][а-яё-]+(?:\s+[А-ЯЁ][а-яё-]+)?)/u,
    )?.[1] || "";
  const title = description.match(/[«“"]([^»”"\n]{2,100})[»”"]/u)?.[1] || "";
  return {
    look: cleanLook(look, world),
    deskLayout,
    subject,
    name,
    headline: title,
    priority: /проверк|проверя|домаш/.test(d)
      ? "homework"
      : /материал|книж|текст/.test(d)
        ? "preparation"
        : /квиз|упражнен/.test(d)
          ? "tool"
          : "lesson",
  };
}
