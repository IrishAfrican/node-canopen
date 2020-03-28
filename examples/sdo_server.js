/** SDO server example.
 *
 * This example shows how to create a CANopen device that serves values from its
 * Object Dictionary using the SDO protocol.
 */

const {EDS, Device} = require('../index.js');
const can = require('socketcan');

/** Step 1: Create a new socketcan RawChannel object. */
const channel = can.createRawChannel('vcan0');

/** Step 2: Create a new Device. */
node = new Device({ id: 0xD, channel: channel });

/** Step 3: Configure the SDO server parameters. */
node.EDS.addEntry(0x1200, {
    ParameterName:      'SDO server parameter',
    ObjectType:         EDS.objectTypes.RECORD,
    SubNumber:          2,
});
node.EDS.addSubEntry(0x1200, 1, {
    ParameterName:      'COB-ID client to server',
    DataType:           EDS.dataTypes.UNSIGNED32,
    AccessType:         EDS.accessTypes.READ_WRITE,
    DefaultValue:       0x600,
});
node.EDS.addSubEntry(0x1200, 2, {
    ParameterName:      'COB-ID server to client',
    DataType:           EDS.dataTypes.UNSIGNED32,
    AccessType:         EDS.accessTypes.READ_WRITE,
    DefaultValue:       0x580,
});

/** Step 4: Create an additional entry to be accessed by the SDO client. */
node.EDS.addEntry(0x2000, {
    ParameterName:      'Test object',
    ObjectType:         EDS.objectTypes.VAR,
    DataType:           EDS.dataTypes.VISIBLE_STRING,
    AccessType:         EDS.accessTypes.READ_WRITE,
});

/** Step 5: Register a callback to print changes to 0x2000. */
const obj2000 = node.getEntry(0x2000);
obj2000.addListener('update', (data) => { console.log(data.value); });

/** Step 6: Initialize the node. */
node.init();
channel.start();

console.log("Press Ctrl-C to quit");