import REAL_CDP from "@pearsontechnology/aero-plugin-api/lib/cdp";

let resolvePromise;
export const isRegisteredPromise = new Promise(resolve => {
    resolvePromise = resolve;
});
export function initCDP(CDP = REAL_CDP) {
    console.warn("initializing CDP");
    CDP.register().then(() => {
        console.warn("Initialised CDP");
        window.__CDP = CDP;
        resolvePromise(CDP);
    });
}
