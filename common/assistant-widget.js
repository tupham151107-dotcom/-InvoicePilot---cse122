/* Floating InvoicePilot helper launcher. The button is the custom launcher
   configured in Botpress (element ID: bp-toggle-chat). */
(function () {
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (scriptUrl) {
    const stylesheetUrl = new URL('assistant-widget.css?v=1', scriptUrl).href;
    const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(link => link.href === stylesheetUrl);
    if (!alreadyLoaded) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = stylesheetUrl;
      document.head.appendChild(stylesheet);
    }
  }


  if (document.getElementById('bp-toggle-chat')) return;


  const button = document.createElement('button');
  button.id = 'bp-toggle-chat';
  button.className = 'ip-assistant-launcher';
  button.type = 'button';
  button.setAttribute('aria-label', 'Nhấn giữ để di chuyển hoặc nhấn để mở trợ lý InvoicePilot');
  button.setAttribute('title', 'Nhấn giữ để di chuyển · Nhấn để mở trợ lý');
  button.innerHTML = '<span class="ip-assistant-launcher-mark" aria-hidden="true">IP</span><span class="ip-assistant-launcher-label">Trợ lý AI</span>';
  document.body.appendChild(button);

  const positionKey = 'invoicepilot-assistant-position-v1';
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || 'null');
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      const maxLeft = window.innerWidth - button.offsetWidth - 8;
      const maxTop = window.innerHeight - button.offsetHeight - 8;
      button.style.left = clamp(saved.left, 8, maxLeft) + 'px';
      button.style.top = clamp(saved.top, 8, maxTop) + 'px';
      button.style.right = 'auto';
      button.style.bottom = 'auto';
    }
  } catch (error) {
    // Ignore unavailable or malformed saved positions.
  }

  let drag = null;
  let suppressNextClick = false;

  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = button.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    button.classList.add('is-dragging');
    const left = clamp(drag.left + deltaX, 8, window.innerWidth - button.offsetWidth - 8);
    const top = clamp(drag.top + deltaY, 8, window.innerHeight - button.offsetHeight - 8);
    button.style.left = left + 'px';
    button.style.top = top + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
  });

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      suppressNextClick = true;
      button.classList.remove('is-dragging');
      try {
        const rect = button.getBoundingClientRect();
        localStorage.setItem(positionKey, JSON.stringify({ left: rect.left, top: rect.top }));
      } catch (error) {
        // The launcher still works when browser storage is unavailable.
      }
      window.setTimeout(() => { suppressNextClick = false; }, 0);
    }
    drag = null;
  }

  button.addEventListener('pointerup', finishDrag);
  button.addEventListener('pointercancel', finishDrag);
  button.addEventListener('click', event => {
    if (!suppressNextClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressNextClick = false;
  }, true);

  window.addEventListener('resize', () => {
    if (!button.style.left || !button.style.top) return;
    const left = clamp(parseFloat(button.style.left), 8, window.innerWidth - button.offsetWidth - 8);
    const top = clamp(parseFloat(button.style.top), 8, window.innerHeight - button.offsetHeight - 8);
    button.style.left = left + 'px';
    button.style.top = top + 'px';
  });
})();

