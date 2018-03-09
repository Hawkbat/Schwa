import { Token } from "./token";
import { Scope } from "./scope";
export declare enum AstType {
    None = 0,
    Unknown = 1,
    VariableId = 2,
    FunctionId = 3,
    StructId = 4,
    Type = 5,
    Const = 6,
    Export = 7,
    Map = 8,
    Literal = 9,
    UnaryOp = 10,
    BinaryOp = 11,
    VariableDef = 12,
    FunctionDef = 13,
    StructDef = 14,
    Fields = 15,
    Parameters = 16,
    FunctionCall = 17,
    Arguments = 18,
    Assignment = 19,
    Global = 20,
    Access = 21,
    If = 22,
    Else = 23,
    ElseIf = 24,
    While = 25,
    Break = 26,
    Continue = 27,
    Return = 28,
    ReturnVoid = 29,
    Comment = 30,
    Block = 31,
    Program = 32,
}
export declare class AstNode {
    type: AstType;
    token: Token;
    children: AstNode[];
    parent: AstNode | null;
    valid: boolean | null;
    scope: Scope | null;
    dataType: string | null;
    generated: boolean | null;
    constructor(type: AstType, token: Token, children: AstNode[]);
    toString(depth?: number): string;
}
