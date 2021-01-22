import Main from "./Main.svelte";
import {initAria} from "./util/aria";
import {initCDP} from "./CDPInitialiser";

initAria();
initCDP();
const app = new Main({
    target: document.body
});

export default app;
