import App from "../App.svelte";
import {mount} from "cypress-svelte-unit-test";

describe("App", () => {
    describe("When starting up", () => {
        it("Says Hello", () => {
            mount(App, {props: {}});

            cy.contains("Hello").should("exist");
        });
    });
});
