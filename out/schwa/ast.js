"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AstType;
(function (AstType) {
    AstType["None"] = "none";
    AstType["Unknown"] = "unknown";
    AstType["VariableId"] = "variable identifier";
    AstType["FunctionId"] = "function identifier";
    AstType["StructId"] = "struct identifier";
    AstType["Type"] = "type";
    AstType["Const"] = "const";
    AstType["Export"] = "export";
    AstType["Map"] = "map";
    AstType["Literal"] = "literal value";
    AstType["UnaryOp"] = "unary operator";
    AstType["BinaryOp"] = "binary operator";
    AstType["VariableDef"] = "variable definition";
    AstType["FunctionDef"] = "function definition";
    AstType["StructDef"] = "struct definition";
    AstType["Fields"] = "fields";
    AstType["Parameters"] = "parameters";
    AstType["FunctionCall"] = "function call";
    AstType["Arguments"] = "arguments";
    AstType["Assignment"] = "assignment";
    AstType["Global"] = "global variable";
    AstType["Access"] = "property access";
    AstType["Indexer"] = "array indexer";
    AstType["If"] = "if";
    AstType["Else"] = "else";
    AstType["ElseIf"] = "else if";
    AstType["While"] = "while";
    AstType["Break"] = "break";
    AstType["Continue"] = "continue";
    AstType["Return"] = "return";
    AstType["ReturnVoid"] = "return void";
    AstType["Comment"] = "comment";
    AstType["Block"] = "scope body";
    AstType["Program"] = "program";
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
        out += this.type + " (";
        if (this.token.value != this.token.type)
            out += this.token.type;
        if (this.token.value && this.token.value != this.token.type)
            out += " ";
        if (this.token.value)
            out += JSON.stringify(this.token.value);
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
