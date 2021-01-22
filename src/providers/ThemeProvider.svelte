<script>
import {CDPStateStore as CDPState} from "../stores/CDPStateStore";
import {CDPThemeReadOnlyStore as CDPTheme} from "../stores/CDPThemeReadOnlyStore";
import {CDPThemeExternalStylesReadOnlyStore as CDPThemeStyle} from "../stores/CDPThemeExternalStylesReadOnlyStore";
import {CDPStateExternalStylesReadOnlyStore as CDPStateStyle} from "../stores/CDPStateExternalStylesReadOnlyStore";
import {adjustAlpha} from "../util/color";

let CDPThemeVars, CDPStateVars;
// TODO - give sensible defaults in the style block
$: CDPThemeVars = !$CDPTheme
    ? ""
    : `
        ${toMaybeVarString($CDPTheme.bodyFont, "body-font")}
        ${toMaybeVarString($CDPTheme.titleFont, "title-font")}
        ${toMaybeVarString($CDPTheme.primaryColor, "primary-color")}
        ${toMaybeVarString(adjustAlpha($CDPTheme.primaryColor, 0.4), "primary-color-40")}
        ${toMaybeVarString($CDPTheme.textColor, "text-color")}
        ${toMaybeVarString($CDPTheme.successColor, "success-color")}
        ${toMaybeVarString($CDPTheme.errorColor, "error-color")}
        ${toMaybeVarString($CDPTheme.surfaceColor, "surface-color")}
        ${toMaybeVarString($CDPTheme.backgroundColor, "background-color")}
    `;
$: CDPStateVars =
    !$CDPState.style || $CDPState.style.textColor
        ? ""
        : `
         ${toMaybeVarString($CDPState.style.textColor, "text-color")}
    `;

function toMaybeVarString(maybeVal, cssVarName) {
    return `${maybeVal ? `--${cssVarName}:${maybeVal};` : ""}`;
}
</script>

<style>
:global(:root) {
    --body-font: arial;
    --title-font: arial;
    --primary-color: #2e9fff;
    --text-color: grey;
    --success-color: #62d3ab;
    --error-color: #f05f51;
    --surface-color: #2e9fff;
    --background-color: white;
}
.theme-styles-wrapper,
.cdp-styles-wrapper {
    height: 100%;
}
</style>

<div class="theme-styles-wrapper" style="{CDPThemeVars}">
    {@html $CDPThemeStyle}
    <div class="cdp-styles-wrapper" style="{CDPStateVars}">
        {@html $CDPStateStyle}
        <slot />
    </div>
</div>
