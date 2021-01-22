/*jshint esversion: 6 */

/*
    Common implementation for:
    > sortable.dragdrop
    > sortable.keyboard
    > sortable.click

*/

import {Listboxes} from "./sortable.listboxes.js";
import sortableDragdropMethod from "./sortable.dragdrop.js";
import sortableKeyboardMethod from "./sortable.keyboard.js";
import sortableClickMethod from "./sortable.click.js";

const findClosestCommonParent = function (settings) {
    if (settings.containment) {
        return document.querySelector(settings.containment);
    }
    const containers = document.querySelectorAll(settings.containerSelector);
    if (containers.length === 1) {
        return containers[0].parentNode;
    }
    let parent = containers[0].parentNode,
        res;
    do {
        let allContained = true;
        for (let i = 1; i < containers.length; i++) {
            if (!parent.contains(containers[i])) {
                allContained = false;
                break;
            }
        }
        if (allContained) {
            res = parent;
        } else {
            parent = parent.parentNode;
        }
    } while (!res);
    return res;
};

const VirtualMode = function (settings) {
    return {
        itemsByContainer: settings.itemsByContainer,
        updateDOM: function (e) {
            settings.updateDOM.call(null, Object.assign({itemsByContainer: this.itemsByContainer}, e || {}));
        },
        moveItemSuper: function (e) {
            const items = this.itemsByContainer[e.from.containerIdx],
                item = items.splice(e.from.idx, 1)[0];
            if (e.to.idx || e.to.idx === 0) {
                this.itemsByContainer[e.to.containerIdx].splice(e.to.idx, 0, item);
            } else {
                this.itemsByContainer[e.to.containerIdx].push(item);
            }
            if (!e.noUpdateDOM) {
                this.updateDOM({source: e.source, domUpdated: e.domUpdated, animationComplete: e.animationComplete, animationItem: item});
            }
        },
        DOMUpdate: {
            pending: false,
            wait: function (callback) {
                const checkPendingUpdate = () => {
                    if (!this.pending) {
                        callback();
                    } else {
                        window.requestAnimationFrame(checkPendingUpdate);
                    }
                };
                checkPendingUpdate();
            }
        }
    };
};

const assignDefaultSettings = options => {
    let settings = Object.assign({}, options);
    settings.change = settings.change || function () {};
    settings.click = settings.click || {};
    settings.click.assistiveText = settings.click.assistiveText || {};
    settings.click.assistiveText.beforeItem = settings.click.assistiveText.beforeItem || "Activate to place the selected item before this.";
    settings.click.assistiveText.afterItem = settings.click.assistiveText.afterItem || "Activate to place the selected item after this.";
    settings.click.assistiveText.placeholder =
        settings.click.assistiveText.placeholder || "End of the list. Activate to place the selected item here.";
    return settings;
};

export default function (options) {
    const settings = assignDefaultSettings(options),
        virtualMode = settings.virtualMode ? VirtualMode(settings.virtualMode) : null;
    let sortingActive,
        interactionMethod = "keyboard";
    const commonParent = findClosestCommonParent(settings);
    commonParent.setAttribute("data-interaction-method", "keyboard");
    const commonSettings = {
        commonParent: commonParent,
        containerSelector: settings.containerSelector,
        itemClass: settings.itemClass,
        getContainers: () => document.querySelectorAll(settings.containerSelector),
        setSortingActiveAs: function (active) {
            if (active && !sortingActive) {
                sortingActive = true;
                commonParent.classList.add("sortable-sorting");
            } else if (!active && sortingActive) {
                sortingActive = false;
                commonParent.classList.remove("sortable-sorting");
            }
        },
        setInteractionMethod: function (method) {
            if (interactionMethod !== method) {
                interactionMethod = method;
                if (method === "keyboard") {
                    methods.click.removePlaceholder();
                } else if (method === "dragdrop") {
                    methods.keyboard.reset();
                    methods.click.reset();
                }
                commonParent.setAttribute("data-interaction-method", method);
                if (settings.interactionMethodChanged) {
                    settings.interactionMethodChanged.call(null, {method: method});
                }
            }
        },
        change: settings.change || function () {}
    };
    const listboxes = Listboxes({selector: settings.containerSelector, virtual: !!settings.virtualMode});
    const methods = {
        dragdrop: sortableDragdropMethod(Object.assign({}, commonSettings, settings.dragdrop), virtualMode),
        keyboard: sortableKeyboardMethod(Object.assign({}, commonSettings, settings.keyboard), listboxes, virtualMode),
        click: sortableClickMethod(Object.assign({}, commonSettings, settings.click), listboxes, virtualMode)
    };
    return {
        updateItems: function (itemsByContainer) {
            virtualMode.itemsByContainer.length = 0;
            virtualMode.itemsByContainer.push(...itemsByContainer);
            listboxes.clearAllActiveDescendants();
        },
        initializeNewItem: function (element) {
            methods.click.appendAssistiveTextElement(element);
        },
        reset: function () {
            commonParent.querySelectorAll('option[aria-selected="true"]').forEach(el => el.setAttribute("aria-selected", "false"));
            commonSettings.setSortingActiveAs(false);
            methods.dragdrop.reset();
            methods.keyboard.reset();
            methods.click.reset();
            if (virtualMode) {
                virtualMode.updateDOM({source: "reset-all"});
            }
            return this;
        },
        disable: function () {
            methods.dragdrop.disable();
            return this;
        },
        enable: function () {
            methods.dragdrop.enable();
            return this;
        },
        destroy: function () {
            if (methods.dragdrop) {
                methods.dragdrop.destroy();
                delete methods.dragdrop;
            }
            if (methods.keyboard) {
                methods.keyboard.destroy();
                delete methods.keyboard;
            }
            if (methods.click) {
                methods.click.destroy();
                delete methods.click;
            }
            return this;
        }
    };
}
