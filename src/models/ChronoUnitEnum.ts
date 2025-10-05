export const ChronoUnitEnum = {
    YEARS: "YEARS",
    MONTHS: "MONTHS",
    DAYS: "DAYS"
} as const;

export type ChronoUnitEnum = typeof ChronoUnitEnum[keyof typeof ChronoUnitEnum];
