/*jshint esversion: 6 */

var pf = window.parseFloat;

function isWindow(obj) {
    return obj != null && obj === obj.window;
}

function getWindow(elem) {
    return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
}

function getOffsetParent(elem) {
    let offsetParent = elem.offsetParent;
    while (offsetParent && getComputedStyle(offsetParent).position === "static") {
        offsetParent = offsetParent.offsetParent;
    }
    return offsetParent || document.documentElement;
}

export const isDOM = elem => {
    elem = elem && elem.length ? elem[0] : elem;
    return elem instanceof Element;
};

export const $ = elem =>
    Array.isArray(elem) ? elem : isDOM(elem) ? (elem.length ? (elem.forEach ? elem : Array.from(elem)) : [elem]) : document.querySelectorAll(elem);

// control, eventTypes, [delegate], handler
export const addEventListener = function () {
    const control = arguments[0],
        eventTypes = arguments[1].split(" "),
        delegate = arguments.length === 3 ? null : arguments[2],
        handler = arguments.length === 3 ? arguments[2] : arguments[3];
    const delegateHandler = e => {
        const el = e.target.closest(delegate);
        if (el) {
            handler.call(el, e);
        }
    };
    eventTypes.forEach(et => {
        if (delegate) {
            control.addEventListener(et, delegateHandler);
        } else {
            control.addEventListener(et, handler);
        }
    });
    return {
        remove: function () {
            eventTypes.forEach(et => {
                if (delegate) {
                    control.removeEventListener(et, delegateHandler);
                } else {
                    control.removeEventListener(et, handler);
                }
            });
        }
    };
};

/* eslint-disable */
export const getElementIndex = elem => {
    let index = 0;
    while ((elem = elem.previousElementSibling)) {
        index++;
    }
    return index;
};
/* eslint-enable */

export const getOffset = elem => {
    const doc = elem && elem.ownerDocument;
    if (doc) {
        const docElem = doc.documentElement,
            box = elem.getBoundingClientRect(),
            win = getWindow(doc);
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }
};

export const getPosition = elem => {
    let offset,
        parentOffset = {top: 0, left: 0};
    const css1 = getComputedStyle(elem);
    if (css1.position === "fixed") {
        offset = elem.getBoundingClientRect();
    } else {
        const offsetParent = getOffsetParent(elem);
        offset = getOffset(elem);
        if (offsetParent.nodeName.toLowerCase() !== "html") {
            parentOffset = getOffset(offsetParent);
        }
        const css2 = getComputedStyle(offsetParent);
        parentOffset.top += pf(css2.borderTopWidth);
        parentOffset.left += pf(css2.borderLeftWidth);
    }
    return {
        top: offset.top - parentOffset.top - pf(css1.marginTop),
        left: offset.left - parentOffset.left - pf(css1.marginLeft)
    };
};

export const getRelativePosition = elem => {
    const css = getComputedStyle(elem);
    return {
        top: pf(css.top),
        left: pf(css.left)
    };
};

const getBorderAndPadding = (css, dimension) => {
    const prop1 = dimension === "width" ? "Left" : "Top",
        prop2 = dimension === "width" ? "Right" : "Bottom";
    return pf(css[`border${prop1}Width`]) + pf(css[`border${prop2}Width`]) + pf(css[`padding${prop1}`]) + pf(css[`padding${prop2}`]);
};

// Doesn't support IE or FF <= 54 (to support, see jQuery getWidthOrHeight)
const getContentSizeForDimension = (elem, css, dimension) => {
    const val = css[dimension];
    // Only access offset[Width|Height], which causes a reflow, if we have to
    if ((val === "auto" || (!parseFloat(val) && css.display === "inline")) && elem.getClientRects().length) {
        return elem["offset" + (dimension === "width" ? "Width" : "Height")] - getBorderAndPadding(css, dimension);
    }
    return (pf(val) || 0) - (css.boxSizing === "border-box" ? getBorderAndPadding(css, dimension) : 0);
};

export const getContentSize = (elem, dimension) => {
    const css = getComputedStyle(elem),
        res = {};
    ["width", "height"].forEach(d => (res[d] = !dimension || dimension === d ? getContentSizeForDimension(elem, css, d) : null));
    return !dimension ? res : res[dimension];
};

export const setContentSize = (elem, size) => {
    if (size && (undefined !== size.width || undefined !== size.height)) {
        const css = getComputedStyle(elem),
            borderBox = css.boxSizing === "border-box";
        if (undefined !== size.width) {
            elem.style.width = size.width + (borderBox ? getBorderAndPadding(css, "width") : 0) + "px";
        }
        if (undefined !== size.height) {
            elem.style.height = size.height + (borderBox ? getBorderAndPadding(css, "height") : 0) + "px";
        }
    }
};

export const getOuterSize = (elem, dimension) => {
    const css = getComputedStyle(elem),
        res = {};
    ["width", "height"].forEach(d => {
        res[d] = !dimension || dimension === d ? getContentSizeForDimension(elem, css, d) : null;
        if (res[d] !== null) {
            res[d] += getBorderAndPadding(css, d);
        }
    });
    return !dimension ? res : res[dimension];
};

// axis = 'x' | 'y'
export const getScrollableParents = (elem, axis) => {
    const res = [],
        dimension = axis === "x" ? "Width" : "Height",
        overflow = "overflow-" + axis,
        forever = true;
    let container = elem.parentNode;
    do {
        let nodeName = container.nodeName.toLowerCase(),
            overflowVal = getComputedStyle(container)[overflow];
        if (nodeName === "body" && overflowVal === "hidden" && ["auto", "scroll"].getComputedStyle(container.parentNode)[overflow] < 0) {
            // If the body overflow is hidden and the html isn't set to 'auto' or 'scroll' (even if 'visible'), the document can't be scrolled
            break;
        }
        if (nodeName === "html") {
            if (overflowVal !== "hidden") {
                res.push(container);
            }
            break;
        }
        // scroll[Width|Height] includes padding, so compare to client[Width|Height]
        if (container["scroll" + dimension] !== container["client" + dimension] && ["auto", "scroll"].indexOf(overflowVal) > -1) {
            res.push(container);
        }
        container = container.parentNode;
    } while (forever);
    return res;
};

export const getScrollableParentsBothAxis = elem => {
    const res = [];
    let complete = false,
        container = elem.parentNode;
    do {
        let scrollable = {x: false, y: false};
        ["x", "y"].forEach(axis => {
            let dimension = axis === "x" ? "Width" : "Height",
                overflow = "overflow-" + axis,
                nodeName = container.nodeName.toLowerCase(),
                overflowVal = getComputedStyle(container)[overflow];
            if (nodeName === "body" && overflowVal === "hidden" && ["auto", "scroll"].getComputedStyle(container.parentNode)[overflow] < 0) {
                // If the body overflow is hidden and the html isn't set to 'auto' or 'scroll' (even if 'visible'), the document can't be scrolled
                complete = true;
            } else if (nodeName === "html") {
                if (overflowVal !== "hidden") {
                    scrollable[axis] = true;
                }
                complete = true;
            }
            // scroll[Width|Height] includes padding, so compare to client[Width|Height]
            else if (container["scroll" + dimension] !== container["client" + dimension] && ["auto", "scroll"].indexOf(overflowVal) > -1) {
                scrollable[axis] = true;
            }
        });
        if (scrollable.x || scrollable.y) {
            res.push({element: container, x: scrollable.x, y: scrollable.y});
        }
        if (!complete) {
            container = container.parentNode;
        }
    } while (!complete);
    return res;
};

const getTransitionOrAnimationDuration = (type, elem) => {
    if (!elem) {
        return 0;
    }
    const css = getComputedStyle(elem);
    let duration = css[type + "-duration"],
        delay = css[type + "-delay"];
    const floatDuration = pf(duration),
        floatDelay = pf(delay);
    if (!floatDuration && !floatDelay) {
        return 0; // Return 0 if element or transition duration is not found
    }
    // If multiple durations are defined, take the first
    duration = duration.split(",")[0];
    delay = delay.split(",")[0];
    return (pf(duration) + pf(delay)) * 1000;
};

export const getTransitionDuration = elem => getTransitionOrAnimationDuration("transition", elem);
export const getAnimationDuration = elem => getTransitionOrAnimationDuration("animation", elem);

const onTransitionOrAnimationEnd = (type, elem, callback) => {
    const expectedDuration = getTransitionOrAnimationDuration(type, elem),
        eventType = type + "end";
    let complete, timeoutId;
    const endHandler = function (e) {
        if (e.target === elem) {
            elem.removeEventListener(eventType, endHandler);
            if (!complete) {
                complete = true;
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }
                callback();
            }
        }
    };
    if (expectedDuration === 0) {
        window.setTimeout(callback, 0);
    } else {
        elem.addEventListener(eventType, endHandler);
        timeoutId = window.setTimeout(function () {
            if (!complete) {
                complete = true;
                timeoutId = null;
                elem.removeEventListener(eventType, endHandler);
                callback();
            }
        }, expectedDuration + 100);
    }
    return {
        cancel: function () {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
                timeoutId = null;
            }
            elem.removeEventListener(eventType, endHandler);
            complete = true;
        }
    };
};

export const onTransitionEnd = (elem, callback) => onTransitionOrAnimationEnd("transition", elem, callback);
export const onAnimationEnd = (elem, callback) => onTransitionOrAnimationEnd("animation", elem, callback);
