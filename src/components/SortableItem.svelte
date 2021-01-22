<script>
import {iconCorrect, iconIncorrect} from "../assets/icons";
export let isCorrect;
export let showHint;
export let showAsPlaceholder;
</script>

<style>
.icon {
    position: absolute;
    top: 1px;
    left: 1px;
    opacity: 0;
    height: 15px;
    width: 15px;
    box-sizing: border-box;
    background-color: inherit;
    border-radius: 0px 2px 0px 4px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.icon.correct {
    background-color: var(--success-color);
}
.icon.incorrect {
    background-color: var(--error-color);
}
.icon :global(svg) {
    width: 100%;
    height: 100%;
}
.show-hint.correct .icon.correct,
.show-hint.incorrect .icon.incorrect {
    opacity: 1;
}

.icon::before {
    content: "";
    z-index: 4;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(0, 0, 0, 0);
    transition: background-color var(--flip-duration) ease-in;
}

:global(.sortable-item-clone) .icon {
    display: none;
}

.sr-result {
    display: none;
}
.show-hint.correct .sr-result.correct,
.show-hint.incorrect .sr-result.incorrect {
    display: block;
}

.content :global([contenteditable]):hover {
    background: rgba(0, 0, 0, 0.5);
}
.content :global([contenteditable]):focus {
    background: #fff;
    color: #000;
}
.content.hide {
    visibility: hidden;
}
</style>

<div class="content" class:hide="{showAsPlaceholder}" class:show-hint="{showHint}" class:correct="{isCorrect}" class:incorrect="{!isCorrect}">
    <slot />
    <span class="icon correct">{@html iconCorrect}</span>
    <span class="icon incorrect">{@html iconIncorrect}</span>
    <span class="sr-result sr-only correct">Correct!</span>
    <span class="sr-result sr-only incorrect">Incorrect</span>
</div>
