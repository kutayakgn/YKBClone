// Preview-only instrumentation. Never copy this file into the Kentico application.
(function () {
    var previous = '', changes = 0;
    window.setInterval(function () {
        var button = document.querySelector('.ykb-animated-button');
        var player = button.querySelector('.ykb-animated-button__player');
        var snapshot = player.innerHTML;
        if (snapshot && snapshot !== previous) changes++;
        previous = snapshot;
        window.parent.postMessage({ type: 'animated-button-preview',
            width: window.innerWidth, ready: button.classList.contains('is-animation-ready'),
            display: window.getComputedStyle(button).display, changes: changes,
            svg: player.querySelectorAll('svg').length,
            playerScripts: document.querySelectorAll('script[src*="lottie_light"]').length,
            overflow: document.documentElement.scrollWidth > window.innerWidth
        }, window.location.origin);
    }, 400);
})();
