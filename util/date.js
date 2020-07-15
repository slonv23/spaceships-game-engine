export function unixTimestamp() {
    return Math.round((new Date()).getTime() / 1000);
}
