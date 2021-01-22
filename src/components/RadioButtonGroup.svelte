<script>
import {createEventDispatcher} from "svelte";

export let name;
export let items;
export let checkedIdx;
export let joined = true;

const dispatch = createEventDispatcher();

let value = items[checkedIdx].value,
    groupFocused;

$: {
    checkedIdx = items.findIndex(item => item.value === value);
    dispatch("change", {value: value});
}

function focus(item) {
    groupFocused = true;
    item.focused = true;
    items = [...items];
}
function blur(item) {
    console.log("******************BLUR", item);
    console.log(items);
    groupFocused = false;
    item.focused = false;
    items = [...items];
}
</script>

<style>
.group {
    display: flex;
    border-radius: 4px;
    font-size: 0.875rem;
}
.btn {
    display: flex;
    border: 2px solid #505050;
    border-radius: 4px;
    background: #fff;
    font-weight: 500;
}
.btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
}
.group:not(.joined) .btn {
    margin-left: 8px;
}
.group:not(.joined) > .btn:first-of-type {
    margin-left: 0;
}
.group.joined .btn:not(.last) {
    border-right: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}
.group.joined .btn:not(.first) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
:global(body.keyboard-nav) .group:not(.joined) .btn.focused,
:global(body.keyboard-nav) .group.joined.group-focused {
    box-shadow: 0 0 0 0.05em #fff, 0 0 0.15em 0.1em var(--primary-color);
}
input {
    opacity: 0;
    width: 15px;
    margin: 0;
    padding: 0;
    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;
    pointer-events: none;
}
input:focus {
    outline: none;
}
label {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 4px 0 4px 15px;
    user-select: none;
    cursor: pointer;
    line-height: 1;
}
</style>

<div class="group" class:joined class:group-focused="{groupFocused}">
    {#each items as item, i}
        <div
            class="btn"
            class:active="{i === checkedIdx}"
            class:focused="{item.focused}"
            class:first="{i === 0}"
            class:last="{i == items.length - 1}"
        >
            <label>
                <span>{@html item.label}</span>
                <input
                    type="radio"
                    name="{name}"
                    value="{item.value}"
                    bind:group="{value}"
                    on:focus="{() => focus(item)}"
                    on:blur="{() => blur(item)}"
                />
            </label>
        </div>
    {/each}
</div>
