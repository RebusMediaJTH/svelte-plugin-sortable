<script>
/*
    To do: Editor mode
    ------------------
    > For keyboard, after adding a new item, set it as selected/focused and set the listbox activedescendant to it.
    > Option to hide the container label, delete container btn & add item btns to make navigation easier between containers when using the keyboard.
 */
import {onMount} from "svelte";
import {tick} from "svelte";
import {CDPContextReadOnlyStore as CDPContext} from "../stores/CDPContextReadOnlyStore";
import {CDPStateStore as CDPState} from "../stores/CDPStateStore";
import sortable from "../dragdrop/sortable.js";
import * as domUtils from "../util/domUtils.js";
import ContentEditable from "./ContentEditable.svelte";
import ControlBar from "./SortableControlBar.svelte";
import Container from "./SortableContainer.svelte";

export let enabled = true;
export let title = "";
export let instructions = "";
export let isCorrect;
export let correctCount;
let showHintsLearner;
export {showHintsLearner as showHints};
export let containers;
export let items;
export let containerSizeCanChange;
export let orientation = "Vertical";
export let allowReset;

const FLIP_DURATION = 200;

let showHintsEditor = true;
let editorMode = $CDPContext === "LEARNER" ? "none" : "initial"; // 'none' | 'initial' | 'correct'
let itemsKey = $CDPContext === "LEARNER" ? "current" : editorMode;
$: editing = $CDPContext === "EDITOR";
$: showHints = (!editing && showHintsLearner) || (editing && showHintsEditor && editorMode !== "correct");

$: if (instance) {
    if (enabled) {
        instance.enable();
    } else {
        instance.disable();
    }
}

let itemEditEnabled = false;

let itemsByContainer = [];

let control, instance;

// 'item' | 'box'
const allocateId = type => {
    let id = `${type}-${Math.round(Math.random() * 100000000)}`;
    return (type === "item" ? items : containers).find(obj => obj.id === id) ? allocateId(type) : id;
};

/*
    Convert Items from:
        items: [
            id: String,  label: String, image: String, imageAlt: String,
            currentPosition: [containerIdx, positionInContainer],
            initialPosition: [containerIdx, positionInContainer],
            correctPosition: [containerIdx, positionInContainer]
        ]
    To an array of containers with items:
    [
        [{ id: String,  label: String, image: String, imageAlt: String }]
    ]
*/
const convertDataForSortable = () => {
    itemsByContainer = [];
    containers.forEach(() => itemsByContainer.push([]));
    console.warn("################### ITEMS", items);
    items.forEach(item => {
        const position = item[`${itemsKey}Position`];
        itemsByContainer[position[0]][position[1]] = Object.assign({}, item);
    });
};

const updateItemsState = save => {
    const newItems = [];
    itemsByContainer.forEach((containerItems, ci) =>
        containerItems.forEach((item, i) => {
            if (!item.clickMethodPlaceholder) {
                const stateItem = items.find(si => si.id === item.id);
                stateItem[`${itemsKey}Position`] = [ci, i];
                if (editorMode === "initial") {
                    stateItem.currentPosition = [ci, i];
                }
                newItems.push(stateItem);
            }
        })
    );
    items = newItems;
    if (save) {
        CDPState.set({items: items});
    }
};

const markCorrectItems = () => {
    let count = 0;
    containers.forEach((c, ci) =>
        itemsByContainer[ci].forEach((item, i) => {
            const pos = item.correctPosition,
                ordered = containers.length === 1 ? true : c.ordered;
            item.correct = ci === pos[0] && (!ordered || i === pos[1]);
            count += item.correct ? 1 : 0;
        })
    );
    correctCount = count;
    isCorrect = correctCount === items.length;
};

const fullReload = () => {
    convertDataForSortable();
    markCorrectItems();
    instance.updateItems(itemsByContainer);
    itemsByContainer = [...itemsByContainer];
};

convertDataForSortable();
markCorrectItems();

// For dragdrop, it's critical that the animation is over before continuing to make checks to see if the draglet is over a slot (the bounds need to be recalculated)
// The keyboard method doesn't have an animationComplete callback
// The click method does so that it can keep the currently selected item highlighted until it's in its new position. For simplicity, a check isn't made to see which item
// should be monitored - we simply pass the selected item - which will not animate if moved to the first or last place of another container. In this case, because it's
// not critcial, we just set a timeout.
const waitForFlipToComplete = function (monitorItem, callback) {
    if (!FLIP_DURATION) {
        callback();
    }
    const element = document.getElementById(monitorItem.id);
    if (domUtils.getAnimationDuration(element)) {
        domUtils.onAnimationEnd(element, callback);
    } else {
        window.setTimeout(callback, FLIP_DURATION);
    }
};

async function updateDOM(e) {
    //console.log('UPDATE DOM', e);
    itemsByContainer = e.itemsByContainer;
    await tick();
    if (e.domUpdated) {
        e.domUpdated();
    }
    if (e.animationComplete) {
        waitForFlipToComplete(e.animationItem, e.animationComplete);
    }
}

onMount(async () => {
    instance = sortable({
        containerSelector: '.sortable-container [role="listbox"]',
        itemClass: "sortable-item",
        containment: ".sortable-containers",
        // Virtual mode specifies that all DOM updates will be handled here, not by sortable
        virtualMode: {
            itemsByContainer: itemsByContainer,
            updateDOM: updateDOM
        },
        dragdrop: {
            dropDuration: 100,
            containerSizeCanChange: containerSizeCanChange,
            prestart: function () {
                if (itemEditEnabled && this.querySelector("[contenteditable]") === document.activeElement) {
                    return false;
                }
            },
            start: function () {
                if (itemEditEnabled) {
                    this.classList.remove("control-bar-active");
                }
                resetFeedback();
            },
            cloned: function () {
                if (itemEditEnabled) {
                    this.querySelector("[contenteditable]").classList.remove("active");
                }
            }
        },
        click: {
            assistiveText: {
                beforeItem: "Activate to place the selected item before this.",
                afterItem: "Activate to place the selected item after this.",
                placeholder: "End of the list. Activate to place the selected item here."
            },
            itemSelected: resetFeedback
        },
        keyboard: {
            itemSelected: resetFeedback
        },
        // interactionMethodChanged: function (e) {
        //     console.log(e.method); // 'dragdrop' | 'keyboard' | 'click'
        // },
        change: function () {
            //console.log(`change from: ${e.from.containerIdx}, ${e.from.idx} to: ${e.to.containerIdx}, ${e.to.idx}`);
            updateItemsState(true);
            markCorrectItems();
            if (showHintsEditor) {
                itemsByContainer = [...itemsByContainer];
            }
        }
    });
    return () => {
        instance.destroy();
    };
});

function addContainer() {
    containers.push({id: allocateId("box"), label: "New container", ordered: containers.length ? containers[0].ordered : false});
    CDPState.set({containers: containers});
    fullReload();
}

function containerChanged(e) {
    const obj = e.detail,
        newState = {};
    if (obj.containers) {
        containers = obj.containers;
        newState.containers = obj.containers;
    }
    if (obj.items) {
        items = obj.items;
        newState.items = obj.items;
    }
    CDPState.set(newState);
    if (obj.reload) {
        fullReload();
    }
}

// Does nothing at the moment.
// If feedback was shown after clicking a submit button, we'd want to clear it each time a drag started or a item was selected via keyboard or click
//let requiresFeedbackReset = false;
const resetFeedback = function () {
    // if (requiresFeedbackReset) {
    //     ... reset the feedback
    //     requiresFeedbackReset = false;
    // }
};

const reset = () => {
    items.forEach(item => (item.currentPosition = [item.initialPosition[0], item.initialPosition[1]]));
    CDPState.set({items: items});
    fullReload();
};

function editorModeChanged(e) {
    editorMode = e.detail.value;
    itemsKey = editorMode;
    fullReload();
}

function itemEditEnabledChanged() {
    fullReload();
}
</script>

<style>
.sortable-control {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
}
.sortable-containers {
    list-style: none;
    padding: 0;
    flex: 1;
    width: 100%;
    display: flex;
    justify-content: flex-start;
}
.sortable-control > p {
    font-weight: 500;
    margin: 10px 0;
}

.sortable-containers > :first-child {
    margin-left: 0;
}
.sortable-containers > :last-child {
    margin-right: 0;
}

.sortable-control :global(.text) {
    padding: 5px;
    font-weight: 500;
}

.btns-container {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
}

/* Editor Mode */

.sortable-control :global(button):not(:disabled) {
    cursor: pointer;
}
.sortable-control :global(.icon-btn) {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
}
.sortable-control :global(.icon-btn):disabled {
    opacity: 0.5;
}
.sortable-control :global(.icon-btn svg) {
    width: 100%;
    height: 100%;
}

.sortable-control :global([contenteditable]) {
    transition: background-color 0.3s;
}
.sortable-control :global([contenteditable]):hover {
    background: rgba(46, 159, 255, 0.15);
}
.sortable-control :global([contenteditable]):focus {
    background: rgba(74, 211, 172, 0.15);
    outline: none;
}
</style>

<div bind:this="{control}" data-editor-mode="{editorMode}" class="sortable-control">
    <h3 class="text">
        <ContentEditable editable="{editing}" bind:innerHTML="{title}" />
    </h3>
    <p class="text">
        <ContentEditable editable="{editing}" bind:innerHTML="{instructions}" />
    </p>
    {#if editing}
        <ControlBar
            editorMode="{editorMode}"
            bind:showHintsEditor
            bind:contentEditEnabled="{itemEditEnabled}"
            on:editorModeChanged="{editorModeChanged}"
            on:itemEditEnabledChanged="{itemEditEnabledChanged}"
            on:addContainer="{addContainer}"
        />
    {/if}
    <p tabindex="0" class="keyboard-instructions sr-only sr-only-focusable">
        For keyboard users, use the arrow keys to navigate the items. Press the alt key with an arrow key to move an item.
        {#if containers.length > 1}Press the control key with an arrow key to move an item between boxes.{/if}
    </p>
    <ul class="sortable-containers" aria-label="Containers">
        {#each containers as container, ci (container.id)}
            <Container
                containers="{containers}"
                idx="{ci}"
                items="{items}"
                sortableItems="{itemsByContainer[ci]}"
                editorMode="{editorMode}"
                orientation="{orientation}"
                itemEditEnabled="{itemEditEnabled}"
                flipDuration="{FLIP_DURATION}"
                showHints="{showHints}"
                allocateId="{allocateId}"
                on:change="{containerChanged}"
            />
        {/each}
    </ul>
    {#if !editing}
        <div class="sr-only" aria-live="polite" aria-atomic="true">
            {#if correctCount === items.length}All items are correctly placed!{:else}{correctCount} of {items.length} items are correctly placed{/if}
        </div>
        {#if allowReset}
            <div class="btns-container"><button type="button" on:click="{reset}">Reset</button></div>
        {/if}
    {/if}
</div>
