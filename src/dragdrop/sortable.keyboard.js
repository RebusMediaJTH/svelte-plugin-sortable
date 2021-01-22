/*jshint esversion: 6 */

/*
    Keyboard implementation of sortable
    For AT & non-AT users
    
    LEFT/UP = Nagivate to previous item
    RIGHT/DOWN = Nagivate to next item
    Alt + LEFT/UP = Move item up/left
    Alt + RIGHT/DOWN = Move item right/down
    Ctrl + LEFT/UP = Move item to previous box
    Ctrl + RIGHT/DOWN = Move item to next box
*/

import * as domUtils from "../util/domUtils.js";
import {KeyCode} from "./sortable.listboxes.js";

const createVirtualMode = function (virtualModeSuper) {
    const vm = Object.create(virtualModeSuper),
        itemsByContainer = vm.itemsByContainer;
    const selectItem = function (e) {
        itemsByContainer.forEach((items, ci) => {
            items.forEach((item, i) => {
                if (ci === e.containerIdx) {
                    item.selected = item.focused = i === e.idx;
                }
            });
        });
    };
    vm.selectItem = e => {
        selectItem(e);
        vm.updateDOM({source: "keyboard"});
    };
    vm.moveItem = e => {
        const sameBox = !!e.to.idx || e.to.idx === 0;
        e.source = "keyboard";
        e.noUpdateDOM = !sameBox;
        vm.moveItemSuper(e);
        if (sameBox) {
            selectItem(e.to);
        } else {
            // When the item is moved to another box, it's already selected but this ensures that any other item is unselected
            selectItem({containerIdx: e.to.containerIdx, idx: itemsByContainer[e.to.containerIdx].length - 1});
            vm.updateDOM({source: "keyboard", domUpdated: e.domUpdated});
        }
    };
    vm.reset = () => {
        itemsByContainer.forEach(items => items.forEach(item => (item.selected = item.focused = false)));
        // No need to update, it will be updated with the first dragdrop or click action
        //updateDOM({ source: 'keyboard' });
    };
    return vm;
};

const moveItemToAnotherBox = function (listboxes, fromBox, settings, virtualMode, key) {
    const containers = settings.getContainers();
    if (containers.length > 1) {
        const item = fromBox.querySelector('[aria-selected="true"]');
        if (item) {
            const fromBoxIdx = parseInt(fromBox.dataset.idx, 10);
            let toBoxIdx;
            if (key === KeyCode.LEFT || key === KeyCode.UP) {
                toBoxIdx = fromBoxIdx > 0 ? fromBoxIdx - 1 : null;
            } else if (key === KeyCode.RIGHT || key === KeyCode.DOWN) {
                toBoxIdx = fromBoxIdx < containers.length - 1 ? fromBoxIdx + 1 : null;
            }
            if (toBoxIdx !== null) {
                const from = {containerIdx: fromBoxIdx, idx: domUtils.getElementIndex(item)},
                    toBox = containers[toBoxIdx],
                    toIdx = toBox.children.length;
                if (virtualMode) {
                    virtualMode.moveItem({
                        from: from,
                        to: {containerIdx: toBoxIdx},
                        domUpdated: () => {
                            listboxes.focusItem(toBox, toBox.children[toIdx]);
                            toBox.focus();
                            listboxes.clearActiveDescendant(fromBox);
                        }
                    });
                } else {
                    listboxes.moveItem(fromBox, toBox);
                }
                settings.change.call(item, {method: "keyboard", from: from, to: {containerIdx: toBoxIdx, idx: toIdx}});
            }
        }
    }
};

export default function (settings, listboxes, virtualModeSuper) {
    const virtualMode = virtualModeSuper ? createVirtualMode(virtualModeSuper) : null;
    listboxes.handleKeyPress(() => settings.setInteractionMethod("keyboard"));
    listboxes.handleCtrlAndArrowKey((listboxNode, key) => moveItemToAnotherBox(listboxes, listboxNode, settings, virtualMode, key));
    listboxes.handleItemChange(function (listboxNode, type, item) {
        if (type === "moved_up" || type === "moved_down") {
            const idx = domUtils.getElementIndex(item),
                containerIdx = parseInt(listboxNode.dataset.idx, 10),
                from = {containerIdx: containerIdx},
                to = {containerIdx: containerIdx};
            if (virtualMode) {
                from.idx = idx;
                to.idx = idx + (type === "moved_down" ? 1 : -1);
                virtualMode.moveItem({from: from, to: to});
            } else {
                to.idx = idx;
                from.idx = idx + (type === "moved_down" ? -1 : 1);
            }
            settings.change.call(item, {method: "keyboard", from: from, to: to});
        }
    });
    if (settings.itemSelected) {
        listboxes.handleItemSelected((listboxNode, element) => settings.itemSelected.call(listboxNode, {item: element}));
    }
    if (virtualMode) {
        listboxes.handleNavigation((listboxNode, toItem) =>
            virtualMode.selectItem({containerIdx: parseInt(listboxNode.dataset.idx, 10), idx: domUtils.getElementIndex(toItem)})
        );
    }
    domUtils.addEventListener(document, "focusin blur", settings.containerSelector, function (e) {
        if (e.type === "focusin") {
            this.classList.add("focused");
        } else {
            this.classList.remove("focused");
        }
    });
    return {
        reset: function () {
            document.querySelectorAll(settings.containerSelector).forEach(function (el) {
                el.classList.remove("focused");
                listboxes.reset(el);
            });
            if (virtualMode) {
                virtualMode.reset();
            }
        },
        destroy: function () {}
    };
}
