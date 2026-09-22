import dayjs from "dayjs";
import {buildParticipantOptions, exceedsMaxParticipants, hasValidPaymentForEvent, isMaxParticipantsTooLow} from "../components";
import type {ListUserResponse} from "../models";
import {PaymentTypeEnum, UserTypeEnum} from "../models";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const futureDate = dayjs().add(1, "year");
const pastDate = dayjs().subtract(1, "year");

function makeUser(overrides: Partial<ListUserResponse> = {}): ListUserResponse {
    return {
        id: 1,
        name: "Doe Jane",
        event_dive_count: 0,
        created_at: dayjs(),
        payments: [],
        membership_active: false,
        user_type: UserTypeEnum.SCUBA_DIVER,
        tags: [],
        ...overrides
    };
}

// ---------------------------------------------------------------------------
// hasValidPaymentForEvent
// ---------------------------------------------------------------------------
describe("hasValidPaymentForEvent", () => {
    const eventId = 240;

    it("returns false when user has no payments", () => {
        expect(hasValidPaymentForEvent(makeUser({payments: []}), eventId)).toBe(false);
    });

    it("returns true for a PERIODICAL payment with future end date", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.PERIODICAL,
                payment_count: 0,
                start_date: pastDate,
                end_date: futureDate,
                created: pastDate,
                bound_events: null
            }]
        });
        expect(hasValidPaymentForEvent(user, eventId)).toBe(true);
    });

    it("returns false for a PERIODICAL payment with past end date", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.PERIODICAL,
                payment_count: 0,
                start_date: pastDate,
                end_date: pastDate,
                created: pastDate,
                bound_events: null
            }]
        });
        expect(hasValidPaymentForEvent(user, eventId)).toBe(false);
    });

    it("returns true for ONE_TIME payment with null end date and positive paymentCount", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 1,
                start_date: pastDate,
                end_date: dayjs().add(1, "day"),
                created: pastDate,
                bound_events: null
            }]
        });
        expect(hasValidPaymentForEvent(user, eventId)).toBe(true);
    });

    it("does not throw when boundEvents is null and paymentCount is 0", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 0,
                start_date: pastDate,
                end_date: dayjs().add(1, "day").add(1, "day"),
                created: pastDate,
                bound_events: null
            }]
        });
        expect(() => hasValidPaymentForEvent(user, eventId)).not.toThrow();
        expect(hasValidPaymentForEvent(user, eventId)).toBe(false);
    });

    it("returns true for ONE_TIME payment when event is in boundEvents and paymentCount is 0", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 0,
                start_date: pastDate,
                end_date: dayjs().add(1, "day"),
                created: pastDate,
                bound_events: [eventId, 999]
            }]
        });
        expect(hasValidPaymentForEvent(user, eventId)).toBe(true);
    });

    it("returns false for ONE_TIME payment when boundEvents does not include event and paymentCount is 0", () => {
        const user = makeUser({
            payments: [{
                id: 1, user_id: 1,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 0,
                start_date: pastDate,
                end_date: dayjs().add(1, "day"),
                created: pastDate,
                bound_events: [999]
            }]
        });
        expect(hasValidPaymentForEvent(user, eventId)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// buildParticipantOptions — label format, filtering, and regression cases
// ---------------------------------------------------------------------------
describe("buildParticipantOptions", () => {
    const eventId = 240;

    // Mirrors real API responses: only a combined "name" field, no separate firstName/lastName.
    const aksitKubra = makeUser({
        id: 450,
        name: "Akşit Kübra",
        payments: [{
            id: 751, user_id: 450,
            payment_type: PaymentTypeEnum.ONE_TIME,
            payment_count: 1,
            start_date: pastDate,
            end_date: dayjs().add(1, "day"),
            created: pastDate,
            bound_events: null
        }],
        membership_active: false
    });

    // Participant with exhausted payments: paymentCount=0, boundEvents=null.
    // Would be filtered out by payment logic alone, but is already enrolled.
    const almeidaTejas = makeUser({
        id: 243,
        name: "Almeida Tejas",
        payments: [
            {
                id: 670,
                user_id: 243,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 0,
                start_date: pastDate,
                end_date: dayjs().add(1, "day"),
                created: pastDate,
                bound_events: null
            },
            {
                id: 380,
                user_id: 243,
                payment_type: PaymentTypeEnum.ONE_TIME,
                payment_count: 0,
                start_date: pastDate,
                end_date: dayjs().add(1, "day"),
                created: pastDate,
                bound_events: null
            }
        ],
        membership_active: false
    });

    // --- Label format ---

    it("formats the label as 'name (id)'", () => {
        const options = buildParticipantOptions([aksitKubra], eventId, false, false);
        expect(options).toHaveLength(1);
        expect(options[0].label).toBe("Akşit Kübra (450)");
    });

    it("does NOT produce 'undefined undefined (id)' when the DTO has only a name field", () => {
        // Regression guard: adding firstName/lastName to the interface would cause
        // "undefined undefined (id)" if the backend does not return those fields.
        const options = buildParticipantOptions([aksitKubra], eventId, false, false);
        expect(options[0].label).not.toMatch(/undefined/);
    });

    it("includes the user id in the label", () => {
        const options = buildParticipantOptions([aksitKubra], eventId, false, false);
        expect(options[0].label).toContain("(450)");
    });

    // --- Always-include current participants (core regression) ---

    it("always includes current participants even when they fail the payment filter (regression)", () => {
        // almeidaTejas: paymentCount=0 + boundEvents=null → normally excluded.
        const options = buildParticipantOptions(
            [aksitKubra, almeidaTejas],
            eventId,
            false,
            false,
            [almeidaTejas]
        );
        expect(options.map(o => o.value)).toContain(243);
        expect(options.map(o => o.value)).toContain(450);
    });

    it("always includes current participants even when membership is required and they are inactive (regression)", () => {
        // Both users have membershipActive=false. With requiresMembership=true the filter
        // removes everyone — but enrolled participants must still appear in options.
        const options = buildParticipantOptions(
            [aksitKubra, almeidaTejas],
            eventId,
            true,
            false,
            [aksitKubra, almeidaTejas]
        );
        expect(options.map(o => o.value)).toContain(450);
        expect(options.map(o => o.value)).toContain(243);
    });

    it("current participants added via currentParticipants also use 'name (id)' label format", () => {
        const options = buildParticipantOptions([], eventId, false, false, [almeidaTejas]);
        expect(options).toHaveLength(1);
        expect(options[0].label).toBe("Almeida Tejas (243)");
        expect(options[0].label).not.toMatch(/undefined/);
    });

    it("does not duplicate a participant who appears in both users and currentParticipants", () => {
        const options = buildParticipantOptions(
            [aksitKubra],
            eventId,
            false,
            false,
            [aksitKubra]
        );
        expect(options.filter(o => o.value === 450)).toHaveLength(1);
    });

    // --- Filtering of non-enrolled users ---

    it("excludes non-enrolled users who lack active membership when membership is required", () => {
        const options = buildParticipantOptions([aksitKubra], eventId, true, false);
        expect(options).toHaveLength(0);
    });

    it("excludes non-enrolled users with no payments when active payment is required", () => {
        const userNoPayments = makeUser({id: 9, name: "Payments None", payments: []});
        const options = buildParticipantOptions([userNoPayments], eventId, false, true);
        expect(options).toHaveLength(0);
    });

    it("returns empty array for empty user list and no current participants", () => {
        expect(buildParticipantOptions([], eventId, false, false)).toHaveLength(0);
    });
});

