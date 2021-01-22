<script>
import Main from "../src/Main.svelte";
import {CDPMock, persistState, setThemeExternally} from "./CDPMock";

let state = {};
let theme = {};
CDPMock.state().subscribe(newState => {
    state = JSON.stringify(newState, null, 2);
});
CDPMock.theme().subscribe(newTheme => {
    theme = JSON.stringify(newTheme, null, 2);
});
</script>

<style>
:global(body) {
    padding: 1em;
}
.main-container {
    height: 75vh;
    border: 1px solid darkgrey;
    margin-bottom: 1em;
}

.editor-container {
    height: 20vh;
    width: 100%;
    display: flex;
    justify-content: space-between;
}
.editor-container > div {
    width: 48%;
}
button {
    width: 50%;
    float: right;
}
textarea {
    display: block;
    width: 100%;
    height: 60%;
}
.editor-container.allow-reset > div:first-child button {
    width: 40%;
}
.editor-container.allow-reset > div:first-child > div > :first-child {
    float: left;
}
</style>

<section class="main-container">
    <Main />
</section>
<section class="editor-container" class:allow-reset="{persistState}">
    <div>
        <h3>State {persistState ? `(${persistState} storage)` : ''}:</h3>
        <textarea bind:value="{state}"></textarea>
        <div>
            {#if persistState}<button on:click="{() => CDPMock.state().reset()}">Reset State</button>{/if}
            <button on:click="{() => CDPMock.state().set(JSON.parse(state))}">Update State</button>
        </div>
    </div>
    <div>
        <h3>Theme:</h3>
        <textarea bind:value="{theme}"></textarea>
        <button on:click="{() => setThemeExternally(JSON.parse(theme))}">Update Theme</button>
    </div>
</section>
