/// <reference types="long" />
export declare class Writer {
    private buf;
    write(wr: Writable): void;
    uint8(value: number): void;
    uint16(value: number): void;
    uint32(value: number): void;
    varuintN(value: number, bits: number): void;
    varuintLong(value: Long): void;
    varintN(value: number, bits: number): void;
    varintLong(value: Long): void;
    utf8(value: string): void;
    bytes(values: ArrayLike<number>): void;
    toTypedArray(): Uint8Array;
    toArrayBuffer(): ArrayBuffer;
}
export declare class Reader {
    private buf;
    private i;
    constructor(buffer: ArrayLike<number>);
    read(rd: Readable): void;
    uint8(): number;
    uint16(): number;
    uint32(): number;
    varuintN(): number;
    varintN(): number;
    bytes(len: number): any[];
}
export interface Readable {
    read(r: Reader): void;
}
export interface Writable {
    write(w: Writer): void;
}
