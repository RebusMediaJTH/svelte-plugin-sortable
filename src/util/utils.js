import UAParser from "./UAParser.js";

const detectKeyboardNav = () => {
    var keyboardNav;
    document.body.addEventListener("keydown", e => {
        const key = e.keyCode || e.which;
        if (key === 9 && !keyboardNav) {
            keyboardNav = true;
            document.body.classList.add("keyboard-nav");
        }
    });
    document.body.addEventListener("mousedown", () => {
        if (keyboardNav) {
            keyboardNav = false;
            document.body.classList.remove("keyboard-nav");
        }
    });
};

export const environment = (function () {
    var res = UAParser(),
        atts = [],
        browser = {name: "unknown", version: {major: 0, minor: 0, build: 0}},
        os = {name: "unknown", version: {major: 0, minor: 0, build: 0}};
    var createVersionParts = function (version) {
        var parts = version.split(".");
        return {
            major: parseInt(parts[0], 10),
            minor: parts.length > 1 ? parseInt(parts[1], 10) : 0,
            build: parts.length > 2 ? parseInt(parts[2], 10) : 0
        };
    };
    if (res.browser) {
        if (res.browser.name) {
            browser.name = res.browser.name.toLowerCase().split(" ").join("-");
            atts.push(["browser", browser.name]);
        }
        if (res.browser.version) {
            browser.version = createVersionParts(res.browser.version);
            atts.push(["browser-version", browser.version.major]);
        }
    }
    if (res.os) {
        if (res.os.name) {
            os.name = res.os.name.toLowerCase().split(" ").join("-");
            if (os.name.indexOf("ios") !== -1) {
                os.name = "ios";
            } else if (os.name.indexOf("android") !== -1) {
                os.name = "android";
            } else if (os.name.indexOf("windows phone") !== -1) {
                os.name = "windows-phone";
            }
            atts.push(["os", os.name]);
        }
        if (res.os.version) {
            os.version = createVersionParts(res.os.version);
            atts.push(["os-version", os.version.major]);
        }
    }
    atts.forEach(att => document.documentElement.setAttribute(`data-${att[0]}`, att[1]));
    return {
        // { name: String, version: { major: Number, minor: Number, build: Number } }
        os: os,
        // { name: String, version: { major: Number, minor: Number, build: Number } }
        browser: browser
    };
})();

export const init = () => {
    detectKeyboardNav();
};

export const getTouchCoords = e => {
    // Android only provides changedTouches for a touchend event
    var touches = e.touches.length ? e.touches : e.changedTouches;
    return {x: touches[0].pageX, y: touches[0].pageY};
};

export const getCoords = e => {
    return e.type.indexOf("touch") === 0 ? getTouchCoords(e) : {x: e.pageX, y: e.pageY};
};
