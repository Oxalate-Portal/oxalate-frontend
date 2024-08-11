import {AbstractAPI} from "./AbstractAPI";
import {BlockedDateRequest} from "../models/requests";
import {BlockedDateResponse} from "../models/responses";

export class BlockedDatesAPI extends AbstractAPI<BlockedDateRequest, BlockedDateResponse> {
}

export const blockedDatesAPI = new BlockedDatesAPI('/blocked-dates');