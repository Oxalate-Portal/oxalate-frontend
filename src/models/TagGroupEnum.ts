export const TagGroupEnum = {
    USER: 'USER',
    EVENT: 'EVENT'
} as const;

export type TagGroupEnum = typeof TagGroupEnum[keyof typeof TagGroupEnum];