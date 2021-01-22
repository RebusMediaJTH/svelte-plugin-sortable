<script>
import {createEventDispatcher} from "svelte";
import {iconAdd} from "../assets/icons";
import RadioButtonGroup from "./RadioButtonGroup.svelte";
import ToggleButton from "./ToggleButton.svelte";

export let editorMode;
export let showHintsEditor;
export let contentEditEnabled;

const dispatch = createEventDispatcher();
</script>

<style>
section {
    display: flex;
    justify-content: space-around;
    width: 100%;
}
.btn-add-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0;
    padding: 4px 15px;
    line-height: 1;
    border: 2px solid var(--primary-color);
    border-radius: 4px;
    background: #fff;
    font-size: 0.875rem;
    font-weight: 500;
}
.btn-add-container:disabled {
    opacity: 0.5;
}
:global(body.keyboard-nav) .btn-add-container:focus {
    box-shadow: 0 0 0 0.05em #fff, 0 0 0.15em 0.1em var(--primary-color);
}
.btn-add-container > :first-child {
    width: 26px;
    height: 26px;
    margin-right: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    fill: #fff;
    transition: box-shadow 0.3s ease;
}
.btn-add-container:not(:disabled):hover > :first-child,
:global(.keyboard-nav) .btn-add-container:not(:disabled):focus > :first-child {
    box-shadow: 0 0 0 4px rgba(46, 159, 255, 0.25);
}
</style>

<section>
    <RadioButtonGroup
        name="editorMode"
        checkedIdx="{editorMode === 'initial' ? 0 : 1}"
        items="{[{label: 'Initial<br>Position', value: 'initial'}, {label: 'Correct<br>Position', value: 'correct'}]}"
        on:change="{e => dispatch('editorModeChanged', {value: e.detail.value})}"
    />
    <ToggleButton label="Highlight<br>Correct" bind:checked="{showHintsEditor}" disabled="{editorMode !== 'initial'}" />
    <ToggleButton
        label="Enable<br>Item Edit"
        bind:checked="{contentEditEnabled}"
        on:change="{e => dispatch('itemEditEnabledChanged', {checked: e.detail.checked})}"
    />
    <button type="button" class="btn-add-container" on:click="{() => dispatch('addContainer')}">
        <span>{@html iconAdd}</span>
        <span>Container</span>
    </button>
</section>
