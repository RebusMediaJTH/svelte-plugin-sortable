<script>
import {CDPStateStore as CDPState} from "../stores/CDPStateStore";
import {init as initUtils} from "../util/utils.js";
import Sortable from "./Sortable.svelte";

initUtils();
</script>

<style>
main {
    text-align: center;
    padding: 1em;
    height: 100%;
    max-width: 240px;
    margin: 0 auto;
}

:global(.cdp-styles-wrapper) {
    overflow: auto;
}

@media (min-width: 640px) {
    main {
        max-width: none;
    }
}
</style>

<main>
    <Sortable
        enabled="{$CDPState.enabled}"
        bind:title="{$CDPState.title}"
        bind:instructions="{$CDPState.instructions}"
        bind:orientation="{$CDPState.orientation}"
        bind:isCorrect="{$CDPState.isCorrect}"
        bind:correctCount="{$CDPState.correctCount}"
        bind:showHints="{$CDPState.showHints}"
        containers="{$CDPState.containers}"
        items="{$CDPState.items}"
        containerSizeCanChange="{$CDPState.containerSizeCanChange}"
        allowReset="{$CDPState.allowReset}"
    />
</main>
