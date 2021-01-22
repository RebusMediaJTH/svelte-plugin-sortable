import {derived} from "svelte/store";
import {CDPStateStore} from "./CDPStateStore";

export const CDPStateExternalStylesReadOnlyStore = derived(CDPStateStore, ({style}) => {
    if (!style) return "";
    console.warn("got updated state styles", style);
    const {cssUrl, customCss} = style;
    return `
            <style>
                ${cssUrl ? `@import url("${cssUrl}");` : ""} 
                ${customCss}
            </style>
        `;
});
