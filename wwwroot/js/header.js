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
            ? configuredInterval : 5000;
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
(() => {
    "use strict";
    const header = document.querySelector("[data-ykb-header]");
    if (!header) {
        return;
    }
    const dataElement = header.querySelector("#ykb-mobile-menu-data");
    const buttons = Array.from(header.querySelectorAll("[data-mobile-action]"));
    let nodes = [];
    let activeSheet = null;
    try {
        nodes = JSON.parse(dataElement?.textContent ?? "[]");
    } catch {
        nodes = [];
    }
    const visibleChildren = (node) => (node?.Children ?? []).filter(
        (child) => child.DisplayOnMobile !== false);
    const findNode = (id) => nodes.find((node) => String(node.Id) === String(id));
    const createIcon = (className) => {
        const icon = document.createElement("i");
        icon.className = className ?? "";
        icon.setAttribute("aria-hidden", "true");
        return icon;
    };
    const appendLink = (parent, node, modifier) => {
        const link = document.createElement("a");
        const label = document.createElement("span");
        const chevron = createIcon("icon-chevron-right ykb-action-item-chevron");
        link.className = `ykb-action-item ykb-action-item--${modifier}`;
        link.href = node.Url || "#";
        if (node.OpenInNewTab) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
        if (node.IconCssClass) {
            link.appendChild(createIcon(node.IconCssClass));
        }
        label.textContent = node.Title;
        link.appendChild(label);
        link.appendChild(chevron);
        parent.appendChild(link);
    };
    const appendGroup = (parent, groupNode) => {
        const group = document.createElement("div");
        const children = visibleChildren(groupNode);
        group.className = "ykb-action-group";
        appendLink(group, groupNode, "primary");
        if (children.length) {
            const childList = document.createElement("div");
            childList.className = "ykb-action-children";
            children.forEach((child) => appendLink(childList, child, "child"));
            group.appendChild(childList);
        }
        parent.appendChild(group);
    };
    const closeSheet = () => {
        const sheet = activeSheet;
        activeSheet = null;
        buttons.forEach((button) => button.setAttribute("aria-expanded", "false"));
        if (!sheet?.parentNode) {
            return;
        }
        let removed = false;
        const removeSheet = (event) => {
            if (event && (event.target !== sheet || event.propertyName !== "max-height")) {
                return;
            }
            if (removed) {
                return;
            }
            removed = true;
            sheet.removeEventListener("transitionend", removeSheet);
            sheet.remove();
        };
        sheet.classList.remove("is-open");
        sheet.addEventListener("transitionend", removeSheet);
        window.setTimeout(removeSheet, 360);
    };
    buttons.forEach((button) => {
        if (button.dataset.ykbMobileActionBound === "true") {
            return;
        }
        button.dataset.ykbMobileActionBound = "true";
        button.addEventListener("click", (event) => {
            const node = findNode(button.dataset.mobileAction);
            const wasSame = activeSheet?.dataset.actionId === String(node?.Id);
            event.stopPropagation();
            closeSheet();
            if (!node || wasSame) {
                return;
            }
            const wrap = button.closest("[data-mobile-action-wrap]");
            const sheet = document.createElement("div");
            if (!wrap) {
                return;
            }
            sheet.className = `ykb-mobile-action-sheet ${node.Role === "InternetBranch" ? "is-red" : "is-blue"}`;
            sheet.dataset.actionId = String(node.Id);
            visibleChildren(node).forEach((groupNode) => appendGroup(sheet, groupNode));
            wrap.appendChild(sheet);
            button.setAttribute("aria-expanded", "true");
            activeSheet = sheet;
            window.requestAnimationFrame(() => {
                if (sheet.parentNode && activeSheet === sheet) {
                    sheet.classList.add("is-open");
                }
            });
        });
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-mobile-action-wrap]")) {
            closeSheet();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSheet();
        }
    });
})();
