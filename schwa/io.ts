import * as LEB from "leb"

export class Writer {
	private buf: number[] = []

	write(wr: Writable) {
		wr.write(this)
	}

	uint8(value: number) {
		this.buf.push(value)
	}

	uint16(value: number) {
		this.buf.push(value % 256)
		value = ~~(value / 256)
		this.buf.push(value % 256)
	}

	uint32(value: number) {
		this.buf.push(value % 256)
		value = ~~(value / 256)
		this.buf.push(value % 256)
		value = ~~(value / 256)
		this.buf.push(value % 256)
		value = ~~(value / 256)
		this.buf.push(value % 256)
	}

	varuintN(value: number, bits: number) {
		var leb = LEB.encodeUInt32(value % Math.pow(2, bits))
		for (var i = 0; i < leb.byteLength; i++) this.buf.push(leb.readUInt8(i))
	}

	varuintLong(value: Long) {
		var numBuf = new Buffer([value.getLowBitsUnsigned(), value.getHighBitsUnsigned()])
		var leb = LEB.encodeUIntBuffer(numBuf)
		for (var i = 0; i < leb.byteLength; i++) this.buf.push(leb.readUInt8(i))
	}

	varintN(value: number, bits: number) {
		value = Math.min(Math.pow(2, bits - 1) - 1, Math.max(-Math.pow(2, bits - 1), value))
		var leb = LEB.encodeInt32(value)
		for (var i = 0; i < leb.byteLength; i++) this.buf.push(leb.readUInt8(i))
	}

	varintLong(value: Long) {
		var numBuf = new Buffer([value.getLowBitsUnsigned(), value.getHighBitsUnsigned()])
		var leb = LEB.encodeIntBuffer(numBuf)
		for (var i = 0; i < leb.byteLength; i++) this.buf.push(leb.readUInt8(i))
	}

	utf8(value: string) {
		var strBuf = Buffer.from(value)
		this.varuintN(strBuf.byteLength, 32)
		this.bytes(strBuf)
	}

	bytes(values: ArrayLike<number>) {
		for (var i = 0; i < values.length; i++) this.buf.push(values[i] % 256)
	}

	toTypedArray(): Uint8Array {
		var buffer = new ArrayBuffer(this.buf.length)
		var view = new Uint8Array(buffer)
		view.set(this.buf, 0)
		return view
	}

	toArrayBuffer(): ArrayBuffer {
		return this.toTypedArray().buffer
	}
}

export class Reader {
	private buf: number[] = []
	private i: number = 0

	constructor(buffer: ArrayLike<number>) {
		for (var i = 0; i < buffer.length; i++) this.buf[i] = buffer[i]
	}

	read(rd: Readable) {
		rd.read(this)
	}

	uint8() {
		return this.buf[this.i++]
	}

	uint16() {
		return this.buf[this.i++] + this.buf[this.i++] * 256
	}

	uint32() {
		return this.buf[this.i++] + this.buf[this.i++] * 256 + this.buf[this.i++] * 256 * 256 + this.buf[this.i++] * 256 * 256 * 256
	}

	varuintN() {
		var res = LEB.decodeUInt64(new Buffer(this.buf), this.i)
		this.i = res.nextIndex
		return res.value
	}

	varintN() {
		var res = LEB.decodeInt64(new Buffer(this.buf), this.i)
		this.i = res.nextIndex
		return res.value
	}

	bytes(len: number) {
		var res = []
		for (var i = 0; i < len; i++) {
			res.push(this.buf[this.i + i])
		}
		this.i += len
		return res
	}
}

export interface Readable {
	read(r: Reader): void
}

export interface Writable {
	write(w: Writer): void
}