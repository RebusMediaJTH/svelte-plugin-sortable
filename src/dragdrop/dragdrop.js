/*jshint esversion: 6 */

import * as domUtils from "../util/domUtils.js";
import * as utils from "../util/utils.js";

let active = {
    element: undefined,
    positionType: undefined, // 'relative' | 'absolute'
    options: undefined,
    args: undefined,
    containment: undefined,
    originalStyles: [],
    initialPosition: {},
    firstMove: true,
    moved: false
};

const scroller = (function () {
    const scrollableElements = {};
    var scroll = function (c, axis) {
        const scrollSuffix = axis === "x" ? "Left" : "Top",
            offsetProp = axis === "x" ? "left" : "top",
            draglet = active.element,
            container = c.element,
            scrollAmount = container["scroll" + scrollSuffix],
            dragletOffset = domUtils.getOffset(draglet)[offsetProp],
            dragletPos = dragletOffset - domUtils.getOffset(container)[offsetProp] - c.border - (c.topLevel ? scrollAmount : 0);
        let dragletOverflow = 0;
        if (dragletPos < 0) {
            dragletOverflow = dragletPos;
        } else {
            dragletOverflow = Math.max(
                0,
                dragletPos +
                    domUtils.getOuterSize(draglet, axis === "x" ? "width" : "height") -
                    container["client" + (axis === "x" ? "Width" : "Height")]
            );
        }
        if (dragletOverflow !== 0) {
            let scrollChange = dragletOverflow < 0 ? -active.options.scrollSpeed : active.options.scrollSpeed;
            container["scroll" + scrollSuffix] = scrollAmount + scrollChange;
            // If the draglet is static, relative or absolutely positioned relative to the container, it will have moved with the scroll by: new offset - dragletOffset.
            // Correct for this along with the how far over the scroll container bounds the draglet was moved: dragletOverflow
            const dragletShift = dragletOffset - domUtils.getOffset(draglet)[offsetProp] - dragletOverflow;
            active.containment.contain({manual: true, top: axis === "y" ? dragletShift : 0, left: axis === "x" ? dragletShift : 0});
        }
    };
    return {
        init: function () {
            const pf = parseFloat;
            scrollableElements.x = [];
            scrollableElements.y = [];
            if (active.options.scroll) {
                ["x", "y"].forEach(axis => {
                    if (active.options.scroll[axis]) {
                        domUtils.getScrollableParents(active.element, axis).forEach(sp => {
                            if (sp.contains(active.containment.element)) {
                                let css = getComputedStyle(sp);
                                scrollableElements[axis].push({
                                    element: sp,
                                    topLevel: sp.nodeName.toLowerCase() === "html",
                                    border: pf(css["border" + (axis === "x" ? "Left" : "Top") + "Width"])
                                });
                            }
                        });
                    }
                });
            }
        },
        scroll: function () {
            if (active.options.scroll) {
                ["x", "y"].forEach(axis => {
                    for (let i = scrollableElements[axis].length - 1; i >= 0; i--) {
                        scroll(scrollableElements[axis][i], axis);
                    }
                });
            }
        }
    };
})();

const isOverAxis = function (x, reference, size) {
    return x >= reference && x < reference + size;
};

const intersect = function (bounds, dropZone, tolerance, pointer) {
    const x1 = bounds.left,
        y1 = bounds.top,
        x2 = x1 + bounds.width,
        y2 = y1 + bounds.height,
        l = dropZone.left,
        t = dropZone.top,
        r = l + dropZone.width,
        b = t + dropZone.height;
    let res;
    switch (tolerance) {
        case "fit":
            res = l <= x1 && x2 <= r && t <= y1 && y2 <= b;
            break;
        case "intersect":
            res =
                l < x1 + bounds.width / 2 && // Right Half
                x2 - bounds.width / 2 < r && // Left Half
                t < y1 + bounds.height / 2 && // Bottom Half
                y2 - bounds.height / 2 < b; // Top Half
            break;
        case "pointer":
            res = isOverAxis(pointer.y, t, dropZone.height) && isOverAxis(pointer.x, l, dropZone.width);
            break;
        case "touch":
            res =
                ((y1 >= t && y1 <= b) || // Top edge touching
                    (y2 >= t && y2 <= b) || // Bottom edge touching
                    (y1 < t && y2 > b)) && // Surrounded vertically
                ((x1 >= l && x1 <= r) || // Left edge touching
                    (x2 >= l && x2 <= r) || // Right edge touching
                    (x1 < l && x2 > r)); // Surrounded horizontally
            break;
        default:
            return false;
    }
    return res;
};

const getDropZone = function (dropzones, draglet, tolerance, pointer) {
    const bounds = Object.assign(domUtils.getOffset(draglet), domUtils.getContentSize(draglet));
    for (let i = 0; i < dropzones.length; i++) {
        const dropzone = dropzones[i],
            dropZoneBounds = Object.assign(domUtils.getOffset(dropzone), domUtils.getContentSize(dropzone));
        if (intersect(bounds, dropZoneBounds, tolerance, pointer)) {
            return dropzone;
        }
    }
};

const Containment = function (e, options) {
    const pf = parseFloat,
        container = domUtils.$(options.containment)[0],
        pointer = utils.getCoords(e),
        pos = active.positionType === "relative" ? domUtils.getRelativePosition(active.element) : domUtils.getPosition(active.element),
        css = getComputedStyle(container),
        css2 = getComputedStyle(active.element),
        scrollable = /(scroll|auto)/.test(css.overflow),
        // The width & height need to be reduced by the draglet margin right/bottom; otherwise if the margin is larger than the container padding, moving the draglet
        // to the far right/bottom forces the container size to be increased. Any container padding swallows up the margin but if the margin is greater, the
        // container increases in size by: draglet margin - container padding. All that's needed is to keep the container bounds top & right the same and reduce the
        // width & height by Math.max(0, draglet margin - container padding) but lets keep it simple and just use all draglet margins.
        margin = {top: pf(css2.marginTop), right: pf(css2.marginRight), bottom: pf(css2.marginBottom), left: pf(css2.marginLeft)},
        containerBounds = {
            adjustTop: pf(css.borderTopWidth) + pf(css.paddingTop) + margin.top,
            adjustLeft: pf(css.borderLeftWidth) + pf(css.paddingLeft) + margin.left
        };
    const setContainerSize = function () {
        const containerSize = domUtils.getContentSize(container),
            scrollWidth = scrollable ? container.scrollWidth - pf(css.paddingLeft) - pf(css.paddingRight) : 0,
            scrollHeight = scrollable ? container.scrollHeight - pf(css.paddingTop) - pf(css.paddingBottom) : 0;
        containerBounds.width = Math.max(scrollWidth, containerSize.width) - (margin.left + margin.right);
        containerBounds.height = Math.max(scrollHeight, containerSize.height) - (margin.top + margin.bottom);
    };
    setContainerSize();
    return {
        element: container,
        position: pos,
        refreshSize: setContainerSize,
        contain: function (e) {
            const draglet = active.element,
                savedOffset = domUtils.getOffset(draglet),
                offset = {top: savedOffset.top, left: savedOffset.left},
                containerOffset = domUtils.getOffset(container),
                diff = {};
            containerOffset.top += containerBounds.adjustTop;
            containerOffset.left += containerBounds.adjustLeft;
            if (e.manual) {
                diff.top = e.top || 0;
                diff.left = e.left || 0;
            } else {
                let c = utils.getCoords(e);
                diff.top = options.axis.y ? c.y - pointer.y : 0;
                diff.left = options.axis.x ? c.x - pointer.x : 0;
                pointer.x = c.x;
                pointer.y = c.y;
            }
            offset.top += diff.top;
            offset.left += diff.left;
            if (options.axis.y) {
                offset.top = Math.min(containerBounds.height + containerOffset.top - draglet.offsetHeight, Math.max(containerOffset.top, offset.top));
            }
            if (options.axis.x) {
                offset.left = Math.min(
                    containerBounds.width + containerOffset.left - draglet.offsetWidth,
                    Math.max(containerOffset.left, offset.left)
                );
            }
            if (offset.top !== savedOffset.top || offset.left !== savedOffset.left) {
                pos.top += offset.top - savedOffset.top;
                pos.left += offset.left - savedOffset.left;
                draglet.style.top = pos.top + "px";
                draglet.style.left = pos.left + "px";
                return true;
            }
        }
    };
};

const onTouchEnd = function (e) {
    const draglet = active.element;
    if (e.type === "touchend" || e.type === "touchcancel") {
        e.preventDefault();
        this.removeEventListener("touchmove", onTouchMove);
        this.removeEventListener("touchend", onTouchEnd);
        this.removeEventListener("touchcancel", onTouchEnd);
    } else {
        window.removeEventListener("mouseup", onTouchEnd);
        window.removeEventListener("mousemove", onTouchMove);
    }
    if (active.moved) {
        const options = active.options,
            args = Object.assign({}, active.args, {originalEvent: e});
        let revert = options.revert;
        draglet.classList.remove("dragging");
        if (options.stop) {
            options.stop.call(active.element, args);
            if (options.clone && args.removeClone) {
                draglet.parentNode.removeChild(draglet);
                args.removeClone = false;
            }
        }
        if (options.dropzones) {
            const dropzone = getDropZone(options.dropzones, draglet, options.tolerance, utils.getCoords(e));
            if (dropzone) {
                if (options.drop) {
                    args.dropzone = dropzone;
                    options.drop.call(active.element, args);
                }
            }
            if (revert === "invalid") {
                revert = !dropzone;
            }
        }
        if (revert !== "invalid" && revert !== true && revert !== false) {
            revert = true === revert.call(active.element, args);
        }
        if (revert) {
            const originalStyles = Object.assign({}, active.originalStyles),
                revertTo = options.clone ? domUtils.getPosition(active.args.originalElement) : active.initialPosition;
            if (active.options.revertDuration) {
                draglet.style.transition = `top ${active.options.revertDuration}s, left ${active.options.revertDuration}s`;
            }
            draglet.style.top = revertTo.top + "px";
            draglet.style.left = revertTo.left + "px";
            domUtils.onTransitionEnd(draglet, function () {
                if (options.clone) {
                    draglet.parentNode.removeChild(draglet);
                } else {
                    Object.keys(originalStyles).forEach(prop => (draglet.style[prop] = originalStyles[prop]));
                }
            });
        } else if (options.clone && args.removeClone) {
            draglet.parentNode.removeChild(draglet);
        }
    } else {
        draglet.style.position = active.originalStyles.position;
    }
    active = null;
};

const onTouchMove = function (e) {
    const options = active.options,
        args = Object.assign(active.args, {originalEvent: e});
    if (active.firstMove) {
        let draglet = active.element;
        if (options.start) {
            options.start.call(draglet, args);
        }
        const size = domUtils.getContentSize(draglet),
            inlineSize = {};
        active.firstMove = false;
        active.moved = true;
        if (options.clone) {
            args.originalElement = active.element;
            draglet = active.element.cloneNode(true);
            draglet.removeAttribute("id");
            active.element = draglet;
            draglet.style.position = "absolute";
            draglet.style.visibility = "hidden";
            draglet.style.top = active.containment.position.top + "px";
            draglet.style.left = active.containment.position.left + "px";
            args.originalElement.parentNode.appendChild(draglet);
        }
        ["top", "left", "width", "height", "transition"].forEach(prop => {
            const value = draglet.style[prop];
            active.originalStyles[prop] = value;
            if (!value && (prop === "width" || prop === "height")) {
                inlineSize[prop] = size[prop];
            }
        });
        domUtils.setContentSize(draglet, inlineSize);
        draglet.classList.add("dragging");
        if (options.clone) {
            if (options.cloned) {
                options.cloned.call(active.element, args);
            }
            draglet.style.visibility = "";
        }
        scroller.init();
    }
    const changed = active.containment.contain(e);
    if (changed && options.drag) {
        options.drag.call(active.element, args);
    }
    scroller.scroll();
};

const onTouchStart = function (options, e) {
    const element = this.closest(`.${options.draglets.itemClass}`),
        positionType = options.clone || getComputedStyle(element).position === "absolute" ? "absolute" : "relative",
        args = {originalEvent: e},
        originalStyles = {position: element.style.position};
    if (e.type === "mousedown" && e.which !== 1) {
        return;
    }
    if (options.prestart && false === options.prestart.call(element, args)) {
        return;
    }
    if (positionType === "relative") {
        element.style.position = "relative";
    }
    active = {
        element: element,
        positionType: positionType,
        options: options,
        args: args,
        originalStyles: originalStyles,
        initialPosition: positionType === "relative" ? domUtils.getRelativePosition(element) : domUtils.getPosition(element),
        firstMove: true,
        moved: false
    };
    active.containment = Containment(e, options);
    if (e.type === "touchstart") {
        if (utils.environment.os.name === "ios") {
            e.preventDefault();
        }
        this.addEventListener("touchend", onTouchEnd);
        this.addEventListener("touchcancel", onTouchEnd);
        this.addEventListener("touchmove", onTouchMove);
    } else {
        window.addEventListener("mouseup", onTouchEnd);
        window.addEventListener("mousemove", onTouchMove);
    }
};

export default function (options) {
    options = Object.assign(
        {
            tolerance: "intersect",
            revert: false,
            revertDuration: 0.3,
            position: "absolute",
            axis: false,
            scroll: false,
            scrollSpeed: 5
        },
        options
    );
    options.containment = options.containment || "body";
    const axis = options.axis;
    options.axis = {
        x: !axis || axis === "x",
        y: !axis || axis === "y"
    };
    if (options.scroll) {
        const scroll = options.scroll;
        options.scroll = {
            x: options.axis.x && (true === scroll || scroll.x),
            y: options.axis.y && (true === scroll || scroll.y)
        };
    }
    options.dropzones = options.dropzones ? domUtils.$(options.dropzones) : null;

    const container = domUtils.$(options.draglets.container || options.containment)[0],
        initialState = [],
        startHandler = {
            instance: undefined,
            add: function () {
                this.instance = domUtils.addEventListener(
                    container,
                    "touchstart mousedown",
                    `.${options.draglets.itemClass}` + (options.handleClass ? `.${options.handleClass}` : ""),
                    function (e) {
                        onTouchStart.call(this, options, e);
                    }
                );
            },
            remove: function () {
                if (this.instance) {
                    this.instance.remove();
                    this.instance = null;
                }
            }
        };

    container.querySelectorAll(`.${options.draglets.itemClass}`).forEach(item => {
        initialState.push({draglet: item, parent: item.parentNode, disabled: item.getAttribute("aria-disabled") || "false"});
    });

    startHandler.add();

    return {
        reset: function (callback) {
            initialState.forEach(state => {
                const draglet = state.draglet;
                if (draglet.parentNode) {
                    draglet.parentNode.removeChild(draglet);
                }
                state.parent.appendChild(draglet);
                draglet.setAttribute("aria-disabled", state.disabled || "");
                if (callback) {
                    callback.call(draglet);
                }
            });
            return this;
        },
        refreshContainmentSize: function () {
            if (active && active.containment) {
                active.containment.refreshSize();
            }
        },
        disable: function () {
            startHandler.remove();
            container.querySelectorAll(`.${options.draglets.itemClass}`).forEach(element => element.setAttribute("aria-disabled", "true"));
            return this;
        },
        enable: function () {
            startHandler.add();
            container.querySelectorAll(`.${options.draglets.itemClass}`).forEach(element => element.setAttribute("aria-disabled", "false"));
            return this;
        },
        destroy: function () {
            startHandler.remove();
            initialState.length = 0;
            return this;
        }
    };
}
