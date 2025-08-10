import {AbstractAPI} from "./AbstractAPI";
import {BlockedDateRequest, BlockedDateResponse} from "../models";

export class BlockedDatesAPI extends AbstractAPI<BlockedDateRequest, BlockedDateResponse> {
}

export const blockedDatesAPI = new BlockedDatesAPI('/blocked-dates');