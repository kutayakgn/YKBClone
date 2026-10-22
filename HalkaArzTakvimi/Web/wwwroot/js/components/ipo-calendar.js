(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YKB.IpoCalendar) {
        window.YKB.IpoCalendar.init();
        return;
    }
    var state = { registered: false };
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
