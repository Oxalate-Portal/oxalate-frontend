import dayjs from "dayjs";

/**
 * Field names that should be treated as date/datetime fields and converted to Dayjs.
 * Matches both exact names and patterns (e.g., endsWith patterns).
 */
const DATE_FIELD_PATTERNS = [
    // Exact patterns
    "createdAt",
    "updatedAt",
    "modifiedAt",
    "deletedAt",
    "startTime",
    "endTime",
    "startDate",
    "endDate",
    "blockedDate",
    "certificationDate",
    "eventDateTime",
    "lastSeen",
    "created",
    "modified",
];

/**
 * Check if a field name suggests it contains a date/datetime value
 */
function isDateField(fieldName: string): boolean {
    return DATE_FIELD_PATTERNS.includes(fieldName);
}

/**
 * Check if a string looks like an ISO datetime/date
 */
function isDateString(value: string): boolean {
    if (typeof value !== "string") return false;
    // ISO 8601 format: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, etc.
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoPattern.test(value);
}

/**
 * Recursively transform an object, converting date strings and Date objects to Dayjs instances
 * in fields that are identified as date/datetime fields.
 *
 * @param obj - The object to transform
 * @param timezone - The timezone to use for Dayjs instances (e.g., "Europe/Helsinki")
 * @returns A new object with date fields transformed to Dayjs
 */
export function transformDatesInObject<T>(obj: T, timezone: string): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Date) {
        // Convert Date objects to Dayjs in the specified timezone
        return dayjs(obj).tz(timezone) as unknown as T;
    }

    if (typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => transformDatesInObject(item, timezone)) as unknown as T;
    }

    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (isDateField(key)) {
            if (value === null || value === undefined) {
                transformed[key] = value;
            } else if (typeof value === "string" && isDateString(value)) {
                // Convert ISO string to Dayjs in the specified timezone
                transformed[key] = dayjs(value).tz(timezone);
            } else if (value instanceof Date) {
                // Convert Date to Dayjs in the specified timezone
                transformed[key] = dayjs(value).tz(timezone);
            } else if (
                typeof value === "object" &&
                value !== null &&
                "valueOf" in value &&
                typeof (value as {valueOf: () => number}).valueOf() === "number"
            ) {
                // Handle Dayjs or other date-like objects
                transformed[key] = dayjs(value).tz(timezone);
            } else {
                // Already a Dayjs or other format
                transformed[key] = value;
            }
        } else if (typeof value === "object" && value !== null) {
            // Recursively transform nested objects
            if (Array.isArray(value)) {
                transformed[key] = value.map((item) => transformDatesInObject(item, timezone));
            } else if (value instanceof Date) {
                transformed[key] = dayjs(value).tz(timezone);
            } else {
                transformed[key] = transformDatesInObject(value, timezone);
            }
        } else {
            transformed[key] = value;
        }
    }

    return transformed as T;
}

/**
 * Serialize Dayjs objects to ISO strings for API requests.
 * Only serializes actual Dayjs objects, leaving other values unchanged.
 */
export function serializeDayjsInObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Check if this is a Dayjs object
    if (typeof obj === "object" && "$isDayjsObject" in obj) {
        return (obj as Record<string, unknown>).format() as unknown as T;
    }

    if (typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => serializeDayjsInObject(item)) as unknown as T;
    }

    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            serialized[key] = value;
        } else if (typeof value === "object") {
            // Check if it's a Dayjs object
            if ("$isDayjsObject" in value) {
                serialized[key] = (value as Record<string, unknown>).format();
            } else if (Array.isArray(value)) {
                serialized[key] = value.map((item) => serializeDayjsInObject(item));
            } else {
                serialized[key] = serializeDayjsInObject(value);
            }
        } else {
            serialized[key] = value;
        }
    }

    return serialized as T;
}
