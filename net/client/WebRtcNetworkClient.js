import AbstractNetworkClient from "./AbstractNetworkClient";

export default class WebRtcNetworkClient extends AbstractNetworkClient {

    /** @type {RTCPeerConnection} */
    peerConnection;

    /** @type {RTCDataChannel} */
    dataChannel;

    async postConstruct({serverIp, signalingServerPort}) {
        this.serverIp = serverIp;
        this.signalingServerPort = signalingServerPort;
    }

    async connect() {
        try {
            this._createPeerConnection();
            this._setupDataChannel();

            const offer = await this._createOffer();
            const candidates = await this._gatherIceCandidates();
            await this._negotiateConnection(offer, candidates);
        } catch (e) {
            console.error("WebRtcNetworkClient: Failed to connect using WebRTC datachannel, error: " + e);
        }
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

    _setupDataChannel() {
        this.dataChannel = this.peerConnection.createDataChannel('main-channel');

        this.dataChannel.onopen = e => {
            console.debug('DataChannel ready: ' + e);
        };
  
        this.dataChannel.onclose = e => {
            console.debug('DataChannel closed' + e);
        };
  
        this.dataChannel.onerror = e => {
            console.error('DataChannel error: ' + e);
        };
  
        this.dataChannel.onmessage = e => {
            console.debug('DataChannel received message: ' + e.data);
        };
    }

    _createOffer() {
        return this.peerConnection.createOffer().then((offer) => {
            this.peerConnection.setLocalDescription(offer);
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
                    console.debug("All local candidates received");
                    resolve(candidates);
                }
            };
        });
    }

    /**
     * @param {RTCSessionDescription} offer 
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

        return fetch(`http://${this.serverIp}:${this.signalingServerPort}/connect`, {
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
                console.error("WebRtcNetworkClient: Failed to retrieve sdp answer and ice candidates from signaling server, error: " + err);
                throw err;
            });
    }

}