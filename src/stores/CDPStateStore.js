import {writable} from "svelte/store";
import {isRegisteredPromise} from "../CDPInitialiser";

function createCDPStateStore() {
    console.warn("creating cdp state store");
    const {subscribe, set} = writable({});
    let cdpSubscriptionPromise;
    let isReadyToSetState = false;
    let CDP;
    const isReadyPromise = new Promise(resolve => {
        isRegisteredPromise.then(cdp => {
            CDP = cdp;
            cdpSubscriptionPromise = CDP.state().subscribe(newState => {
                console.warn(`got new state from cdp ${JSON.stringify(newState, null, 2)}`);
                set(newState);
                isReadyToSetState = true;
                resolve(true);
            });
        });
    });

    return {
        subscribe,
        set: newPartialState => {
            if (isReadyToSetState) {
                console.warn(`setting state in CDP ${JSON.stringify(newPartialState, null, 2)}`);
                //CDP.state().set(newPartialState);
                // TODO - replace the line below with the commented out line above when [BRNT-1287] is fixed
                CDP.state()
                    .get()
                    //.then(oldState => CDP.state().set({...oldState, ...newPartialState}));
                    .then(function (oldState) {
                        CDP.state().set({...oldState, ...newPartialState});
                    });
            } else {
                throw new Error("can't set cdp state yet, forgot to wait for isReadyPromise?");
            }
        },
        isReadyPromise,
        destroy: () => {
            console.warn("unsubscribing from cdp state");
            if (cdpSubscriptionPromise) cdpSubscriptionPromise.then(sub => sub.unsubscribe());
        }
    };
}

export const CDPStateStore = createCDPStateStore();
