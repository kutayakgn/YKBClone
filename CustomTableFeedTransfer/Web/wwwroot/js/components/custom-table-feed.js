(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.CustomTableFeeds) {
        window.YKB.CustomTableFeeds.init();
        return;
    }
    const handlers = new Map();
    const initialized = new WeakSet();
    const normalize = value => (value || "").trim().toLocaleLowerCase("tr-TR");
    const visible = (element, show) => {
        if (element) element.toggleAttribute("hidden", !show);
    };
    const pad = number => String(number).padStart(2, "0");
    const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    function parseDate(text) {
        if (!text.trim()) return null;
        const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
        if (!match) return undefined;
        const year = Number(match[3]);
        const month = Number(match[2]);
        const day = Number(match[1]);
        if (year < 1900 || year > 2100) return undefined;
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
            ? date : undefined;
    }
    function unique(values) {
        const map = new Map();
        values.forEach(value => {
            const text = (value || "").trim();
            if (text && !map.has(normalize(text))) map.set(normalize(text), text);
        });
        return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "tr"));
    }
    function searchableSelect(element, onChange) {
        const trigger = element.querySelector("[data-select-trigger]");
        const label = element.querySelector("[data-select-label]");
        const panel = element.querySelector("[data-select-panel]");
        const search = element.querySelector("[data-select-search]");
        const list = element.querySelector("[data-select-options]");
        const empty = element.querySelector("[data-select-empty]");
        let value = "";
        let options = [];
        const close = focus => {
            visible(panel, false);
            trigger.setAttribute("aria-expanded", "false");
            if (focus) trigger.focus();
        };
        const filter = () => {
            const query = normalize(search.value);
            options.forEach(option => visible(option, normalize(option.textContent).includes(query)));
            visible(empty, !options.some(option => !option.hidden));
        };
        const open = () => {
            if (trigger.disabled) return;
            // Only one searchable selector in this feed opens at a time.
            element.closest("[data-ct-feed]").dispatchEvent(new CustomEvent("ct-select-open", { detail: element }));
            search.value = "";
            filter();
            visible(panel, true);
            trigger.setAttribute("aria-expanded", "true");
            search.focus();
        };
        element.closest("[data-ct-feed]").addEventListener("ct-select-open", event => {
            if (event.detail !== element) close(false);
        });
        const choose = option => {
            value = option.dataset.value;
            label.textContent = value || element.dataset.placeholder;
            options.forEach(item => item.setAttribute("aria-selected", item === option ? "true" : "false"));
            close(true);
            onChange(value);
        };
        trigger.addEventListener("click", () => panel.hidden ? open() : close(false));
        trigger.addEventListener("keydown", event => {
            if (event.key === "ArrowDown") { event.preventDefault(); open(); }
        });
        search.addEventListener("input", filter);
        list.addEventListener("click", event => {
            const option = event.target.closest("[role='option']");
            if (option && list.contains(option)) choose(option);
        });
        element.addEventListener("keydown", event => {
            if (panel.hidden) return;
            if (event.key === "Escape") { event.preventDefault(); close(true); return; }
            const shown = options.filter(option => !option.hidden);
            if (!shown.length) return;
            const index = shown.indexOf(document.activeElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const next = index < 0 ? (event.key === "ArrowDown" ? 0 : shown.length - 1)
                    : Math.max(0, Math.min(shown.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
                shown[next].focus();
            } else if (event.key === "Enter" && document.activeElement === search) {
                event.preventDefault(); choose(shown[0]);
            }
        });
        document.addEventListener("click", event => { if (!element.contains(event.target)) close(false); });
        element.addEventListener("focusout", event => { if (!element.contains(event.relatedTarget)) close(false); });
        close(false);
        return {
            get value() { return value; },
            setOptions(values, enabled) {
                close(false);
                value = "";
                label.textContent = element.dataset.placeholder;
                trigger.disabled = !enabled;
                list.replaceChildren();
                options = ["", ...unique(values)].map(text => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "ct-select__option";
                    button.dataset.value = text;
                    button.textContent = text || element.dataset.placeholder;
                    button.setAttribute("role", "option");
                    button.setAttribute("aria-selected", text === "" ? "true" : "false");
                    button.tabIndex = -1;
                    list.appendChild(button);
                    return button;
                });
            }
        };
    }
    function calendar(field, root, index, rowDates) {
        const input = field.querySelector("[data-date-input]");
        const toggle = field.querySelector("[data-date-open]");
        input.id = `${root.id}-date-${index}`;
        const label = field.querySelector(".ct-date__label");
        label.htmlFor = input.id;
        const panel = document.createElement("div");
        panel.className = "ct-calendar";
        panel.id = `${input.id}-calendar`;
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Tarih seçiniz");
        panel.hidden = true;
        input.setAttribute("aria-haspopup", "dialog");
        input.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", panel.id);
        field.appendChild(panel);
        const today = new Date();
        let displayed = new Date(today.getFullYear(), today.getMonth(), 1);
        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const rangeYears = rowDates.map(text => Number(text.slice(0, 4))).filter(year => year >= 1900 && year <= 2100);
        const minYear = Math.max(1900, Math.min(today.getFullYear() - 10, ...rangeYears));
        const maxYear = Math.min(2100, Math.max(today.getFullYear() + 10, ...rangeYears));
        const close = focus => {
            visible(panel, false);
            toggle.setAttribute("aria-expanded", "false");
            input.setAttribute("aria-expanded", "false");
            if (focus) input.focus();
        };
        root.addEventListener("ct-calendar-open", event => { if (event.detail !== field) close(false); });
        function render() {
            panel.replaceChildren();
            const header = document.createElement("div");
            header.className = "ct-calendar__header";
            const arrow = (text, amount) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = text;
                button.setAttribute("aria-label", amount < 0 ? "Önceki ay" : "Sonraki ay");
                const next = new Date(displayed.getFullYear(), displayed.getMonth() + amount, 1);
                button.disabled = next.getFullYear() < 1900 || next.getFullYear() > 2100;
                button.addEventListener("click", () => { displayed = next; render(); });
                return button;
            };
            const month = document.createElement("select");
            month.setAttribute("aria-label", "Ay");
            months.forEach((text, number) => month.add(new Option(text, number, false, number === displayed.getMonth())));
            const year = document.createElement("select");
            year.setAttribute("aria-label", "Yıl");
            const selected = parseDate(input.value);
            const lower = Math.min(minYear, displayed.getFullYear(), selected ? selected.getFullYear() : minYear);
            const upper = Math.max(maxYear, displayed.getFullYear(), selected ? selected.getFullYear() : maxYear);
            for (let number = lower; number <= upper; number++) year.add(new Option(String(number), number, false, number === displayed.getFullYear()));
            month.addEventListener("change", () => { displayed.setMonth(Number(month.value)); render(); });
            year.addEventListener("change", () => { displayed.setFullYear(Number(year.value)); render(); });
            header.append(arrow("‹", -1), month, year, arrow("›", 1));
            const week = document.createElement("div");
            week.className = "ct-calendar__week";
            ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].forEach(text => {
                const cell = document.createElement("span"); cell.textContent = text; week.appendChild(cell);
            });
            const days = document.createElement("div");
            days.className = "ct-calendar__days";
            const offset = (displayed.getDay() + 6) % 7;
            for (let number = 0; number < 42; number++) {
                const date = new Date(displayed.getFullYear(), displayed.getMonth(), 1 - offset + number);
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = date.getDate();
                button.dataset.calendarDate = isoDate(date);
                button.setAttribute("aria-label", `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`);
                if (date.getMonth() !== displayed.getMonth()) button.classList.add("is-other-month");
                if (selected && isoDate(date) === isoDate(selected)) {
                    button.classList.add("is-selected"); button.setAttribute("aria-pressed", "true");
                }
                button.addEventListener("click", () => {
                    input.value = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    close(true);
                });
                days.appendChild(button);
            }
            panel.append(header, week, days);
        }
        const open = () => {
            if (!panel.hidden) return;
            root.dispatchEvent(new CustomEvent("ct-calendar-open", { detail: field }));
            const selected = parseDate(input.value);
            displayed = selected ? new Date(selected.getFullYear(), selected.getMonth(), 1)
                : new Date(today.getFullYear(), today.getMonth(), 1);
            render(); visible(panel, true);
            toggle.setAttribute("aria-expanded", "true"); input.setAttribute("aria-expanded", "true");
        };
        input.addEventListener("click", open);
        toggle.addEventListener("click", () => panel.hidden ? open() : close(false));
        input.addEventListener("keydown", event => { if (event.key === "ArrowDown") { event.preventDefault(); open(); panel.querySelector(".is-selected, [data-calendar-date]").focus(); } });
        field.addEventListener("keydown", event => {
            if (panel.hidden) return;
            if (event.key === "Escape") { event.preventDefault(); close(true); }
            const day = event.target.closest("[data-calendar-date]");
            const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
            if (day && delta) {
                event.preventDefault();
                const buttons = Array.from(panel.querySelectorAll("[data-calendar-date]"));
                const target = buttons[buttons.indexOf(day) + delta];
                if (target) target.focus();
            }
        });
        document.addEventListener("click", event => { if (!field.contains(event.target)) close(false); });
        field.addEventListener("focusout", event => { if (!field.contains(event.relatedTarget)) close(false); });
    }
    function paging(container, page, count, change) {
        container.replaceChildren();
        visible(container, count > 1);
        if (count <= 1) return;
        const add = (text, number, description, disabled, active) => {
            const button = document.createElement("button");
            button.type = "button"; button.className = "ct-feed__page";
            button.textContent = text; button.disabled = disabled;
            button.setAttribute("aria-label", description);
            if (active) { button.classList.add("is-active"); button.setAttribute("aria-current", "page"); }
            button.addEventListener("click", () => {
                change(number);
                const current = container.querySelector('[aria-current="page"]');
                if (current) current.focus({ preventScroll: true });
            });
            container.appendChild(button);
        };
        add("<<", 1, "İlk sayfa", page === 1, false);
        add("<", Math.max(1, page - 1), "Önceki sayfa", page === 1, false);
        for (let number = Math.max(1, page - 2); number <= Math.min(count, page + 2); number++)
            add(String(number), number, number + ". sayfa", false, number === page);
        add(">", Math.min(count, page + 1), "Sonraki sayfa", page === count, false);
        add(">>", count, "Son sayfa", page === count, false);
    }
    function projects(root, rows) {
        const project = root.querySelector("[data-project-name]:not([data-ct-row])");
        const firm = root.querySelector("[data-firm-name]:not([data-ct-row])");
        const district = searchableSelect(root.querySelector('[data-location="district"]'), () => {});
        const city = searchableSelect(root.querySelector('[data-location="city"]'), value => {
            district.setOptions(rows.filter(row => normalize(row.dataset.city) === normalize(value)).map(row => row.dataset.district), Boolean(value));
        });
        city.setOptions(rows.map(row => row.dataset.city), true);
        district.setOptions([], false);
        return () => {
            const p = normalize(project.value), f = normalize(firm.value);
            const c = normalize(city.value), d = normalize(district.value);
            return row => normalize(row.dataset.projectName).includes(p) && normalize(row.dataset.firmName).includes(f)
                && (!c || normalize(row.dataset.city) === c) && (!d || normalize(row.dataset.district) === d);
        };
    }
    function bulletins(root, rows) {
        const start = root.querySelector("[data-start-date]");
        const end = root.querySelector("[data-end-date]");
        const error = root.querySelector("[data-filter-error]");
        const dates = rows.map(row => row.dataset.date);
        root.querySelectorAll("[data-ct-date]").forEach((field, index) => calendar(field, root, index, dates));
        return () => {
            const from = parseDate(start.value), to = parseDate(end.value);
            const invalid = from === undefined || to === undefined;
            const reverse = from && to && from > to;
            error.textContent = invalid ? "Tarihleri gg.aa.yyyy biçiminde giriniz (1900–2100)."
                : reverse ? "Başlangıç tarihi bitiş tarihinden sonra olamaz." : "";
            visible(error, Boolean(invalid || reverse));
            start.setAttribute("aria-invalid", String(from === undefined || Boolean(reverse)));
            end.setAttribute("aria-invalid", String(to === undefined || Boolean(reverse)));
            if (invalid || reverse) return null;
            const lower = from ? isoDate(from) : "";
            const upper = to ? isoDate(to) : "";
            return row => (!lower || row.dataset.date >= lower) && (!upper || row.dataset.date <= upper);
        };
    }
    function initialize(root) {
        if (initialized.has(root)) return;
        const factory = handlers.get(root.dataset.kind);
        if (!factory) { console.error("CustomTableFeed handler bulunamadı:", root.dataset.kind); return; }
        const rows = Array.from(root.querySelectorAll("[data-ct-row]"));
        const form = root.querySelector("[data-ct-filters]");
        const pagination = root.querySelector("[data-ct-pagination]");
        const empty = root.querySelector("[data-ct-empty]");
        const status = root.querySelector("[data-ct-status]");
        const readPredicate = factory(root, rows);
        const rawSize = Number.parseInt(root.dataset.pageSize, 10);
        const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;
        let page = 1;
        let predicate = () => true;
        const render = () => {
            const matches = rows.filter(predicate);
            const count = size > 0 ? Math.ceil(matches.length / size) : 1;
            page = Math.max(1, Math.min(page, Math.max(1, count)));
            const offset = size > 0 ? (page - 1) * size : 0;
            const selected = new Set(matches.slice(offset, size > 0 ? offset + size : matches.length));
            rows.forEach(row => { visible(row, selected.has(row)); row.classList.remove("is-striped"); });
            Array.from(selected).forEach((row, index) => row.classList.toggle("is-striped", index % 2 === 1));
            visible(empty, matches.length === 0);
            paging(pagination, page, size > 0 ? count : 1, number => { page = number; render(); });
            status.textContent = matches.length === 0 ? "Kayıt bulunamadı." : `${matches.length} kayıttan ${offset + 1}–${Math.min(offset + selected.size, matches.length)} arası gösteriliyor.`;
        };
        form.addEventListener("submit", event => {
            event.preventDefault();
            const next = readPredicate();
            if (!next) return;
            predicate = next; page = 1; render();
        });
        render(); root.classList.add("ct-feed--enhanced"); initialized.add(root);
        root.dataset.ctInitialized = "true";
    }
    function init() {
        document.querySelectorAll("[data-ct-feed]").forEach(root => {
            try { initialize(root); } catch (error) { console.error("CustomTableFeed başlatılamadı:", root.id, error); }
        });
    }
    handlers.set("projects", projects);
    handlers.set("bulletins", bulletins);
    window.YKB.CustomTableFeeds = {
        init,
        register(kind, factory) {
            if (handlers.has(kind)) throw new Error("Feed handler zaten kayıtlı: " + kind);
            handlers.set(kind, factory); init();
        },
        utils: { normalize, parseDate, isoDate, unique }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})(window, document);
