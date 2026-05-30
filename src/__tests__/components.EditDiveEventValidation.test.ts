import {exceedsMaxParticipants, isMaxParticipantsTooLow} from "../components/DiveEvent/editDiveEventValidation";

describe("EditDiveEvent participant max validation", () => {
    it("allows count at max limit", () => {
        expect(exceedsMaxParticipants(4, 4)).toBe(false);
    });

    it("rejects count above max limit", () => {
        expect(exceedsMaxParticipants(5, 4)).toBe(true);
    });

    it("allows max participants to equal currently selected participants", () => {
        expect(isMaxParticipantsTooLow(4, 4)).toBe(false);
    });

    it("rejects max participants lower than currently selected participants", () => {
        expect(isMaxParticipantsTooLow(4, 3)).toBe(true);
    });
});
