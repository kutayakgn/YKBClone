(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.HorecaRestaurants) { window.YKB.HorecaRestaurants.init(); return; }
    var state = { registered: false, dialog: null, images: [], index: 0, opener: null, refreshDialogImages: null };
    function monitorImages(container) {
        var selector = '.ct-restaurant__logo img, .ct-restaurant__thumbnail img, [data-horeca-large-image]';
        var states = new WeakMap();
        var retryDelays = [60000, 120000, 240000];
        function imageState(image) {
            var source = image.getAttribute('src') || '';
            var current = states.get(image);
            if (!current || current.source !== source) {
                if (current && current.timer !== null) window.clearTimeout(current.timer);
                current = { source: source, attempts: 0, timer: null, warned: false };
                states.set(image, current);
            }
            return current;
        }
        function retry(image) {
            var current = imageState(image);
            if (!current.source || !image.isConnected || current.timer !== null) return;
            if (current.attempts >= retryDelays.length) {
                if (!current.warned) {
                    current.warned = true;
                    console.warn('Restoran görseli yeniden denemelere rağmen yüklenemedi:', image.src);
                }
                return;
            }
            current.timer = window.setTimeout(function () {
                current.timer = null;
                if (imageState(image) !== current || !image.isConnected) return;
                // Only retry a completed, broken image. Leave successes and in-flight loads alone.
                if (!image.complete || image.naturalWidth > 0) return;
                current.attempts++;
                // Preserve CMS/signed URLs and normal browser caching.
                image.src = current.source;
            }, retryDelays[current.attempts]);
        }
        container.addEventListener('error', function (event) {
            if (event.target.matches && event.target.matches(selector)) retry(event.target);
        }, true); // Image errors do not bubble.
        container.addEventListener('load', function (event) {
            var image = event.target;
            if (!image.matches || !image.matches(selector)) return;
            var current = imageState(image);
            if (current.timer !== null) window.clearTimeout(current.timer);
            current.timer = null;
        }, true);
        return function () {
            container.querySelectorAll(selector).forEach(function (image) {
                var current = imageState(image);
                // Also detect cached failures which occurred before listeners were attached.
                if (current.source && image.complete && image.naturalWidth === 0) retry(image);
            });
        };
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
        refreshImages();
        return function () {
            var city = input.value || 'istanbul';
            return row => row.dataset.restaurantCity === city;
        };
    }
    function updateImage() {
        var selected = state.images[state.index];
        var image = state.dialog.querySelector('[data-horeca-large-image]');
        image.src = selected.dataset.horecaImage;
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
            element.querySelector('[data-horeca-large-image]').removeAttribute('src');
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
