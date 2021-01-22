<script>
import SortableItem from "./SortableItem.svelte";
import ContentEditable from "./ContentEditable.svelte";
export let allowContentEdit;
export let isCorrect;
export let showHint;
export let image;
export let alt;
export let text;
export let layout = "vertical";
export let showAsPlaceholder;
</script>

<style>
.layout.vertical img {
    display: block;
    width: 100%;
}
.layout.vertical.has-text img {
    margin-bottom: 4px;
}
.layout.horizontal {
    display: flex;
    align-items: flex-start;
}
.layout.horizontal img,
.layout.horizontal .label {
    width: 50%;
}
.layout.horizontal.has-text img {
    margin-right: 4px;
}
</style>

<SortableItem isCorrect="{isCorrect}" showHint="{showHint && !showAsPlaceholder}" showAsPlaceholder="{showAsPlaceholder}">
    <div class="layout" class:has-text="{!!text}" class:vertical="{layout === 'Vertical'}" class:horizontal="{layout === 'Horizontal'}">
        <img src="{image}" alt="{alt}" draggable="false" />
        <div class="label">
            <div class="text">
                <ContentEditable editable="{allowContentEdit}" on:change bind:innerHTML="{text}" />
            </div>
        </div>
    </div>
</SortableItem>
