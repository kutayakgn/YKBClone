(function () {
    "use strict";

    if (window.YkbAnimatedButtons) return;

    var mobileMedia = window.matchMedia("(max-width: 767.98px)");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var states = [];
    var playerPromise;
    var dataPromises = Object.create(null);
    var observer;
    var scrollPending = false;

    function loadPlayer(url) {
        if (window.lottie && window.lottie.loadAnimation) {
            return Promise.resolve(window.lottie);
        }
        if (!playerPromise) {
            playerPromise = new Promise(function (resolve, reject) {
                var script = document.createElement("script");
                script.src = url;
                script.async = true;
                script.onload = function () {
                    if (window.lottie && window.lottie.loadAnimation) resolve(window.lottie);
                    else reject(new Error("Lottie SVG player is unavailable."));
                };
                script.onerror = function () { reject(new Error("Lottie player could not load.")); };
                document.head.appendChild(script);
            }).catch(function (error) {
                playerPromise = null;
                throw error;
            });
        }
        return playerPromise;
    }

    function loadData(url) {
        if (!dataPromises[url]) {
            dataPromises[url] = window.fetch(url, { credentials: "same-origin" })
                .then(function (response) {
                    if (!response.ok) throw new Error("Animation data could not load.");
                    return response.text();
                }).catch(function (error) {
                    delete dataPromises[url];
                    throw error;
                });
        }
        return dataPromises[url];
    }

    function canPlay(state) {
        return state.element.isConnected && state.visible && mobileMedia.matches &&
            !document.hidden && !reducedMotion.matches &&
            state.element.getAttribute("aria-disabled") !== "true";
    }

    function fail(state) {
        state.failed = true;
        state.element.classList.remove("is-animation-ready");
        if (state.animation) state.animation.destroy();
        state.animation = null;
        state.ready = false;
        // The poster and ordinary button behavior remain available on failure.
    }

    function update(state) {
        if (!canPlay(state)) {
            if (state.animation) state.animation.pause();
            if (reducedMotion.matches) state.element.classList.remove("is-animation-ready");
            return;
        }
        if (state.animation) {
            if (state.ready) {
                state.element.classList.add("is-animation-ready");
                state.animation.play();
            }
            return;
        }
        if (state.loading || state.failed || !window.fetch) return;
        state.loading = true;

        Promise.all([
            loadPlayer(state.element.getAttribute("data-player-url")),
            loadData(state.element.getAttribute("data-animation-url"))
        ]).then(function (resources) {
            if (!state.element.isConnected) return;
            state.animation = resources[0].loadAnimation({
                container: state.element.querySelector(".ykb-animated-button__player"),
                renderer: "svg",
                loop: true,
                autoplay: false,
                // Lottie mutates data. Each button needs a separate object.
                animationData: JSON.parse(resources[1]),
                rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
            });
            state.animation.addEventListener("DOMLoaded", function () {
                state.ready = true;
                update(state);
            });
            state.animation.addEventListener("data_failed", function () { fail(state); });
            state.animation.addEventListener("error", function () { fail(state); });
        }).catch(function () { fail(state); }).then(function () {
            state.loading = false;
        });
    }

    function inViewport(element) {
        var rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
            rect.top < window.innerHeight && rect.left < window.innerWidth;
    }

    function updateAll() {
        states.forEach(function (state) {
            if (!observer) state.visible = inViewport(state.element);
            update(state);
        });
    }

    function refresh() {
        states = states.filter(function (state) {
            if (state.element.isConnected) return true;
            if (observer) observer.unobserve(state.element);
            if (state.animation) state.animation.destroy();
            return false;
        });
        document.querySelectorAll('[data-ykb-animation="true"]').forEach(function (element) {
            if (states.some(function (state) { return state.element === element; })) return;
            var state = { element: element, visible: false, loading: false, ready: false,
                failed: false, animation: null };
            states.push(state);
            if (observer) observer.observe(element);
        });
        updateAll();
    }

    function watchMedia(media) {
        if (media.addEventListener) media.addEventListener("change", updateAll);
        else media.addListener(updateAll);
    }

    if (window.IntersectionObserver) {
        observer = new window.IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                states.forEach(function (state) {
                    if (state.element !== entry.target) return;
                    state.visible = entry.isIntersecting;
                    update(state);
                });
            });
        });
    } else {
        // Older browsers still keep offscreen animations paused.
        window.addEventListener("scroll", function () {
            if (scrollPending) return;
            scrollPending = true;
            window.requestAnimationFrame(function () {
                scrollPending = false;
                updateAll();
            });
        }, { passive: true });
        window.addEventListener("resize", updateAll);
        document.addEventListener("animationend", updateAll);
    }

    watchMedia(mobileMedia);
    watchMedia(reducedMotion);
    document.addEventListener("visibilitychange", updateAll);
    window.YkbAnimatedButtons = { refresh: refresh };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", refresh, { once: true });
    } else {
        refresh();
    }
})();
