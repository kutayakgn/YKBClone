(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.CardGroups) { window.YKB.CardGroups.init(); return; }
    const initialized = new WeakSet();
    function initialize(root) {
        if (initialized.has(root)) return;
        const content = root.querySelector(':scope > [data-card-group-content]');
        const error = root.querySelector(':scope > [data-card-group-error]');
        const status = root.querySelector(':scope > [data-card-group-status]');
        if (!content || !error || !status || !root.dataset.endpoint) throw new Error("CardGroup markup veya endpoint eksik.");
        let controller, sequence = 0;
        async function load(page) {
            if (controller) controller.abort();
            controller = new AbortController();
            const requestId = ++sequence;
            const buttons = Array.from(content.querySelectorAll('[data-card-group-page]'))
                .filter(button => button.closest('[data-card-group]') === root);
            const disabled = buttons.map(button => button.disabled);
            buttons.forEach(button => { button.disabled = true; });
            root.setAttribute('aria-busy', 'true'); error.hidden = true;
            status.textContent = 'Yükleniyor…';
            try {
                const url = new URL(root.dataset.endpoint, window.location.href);
                url.searchParams.set('groupId', root.dataset.groupId);
                url.searchParams.set('culture', root.dataset.culture);
                url.searchParams.set('page', String(page));
                const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const html = await response.text();
                if (requestId !== sequence || !root.isConnected) return;
                const parsed = new DOMParser().parseFromString(html, 'text/html');
                const result = parsed.querySelector('[data-card-group-result]');
                if (!result) throw new Error('Beklenmeyen CardGroup yanıtı.');
                content.replaceChildren(result);
                status.textContent = `${result.dataset.totalCards} kart. ${result.dataset.page}. sayfa.`;
                init(); // New nested CardGroups get their own handlers.
                content.querySelector(':scope > [data-card-group-result] > nav [aria-current="page"]')?.focus({ preventScroll: true });
                root.dispatchEvent(new CustomEvent('cardgroup:updated', { bubbles: true, detail: { page: Number(result.dataset.page), content } }));
            } catch (exception) {
                if (requestId !== sequence || exception.name === 'AbortError' || !root.isConnected) return;
                buttons.forEach((button, index) => { button.disabled = disabled[index]; });
                error.textContent = 'Kartlar yüklenemedi. Lütfen tekrar deneyiniz.'; error.hidden = false;
                status.textContent = 'Sayfa değiştirilemedi.';
                console.error('CardGroup sayfası yüklenemedi:', root.id, exception);
            } finally {
                if (requestId === sequence) root.setAttribute('aria-busy', 'false');
            }
        }
        root.addEventListener('click', event => {
            if (!(event.target instanceof Element)) return;
            const button = event.target.closest('[data-card-group-page]');
            if (!button || button.closest('[data-card-group]') !== root || button.disabled) return;
            event.preventDefault();
            const page = Number(button.dataset.cardGroupPage);
            if (Number.isInteger(page) && page > 0) load(page);
        });
        root.dataset.cardGroupInitialized = 'true'; initialized.add(root);
    }
    function init() {
        document.querySelectorAll('[data-card-group]').forEach(root => {
            try { initialize(root); }
            catch (exception) {
                const error = root.querySelector(':scope > [data-card-group-error]');
                if (error) { error.textContent = 'Kart sayfalaması başlatılamadı.'; error.hidden = false; }
                console.error('CardGroup başlatılamadı:', root.id, exception);
            }
        });
    }
    window.YKB.CardGroups = { init };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window, document);
