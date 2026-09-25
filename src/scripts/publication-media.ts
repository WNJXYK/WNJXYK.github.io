export function setupPublicationMedia() {
  const thumbnails = Array.from(document.querySelectorAll<HTMLVideoElement>('.pub-media video'));
  const visible = new Set<HTMLVideoElement>();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lightbox: HTMLDialogElement | undefined;
  let opener: HTMLButtonElement | undefined;

  function updateThumbnails() {
    for (const video of thumbnails) {
      if (visible.has(video) && !document.hidden && !reducedMotion.matches && !lightbox?.open) {
        // Muting the property as well as the attribute supports autoplay on Safari.
        video.muted = true;
        void video.play().catch(() => { /* Leave the first frame if autoplay is unavailable. */ });
      } else {
        video.pause();
      }
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) visible.add(video);
        else visible.delete(video);
      }
      updateThumbnails();
    }, { threshold: 0.2 });
    thumbnails.forEach((video) => observer.observe(video));
  }
  reducedMotion.addEventListener('change', updateThumbnails);
  document.addEventListener('visibilitychange', updateThumbnails);

  function getLightbox() {
    if (lightbox) return lightbox;
    const dialog = document.createElement('dialog');
    dialog.className = 'media-lightbox';
    dialog.setAttribute('aria-labelledby', 'media-lightbox-title');
    dialog.innerHTML = `
      <div class="media-lightbox__head">
        <h2 class="media-lightbox__title" id="media-lightbox-title"></h2>
        <button class="media-lightbox__close" type="button" aria-label="Close preview" autofocus>×</button>
      </div>
      <div class="media-lightbox__content"></div>
      <div class="media-lightbox__foot"><a class="media-lightbox__original" target="_blank" rel="noopener noreferrer">Open original ↗</a></div>`;
    document.body.appendChild(dialog);
    lightbox = dialog;
    dialog.querySelector('button')!.addEventListener('click', () => dialog.close());

    // Only close on a click that starts and ends on the backdrop.
    const outside = (event: PointerEvent) => {
      const bounds = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    };
    let startedOutside = false;
    dialog.addEventListener('pointerdown', (event) => { startedOutside = outside(event); });
    dialog.addEventListener('pointerup', (event) => {
      if (startedOutside && outside(event)) dialog.close();
      startedOutside = false;
    });
    dialog.addEventListener('close', () => {
      const video = dialog.querySelector('video');
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      dialog.querySelector('.media-lightbox__content')!.replaceChildren();
      document.documentElement.classList.remove('media-preview-open');
      opener?.focus({ preventScroll: true });
      updateThumbnails();
    });
    return dialog;
  }

  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element).closest<HTMLButtonElement>('[data-media-preview]');
    if (!trigger?.dataset.mediaSrc) return;
    const { mediaSrc: src, mediaKind: kind, mediaTitle: title = 'Publication preview' } = trigger.dataset;
    const dialog = getLightbox();
    const content = dialog.querySelector('.media-lightbox__content')!;
    dialog.querySelector('.media-lightbox__title')!.textContent = title;
    dialog.querySelector<HTMLAnchorElement>('.media-lightbox__original')!.href = src;
    const status = document.createElement('p');
    status.className = 'media-lightbox__status';
    status.setAttribute('role', 'status');
    status.textContent = 'Loading preview…';
    const media = kind === 'video' ? document.createElement('video') : document.createElement('img');
    media.hidden = true;
    const loaded = () => { status.hidden = true; media.hidden = false; };
    media.addEventListener('error', () => {
      media.hidden = true;
      status.hidden = false;
      status.textContent = 'Preview unavailable. You can open the original file below.';
    });
    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'auto';
      media.addEventListener('loadeddata', loaded, { once: true });
      media.setAttribute('aria-label', title);
    } else {
      media.alt = title;
      media.addEventListener('load', loaded, { once: true });
    }
    content.replaceChildren(status, media);
    media.src = src;
    opener = trigger;
    dialog.showModal();
    document.documentElement.classList.add('media-preview-open');
    updateThumbnails();
    if (media instanceof HTMLVideoElement) {
      // This playback follows an explicit click; native controls handle sound and seeking.
      void media.play().catch(() => { /* The user can still use the playback controls. */ });
    }
  });
}
