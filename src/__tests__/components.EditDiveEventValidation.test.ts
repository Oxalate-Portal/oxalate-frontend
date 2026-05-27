import {exceedsMaxParticipants, isMaxParticipantsTooLow} from "../components/DiveEvent/editDiveEventValidation";
import * as test from "node:test";
import * as test from "node:test";
import * as test from "node:test";
import * as test from "node:test";

describe("EditDiveEvent participant max validation", () => {
    test("allows count at max limit", () => {
        expect(exceedsMaxParticipants(4, 4)).toBe(false);
    });

    test("rejects count above max limit", () => {
        expect(exceedsMaxParticipants(5, 4)).toBe(true);
    });

    test("allows max participants to equal currently selected participants", () => {
        expect(isMaxParticipantsTooLow(4, 4)).toBe(false);
    });

    test("rejects max participants lower than currently selected participants", () => {
        expect(isMaxParticipantsTooLow(4, 3)).toBe(true);
    });
});
