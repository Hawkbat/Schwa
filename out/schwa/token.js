"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TokenType;
(function (TokenType) {
    TokenType["None"] = "";
    TokenType["Unknown"] = "";
    TokenType["Name"] = "identifier";
    TokenType["Type"] = "type";
    TokenType["Const"] = "const";
    TokenType["Export"] = "export";
    TokenType["Struct"] = "struct";
    TokenType["Map"] = "map";
    TokenType["At"] = "at";
    TokenType["Int"] = "int literal";
    TokenType["UInt"] = "uint literal";
    TokenType["Long"] = "long literal";
    TokenType["ULong"] = "ulong literal";
    TokenType["Float"] = "float literal";
    TokenType["Double"] = "double literal";
    TokenType["Bool"] = "bool literal";
    TokenType["Add"] = "+";
    TokenType["Sub"] = "-";
    TokenType["Mul"] = "*";
    TokenType["Div"] = "/";
    TokenType["Mod"] = "%";
    TokenType["Neg"] = "-";
    TokenType["AND"] = "&";
    TokenType["OR"] = "|";
    TokenType["XOR"] = "^";
    TokenType["NOT"] = "~";
    TokenType["ShL"] = "<<";
    TokenType["ShR"] = ">>";
    TokenType["RotL"] = "<|";
    TokenType["RotR"] = "|>";
    TokenType["Eq"] = "==";
    TokenType["Ne"] = "!=";
    TokenType["Lt"] = "<";
    TokenType["Le"] = "<=";
    TokenType["Gt"] = ">";
    TokenType["Ge"] = ">=";
    TokenType["And"] = "&&";
    TokenType["Or"] = "||";
    TokenType["Not"] = "!";
    TokenType["As"] = "as";
    TokenType["To"] = "to";
    TokenType["Assign"] = "=";
    TokenType["If"] = "if";
    TokenType["Else"] = "else";
    TokenType["ElseIf"] = "else if";
    TokenType["While"] = "while";
    TokenType["Break"] = "break";
    TokenType["Continue"] = "continue";
    TokenType["Return"] = "return";
    TokenType["Comment"] = "//";
    TokenType["InlineComment"] = "//";
    TokenType["LParen"] = "(";
    TokenType["RParen"] = ")";
    TokenType["Comma"] = ",";
    TokenType["Period"] = ".";
    TokenType["Indent"] = "indent";
    TokenType["Dedent"] = "dedent";
    TokenType["BOL"] = "SOL";
    TokenType["EOL"] = "EOL";
    TokenType["BOF"] = "BOF";
    TokenType["EOF"] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
class Token {
    constructor(type, value, row, column) {
        this.type = type;
        this.value = value;
        this.row = row;
        this.column = column;
    }
    toString() {
        return "(" + (this.type != this.value ? this.type : '') + ((this.value) ? ":" + this.value + ")" : ")") + ":" + this.row + ":" + this.column;
    }
}
exports.Token = Token;
