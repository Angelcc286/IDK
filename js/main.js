const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const siteHeader = document.querySelector('.site-header');
const announcement = document.getElementById('announcement');
const announcementClose = document.getElementById('announcementClose');
const year = document.getElementById('year');
const instagramGrid = document.getElementById('instagramGrid');
const instagramStatus = document.getElementById('instagramStatus');
const instagramFallback = document.getElementById('instagramFallback');

if (year) year.textContent = new Date().getFullYear();

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('no-scroll', isOpen);
});

document.querySelectorAll('#mainNav a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  });
});

window.addEventListener('scroll', () => {
  siteHeader?.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

announcementClose?.addEventListener('click', () => {
  announcement?.remove();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function mediaPreview(media) {
  const type = media.media_type;
  const src = type === 'VIDEO' ? media.thumbnail_url : media.media_url;

  if (!src) {
    return `
      <div class="image-placeholder">
        <strong>Contenido de Instagram</strong>
        <small>Abre la publicación para verla.</small>
      </div>
    `;
  }

  return `
    <img
      src="${escapeHtml(src)}"
      alt="Publicación de Instagram"
      loading="lazy"
      decoding="async"
    >
  `;
}

function renderInstagram(items) {
  const limit = Number.parseInt(
    instagramGrid?.dataset.limit || '9',
    10
  );

  const posts = Array.isArray(items)
    ? items.slice(0, limit)
    : [];

  if (!instagramGrid) return;

  instagramGrid.innerHTML = posts.map(media => `
    <a
      class="ig-card"
      href="${escapeHtml(
        media.permalink ||
        'https://www.instagram.com/psi.sthefaniachaparro/'
      )}"
      target="_blank"
      rel="noreferrer"
    >
      ${mediaPreview(media)}

      <span class="ig-badge">
        ${
          media.media_type === 'VIDEO'
            ? 'Reel / video'
            : media.media_type === 'CAROUSEL_ALBUM'
              ? 'Carrusel'
              : 'Publicación'
        }
      </span>

      <div class="ig-overlay">
        <div class="ig-caption">
          ${escapeHtml(
            media.caption ||
            'Ver publicación en Instagram'
          )}
        </div>
      </div>
    </a>
  `).join('');
}

async function loadInstagramFeed() {
  if (
    !instagramGrid ||
    !instagramStatus ||
    !instagramFallback
  ) {
    return;
  }

  try {
    const response = await fetch('/api/instagram', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error ||
        'No se pudo cargar Instagram.'
      );
    }

    renderInstagram(data.data);

    instagramStatus.textContent =
      `${data.data.length} publicaciones recientes`;

    instagramFallback.hidden = true;

  } catch (error) {
    instagramStatus.textContent = '';
    instagramGrid.innerHTML = '';
    instagramFallback.hidden = false;
  }
}

loadInstagramFeed();