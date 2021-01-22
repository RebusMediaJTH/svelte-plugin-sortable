<!--
    LiveFeedback.svelte

    Creates a hidden aria live region.
    > After being set, the content is cleared after a short period (clearAfter) to prevent confusion if a screenreader user were to navigate to it.
    > If the content being set is the same as the current content, it is first cleared and then set to ensure it is announced again.
    > Pass testing="true" to make the text visible to all; not just screenreader users

    <script>
        import LiveFeedback from './LiveFeedback.svelte';
        let liveFeedback1, liveFeedback1;
        ...
        liveFeedback.set('Announce this to screen readers');
    </script>
    <LiveFeedback bind:this={liveFeedback1} clearAfter=5000 atomic=true />
    <LiveFeedback bind:this={liveFeedback2} clearAfter="never" atomic=false />
-->
<script>
import {onDestroy} from "svelte";

let control, timeoutId;

export let testing = false;
export let atomic = true;
export let assertive = true;
export let clearAfter = 5000; // Pass 'never' to never clear
export const set = function (html, silent) {
    var old = control.innerHTML,
        sameContent = html === old;
    window.clearTimeout(timeoutId);
    if (silent) {
        control.removeAttribute("aria-live");
    }
    if (sameContent) {
        control.innerHTML = "";
    }
    timeoutId = window.setTimeout(
        function () {
            control.innerHTML = html;
            if (silent) {
                timeoutId = window.setTimeout(function () {
                    control.setAttribute("aria-live", assertive ? "assertive" : "passive");
                }, 100);
            }
            if (clearAfter !== "never" && html !== "") {
                timeoutId = window.setTimeout(function () {
                    control.innerHTML = "";
                }, clearAfter);
            }
        },
        sameContent ? 100 : 0
    );
};
export const clear = function () {
    set("");
};
onDestroy(() => window.clearTimeout(timeoutId));
</script>

<style>
.sr-only:not(.testing) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>

<div bind:this="{control}" class="sr-only{testing ? ' testing' : ''}" aria-live="{assertive ? 'assertive' : 'passive'}" aria-atomic="{atomic}"></div>
