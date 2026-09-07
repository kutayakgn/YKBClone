(() => {
    "use strict";

    const widgets = document.querySelectorAll("[data-ykb-announcements]");

    widgets.forEach((widget) => {
        const items = Array.from(widget.querySelectorAll(".ykb-announcements__item"));
        const previousButton = widget.querySelector("[data-announcement-prev]");
        const nextButton = widget.querySelector("[data-announcement-next]");

        if (items.length < 2) {
            return;
        }

        const configuredInterval = Number.parseInt(widget.dataset.intervalMs ?? "5000", 10);
        const interval = Number.isFinite(configuredInterval) && configuredInterval >= 3000
            ? configuredInterval
            : 5000;
        let activeIndex = Math.max(0, items.findIndex((item) => item.classList.contains("is-active")));
        let timerId = 0;
        let isPaused = false;

        const show = (nextIndex) => {
            activeIndex = (nextIndex + items.length) % items.length;

            items.forEach((item, index) => {
                const isActive = index === activeIndex;
                item.classList.toggle("is-active", isActive);
                item.setAttribute("aria-hidden", isActive ? "false" : "true");
                item.tabIndex = isActive ? 0 : -1;
            });
        };

        const stop = () => {
            if (timerId) {
                window.clearInterval(timerId);
                timerId = 0;
            }
        };

        const start = () => {
            stop();

            if (isPaused || document.hidden) {
                return;
            }

            timerId = window.setInterval(() => show(activeIndex + 1), interval);
        };

        const move = (direction) => {
            show(activeIndex + direction);
            start();
        };

        previousButton?.addEventListener("click", () => move(-1));
        nextButton?.addEventListener("click", () => move(1));

        widget.addEventListener("pointerenter", () => {
            isPaused = true;
            stop();
        });

        widget.addEventListener("pointerleave", () => {
            isPaused = false;
            start();
        });

        widget.addEventListener("focusin", () => {
            isPaused = true;
            stop();
        });

        widget.addEventListener("focusout", (event) => {
            if (event.relatedTarget instanceof Node && widget.contains(event.relatedTarget)) {
                return;
            }

            isPaused = false;
            start();
        });

        document.addEventListener("visibilitychange", start);
        show(activeIndex);
        start();
    });
})();
