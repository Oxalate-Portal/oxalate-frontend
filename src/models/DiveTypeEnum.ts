export const DiveTypeEnum = {
    BOAT: "boat",
    CAVE: "cave",
    CURRENT: "current",
    OPEN_AND_CAVE: "open-and-cave",
    OPEN_WATER: "open-water",
    SURFACE: "surface"
} as const;

export type DiveTypeEnum = typeof DiveTypeEnum[keyof typeof DiveTypeEnum];

