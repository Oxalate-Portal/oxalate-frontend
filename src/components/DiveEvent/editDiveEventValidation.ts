import dayjs from "dayjs";
import {PaymentTypeEnum} from "../../models/PaymentTypeEnum";
import type {ListUserResponse} from "../../models/responses/ListUserResponse";
import type {OptionItemVO} from "../../models/OptionItemVO";

export function isMaxParticipantsTooLow(selectedParticipantsCount: number, configuredMaxParticipants: number): boolean {
    return configuredMaxParticipants < selectedParticipantsCount;
}

export function exceedsMaxParticipants(selectedParticipantsCount: number, configuredMaxParticipants: number): boolean {
    return selectedParticipantsCount > configuredMaxParticipants;
}

function participantLabel(user: ListUserResponse): string {
    return `${user.name} (${user.id})`;
}

/**
 * Determines whether a user has a valid payment for a given event.
 * A payment is valid if:
 * - It is a PERIODICAL payment with an end date in the future, or
 * - It is a ONE_TIME payment that has not expired (or has no end date) AND either has
 *   remaining uses (paymentCount > 0) or is bound to the specific event.
 */
export function hasValidPaymentForEvent(user: ListUserResponse, eventId: number): boolean {
    for (const payment of user.payments) {
        if (payment.paymentType === PaymentTypeEnum.PERIODICAL
            && dayjs(payment.endDate).isAfter(dayjs())) {
            return true;
        }

        if (payment.paymentType === PaymentTypeEnum.ONE_TIME
            && (dayjs(payment.endDate).isAfter(dayjs()) || payment.endDate === null)
            && (payment.paymentCount > 0
                || (payment.boundEvents !== null && payment.boundEvents.includes(eventId)))) {
            return true;
        }
    }

    return false;
}

/**
 * Builds the list of selectable participant options for a dive event.
 *
 * Users from the full user list are included when they pass the configured
 * membership/payment requirements. Participants already enrolled in the event
 * (`currentParticipants`) are always included regardless of those requirements —
 * they must remain visible and selectable in the event editor.
 */
export function buildParticipantOptions(
    users: ListUserResponse[],
    eventId: number,
    requiresMembership: boolean,
    requiresActivePayment: boolean,
    currentParticipants: ListUserResponse[] = []
): OptionItemVO[] {
    const result: OptionItemVO[] = [];
    const includedIds = new Set<number>();

    // Always include participants who are already enrolled in this event.
    for (const participant of currentParticipants) {
        result.push({value: participant.id, label: participantLabel(participant)});
        includedIds.add(participant.id);
    }

    // Add additional eligible users from the full user list.
    for (const user of users) {
        if (includedIds.has(user.id)) {
            continue;
        }

        if (requiresMembership && !user.membershipActive) {
            continue;
        }

        if (requiresActivePayment && user.payments.length === 0) {
            continue;
        }

        if (!hasValidPaymentForEvent(user, eventId)) {
            continue;
        }

        result.push({value: user.id, label: participantLabel(user)});
        includedIds.add(user.id);
    }

    return result;
}

