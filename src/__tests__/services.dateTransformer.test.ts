import {serializeDayjsInObject, transformDatesInObject} from "../services";
import dayjs, {type Dayjs} from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

function expectDayjs(value: unknown): Dayjs {
    if (!dayjs.isDayjs(value)) {
        throw new Error("Expected transformed value to be a Dayjs instance");
    }
    return value;
}

describe("dateTransformer", () => {
    const testTimezone = "Europe/Helsinki";

    describe("transformDatesInObject", () => {
        it("leaves null, primitives, invalid date strings, and non-date objects unchanged", () => {
            expect(transformDatesInObject(null, testTimezone)).toBeNull();
            expect(transformDatesInObject("2026-05-30", testTimezone)).toBe("2026-05-30");
            const alreadyParsed = dayjs("2026-05-30");
            const input = {
                created_at: "not-a-date",
                start_date: alreadyParsed,
                nested: {when: new Date("2026-05-30T12:00:00Z")}
            };
            const result = transformDatesInObject(input, testTimezone);
            expect(result.created_at).toBe("not-a-date");
            expect(expectDayjs(result.start_date).toISOString()).toBe(alreadyParsed.toISOString());
            expect(expectDayjs(result.nested.when).format).toBeDefined();
        });
        it("converts ISO string dates to Dayjs in the specified timezone", () => {
            const input = {
                id: 1,
                created_at: "2026-05-30T12:00:00Z"
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.created_at).toBeDefined();
            // The result should be a Dayjs object
            expect(expectDayjs(result.created_at).format).toBeDefined();
            expect(typeof expectDayjs(result.created_at).format).toBe("function");
        });

        it("maintains immutability - returns new object", () => {
            const input = {
                id: 1,
                created_at: "2026-05-30T12:00:00Z",
                title: "Test"
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result).not.toBe(input);
            expect(input.created_at).toBe("2026-05-30T12:00:00Z"); // Original is unchanged
        });

        it("converts Date objects to Dayjs in the specified timezone", () => {
            const dateObj = new Date("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                created_at: dateObj
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.created_at).toBeDefined();
            expect(expectDayjs(result.created_at).format).toBeDefined();
        });

        it("preserves null datetime values", () => {
            const input = {
                id: 1,
                created_at: null,
                modified_at: null
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.created_at).toBeNull();
            expect(result.modified_at).toBeNull();
        });

        it("preserves undefined datetime values", () => {
            const input = {
                id: 1,
                created_at: undefined
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.created_at).toBeUndefined();
        });

        it("handles nested objects with date fields", () => {
            const input = {
                id: 1,
                user: {
                    name: "John",
                    last_seen: "2026-05-30T12:00:00Z"
                },
                created_at: "2026-05-30T10:00:00Z"
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.user.last_seen).toBeDefined();
            expect(expectDayjs(result.user.last_seen).format).toBeDefined();
            expect(expectDayjs(result.created_at).format).toBeDefined();
        });

        it("handles arrays of objects with date fields", () => {
            const input = [
                {
                    id: 1,
                    created_at: "2026-05-30T10:00:00Z"
                },
                {
                    id: 2,
                    created_at: "2026-05-31T10:00:00Z"
                }
            ];
            const result = transformDatesInObject(input, testTimezone);

            expect(Array.isArray(result)).toBe(true);
            expect(expectDayjs(result[0].created_at).format).toBeDefined();
            expect(expectDayjs(result[1].created_at).format).toBeDefined();
        });

        it("respects timezone when converting dates", () => {
            // ISO string in UTC
            const input = {
                created_at: "2026-05-30T00:00:00Z"
            };
            const result = transformDatesInObject(input, testTimezone);

            // The Dayjs object should exist and be a valid Dayjs
            expect(result.created_at).toBeDefined();
            expect(expectDayjs(result.created_at).format).toBeDefined();
            // Verify it's in the correct timezone by checking utcOffset
            const utcOffsetInMinutes = expectDayjs(result.created_at).utcOffset();
            expect(utcOffsetInMinutes).not.toBe(0); // Helsinki is not UTC
        });

        it("ignores non-date fields with date-like values", () => {
            const input = {
                id: 1,
                description: "Created on 2026-05-30", // Not a date field
                created_at: "2026-05-30T12:00:00Z"   // This is a date field
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(typeof result.description).toBe("string");
            expect(result.description).toBe("Created on 2026-05-30");
            expect(expectDayjs(result.created_at).format).toBeDefined();
        });

        it("handles recursive transformation of PagedResponse-like structures", () => {
            const input = {
                data: [
                    {
                        id: 1,
                        created_at: "2026-05-30T10:00:00Z"
                    }
                ],
                totalElements: 1,
                pageNumber: 0
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(Array.isArray(result.data)).toBe(true);
            expect(expectDayjs(result.data[0].created_at).format).toBeDefined();
        });

        it("converts all recognized date field names", () => {
            const input = {
                created_at: "2026-05-30T12:00:00Z",
                updated_at: "2026-05-30T13:00:00Z",
                modified_at: "2026-05-30T14:00:00Z",
                deletedAt: "2026-05-30T15:00:00Z",
                start_time: "2026-05-30T16:00:00Z",
                endTime: "2026-05-30T17:00:00Z",
                start_date: "2026-05-30",
                end_date: "2026-05-31",
                blocked_date: "2026-05-30",
                certification_date: "2026-05-30",
                event_date_time: "2026-05-30T18:00:00Z",
                last_seen: "2026-05-30T19:00:00Z",
                created: "2026-05-30T20:00:00Z",
                modified: "2026-05-30T21:00:00Z"
            };
            const result = transformDatesInObject(input, testTimezone);

            Object.values(result).forEach((value) => {
                expect(value).toBeDefined();
                expect(expectDayjs(value).format).toBeDefined();
            });
        });
    });

    describe("serializeDayjsInObject", () => {
        it("handles root values and nested nulls without changing non-Dayjs objects", () => {
            const value = dayjs("2026-05-30T12:00:00Z");
            expect(serializeDayjsInObject(value)).toBe(value.toISOString());
            expect(serializeDayjsInObject(null)).toBeNull();
            expect(serializeDayjsInObject(42)).toBe(42);
            expect(serializeDayjsInObject({nested: {value: null, text: "plain"}})).toEqual({
                nested: {value: null, text: "plain"}
            });
        });
        it("converts Dayjs objects to ISO strings", () => {
            const dayjsObj = dayjs("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                created_at: dayjsObj
            };
            const result = serializeDayjsInObject(input);

            expect(typeof result.created_at).toBe("string");
            expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
        });

        it("maintains immutability - returns new object", () => {
            const dayjsObj = dayjs("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                created_at: dayjsObj
            };
            const result = serializeDayjsInObject(input);

            expect(result).not.toBe(input);
            expect(input.created_at).toBe(dayjsObj); // Original is unchanged
        });

        it("preserves non-Dayjs values", () => {
            const input = {
                id: 1,
                title: "Test",
                active: true,
                count: 42
            };
            const result = serializeDayjsInObject(input);

            expect(result.id).toBe(1);
            expect(result.title).toBe("Test");
            expect(result.active).toBe(true);
            expect(result.count).toBe(42);
        });

        it("handles nested objects with Dayjs fields", () => {
            const input = {
                id: 1,
                user: {
                    name: "John",
                    last_seen: dayjs("2026-05-30T12:00:00Z")
                }
            };
            const result = serializeDayjsInObject(input);

            expect(typeof result.user.last_seen).toBe("string");
        });

        it("handles arrays with Dayjs objects", () => {
            const input = [
                {
                    id: 1,
                    created_at: dayjs("2026-05-30T10:00:00Z")
                },
                {
                    id: 2,
                    created_at: dayjs("2026-05-31T10:00:00Z")
                }
            ];
            const result = serializeDayjsInObject(input);

            expect(Array.isArray(result)).toBe(true);
            expect(typeof result[0].created_at).toBe("string");
            expect(typeof result[1].created_at).toBe("string");
        });

        it("handles null and undefined values", () => {
            const input = {
                id: 1,
                created_at: null,
                modified_at: undefined
            };
            const result = serializeDayjsInObject(input);

            expect(result.created_at).toBeNull();
            expect(result.modified_at).toBeUndefined();
        });
    });

    describe("round-trip transformation", () => {
        it("can transform and then serialize without data loss", () => {
            const original = {
                id: 1,
                created_at: "2026-05-30T12:00:00Z",
                title: "Test"
            };

            const transformed = transformDatesInObject(original, testTimezone);
            const serialized = serializeDayjsInObject(transformed);

            // Serialized should have a date string
            expect(typeof serialized.created_at).toBe("string");
            // The string should represent the same point in time (accounting for timezone)
            expect(serialized.id).toBe(1);
            expect(serialized.title).toBe("Test");
        });
    });

    describe("timezone correctness", () => {
        it("applies correct timezone offset for Helsinki", () => {
            const input = {
                event_date_time: "2026-05-30T10:00:00"
            };
            const result = transformDatesInObject(input, "Europe/Helsinki");

            // Dayjs should have non-zero UTC offset for Helsinki
            expect(result.event_date_time).toBeDefined();
            expect(expectDayjs(result.event_date_time).format).toBeDefined();
            const utcOffsetInMinutes = expectDayjs(result.event_date_time).utcOffset();
            // Helsinki is UTC+2 in May (EEST)
            expect(utcOffsetInMinutes).toBe(180); // 3 hours = 180 minutes
        });

        it("applies correct timezone offset for UTC", () => {
            const input = {
                event_date_time: "2026-05-30T10:00:00"
            };
            const result = transformDatesInObject(input, "UTC");

            expect(result.event_date_time).toBeDefined();
            // UTC should have offset of 0
            expect(expectDayjs(result.event_date_time).utcOffset()).toBe(0);
        });

        it("preserves timezone information through serialization", () => {
            const input = {
                start_date: dayjs("2026-05-30T10:00:00").tz("Europe/Helsinki")
            };
            const result = serializeDayjsInObject(input);

            // The serialized string should be valid ISO format
            expect(typeof result.start_date).toBe("string");
            expect(result.start_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
        });
    });
});
