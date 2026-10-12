(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.PressReleases) { window.YKB.PressReleases.init(); return; }
    const initialized = new WeakSet();
    const normalize = value => value.trim().toLocaleLowerCase("tr-TR");
    function selector(root, element, index) {
        const trigger = element.querySelector("[data-press-trigger]");
        const panel = element.querySelector("[data-press-panel]");
        const search = element.querySelector("[data-press-search]");
        const input = element.querySelector("[data-press-value]");
        const label = element.querySelector("[data-press-label]");
        const options = Array.from(element.querySelectorAll("[role=option]"));
        const empty = element.querySelector("[data-press-no-options]");
        panel.id = root.id + "-select-" + index;
        trigger.setAttribute("aria-controls", panel.id);
        const close = focus => {
            panel.hidden = true; trigger.setAttribute("aria-expanded", "false");
            if (focus) trigger.focus();
        };
        const filter = () => {
            options.forEach(option => { option.hidden = !normalize(option.textContent).includes(normalize(search.value)); });
            empty.hidden = options.some(option => !option.hidden);
        };
        const open = () => {
            root.dispatchEvent(new CustomEvent("press-select-open", { detail: element }));
            search.value = ""; filter(); panel.hidden = false;
            trigger.setAttribute("aria-expanded", "true"); search.focus();
        };
        const choose = option => {
            input.value = option.dataset.value; label.textContent = option.textContent;
            options.forEach(item => item.setAttribute("aria-selected", String(item === option)));
            close(true);
        };
        root.addEventListener("press-select-open", event => { if (event.detail !== element) close(false); });
        trigger.addEventListener("click", () => panel.hidden ? open() : close(false));
        search.addEventListener("input", filter);
        options.forEach(option => option.addEventListener("click", () => choose(option)));
        element.addEventListener("keydown", event => {
            if (event.key === "Escape") { event.preventDefault(); close(true); return; }
            if (event.target === trigger && event.key === "ArrowDown") { event.preventDefault(); open(); return; }
            if (panel.hidden) return;
            const shown = options.filter(option => !option.hidden);
            const index = shown.indexOf(document.activeElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const next = index < 0 ? (event.key === "ArrowDown" ? 0 : shown.length - 1)
                    : Math.max(0, Math.min(shown.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
                if (shown[next]) shown[next].focus();
            } else if (event.key === "Enter" && event.target === search) {
                event.preventDefault(); if (shown[0]) choose(shown[0]);
            }
        });
        document.addEventListener("click", event => { if (!element.contains(event.target)) close(false); });
        element.addEventListener("focusout", event => { if (!element.contains(event.relatedTarget)) close(false); });
        return { close: () => close(false) };
    }
    function pageNumbers(page, total) {
        const result = [];
        for (let number = Math.max(1, page - 2); number <= Math.min(total, page + 2); number++) result.push(number);
        return result;
    }
    function initialize(root) {
        if (initialized.has(root)) return;
        const form = root.querySelector("[data-press-form]");
        const results = root.querySelector("[data-press-results]");
        const pagination = root.querySelector("[data-press-pagination]");
        const status = root.querySelector("[data-press-status]");
        const error = root.querySelector("[data-press-error]");
        const selectors = Array.from(root.querySelectorAll("[data-press-select]"), (element, index) => selector(root, element, index));
        const read = () => ({ category: form.elements.category.value, period: form.elements.period.value });
        let applied = read();
        let controller, sequence = 0;
        function renderPager() {
            const result = results.querySelector("[data-press-result]");
            const page = Number(result.dataset.page), total = Number(result.dataset.totalPages);
            pagination.replaceChildren(); pagination.hidden = total <= 1;
            status.textContent = result.dataset.totalRecords + " kayıt bulundu.";
            if (total <= 1) return;
            const add = (text, target, name, disabled, active) => {
                const button = document.createElement("button");
                button.type = "button"; button.className = "ct-feed__page";
                button.textContent = text; button.disabled = disabled; button.setAttribute("aria-label", name);
                if (active) { button.classList.add("is-active"); button.setAttribute("aria-current", "page"); }
                button.addEventListener("click", () => load(target, applied, true));
                pagination.appendChild(button);
            };
            add("<<", 1, "İlk sayfa", page === 1, false);
            add("<", page - 1, "Önceki sayfa", page === 1, false);
            pageNumbers(page, total).forEach(number => add(String(number), number, number + ". sayfa", false, number === page));
            add(">", page + 1, "Sonraki sayfa", page === total, false);
            add(">>", total, "Son sayfa", page === total, false);
        }
        async function load(page, filter, focusPage) {
            if (controller) controller.abort();
            controller = new AbortController();
            const requestId = ++sequence;
            root.setAttribute("aria-busy", "true"); error.hidden = true;
            pagination.querySelectorAll("button").forEach(button => { button.disabled = true; });
            status.textContent = "Yükleniyor…";
            try {
                const url = new URL(root.dataset.endpoint, window.location.href);
                url.searchParams.set("token", root.dataset.token);
                url.searchParams.set("category", filter.category);
                url.searchParams.set("period", filter.period);
                url.searchParams.set("page", String(page));
                const response = await fetch(url, { signal: controller.signal, credentials: "same-origin", headers: { "X-Requested-With": "XMLHttpRequest" } });
                if (!response.ok) throw new Error("HTTP " + response.status);
                const html = await response.text();
                if (requestId !== sequence) return;
                const parsed = new DOMParser().parseFromString(html, "text/html");
                const result = parsed.querySelector("[data-press-result]");
                if (!result) throw new Error("Beklenmeyen sunucu yanıtı.");
                results.replaceChildren(result); applied = { ...filter }; renderPager();
                if (focusPage) pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
            } catch (exception) {
                if (requestId !== sequence || exception.name === "AbortError") return;
                error.textContent = "Bültenler yüklenemedi. Lütfen tekrar deneyiniz."; error.hidden = false;
                renderPager(); console.error("Basın bültenleri yüklenemedi:", exception);
            } finally {
                if (requestId === sequence) root.setAttribute("aria-busy", "false");
            }
        }
        form.addEventListener("submit", event => {
            event.preventDefault(); selectors.forEach(item => item.close()); load(1, read(), false);
        });
        renderPager(); initialized.add(root);
    }
    function init() {
        document.querySelectorAll("[data-press-feed]").forEach(root => {
            try { initialize(root); } catch (error) { console.error("Basın bültenleri başlatılamadı:", error); }
        });
    }
    window.YKB.PressReleases = { init };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(window, document);
