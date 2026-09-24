(() => {
    "use strict";
    const header = document.querySelector("[data-ykb-header]");
    if (!header) return;
    const desktopTabs = [...header.querySelectorAll("[data-desktop-tab]")];
    const dropdownButtons = [...header.querySelectorAll("[data-header-dropdown]")];
    const dropdownPanels = [...header.querySelectorAll("[data-dropdown-panel]")];
    const desktopHeader = header.querySelector(".ykb-desktop-header");
    const notificationWrap = header.querySelector(".ykb-notification-wrap");
    const notificationButton = notificationWrap?.querySelector('[data-header-dropdown="notifications"]');
    const notificationPanel = notificationWrap?.querySelector('[data-dropdown-panel="notifications"]');
    const notificationCount = notificationWrap?.querySelector(".ykb-notification-count");
    let pinnedDesktopTab = null;
    const closeDesktopTabs = () => {
        pinnedDesktopTab = null;
        desktopTabs.forEach((tab) => {
            tab.classList.remove("is-open");
            tab.querySelector(".ykb-tab-button")?.setAttribute("aria-expanded", "false");
        });
    };
    const openDesktopTab = (tab, pin = false) => {
        closeDesktopTabs();
        tab.classList.add("is-open");
        tab.querySelector(".ykb-tab-button")?.setAttribute("aria-expanded", "true");
        if (pin) pinnedDesktopTab = tab;
    };
    desktopTabs.forEach((tab) => {
        const button = tab.querySelector(".ykb-tab-button");
        tab.addEventListener("mouseenter", () => {
            if (pinnedDesktopTab !== tab) openDesktopTab(tab);
        });
        tab.addEventListener("mouseleave", () => {
            if (pinnedDesktopTab !== tab) closeDesktopTabs();
        });
        button?.addEventListener("focus", () => openDesktopTab(tab));
        button?.addEventListener("click", (event) => {
            event.stopPropagation();
            openDesktopTab(tab, true);
        });
    });
    desktopHeader?.addEventListener("mouseleave", () => {
        if (!pinnedDesktopTab) closeDesktopTabs();
    });
    let scrollFrame = 0;
    const updateDesktopHeaderState = () => {
        scrollFrame = 0;
        desktopHeader?.classList.toggle("is-condensed", window.scrollY >= 32);
    };
    updateDesktopHeaderState();
    window.addEventListener("scroll", () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(updateDesktopHeaderState);
    }, { passive: true });
    let notificationCloseTimer = 0;
    let notificationTransitionTimer = 0;
    const clearNotificationTimers = () => {
        window.clearTimeout(notificationCloseTimer);
        window.clearTimeout(notificationTransitionTimer);
        notificationCloseTimer = 0;
        notificationTransitionTimer = 0;
    };
    const setNotificationOpen = (open, immediate = false) => {
        if (!notificationButton || !notificationPanel) return;
        clearNotificationTimers();
        notificationButton.setAttribute("aria-expanded", String(open));
        if (open) {
            notificationPanel.hidden = false;
            window.requestAnimationFrame(() => {
                if (!notificationPanel.hidden) notificationPanel.classList.add("is-open");
            });
            return;
        }
        notificationPanel.classList.remove("is-open");
        if (immediate) {
            notificationPanel.hidden = true;
            return;
        }
        notificationTransitionTimer = window.setTimeout(() => {
            if (notificationButton.getAttribute("aria-expanded") === "false") {
                notificationPanel.hidden = true;
            }
        }, 260);
    };
    const scheduleNotificationClose = () => {
        window.clearTimeout(notificationCloseTimer);
        notificationCloseTimer = window.setTimeout(() => {
            const hasPointer = notificationWrap?.matches(":hover") ?? false;
            if (!hasPointer) setNotificationOpen(false);
        }, 1000);
    };
    const closeDesktopDropdowns = (exceptName = "") => {
        dropdownPanels.forEach((panel) => {
            const matchesException = panel.dataset.dropdownPanel === exceptName;
            if (!matchesException && panel !== notificationPanel) panel.hidden = true;
        });
        if (exceptName !== "notifications") setNotificationOpen(false, true);
        dropdownButtons.forEach((button) => {
            if (button.dataset.headerDropdown !== exceptName) {
                button.setAttribute("aria-expanded", "false");
            }
        });
    };
    dropdownButtons.filter((button) => button !== notificationButton).forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            closeDesktopTabs();
            const name = button.dataset.headerDropdown;
            const panel = header.querySelector(`[data-dropdown-panel="${name}"]`);
            if (!panel) return;
            const willOpen = panel.hidden;
            closeDesktopDropdowns(willOpen ? name : "");
            panel.hidden = !willOpen;
            button.setAttribute("aria-expanded", String(willOpen));
        });
    });
    const markNotificationsRead = () => {
        notificationCount?.remove();
        document.cookie = "isNotificationRead=true; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Lax";
    };
    const openNotifications = () => {
        closeDesktopTabs();
        closeDesktopDropdowns("notifications");
        setNotificationOpen(true);
        markNotificationsRead();
    };
    notificationWrap?.addEventListener("mouseenter", openNotifications);
    notificationWrap?.addEventListener("mouseleave", scheduleNotificationClose);
    notificationPanel?.addEventListener("mouseenter", openNotifications);
    notificationPanel?.addEventListener("mouseleave", scheduleNotificationClose);
    notificationWrap?.addEventListener("focusin", openNotifications);
    notificationWrap?.addEventListener("focusout", (event) => {
        if (event.relatedTarget instanceof Node && notificationWrap.contains(event.relatedTarget)) return;
        scheduleNotificationClose();
    });
    notificationButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (notificationButton.getAttribute("aria-expanded") === "true") {
            setNotificationOpen(false);
        } else {
            openNotifications();
        }
    });
    const dataElement = document.getElementById("ykb-mobile-menu-data");
    let allNodes = [];
    try {
        allNodes = JSON.parse(dataElement?.textContent || "[]");
    } catch {
        allNodes = [];
    }
    const tabNodes = allNodes.filter((node) => node.Role === "Tab");
    const mobileMenu = header.querySelector("[data-mobile-menu]");
    const mobileMenuToggle = header.querySelector("[data-mobile-menu-toggle]");
    const mobileButtons = header.querySelector("[data-mobile-buttons]");
    const mobileMenuContent = header.querySelector("[data-mobile-menu-content]");
    const mobileTabButtons = [...header.querySelectorAll("[data-mobile-tab]")];
    const mobileNotificationButton = header.querySelector("[data-mobile-notifications]");
    const mobileNotificationMenu = header.querySelector("[data-mobile-notification-menu]");
    let activeTab = tabNodes[0] || null;
    let navigationStack = [];
    let mobileActionSheet = null;
    const visibleMobileChildren = (node) =>
        (node?.Children || []).filter((child) => child.DisplayOnMobile !== false);
    const createIcon = (className, extraClass = "") => {
        const icon = document.createElement("i");
        icon.className = `${extraClass} ${className || ""}`.trim();
        icon.setAttribute("aria-hidden", "true");
        return icon;
    };
    const renderMobileLevel = () => {
        if (!mobileMenuContent || !activeTab) return;
        mobileMenuContent.replaceChildren();
        if (mobileMenu) mobileMenu.scrollTop = 0;
        const currentNode = navigationStack.at(-1) || activeTab;
        const isRoot = navigationStack.length === 0;
        if (!isRoot) {
            const back = document.createElement("button");
            back.type = "button";
            back.className = "ykb-mobile-back";
            back.append(createIcon("icon-chevron-left"));
            const backLabel = document.createElement("span");
            backLabel.textContent = navigationStack.length === 1
                ? "Geri"
                : navigationStack[navigationStack.length - 2].Title;
            back.append(backLabel);
            back.addEventListener("click", () => {
                navigationStack.pop();
                renderMobileLevel();
            });
            mobileMenuContent.append(back);
            const title = document.createElement("div");
            title.className = "ykb-mobile-level-title";
            if (navigationStack.length === 1 && currentNode.IconCssClass) {
                title.append(createIcon(currentNode.IconCssClass));
            }
            const titleText = document.createElement("span");
            titleText.textContent = currentNode.Title;
            title.append(titleText);
            mobileMenuContent.append(title);
        }
        const list = document.createElement("div");
        list.className = `ykb-mobile-menu-list${isRoot ? " is-root" : ""}`;
        const animateRows = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (animateRows) list.classList.add("is-entering");
        visibleMobileChildren(currentNode).forEach((node, index) => {
            const children = visibleMobileChildren(node);
            const element = document.createElement(children.length ? "button" : "a");
            element.className = "ykb-mobile-menu-row";
            element.style.setProperty("--ykb-row-index", index);
            if (children.length) {
                element.type = "button";
                element.addEventListener("click", () => {
                    navigationStack.push(node);
                    renderMobileLevel();
                });
            } else {
                element.href = node.Url || "#";
                if (node.OpenInNewTab) {
                    element.target = "_blank";
                    element.rel = "noopener noreferrer";
                }
            }
            if (isRoot && node.IconCssClass) {
                element.append(createIcon(node.IconCssClass, "ykb-row-icon"));
            } else if (isRoot) {
                const spacer = document.createElement("span");
                spacer.className = "ykb-row-icon";
                element.append(spacer);
            }
            const label = document.createElement("span");
            label.className = "ykb-row-title";
            label.textContent = node.Title;
            if (node.BadgeText) {
                const badge = document.createElement("span");
                badge.className = "ykb-mobile-badge";
                badge.textContent = node.BadgeText;
                label.append(" ", badge);
            }
            element.append(label);
            if (children.length) {
                element.append(createIcon("icon-chevron-right", "ykb-chevron"));
            }
            list.append(element);
        });
        mobileMenuContent.append(list);
        if (animateRows) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    if (list.isConnected) list.classList.remove("is-entering");
                });
            });
        }
    };
    const closeMobileActionSheet = () => {
        const sheet = mobileActionSheet;
        mobileActionSheet = null;
        header.querySelectorAll("[data-mobile-action]").forEach((button) => {
            button.setAttribute("aria-expanded", "false");
        });
        if (!sheet?.parentNode) return;
        let removed = false;
        const removeSheet = (event) => {
            if (event && (event.target !== sheet || event.propertyName !== "max-height")) return;
            if (removed) return;
            removed = true;
            sheet.removeEventListener("transitionend", removeSheet);
            sheet.remove();
        };
        sheet.classList.remove("is-open");
        sheet.addEventListener("transitionend", removeSheet);
        window.setTimeout(removeSheet, 360);
    };
    const closeMobileOverlays = () => {
        if (mobileNotificationMenu) mobileNotificationMenu.hidden = true;
        closeMobileActionSheet();
    };
    const setMobileMenuOpen = (open) => {
        if (!mobileMenu || !mobileMenuToggle) return;
        closeMobileOverlays();
        mobileMenu.hidden = !open;
        if (mobileButtons) mobileButtons.hidden = open;
        mobileMenuToggle.setAttribute("aria-expanded", String(open));
        mobileMenuToggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
        document.body.classList.toggle("ykb-menu-open", open);
        if (open) {
            navigationStack = [];
            renderMobileLevel();
        }
    };
    mobileMenuToggle?.addEventListener("click", () => {
        setMobileMenuOpen(mobileMenu?.hidden ?? true);
    });
    mobileTabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextTab = tabNodes.find((tab) => tab.Id === button.dataset.mobileTab);
            if (!nextTab) return;
            activeTab = nextTab;
            navigationStack = [];
            mobileTabButtons.forEach((item) => {
                const selected = item === button;
                item.classList.toggle("is-active", selected);
                item.setAttribute("aria-selected", String(selected));
            });
            renderMobileLevel();
        });
    });
    mobileNotificationButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        closeMobileActionSheet();
        if (mobileNotificationMenu) mobileNotificationMenu.hidden = !mobileNotificationMenu.hidden;
        if (mobileNotificationMenu && !mobileNotificationMenu.hidden) markNotificationsRead();
    });
    const appendActionLink = (parent, node, modifier) => {
        const link = document.createElement("a");
        link.className = `ykb-action-item ykb-action-item--${modifier}`;
        link.href = node.Url || "#";
        if (node.OpenInNewTab) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
        if (node.IconCssClass) link.append(createIcon(node.IconCssClass));
        const label = document.createElement("span");
        label.textContent = node.Title;
        link.append(label);
        link.append(createIcon("icon-chevron-right", "ykb-action-item-chevron"));
        parent.append(link);
    };
    const appendActionGroup = (parent, groupNode) => {
        const group = document.createElement("div");
        const children = visibleMobileChildren(groupNode);
        group.className = "ykb-action-group";
        appendActionLink(group, groupNode, "primary");
        if (children.length) {
            const childList = document.createElement("div");
            childList.className = "ykb-action-children";
            children.forEach((child) => appendActionLink(childList, child, "child"));
            group.append(childList);
        }
        parent.append(group);
    };
    header.querySelectorAll("[data-mobile-action]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const node = allNodes.find((item) => String(item.Id) === String(button.dataset.mobileAction));
            const wasSame = String(mobileActionSheet?.dataset.actionId) === String(node?.Id);
            closeMobileActionSheet();
            if (!node || wasSame) return;
            const wrap = button.closest("[data-mobile-action-wrap]");
            if (!wrap) return;
            const sheet = document.createElement("div");
            sheet.className = `ykb-mobile-action-sheet ${node.Role === "InternetBranch" ? "is-red" : "is-blue"}`;
            sheet.dataset.actionId = String(node.Id);
            visibleMobileChildren(node).forEach((groupNode) => appendActionGroup(sheet, groupNode));
            wrap.append(sheet);
            button.setAttribute("aria-expanded", "true");
            mobileActionSheet = sheet;
            window.requestAnimationFrame(() => {
                if (sheet.parentNode && mobileActionSheet === sheet) sheet.classList.add("is-open");
            });
        });
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-mobile-action-wrap]")) closeMobileActionSheet();
        if (!header.contains(event.target)) {
            closeDesktopDropdowns();
            closeDesktopTabs();
            closeMobileOverlays();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeDesktopDropdowns();
        closeDesktopTabs();
        closeMobileOverlays();
        setMobileMenuOpen(false);
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 992) setMobileMenuOpen(false);
    });
})();
