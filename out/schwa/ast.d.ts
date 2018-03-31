import { Token } from "./token";
import { Scope } from "./scope";
export declare enum AstType {
    None = "none",
    Unknown = "unknown",
    ModuleId = "module identifier",
    VariableId = "variable identifier",
    FunctionId = "function identifier",
    StructId = "struct identifier",
    ScopeId = "scope identifier",
    Alias = "alias",
    Type = "type",
    Const = "const",
    Export = "export",
    From = "from",
    Import = "import",
    Imports = "imports",
    VariableImport = "variable import",
    FunctionImport = "function import",
    StructImport = "struct import",
    UnknownImport = "unresolved import",
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
    children: (AstNode | undefined)[];
    parent: AstNode | null;
    valid: boolean | null;
    scope: Scope | null;
    dataType: string | null;
    generated: boolean | null;
    constructor(type: AstType, token: Token, children: (AstNode | undefined)[]);
    toString(depth?: number): string;
}
