<!--
    Handle change on blur:
        <ContentEditable on:change={labelChanged}>{@html container.label}</ContentEditable>
        <ContentEditable on:change={labelChanged} bind:innerHTML={container.label} />
    Handle every change:
        <ContentEditable on:change={labelChanged} notifyEveryChange={true} bind:innerHTML={container.label} />
    
    > When binding, ensure innerHTML !== undefined
    > When not binding, the current value can be obtained from e.detail.innerHTML
-->
<script>
import {createEventDispatcher} from "svelte";

export let editable;
export let id = undefined;
export let innerHTML;
export let notifyEveryChange = false;

const dispatch = createEventDispatcher();
let saveInnerHTML;

$: if (undefined !== innerHTML && notifyEveryChange) {
    dispatch("change", {innerHTML: innerHTML});
}

function focus() {
    saveInnerHTML = this.innerHTML;
}

function blur() {
    if (this.innerHTML !== saveInnerHTML) {
        saveInnerHTML = this.innerHTML;
        dispatch("change", {innerHTML: this.innerHTML});
    }
}
</script>

<style>
[contenteditable] {
    cursor: text;
    padding: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    transition: background-color 0.3s;
}
[contenteditable]:focus {
    outline: none;
}
</style>

{#if editable}
    {#if undefined !== innerHTML}
        {#if notifyEveryChange}
            <div id="{id}" contenteditable on:click|stopPropagation bind:innerHTML></div>
        {:else}
            <div id="{id}" contenteditable on:click|stopPropagation on:focus="{focus}" on:blur="{blur}" bind:innerHTML></div>
        {/if}
    {:else}
        <div id="{id}" contenteditable on:click|stopPropagation on:focus="{focus}" on:blur="{blur}">
            <slot />
        </div>
    {/if}
{:else if undefined !== innerHTML}
    <div id="{id}">
        {@html innerHTML}
    </div>
{:else}
    <div id="{id}">
        <slot />
    </div>
{/if}
