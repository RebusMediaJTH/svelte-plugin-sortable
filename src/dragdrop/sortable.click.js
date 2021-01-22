/*jshint esversion: 6 */

/*
    Click/Tap implementation of sortable
    For mobile AT users

    > All items start with [aria-selected="false"].
    > When an item is selected:
      > [aria-selected] is set
      > for all other items, in the same container & before the selected item, the following screenreader text is revealed: "Activate to place the selected item before this."
      > for all other items, in the same container & after the selected item, the following screenreader text is revealed: "Activate to place the selected item after this."
      > a placeholder is added to all other containers with the following screenreader text: "End of the list. Activate to place the selected item here."
    > If the selected item is tapped again, all of the above changes are reset.
    > If another item is tapped:
      > The item is moved before or after it and all of the above changes are reset.
*/

import * as domUtils from "../util/domUtils.js";

const createVirtualMode = function (virtualModeSuper, settings) {
    const vm = Object.create(virtualModeSuper),
        itemsByContainer = vm.itemsByContainer;
    const setSelectedAs = e => {
        itemsByContainer[e.item.containerIdx][e.item.idx].selected = e.selected;
        itemsByContainer[e.item.containerIdx][e.item.idx].focused = e.selected;
        itemsByContainer.forEach((items, ci) => {
            let newItems = [];
            items.forEach((item, i) => {
                item.mobileAssistiveText = "";
                if (e.selected) {
                    if (ci !== e.item.containerIdx || i < e.item.idx) {
                        item.mobileAssistiveText = settings.assistiveText.beforeItem;
                    } else if (i > e.item.idx) {
                        item.mobileAssistiveText = settings.assistiveText.afterItem;
                    }
                    newItems.push(item);
                } else if (!item.clickMethodPlaceholder) {
                    newItems.push(item);
                }
            });
            if (e.selected && ci !== e.item.containerIdx) {
                newItems.push({
                    id: `sortable-click-method-placeholder-${ci}`,
                    size: e.size,
                    clickMethodPlaceholder: true,
                    mobileAssistiveText: settings.assistiveText.placeholder
                });
            }
            itemsByContainer[ci].length = 0;
            itemsByContainer[ci].push(...newItems);
        });
        vm.updateDOM({source: "click"});
    };
    const removePlaceholder = function () {
        itemsByContainer.forEach((items, ci) => {
            let newItems = [];
            items.forEach(item => {
                if (!item.clickMethodPlaceholder) {
                    item.mobileAssistiveText = "";
                    newItems.push(item);
                }
            });
            itemsByContainer[ci].length = 0;
            itemsByContainer[ci].push(...newItems);
        });
    };
    vm.setSelectedAs = setSelectedAs;
    vm.removePlaceholder = () => {
        removePlaceholder();
        // No need to update, it will be updated will the first keyboard action
        //vm.updateDOM({ source: 'click' });
    };
    vm.moveItem = e => {
        vm.moveItemSuper(
            Object.assign(
                {
                    source: "click",
                    animationComplete: () => setSelectedAs({selected: false, item: e.to})
                },
                e
            )
        );
        // We can't wait until the animation is complete before removing the placeholders because they will animate and then disappear - looking shitty.
        // Another way to do it would be to immediately call 'setSelectedAs' instead of at the end of the animation. The problem with this is that the
        // item immediately loses its selected highlight so it's not easily apparent where it ends up.
        // Since this is for mobile AT it's not a problem, but some mouse or touch users may prefer this method over drag/drop.
        removePlaceholder();
        vm.updateDOM({source: "click"});
    };
    vm.reset = () => {
        removePlaceholder();
        itemsByContainer.forEach(items => items.forEach(i => (i.selected = false)));
        // No need to update, it will be updated will the first dragdrop or keyboard action
        //vm.updateDOM({ source: 'click' });
    };
    return vm;
};

const appendAssistiveTextElement = function (item) {
    if (!item.querySelector(".mobile-assistive-text")) {
        const el = document.createElement("span");
        el.classList.add("sr-only", "mobile-assistive-text");
        item.appendChild(el);
    }
};

const createPlaceholder = function (settings, basedOn) {
    const placeholder = document.createElement("div"),
        size = domUtils.getOuterSize(basedOn);
    placeholder.innerHTML = `<span class="sr-only mobile-assistive-text">${settings.assistiveText.placeholder}</span>`;
    placeholder.classList.add(settings.itemClass, "sortable-placeholder", "click-method");
    placeholder.setAttribute("role", "option");
    placeholder.setAttribute("aria-selected", "false");
    placeholder.setAttribute("aria-disabled", "false");
    placeholder.style.width = size.width + "px";
    placeholder.style.height = size.height + "px";
    return placeholder;
};

const addAndRemovePlaceholder = function (settings, selectedOption) {
    const containers = settings.getContainers();
    if (settings.hasPlaceholders) {
        settings.commonParent.querySelectorAll(".sortable-placeholder.click-method").forEach(item => item.parentNode.removeChild(item));
        settings.hasPlaceholders = false;
    }
    if (selectedOption) {
        const containerIdx = parseInt(selectedOption.parentNode.dataset.idx, 10),
            idx = domUtils.getElementIndex(selectedOption);
        containers.forEach((box, ci) => {
            const children = box.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                let assistiveText = "";
                if (ci !== containerIdx || i < idx) {
                    assistiveText = settings.assistiveText.beforeItem;
                } else if (i > idx) {
                    assistiveText = settings.assistiveText.afterItem;
                }
                child.querySelector(".mobile-assistive-text").innerHTML = assistiveText;
            }
            if (containerIdx !== ci) {
                if (!children.length || children[children.length - 1] !== selectedOption) {
                    box.append(createPlaceholder(settings, selectedOption));
                    settings.hasPlaceholders = true;
                }
            }
        });
    } else {
        containers.forEach(c => c.querySelectorAll(".mobile-assistive-text").forEach(el => (el.innerHTML = "")));
    }
};

const handleClick = function (settings, listboxes, virtualMode) {
    settings.setInteractionMethod("click");
    if (this.getAttribute("aria-disabled") !== "true") {
        const box = this.parentNode;
        let selectedOption = settings.commonParent.querySelector('[aria-selected="true"]');
        if (selectedOption) {
            if (this === selectedOption) {
                // A selected option has been clicked again: unselect it
                listboxes.reset();
                if (virtualMode) {
                    virtualMode.setSelectedAs({
                        selected: false,
                        item: {containerIdx: parseInt(this.parentNode.dataset.idx, 10), idx: domUtils.getElementIndex(this)}
                    });
                }
            } else {
                const containerIdx = parseInt(box.dataset.idx, 10),
                    from =
                        box === selectedOption.parentNode
                            ? {containerIdx: containerIdx, idx: domUtils.getElementIndex(selectedOption)}
                            : {containerIdx: parseInt(selectedOption.parentNode.dataset.idx, 10), idx: domUtils.getElementIndex(selectedOption)},
                    to = {containerIdx: containerIdx, idx: domUtils.getElementIndex(this)};
                if (virtualMode) {
                    virtualMode.moveItem({from: from, to: to});
                } else {
                    if (box === selectedOption.parentNode) {
                        // Another option in the same box has been clicked: move the selected option before it, if it's before it; otherwise after
                        selectedOption.parentNode.removeChild(selectedOption);
                        this[to.idx < from.idx ? "before" : "after"](selectedOption);
                    } else {
                        // An option in another box has been clicked: move the selected option before it
                        listboxes.moveItem(selectedOption.parentNode, box, this);
                    }
                }
                // Unselect the item
                listboxes.reset();
                settings.change.call(selectedOption, {method: "click", from: from, to: to});
            }
            if (!virtualMode) {
                addAndRemovePlaceholder(settings);
            }
            settings.setSortingActiveAs(false);
        } else {
            // Select the clicked option
            listboxes.focusItem(box, this);
            if (virtualMode) {
                virtualMode.setSelectedAs({
                    selected: true,
                    size: domUtils.getOuterSize(this),
                    item: {containerIdx: parseInt(this.parentNode.dataset.idx, 10), idx: domUtils.getElementIndex(this)}
                });
            } else {
                addAndRemovePlaceholder(settings, this);
            }
            settings.setSortingActiveAs(true);
            settings.itemSelected.call(box, {item: this});
        }
    }
};

export default function (settings, listboxes, virtualModeSuper) {
    const virtualMode = virtualModeSuper ? createVirtualMode(virtualModeSuper, settings) : null;
    document.querySelectorAll(settings.containerSelector + ' [role="option"]').forEach(item => appendAssistiveTextElement(item));
    let clickHandler = domUtils.addEventListener(settings.commonParent, "click", '[role="option"]', function () {
        handleClick.call(this, settings, listboxes, virtualMode);
    });
    let preventFirstFocusInListboxHandler = domUtils.addEventListener(
        settings.commonParent,
        "mousedown touchstart pointerdown",
        '[role="listbox"]',
        function () {
            listboxes.preventFirstFocus();
        }
    );
    return {
        removePlaceholder: function () {
            if (virtualMode) {
                virtualMode.removePlaceholder();
            } else {
                addAndRemovePlaceholder(settings);
            }
            settings.setSortingActiveAs(false);
        },
        appendAssistiveTextElement: function (element) {
            appendAssistiveTextElement(element);
        },
        reset: function () {
            if (virtualMode) {
                virtualMode.reset();
            } else {
                const selectedOption = settings.commonParent.querySelector('[aria-selected="true"]');
                if (selectedOption) {
                    selectedOption.setAttribute("aria-selected", "false");
                }
                addAndRemovePlaceholder(settings);
            }
        },
        destroy: function () {
            clickHandler.remove();
            preventFirstFocusInListboxHandler.remove();
        }
    };
}
