(function (window, document) {
    'use strict';

    // ES5 syntax for the existing bundle/minifier. No dependency on jQuery.
    if (window.YkbChooseCredit) {
        window.YkbChooseCredit.init(document);
        return;
    }

    function list(scope, selector) {
        return Array.prototype.slice.call(scope.querySelectorAll(selector));
    }

    function safeRedirect(value) {
        var raw = (value || '').trim();
        var decoded = raw;
        var parsed;
        var index;
        if (!raw) return null;
        // The server applies the same restriction. Check encoded separators/control characters too.
        for (index = 0; index < 8; index++) {
            if (/[\u0000-\u001f\u007f-\u009f\\]/.test(decoded) || decoded.indexOf('//') === 0) return null;
            var next;
            try {
                next = decodeURIComponent(decoded);
            } catch (error) {
                // Like Uri.UnescapeDataString, retain malformed UTF-8/percent sequences,
                // while still decoding ASCII escapes that could conceal an unsafe path.
                next = decoded.replace(/%([0-7][a-f0-9])/gi, function (match, hex) {
                    return String.fromCharCode(parseInt(hex, 16));
                });
            }
            if (next === decoded) break;
            decoded = next;
        }
        if (index === 8) return null;
        if (!/^\/(?!\/)/.test(raw) && !/^https?:\/\//i.test(raw)) return null;
        try {
            parsed = new window.URL(raw, window.location.href);
            if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) return null;
            if (raw.charAt(0) === '/' && parsed.origin !== window.location.origin) return null;
            return parsed.href;
        } catch (error) {
            return null;
        }
    }

    function initialize(root) {
        if (root.getAttribute('data-credit-ready') === 'true') return;
        var questions = list(root, '[data-credit-question]');
        var button = root.querySelector('[data-credit-continue]');
        var errorElement = root.querySelector('[data-credit-error]');
        // Invalid server configuration deliberately renders no interactive controls.
        if (!questions.length || !button || !errorElement) return;

        var byKey = Object.create(null);
        var visited = Object.create(null);
        var activeKey = root.getAttribute('data-start-question') || questions[0].getAttribute('data-credit-question');
        var failed = false;
        var navigating = false;

        function error(message, configuration) {
            errorElement.textContent = message;
            errorElement.hidden = false;
            if (configuration) {
                failed = true;
                button.disabled = true;
            }
        }

        function configurationError() {
            error(root.getAttribute('data-configuration-message') || 'Kredi seçim adımları şu anda görüntülenemiyor.', true);
        }

        function clearError() {
            errorElement.hidden = true;
            errorElement.textContent = '';
            list(root, '[data-credit-answer]').forEach(function (radio) {
                radio.removeAttribute('aria-invalid');
                radio.removeAttribute('aria-describedby');
            });
        }

        questions.forEach(function (question) {
            var key = question.getAttribute('data-credit-question');
            if (!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(key || '') || /\s/.test(key) || byKey[key]) failed = true;
            byKey[key] = question;
        });
        if (!byKey[activeKey]) failed = true;

        // Detect broken links/cycles once, before enabling the Continue button.
        function visit(key) {
            if (visited[key] === 1) { failed = true; return; }
            if (visited[key] === 2) return;
            visited[key] = 1;
            var answers = list(byKey[key], '[data-credit-answer]');
            if (!answers.length) failed = true;
            answers.forEach(function (answer) {
                var action = answer.getAttribute('data-action');
                var target = answer.getAttribute('data-next-question');
                var url = answer.getAttribute('data-redirect-url');
                if (action === 'question' && target && !url && byKey[target]) {
                    visit(target);
                } else if (action !== 'redirect' || target || !safeRedirect(url)) {
                    failed = true;
                }
            });
            visited[key] = 2;
        }
        questions.forEach(function (question) { visit(question.getAttribute('data-credit-question')); });
        if (failed) { configurationError(); return; }

        function show(key, focus) {
            clearError();
            questions.forEach(function (question) {
                var active = question.getAttribute('data-credit-question') === key;
                question.hidden = !active;
                question.querySelector('fieldset').disabled = !active;
            });
            activeKey = key;
            if (focus) byKey[key].querySelector('fieldset').focus();
        }

        function proceed() {
            if (failed || navigating) return;
            var question = byKey[activeKey];
            var answer = question.querySelector('[data-credit-answer]:checked');
            if (!answer) {
                error(root.getAttribute('data-required-message') || 'Lütfen bir seçenek seçin.', false);
                var radios = list(question, '[data-credit-answer]');
                radios.forEach(function (radio) {
                    radio.setAttribute('aria-invalid', 'true');
                    radio.setAttribute('aria-describedby', errorElement.id);
                });
                if (radios.length) radios[0].focus();
                return;
            }
            var action = answer.getAttribute('data-action');
            var target = answer.getAttribute('data-next-question');
            if (action === 'question' && byKey[target]) {
                if (visited['path:' + target]) { configurationError(); return; }
                visited['path:' + target] = true;
                // A new step always starts without a preselected answer.
                list(byKey[target], '[data-credit-answer]').forEach(function (radio) { radio.checked = false; });
                show(target, true);
            } else if (action === 'redirect') {
                var url = safeRedirect(answer.getAttribute('data-redirect-url'));
                if (!url) { configurationError(); return; }
                navigating = true;
                button.disabled = true;
                window.location.assign(url);
            } else {
                configurationError();
            }
        }

        root.addEventListener('change', function (event) {
            if (event.target.hasAttribute('data-credit-answer')) clearError();
        });
        root.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && (event.target.hasAttribute('data-credit-answer') || event.target.tagName === 'FIELDSET')) {
                event.preventDefault();
                proceed();
            }
        });
        button.addEventListener('click', proceed);
        // Browsers may restore radio values from history. A fresh visit starts unselected.
        list(root, '[data-credit-answer]').forEach(function (radio) { radio.checked = false; });
        show(activeKey, false);
        visited['path:' + activeKey] = true;
        root.setAttribute('data-credit-ready', 'true');
        button.disabled = false;

        // Back/forward cache restores disabled buttons as well as DOM state.
        window.addEventListener('pageshow', function () {
            if (!failed) { navigating = false; button.disabled = false; }
        });
    }

    function init(scope) {
        scope = scope || document;
        if (scope.nodeType === 1 && scope.hasAttribute('data-choose-credit')) initialize(scope);
        list(scope, '[data-choose-credit]').forEach(initialize);
    }

    window.YkbChooseCredit = { init: init };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
    else init(document);
})(window, document);
