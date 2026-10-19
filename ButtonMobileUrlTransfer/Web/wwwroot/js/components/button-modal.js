(function () {
    "use strict";

    if (window.YkbButtonLinks) return;

    // Mevcut breakpoint korunur: 992px ve üzeri masaüstü.
    const desktopMedia = window.matchMedia("(min-width: 992px)");
    const originalUrls = new WeakMap();

    function cookieName(modalId) {
        return "ykb_modal_seen_" + modalId;
    }

    function hasSeen(modalId) {
        const prefix = cookieName(modalId) + "=";
        return document.cookie.split("; ").some(part => part.startsWith(prefix));
    }

    function markSeen(modalId) {
        let cookie = cookieName(modalId) +
            "=1; Max-Age=31536000; Path=/; SameSite=Lax";
        if (location.protocol === "https:") cookie += "; Secure";
        document.cookie = cookie;
    }

    function findModal(button) {
        const modalId = button.dataset.modalId;
        return modalId ? document.getElementById(modalId) : null;
    }

    function currentTarget(button) {
        return ((desktopMedia.matches
            ? button.getAttribute("data-target-desktop")
            : button.getAttribute("data-target-mobile")) || "_self").trim();
    }

    function linkState(button) {
        // href mobil URL ile güncellense de masaüstü URL kaybolmaz.
        if (!originalUrls.has(button)) {
            originalUrls.set(button, button.getAttribute("href") || "");
        }

        const normalUrl = !button.hasAttribute("data-url")
            ? originalUrls.get(button)
            : button.getAttribute("data-url");
        const mobileUrl = (button.getAttribute("data-mobile-url") || "").trim();
        const target = currentTarget(button);
        const href = !desktopMedia.matches && target !== "_modal" && mobileUrl
            ? mobileUrl
            : normalUrl;

        return { target: target, url: (href || "").trim(), mobile: !desktopMedia.matches };
    }

    function synchronizeLink(button) {
        const state = linkState(button);
        const target = state.target;
        const href = state.url;

        if (href) button.setAttribute("href", href);
        else button.removeAttribute("href");

        // URL hedefleri için tarayıcının normal bağlantı davranışı korunur.
        if (target !== "_modal") {
            button.target = target === "_blank" ? "_blank" : "_self";
            if (target === "_blank") button.rel = "noopener noreferrer";
            else button.removeAttribute("rel");
        }

        return state;
    }

    function synchronizeLinks() {
        document.querySelectorAll("[data-ykb-button]").forEach(synchronizeLink);
    }

    function toggleModal(button) {
        const element = findModal(button);
        if (!element) {
            console.warn("Butona bağlı modal sayfada bulunamadı.");
            return;
        }
        if (!window.bootstrap || !window.bootstrap.Modal) {
            console.error("Bootstrap 5 JavaScript yüklenmemiş.");
            return;
        }
        const modal = window.bootstrap.Modal.getOrCreateInstance(element);
        if (element.classList.contains("show")) modal.hide();
        else modal.show();
    }

    function openPopupWindow(url) {
        const screenLeft = typeof window.screenLeft === "number"
            ? window.screenLeft : window.screenX;
        const screenTop = typeof window.screenTop === "number"
            ? window.screenTop : window.screenY;
        const availableWidth = window.innerWidth ||
            document.documentElement.clientWidth || screen.width;
        const availableHeight = window.innerHeight ||
            document.documentElement.clientHeight || screen.height;
        const width = Math.min(900, availableWidth);
        const height = Math.min(800, availableHeight);
        const left = screenLeft + Math.max(0, (availableWidth - width) / 2);
        const top = screenTop + Math.max(0, (availableHeight - height) / 2);
        const features = [
            "popup=yes", "width=" + Math.round(width), "height=" + Math.round(height),
            "left=" + Math.round(left), "top=" + Math.round(top),
            "resizable=yes", "scrollbars=yes", "toolbar=no", "menubar=no",
            "location=no", "status=no"
        ].join(",");
        const popup = window.open(url, "_blank", features);
        if (popup) {
            popup.opener = null;
            popup.focus();
        } else {
            // Popup engellendiyse kullanıcı linke yine ulaşabilsin.
            window.location.assign(url);
        }
    }

    function synchronizeEventLink(event) {
        const button = event.target.closest("[data-ykb-button]");
        if (button) synchronizeLink(button);
    }

    function handleLinkClick(event) {
        const button = event.target.closest("[data-ykb-button]");
        if (!button) return;
        const state = synchronizeLink(button);
        if (event.defaultPrevented || event.ctrlKey || event.metaKey ||
            event.shiftKey || event.altKey || event.button > 0) return;
        if (state.target === "_modal") return;

        // Bu bağlantının URL işlemini tek dinleyici yönetir. Sonraki eski
        // dinleyiciler masaüstü URL'siyle ikinci bir yönlendirme yapamaz.
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!state.url || state.url === "#") return;

        // Navigasyon href'in daha sonra değişmesine bağlı değildir.
        const url = new URL(state.url, document.baseURI).href;
        if (state.target === "_popupwindow") {
            openPopupWindow(url);
        } else if (state.target === "_blank") {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            window.location.assign(url);
        }
    }

    window.YkbButtonLinks = {
        refresh: synchronizeLinks,
        inspect: linkState
    };

    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("auxclick", synchronizeEventLink, true);

    if (desktopMedia.addEventListener) {
        desktopMedia.addEventListener("change", synchronizeLinks);
    } else {
        desktopMedia.addListener(synchronizeLinks);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", synchronizeLinks, { once: true });
    } else {
        synchronizeLinks();
    }

    // Eski modal kodu zaten çalışıyorsa modal dinleyicilerini çoğaltma.
    if (window.YkbButtonModalInitialized) return;
    window.YkbButtonModalInitialized = true;

    document.addEventListener("click", function (event) {
        const button = event.target.closest("[data-ykb-button]");
        if (!button) return;

        const target = currentTarget(button);
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

        if (target === "_modal") {
            event.preventDefault();
            toggleModal(button);
            return;
        }
    });

    function initializeModals() {
        document.querySelectorAll(".ykb-modal").forEach(function (element) {
            element.addEventListener("shown.bs.modal", function () {
                markSeen(element.id);
            });
        });

        // Henüz görülmemiş ilk otomatik modal açılır.
        const autoButton = Array.from(document.querySelectorAll(
            '[data-ykb-button][data-auto-open="true"]'
        )).find(function (button) {
            const element = findModal(button);
            return element && !hasSeen(element.id);
        });
        if (!autoButton) return;
        const element = findModal(autoButton);
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(element).show();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeModals, { once: true });
    } else {
        initializeModals();
    }
})();
