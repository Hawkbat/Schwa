export declare enum TokenType {
    None = 0,
    Unknown = 1,
    Name = 2,
    Type = 3,
    Const = 4,
    Export = 5,
    Struct = 6,
    Map = 7,
    At = 8,
    Int = 9,
    UInt = 10,
    Long = 11,
    ULong = 12,
    Float = 13,
    Double = 14,
    Bool = 15,
    Add = 16,
    Sub = 17,
    Mul = 18,
    Div = 19,
    Mod = 20,
    Neg = 21,
    AND = 22,
    OR = 23,
    XOR = 24,
    NOT = 25,
    ShL = 26,
    ShR = 27,
    RotL = 28,
    RotR = 29,
    Eq = 30,
    Ne = 31,
    Lt = 32,
    Le = 33,
    Gt = 34,
    Ge = 35,
    And = 36,
    Or = 37,
    Not = 38,
    As = 39,
    To = 40,
    Assign = 41,
    If = 42,
    Else = 43,
    ElseIf = 44,
    While = 45,
    Break = 46,
    Continue = 47,
    Return = 48,
    Comment = 49,
    InlineComment = 50,
    LParen = 51,
    RParen = 52,
    Comma = 53,
    Period = 54,
    Indent = 55,
    Dedent = 56,
    BOL = 57,
    EOL = 58,
    BOF = 59,
    EOF = 60,
}
export declare class Token {
    type: TokenType;
    value: string;
    row: number;
    column: number;
    constructor(type: TokenType, value: string, row: number, column: number);
    toString(): string;
}