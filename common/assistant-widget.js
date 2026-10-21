/* Floating InvoicePilot helper launcher. The button is the custom launcher
   configured in Botpress (element ID: bp-toggle-chat). */
(function () {
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (scriptUrl) {
    const stylesheetUrl = new URL('assistant-widget.css?v=2', scriptUrl).href;
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
