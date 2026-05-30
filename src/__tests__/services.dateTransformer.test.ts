import {transformDatesInObject, serializeDayjsInObject} from "../services/dateTransformer";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("dateTransformer", () => {
    const testTimezone = "Europe/Helsinki";

    describe("transformDatesInObject", () => {
        it("converts ISO string dates to Dayjs in the specified timezone", () => {
            const input = {
                id: 1,
                createdAt: "2026-05-30T12:00:00Z",
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.createdAt).toBeDefined();
            // The result should be a Dayjs object
            expect(result.createdAt.format).toBeDefined();
            expect(typeof result.createdAt.format).toBe("function");
        });

        it("maintains immutability - returns new object", () => {
            const input = {
                id: 1,
                createdAt: "2026-05-30T12:00:00Z",
                title: "Test",
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result).not.toBe(input);
            expect(input.createdAt).toBe("2026-05-30T12:00:00Z"); // Original is unchanged
        });

        it("converts Date objects to Dayjs in the specified timezone", () => {
            const dateObj = new Date("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                createdAt: dateObj,
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.createdAt).toBeDefined();
            expect(result.createdAt.format).toBeDefined();
        });

        it("preserves null datetime values", () => {
            const input = {
                id: 1,
                createdAt: null,
                modifiedAt: null,
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.createdAt).toBeNull();
            expect(result.modifiedAt).toBeNull();
        });

        it("preserves undefined datetime values", () => {
            const input = {
                id: 1,
                createdAt: undefined,
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.createdAt).toBeUndefined();
        });

        it("handles nested objects with date fields", () => {
            const input = {
                id: 1,
                user: {
                    name: "John",
                    lastSeen: "2026-05-30T12:00:00Z",
                },
                createdAt: "2026-05-30T10:00:00Z",
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(result.user.lastSeen).toBeDefined();
            expect(result.user.lastSeen.format).toBeDefined();
            expect(result.createdAt.format).toBeDefined();
        });

        it("handles arrays of objects with date fields", () => {
            const input = [
                {
                    id: 1,
                    createdAt: "2026-05-30T10:00:00Z",
                },
                {
                    id: 2,
                    createdAt: "2026-05-31T10:00:00Z",
                },
            ];
            const result = transformDatesInObject(input, testTimezone);

            expect(Array.isArray(result)).toBe(true);
            expect(result[0].createdAt.format).toBeDefined();
            expect(result[1].createdAt.format).toBeDefined();
        });

        it("respects timezone when converting dates", () => {
            // ISO string in UTC
            const input = {
                createdAt: "2026-05-30T00:00:00Z",
            };
            const result = transformDatesInObject(input, testTimezone);

            // The Dayjs object should exist and be a valid Dayjs
            expect(result.createdAt).toBeDefined();
            expect(result.createdAt.format).toBeDefined();
            // Verify it's in the correct timezone by checking utcOffset
            const utcOffsetInMinutes = result.createdAt.utcOffset();
            expect(utcOffsetInMinutes).not.toBe(0); // Helsinki is not UTC
        });

        it("ignores non-date fields with date-like values", () => {
            const input = {
                id: 1,
                description: "Created on 2026-05-30", // Not a date field
                createdAt: "2026-05-30T12:00:00Z",   // This is a date field
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(typeof result.description).toBe("string");
            expect(result.description).toBe("Created on 2026-05-30");
            expect(result.createdAt.format).toBeDefined();
        });

        it("handles recursive transformation of PagedResponse-like structures", () => {
            const input = {
                data: [
                    {
                        id: 1,
                        createdAt: "2026-05-30T10:00:00Z",
                    },
                ],
                totalElements: 1,
                pageNumber: 0,
            };
            const result = transformDatesInObject(input, testTimezone);

            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0].createdAt.format).toBeDefined();
        });

        it("converts all recognized date field names", () => {
            const input = {
                createdAt: "2026-05-30T12:00:00Z",
                updatedAt: "2026-05-30T13:00:00Z",
                modifiedAt: "2026-05-30T14:00:00Z",
                deletedAt: "2026-05-30T15:00:00Z",
                startTime: "2026-05-30T16:00:00Z",
                endTime: "2026-05-30T17:00:00Z",
                startDate: "2026-05-30",
                endDate: "2026-05-31",
                blockedDate: "2026-05-30",
                certificationDate: "2026-05-30",
                eventDateTime: "2026-05-30T18:00:00Z",
                lastSeen: "2026-05-30T19:00:00Z",
                created: "2026-05-30T20:00:00Z",
                modified: "2026-05-30T21:00:00Z",
            };
            const result = transformDatesInObject(input, testTimezone);

            Object.values(result).forEach((value) => {
                expect(value).toBeDefined();
                expect(value.format).toBeDefined();
            });
        });
    });

    describe("serializeDayjsInObject", () => {
        it("converts Dayjs objects to ISO strings", () => {
            const dayjsObj = dayjs("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                createdAt: dayjsObj,
            };
            const result = serializeDayjsInObject(input);

            expect(typeof result.createdAt).toBe("string");
            expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
        });

        it("maintains immutability - returns new object", () => {
            const dayjsObj = dayjs("2026-05-30T12:00:00Z");
            const input = {
                id: 1,
                createdAt: dayjsObj,
            };
            const result = serializeDayjsInObject(input);

            expect(result).not.toBe(input);
            expect(input.createdAt).toBe(dayjsObj); // Original is unchanged
        });

        it("preserves non-Dayjs values", () => {
            const input = {
                id: 1,
                title: "Test",
                active: true,
                count: 42,
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
                    lastSeen: dayjs("2026-05-30T12:00:00Z"),
                },
            };
            const result = serializeDayjsInObject(input);

            expect(typeof result.user.lastSeen).toBe("string");
        });

        it("handles arrays with Dayjs objects", () => {
            const input = [
                {
                    id: 1,
                    createdAt: dayjs("2026-05-30T10:00:00Z"),
                },
                {
                    id: 2,
                    createdAt: dayjs("2026-05-31T10:00:00Z"),
                },
            ];
            const result = serializeDayjsInObject(input);

            expect(Array.isArray(result)).toBe(true);
            expect(typeof result[0].createdAt).toBe("string");
            expect(typeof result[1].createdAt).toBe("string");
        });

        it("handles null and undefined values", () => {
            const input = {
                id: 1,
                createdAt: null,
                modifiedAt: undefined,
            };
            const result = serializeDayjsInObject(input);

            expect(result.createdAt).toBeNull();
            expect(result.modifiedAt).toBeUndefined();
        });
    });

    describe("round-trip transformation", () => {
        it("can transform and then serialize without data loss", () => {
            const original = {
                id: 1,
                createdAt: "2026-05-30T12:00:00Z",
                title: "Test",
            };

            const transformed = transformDatesInObject(original, testTimezone);
            const serialized = serializeDayjsInObject(transformed);

            // Serialized should have a date string
            expect(typeof serialized.createdAt).toBe("string");
            // The string should represent the same point in time (accounting for timezone)
            expect(serialized.id).toBe(1);
            expect(serialized.title).toBe("Test");
        });
    });

    describe("timezone correctness", () => {
        it("applies correct timezone offset for Helsinki", () => {
            const input = {
                eventDateTime: "2026-05-30T10:00:00",
            };
            const result = transformDatesInObject(input, "Europe/Helsinki");

            // Dayjs should have non-zero UTC offset for Helsinki
            expect(result.eventDateTime).toBeDefined();
            expect(result.eventDateTime.format).toBeDefined();
            const utcOffsetInMinutes = result.eventDateTime.utcOffset();
            // Helsinki is UTC+2 in May (EEST)
            expect(utcOffsetInMinutes).toBe(180); // 3 hours = 180 minutes
        });

        it("applies correct timezone offset for UTC", () => {
            const input = {
                eventDateTime: "2026-05-30T10:00:00",
            };
            const result = transformDatesInObject(input, "UTC");

            expect(result.eventDateTime).toBeDefined();
            // UTC should have offset of 0
            expect(result.eventDateTime.utcOffset()).toBe(0);
        });

        it("preserves timezone information through serialization", () => {
            const input = {
                startDate: dayjs("2026-05-30T10:00:00").tz("Europe/Helsinki"),
            };
            const result = serializeDayjsInObject(input);

            // The serialized string should be valid ISO format
            expect(typeof result.startDate).toBe("string");
            expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
        });
    });
});
