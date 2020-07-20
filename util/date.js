export function unixTimestampMs() {
    return Date.now(); // milliseconds
    // return Math.round((new Date()).getTime() / 1000); // seconds
}
