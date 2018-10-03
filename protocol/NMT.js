const NMT_ENTER_OPERATIONAL = 1;
const NMT_ENTER_STOPPED = 2;
const NMT_ENTER_PRE_OPERATIONAL = 128;
const NMT_RESET_NODE = 129;
const NMT_RESET_COMMUNICATION = 130;

class NMT
{
    constructor(device)
    {
        this.device = device;
        this.message = {
            id: 0x0,
            ext: false,
            rtr: false,
            data: Buffer.from([0, device.deviceId])
        }
    }

    _send(command)
    {
        this.message['data'][0] = command;
        this.device.channel.send(this.message)
    }

    PreOperational()
    {
        this._send(NMT_ENTER_PRE_OPERATIONAL);
    }

    Operational()
    {
        this._send(NMT_ENTER_OPERATIONAL);
    }

    Stopped()
    {
        this._send(NMT_ENTER_STOPPED);
    }

    ResetDevice()
    {
        this._send(NMT_RESET_NODE);
    }

    ResetCommunication()
    {
        this._send(NMT_RESET_COMMUNICATION);
    }
};

module.exports=exports=NMT;