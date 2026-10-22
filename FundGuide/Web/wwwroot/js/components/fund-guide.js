(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.FundGuide) { window.YKB.FundGuide.init(); return; }
    var state = { registered: false };
    function factory(root) {
        var field = root.querySelector("[data-fg-select]");
        var trigger = field.querySelector("[data-fg-trigger]");
        var panel = field.querySelector("[data-fg-panel]");
        var search = field.querySelector("[data-fg-search]");
        var input = field.querySelector("[data-fg-year]");
        var label = field.querySelector("[data-fg-selected]");
        var noYear = field.querySelector("[data-fg-no-year]");
        var options = Array.from(field.querySelectorAll("[data-fg-option]"));
        var appliedYear = input.value;
        function close(focus) {
            panel.hidden = true; trigger.setAttribute("aria-expanded", "false");
            if (focus) trigger.focus();
        }
        function filter() {
            var query = search.value.trim();
            options.forEach(function (option) { option.hidden = !option.dataset.value.includes(query); });
            noYear.hidden = options.some(function (option) { return !option.hidden; });
        }
        function open() {
            if (trigger.disabled) return;
            search.value = ""; filter(); panel.hidden = false;
            trigger.setAttribute("aria-expanded", "true"); search.focus();
        }
        function choose(option) {
            input.value = option.dataset.value; label.textContent = option.textContent;
            options.forEach(function (item) { item.setAttribute("aria-selected", item === option ? "true" : "false"); });
            // Seçim listeyi değiştirmez. Ortak feed form submit'inde filtre uygulanır.
            close(true);
        }
        trigger.addEventListener("click", function () { panel.hidden ? open() : close(false); });
        trigger.addEventListener("keydown", function (event) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); open(); }
        });
        search.addEventListener("input", filter);
        panel.addEventListener("click", function (event) {
            var option = event.target.closest("[data-fg-option]");
            if (option && panel.contains(option)) choose(option);
        });
        field.addEventListener("keydown", function (event) {
            if (panel.hidden) return;
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
            var available = options.filter(function (option) { return !option.hidden; });
            if (!available.length) {
                if (event.key === "Enter") event.preventDefault();
                return;
            }
            var index = available.indexOf(document.activeElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                var next = index < 0 ? (event.key === "ArrowDown" ? 0 : available.length - 1)
                    : Math.max(0, Math.min(available.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
                available[next].focus();
            } else if (event.key === "Enter" && document.activeElement === search) {
                event.preventDefault(); choose(available[0]);
            }
        });
        document.addEventListener("click", function (event) { if (!field.contains(event.target)) close(false); });
        field.addEventListener("focusout", function (event) { if (!field.contains(event.relatedTarget)) close(false); });
        root.addEventListener("ykb:customtablefeed-rendered", function () {
            root.querySelectorAll("[data-fg-group]").forEach(function (group) {
                group.hidden = group.dataset.year !== appliedYear;
            });
        });
        close(false);
        return function () {
            appliedYear = input.value;
            return function (row) { return row.dataset.year === appliedYear; };
        };
    }
    function register() {
        if (state.registered || !window.YKB.CustomTableFeeds) return;
        state.registered = true;
        window.YKB.CustomTableFeeds.register("fund-guide", factory);
    }
    window.YKB.FundGuide = { init: register };
    document.addEventListener("ykb:customtablefeed-ready", register);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", register, { once: true });
    register();
})(window, document);
