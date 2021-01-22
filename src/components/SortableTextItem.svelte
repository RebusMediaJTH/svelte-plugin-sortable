<script>
import SortableItem from "./SortableItem.svelte";
import ContentEditable from "./ContentEditable.svelte";
export let allowContentEdit;
export let isCorrect;
export let showHint;
export let text = "";
export let showAsPlaceholder;
</script>

<SortableItem isCorrect="{isCorrect}" showHint="{showHint && !showAsPlaceholder}" showAsPlaceholder="{showAsPlaceholder}">
    <div class="text">
        <ContentEditable editable="{allowContentEdit}" on:change bind:innerHTML="{text}" />
    </div>
</SortableItem>
