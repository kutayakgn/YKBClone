(function () {
    "use strict";

    if (window.YkbButtonLinks) return;

    // Kapsam dışından yakalanan let/const/WeakMap durumuna ihtiyaç yoktur.
    // Mevcut breakpoint korunur: 992px ve üzeri masaüstü.
    function isDesktop() {
        return window.matchMedia("(min-width: 992px)").matches;
    }

    function cookieName(modalId) {
        return "ykb_modal_seen_" + modalId;
    }

    function hasSeen(modalId) {
        var prefix = cookieName(modalId) + "=";
        return document.cookie.split("; ").some(function (part) {
            return part.indexOf(prefix) === 0;
        });
    }

    function markSeen(modalId) {
        var cookie = cookieName(modalId) +
            "=1; Max-Age=31536000; Path=/; SameSite=Lax";
        if (location.protocol === "https:") cookie += "; Secure";
        document.cookie = cookie;
    }

    function findModal(button) {
        var modalId = button.dataset.modalId;
        return modalId ? document.getElementById(modalId) : null;
    }

    function currentTarget(button) {
        return ((isDesktop()
            ? button.getAttribute("data-target-desktop")
            : button.getAttribute("data-target-mobile")) || "_self").trim();
    }

    function linkState(button) {
        // href mobil URL ile güncellense de masaüstü URL kaybolmaz.
        if (!button.hasAttribute("data-url")) {
            button.setAttribute("data-url", button.getAttribute("href") || "");
        }

        var normalUrl = button.getAttribute("data-url") || "";
        var mobileUrl = (button.getAttribute("data-mobile-url") || "").trim();
        var target = currentTarget(button);
        var href = !isDesktop() && target !== "_modal" && mobileUrl
            ? mobileUrl
            : normalUrl;

        return { target: target, url: (href || "").trim(), mobile: !isDesktop() };
    }

    function synchronizeLink(button) {
        var state = linkState(button);
        var target = state.target;
        var href = state.url;

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
        var element = findModal(button);
        if (!element) {
            console.warn("Butona bağlı modal sayfada bulunamadı.");
            return;
        }
        if (!window.bootstrap || !window.bootstrap.Modal) {
            console.error("Bootstrap 5 JavaScript yüklenmemiş.");
            return;
        }
        var modal = window.bootstrap.Modal.getOrCreateInstance(element);
        if (element.classList.contains("show")) modal.hide();
        else modal.show();
    }

    function openPopupWindow(url) {
        var screenLeft = typeof window.screenLeft === "number"
            ? window.screenLeft : window.screenX;
        var screenTop = typeof window.screenTop === "number"
            ? window.screenTop : window.screenY;
        var availableWidth = window.innerWidth ||
            document.documentElement.clientWidth || screen.width;
        var availableHeight = window.innerHeight ||
            document.documentElement.clientHeight || screen.height;
        var width = Math.min(900, availableWidth);
        var height = Math.min(800, availableHeight);
        var left = screenLeft + Math.max(0, (availableWidth - width) / 2);
        var top = screenTop + Math.max(0, (availableHeight - height) / 2);
        var features = [
            "popup=yes", "width=" + Math.round(width), "height=" + Math.round(height),
            "left=" + Math.round(left), "top=" + Math.round(top),
            "resizable=yes", "scrollbars=yes", "toolbar=no", "menubar=no",
            "location=no", "status=no"
        ].join(",");
        var popup = window.open(url, "_blank", features);
        if (popup) {
            popup.opener = null;
            popup.focus();
        } else {
            // Popup engellendiyse kullanıcı linke yine ulaşabilsin.
            window.location.assign(url);
        }
    }

    function synchronizeEventLink(event) {
        var button = event.target.closest("[data-ykb-button]");
        if (button) synchronizeLink(button);
    }

    function handleLinkClick(event) {
        var button = event.target.closest("[data-ykb-button]");
        if (!button) return;
        var state = synchronizeLink(button);
        if (event.defaultPrevented || event.ctrlKey || event.metaKey ||
            event.shiftKey || event.altKey || event.button > 0) return;
        if (state.target === "_modal") return;

        // Bu bağlantının URL işlemini tek dinleyici yönetir. Sonraki eski
        // dinleyiciler masaüstü URL'siyle ikinci bir yönlendirme yapamaz.
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!state.url || state.url === "#") return;

        // Navigasyon href'in daha sonra değişmesine bağlı değildir.
        var url = new URL(state.url, document.baseURI).href;
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

    var desktopMedia = window.matchMedia("(min-width: 992px)");
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
        var button = event.target.closest("[data-ykb-button]");
        if (!button) return;

        var target = currentTarget(button);
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
        var autoButton = Array.from(document.querySelectorAll(
            '[data-ykb-button][data-auto-open="true"]'
        )).find(function (button) {
            var element = findModal(button);
            return element && !hasSeen(element.id);
        });
        if (!autoButton) return;
        var element = findModal(autoButton);
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
