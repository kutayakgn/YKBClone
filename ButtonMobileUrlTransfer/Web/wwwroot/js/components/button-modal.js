(function () {
    "use strict";

    if (window.YkbButtonModalInitialized) return;
    window.YkbButtonModalInitialized = true;

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
        return desktopMedia.matches
            ? button.dataset.targetDesktop
            : button.dataset.targetMobile;
    }

    function synchronizeLink(button) {
        // href mobil URL ile güncellense de masaüstü URL kaybolmaz.
        if (!originalUrls.has(button)) {
            originalUrls.set(button, button.getAttribute("href") || "");
        }

        const normalUrl = button.dataset.url === undefined
            ? originalUrls.get(button)
            : button.dataset.url;
        const mobileUrl = (button.dataset.mobileUrl || "").trim();
        const target = currentTarget(button);
        const href = !desktopMedia.matches && target !== "_modal" && mobileUrl
            ? mobileUrl
            : normalUrl;

        if (href) button.setAttribute("href", href);
        else button.removeAttribute("href");

        // URL hedefleri için tarayıcının normal bağlantı davranışı korunur.
        if (target !== "_modal") {
            button.target = target === "_blank" ? "_blank" : "_self";
            if (target === "_blank") button.rel = "noopener noreferrer";
            else button.removeAttribute("rel");
        }

        return target;
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

    document.addEventListener("click", function (event) {
        const button = event.target.closest("[data-ykb-button]");
        if (!button) return;

        // Değiştirici tuşlarla yapılan doğal tıklamalarda da doğru href kullanılır.
        const target = synchronizeLink(button);
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

        if (target === "_modal") {
            event.preventDefault();
            toggleModal(button);
            return;
        }
        const href = button.getAttribute("href");
        if (!href || href === "#") {
            event.preventDefault();
            return;
        }
        if (target === "_popupwindow") {
            event.preventDefault();
            openPopupWindow(button.href || href);
        }
    });

    function initializeModals() {
        synchronizeLinks();
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

    if (desktopMedia.addEventListener) {
        desktopMedia.addEventListener("change", synchronizeLinks);
    } else {
        desktopMedia.addListener(synchronizeLinks);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeModals, { once: true });
    } else {
        initializeModals();
    }
})();
