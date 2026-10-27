function youtubeId(url) {
  if (/(^|\.)youtu\.be$/.test(url.hostname)) return url.pathname.split('/')[1];
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) {
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

function vimeoId(url) {
  if (!/(^|\.)vimeo\.com$/.test(url.hostname)) return null;
  const m = url.pathname.match(/(\d+)(?:\/([\da-f]+))?\/?$/);
  return m ? { id: m[1], hash: m[2] } : null;
}

function getEmbedSrc(href, autoplay) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const yt = youtubeId(url);
  if (yt) {
    const params = new URLSearchParams({ rel: '0' });
    const start = url.searchParams.get('t') || url.searchParams.get('start');
    if (start) params.set('start', parseInt(start, 10));
    if (autoplay) params.set('autoplay', '1');
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?${params}`;
  }
  const vm = vimeoId(url);
  if (vm) {
    const params = new URLSearchParams({ dnt: '1' });
    if (vm.hash) params.set('h', vm.hash);
    if (autoplay) params.set('autoplay', '1');
    return `https://player.vimeo.com/video/${vm.id}?${params}`;
  }
  return null;
}

function buildIframe(src, title) {
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-frame';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Embedded video';
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write';
  wrapper.append(iframe);
  return wrapper;
}

/**
 * Embed: a YouTube or Vimeo link becomes a responsive 16:9 iframe, loaded when the block
 * nears the viewport. An optional picture renders as a poster; clicking it loads the player.
 * Unknown URLs stay a plain link.
 * @param {Element} block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;
  const title = link.textContent.trim() !== link.href ? link.textContent.trim() : '';
  const src = getEmbedSrc(link.href, false);
  if (!src) {
    block.classList.add('embed-link');
    const p = document.createElement('p');
    p.append(link);
    block.replaceChildren(p);
    return;
  }

  const picture = block.querySelector('picture');
  block.replaceChildren();
  block.classList.add('embed-video');

  if (picture) {
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'embed-poster';
    poster.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
    poster.append(picture);
    poster.addEventListener('click', () => {
      poster.replaceWith(buildIframe(getEmbedSrc(link.href, true), title));
    }, { once: true });
    block.append(poster);
    return;
  }

  const load = () => {
    if (block.querySelector('iframe')) return;
    block.append(buildIframe(src, title));
  };
  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
