import dayjs, {Dayjs} from "dayjs";

// Copied from https://bobbyhadz.com/blog/javascript-format-date-yyyy-mm-dd-hh-mm-ss
function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

function padTo3Digits(num: number) {
    return num.toString().padStart(3, '0');
}

function formatDateTime(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate())
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes())
        ].join(':')
    );
}

function formatDateTimeWithMs(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        formatDateTime(date) + ':' +
        [
            padTo2Digits(date.getSeconds()),
            padTo3Digits(date.getMilliseconds())
        ].join(':')
    );
}

function localToUTCDate(date: Dayjs, timeZone: string): Dayjs {
    const year = date.year();
    const month = String(date.month() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.date()).padStart(2, "0");
    // Step 2: Create a timezone-less datetime string
    const timezoneLessDatetime: string = `${year}-${month}-${day}`;
    // Step 3: Use dayjs.tz() to interpret it in the desired timezone
    return dayjs.tz(timezoneLessDatetime, timeZone);
}

function localToUTCDatetime(date: Dayjs, timeZone: string): Dayjs {
    // Step 1: Deconstruct the date object into components
    const year = date.year();
    const month = String(date.month() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.date()).padStart(2, "0");
    const hours = String(date.hour()).padStart(2, "0");
    const minutes = String(date.minute()).padStart(2, "0");

    // Step 2: Create a timezone-less datetime string
    const timezoneLessDatetime: string = `${year}-${month}-${day}T${hours}:${minutes}`;
    // Step 3: Use dayjs.tz() to interpret it in the desired timezone
    return dayjs.tz(timezoneLessDatetime, timeZone);
}

export {
    formatDateTime,
    localToUTCDate,
    localToUTCDatetime,
    formatDateTimeWithMs
};