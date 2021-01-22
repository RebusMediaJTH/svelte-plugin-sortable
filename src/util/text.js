/**
 * Useful when you need to do something (ex: create an aria label) with rich text but don't want the fancy tags to get in the way
 * @param richTxt - the rich text with fancy tags
 * @return {string} - just the text
 */
export function richTextToText(richTxt) {
    const el = document.createElement("div");
    el.innerHTML = richTxt;
    return el.innerText;
}
