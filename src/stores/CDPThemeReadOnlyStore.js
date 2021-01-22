import {readable} from "svelte/store";
import {isRegisteredPromise} from "../CDPInitialiser";

export const CDPThemeReadOnlyStore = readable(undefined, function start(set) {
    set(
        new Promise(resolve => {
            isRegisteredPromise.then(CDP => {
                CDP.theme().subscribe(theme => {
                    console.warn("got theme from CDP", theme);
                    set(theme);
                    resolve(true);
                });
            });
        })
    );
});
