import {initialState} from "./InitialState";
import {initialTheme} from "./initialTheme";
import {deepCopy} from "../src/util/data";

const STATE_KEY = "cdp-mock";

export const persistState = "session"; // 'session' | 'local' | falsey

let state;
if (persistState) {
    state = window[`${persistState}Storage`].getItem(STATE_KEY);
    state = state ? JSON.parse(state) : initialState;
} else {
    state = initialState;
}

const stateSubscribers = new Set();

let theme = initialTheme;
const themeSubscribers = new Set();

function notifyStateSubscribers(newState) {
    Array.from(stateSubscribers).forEach(cb => cb(newState));
}
function notifyThemeSubscribers(newTheme) {
    Array.from(themeSubscribers).forEach(cb => cb(newTheme));
}

export const CDPMock = {
    register: () => {
        return Promise.resolve();
    },
    state: () => ({
        get: () => Promise.resolve(deepCopy(state)),
        // TODO - change this when CDP starts supporting partial state
        set: newState => {
            const newStateJSON = JSON.stringify(newState);
            if (JSON.stringify(state) !== newStateJSON) {
                notifyStateSubscribers(newState);
                state = deepCopy(newState);
                if (persistState) {
                    window[`${persistState}Storage`].setItem(STATE_KEY, newStateJSON);
                }
            }
            return newState;
        },
        reset: () => {
            window[`${persistState}Storage`].removeItem(STATE_KEY);
            window.location.reload();
        },
        // TODO - add support for path if needed (currently it's not)
        subscribe(cb) {
            stateSubscribers.add(cb);
            cb(deepCopy(state));
            return Promise.resolve({unsubscribe: () => stateSubscribers.delete(cb)});
        }
    }),
    theme: () => ({
        get: () => Promise.resolve(theme),
        subscribe: cb => {
            themeSubscribers.add(cb);
            cb(deepCopy(theme));
            return () => Promise.resolve({unsubscribe: () => themeSubscribers.delete(cb)});
        },
        subscribeToCSS: () => {
            throw new Error("feel free to implement subscribeToCss if it is ever needed");
        }
    }),
    context: () => ({
        get: () => {
            const urlParams = new URLSearchParams(window.location.search);
            const context = (urlParams && urlParams.get("context")) || "LEARNER";
            return Promise.resolve(context);
        }
    })
};

export function setThemeExternally(newTheme) {
    newTheme = deepCopy(newTheme);
    theme = newTheme;
    notifyThemeSubscribers(newTheme);
}
