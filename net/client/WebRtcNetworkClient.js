/**
 * @typedef {import('../../logging/AbstractLogger').default} AbstractLogger
 */
import AbstractNetworkClient from "./AbstractNetworkClient";

export default class WebRtcNetworkClient extends AbstractNetworkClient {

    /** @type {RTCPeerConnection} */
    peerConnection;

    /** @type {RTCDataChannel} */
    dataChannel;

    /** @type {AbstractLogger} */
    logger;

    constructor(logger) {
        super();
        this.logger = logger;
    }

    async postConstruct({serverIp, signalingServerPort}) {
        this.serverIp = serverIp;
        this.signalingServerPort = signalingServerPort;
    }

    async connect() {
        try {
            await new Promise((resolve, reject) => {
                this._createPeerConnection();
                this._setupDataChannel(resolve);

                (async () => {
                    try {
                        const offer = await this._createOffer();
                        const candidates = await this._gatherIceCandidates();
                        await this._negotiateConnection(offer, candidates);
                    } catch (err) {
                        reject(err);
                    }
                })();
            });
        } catch (err) {
            this.logger.error("WebRtcNetworkClient: Failed to connect using WebRTC datachannel, error: " + err.message);
        }
    }

    /**
     * @param {Uint8Array} uint8Array
     */
    sendMessage(uint8Array) {
        const arrayBuffer = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteLength + uint8Array.byteOffset);
        this.dataChannel.send(arrayBuffer);
    }

    _createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            /*iceServers: [{
                urls: [
                    "stun:stun.l.google.com:19302"
                ]
            }]*/
        });

        window.addEventListener("beforeunload", () => {
            this.peerConnection.close();
        }, false);
    }

    _setupDataChannel(onOpenCallback) {
        this.dataChannel = this.peerConnection.createDataChannel('main-channel');
        this.dataChannel.binaryType = "arraybuffer";

        this.dataChannel.onopen = event => {
            this.logger.debug('DataChannel is ready');
            onOpenCallback();
        };

        this.dataChannel.onclose = event => {
            this.logger.debug('DataChannel is closed');
        };

        this.dataChannel.onerror = event => {
            this.logger.warn('DataChannel error: ' + event.message);
        };

        this.dataChannel.onmessage = event => {
            //this.logger.debug('DataChannel received message(s)');
            this.dispatchEvent("messages", new Uint8Array(event.data));
        };
    }

    _createOffer() {
        return this.peerConnection.createOffer().then(async (offer) => {
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        });
    }

    _gatherIceCandidates() {
        const candidates = [];

        return new Promise((resolve) => {
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    candidates.push(event.candidate);
                } else {
                    this.logger.debug("All local candidates received");
                    resolve(candidates);
                }
            };
        });
    }

    /**
     * @param {RTCSessionDescriptionInit} offer
     * @param {RTCIceCandidate[]} candidates
     */
    async _negotiateConnection(offer, candidates) {
        const {answer, candidates: serverCandidates} = await this._requestAnswerAndCandidates(offer, candidates);
        const sessionDescription = new RTCSessionDescription({type: "answer", "sdp": answer});
        await this.peerConnection.setRemoteDescription(sessionDescription);
        for (let candidate of serverCandidates) {
            // eslint-disable-next-line no-undef
            if (__DEV__) {
                candidate = candidate.replace(/\s(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s/, ' 127.0.0.1 ');
            }
            const rtcIceCandidate = new RTCIceCandidate({candidate,  sdpMLineIndex: 0});
            await this.peerConnection.addIceCandidate(rtcIceCandidate);
        }
    }

    _requestAnswerAndCandidates(offer, candidates) {
        const params = new URLSearchParams();
        params.append("offer", offer.sdp);
        candidates.forEach(candidate => {
            params.append("candidates", candidate.candidate);
        });

        return this._fetchWithRetry(`http://${this.serverIp}:${this.signalingServerPort}/connect`, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: params
            }).then((res) => {
                return res.text()
            }).then((paramsEncoded) => {
                const params = new URLSearchParams(paramsEncoded);

                return {
                    answer: params.get('answer'),
                    candidates: params.getAll('candidates')
                }
            }).catch(err => {
                this.logger.error("WebRtcNetworkClient: Failed to retrieve sdp answer and" +
                                  " ice candidates from signaling server, error: " + err.message)
                throw err;
            });
    }

    _fetchWithRetry() {
        return fetch(...arguments).then((res) => {
            if (res.status === 503) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this._fetchWithRetry(...arguments).then(resolve, reject);
                    }, 1000);
                });
            }

            return res;
        });
    }

}
