"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
var AstType;
(function (AstType) {
    AstType[AstType["None"] = 0] = "None";
    AstType[AstType["Unknown"] = 1] = "Unknown";
    AstType[AstType["VariableId"] = 2] = "VariableId";
    AstType[AstType["FunctionId"] = 3] = "FunctionId";
    AstType[AstType["StructId"] = 4] = "StructId";
    AstType[AstType["Type"] = 5] = "Type";
    AstType[AstType["Const"] = 6] = "Const";
    AstType[AstType["Export"] = 7] = "Export";
    AstType[AstType["Map"] = 8] = "Map";
    AstType[AstType["Literal"] = 9] = "Literal";
    AstType[AstType["UnaryOp"] = 10] = "UnaryOp";
    AstType[AstType["BinaryOp"] = 11] = "BinaryOp";
    AstType[AstType["VariableDef"] = 12] = "VariableDef";
    AstType[AstType["FunctionDef"] = 13] = "FunctionDef";
    AstType[AstType["StructDef"] = 14] = "StructDef";
    AstType[AstType["Fields"] = 15] = "Fields";
    AstType[AstType["Parameters"] = 16] = "Parameters";
    AstType[AstType["FunctionCall"] = 17] = "FunctionCall";
    AstType[AstType["Arguments"] = 18] = "Arguments";
    AstType[AstType["Assignment"] = 19] = "Assignment";
    AstType[AstType["Global"] = 20] = "Global";
    AstType[AstType["Access"] = 21] = "Access";
    AstType[AstType["If"] = 22] = "If";
    AstType[AstType["Else"] = 23] = "Else";
    AstType[AstType["ElseIf"] = 24] = "ElseIf";
    AstType[AstType["While"] = 25] = "While";
    AstType[AstType["Break"] = 26] = "Break";
    AstType[AstType["Continue"] = 27] = "Continue";
    AstType[AstType["Return"] = 28] = "Return";
    AstType[AstType["ReturnVoid"] = 29] = "ReturnVoid";
    AstType[AstType["Comment"] = 30] = "Comment";
    AstType[AstType["Block"] = 31] = "Block";
    AstType[AstType["Program"] = 32] = "Program";
})(AstType = exports.AstType || (exports.AstType = {}));
class AstNode {
    constructor(type, token, children) {
        this.type = type;
        this.token = token;
        this.children = children;
        this.parent = null;
        this.valid = null;
        this.scope = null;
        this.dataType = null;
        this.generated = null;
        for (let child of children)
            child.parent = this;
    }
    toString(depth) {
        if (!depth)
            depth = 0;
        let out = "\t".repeat(depth);
        out += AstType[this.type] + " (" + token_1.TokenType[this.token.type];
        if (this.token.value)
            out += " " + JSON.stringify(this.token.value);
        out += ")";
        if (this.dataType)
            out += ": " + this.dataType;
        out += "\n";
        for (let child of this.children)
            out += child.toString(depth + 1);
        return out;
    }
}
exports.AstNode = AstNode;
