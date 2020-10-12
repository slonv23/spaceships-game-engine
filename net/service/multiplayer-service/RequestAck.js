export default class RequestAck {

    requestId;
    issuedAtTimestamp;
    markUnacknowledgedAtTimestamp;

    constructor(requestId, issuedAtTimestamp, markUnacknowledgedAtTimestamp) {
        this.requestId = requestId;
        this.issuedAtTimestamp = issuedAtTimestamp;
        this.markUnacknowledgedAtTimestamp = markUnacknowledgedAtTimestamp;
    }

}
