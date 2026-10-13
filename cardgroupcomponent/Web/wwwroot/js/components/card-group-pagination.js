(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.CardGroups) { window.YKB.CardGroups.init(); return; }
    const states = new WeakMap();
    const ownElement = (root, attribute) => Array.from(root.children).find(child => child.hasAttribute(attribute));
    function initialize(root) {
        if (states.has(root)) return states.get(root);
        const content = ownElement(root, 'data-card-group-content');
        const error = ownElement(root, 'data-card-group-error');
        const status = ownElement(root, 'data-card-group-status');
        if (!content || !error || !status || !root.dataset.endpoint || !root.dataset.groupId || !root.dataset.culture) throw new Error("CardGroup markup veya endpoint eksik.");
        // Explicit state fields avoid relying on a renamed outer let variable.
        var state = { controller: null, sequence: 0, load: load };
        async function load(page) {
            var requestId = 0;
            var buttons = [];
            var disabled = [];
            try {
                requestId = ++state.sequence;
                if (state.controller) state.controller.abort();
                state.controller = new AbortController();
                buttons = Array.from(content.querySelectorAll('[data-card-group-page]'))
                    .filter(button => button.closest('[data-card-group]') === root);
                disabled = buttons.map(button => button.disabled);
                buttons.forEach(button => { button.disabled = true; });
                root.setAttribute('aria-busy', 'true'); error.hidden = true;
                status.textContent = 'Yükleniyor…';
                const url = new URL(root.dataset.endpoint, window.location.href);
                url.searchParams.set('groupId', root.dataset.groupId);
                url.searchParams.set('culture', root.dataset.culture);
                url.searchParams.set('page', String(page));
                const response = await fetch(url, { signal: state.controller.signal, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const html = await response.text();
                if (requestId !== state.sequence || !root.isConnected) return;
                const parsed = new DOMParser().parseFromString(html, 'text/html');
                const result = parsed.querySelector('[data-card-group-result]');
                if (!result) throw new Error('Beklenmeyen CardGroup yanıtı.');
                content.replaceChildren(result);
                status.textContent = `${result.dataset.totalCards} kart. ${result.dataset.page}. sayfa.`;
                init(); // New nested CardGroups get their own handlers.
                const active = Array.from(content.querySelectorAll('[data-card-group-page][aria-current="page"]'))
                    .find(button => button.closest('[data-card-group]') === root);
                active?.focus({ preventScroll: true });
                root.dispatchEvent(new CustomEvent('cardgroup:updated', { bubbles: true, detail: { page: Number(result.dataset.page), content } }));
            } catch (exception) {
                if (requestId !== state.sequence || exception.name === 'AbortError' || !root.isConnected) return;
                buttons.forEach((button, index) => { button.disabled = disabled[index]; });
                error.textContent = 'Kartlar yüklenemedi. Lütfen tekrar deneyiniz.'; error.hidden = false;
                status.textContent = 'Sayfa değiştirilemedi.';
                console.error('CardGroup sayfası yüklenemedi:', root.id, exception);
            } finally {
                if (requestId === state.sequence) root.setAttribute('aria-busy', 'false');
            }
        }
        states.set(root, state);
        root.dataset.cardGroupInitialized = 'true';
        return state;
    }
    function reportInitializationError(root, exception) {
        root.dataset.cardGroupInitialized = 'false';
        const error = ownElement(root, 'data-card-group-error');
        if (error) { error.textContent = 'Kart sayfalaması başlatılamadı.'; error.hidden = false; }
        console.error('CardGroup başlatılamadı:', root.id, exception);
    }
    // A single delegated handler also covers groups inserted after DOMContentLoaded.
    // Capture prevents a card/layout bubble handler from hiding pagination clicks.
    document.addEventListener('click', event => {
        const target = event.target?.nodeType === 3 ? event.target.parentElement : event.target;
        if (!target || typeof target.closest !== 'function') return;
        const button = target.closest('[data-card-group-page]');
        if (!button || button.disabled) return;
        const root = button.closest('[data-card-group]');
        if (!root) return;
        const page = Number(button.dataset.cardGroupPage);
        if (!Number.isInteger(page) || page < 1) return;
        event.preventDefault();
        try {
            initialize(root).load(page).catch(exception => reportInitializationError(root, exception));
        }
        catch (exception) { reportInitializationError(root, exception); }
    }, true);
    function init() {
        document.querySelectorAll('[data-card-group]').forEach(root => {
            try { initialize(root); }
            catch (exception) { reportInitializationError(root, exception); }
        });
    }
    window.YKB.CardGroups = { init };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window, document);
