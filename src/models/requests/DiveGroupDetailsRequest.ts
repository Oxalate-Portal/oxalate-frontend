/**
 * Name and description of a dive group as edited by its members. Ownership and group type are not part of this
 * request; those are changed through DiveGroupUpdateRequest by the owner or the event organizer.
 */
export interface DiveGroupDetailsRequest {
    name: string;
    description?: string | null;
}
