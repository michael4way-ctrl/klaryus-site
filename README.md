# Klaryus — сайт

Опубликованный лендинг: https://michael4way-ctrl.github.io/klaryus-site/

Этот репозиторий содержит готовую статическую сборку лендинга для GitHub Pages. Исходный монорепозиторий хранится отдельно в приватном `michael4way-ctrl/klaryus`.

Источник: https://gitlab.com/intezya.dev/klaryus/landing, `master`, коммит `1d03697f47025b17f53e41ff8e72ef77ad6f0366` (6 октября 2026). Копия исходников и адаптер Pages: приватный `michael4way-ctrl/klaryus`, ветка `feat/gitlab-landing-2026-10-06`, коммит `494a6a2d`.

Сборка: Astro, компонент `landing`. Для обновления выполните `bun install --frozen-lockfile`, затем `APP_BUILD_SHA=<исходный-коммит> bun run build:github-pages`. Скрипт сначала проверяет обычную сборку, затем адаптирует ресурсы, внутренние ссылки и social preview к `/klaryus-site/`. Отправьте содержимое `dist` в корень `main` этого репозитория, сохраняя каталог `panda` и `.nojekyll`.

Предыдущая версия с пандой сохранена отдельно: https://michael4way-ctrl.github.io/klaryus-site/panda/

Pages публикует корень ветки `main`; `.nojekyll` отключает обработку Jekyll. Вход и регистрация ведут на существующее приложение `app.klaryus.ru`.
