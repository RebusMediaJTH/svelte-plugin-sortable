<script>
import {createEventDispatcher} from "svelte";

export let label;
export let checked = false;
export let disabled = false;

const dispatch = createEventDispatcher();

let focused;

$: {
    dispatch("change", {checked: checked});
}
</script>

<style>
.btn {
    display: flex;
    border: 2px solid #505050;
    border-radius: 4px;
    background: #fff;
    font-size: 0.875rem;
    font-weight: 500;
}
.btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
}
:global(body.keyboard-nav) .btn.focused {
    box-shadow: 0 0 0 0.05em #fff, 0 0 0.15em 0.1em #505050;
}
:global(body.keyboard-nav) .btn.active.focused {
    box-shadow: 0 0 0 0.05em #fff, 0 0 0.15em 0.1em var(--primary-color);
}
.btn.disabled {
    opacity: 0.5;
    cursor: default;
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
.btn.disabled label {
    cursor: default;
}
</style>

<div class="btn" class:focused class:active="{checked}" class:disabled>
    <label>
        <span>{@html label}</span>
        <input type="checkbox" bind:checked disabled="{disabled}" on:focus="{() => (focused = true)}" on:blur="{() => (focused = false)}" />
    </label>
</div>
