/* Floating InvoicePilot assistant launcher with drag support. */
(function () {
  const currentScript = document.currentScript;
  if (currentScript && currentScript.src) {
    const cssUrl = new URL('assistant-widget.css?v=2', currentScript.src).href;
    if (!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => link.href === cssUrl)) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = cssUrl;
      document.head.appendChild(style);
    }
  }

  if (document.getElementById('bp-toggle-chat')) return;

  const button = document.createElement('button');
  button.id = 'bp-toggle-chat';
  button.className = 'ip-assistant-launcher';
  button.type = 'button';
  button.setAttribute('aria-label', 'Nhấn giữ để di chuyển hoặc nhấn để mở trợ lý InvoicePilot');
  button.title = 'Nhấn giữ để di chuyển · Nhấn để mở trợ lý';
  button.innerHTML = '<span class="ip-assistant-launcher-mark" aria-hidden="true">IP</span><span class="ip-assistant-launcher-label">Trợ lý AI</span>';
  document.body.appendChild(button);

  const positionKey = 'invoicepilot-assistant-position-v1';
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const applyPosition = (left, top) => {
    const maxLeft = Math.max(8, window.innerWidth - button.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - button.offsetHeight - 8);
    button.style.left = clamp(left, 8, maxLeft) + 'px';
    button.style.top = clamp(top, 8, maxTop) + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
  };

  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || 'null');
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      applyPosition(saved.left, saved.top);
    }
  } catch (_) { /* Storage may be unavailable; keep the default CSS position. */ }

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let moved = false;

  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    const rect = button.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    moved = false;
    button.setPointerCapture(pointerId);
  });

  button.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true;
    event.preventDefault();
    applyPosition(startLeft + dx, startTop + dy);
  });

  const finishDrag = event => {
    if (pointerId !== event.pointerId) return;
    if (moved) {
      const rect = button.getBoundingClientRect();
      try { localStorage.setItem(positionKey, JSON.stringify({ left: rect.left, top: rect.top })); } catch (_) {}
      button.dataset.dragged = 'true';
    }
    pointerId = null;
  };
  button.addEventListener('pointerup', finishDrag);
  button.addEventListener('pointercancel', finishDrag);
  button.addEventListener('click', event => {
    if (button.dataset.dragged === 'true') {
      event.preventDefault();
      event.stopImmediatePropagation();
      delete button.dataset.dragged;
    }
  }, true);

  window.addEventListener('resize', () => {
    const rect = button.getBoundingClientRect();
    if (button.style.left || button.style.top) applyPosition(rect.left, rect.top);
  });
})();
