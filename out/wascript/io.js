"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LEB = require("leb");
class Writer {
    constructor() {
        this.buf = [];
    }
    write(wr) {
        wr.write(this);
    }
    uint8(value) {
        this.buf.push(value);
    }
    uint16(value) {
        this.buf.push(value % 256);
        value = ~~(value / 256);
        this.buf.push(value % 256);
    }
    uint32(value) {
        this.buf.push(value % 256);
        value = ~~(value / 256);
        this.buf.push(value % 256);
        value = ~~(value / 256);
        this.buf.push(value % 256);
        value = ~~(value / 256);
        this.buf.push(value % 256);
    }
    varuintN(value, bits) {
        var leb = LEB.encodeUInt32(value % Math.pow(2, bits));
        for (var i = 0; i < leb.byteLength; i++)
            this.buf.push(leb.readUInt8(i));
    }
    varuintLong(value) {
        var numBuf = new Buffer([value.getLowBitsUnsigned(), value.getHighBitsUnsigned()]);
        var leb = LEB.encodeUIntBuffer(numBuf);
        for (var i = 0; i < leb.byteLength; i++)
            this.buf.push(leb.readUInt8(i));
    }
    varintN(value, bits) {
        value = Math.min(Math.pow(2, bits - 1) - 1, Math.max(-Math.pow(2, bits - 1), value));
        var leb = LEB.encodeInt32(value);
        for (var i = 0; i < leb.byteLength; i++)
            this.buf.push(leb.readUInt8(i));
    }
    varintLong(value) {
        var numBuf = new Buffer([value.getLowBitsUnsigned(), value.getHighBitsUnsigned()]);
        var leb = LEB.encodeIntBuffer(numBuf);
        for (var i = 0; i < leb.byteLength; i++)
            this.buf.push(leb.readUInt8(i));
    }
    utf8(value) {
        var strBuf = Buffer.from(value);
        this.varuintN(strBuf.byteLength, 32);
        this.bytes(strBuf);
    }
    bytes(values) {
        for (var i = 0; i < values.length; i++)
            this.buf.push(values[i] % 256);
    }
    toTypedArray() {
        var buffer = new ArrayBuffer(this.buf.length);
        var view = new Uint8Array(buffer);
        view.set(this.buf, 0);
        return view;
    }
    toArrayBuffer() {
        return this.toTypedArray().buffer;
    }
}
exports.Writer = Writer;
class Reader {
    constructor(buffer) {
        this.buf = [];
        this.i = 0;
        for (var i = 0; i < buffer.length; i++)
            this.buf[i] = buffer[i];
    }
    read(rd) {
        rd.read(this);
    }
    uint8() {
        return this.buf[this.i++];
    }
    uint16() {
        return this.buf[this.i++] + this.buf[this.i++] * 256;
    }
    uint32() {
        return this.buf[this.i++] + this.buf[this.i++] * 256 + this.buf[this.i++] * 256 * 256 + this.buf[this.i++] * 256 * 256 * 256;
    }
    varuintN() {
        var res = LEB.decodeUInt64(new Buffer(this.buf), this.i);
        this.i = res.nextIndex;
        return res.value;
    }
    varintN() {
        var res = LEB.decodeInt64(new Buffer(this.buf), this.i);
        this.i = res.nextIndex;
        return res.value;
    }
    bytes(len) {
        var res = [];
        for (var i = 0; i < len; i++) {
            res.push(this.buf[this.i + i]);
        }
        this.i += len;
        return res;
    }
}
exports.Reader = Reader;
