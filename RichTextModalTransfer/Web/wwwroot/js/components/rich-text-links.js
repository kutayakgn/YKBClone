(function (window, document) {
    'use strict';
    window.YKB = window.YKB || {};
    if (window.YKB.RichTextLinks) return;
    var state = { pending: Object.create(null), intent: 0 };

    function modalReference(href) {
        var match = /^#modal-([0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.exec((href || '').trim());
        if (!match) return null;
        var compact = match[1].replace(/-/g, '').toLowerCase();
        return {
            domId: 'modal-' + compact,
            id: compact.slice(0, 8) + '-' + compact.slice(8, 12) + '-' + compact.slice(12, 16) + '-' + compact.slice(16, 20) + '-' + compact.slice(20)
        };
    }
    function showError(root, message) {
        var error = root.querySelector('[data-rich-text-modal-error]');
        if (!error) {
            error = document.createElement('p');
            error.className = 'rich-text-component__modal-error';
            error.setAttribute('data-rich-text-modal-error', '');
            error.setAttribute('role', 'alert'); root.appendChild(error);
        }
        error.textContent = message; error.hidden = false;
    }
    function loadModal(root, reference) {
        var existing = document.getElementById(reference.domId);
        if (existing) return Promise.resolve(existing);
        var culture = root.dataset.culture;
        var key = reference.domId + '|' + culture;
        if (state.pending[key]) return state.pending[key];
        if (!root.dataset.modalEndpoint || !culture) return Promise.reject(new Error('Rich text modal endpoint veya culture eksik.'));
        var url = new URL(root.dataset.modalEndpoint, window.location.href);
        if (url.origin !== window.location.origin) return Promise.reject(new Error('Modal endpoint aynı origin üzerinde olmalı.'));
        url.searchParams.set('id', reference.id); url.searchParams.set('culture', culture);
        state.pending[key] = fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function (response) {
                if (!response.ok) throw new Error('Modal HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                var current = document.getElementById(reference.domId);
                if (current) return current;
                var parsed = new DOMParser().parseFromString(html, 'text/html');
                var element = parsed.getElementById(reference.domId);
                if (!element || !element.classList.contains('modal')) throw new Error('Beklenen modal HTML içinde bulunamadı: ' + reference.domId);
                // Executable code belongs in the existing bundle, not the fetched partial.
                Array.from(element.querySelectorAll('script')).forEach(function (script) { script.remove(); });
                var imported = document.importNode(element, true);
                document.body.appendChild(imported);
                imported.dispatchEvent(new CustomEvent('richtext:modal-loaded', { bubbles: true, detail: { modal: imported } }));
                return imported;
            }).then(function (element) {
                delete state.pending[key]; return element;
            }, function (error) {
                delete state.pending[key]; throw error; // A failed request can be retried.
            });
        return state.pending[key];
    }
    function openModal(root, link, reference) {
        if (!window.bootstrap || !window.bootstrap.Modal) {
            showError(root, 'Modal açılamadı. Lütfen sayfayı yeniden yükleyiniz.');
            console.error('Rich text: Bootstrap 5 Modal API yüklenmemiş.'); return;
        }
        var intent = ++state.intent;
        var error = root.querySelector('[data-rich-text-modal-error]');
        if (error) error.hidden = true;
        link.setAttribute('aria-busy', 'true');
        Promise.resolve().then(function () { return loadModal(root, reference); })
            .then(function (element) {
                // A slower previous click must not open a different modal later.
                if (intent === state.intent && link.isConnected)
                    window.bootstrap.Modal.getOrCreateInstance(element).show();
            }).catch(function (exception) {
                console.error('Rich text modal yüklenemedi:', reference.id, exception);
                if (intent === state.intent && root.isConnected)
                    showError(root, 'Modal yüklenemedi. Lütfen tekrar deneyiniz.');
            }).then(function () { link.removeAttribute('aria-busy'); });
    }
    function popup(link) {
        var width = 1010, height = 740;
        var screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        var screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || window.screen.width;
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || window.screen.height;
        var left = Math.round(screenLeft + (viewportWidth - width) / 2);
        var top = Math.round(screenTop + (viewportHeight - height) / 2);
        var features = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top +
            ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no';
        var opened = window.open(link.href, 'kenticoPopup', features);
        if (opened) { try { opened.opener = null; } catch (ignore) {} }
    }
    document.addEventListener('click', function (event) {
        var target = event.target && event.target.nodeType === 3 ? event.target.parentElement : event.target;
        if (!target || typeof target.closest !== 'function') return;
        var link = target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        var root = link.closest('[data-rich-text]');
        var reference = modalReference(link.getAttribute('href'));
        if (root && reference) {
            event.preventDefault(); event.stopPropagation();
            openModal(root, link, reference); return;
        }
        if (link.getAttribute('target') === 'popup') {
            event.preventDefault(); event.stopPropagation(); popup(link);
        }
    }, true);
    window.YKB.RichTextLinks = { modalReference: modalReference };
})(window, document);
