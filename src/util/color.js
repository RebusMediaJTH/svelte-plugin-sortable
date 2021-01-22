/**
 * @param rgbaStr - the rbgba string you want to adjust the alpha value for
 * @param alphaMultiplier - the new alpha value will be the original value times the multiplier
 * @return {string} the original rgba sting with the new alpha
 */
export function adjustAlpha(rgbaStr, alphaMultiplier) {
    const rg = /,\s*(\d*\.?\d*)\s*\)$/g;
    const originalAlpha = parseFloat(rg.exec(rgbaStr)[1]);
    return rgbaStr.replace(rg, `, ${originalAlpha * alphaMultiplier})`);
}
