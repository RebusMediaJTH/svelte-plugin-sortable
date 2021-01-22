/*jshint esversion: 6 */

import * as domUtils from "../util/domUtils.js";

/*
 *   Based on code from: https://www.w3.org/TR/wai-aria-practices/#Listbox
 *
 *   > Implements keyboard arrow navigation for a list of items
 *   > Ensure all listboxes have [tabindex="0"] and an id
 *
 */

let options; // virtual, handleNavigation
let _preventFirstFocus = false;
const nullHandler = function () {};
let handleFocusChange = nullHandler,
    handleKeyPress = nullHandler,
    handleCtrlAndArrowKey = nullHandler,
    handleItemChange = nullHandler,
    handleItemSelected = nullHandler,
    handleNavigation = nullHandler;

export const KeyCode = {
    BACKSPACE: 8,
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46
};

export function Listboxes(_options) {
    options = _options;
    const focusHandler = domUtils.addEventListener(document, "focusin", options.selector, function () {
        if (getActiveDescendant(this)) {
            return;
        }
        if (!_preventFirstFocus) {
            focusFirstItem(this);
        } else {
            _preventFirstFocus = false;
        }
    });
    const keydownHandler = domUtils.addEventListener(document, "keydown", options.selector, function (e) {
        checkKeyPress(this, e);
    });
    return {
        handleFocusChange: handler => (handleFocusChange = handler),
        handleKeyPress: handler => (handleKeyPress = handler),
        handleCtrlAndArrowKey: handler => (handleCtrlAndArrowKey = handler),
        handleItemChange: handler => (handleItemChange = handler),
        handleItemSelected: handler => (handleItemSelected = handler),
        handleNavigation: handler => (handleNavigation = handler),
        preventFirstFocus: () => (_preventFirstFocus = true),
        moveItem: (listboxNodeFrom, listboxNodeTo, beforeItem, afterItem) => {
            const itemToMove = deleteItem(listboxNodeFrom);
            if (!itemToMove) {
                return;
            }
            // Note: only handles adding one item after
            if (beforeItem) {
                beforeItem.before(itemToMove);
            } else if (afterItem) {
                afterItem.after(itemToMove);
            } else {
                addItem(listboxNodeTo, itemToMove);
            }
            focusItem(listboxNodeTo, itemToMove);
            listboxNodeTo.focus();
        },
        focusItem: focusItem,
        clearActiveDescendant: clearActiveDescendant,
        clearAllActiveDescendants: function () {
            document.querySelectorAll(options.selector).forEach(listboxNode => this.clearActiveDescendant(listboxNode));
        },
        reset: function () {
            if (arguments.length) {
                reset(arguments[0]);
            } else {
                document.querySelectorAll(options.selector).forEach(listboxNode => reset(listboxNode));
            }
        },
        destroy: () => {
            focusHandler.remove();
            keydownHandler.remove();
        }
    };
}

const getActiveDescendant = listboxNode => {
    const ad = listboxNode.getAttribute("aria-activedescendant");
    return ad ? (ad === "null" ? null : ad) : ad;
};
const setActiveDescendant = (listboxNode, value) => listboxNode.setAttribute("aria-activedescendant", value);
const clearActiveDescendant = listboxNode => setActiveDescendant(listboxNode, null);

const defocusItem = function (element) {
    if (!element) {
        return;
    }
    if (!options.virtual) {
        element.setAttribute("aria-selected", "false");
        element.classList.remove("focused");
    }
};

const focusItem = function (listboxNode, element) {
    defocusItem(document.getElementById(getActiveDescendant(listboxNode)));
    if (!options.virtual) {
        element.setAttribute("aria-selected", "true");
    }
    handleItemSelected(listboxNode, element);
    if (!options.virtual) {
        element.classList.add("focused");
    }
    setActiveDescendant(listboxNode, element.id);

    if (listboxNode.scrollHeight > listboxNode.clientHeight) {
        const scrollBottom = listboxNode.clientHeight + listboxNode.scrollTop,
            elementBottom = element.offsetTop + element.offsetHeight;
        if (elementBottom > scrollBottom) {
            listboxNode.scrollTop = elementBottom - listboxNode.clientHeight;
        } else if (element.offsetTop < listboxNode.scrollTop) {
            listboxNode.scrollTop = element.offsetTop;
        }
    }

    handleFocusChange(listboxNode, element);
};

const focusFirstItem = function (listboxNode) {
    var firstItem = listboxNode.querySelector('[role="option"]');
    if (firstItem) {
        focusItem(listboxNode, firstItem);
        if (options.virtual) {
            handleNavigation(listboxNode, firstItem);
        }
    }
};

const focusLastItem = function (listboxNode) {
    var itemList = listboxNode.querySelectorAll('[role="option"]');
    if (itemList.length) {
        focusItem(listboxNode, itemList[itemList.length - 1]);
        if (options.virtual) {
            handleNavigation(listboxNode, itemList[itemList.length - 1]);
        }
    }
};

const reset = function (listboxNode) {
    _preventFirstFocus = false;
    const activeDescendant = getActiveDescendant(listboxNode);
    if (activeDescendant) {
        defocusItem(document.getElementById(activeDescendant));
        clearActiveDescendant(listboxNode);
    }
};
const checkKeyPress = function (listboxNode, evt) {
    var key = evt.which || evt.keyCode;
    var nextItem = document.getElementById(getActiveDescendant(listboxNode));

    handleKeyPress(listboxNode, {key: key, altKey: evt.altKey, ctrlKey: evt.ctrlKey});

    if (!nextItem || "true" === nextItem.getAttribute("aria-disabled")) {
        return;
    }

    switch (key) {
        case KeyCode.PAGE_UP:
        case KeyCode.PAGE_DOWN:
            evt.preventDefault();
            if (key === KeyCode.PAGE_UP) {
                moveUpItem(listboxNode);
            } else {
                moveDownItem(listboxNode);
            }
            break;
        case KeyCode.UP:
        case KeyCode.DOWN:
        case KeyCode.LEFT:
        case KeyCode.RIGHT:
            evt.preventDefault();

            if (evt.ctrlKey) {
                handleCtrlAndArrowKey(listboxNode, key);
                return;
            }

            if (evt.altKey) {
                if (key === KeyCode.UP || key === KeyCode.LEFT) {
                    moveUpItem(listboxNode);
                } else {
                    moveDownItem(listboxNode);
                }
                return;
            }

            if (key === KeyCode.UP || key === KeyCode.LEFT) {
                nextItem = nextItem.previousElementSibling;
            } else {
                nextItem = nextItem.nextElementSibling;
            }

            if (nextItem) {
                focusItem(listboxNode, nextItem);
                if (options.virtual) {
                    handleNavigation(listboxNode, nextItem);
                }
            }

            break;
        case KeyCode.HOME:
            evt.preventDefault();
            focusFirstItem(listboxNode);
            break;
        case KeyCode.END:
            evt.preventDefault();
            focusLastItem(listboxNode);
            break;
        case KeyCode.SPACE:
            evt.preventDefault();
            break;
        case KeyCode.BACKSPACE:
        case KeyCode.DELETE:
        case KeyCode.RETURN:
            break;
        default:
            break;
    }
};

const addItem = function (listboxNode, item) {
    if (item) {
        defocusItem(item);
        listboxNode.append(item);
        if (!getActiveDescendant(listboxNode)) {
            focusItem(listboxNode, item);
        }
        handleItemChange(listboxNode, "added", item);
    }
};

// Removes the focused item in a the listbox and returns it
const deleteItem = function (listboxNode) {
    const item = document.getElementById(getActiveDescendant(listboxNode));
    if (item) {
        item.remove();
        clearActiveDescendant(listboxNode);
        handleItemChange(listboxNode, "removed", item);
        return item;
    }
};

// Shifts the currently focused item up on the list. No shifting occurs if the item is already at the top of the list.
const moveUpItem = function (listboxNode) {
    const activeDescendant = getActiveDescendant(listboxNode);
    if (!activeDescendant) {
        return;
    }
    const currentItem = document.getElementById(activeDescendant),
        previousItem = currentItem.previousElementSibling;
    if (previousItem) {
        if (!options.virtual) {
            listboxNode.insertBefore(currentItem, previousItem);
        }
        handleItemChange(listboxNode, "moved_up", currentItem);
    }
};

// Shifts the currently focused item down on the list. No shifting occurs if the item is already at the end of the list.
const moveDownItem = function (listboxNode) {
    const activeDescendant = getActiveDescendant(listboxNode);
    if (!activeDescendant) {
        return;
    }
    const currentItem = document.getElementById(activeDescendant),
        nextItem = currentItem.nextElementSibling;
    if (nextItem) {
        if (!options.virtual) {
            listboxNode.insertBefore(nextItem, currentItem);
        }
        handleItemChange(listboxNode, "moved_down", currentItem);
    }
};
