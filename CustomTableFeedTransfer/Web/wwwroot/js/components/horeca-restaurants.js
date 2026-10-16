(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.HorecaRestaurants) { window.YKB.HorecaRestaurants.init(); return; }
    var state = { registered: false, dialog: null, images: [], index: 0, opener: null };
    function factory(root, rows) {
        var form = root.querySelector('[data-ct-filters]');
        var input = root.querySelector('[data-horeca-city]');
        var panel = root.querySelector('[data-horeca-panel]');
        var tabs = Array.from(root.querySelectorAll('[data-horeca-tab]'));
        function collapse(button, expanded) {
            var article = button.closest('[data-ct-row]');
            var body = article.querySelector('[data-horeca-collapse]');
            button.setAttribute('aria-expanded', String(expanded));
            body.setAttribute('aria-hidden', String(!expanded));
            body.inert = !expanded;
            body.classList.toggle('is-expanded', expanded);
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
        image.src = selected.dataset.horecaImage;
        image.alt = selected.dataset.horecaCaption || 'Restoran görseli';
        state.dialog.querySelector('[data-horeca-image-caption]').textContent = image.alt + ' — ' + (state.index + 1) + ' / ' + state.images.length;
        state.dialog.querySelector('[data-horeca-previous]').disabled = state.index === 0;
        state.dialog.querySelector('[data-horeca-next]').disabled = state.index === state.images.length - 1;
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
            if (state.opener && state.opener.isConnected) state.opener.focus({ preventScroll: true });
        });
        document.body.appendChild(element); state.dialog = element;
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
