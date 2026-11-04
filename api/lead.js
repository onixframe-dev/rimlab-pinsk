const MAX_BODY_BYTES = 16_384;
const MAX_NAME_LENGTH = 80;
const MAX_CONTACT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 1_500;

function sendJson(res, statusCode, payload) {
  res.status(statusCode).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { message: "Метод не поддерживается." });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return sendJson(res, 415, { message: "Ожидается JSON-запрос." });
  }

  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { message: "Слишком большой запрос." });
  }

  const siteOrigin = process.env.SITE_ORIGIN;
  if (!siteOrigin) {
    return sendJson(res, 503, { message: "Форма пока не настроена. Напишите нам напрямую." });
  }

  const requestOrigin = req.headers.origin;
  try {
    const expectedOrigin = new URL(siteOrigin).origin;
    if (!/^https?:$/.test(new URL(expectedOrigin).protocol)) throw new Error("Invalid SITE_ORIGIN");
    if (requestOrigin && new URL(requestOrigin).origin !== expectedOrigin) {
      return sendJson(res, 403, { message: "Запрос отклонён." });
    }
  } catch {
    return sendJson(res, 503, { message: "Форма пока не настроена. Напишите нам напрямую." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { message: "Некорректные данные формы." });
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return sendJson(res, 400, { message: "Некорректные данные формы." });
  }

  // Honeypot: silently accept automated submissions without forwarding them.
  if (cleanText(body.website, 200)) {
    return sendJson(res, 200, { ok: true });
  }

  const name = cleanText(body.name, MAX_NAME_LENGTH);
  const contact = cleanText(body.contact, MAX_CONTACT_LENGTH);
  const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
  const turnstileToken = cleanText(body.turnstileToken, 2_048);

  if (!name || !contact || !turnstileToken) {
    return sendJson(res, 400, { message: "Заполните обязательные поля и пройдите проверку защиты от спама." });
  }

  const { TELEGRAM_BOT_TOKEN: botToken, TELEGRAM_CHAT_ID: chatId, TURNSTILE_SECRET_KEY: turnstileSecret } = process.env;
  if (!botToken || !chatId || !turnstileSecret) {
    return sendJson(res, 503, { message: "Форма пока не настроена. Напишите нам напрямую." });
  }

  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken,
        remoteip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || ""
      })
    });
    const verificationResult = await verification.json();
    if (!verification.ok || verificationResult.success !== true) {
      return sendJson(res, 400, { message: "Проверка не пройдена. Попробуйте ещё раз." });
    }

    const text = [
      "Новая заявка с сайта",
      "",
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      message ? `Сообщение: ${message}` : ""
    ].filter(Boolean).join("\n");

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8_000)
    });

    if (!telegramResponse.ok) {
      return sendJson(res, 502, { message: "Не удалось отправить заявку. Попробуйте позже." });
    }

    const telegramResult = await telegramResponse.json();
    if (telegramResult.ok !== true) {
      return sendJson(res, 502, { message: "Не удалось отправить заявку. Попробуйте позже." });
    }

    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 502, { message: "Ошибка отправки. Попробуйте позже или напишите нам напрямую." });
  }
};
