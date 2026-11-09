(() => {
    "use strict";

    document.querySelectorAll("[data-ykb-suggest]").forEach((wrapper, index) => {
        const input = wrapper.querySelector("[data-ykb-suggest-input]");
        const panel = wrapper.querySelector("[data-ykb-suggest-panel]");
        if (!input || !panel) return;

        panel.id ||= `ykb-search-suggestions-${index}`;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-label", "Arama önerileri");
        input.setAttribute("aria-controls", panel.id);
        input.setAttribute("aria-expanded", "false");
        let timeoutId = 0;
        let controller;
        let requestId = 0;

        const hide = () => {
            panel.hidden = true;
            input.setAttribute("aria-expanded", "false");
        };

        const cancel = () => {
            window.clearTimeout(timeoutId);
            ++requestId;
            controller?.abort();
            hide();
        };

        const search = () => {
            window.clearTimeout(timeoutId);
            controller?.abort();
            const currentRequest = ++requestId;
            const query = input.value.trim().slice(0, 85);
            hide();
            if (query.length < 2) return;

            timeoutId = window.setTimeout(async () => {
                controller = new AbortController();
                try {
                    const response = await fetch(`/arama/oneriler?q=${encodeURIComponent(query)}`, {
                        signal: controller.signal,
                        headers: { Accept: "application/json" }
                    });
                    if (!response.ok) return;
                    const results = await response.json();
                    if (currentRequest !== requestId || !wrapper.contains(document.activeElement)) return;

                    panel.replaceChildren();
                    const list = document.createElement("ul");
                    for (const result of results) {
                        const item = document.createElement("li");
                        const link = document.createElement("a");
                        link.textContent = result.title;
                        link.href = result.url;
                        item.append(link);
                        list.append(item);
                    }
                    if (results.length) {
                        panel.append(list);
                    } else {
                        const message = document.createElement("p");
                        message.setAttribute("role", "status");
                        message.textContent = "Sonuç bulunamadı. Farklı bir kelime deneyin.";
                        panel.append(message);
                    }
                    panel.hidden = false;
                    input.setAttribute("aria-expanded", "true");
                } catch (error) {
                    if (error.name !== "AbortError" && currentRequest === requestId) hide();
                }
            }, 200);
        };

        input.addEventListener("input", search);
        input.addEventListener("focus", search);
        wrapper.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                input.focus();
                cancel();
                return;
            }
            if (panel.hidden || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
            const links = [...panel.querySelectorAll("a")];
            if (!links.length) return;
            event.preventDefault();
            const current = links.indexOf(document.activeElement);
            const next = current + (event.key === "ArrowDown" ? 1 : -1);
            if (next < 0) input.focus();
            else links[Math.min(next, links.length - 1)].focus();
        });
        wrapper.addEventListener("focusout", (event) => {
            if (!wrapper.contains(event.relatedTarget)) {
                cancel();
            }
        });
        document.addEventListener("click", (event) => {
            if (!wrapper.contains(event.target)) cancel();
        });
    });
})();
