import { Token } from "./token";
import { DataType } from "./datatype";
import { Scope } from "./scope";
export declare enum AstType {
    None = 0,
    Unknown = 1,
    VariableId = 2,
    FunctionId = 3,
    Type = 4,
    Const = 5,
    Export = 6,
    Literal = 7,
    UnaryOp = 8,
    BinaryOp = 9,
    VariableDef = 10,
    FunctionDef = 11,
    Parameters = 12,
    FunctionCall = 13,
    Arguments = 14,
    Assignment = 15,
    Global = 16,
    Access = 17,
    If = 18,
    Else = 19,
    ElseIf = 20,
    While = 21,
    Break = 22,
    Continue = 23,
    Return = 24,
    ReturnVoid = 25,
    Comment = 26,
    Block = 27,
    Program = 28,
}
export declare class AstNode {
    type: AstType;
    token: Token;
    children: AstNode[];
    parent: AstNode | null;
    valid: boolean | null;
    scope: Scope | null;
    dataType: DataType | null;
    generated: boolean | null;
    constructor(type: AstType, token: Token, children: AstNode[]);
    toString(depth?: number): string;
}
