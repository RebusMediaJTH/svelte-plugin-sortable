<script>
import App from "./components/App.svelte";
import ThemeProvider from "./providers/ThemeProvider.svelte";
import {CDPStateStore as CDPState} from "./stores/CDPStateStore";
import {CDPContextReadOnlyStore} from "./stores/CDPContextReadOnlyStore";
import {CDPThemeReadOnlyStore} from "./stores/CDPThemeReadOnlyStore";
</script>

{#await Promise.all([CDPState.isReadyPromise, $CDPContextReadOnlyStore, $CDPThemeReadOnlyStore])}
    <h3>Loading...</h3>
{:then _}
    <ThemeProvider>
        <App />
    </ThemeProvider>
{/await}
