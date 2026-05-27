export function isMaxParticipantsTooLow(selectedParticipantsCount: number, configuredMaxParticipants: number): boolean {
    return configuredMaxParticipants < selectedParticipantsCount;
}

export function exceedsMaxParticipants(selectedParticipantsCount: number, configuredMaxParticipants: number): boolean {
    return selectedParticipantsCount > configuredMaxParticipants;
}

