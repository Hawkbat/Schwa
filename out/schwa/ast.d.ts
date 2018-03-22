import { Token } from "./token";
import { Scope } from "./scope";
export declare enum AstType {
    None = "none",
    Unknown = "unknown",
    VariableId = "variable identifier",
    FunctionId = "function identifier",
    StructId = "struct identifier",
    Type = "type",
    Const = "const",
    Export = "export",
    Map = "map",
    Literal = "literal value",
    UnaryOp = "unary operator",
    BinaryOp = "binary operator",
    VariableDef = "variable definition",
    FunctionDef = "function definition",
    StructDef = "struct definition",
    Fields = "fields",
    Parameters = "parameters",
    FunctionCall = "function call",
    Arguments = "arguments",
    Assignment = "assignment",
    Global = "global variable",
    Access = "property access",
    Indexer = "array indexer",
    If = "if",
    Else = "else",
    ElseIf = "else if",
    While = "while",
    Break = "break",
    Continue = "continue",
    Return = "return",
    ReturnVoid = "return void",
    Comment = "comment",
    Block = "scope body",
    Program = "program",
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
