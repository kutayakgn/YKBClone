(function (window, document) {
  "use strict";

  var state = {
    header: null,
    desktopHeader: null,
    desktopTabs: [],
    dropdownButtons: [],
    dropdownPanels: [],
    pinnedDesktopTab: null,
    scrollFrame: 0,
    allNodes: [],
    tabNodes: [],
    activeTab: null,
    navigationStack: [],
    mobileMenu: null,
    mobileMenuToggle: null,
    mobileButtons: null,
    mobileMenuContent: null,
    mobileTabButtons: [],
    mobileNotificationButton: null,
    mobileNotificationMenu: null,
    mobileActionSheet: null,
    initialized: false,
    globalEventsBound: false,
    phase: "not-started",
    lastError: null
  };

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList || []);
  }

  function findHeader() {
    return document.querySelector("[data-ykb-header]");
  }

  function findDropdownPanel(name) {
    var result = null;
    state.dropdownPanels.some(function (panel) {
      if (panel.getAttribute("data-dropdown-panel") === name) {
        result = panel;
        return true;
      }
      return false;
    });
    return result;
  }

  function findDropdownButton(name) {
    var result = null;
    state.dropdownButtons.some(function (button) {
      if (button.getAttribute("data-header-dropdown") === name) {
        result = button;
        return true;
      }
      return false;
    });
    return result;
  }

  function closeDesktopTabs() {
    state.pinnedDesktopTab = null;
    state.desktopTabs.forEach(function (tab) {
      var button = tab.querySelector(".ykb-tab-button");
      tab.classList.remove("is-open");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function openDesktopTab(tab, pin) {
    var button;
    if (!tab) return false;
    closeDesktopTabs();
    tab.classList.add("is-open");
    button = tab.querySelector(".ykb-tab-button");
    if (button) button.setAttribute("aria-expanded", "true");
    if (pin === true) state.pinnedDesktopTab = tab;
    return true;
  }

  function initDesktopTabs() {
    state.desktopTabs = toArray(state.header.querySelectorAll("[data-desktop-tab]"));
    state.desktopHeader = state.header.querySelector(".ykb-desktop-header");

    state.desktopTabs.forEach(function (tab) {
      var button;
      if (tab.getAttribute("data-ykb-tab-bound") === "true") return;
      tab.setAttribute("data-ykb-tab-bound", "true");
      button = tab.querySelector(".ykb-tab-button");
      tab.addEventListener("mouseenter", function () {
        if (state.pinnedDesktopTab !== tab) openDesktopTab(tab, false);
      });
      tab.addEventListener("mouseleave", function () {
        if (state.pinnedDesktopTab !== tab) closeDesktopTabs();
      });
      if (button) {
        button.addEventListener("focus", function () {
          openDesktopTab(tab, false);
        });
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          openDesktopTab(tab, true);
        });
      }
    });

    if (state.desktopHeader && state.desktopHeader.getAttribute("data-ykb-leave-bound") !== "true") {
      state.desktopHeader.setAttribute("data-ykb-leave-bound", "true");
      state.desktopHeader.addEventListener("mouseleave", function () {
        if (!state.pinnedDesktopTab) closeDesktopTabs();
      });
    }
    return state.desktopTabs.length;
  }

  function updateDesktopHeaderState() {
    state.scrollFrame = 0;
    if (state.desktopHeader) {
      state.desktopHeader.classList.toggle("is-condensed", window.scrollY >= 32);
    }
  }

  function initDesktopScroll() {
    updateDesktopHeaderState();
    if (document.documentElement.getAttribute("data-ykb-scroll-bound") === "true") return;
    document.documentElement.setAttribute("data-ykb-scroll-bound", "true");
    window.addEventListener("scroll", function () {
      if (state.scrollFrame) return;
      state.scrollFrame = window.requestAnimationFrame(updateDesktopHeaderState);
    }, { passive: true });
  }

  function closeDesktopDropdowns(exceptName) {
    var exception = exceptName || "";
    state.dropdownPanels.forEach(function (panel) {
      if (panel.getAttribute("data-dropdown-panel") !== exception) panel.hidden = true;
    });
    state.dropdownButtons.forEach(function (button) {
      if (button.getAttribute("data-header-dropdown") !== exception) {
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function openDesktopDropdown(name) {
    var panel = findDropdownPanel(name);
    var button = findDropdownButton(name);
    if (!panel || !button) return false;
    closeDesktopTabs();
    closeDesktopDropdowns(name);
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    return true;
  }

  function toggleDesktopDropdown(name) {
    var panel = findDropdownPanel(name);
    if (!panel) return false;
    if (panel.hidden) return openDesktopDropdown(name);
    closeDesktopDropdowns();
    return false;
  }

  function handleDesktopDropdownClick(event) {
    var button = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    toggleDesktopDropdown(button.getAttribute("data-header-dropdown"));
  }

  function initDesktopDropdowns() {
    if (!state.header) state.header = findHeader();
    if (!state.header) {
      state.phase = "header-not-found";
      return 0;
    }
    state.dropdownButtons = toArray(state.header.querySelectorAll("[data-header-dropdown]"));
    state.dropdownPanels = toArray(state.header.querySelectorAll("[data-dropdown-panel]"));
    state.dropdownButtons.forEach(function (button) {
      if (button.getAttribute("data-ykb-dropdown-bound") === "true") return;
      button.setAttribute("data-ykb-dropdown-bound", "true");
      button.addEventListener("click", handleDesktopDropdownClick);
    });
    return state.dropdownButtons.length;
  }

  function parseMobileMenuData() {
    var dataElement = state.header.querySelector("#ykb-mobile-menu-data");
    try {
      state.allNodes = JSON.parse(dataElement ? dataElement.textContent : "[]");
    } catch (error) {
      state.allNodes = [];
      state.lastError = error;
    }
    state.tabNodes = state.allNodes.filter(function (node) {
      return node.Role === "Tab";
    });
    state.activeTab = state.tabNodes[0] || null;
  }

  function visibleMobileChildren(node) {
    var children = node && node.Children ? node.Children : [];
    return children.filter(function (child) {
      return child.DisplayOnMobile !== false;
    });
  }

  function createIcon(className, extraClass) {
    var icon = document.createElement("i");
    icon.className = ((extraClass || "") + " " + (className || "")).replace(/^\s+|\s+$/g, "");
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function clearElement(element) {
    while (element && element.firstChild) element.removeChild(element.firstChild);
  }

  function renderMobileLevel() {
    var currentNode;
    var isRoot;
    var list;
    var animateRows;
    if (!state.mobileMenuContent || !state.activeTab) return;
    clearElement(state.mobileMenuContent);
    if (state.mobileMenu) state.mobileMenu.scrollTop = 0;
    currentNode = state.navigationStack.length
      ? state.navigationStack[state.navigationStack.length - 1]
      : state.activeTab;
    isRoot = state.navigationStack.length === 0;

    if (!isRoot) {
      var back = document.createElement("button");
      var backLabel = document.createElement("span");
      var title = document.createElement("div");
      var titleText = document.createElement("span");
      back.type = "button";
      back.className = "ykb-mobile-back";
      back.appendChild(createIcon("icon-chevron-left"));
      backLabel.textContent = state.navigationStack.length === 1
        ? "Geri"
        : state.navigationStack[state.navigationStack.length - 2].Title;
      back.appendChild(backLabel);
      back.addEventListener("click", function () {
        state.navigationStack.pop();
        renderMobileLevel();
      });
      state.mobileMenuContent.appendChild(back);

      title.className = "ykb-mobile-level-title";
      if (state.navigationStack.length === 1 && currentNode.IconCssClass) {
        title.appendChild(createIcon(currentNode.IconCssClass));
      }
      titleText.textContent = currentNode.Title;
      title.appendChild(titleText);
      state.mobileMenuContent.appendChild(title);
    }

    list = document.createElement("div");
    list.className = "ykb-mobile-menu-list" + (isRoot ? " is-root" : "");
    animateRows = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animateRows) list.classList.add("is-entering");

    visibleMobileChildren(currentNode).forEach(function (node, index) {
      var children = visibleMobileChildren(node);
      var element = document.createElement(children.length ? "button" : "a");
      var label = document.createElement("span");
      element.className = "ykb-mobile-menu-row";
      element.style.setProperty("--ykb-row-index", index);
      if (children.length) {
        element.type = "button";
        element.addEventListener("click", function () {
          state.navigationStack.push(node);
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
        element.appendChild(createIcon(node.IconCssClass, "ykb-row-icon"));
      } else if (isRoot) {
        var spacer = document.createElement("span");
        spacer.className = "ykb-row-icon";
        element.appendChild(spacer);
      }
      label.className = "ykb-row-title";
      label.textContent = node.Title;
      if (node.BadgeText) {
        var badge = document.createElement("span");
        badge.className = "ykb-mobile-badge";
        badge.textContent = node.BadgeText;
        label.appendChild(document.createTextNode(" "));
        label.appendChild(badge);
      }
      element.appendChild(label);
      if (children.length) element.appendChild(createIcon("icon-chevron-right", "ykb-chevron"));
      list.appendChild(element);
    });

    state.mobileMenuContent.appendChild(list);
    if (animateRows) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (document.documentElement.contains(list)) list.classList.remove("is-entering");
        });
      });
    }
  }

  function closeMobileOverlays() {
    if (state.mobileNotificationMenu) state.mobileNotificationMenu.hidden = true;
    closeMobileActionSheet();
  }

  function closeMobileActionSheet() {
    var sheet = state.mobileActionSheet;
    var removed = false;
    var removeSheet;
    state.mobileActionSheet = null;
    if (state.header) {
      toArray(state.header.querySelectorAll("[data-mobile-action]")).forEach(function (button) {
        button.setAttribute("aria-expanded", "false");
      });
    }
    if (!sheet || !sheet.parentNode) return;
    sheet.classList.remove("is-open");
    removeSheet = function (event) {
      if (event && (event.target !== sheet || event.propertyName !== "max-height")) return;
      if (removed) return;
      removed = true;
      sheet.removeEventListener("transitionend", removeSheet);
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    };
    sheet.addEventListener("transitionend", removeSheet);
    window.setTimeout(removeSheet, 360);
  }

  function setMobileMenuOpen(open) {
    if (!state.mobileMenu || !state.mobileMenuToggle) return false;
    closeMobileOverlays();
    state.mobileMenu.hidden = !open;
    if (state.mobileButtons) state.mobileButtons.hidden = open;
    state.mobileMenuToggle.setAttribute("aria-expanded", String(open));
    state.mobileMenuToggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    document.body.classList.toggle("ykb-menu-open", open);
    if (open) {
      state.navigationStack = [];
      renderMobileLevel();
    }
    return open;
  }

  function appendActionLink(parent, node, modifier) {
    var link = document.createElement("a");
    var label = document.createElement("span");
    link.className = "ykb-action-item ykb-action-item--" + modifier;
    link.href = node.Url || "#";
    if (node.OpenInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    if (node.IconCssClass) link.appendChild(createIcon(node.IconCssClass));
    label.textContent = node.Title;
    link.appendChild(label);
    parent.appendChild(link);
  }

  function appendActionGroup(parent, groupNode) {
    var group = document.createElement("div");
    var children = visibleMobileChildren(groupNode);
    group.className = "ykb-action-group";
    appendActionLink(group, groupNode, "primary");
    if (children.length) {
      var childList = document.createElement("div");
      childList.className = "ykb-action-children";
      children.forEach(function (child) {
        appendActionLink(childList, child, "child");
      });
      group.appendChild(childList);
    }
    parent.appendChild(group);
  }

  function findNodeById(id) {
    var result = null;
    state.allNodes.some(function (node) {
      if (String(node.Id) === String(id)) {
        result = node;
        return true;
      }
      return false;
    });
    return result;
  }

  function closestActionWrap(element) {
    var current = element;
    while (current && current !== state.header) {
      if (current.hasAttribute && current.hasAttribute("data-mobile-action-wrap")) return current;
      current = current.parentNode;
    }
    return null;
  }

  function initMobileHeader() {
    parseMobileMenuData();
    state.mobileMenu = state.header.querySelector("[data-mobile-menu]");
    state.mobileMenuToggle = state.header.querySelector("[data-mobile-menu-toggle]");
    state.mobileButtons = state.header.querySelector("[data-mobile-buttons]");
    state.mobileMenuContent = state.header.querySelector("[data-mobile-menu-content]");
    state.mobileTabButtons = toArray(state.header.querySelectorAll("[data-mobile-tab]"));
    state.mobileNotificationButton = state.header.querySelector("[data-mobile-notifications]");
    state.mobileNotificationMenu = state.header.querySelector("[data-mobile-notification-menu]");

    if (state.mobileMenuToggle && state.mobileMenuToggle.getAttribute("data-ykb-bound") !== "true") {
      state.mobileMenuToggle.setAttribute("data-ykb-bound", "true");
      state.mobileMenuToggle.addEventListener("click", function () {
        setMobileMenuOpen(state.mobileMenu ? state.mobileMenu.hidden : true);
      });
    }

    state.mobileTabButtons.forEach(function (button) {
      if (button.getAttribute("data-ykb-bound") === "true") return;
      button.setAttribute("data-ykb-bound", "true");
      button.addEventListener("click", function () {
        var nextTab = null;
        state.tabNodes.some(function (tab) {
          if (String(tab.Id) === String(button.getAttribute("data-mobile-tab"))) {
            nextTab = tab;
            return true;
          }
          return false;
        });
        if (!nextTab) return;
        state.activeTab = nextTab;
        state.navigationStack = [];
        state.mobileTabButtons.forEach(function (item) {
          var selected = item === button;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-selected", String(selected));
        });
        renderMobileLevel();
      });
    });

    if (state.mobileNotificationButton && state.mobileNotificationButton.getAttribute("data-ykb-bound") !== "true") {
      state.mobileNotificationButton.setAttribute("data-ykb-bound", "true");
      state.mobileNotificationButton.addEventListener("click", function (event) {
        var willOpen = state.mobileNotificationMenu ? state.mobileNotificationMenu.hidden : false;
        event.stopPropagation();
        closeMobileOverlays();
        if (state.mobileNotificationMenu) state.mobileNotificationMenu.hidden = !willOpen;
      });
    }

    toArray(state.header.querySelectorAll("[data-mobile-action]")).forEach(function (button) {
      if (button.getAttribute("data-ykb-bound") === "true") return;
      button.setAttribute("data-ykb-bound", "true");
      button.addEventListener("click", function (event) {
        var node = findNodeById(button.getAttribute("data-mobile-action"));
        var wasSame;
        var sheet;
        var wrap;
        event.stopPropagation();
        if (!node) return;
        wasSame = state.mobileActionSheet && state.mobileActionSheet.getAttribute("data-action-id") === String(node.Id);
        closeMobileOverlays();
        if (wasSame) return;
        sheet = document.createElement("div");
        sheet.className = "ykb-mobile-action-sheet " + (node.Role === "InternetBranch" ? "is-red" : "is-blue");
        sheet.setAttribute("data-action-id", String(node.Id));
        visibleMobileChildren(node).forEach(function (groupNode) {
          appendActionGroup(sheet, groupNode);
        });
        wrap = closestActionWrap(button);
        if (!wrap) return;
        wrap.appendChild(sheet);
        button.setAttribute("aria-expanded", "true");
        state.mobileActionSheet = sheet;
        window.requestAnimationFrame(function () {
          if (sheet.parentNode && state.mobileActionSheet === sheet) sheet.classList.add("is-open");
        });
      });
    });
  }

  function bindGlobalEvents() {
    if (state.globalEventsBound) return;
    state.globalEventsBound = true;
    document.addEventListener("click", function (event) {
      if (state.header && !state.header.contains(event.target)) {
        closeDesktopDropdowns();
        closeDesktopTabs();
        closeMobileOverlays();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" && event.keyCode !== 27) return;
      closeDesktopDropdowns();
      closeDesktopTabs();
      closeMobileOverlays();
      setMobileMenuOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992) setMobileMenuOpen(false);
    });
  }

  function getStatus() {
    return {
      phase: state.phase,
      initialized: state.initialized,
      headerFound: Boolean(state.header || findHeader()),
      dropdownButtonCount: state.dropdownButtons.length,
      dropdownPanelCount: state.dropdownPanels.length,
      lastError: state.lastError ? String(state.lastError.message || state.lastError) : null
    };
  }

  function getDebugInfo() {
    return {
      status: getStatus(),
      header: state.header || findHeader(),
      dropdownButtons: state.dropdownButtons,
      dropdownPanels: state.dropdownPanels
    };
  }

  function initYkbHeader() {
    if (state.initialized) return true;
    state.phase = "finding-header";
    state.header = findHeader();
    if (!state.header) {
      state.phase = "header-not-found";
      return false;
    }
    try {
      state.phase = "desktop-tabs";
      initDesktopTabs();
      state.phase = "desktop-dropdowns";
      initDesktopDropdowns();
      state.phase = "desktop-scroll";
      initDesktopScroll();
      state.phase = "mobile";
      initMobileHeader();
      state.phase = "global-events";
      bindGlobalEvents();
      state.initialized = true;
      state.phase = "ready";
      state.header.setAttribute("data-ykb-initialized", "true");
      return true;
    } catch (error) {
      state.lastError = error;
      state.phase = "error";
      state.initialized = false;
      state.header.removeAttribute("data-ykb-initialized");
      if (window.console && window.console.error) {
        window.console.error("YKB header başlatılamadı:", error);
      }
      return false;
    }
  }

  window.YkbHeader = {
    init: initYkbHeader,
    initDesktopDropdowns: initDesktopDropdowns,
    openDropdown: openDesktopDropdown,
    toggleDropdown: toggleDesktopDropdown,
    closeDropdowns: closeDesktopDropdowns,
    closeTabs: closeDesktopTabs,
    status: getStatus,
    debug: getDebugInfo
  };

  function startYkbHeader() {
    window.YkbHeader.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startYkbHeader);
  } else {
    startYkbHeader();
  }
})(window, document);
