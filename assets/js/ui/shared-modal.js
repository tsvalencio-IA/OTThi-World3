(() => {
  'use strict';
  function open(title, html, onReady) {
    const modal = document.getElementById('modal');
    const titleNode = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    if (!modal || !titleNode || !body) return false;
    modal.className = 'modal otthi-module-modal';
    titleNode.textContent = title;
    body.innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => { body.scrollTop = 0; onReady?.(body, modal); });
    return true;
  }
  function close() {
    const modal = document.getElementById('modal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
  }
  document.addEventListener('click', event => {
    if (event.target?.id === 'modalClose' && document.getElementById('modal')?.classList.contains('otthi-module-modal')) close();
  }, true);
  window.OTTHI_MODAL = { open, close };
})();
