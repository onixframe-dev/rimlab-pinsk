(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');

  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      menuButton.querySelector('.sr-only').textContent = 'Открыть меню';
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('is-open', !isOpen);
      menuButton.querySelector('.sr-only').textContent = isOpen
        ? 'Открыть меню'
        : 'Закрыть меню';
    });

    navigation
      .querySelectorAll('a')
      .forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  document.querySelectorAll('#current-year').forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector('#lead-form');
  const status = document.querySelector('#form-status');
  const turnstileSlot = document.querySelector('#turnstile-slot');
  if (!form || !status || !turnstileSlot) return;

  const siteKey = turnstileSlot.dataset.sitekey || '';
  const turnstileConfigured = siteKey && !siteKey.startsWith('REPLACE_');
  let turnstileReady = false;

  if (turnstileConfigured) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        window.turnstile.render(turnstileSlot, {
          sitekey: siteKey,
          theme: 'dark',
        });
        turnstileReady = true;
      }
    };
    turnstileSlot.replaceChildren();
    turnstileSlot.append(script);
  }

  const submitButton = form.querySelector('[type="submit"]');
  const setStatus = (message, kind) => {
    status.textContent = message;
    status.dataset.state = kind;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (!turnstileConfigured || !turnstileReady) {
      setStatus(
        'Демо-режим: подключите Turnstile и настройки отправки перед запуском.',
        'error'
      );
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      diameter: formData.get('diameter'),
      color: formData.get('color'),
      photoUrl: formData.get('photoUrl'),
      message: formData.get('message'),
      website: formData.get('website'),
      turnstileToken: formData.get('cf-turnstile-response'),
    };

    if (!payload.turnstileToken) {
      setStatus(
        'Пройдите проверку от спама и отправьте форму ещё раз.',
        'error'
      );
      return;
    }

    submitButton.disabled = true;
    setStatus('Отправляем заявку…', 'pending');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Не удалось отправить заявку.');

      form.reset();
      if (window.turnstile) window.turnstile.reset();
      setStatus('Спасибо! Заявка отправлена. Мы свяжемся с вами.', 'success');
    } catch (error) {
      setStatus(error.message || 'Ошибка отправки. Попробуйте позже.', 'error');
      if (window.turnstile) window.turnstile.reset();
    } finally {
      submitButton.disabled = false;
    }
  });
})();
