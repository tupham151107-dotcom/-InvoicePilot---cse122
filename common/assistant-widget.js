/* Floating InvoicePilot helper launcher. The button is the custom launcher
   configured in Botpress (element ID: bp-toggle-chat). */
(function () {
  if (document.getElementById('bp-toggle-chat')) return;

  const button = document.createElement('button');
  button.id = 'bp-toggle-chat';
  button.className = 'ip-assistant-launcher';
  button.type = 'button';
  button.setAttribute('aria-label', 'Mở trợ lý InvoicePilot');
  button.setAttribute('title', 'Mở trợ lý InvoicePilot');
  button.innerHTML = '<span class="ip-assistant-launcher-mark" aria-hidden="true">IP</span><span class="ip-assistant-launcher-label">Trợ lý AI</span>';
  document.body.appendChild(button);
})();
