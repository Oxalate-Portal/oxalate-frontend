export const RoleEnum = {
    ROLE_ADMIN: 'ROLE_ADMIN',
    ROLE_ORGANIZER: 'ROLE_ORGANIZER',
    ROLE_USER: 'ROLE_USER',
    ROLE_ANONYMOUS: 'ROLE_ANONYMOUS'
} as const;

export type RoleEnum = typeof RoleEnum[keyof typeof RoleEnum];
