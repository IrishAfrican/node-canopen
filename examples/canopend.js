/*jshint esversion: 6 */

const net = require('net');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const socketcan = require('socketcan');
const canopen = require('../index.js');

const dataTypes = {
    "b": 1,
    "i8": 2,
    "i16": 3,
    "i32": 4,
    "u8": 5,
    "u16": 6,
    "u32": 7,
    "r32": 8,
    "r64": 17,
    "vs": 9,
    "os": 10,
};

const optionDefinitions = [
    {
        name: 'network',
        alias: 'n',
        type: String,
        defaultOptions: true,
        defaultValue: 'can0',
        description: "Socketcan interface to use. Defaults to 'can0\'",
    },
    {
        name: 'identifier',
        alias: 'i',
        type: Number,
        defaultValue: 0x3,
        description: "Identifier used for heartbeat generation (1..127). Defaults to 0x3"
    },
    {
        name: 'socket',
        alias: 'c',
        type: String,
        defaultValue: '/tmp/CO_command_socket',
        description: "Unix command socket path. Defaults to '/tmp/CO_command_socket'",
    },
    {
        name: 'eds',
        alias: 'd',
        type: String,
        defaultValue: null,
        description: "CANopen electronic datasheet path."
    },
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: "Print this menu",
    }
];

const options = commandLineArgs(optionDefinitions);
if(options.help) {
    const usage = commandLineUsage([
        {
            header: 'Description',
            content: 'A CANopen network master.',
        },
        {
            header: 'Usage',
            content: `${process.argv[1]} -i 3 -c /tmp/CO_command_socket`,
        },
        {
            header: 'Options',
            optionList: optionDefinitions,
        }
    ]);
    console.log(usage);
    process.exit();
}

const channel = socketcan.createRawChannel(options.network);
channel.start();

const master = new canopen.Device(channel, options.identifier, options.eds, true);
if(options.eds) {
    console.log(`Loaded EDS file '${options.eds}'`);
    master.SDO.serverStart();
}
master.NMT.status = master.NMT.states.OPERATIONAL;

const network = {
    [options.identifier]: master,
};
const clients = [];
const pending = [];

const sequenceMatch = RegExp('^\[[0-9A-Fa-f]*\]');

function reportPDO(updated)
{
    for(const entry of Object.values(updated)) {
        let value;
        if(entry.data.length > 1) {
            value = [];
            for(let i = 1; i < entry.data.length; i++)
                value.push(entry.data[i].value);
        }
        else value = entry.data[0].value;

        const name = entry.name.replace(' ', '_');
        const report = `PDO: ${name}=${value}`;
        //console.log(report);
        clients.forEach( (c) => { c.write(report + '\n'); });
    }
}
master.on('PDO', reportPDO);

function reportEmergency(deviceId, [parsed, code, reg, bit, info])
{
    const report = `EM: ${deviceId} ${code} ${reg} ${bit} ${info}`;
    console.log(report);
    clients.forEach( (c) => { c.write(report + '\n'); });
}
master.on('Emergency', reportEmergency);

// Unlink path
if(fs.existsSync(options.socket)) {
    fs.unlinkSync(options.socket);
}

// Create unix socket server
const server = net.createServer((c) => {
    console.log("Client connected");
    clients.push(c);

    c.on('end', () => {
        console.log("Client disconnected");
        for(let i = 0; i < clients.length; i++) {
            if(clients[i] === c) {
                clients.splice(i, 1);
                break;
            }
        }
    });

    c.on('data', (data) => {
        /*
        - SDO upload:   [<sequence>] <node> read  <index> <subindex> <datatype> 
        - SDO download: [<sequence>] <node> write <index> <subindex> <datatype> <value>
        */

        args = data.toString().trim().split(' ');

        let i = 0;
        let sequence = 0;
        if(sequenceMatch.test(args[i])) {
            sequence = parseInt(args[i++].slice(1, -1));
        }
        else {
            while(pending.includes(sequence))
                sequence = Math.floor(Math.random()*0xFF);
        }

        const deviceId = parseInt(args[i++]);
        const command = args[i++];
        const index = parseInt(args[i++]);
        const subIndex = parseInt(args[i++]);

        if(network[deviceId] == undefined)
        {
            network[deviceId] = new canopen.Device(channel, deviceId);
            network[deviceId].on('Emergency', reportEmergency);
        }

        const device = network[deviceId];
        const dataType = dataTypes[args[i++]];
        const dataString = args[i] ? args[i] : '0';
        const value = device._parseTypedString(dataString, dataType);
        const raw = device.typeToRaw(value, dataType);
        const size = raw.length;

        const entry = {
            index: index,
            data: [],
        };
        entry.data[subIndex] = {
            value: value,
            type: dataType,
            raw: raw,
            size: size,
        };

        switch(command[0]) {
            case 'r':
            case 'read':
                device.SDO.upload(entry, subIndex)
                    .then(
                        ( ) => {
                            const result = `[${sequence}] OK ${entry.data[subIndex].value}`;
                            console.log(result);
                            c.write(result + '\n');
                        },
                        (e) => {
                            const result = `[${sequence}] ERROR: ${e.message}`;
                            console.log(result);
                            c.write(result + '\n');
                        });
                break;
            case 'w':
            case 'write':
                device.SDO.download(entry, subIndex)
                    .then(
                        ( ) => {
                            const result = `[${sequence}] OK`;
                            console.log(result);
                            c.write(result + '\n');
                        },
                        (e) => {
                            const result = `[${sequence}] ERROR: ${e.message}`;
                            console.log(result);
                            c.write(result + '\n');
                        });
                break;
        }
    });
});

server.on('error', (e) => {
    throw e;
});

server.listen(options.socket, () => {
    console.log('Ready');
});

function exitHandle() {
    fs.unlinkSync(options.socket);
    process.exit();
}

process.on('SIGINT', exitHandle);
process.on('SIGTERM', exitHandle);
