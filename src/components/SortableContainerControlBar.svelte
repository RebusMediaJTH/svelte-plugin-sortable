<script>
import {createEventDispatcher} from "svelte";
import {iconDelete, iconAdd} from "../assets/icons";
import ToggleButton from "./ToggleButton.svelte";

export let container;
export let showOrdered;
export let allowDelete;

const dispatch = createEventDispatcher();
</script>

<style>
section {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    margin-bottom: 6px;
}
.btn-remove {
    width: 30px;
    height: 30px;
    fill: rgba(217, 61, 50, 0.7);
}
.btn-add {
    padding: 2px;
}
.btn-add span {
    display: block;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--primary-color);
    transition: box-shadow 0.3s ease;
}
.btn-add:not(:disabled):hover span,
.keyboard-nav .btn-add:not(:disabled):focus span {
    box-shadow: 0 0 0 4px rgba(46, 159, 255, 0.25);
}
.btn-add:focus:active span {
    box-shadow: none;
}
.btn-add :global(svg) {
    fill: #fff;
}
</style>

<section>
    {#if showOrdered}
        <ToggleButton label="Ordered" checked="{container.ordered}" on:change="{e => dispatch('orderedChanged', {checked: e.detail.checked})}" />
    {/if}
    <button
        type="button"
        on:click="{() => dispatch('removeContainer')}"
        class="icon-btn btn-remove"
        aria-label="Remove container"
        title="Remove container"
        disabled="{!allowDelete}"
    >{@html iconDelete}</button>
    <button type="button" on:click="{() => dispatch('addItem')}" class="icon-btn btn-add" aria-label="Add item" title="Add item"><span
        >{@html iconAdd}</span></button>
</section>
