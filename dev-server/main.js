import {CDPMock} from "./CDPMock";
import {initAria} from "../src/util/aria";
import {initCDP} from "../src/CDPInitialiser";
import Editor from "./Editor.svelte";

initAria();
initCDP(CDPMock);

const app = new Editor({
    target: document.body
});

export default app;
