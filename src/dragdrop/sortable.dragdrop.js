/*jshint esversion: 6 */

/*
    Drag drop implementation of sortable

    To do
    -----

    > Sort out why there's flickering if click bottom item and then start slowing dragging it.
      I can't reproduce this - it may have only occurred when the items were laid out horizontally?
      Anyway, it's probably because the initial position is calculated in 'prestart' in dragdrop.js; we need to do it later at 'start'.   
*/

import dragdrop from "./dragdrop.js";
import * as domUtils from "../util/domUtils.js";
import * as utils from "../util/utils.js";

// These can be global because they're assigned at the start of each drag/drop and only one drag/drop can be active at any time
let slots, activeSlot, slotsByContainer, itemClass, saveCoords;

const createVirtualMode = function (virtualModeSuper) {
    const vm = Object.create(virtualModeSuper);
    vm.moveItem = e => vm.moveItemSuper(Object.assign({source: "dragdrop"}, e));
    vm.setShowDragletAsPlaceholder = e => {
        vm.itemsByContainer[e.containerIdx][e.idx].showAsPlaceholder = e.show;
        vm.updateDOM({source: "dragdrop"});
    };
    return vm;
};

const createSlots = function (containers, newActiveSlot) {
    slots = [];
    slotsByContainer = [];
    containers.forEach((container, ci) => {
        const containerSlots = [];
        slotsByContainer.push(containerSlots);
        container.element.querySelectorAll(`.${itemClass}:not(.sortable-item-clone)`).forEach((item, i) => {
            const slot = {
                idx: i,
                container: container.element,
                containerIdx: ci,
                element: item,
                bounds: Object.assign(domUtils.getOffset(item), domUtils.getOuterSize(item)),
                isActiveSlot: ci === newActiveSlot.containerIdx && i === newActiveSlot.idx
            };
            if (slot.isActiveSlot) {
                activeSlot = slot;
            }
            slots.push(slot);
            containerSlots.push(slot);
        });
    });
};

const createPlaceholder = function () {
    const placeholder = document.createElement("div");
    placeholder.classList.add(itemClass, "sortable-placeholder");
    placeholder.style.width = activeSlot.bounds.width + "px";
    placeholder.style.height = activeSlot.bounds.height + "px";
    return placeholder;
};

const getItemCurrentContainer = function (containers, bounds) {
    let res;
    for (let c of containers) {
        if (
            bounds.left >= c.bounds.left &&
            bounds.top >= c.bounds.top &&
            bounds.left + bounds.width <= c.bounds.left + c.bounds.width &&
            bounds.top + bounds.height <= c.bounds.top + c.bounds.height
        ) {
            res = c.element;
            break;
        }
    }
    return res;
};

const boundsIntersect = function (type, bounds1, bounds2) {
    const x1 = bounds1.left,
        y1 = bounds1.top,
        x2 = x1 + bounds1.width,
        y2 = y1 + bounds1.height,
        l = bounds2.left,
        t = bounds2.top,
        r = l + bounds2.width,
        b = t + bounds2.height;
    if (type === "touch") {
        return (
            ((y1 >= t && y1 <= b) || (y2 >= t && y2 <= b) || (y1 < t && y2 > b)) &&
            ((x1 >= l && x1 <= r) || (x2 >= l && x2 <= r) || (x1 < l && x2 > r))
        );
    }
    if (type === "half") {
        return (
            l < x1 + bounds1.width / 2 && // Right Half
            x2 - bounds1.width / 2 < r && // Left Half
            t < y1 + bounds1.height / 2 && // Bottom Half
            y2 - bounds1.height / 2 < b
        ); // Top Half
    }
};

const setContainerBounds = function (containers) {
    containers.forEach(c => {
        c.bounds = Object.assign(domUtils.getOffset(c.element), domUtils.getOuterSize(c.element));
    });
};

const refreshContainerBounds = function (dd, containers) {
    setContainerBounds(containers);
    dd.refreshContainmentSize();
};

const waitForPendingDomUpdate = function (virtualMode, callback) {
    if (!virtualMode) {
        callback();
    } else {
        virtualMode.DOMUpdate.wait(callback);
    }
};

const dropAnimator = {
    isAnimating: false,
    animate: function (duration, draglet, toElement, callback) {
        if (!duration) {
            callback();
        } else {
            this.isAnimating = true;
            draglet.style.transition = `top ${duration}ms, left ${duration}ms`;
            const revertTo = domUtils.getPosition(toElement);
            draglet.style.top = revertTo.top + "px";
            draglet.style.left = revertTo.left + "px";
            domUtils.onTransitionEnd(draglet, () => {
                this.isAnimating = false;
                callback();
            });
        }
    }
};

export default function (settings, virtualModeSuper) {
    const virtualMode = virtualModeSuper ? createVirtualMode(virtualModeSuper) : null;
    let containers, placeholder, originalSlot, originalContainerCounts, potentialSlot, dropSlot;
    let dd = dragdrop({
        keyboard: false,
        click: false,
        liveFeedback: false,
        draglets: {container: settings.commonParent, itemClass: settings.itemClass + ":not(.sortable-placeholder)"},
        containment: settings.commonParent,
        clone: true,
        handleClass: settings.handleClass,
        prestart: function (e) {
            if (dropAnimator.isAnimating) {
                return false;
            }
            containers = [];
            settings.getContainers().forEach(item => containers.push({element: item}));
            itemClass = settings.itemClass;
            createSlots(containers, {containerIdx: parseInt(this.parentNode.dataset.idx, 10), idx: domUtils.getElementIndex(this)});
            originalSlot = {
                container: activeSlot.container,
                containerIdx: activeSlot.containerIdx,
                idx: activeSlot.idx,
                size: {width: activeSlot.bounds.width, height: activeSlot.bounds.height}
            };
            originalContainerCounts = [];
            slotsByContainer.forEach(c => originalContainerCounts.push(c.length));
            if (settings.prestart) {
                return settings.prestart.call(this, {originalEvent: e.originalEvent});
            }
        },
        start: function (e) {
            saveCoords = utils.getCoords(e.originalEvent);
            settings.setInteractionMethod("dragdrop");
            settings.setSortingActiveAs(true);
            if (settings.start) {
                settings.start.call(this, e);
            }
        },
        cloned: function (e) {
            setContainerBounds(containers);
            this.classList.add("sortable-item-clone");
            // If we start dragging a click method selected item, it will have had [aria-selected="true"] when cloned.
            // Actually, it shouldn't matter - only show the border for keyboard and click methods
            //this.setAttribute('aria-selected', false);
            if (virtualMode) {
                virtualMode.setShowDragletAsPlaceholder({
                    show: true,
                    containerIdx: activeSlot.containerIdx,
                    idx: activeSlot.idx
                });
            } else {
                if (settings.highlightPlaceholder) {
                    placeholder = createPlaceholder();
                    e.originalElement.after(placeholder);
                    e.originalElement.parentNode.removeChild(e.originalElement);
                } else {
                    e.originalElement.style.visibility = "hidden";
                }
            }
            if (settings.cloned) {
                settings.cloned.call(this, e);
            }
        },
        drag: function (e) {
            const coords = utils.getCoords(e.originalEvent);
            if (coords.y == saveCoords.y) {
                return;
            }
            if (virtualMode && virtualMode.DOMUpdate.pending) {
                return;
            }
            const bounds = Object.assign(domUtils.getOffset(this), originalSlot.size);
            let isTouchingSlot,
                //isAfterActiveSlot,
                placement;
            potentialSlot = null;
            for (let slot of slots) {
                // if (slot.isActiveSlot) {
                //     isAfterActiveSlot = true;
                // }
                if (boundsIntersect("half", slot.bounds, bounds)) {
                    isTouchingSlot = true;
                    if (!slot.isActiveSlot) {
                        // This check is required if call boundsIntersect('half', bounds, slot.bounds) instead of boundsIntersect('half', bounds, slot.bounds)
                        // I changed the order to enable big items to be placed anywhere
                        //const direction = coords.y > saveCoords.y ? 'down' : 'up';
                        // if (isAfterActiveSlot && direction === 'down' || !isAfterActiveSlot && direction === 'up') {
                        //     placement = slot.containerIdx !== activeSlot.containerIdx || activeSlot.idx > slot.idx ? 'before' : 'after';
                        //     potentialSlot = slot;
                        // }
                        placement = slot.containerIdx !== activeSlot.containerIdx || activeSlot.idx > slot.idx ? "before" : "after";
                        potentialSlot = slot;
                        break;
                    }
                } else if (!isTouchingSlot && boundsIntersect("touch", bounds, slot.bounds)) {
                    isTouchingSlot = true;
                }
            }
            saveCoords = coords;
            if (!isTouchingSlot) {
                // If no touching slot, place at the end of the container it's in (Note: this assumes it's not possible to fit an item between 2 adjacent items!)
                const c = getItemCurrentContainer(containers, bounds);
                if (c) {
                    // ... but only if the active slot is not already at the end of this container
                    const itemsCount = originalContainerCounts[parseInt(c.dataset.idx, 10)],
                        sameAsActiveContainer = activeSlot.container === c,
                        sameAsOriginalContainer = originalSlot.container === c,
                        lastSlotIdx = itemsCount - (sameAsOriginalContainer ? 1 : 0);
                    if (!(sameAsActiveContainer && activeSlot.idx === lastSlotIdx)) {
                        placement = "append";
                        potentialSlot = {container: c, containerIdx: parseInt(c.dataset.idx, 10), idx: lastSlotIdx};
                    }
                }
            }
            if (potentialSlot) {
                dropSlot = potentialSlot;
                if (virtualMode) {
                    virtualMode.DOMUpdate.pending = true;
                    virtualMode.moveItem({
                        from: {containerIdx: activeSlot.containerIdx, idx: activeSlot.idx},
                        to: {containerIdx: potentialSlot.containerIdx, idx: placement !== "append" ? potentialSlot.idx : null},
                        animationComplete: function () {
                            createSlots(containers, potentialSlot);
                            // The width or height of the container may have been increased...
                            if (settings.containerSizeCanChange) {
                                refreshContainerBounds(dd, containers);
                            }
                            virtualMode.DOMUpdate.pending = false;
                        }
                    });
                } else {
                    const element = placeholder || e.originalElement;
                    element.parentNode.removeChild(element);
                    if (placement === "append") {
                        potentialSlot.container.appendChild(element);
                    } else {
                        potentialSlot.element[placement](element);
                    }
                    createSlots(containers, potentialSlot);
                    // The width or height of the container may have been increased...
                    if (settings.containerSizeCanChange) {
                        refreshContainerBounds(dd, containers);
                    }
                }
            }
        },
        stop: function (e) {
            e.removeClone = false;
            const draglet = this;
            waitForPendingDomUpdate(virtualMode, () => {
                dropAnimator.animate(
                    settings.dropDuration,
                    draglet,
                    virtualMode ? activeSlot.element : placeholder ? placeholder : e.originalElement,
                    () => {
                        settings.setSortingActiveAs(false);
                        draglet.parentNode.removeChild(draglet);
                        if (virtualMode) {
                            virtualMode.setShowDragletAsPlaceholder({
                                show: false,
                                containerIdx: activeSlot.containerIdx,
                                idx: activeSlot.idx
                            });
                        } else {
                            if (placeholder) {
                                placeholder.after(e.originalElement);
                                placeholder.parentNode.removeChild(placeholder);
                                placeholder = null;
                            } else {
                                e.originalElement.style.visibility = "";
                            }
                        }
                        if (dropSlot && (dropSlot.containerIdx !== originalSlot.containerIdx || dropSlot.idx !== originalSlot.idx)) {
                            settings.change.call(e.originalElement, {
                                method: "dragdrop",
                                from: {containerIdx: originalSlot.containerIdx, idx: originalSlot.idx},
                                to: {containerIdx: dropSlot.containerIdx, idx: dropSlot.idx}
                            });
                        }
                        originalSlot = null;
                        potentialSlot = null;
                        dropSlot = null;
                        if (settings.stop) {
                            settings.stop.call(e.originalElement, {originalEvent: e.originalEvent});
                        }
                        slots = null;
                        activeSlot = null;
                    }
                );
            });
        }
    });
    return {
        reset: dd.reset,
        disable: dd.disable,
        enable: dd.enable,
        destroy: function () {
            if (dd) {
                dd.destroy();
                dd = null;
            }
        }
    };
}
