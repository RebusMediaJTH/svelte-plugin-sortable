<script>
import {createEventDispatcher} from "svelte";
import {flip} from "svelte/animate";
import {iconDelete} from "../assets/icons";
import ContentEditable from "./ContentEditable.svelte";
import ContainerControlBar from "./SortableContainerControlBar.svelte";
import TextItem from "./SortableTextItem.svelte";
import ImageItem from "./SortableImageItem.svelte";

export let containers;
export let idx;
export let items;
export let sortableItems;
export let editorMode;
export let orientation;
export let itemEditEnabled;
export let flipDuration;
export let showHints;
export let allocateId;

const ALWAYS_SHOW_CONTROL_BAR = true,
    dispatch = createEventDispatcher();

$: container = containers[idx];
$: editing = editorMode !== "none";

function labelChanged() {
    dispatch("change", {containers: containers});
}

function itemLabelChanged(idx) {
    items.find(item => item.id === sortableItems[idx].id).label = sortableItems[idx].label;
    dispatch("change", {items: items});
}

function orderedChanged(e) {
    container.ordered = e.detail.checked;
    dispatch("change", {containers: containers, reload: true});
}

function removeContainer() {
    if (items.find(item => item[`${editorMode === "initial" ? "correct" : "initial"}Position`][0] === idx)) {
        alert(`${editorMode === "initial" ? "Correct" : "Initial"} items are placed here. Delete them first.`);
        return;
    }
    if (idx < containers.length - 1) {
        // Shift item container indices down 1 for all items in containers after this
        for (let i = idx + 1; i < containers.length; i++) {
            items.forEach(item => {
                ["initial", "correct"].forEach(key => {
                    const pos = item[`${key}Position`];
                    if (pos[0] === i) {
                        pos[0] -= 1;
                        if (key === "initial") {
                            item.currentPosition[0] = pos[0];
                        }
                    }
                });
            });
        }
    }
    containers.splice(idx, 1);
    if (containers.length === 0) {
        containers[0].ordered = true;
    }
    dispatch("change", {containers: containers, items: items, reload: true});
}

function addItem() {
    let initialPositionInContainer, correctPositionInContainer;
    if (editorMode === "initial") {
        initialPositionInContainer = sortableItems.length;
        correctPositionInContainer =
            1 + items.filter(item => item.correctPosition[0] === idx).reduce((maxIdx, item) => Math.max(maxIdx, item.correctPosition[1]), -1);
    } else {
        correctPositionInContainer = sortableItems.length;
        initialPositionInContainer =
            1 + items.filter(item => item.initialPosition[0] === idx).reduce((maxIdx, item) => Math.max(maxIdx, item.initialPosition[1]), -1);
    }
    items.push({
        id: allocateId("item"),
        label: "New item",
        image: "",
        imageAlt: "",
        currentPosition: [idx, initialPositionInContainer],
        initialPosition: [idx, initialPositionInContainer],
        correctPosition: [idx, correctPositionInContainer]
    });
    dispatch("change", {items: items, reload: true});
}

function removeItem(e, itemIdx) {
    e.stopPropagation();
    const id = sortableItems[itemIdx].id,
        stateIdx = items.findIndex(i => i.id === id),
        item = items[stateIdx];
    // For all items in the same container, after this item, reduce their position by 1.
    items.forEach(item2 => {
        ["initial", "correct"].forEach(key => {
            const pos1 = item2[`${key}Position`],
                pos2 = item[`${key}Position`];
            if (pos1[0] === pos2[0] && pos1[1] > pos2[1]) {
                pos1[1] -= 1;
                if (key === "initial") {
                    item2.currentPosition[1] = pos1[1];
                }
            }
        });
    });
    items.splice(stateIdx, 1);
    dispatch("change", {items: items, reload: true});
}

const controlbar = (function () {
    let timeoutId;
    return {
        show: function (e, immediate) {
            if (itemEditEnabled && !this.classList.contains("sortable-placeholder")) {
                timeoutId = window.setTimeout(() => this.classList.add("control-bar-active"), immediate ? 0 : 500);
            }
        },
        hide: function () {
            if (itemEditEnabled) {
                window.clearTimeout(timeoutId);
                this.classList.remove("control-bar-active");
            }
        }
    };
})();
</script>

<style>
.sortable-container {
    flex: 1;
    max-width: 270px;
    display: flex;
    flex-direction: column;
    margin: 0 5px;
}

[role="listbox"] {
    padding: 8px;
    background: #f6f6f6;
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-radius: 4px;
}
:global(.sortable-sorting) [role="listbox"] {
    background: #f2f8fc;
    border-color: var(--primary-color);
}
[role="listbox"]:focus {
    outline: none;
}

.sortable-item {
    position: relative;
    overflow: hidden;
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    cursor: grab;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}
.content-wrapper {
    background: var(--primary-color);
    border: 2px solid var(--primary-color);
    border-radius: 4px;
    padding: 4px;
    transition: background-color var(--flip-duration), border-color var(--flip-duration);
}
.show-hints .sortable-item:not(.sortable-placeholder):not(.sortable-item-clone).correct .content-wrapper {
    background: var(--success-color);
    border-color: var(--success-color);
}
.show-hints .sortable-item:not(.sortable-placeholder):not(.sortable-item-clone).incorrect .content-wrapper {
    background: var(--error-color);
    border-color: var(--error-color);
}
.sortable-item:not([aria-disabled="false"]) {
    opacity: 0.5;
    cursor: not-allowed;
}
.sortable-placeholder .content-wrapper {
    background: #fff;
    border: 2px dashed var(--primary-color);
    box-sizing: border-box;
}
.sortable-placeholder.click-method {
    cursor: pointer;
}
/* Although the selected item is remembered in all boxes we only show the selected item in the focused box to avoid confusion */
:global([data-interaction-method="keyboard"]) [role="listbox"]:focus .sortable-item[aria-selected="true"],
:global([data-interaction-method="click"]) .sortable-item[aria-selected="true"],
.sortable-item-clone {
    outline: 2px solid var(--primary-color);
}
:global([data-interaction-method="keyboard"]) [role="listbox"]:focus .sortable-item[aria-selected="true"] .content-wrapper,
:global([data-interaction-method="click"]) .sortable-item[aria-selected="true"] .content-wrapper,
.sortable-item-clone .content-wrapper {
    border: 2px solid #fff !important;
}

.sortable-item-clone {
    z-index: 1;
}
.sortable-item-clone .hide-from-clone {
    display: none;
}

.orientation-horizontal [role="listbox"] {
    display: flex;
    flex-wrap: wrap;
    min-height: 140px;
}
.orientation-vertical [role="listbox"] {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.orientation-vertical .sortable-item {
    margin-bottom: 4px;
}
.orientation-vertical [role="listbox"] > :last-child {
    margin-bottom: 0;
}

/* EDITOR mode */

.control-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 4px;
    background: rgba(0, 0, 0, 0.8);
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    transition: transform 0.25s ease-out;
    transform: translateY(-100%);
}
.sortable-item.control-bar-active {
    padding-top: 32px;
}
.sortable-item.control-bar-active .content-wrapper {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}
.sortable-item.control-bar-active .control-bar {
    transform: translateY(0);
}
.control-bar .btn-remove {
    width: 24px;
    height: 24px;
    fill: #fff;
}

/* .config-mode [role="listbox"] { border: 2px dashed rgba(0,0,0,0.3); } */
</style>

<li
    class="{`sortable-container orientation-${orientation.toLowerCase()}`}"
    class:config-mode="{editing}"
    class:show-hints="{showHints}"
    style="{`--flip-duration: ${flipDuration}ms`}"
>
    <div class="text">
        <ContentEditable id="{`${container.id}-lbl`}" editable="{editing}" on:change="{labelChanged}" bind:innerHTML="{container.label}" />
    </div>
    {#if editing}
        <ContainerControlBar
            container="{container}"
            showOrdered="{containers.length > 1}"
            allowDelete="{containers.length > 1 && sortableItems.length === 0}"
            on:addItem="{addItem}"
            on:removeContainer="{removeContainer}"
            on:orderedChanged="{orderedChanged}"
        />
    {/if}
    <div
        data-idx="{idx}"
        role="listbox"
        tabindex="0"
        aria-labelledby="{`${container.id}-lbl`}"
        aria-orientation="{orientation.toLowerCase()}"
        aria-readonly="false"
    >
        {#each sortableItems as item, ii (item.id)}
            <div
                id="{item.id}"
                role="option"
                aria-selected="{item.selected || false}"
                aria-disabled="false"
                class="sortable-item"
                class:focused="{item.focused}"
                class:sortable-placeholder="{item.showAsPlaceholder || item.clickMethodPlaceholder}"
                class:click-method="{item.clickMethodPlaceholder}"
                class:correct="{item.correct}"
                class:incorrect="{!item.correct}"
                class:control-bar-active="{itemEditEnabled && !item.showAsPlaceholder && !item.clickMethodPlaceholder && ALWAYS_SHOW_CONTROL_BAR}"
                on:mouseenter="{ALWAYS_SHOW_CONTROL_BAR ? undefined : controlbar.show}"
                on:mouseleave="{ALWAYS_SHOW_CONTROL_BAR ? undefined : controlbar.hide}"
                on:click="{controlbar.hide}"
                animate:flip="{{duration: flipDuration}}"
            >
                {#if itemEditEnabled && !item.showAsPlaceholder && !item.clickMethodPlaceholder}
                    <div class="control-bar hide-from-clone">
                        <button
                            type="button"
                            class="icon-btn btn-remove"
                            on:click="{e => removeItem(e, ii)}"
                            on:focus="{ALWAYS_SHOW_CONTROL_BAR ? undefined : function () {
                                      controlbar.show.call(this.closest('.sortable-item'), {}, true);
                                  }}"
                            on:blur="{ALWAYS_SHOW_CONTROL_BAR ? undefined : function () {
                                      controlbar.hide.call(this.closest('.sortable-item'));
                                  }}"
                            aria-label="Remove item"
                        >{@html iconDelete}</button>
                    </div>
                {/if}
                <div class="content-wrapper" style="{item.clickMethodPlaceholder ? `width:${item.size.width}px;height:${item.size.height}px;` : ''}">
                    {#if item.image}
                        <ImageItem
                            allowContentEdit="{itemEditEnabled}"
                            image="{item.image}"
                            alt="{item.imageAlt}"
                            layout="{item.layout}"
                            bind:text="{item.label}"
                            isCorrect="{item.correct}"
                            showHint="{showHints}"
                            showAsPlaceholder="{item.showAsPlaceholder}"
                            on:change="{() => itemLabelChanged(ii)}"
                        />
                    {:else}
                        <TextItem
                            allowContentEdit="{itemEditEnabled}"
                            bind:text="{item.label}"
                            isCorrect="{item.correct}"
                            showHint="{showHints}"
                            showAsPlaceholder="{item.showAsPlaceholder}"
                            on:change="{() => itemLabelChanged(ii)}"
                        />
                    {/if}
                </div>
                <span class="sr-only mobile-assistive-text">{item.mobileAssistiveText || ''}</span>
            </div>
        {/each}
    </div>
</li>
