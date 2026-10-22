(function (window, document) {
    "use strict";
    window.YKB = window.YKB || {};
    if (window.YkbVideoCardListInitialized &&
        typeof window.YKB.initVideoCardLists === "function") {
        window.YKB.initVideoCardLists();
        return;
    }
    function setVisible(element, visible) {
        if (!element ||
            typeof element.setAttribute !== "function") {
            return;
        }
        if (visible) {
            element.removeAttribute("hidden");
        } else {
            element.setAttribute("hidden", "");
        }
    }
    function initializeDropdown(root, onChange) {
        var dropdown = root.querySelector(
            "[data-video-year-dropdown]"
        );
        if (!dropdown) {
            return;
        }
        var trigger = dropdown.querySelector(
            "[data-video-year-trigger]"
        );
        var panel = dropdown.querySelector(
            "[data-video-year-panel]"
        );
        var search = dropdown.querySelector(
            "[data-video-year-search]"
        );
        var selectedLabel = dropdown.querySelector(
            "[data-video-year-selected]"
        );
        var yearInput = dropdown.querySelector(
            "[data-video-card-year]"
        );
        var empty = dropdown.querySelector(
            "[data-video-year-empty]"
        );
        var options = Array.from(
            dropdown.querySelectorAll("[data-video-year-option]")
        );
        if (!trigger || !panel || !search ||
            !selectedLabel || !yearInput) {
            throw new Error(
                "VideoCardList dropdown HTML alanları eksik. " +
                "Aramalı dropdown CSHTML sürümünü kullanın."
            );
        }
        var filteredOptions = function () {
            return options.filter(function (option) {
                return !option.hidden;
            });
        };
        var filter = function () {
            var query = search.value.trim();
            options.forEach(function (option) {
                setVisible(
                    option,
                    option.dataset.value.includes(query)
                );
            });
            setVisible(
                empty,
                filteredOptions().length === 0
            );
        };
        var close = function (restoreFocus) {
            setVisible(panel, false);
            trigger.setAttribute("aria-expanded", "false");
            if (restoreFocus) {
                trigger.focus();
            }
        };
        var open = function () {
            search.value = "";
            filter();
            setVisible(panel, true);
            trigger.setAttribute("aria-expanded", "true");
            search.focus();
        };
        var select = function (option) {
            yearInput.value = option.dataset.value;
            selectedLabel.textContent = option.dataset.value;
            options.forEach(function (item) {
                item.setAttribute(
                    "aria-selected",
                    item === option ? "true" : "false"
                );
            });
            close(true);
            onChange();
        };
        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (trigger.getAttribute("aria-expanded") === "true") {
                close(false);
            } else {
                open();
            }
        });
        trigger.addEventListener("keydown", function (event) {
            if (event.key === "ArrowDown" ||
                event.key === "ArrowUp") {
                event.preventDefault();
                open();
            }
        });
        search.addEventListener("input", filter);
        panel.addEventListener("click", function (event) {
            var option = event.target.closest(
                "[data-video-year-option]"
            );
            if (!option || !panel.contains(option)) {
                return;
            }
            event.preventDefault();
            select(option);
        });
        dropdown.addEventListener("keydown", function (event) {
            if (panel.hidden) {
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close(true);
                return;
            }
            var available = filteredOptions();
            if (!available.length) {
                return;
            }
            var index = available.indexOf(
                document.activeElement
            );
            if (event.key === "ArrowDown") {
                event.preventDefault();
                available[
                    index < 0
                        ? 0
                        : Math.min(index + 1, available.length - 1)
                ].focus();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (index === 0) {
                    search.focus();
                } else {
                    available[
                        index < 0
                            ? available.length - 1
                            : index - 1
                    ].focus();
                }
            } else if (
                event.key === "Enter" &&
                document.activeElement === search
            ) {
                event.preventDefault();
                select(available[0]);
            }
        });
        dropdown.addEventListener("focusout", function (event) {
            if (!dropdown.contains(event.relatedTarget)) {
                close(false);
            }
        });
        document.addEventListener("click", function (event) {
            if (!dropdown.contains(event.target)) {
                close(false);
            }
        });
        close(false);
    }
    function pageButton(label, page, active, disabled) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "video-card-list__page";
        button.textContent = label;
        button.dataset.page = String(page);
        button.disabled = disabled;
        if (active) {
            button.classList.add("is-active");
            button.setAttribute("aria-current", "page");
        }
        return button;
    }
    function initializeList(root) {
        if (root.getAttribute("data-video-list-initialized") === "true") return;

        var yearInput = root.querySelector("[data-video-card-year]");
        var heading = root.querySelector("[data-video-card-year-heading]");
        var pagination = root.querySelector("[data-video-card-pagination]");
        var empty = root.querySelector("[data-video-card-empty]");
        var status = root.querySelector("[data-video-card-status]");
        var cards = Array.prototype.slice.call(root.querySelectorAll("[data-video-card-item]"));
        var filterActive = root.getAttribute("data-filter-active") !== "false";
        if (!pagination || !empty || !status ||
            (filterActive && cards.length > 0 && !yearInput)) {
            throw new Error("VideoCardList HTML alanları eksik: " + root.id);
        }
        var parsedSize = parseInt(root.getAttribute("data-page-size"), 10);
        var state = {
            currentPage: 1,
            pageSize: isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 0
        };

        function renderPagination(pageCount) {
            pagination.replaceChildren();
            if (state.pageSize === 0 || pageCount <= 1) {
                setVisible(pagination, false);
                return;
            }
            setVisible(pagination, true);
            function appendArrow(label, page, description, disabled) {
                var button = pageButton(label, page, false, disabled);
                button.classList.add("video-card-list__page--arrow");
                button.setAttribute("aria-label", description);
                pagination.appendChild(button);
            }
            // Sınır sayfalarda da oklar görünür; uygun olmayanlar disabled olur.
            appendArrow("<<", 1, "İlk sayfa", state.currentPage === 1);
            appendArrow("<", state.currentPage - 1, "Önceki sayfa", state.currentPage === 1);
            var visibleCount = Math.min(5, pageCount);
            var firstPage = Math.max(1,
                Math.min(state.currentPage - 2, pageCount - visibleCount + 1));
            var lastPage = firstPage + visibleCount - 1;
            for (var page = firstPage; page <= lastPage; page += 1) {
                var button = pageButton(String(page), page, page === state.currentPage, false);
                button.setAttribute("aria-label", page + ". sayfa");
                pagination.appendChild(button);
            }
            appendArrow(">", state.currentPage + 1, "Sonraki sayfa", state.currentPage === pageCount);
            appendArrow(">>", pageCount, "Son sayfa", state.currentPage === pageCount);
        }

        function render() {
            var selectedYear = filterActive && yearInput ? yearInput.value.trim() : "";
            var filtered = cards.filter(function (card) {
                return !filterActive ||
                    (card.getAttribute("data-year") || "").trim() === selectedYear;
            });
            var pageCount = state.pageSize > 0 ? Math.ceil(filtered.length / state.pageSize) : 1;
            state.currentPage = Math.max(1, Math.min(state.currentPage, Math.max(1, pageCount)));
            var start = state.pageSize > 0 ? (state.currentPage - 1) * state.pageSize : 0;
            var end = state.pageSize > 0 ? start + state.pageSize : filtered.length;
            var visible = filtered.slice(start, end);
            cards.forEach(function (card) {
                setVisible(card, visible.indexOf(card) !== -1);
            });
            if (heading) {
                heading.textContent = filterActive ? selectedYear :
                    (root.getAttribute("data-unfiltered-title") || "Videolar");
            }
            setVisible(empty, filtered.length === 0);
            renderPagination(pageCount);
            status.textContent = filtered.length === 0
                ? "Gösterilecek video bulunamadı."
                : filtered.length + " videodan " + (start + 1) + "–" +
                    Math.min(end, filtered.length) + " arası gösteriliyor.";
        }

        if (filterActive) {
            initializeDropdown(root, function () {
                state.currentPage = 1;
                render();
            });
            if (yearInput) {
                yearInput.addEventListener("change", function () {
                    state.currentPage = 1;
                    render();
                });
            }
        }
        pagination.addEventListener("click", function (event) {
            var button = event.target.closest("button[data-page]");
            if (!button || !pagination.contains(button) || button.disabled) return;
            event.preventDefault();
            var page = parseInt(button.getAttribute("data-page"), 10);
            if (!isFinite(page)) return;
            state.currentPage = page;
            render();
            var active = pagination.querySelector('[aria-current="page"]');
            if (active) active.focus({ preventScroll: true });
        });
        render();
        root.setAttribute("data-video-list-initialized", "true");
        root.setAttribute("data-initialized", "true");
    }
    function initializeModal(modal) {
        if (modal.getAttribute("data-video-modal-initialized") === "true") {
            return;
        }
        var iframe = modal.querySelector(
            "[data-video-card-iframe]"
        );
        if (!iframe) {
            return;
        }
        document.body.appendChild(modal);
        modal.addEventListener("show.bs.modal", function () {
            var embedUrl = iframe.dataset.embedUrl;
            if (!embedUrl) {
                return;
            }
            var url = new URL(embedUrl);
            url.searchParams.set("autoplay", "0");
            url.searchParams.set("playsinline", "1");
            url.searchParams.set("rel", "0");
            iframe.src = url.toString();
        });
        modal.addEventListener("hidden.bs.modal", function () {
            iframe.removeAttribute("src");
        });
        modal.setAttribute("data-video-modal-initialized", "true");
    }
    function initializeAll() {
        document.querySelectorAll("[data-video-card-modal]")
            .forEach(function (modal) {
                try {
                    initializeModal(modal);
                } catch (error) {
                    console.error("Video modal başlatılamadı.", error);
                }
            });
        document.querySelectorAll("[data-video-card-list]")
            .forEach(function (root) {
                try {
                    initializeList(root);
                } catch (error) {
                    console.error(
                        "VideoCardList başlatılamadı: " + root.id,
                        error
                    );
                }
            });
    }
    window.YkbVideoCardListInitialized = true;
    window.YKB.initVideoCardLists = initializeAll;
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAll,
            { once: true }
        );
    } else {
        initializeAll();
    }
    window.addEventListener(
        "load",
        initializeAll,
        { once: true }
    );
})(window, document);
