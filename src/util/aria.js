import {richTextToText} from "./text";

const ALERT_DIV_ID = "aria-alerts-container";
let alertsDiv;

/**
 * Call this initially to set everything up for dynamic alerts
 */
export function initAria() {
    // setting the dynamic alerts
    alertsDiv = document.createElement("div");
    (function initAlertsDiv() {
        alertsDiv.id = ALERT_DIV_ID;
        // tab index -1 makes the alert be read twice on chrome for some reason
        //alertsDiv.tabIndex = -1;
        alertsDiv.style.position = "fixed";
        alertsDiv.style.bottom = "0";
        alertsDiv.style.left = "0";
        alertsDiv.style.zIndex = "-5";
        alertsDiv.style.opacity = "0";
        alertsDiv.style.height = "0";
        alertsDiv.style.width = "0";
        alertsDiv.setAttribute("role", "alert");
    })();
    document.body.prepend(alertsDiv);
}

/**
 * Will make the screen reader alert the provided text to the user
 * @param {string} txt
 */
export function alertToScreenReader(txt) {
    alertsDiv.innerHTML = "";
    const plainText = richTextToText(txt);
    const alertText = document.createTextNode(plainText);
    alertsDiv.appendChild(alertText);
    // this is needed for Safari
    alertsDiv.style.display = "none";
    alertsDiv.style.display = "inline";
}
