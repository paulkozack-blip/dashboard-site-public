# Financial Charts Frontend

Production-ready React + TypeScript приложение для визуализации финансовых показателей в виде графиков по группам тикеров.

## 🚀 Особенности

- **React 18** + **TypeScript** (strict mode)
- **Lightweight Charts** для визуализации
- **Zustand** для управления состоянием
- **Vite** для быстрой разработки и сборки
- **Vitest** + **Testing Library** для тестирования
- **ESLint** + **Prettier** + **Husky** для качества кода
- **GitHub Actions** для CI/CD

## 📊 Функциональность

- Визуализация линейных и свечных графиков по группам тикеров
- Stacked histogram для отображения объемов
- Технические индикаторы (EMA, RSI) с динамическим управлением
- Интерактивные tooltips и легенда
- Адаптивный дизайн

## 🛠 Архитектура

Приложение использует **Zustand** для управления состоянием по следующим причинам:
- Минимальный boilerplate код по сравнению с Redux
- Отличная TypeScript поддержка
- Простота тестирования
- Не требует провайдеров и context wrappers
- Отличная производительность

**Vite** выбран как build tool:
- Значительно быстрее CRA в development
- Встроенная поддержка TypeScript
- Оптимизированная сборка с Rollup
- Встроенная поддержка Web Workers

## 📁 Структура проекта

```
src/
├── pages/
│   └── ChartsPage.tsx           # Контейнер страницы группы
├── components/
│   ├── layout/
│   │   └── Navbar.tsx           # Навигация по группам
│   └── charts/
│       ├── ChartWrapper.tsx     # Обёртка toolbar + chart area
│       ├── CandlestickOrLineChart.tsx  # Основной компонент графика
│       ├── ChartControlPanel.tsx      # Панель управления
│       ├── IndicatorPane.tsx    # Pane для RSI
│       └── Legend.tsx           # Легенда/статусбар
├── hooks/
│   ├── useGroups.ts            # GET /groups
│   ├── useChartData.ts         # GET /chart-data
│   ├── useIndicators.ts        # Управление индикаторами
│   └── useColors.ts            # Генерация colorMap
├── services/
│   ├── api.ts                  # HTTP клиент
│   └── adapter.ts              # Адаптер API -> SeriesInfo
├── types/
│   ├── charts.ts               # Типы для графиков
│   └── api.ts                  # API типы
├── utils/
│   ├── date.ts                 # Утилиты для дат
│   ├── color.ts                # Цветовые функции
│   └── math.ts                 # Математические функции
└── workers/
    └── indicators.worker.ts    # WebWorker для индикаторов
```

## 🔧 Установка и запуск

### Требования
- Node.js 18+ 
- npm/yarn/pnpm

### Установка зависимостей
```bash
npm install
# или
pnpm install
# или  
yarn install
```

### Команды разработки

```bash
# Запуск dev сервера (порт 3000)
npm run dev

# Сборка production
npm run build

# Предварительный просмотр build
npm run preview

# Запуск тестов
npm run test

# Запуск тестов с coverage
npm run test:coverage

# Запуск тестов в UI режиме
npm run test:ui

# Линтинг
npm run lint

# Автофикс линтинга
npm run lint:fix

# Проверка форматирования
npm run format:check

# Форматирование кода
npm run format
```

## 🧪 Тестирование

Проект включает:
- **Unit тесты** для хуков, утилит и адаптеров
- **Integration тесты** для компонентов
- **Фикстуры** для API responses
- **Coverage отчеты**

Запуск всех тестов:
```bash
npm run test:coverage
```

## 🌐 API Endpoints

Приложение работает с следующими API endpoints:

- `GET /groups` - Список групп
- `GET /chart-data?group=<group>` - Данные графика для группы  
- `GET /indicator-settings` - Настройки индикаторов
- `GET /indicator-data?ticker=<ticker>&indicator=<indicator>` - Данные индикатора

## 🎨 Цветовая схема

Для каждой группы используется палитра из 10 базовых цветов:
```typescript
const BASE_COLORS = [
  "#1E88E5", "#E53935", "#43A047", "#FB8C00", "#8E24AA",
  "#00ACC1", "#FDD835", "#6D4C41", "#3949AB", "#00897B"
];
```

EMA индикаторы используют оттенки базового цвета тикера:
- Короткие периоды = светлые оттенки
- Длинные периоды = темные оттенки

## 📈 Объемы (Stacked Histogram)

Объемы отображаются как суммарная колонка по всем тикерам группы:
- Каждый тикер = отдельный сегмент в колонке
- Цвет сегмента = цвет тикера
- Tooltip показывает breakdown по тикерам

## 🔧 Переменные окружения

Создайте файл `.env` (опционально):
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=Financial Charts
```

## 📝 Документация методов

Подробная документация всех методов находится в папке `docs/methods/`:
- Каждый `.ts/.tsx` файл имеет соответствующий `.md` файл
- Документация следует стандартному шаблону (см. `docs/method-template.md`)

## 🚀 Деплой

```bash
# Сборка для production
npm run build

# Файлы для деплоя находятся в папке dist/
```

## 🤝 Разработка

### Pre-commit хуки
Настроены автоматические проверки перед коммитом:
- ESLint проверка и автофикс
- Prettier форматирование
- Запуск тестов для измененных файлов

### GitHub Actions
CI/CD pipeline включает:
- Проверка типов TypeScript
- Линтинг и форматирование
- Запуск всех тестов
- Сборка production версии
- Загрузка coverage отчетов

## 📄 Лицензия

MIT License
