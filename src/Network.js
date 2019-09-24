const EventEmitter = require('events');

const Device = require('./Device');
const EMCY = require('./protocol/EMCY');
const NMT = require('./protocol/NMT');
const Sync = require('./protocol/Sync');
const Time = require('./protocol/Time');

/** CANopen Network
 * @param {RawChannel} channel - socketcan RawChannel object.
 */
class Network extends EventEmitter {
    constructor(channel) {
        if(channel == undefined)
            throw ReferenceError("arg0 'channel' undefined");

        if(channel.send == undefined)
            throw ReferenceError("arg0 'channel' has no send method");

        if(channel.addListener == undefined)
            throw ReferenceError("arg0 'channel' has no addListener method");

        super();
        this.channel = channel;
        this.devices = [];

        this._NMT = new NMT(channel);
        this._Sync = new Sync(channel);
        this._Time = new Time(channel);

        channel.addListener("onMessage", this._onMessage, this);
    }

    get NMT() {
        return this._NMT;
    }

    get Sync() {
        return this._Sync;
    }

    get Time() {
        return this._Time;
    }

    addDevice(deviceId, edsPath=null, heartbeat=false) {
        this.devices[deviceId] = new Device(this.channel, deviceId, edsPath, heartbeat);
        return this.devices[deviceId];
    }

    removeDevice(deviceId) {
        this.devices[deviceId] = undefined;
    }

    getDevice(deviceId) {
        return this.devices[deviceId];
    }

    /** socketcan 'onMessage' listener.
     * @private
     * @param {Object} message - CAN frame.
     */
    _onMessage(message) {
        if(!message)
            return;
        
        if(message.id == 0x0) {
            const target = message.data[1];
            let state;

            switch(message.data[0]) {
                case this.NMT.commands.ENTER_OPERATIONAL:
                    state = this.NMT.states.OPERATIONAL;
                    break;
                case this.NMT.commands.ENTER_STOPPED:
                    state = this.NMT.states.STOPPED;
                    break;
                case this.NMT.commands.ENTER_PRE_OPERATIONAL:
                    state = this.NMT.states.PRE_OPERATIONAL;
                    break;
                case this.NMT.commands.RESET_NODE:
                case this.NMT.commands.RESET_COMMUNICATION:
                    state = this.NMT.states.INITIALIZING;
                    break;
            }

            if(target == 0) {
                for (const id in this.devices)
                    this.devices[id].state = state;
            }
            else {
                this.devices[target].state = state;
            }
        }
        else if((message.id & 0x7F0) == 0x80) {
            const deviceId = (message.id & 0x00F);
            this.emit('Emergency', deviceId, EMCY._process(message));
        }
    }
}

module.exports=exports=Network;
