import {readable} from "svelte/store";
import {isRegisteredPromise} from "../CDPInitialiser";

export const CDPContextReadOnlyStore = readable("", function start(set) {
    set(
        new Promise(resolve => {
            isRegisteredPromise.then(CDP => {
                console.warn("getting context");
                CDP.context()
                    .get()
                    .then(context => {
                        console.warn("got context", context);
                        resolve(context);
                        set(context);
                    });
            });
        })
    );
});
