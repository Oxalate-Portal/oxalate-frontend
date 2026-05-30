/**
 * Global timezone context for date transformations.
 * This is set during app initialization from the session context.
 */
let currentTimezone: string = "UTC";

export function setGlobalTimezone(timezone: string): void {
    currentTimezone = timezone;
}

export function getGlobalTimezone(): string {
    return currentTimezone;
}
