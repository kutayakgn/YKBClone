(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.HorecaRestaurants) { window.YKB.HorecaRestaurants.init(); return; }
    var state = { registered: false, dialog: null, images: [], index: 0, opener: null, refreshDialogImages: null };
    // Shared by every restaurant feed and the gallery: limits are page-wide.
    var imageLoader = createImageLoader();
    function createImageLoader() {
        var maxConcurrent = 2, startIntervalMs = 1000, errorCooldownMs = 60000;
        var records = new WeakMap(), queue = [], active = 0, timer = null;
        var nextStart = 0, blockedUntil = 0;
        var observer = typeof window.IntersectionObserver === 'function'
            ? new window.IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var job = records.get(entry.target);
                    if (!job) return;
                    job.nearViewport = entry.isIntersecting;
                    enqueue(job);
                });
            }, { rootMargin: '160px 0px' }) : null;
        function visible(image) {
            var lightbox = image.closest('dialog');
            return image.isConnected && !image.closest('[hidden], [aria-hidden="true"]') && (!lightbox || lightbox.open);
        }
        function eligible(job) {
            return records.get(job.image) === job && job.image.getAttribute('data-horeca-src') === job.source
                && job.nearViewport && visible(job.image);
        }
        function enqueue(job) {
            if (job.status !== 'idle' || !eligible(job)) return;
            job.status = 'queued';
            queue.push(job);
            pump();
        }
        function pump() {
            if (timer !== null || active >= maxConcurrent) return;
            // Drop jobs hidden by pagination, closed branches or gallery navigation.
            while (queue.length && !eligible(queue[0])) {
                var skipped = queue.shift();
                if (skipped.status === 'queued') skipped.status = 'idle';
            }
            if (!queue.length) return;
            var wait = Math.max(nextStart, blockedUntil) - Date.now();
            if (wait > 0) {
                timer = window.setTimeout(function () { timer = null; pump(); }, wait);
                return;
            }
            var job = queue.shift();
            if (job.status !== 'queued') { pump(); return; }
            job.status = 'active';
            active++;
            nextStart = Date.now() + startIntervalMs;
            var timeout;
            function finish(result) {
                if (job.status !== 'active') return;
                job.image.removeEventListener('load', loaded);
                job.image.removeEventListener('error', failed);
                window.clearTimeout(timeout);
                job.cancel = null;
                active--;
                job.status = result;
                if (result === 'failed') {
                    // <img> exposes neither HTTP status nor Retry-After. Conservatively pause
                    // ALL new image requests on any failure instead of flooding a 429 window.
                    blockedUntil = Math.max(blockedUntil, Date.now() + errorCooldownMs);
                    console.warn('Restoran görseli yüklenemedi; görsel kuyruğu bekletiliyor:', job.source);
                    if (job.attempts < 2) {
                        job.status = 'idle';
                        enqueue(job); // at most one retry, after the shared cooldown
                    }
                }
                pump();
            }
            function loaded() { finish('loaded'); }
            function failed() { finish('failed'); }
            job.cancel = function () {
                job.image.removeEventListener('load', loaded);
                job.image.removeEventListener('error', failed);
                job.image.removeAttribute('src');
                finish('canceled');
            };
            job.image.addEventListener('load', loaded);
            job.image.addEventListener('error', failed);
            timeout = window.setTimeout(function () {
                // Stop a stalled transfer before releasing its concurrency slot.
                job.image.removeEventListener('error', failed);
                job.image.removeAttribute('src');
                finish('failed');
            }, 30000);
            job.attempts++;
            job.image.setAttribute('loading', 'eager');
            // This assignment is the only place a managed image starts a network request.
            // Keep the original URL/query string so normal browser/CDN caching can work.
            job.image.src = job.source;
            pump();
        }
        function refresh(container) {
            container.querySelectorAll('img[data-horeca-src], img[data-horeca-large-image]').forEach(function (image) {
                var source = image.getAttribute('data-horeca-src') || '';
                var job = records.get(image);
                if (job && job.source !== source) {
                    records.delete(image);
                    if (observer) observer.unobserve(image);
                    if (job.cancel) job.cancel();
                    job.status = 'canceled';
                    image.removeAttribute('src');
                    job = null;
                }
                if (!source) return;
                if (!job) {
                    job = { image: image, source: source, status: 'idle', attempts: 0,
                        nearViewport: !observer, cancel: null };
                    records.set(image, job);
                    if (observer) observer.observe(image);
                }
                enqueue(job);
            });
            pump();
        }
        return { refresh: refresh };
    }
    function monitorImages(container) {
        return function () { imageLoader.refresh(container); };
    }
    function factory(root, rows) {
        var form = root.querySelector('[data-ct-filters]');
        var input = root.querySelector('[data-horeca-city]');
        var panel = root.querySelector('[data-horeca-panel]');
        var tabs = Array.from(root.querySelectorAll('[data-horeca-tab]'));
        var refreshImages = monitorImages(root);
        root.addEventListener('ykb:customtablefeed-rendered', refreshImages);
        function collapse(button, expanded) {
            var article = button.closest('[data-ct-row]');
            var body = article.querySelector('[data-horeca-collapse]');
            button.setAttribute('aria-expanded', String(expanded));
            body.setAttribute('aria-hidden', String(!expanded));
            body.inert = !expanded;
            body.classList.toggle('is-expanded', expanded);
            if (expanded) refreshImages();
        }
        function select(tab, focus) {
            input.value = tab.dataset.horecaTab;
            tabs.forEach(item => {
                var active = item === tab;
                item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
            });
            panel.setAttribute('aria-labelledby', tab.id);
            root.querySelectorAll('[data-horeca-toggle]').forEach(button => collapse(button, false));
            // The shared feed handles filtering, PageSize and resetting to page 1.
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            if (focus) tab.focus();
        }
        root.addEventListener('click', function (event) {
            var tab = event.target.closest('[data-horeca-tab]');
            if (tab && root.contains(tab)) { event.preventDefault(); select(tab, false); return; }
            var toggle = event.target.closest('[data-horeca-toggle]');
            if (toggle && root.contains(toggle)) {
                event.preventDefault(); collapse(toggle, toggle.getAttribute('aria-expanded') !== 'true');
            }
        });
        root.addEventListener('keydown', function (event) {
            var tab = event.target.closest('[data-horeca-tab]');
            if (!tab) return;
            var index = tabs.indexOf(tab), next;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
        });
        root.querySelectorAll('[data-horeca-toggle]').forEach(button => collapse(button, false));
        return function () {
            var city = input.value || 'istanbul';
            return row => row.dataset.restaurantCity === city;
        };
    }
    function updateImage() {
        var selected = state.images[state.index];
        var image = state.dialog.querySelector('[data-horeca-large-image]');
        image.setAttribute('data-horeca-src', selected.dataset.horecaImage);
        image.alt = selected.dataset.horecaCaption || 'Restoran görseli';
        state.dialog.querySelector('[data-horeca-image-caption]').textContent = image.alt + ' — ' + (state.index + 1) + ' / ' + state.images.length;
        state.dialog.querySelector('[data-horeca-previous]').disabled = state.index === 0;
        state.dialog.querySelector('[data-horeca-next]').disabled = state.index === state.images.length - 1;
        state.refreshDialogImages();
    }
    function dialog() {
        if (state.dialog) return state.dialog;
        var element = document.createElement('dialog');
        element.className = 'ct-horeca-lightbox';
        element.setAttribute('aria-label', 'Restoran galerisi');
        element.innerHTML = '<button type="button" class="ct-horeca-lightbox__close" aria-label="Galeriyi kapat" data-horeca-close>×</button>' +
            '<img class="ct-horeca-lightbox__image" data-horeca-large-image alt="">' +
            '<div class="ct-horeca-lightbox__toolbar"><button type="button" aria-label="Önceki görsel" data-horeca-previous>‹</button>' +
            '<p role="status" data-horeca-image-caption></p><button type="button" aria-label="Sonraki görsel" data-horeca-next>›</button></div>';
        element.addEventListener('click', function (event) {
            if (event.target === element || event.target.closest('[data-horeca-close]')) element.close();
            else if (event.target.closest('[data-horeca-previous]') && state.index > 0) { state.index--; updateImage(); }
            else if (event.target.closest('[data-horeca-next]') && state.index < state.images.length - 1) { state.index++; updateImage(); }
        });
        element.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft' && state.index > 0) { event.preventDefault(); state.index--; updateImage(); }
            if (event.key === 'ArrowRight' && state.index < state.images.length - 1) { event.preventDefault(); state.index++; updateImage(); }
        });
        element.addEventListener('close', function () {
            element.querySelector('[data-horeca-large-image]').removeAttribute('data-horeca-src');
            state.refreshDialogImages();
            if (state.opener && state.opener.isConnected) state.opener.focus({ preventScroll: true });
        });
        document.body.appendChild(element); state.dialog = element;
        state.refreshDialogImages = monitorImages(element);
        return element;
    }
    document.addEventListener('click', function (event) {
        if (!event.target || typeof event.target.closest !== 'function') return;
        var button = event.target.closest('[data-horeca-image]');
        if (!button) return;
        var gallery = button.closest('[data-horeca-gallery]');
        if (!gallery) return;
        event.preventDefault();
        var element = dialog();
        state.images = Array.from(gallery.querySelectorAll('[data-horeca-image]'));
        state.index = state.images.indexOf(button); state.opener = button;
        updateImage();
        if (typeof element.showModal === 'function') {
            if (!element.open) element.showModal();
            state.refreshDialogImages();
        } else {
            // Older browsers can still open the selected image.
            window.open(button.dataset.horecaImage, '_blank', 'noopener,noreferrer');
        }
    });
    function register() {
        if (state.registered || !window.YKB.CustomTableFeeds) return;
        window.YKB.CustomTableFeeds.register('restaurants', factory);
        state.registered = true;
    }
    window.YKB.HorecaRestaurants = { init: register };
    document.addEventListener('ykb:customtablefeed-ready', register);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, { once: true });
    register();
})(window, document);
