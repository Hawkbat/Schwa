"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("./ast");
function getIdentifier(n) {
    if (!n)
        return null;
    let l = n.children[0];
    if (l) {
        if (n.type == ast_1.AstType.VariableId)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.FunctionId)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.StructId)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.ModuleId)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.VariableImport)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.FunctionImport)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.StructImport)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.UnknownImport)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.Import)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.Map)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.VariableDef)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.FunctionDef)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.StructDef)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.FunctionCall)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.Assignment)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.Global)
            return getIdentifier(l);
        if (n.type == ast_1.AstType.Indexer)
            return getIdentifier(l);
    }
    let r = n.children[1];
    if (r) {
        if (n.type == ast_1.AstType.Access)
            return getIdentifier(r);
    }
    if (n.type == ast_1.AstType.FunctionId ||
        n.type == ast_1.AstType.VariableId ||
        n.type == ast_1.AstType.StructId ||
        n.type == ast_1.AstType.UnknownImport ||
        n.type == ast_1.AstType.Alias)
        return n;
    return null;
}
exports.getIdentifier = getIdentifier;
