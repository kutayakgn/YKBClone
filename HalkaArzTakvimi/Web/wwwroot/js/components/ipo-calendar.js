(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.IpoCalendar) {
        window.YKB.IpoCalendar.init();
        return;
    }
    var state = { registered: false };
    var imageStates = new WeakMap();
    var retryDelays = [600, 1500, 3000];

    function initializeImage(image) {
        if (imageStates.has(image)) return;
        var source = image.getAttribute("src");
        if (!source) return;
        var imageState = { retries: 0, timer: null };
        imageStates.set(image, imageState);
        image.setAttribute("loading", "eager");
        image.setAttribute("decoding", "async");
        image.dataset.ipoImageState = "loading";
        image.dataset.ipoImageRetries = "0";

        function loaded() {
            if (imageState.timer !== null) window.clearTimeout(imageState.timer);
            imageState.timer = null;
            image.dataset.ipoImageState = "loaded";
        }
        function failed() {
            // A pending retry or a later change to src must not create duplicate requests.
            if (imageState.timer !== null || image.getAttribute("src") !== source) return;
            if (imageState.retries >= retryDelays.length) {
                image.dataset.ipoImageState = "failed";
                return;
            }
            var delay = retryDelays[imageState.retries];
            imageState.retries += 1;
            image.dataset.ipoImageRetries = String(imageState.retries);
            image.dataset.ipoImageState = "retrying";
            imageState.timer = window.setTimeout(function () {
                imageState.timer = null;
                if (!image.isConnected || image.getAttribute("src") !== source) return;
                if (image.complete && image.naturalWidth > 0) { loaded(); return; }
                image.dataset.ipoImageState = "loading";
                // Reissue the original URL. Do not append cache-busting parameters to
                // Kentico URLs: their query string can contain a signature.
                image.removeAttribute("src");
                image.setAttribute("src", source);
            }, delay);
        }
        image.addEventListener("load", loaded);
        image.addEventListener("error", failed);
        // Initial load/error can precede this bundle's initialization.
        if (image.complete) {
            if (image.naturalWidth > 0) loaded();
            else failed();
        }
    }

    function initializeImages() {
        document.querySelectorAll('[data-ct-feed][data-kind="ipo-calendar"] .ipo-calendar img.slogo')
            .forEach(initializeImage);
    }
    function factory(root) {
        function updateYears() {
            var groups = root.querySelectorAll("[data-ipo-year-group]");
            Array.prototype.forEach.call(groups, function (group) {
                var rows = group.querySelectorAll("[data-ct-row]");
                var hasVisibleRows = Array.prototype.some.call(rows, function (row) {
                    return !row.hasAttribute("hidden");
                });
                if (hasVisibleRows) group.removeAttribute("hidden");
                else group.setAttribute("hidden", "");
            });
        }
        root.addEventListener("ykb:customtablefeed-rendered", updateYears);
        return function () {
            return function () { return true; };
        };
    }
    function register() {
        initializeImages();
        if (state.registered || !window.YKB.CustomTableFeeds) return;
        state.registered = true;
        window.YKB.CustomTableFeeds.register("ipo-calendar", factory);
    }
    window.YKB.IpoCalendar = { init: register };
    document.addEventListener("ykb:customtablefeed-ready", register);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", register, { once: true });
    }
    register();
})(window, document);
