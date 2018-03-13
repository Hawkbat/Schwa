"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TokenType;
(function (TokenType) {
    TokenType[TokenType["None"] = 0] = "None";
    TokenType[TokenType["Unknown"] = 1] = "Unknown";
    TokenType[TokenType["Name"] = 2] = "Name";
    TokenType[TokenType["Type"] = 3] = "Type";
    TokenType[TokenType["Const"] = 4] = "Const";
    TokenType[TokenType["Export"] = 5] = "Export";
    TokenType[TokenType["Struct"] = 6] = "Struct";
    TokenType[TokenType["Map"] = 7] = "Map";
    TokenType[TokenType["At"] = 8] = "At";
    TokenType[TokenType["Int"] = 9] = "Int";
    TokenType[TokenType["UInt"] = 10] = "UInt";
    TokenType[TokenType["Long"] = 11] = "Long";
    TokenType[TokenType["ULong"] = 12] = "ULong";
    TokenType[TokenType["Float"] = 13] = "Float";
    TokenType[TokenType["Double"] = 14] = "Double";
    TokenType[TokenType["Bool"] = 15] = "Bool";
    TokenType[TokenType["Add"] = 16] = "Add";
    TokenType[TokenType["Sub"] = 17] = "Sub";
    TokenType[TokenType["Mul"] = 18] = "Mul";
    TokenType[TokenType["Div"] = 19] = "Div";
    TokenType[TokenType["Mod"] = 20] = "Mod";
    TokenType[TokenType["Neg"] = 21] = "Neg";
    TokenType[TokenType["AND"] = 22] = "AND";
    TokenType[TokenType["OR"] = 23] = "OR";
    TokenType[TokenType["XOR"] = 24] = "XOR";
    TokenType[TokenType["NOT"] = 25] = "NOT";
    TokenType[TokenType["ShL"] = 26] = "ShL";
    TokenType[TokenType["ShR"] = 27] = "ShR";
    TokenType[TokenType["RotL"] = 28] = "RotL";
    TokenType[TokenType["RotR"] = 29] = "RotR";
    TokenType[TokenType["Eq"] = 30] = "Eq";
    TokenType[TokenType["Ne"] = 31] = "Ne";
    TokenType[TokenType["Lt"] = 32] = "Lt";
    TokenType[TokenType["Le"] = 33] = "Le";
    TokenType[TokenType["Gt"] = 34] = "Gt";
    TokenType[TokenType["Ge"] = 35] = "Ge";
    TokenType[TokenType["And"] = 36] = "And";
    TokenType[TokenType["Or"] = 37] = "Or";
    TokenType[TokenType["Not"] = 38] = "Not";
    TokenType[TokenType["As"] = 39] = "As";
    TokenType[TokenType["To"] = 40] = "To";
    TokenType[TokenType["Assign"] = 41] = "Assign";
    TokenType[TokenType["If"] = 42] = "If";
    TokenType[TokenType["Else"] = 43] = "Else";
    TokenType[TokenType["ElseIf"] = 44] = "ElseIf";
    TokenType[TokenType["While"] = 45] = "While";
    TokenType[TokenType["Break"] = 46] = "Break";
    TokenType[TokenType["Continue"] = 47] = "Continue";
    TokenType[TokenType["Return"] = 48] = "Return";
    TokenType[TokenType["Comment"] = 49] = "Comment";
    TokenType[TokenType["InlineComment"] = 50] = "InlineComment";
    TokenType[TokenType["LParen"] = 51] = "LParen";
    TokenType[TokenType["RParen"] = 52] = "RParen";
    TokenType[TokenType["Comma"] = 53] = "Comma";
    TokenType[TokenType["Period"] = 54] = "Period";
    TokenType[TokenType["Indent"] = 55] = "Indent";
    TokenType[TokenType["Dedent"] = 56] = "Dedent";
    TokenType[TokenType["BOL"] = 57] = "BOL";
    TokenType[TokenType["EOL"] = 58] = "EOL";
    TokenType[TokenType["BOF"] = 59] = "BOF";
    TokenType[TokenType["EOF"] = 60] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
class Token {
    constructor(type, value, row, column) {
        this.type = type;
        this.value = value;
        this.row = row;
        this.column = column;
    }
    toString() {
        return "(" + TokenType[this.type] + ((this.value) ? ":" + this.value + ")" : ")") + ":" + this.row + ":" + this.column;
    }
}
exports.Token = Token;
