# Manager KPI Dashboard

Read-only PoC управленческого dashboard поверх существующей Google Sheets с закрытым доступом для руководителей.

## Разделы

- `/` — месячный обзор KPI;
- `/projects` — высоковероятные проекты текущего и следующего месяца;
- `/meetings` — журнал встреч со ссылками на сделки и NAS;
- `/managers` — накопительные показатели и лидер года.

## Запуск

Требуется Node.js 22+.

```bash
npm install
npm run dev
```

Перед запуском задайте переменные из `.env.example`. Для авторизации обязательны `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD` и `DASHBOARD_SESSION_SECRET` длиной не менее 32 символов. Реальные значения не должны попадать в Git.

Откройте `http://localhost:3000`.

## Данные

PoC читает актуальные значения исходной книги через публичный read-only Google Visualization endpoint. Данные кэшируются на 60 секунд. Интерфейс получает нормализованные данные через `DashboardDataProvider` и не зависит от формата Google Sheets.

```text
Managers → Google Sheets → read-only provider → Next.js → Dashboard
```

`GoogleSheetsProvider` работает без credentials, пока у книги сохранен публичный доступ по ссылке. Он ничего не записывает в таблицу. При временной ошибке Google приложение автоматически показывает последний встроенный snapshot; принудительно включить его можно через `DASHBOARD_DATA_PROVIDER=snapshot`.

## Команды

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Документация

- [Аудит Google Sheets](docs/SHEETS_AUDIT.md)
- [Предложение dashboard](docs/DASHBOARD_PROPOSAL.md)
- [Оценка вариантов развития](docs/IMPLEMENTATION_OPTIONS.md)

## Проверочные состояния

Для визуальной проверки предусмотрены query-параметры: `?state=loading`, `?state=empty`, `?state=error`, `?state=stress`. Они не влияют на production data provider.
