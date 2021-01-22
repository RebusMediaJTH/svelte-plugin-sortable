import {derived} from "svelte/store";
import {CDPThemeReadOnlyStore} from "./CDPThemeReadOnlyStore";

export const CDPThemeExternalStylesReadOnlyStore = derived(CDPThemeReadOnlyStore, ({cssUrl, css: customCss} = {}) => {
    console.warn("got updated theme external styles", {cssUrl, customCss});
    return `
            <style>
                ${cssUrl ? `@import url("${cssUrl}");` : ""} 
                ${customCss}
            </style>
        `;
});
