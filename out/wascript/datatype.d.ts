import { TokenType } from "./token";
export declare enum DataType {
    None = "void",
    Invalid = "invalid",
    Type = "type",
    Int = "int",
    UInt = "uint",
    Long = "long",
    ULong = "ulong",
    Float = "float",
    Double = "double",
    Bool = "bool",
}
export declare namespace DataType {
    function fromTokenType(type: TokenType): DataType;
    function isPrimitive(type: string): boolean;
}
