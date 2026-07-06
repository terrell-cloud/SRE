/**
 * The site's single client-side script: inspection modal, mobile nav,
 * header shrink, and deferred GoHighLevel chat loading. Everything else
 * is static HTML/CSS.
 */

function setupInspectionModal(): void {
  const dialog = document.getElementById('inspection-modal') as HTMLDialogElement | null;
  if (!dialog) return;
  const mount = dialog.querySelector<HTMLElement>('[data-ghl-calendar]');

  let loaded = false;
  function loadCalendar(): void {
    if (loaded || !mount) return;
    loaded = true;
    const src = mount.dataset.src;
    if (!src) return; // no GHL configured — modal shows the call-us fallback
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Schedule your free inspection';
    iframe.loading = 'eager';
    iframe.className = 'h-full w-full rounded-md border-0 bg-white';
    mount.replaceChildren(iframe);
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-open-inspection]')) {
      e.preventDefault();
      loadCalendar();
      dialog.showModal();
      document.documentElement.classList.add('overflow-hidden');
    }
    if (target.closest('[data-close-inspection]') || target === dialog) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('overflow-hidden'));
}

function setupMobileNav(): void {
  const button = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;
  button.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden') === false;
    button.setAttribute('aria-expanded', String(open));
  });
}

function setupHeaderShrink(): void {
  const header = document.getElementById('site-header');
  if (!header) return;
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
      });
    },
    { passive: true },
  );
}

/** Load the GHL chat widget after idle/first interaction so it never blocks page speed. */
function setupDeferredChat(): void {
  const config = document.getElementById('ghl-chat-config');
  if (!(config instanceof HTMLElement)) return;
  const { src, widgetId } = config.dataset;
  if (!src) return;

  let injected = false;
  function inject(): void {
    if (injected) return;
    injected = true;
    const script = document.createElement('script');
    script.src = src as string;
    if (widgetId) script.dataset.widgetId = widgetId;
    script.defer = true;
    document.body.appendChild(script);
  }

  const events: (keyof WindowEventMap)[] = ['pointerdown', 'scroll', 'keydown', 'touchstart'];
  const onFirstInteraction = () => {
    inject();
    events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction));
  };
  events.forEach((ev) => window.addEventListener(ev, onFirstInteraction, { once: true, passive: true }));
  if ('requestIdleCallback' in window) {
    requestIdleCallback(inject, { timeout: 6000 });
  } else {
    setTimeout(inject, 6000);
  }
}

setupInspectionModal();
setupMobileNav();
setupHeaderShrink();
setupDeferredChat();
