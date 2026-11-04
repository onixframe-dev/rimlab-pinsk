(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-nav");

  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      menuButton.querySelector(".sr-only").textContent = "Открыть меню";
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("is-open", !isOpen);
      menuButton.querySelector(".sr-only").textContent = isOpen ? "Открыть меню" : "Закрыть меню";
    });

    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  document.querySelectorAll("#current-year").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector("#lead-form");
  const status = document.querySelector("#form-status");
  if (!form || !status) return;

  const submitButton = form.querySelector('[type="submit"]');
  const setStatus = (message, kind) => {
    status.textContent = message;
    status.dataset.state = kind;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      contact: formData.get("contact"),
      message: formData.get("message"),
      website: formData.get("website"),
      turnstileToken: formData.get("cf-turnstile-response")
    };

    if (!payload.turnstileToken) {
      setStatus("Подтвердите проверку защиты от спама и отправьте форму ещё раз.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Отправляем заявку…", "pending");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Не удалось отправить заявку.");
      }

      form.reset();
      if (window.turnstile) window.turnstile.reset();
      setStatus("Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.", "success");
    } catch (error) {
      setStatus(error.message || "Ошибка отправки. Попробуйте позже или напишите нам напрямую.", "error");
      if (window.turnstile) window.turnstile.reset();
    } finally {
      submitButton.disabled = false;
    }
  });
})();
