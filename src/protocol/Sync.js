/** CANopen Sync producer.
 *
 * This class provides methods for generating the Sync signal.
 *
 * @param {RawChannel} channel - socketcan RawChannel object.
 * @see CiA301 "Synchronization object (SYNC)" (§7.2.5)
 */
class Sync {
    constructor(channel, syncId=0x80) {
        this.channel = channel;
        this.timer = null;
        this.syncId = syncId;
        this.syncCount = 0;
    }

    /** Serve a Sync object to the channel.
     * @private
     */
    _sendSync() {
        this.syncCount += 1;
        this.channel.send({
            id: this.syncId,
            ext: false,
            rtr: false,
            data: Buffer.from([this.syncCount]),
        });
    }

    /** Start serving Sync objects.
     *
     * @param {number} syncTime - milliseconds between Sync objects.
     */
    start(syncTime) {
        this.timer = setInterval(()=>{ this._sendSync(); }, syncTime);
    }

    /** Stop serving Sync objects. */
    stop() {
        clearInterval(this.timer);
    }
}

module.exports=exports=Sync;