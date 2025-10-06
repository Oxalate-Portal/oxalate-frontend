import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export {
    diveEventStatusEnum2Tag,
    diveTypeEnum2Tag,
    membershipStatusEnum2Tag,
    membershipTypeEnum2Tag,
    pageStatusEnum2Tag,
    paymentTypeEnum2Tag,
    reportStatusEnum2Tag,
    roleEnum2Tag,
    userTypeEnum2Tag
} from "./Enum2TagTool";
export {LanguageUtil} from "./LanguageUtil";
export {
    formatDateTime,
    formatDateTimeWithMs,
    checkRoles,
    getPageGroupTitleByLanguage,
    getPageTitleByLanguage,
    getHighestRole,
    isAllowedToEditPage,
    localToUTCDate,
    localToUTCDatetime
} from "./tools";
