# Klaryus — сайт

Опубликованный лендинг: https://michael4way-ctrl.github.io/klaryus-site/

Этот репозиторий содержит готовую статическую сборку лендинга для GitHub Pages. Исходный монорепозиторий хранится отдельно в приватном `michael4way-ctrl/klaryus`.

Сборка: Astro, компонент `landing`, коммит `132ee57d5a01b2d2e33a51ae0e7747b4e9d6c829`. Для обновления выполните `bun install --frozen-lockfile` и `bun run build` в исходном компоненте, адаптируйте корневые ссылки к `/klaryus-site/` и отправьте содержимое `dist` в `main` этого репозитория.

Pages публикует корень ветки `main`; `.nojekyll` отключает обработку Jekyll. Вход и регистрация ведут на существующее приложение `app.klaryus.ru`.
