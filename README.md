# RIMLAB — тестовый лендинг

Демонстрационный проект на базе OnixFrame Starter Landing. Тема: покраска
автомобильных дисков в Пинске.

## Стек

- HTML, CSS и JavaScript с Vite для локальной разработки и production-сборки.
- Prettier для единого читаемого форматирования исходников.
- Sharp для подготовки AVIF, WebP и JPEG/PNG-вариантов изображений.
- Vercel Function в `api/lead.js` для будущей отправки заявок в Telegram.
- Cloudflare Turnstile предусмотрен для защиты формы; ключи пока не настроены.

## Запуск проекта

Нужен Node.js 22.12 или новее.

```bash
npm install
npm run dev
```

Vite покажет локальный адрес в терминале. Для production-сборки используется
`npm run build`; результат появится в `dist/`. В Vercel выберите Vite, команду
сборки `npm run build` и папку вывода `dist`. Папка `api/` остаётся в корне,
чтобы Vercel обнаруживал серверную функцию.

## Изображения: подготовка и Retina

Положите утверждённые оригиналы в `assets/images/source/`, затем запустите:

```bash
npm run images:process
```

Скрипт создаст ширины 480, 768, 960, 1280, 1600, 1920 и 2560 пикселей (не
увеличивая оригинал) в AVIF, WebP и JPEG либо PNG для изображений с
прозрачностью. Варианты сохраняются в `public/images/optimized/` и копируются
Vite в сборку.

Для обычной фотографии используйте в HTML `<picture>` с `srcset` и `sizes`.
Браузер выберет подходящую ширину с учётом размера экрана и плотности пикселей
(включая Retina 2x/3x). Для отдельного мобильного кадрирования используйте
`<source media="...">` с собственными исходником и вариантами. Укажите `width` и
`height`; изображения ниже первого экрана загружайте с `loading="lazy"`, главное
изображение — без lazy loading и с `fetchpriority="high"`.

Пример: браузер выбирает ширину с учётом фактического размера блока и
Retina-плотности. На мобильном используется отдельный кадр:

```html
<picture>
  <source
    media="(max-width: 720px)"
    type="image/avif"
    srcset="
      /images/optimized/wheel--mobile-480.avif 480w,
      /images/optimized/wheel--mobile-768.avif 768w,
      /images/optimized/wheel--mobile-960.avif 960w
    "
    sizes="100vw"
  />
  <source
    media="(max-width: 720px)"
    type="image/webp"
    srcset="
      /images/optimized/wheel--mobile-480.webp 480w,
      /images/optimized/wheel--mobile-768.webp 768w,
      /images/optimized/wheel--mobile-960.webp 960w
    "
    sizes="100vw"
  />
  <source
    type="image/avif"
    srcset="
      /images/optimized/wheel-480.avif   480w,
      /images/optimized/wheel-960.avif   960w,
      /images/optimized/wheel-1280.avif 1280w,
      /images/optimized/wheel-1920.avif 1920w
    "
    sizes="(max-width: 1100px) 100vw, 50vw"
  />
  <source
    type="image/webp"
    srcset="
      /images/optimized/wheel-480.webp   480w,
      /images/optimized/wheel-960.webp   960w,
      /images/optimized/wheel-1280.webp 1280w,
      /images/optimized/wheel-1920.webp 1920w
    "
    sizes="(max-width: 1100px) 100vw, 50vw"
  />
  <img
    src="/images/optimized/wheel-960.jpg"
    srcset="
      /images/optimized/wheel-480.jpg   480w,
      /images/optimized/wheel-960.jpg   960w,
      /images/optimized/wheel-1280.jpg 1280w,
      /images/optimized/wheel-1920.jpg 1920w
    "
    sizes="(max-width: 1100px) 100vw, 50vw"
    width="1280"
    height="960"
    alt="Автомобильный диск после обновления покрытия"
    loading="lazy"
    decoding="async"
  />
</picture>
```

Исходники не удаляются и не очищаются скриптом. Перед обработкой храните только
те материалы, на которые есть права.

## Форматирование кода

```bash
npm run format
npm run format:check
```

Настройки находятся в `.prettierrc.json`; CSS остаётся многострочным и читаемым.

## Что ещё заменить перед публикацией

- Добавить фотографии реальных работ и убрать заглушки в секции «Примеры работ».
- Подтвердить название, телефон, адрес мастерской, цены, сроки и условия.
- Подготовить окончательный текст политики конфиденциальности.
- Настроить Turnstile и переменные окружения Vercel по примеру в `.env.example`.
- Заменить домен в `robots.txt` и `sitemap.xml` после выбора домена.
- Проверить отправку формы после конфигурации API и Telegram-бота.

Форма в текущем макете находится в демонстрационном режиме и не отправляет
реальные заявки.
