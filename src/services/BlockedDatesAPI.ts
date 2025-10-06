import {AbstractAPI} from "./AbstractAPI";
import type {BlockedDateRequest, BlockedDateResponse} from "../models";

export class BlockedDatesAPI extends AbstractAPI<BlockedDateRequest, BlockedDateResponse> {
}

export const blockedDatesAPI = new BlockedDatesAPI('/blocked-dates');