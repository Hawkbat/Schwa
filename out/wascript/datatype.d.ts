import { TokenType } from "./token";
export declare enum DataType {
    None = 0,
    Invalid = 1,
    Type = 2,
    Int = 3,
    UInt = 4,
    Long = 5,
    ULong = 6,
    Float = 7,
    Double = 8,
    Bool = 9,
}
export declare namespace DataType {
    function fromTokenType(type: TokenType): DataType;
    function fromString(type: string): DataType;
}
