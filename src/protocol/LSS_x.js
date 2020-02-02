/** CANopen LSS protocol handler with custom extensions.
 * @param {RawChannel} channel - socketcan RawChannel object.
 */

class LSS_x {

	constructor(channel) {
		this.channel = channel;
	}

	// LSS Go into CONFIG MODE
	setConfigModeX(serialNoBytes) {
		let buf = Buffer.alloc(8);
		buf[0] = 0x04;
		buf[1] = 0x01;
		buf[2] = 0x00;
		buf[3] = 0x00;
		buf[4] = serialNoBytes[0]; // 0xBA;
		buf[5] = serialNoBytes[1]; // 0xAB;
		buf[6] = serialNoBytes[2]; // 0x51;
		buf[7] = serialNoBytes[3]; // 0x15;

		let message = {
			id: 0x000007E5,
			length: 8,
			data: buf,
			ext: false,
			rtr: false
		};

		this.channel.send(message);
	}

	// LSS Go into Set Node ID mode
	setNodeIdX(serialNoBytes, nodeId) {
		let buf = Buffer.alloc(8);
		buf[0] = 0x11;
		buf[1] = nodeId; // 0x07;
		buf[2] = 0x00;
		buf[3] = 0x00;
		buf[4] = serialNoBytes[0]; // 0xBA;
		buf[5] = serialNoBytes[1]; // 0xAB;
		buf[6] = serialNoBytes[2]; // 0x51;
		buf[7] = serialNoBytes[3]; // 0x15;

		let message = {
			id: 0x000007E5,
			length: 8,
			data: buf,
			ext: false,
			rtr: false
		};

		this.channel.send(message);

	}

	// LSS Go back to waiting state and set Node ID, NMT state initialization
	setWaitingModeX(serialNoBytes) {
		let buf = Buffer.alloc(8);
		buf[0] = 0x04;
		buf[1] = 0x00;
		buf[2] = 0x00;
		buf[3] = 0x00;
		buf[4] = serialNoBytes[0]; // 0xBA;
		buf[5] = serialNoBytes[1]; // 0xAB;
		buf[6] = serialNoBytes[2]; // 0x51;
		buf[7] = serialNoBytes[3]; // 0x15;

		const message = {
			id: 0x000007E5,
			length: 8,
			data: buf,
			ext: false,
			rtr: false
		};

		this.channel.send(message);
	}

	// sendSwitchStateSelective(vendorId, productCode, revisionNumber, serialNumber) {
	//
	//   const self = this;
	//
	//   async function send(cs, bytesId) {
	//     let buf = Buffer.alloc(8);
	//     buf[0] = cs;
	//     buf[1] = bytesId[0];
	//     buf[2] = bytesId[1];
	//     buf[3] = bytesId[2];
	//     buf[4] = bytesId[3];
	//     buf[5] = 0x00;
	//     buf[6] = 0x00;
	//     buf[7] = 0x00;
	//
	//     let message = {
	//       id: 0x000007E5,
	//       length: 8,
	//       data: buf,
	//       ext: false,
	//       rtr: false
	//     };
	//
	//     self.channel.send(message);
	//     await common.sleep(30000);
	//   }
	//
	//   // LSS Msg1 VendorId
	//   const vendorIdBytes = Buffer.alloc(4);
	//   common.SerialNoToBytes(vendorIdBytes, vendorId);
	//   send(0x40, vendorIdBytes);
	//
	//   // LSS Msg2 ProductCode
	//   const productCodeBytes = Buffer.alloc(4);
	//   common.SerialNoToBytes(productCodeBytes, productCode);
	//   send(0x41, productCodeBytes);
	//
	//   // LSS Msg3 RevisionNumber
	//   const revisionNumberBytes = Buffer.alloc(4);
	//   common.SerialNoToBytes(revisionNumberBytes, revisionNumber);
	//   send(0x42, revisionNumberBytes);
	//
	//   // LSS Msg4 SerialNumber
	//   const serialNumberBytes = Buffer.alloc(4);
	//   common.SerialNoToBytes(serialNumberBytes, serialNumber);
	//   send(0x43, serialNumberBytes);
	//
	// }
}

module.exports.LSS_x = LSS_x;