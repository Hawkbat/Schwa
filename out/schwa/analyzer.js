"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./log");
const token_1 = require("./token");
const ast_1 = require("./ast");
const datatype_1 = require("./datatype");
const scope_1 = require("./scope");
const Long = require("long");
const MAX_TYPE_DEPTH = 16;
function formatOrdinal(n) {
    let str = n.toFixed();
    if (str != "11" && str.endsWith('1'))
        return str + "st";
    else if (str != "12" && str.endsWith('2'))
        return str + "nd";
    else if (str != "13" && str.endsWith('3'))
        return str + "rd";
    else
        return str + "th";
}
class Analyzer {
    constructor(logger) {
        this.logger = logger;
        this.scopeRuleMap = {};
        this.dataTypeRuleMap = {};
        this.analysisRuleMap = {};
        this.rootScope = new scope_1.Scope(null, null, '');
    }
    analyze(ast) {
        this.hoistPass(ast);
        this.scopePass(ast);
        this.typePass(ast);
        this.analysisPass(ast);
    }
    hoistPass(node) {
        node.scope = this.getScope(node);
        for (let child of node.children) {
            if (child.type != ast_1.AstType.StructDef)
                continue;
            this.hoistPass(child);
        }
    }
    scopePass(node) {
        node.scope = this.getScope(node);
        for (let child of node.children) {
            this.scopePass(child);
        }
    }
    getScope(node, parentScope = null) {
        if (node.scope)
            return node.scope;
        if (!parentScope)
            parentScope = (node.parent) ? this.getScope(node.parent) : this.rootScope;
        let rules = this.scopeRuleMap[node.type];
        if (rules) {
            for (let rule of rules)
                node.scope = rule(node, parentScope);
        }
        if (!node.scope)
            node.scope = parentScope;
        return node.scope;
    }
    typePass(node) {
        node.dataType = this.getDataType(node);
        for (let child of node.children) {
            this.typePass(child);
        }
    }
    getDataType(node) {
        if (!node.valid)
            node.dataType = datatype_1.DataType.Invalid;
        if (node.dataType)
            return node.dataType;
        let rules = this.dataTypeRuleMap[node.type];
        if (rules) {
            for (let rule of rules)
                node.dataType = rule(node);
        }
        if (!node.dataType)
            node.dataType = datatype_1.DataType.None;
        return node.dataType;
    }
    analysisPass(node) {
        let rules = this.analysisRuleMap[node.type];
        if (rules) {
            for (let rule of rules)
                rule(node);
        }
        for (let child of node.children) {
            this.analysisPass(child);
        }
    }
    makeComplexScope(v, p, depth = 0) {
        if (depth > MAX_TYPE_DEPTH)
            return;
        if (datatype_1.DataType.isPrimitive(v.type))
            return;
        if (v.type.indexOf('[') >= 0) {
            this.makeArrayScope(v, p, depth);
            return;
        }
        let struct = p.getStruct(v.type);
        if (struct) {
            this.makeStructScope(v, p, struct, depth);
        }
        else if (v.node) {
            this.logError('No struct named ' + v.type + ' found', v.node);
        }
    }
    makeStructScope(v, p, struct, depth = 0) {
        if (!struct)
            return;
        let scope = new scope_1.Scope(v.node, p, v.id);
        p.scopes[scope.id] = scope;
        let offset = v.offset;
        for (let field of struct.fields) {
            let nvar = new scope_1.Variable(null, scope, field.id, field.type);
            scope.vars[nvar.id] = nvar;
            nvar.const = v.const;
            nvar.export = v.export;
            nvar.mapped = v.mapped;
            nvar.offset = offset;
            nvar.size = this.getSize(nvar.type, scope);
            offset += nvar.size;
            this.makeComplexScope(nvar, scope, depth + 1);
        }
    }
    makeArrayScope(v, p, depth = 0) {
        let baseType = v.type.substring(0, v.type.indexOf('['));
        let length = parseInt(v.type.substring(v.type.indexOf('[') + 1, v.type.indexOf(']')));
        let scope = new scope_1.Scope(v.node, p, v.id);
        p.scopes[scope.id] = scope;
        for (let i = 0; i < length; i++) {
            let nvar = new scope_1.Variable(null, scope, '' + i, baseType);
            scope.vars[nvar.id] = nvar;
            nvar.const = v.const;
            nvar.export = v.export;
            nvar.mapped = v.mapped;
            nvar.size = this.getSize(nvar.type, scope);
            nvar.offset = v.offset + nvar.size * i;
            this.makeComplexScope(nvar, scope, depth + 1);
        }
    }
    getSize(type, p, depth = 0) {
        if (depth > MAX_TYPE_DEPTH)
            return 0;
        switch (type) {
            case datatype_1.DataType.Int:
            case datatype_1.DataType.UInt:
            case datatype_1.DataType.Float:
            case datatype_1.DataType.Bool:
                return 4;
            case datatype_1.DataType.Long:
            case datatype_1.DataType.ULong:
            case datatype_1.DataType.Double:
                return 8;
        }
        if (datatype_1.DataType.isPrimitive(type))
            return 0;
        if (type.indexOf('[') >= 0) {
            let length = parseInt(type.substring(type.indexOf('[') + 1, type.indexOf(']')));
            let size = this.getSize(type.substring(0, type.indexOf('[')), p, depth + 1);
            return size * length;
        }
        let struct = p.getStruct(type);
        if (!struct) {
            return 0;
        }
        let size = 0;
        for (let field of struct.fields)
            size += this.getSize(field.type, field.scope, depth + 1);
        return size;
    }
    tryEval(node) {
        if (node.token.type != token_1.TokenType.Int && node.token.type != token_1.TokenType.UInt) {
            this.logError("Invalid constant expression " + JSON.stringify(node.token.value), node);
            return 0;
        }
        try {
            let result = eval(node.token.value);
            return result;
        }
        catch (e) {
            this.logError("Invalid constant expression " + JSON.stringify(node.token.value), node);
            return 0;
        }
    }
    registerScope(type, rule) {
        if (!this.scopeRuleMap[type])
            this.scopeRuleMap[type] = [];
        this.scopeRuleMap[type].push(rule);
    }
    registerDataType(type, rule) {
        if (!this.dataTypeRuleMap[type])
            this.dataTypeRuleMap[type] = [];
        this.dataTypeRuleMap[type].push(rule);
    }
    registerAnalysis(type, rule) {
        if (!this.analysisRuleMap[type])
            this.analysisRuleMap[type] = [];
        this.analysisRuleMap[type].push(rule);
    }
    registerBuiltinFunc(path, type, paramTypes, paramNames) {
        let parts = path.split('.');
        let id = parts.pop();
        let scope = this.rootScope;
        for (let i = 0; i < parts.length; i++) {
            if (!scope.scopes[parts[i]])
                scope.scopes[parts[i]] = new scope_1.Scope(null, scope, parts[i]);
            scope = scope.scopes[parts[i]];
        }
        let params = [];
        for (let i = 0; i < paramTypes.length; i++) {
            params.push(new scope_1.Variable(null, scope, paramNames[i], paramTypes[i]));
        }
        if (id)
            scope.funcs[id] = new scope_1.Function(null, scope, id, type, params);
    }
    logError(msg, node) {
        this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Analyzer", msg, node.token.row, node.token.column, node.token.value.length));
    }
}
exports.Analyzer = Analyzer;
class SchwaAnalyzer extends Analyzer {
    constructor(logger) {
        super(logger);
        this.registerBuiltinFunc('nop', datatype_1.DataType.None, [], []);
        this.registerBuiltinFunc('int.loadSByte', datatype_1.DataType.Int, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('int.loadShort', datatype_1.DataType.Int, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('int.load', datatype_1.DataType.Int, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('int.storeSByte', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Int], ["addr", "val"]);
        this.registerBuiltinFunc('int.storeShort', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Int], ["addr", "val"]);
        this.registerBuiltinFunc('int.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Int], ["addr", "val"]);
        this.registerBuiltinFunc('uint.loadByte', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('uint.loadUShort', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('uint.load', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('uint.storeByte', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.UInt], ["addr", "val"]);
        this.registerBuiltinFunc('uint.storeUShort', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.UInt], ["addr", "val"]);
        this.registerBuiltinFunc('uint.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.UInt], ["addr", "val"]);
        this.registerBuiltinFunc('long.loadSByte', datatype_1.DataType.Long, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('long.loadShort', datatype_1.DataType.Long, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('long.loadInt', datatype_1.DataType.Long, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('long.load', datatype_1.DataType.Long, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('long.storeSByte', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Long], ["addr", "val"]);
        this.registerBuiltinFunc('long.storeShort', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Long], ["addr", "val"]);
        this.registerBuiltinFunc('long.storeInt', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Long], ["addr", "val"]);
        this.registerBuiltinFunc('long.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Long], ["addr", "val"]);
        this.registerBuiltinFunc('ulong.loadByte', datatype_1.DataType.ULong, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('ulong.loadUShort', datatype_1.DataType.ULong, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('ulong.loadUInt', datatype_1.DataType.ULong, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('ulong.load', datatype_1.DataType.ULong, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('ulong.storeByte', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.ULong], ["addr", "val"]);
        this.registerBuiltinFunc('ulong.storeUShort', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.ULong], ["addr", "val"]);
        this.registerBuiltinFunc('ulong.storeUInt', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.ULong], ["addr", "val"]);
        this.registerBuiltinFunc('ulong.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.ULong], ["addr", "val"]);
        this.registerBuiltinFunc('float.load', datatype_1.DataType.Float, [datatype_1.DataType.UInt], ["addr"]);
        this.registerBuiltinFunc('float.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Float], ["addr", "val"]);
        this.registerBuiltinFunc('double.load', datatype_1.DataType.Double, [datatype_1.DataType.UInt], ["addr", "val"]);
        this.registerBuiltinFunc('double.store', datatype_1.DataType.None, [datatype_1.DataType.UInt, datatype_1.DataType.Double], ["addr", "val"]);
        this.registerBuiltinFunc('int.clz', datatype_1.DataType.Int, [datatype_1.DataType.Int], ["n"]);
        this.registerBuiltinFunc('int.ctz', datatype_1.DataType.Int, [datatype_1.DataType.Int], ["n"]);
        this.registerBuiltinFunc('int.popcnt', datatype_1.DataType.Int, [datatype_1.DataType.Int], ["n"]);
        this.registerBuiltinFunc('int.eqz', datatype_1.DataType.Int, [datatype_1.DataType.Int], ["n"]);
        this.registerBuiltinFunc('uint.clz', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["n"]);
        this.registerBuiltinFunc('uint.ctz', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["n"]);
        this.registerBuiltinFunc('uint.popcnt', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["n"]);
        this.registerBuiltinFunc('uint.eqz', datatype_1.DataType.UInt, [datatype_1.DataType.UInt], ["n"]);
        this.registerBuiltinFunc('long.clz', datatype_1.DataType.Long, [datatype_1.DataType.Long], ["n"]);
        this.registerBuiltinFunc('long.ctz', datatype_1.DataType.Long, [datatype_1.DataType.Long], ["n"]);
        this.registerBuiltinFunc('long.popcnt', datatype_1.DataType.Long, [datatype_1.DataType.Long], ["n"]);
        this.registerBuiltinFunc('long.eqz', datatype_1.DataType.Long, [datatype_1.DataType.Long], ["n"]);
        this.registerBuiltinFunc('ulong.clz', datatype_1.DataType.ULong, [datatype_1.DataType.ULong], ["n"]);
        this.registerBuiltinFunc('ulong.ctz', datatype_1.DataType.ULong, [datatype_1.DataType.ULong], ["n"]);
        this.registerBuiltinFunc('ulong.popcnt', datatype_1.DataType.ULong, [datatype_1.DataType.ULong], ["n"]);
        this.registerBuiltinFunc('ulong.eqz', datatype_1.DataType.ULong, [datatype_1.DataType.ULong], ["n"]);
        this.registerBuiltinFunc('float.abs', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.ceil', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.floor', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.truncate', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.round', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.sqrt', datatype_1.DataType.Float, [datatype_1.DataType.Float], ["n"]);
        this.registerBuiltinFunc('float.copysign', datatype_1.DataType.Float, [datatype_1.DataType.Float, datatype_1.DataType.Float], ["a", "b"]);
        this.registerBuiltinFunc('float.min', datatype_1.DataType.Float, [datatype_1.DataType.Float, datatype_1.DataType.Float], ["a", "b"]);
        this.registerBuiltinFunc('float.max', datatype_1.DataType.Float, [datatype_1.DataType.Float, datatype_1.DataType.Float], ["a", "b"]);
        this.registerBuiltinFunc('double.abs', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.ceil', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.floor', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.truncate', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.round', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.sqrt', datatype_1.DataType.Double, [datatype_1.DataType.Double], ["n"]);
        this.registerBuiltinFunc('double.copysign', datatype_1.DataType.Double, [datatype_1.DataType.Double, datatype_1.DataType.Double], ["a", "b"]);
        this.registerBuiltinFunc('double.min', datatype_1.DataType.Double, [datatype_1.DataType.Double, datatype_1.DataType.Double], ["a", "b"]);
        this.registerBuiltinFunc('double.max', datatype_1.DataType.Double, [datatype_1.DataType.Double, datatype_1.DataType.Double], ["a", "b"]);
        this.registerScope(ast_1.AstType.Program, (n, p) => {
            let scope = new scope_1.Scope(n, p, '');
            p.scopes[scope.id] = scope;
            return scope;
        });
        this.registerScope(ast_1.AstType.Block, (n, p) => {
            let scope = new scope_1.Scope(n, p, '');
            p.scopes[scope.id] = scope;
            return scope;
        });
        this.registerScope(ast_1.AstType.StructDef, (n, p) => {
            let scope = new scope_1.Scope(n, p, n.children[0].token.value);
            let fields = [];
            let fieldNodes = n.children[1].children;
            for (let i = 0; i < fieldNodes.length; i++) {
                if (fieldNodes[i].type != ast_1.AstType.VariableDef)
                    continue;
                let fieldType = fieldNodes[i].token.value;
                if (fieldNodes[i].children.length > 1)
                    fieldType += '[' + this.tryEval(fieldNodes[i].children[1]) + ']';
                fields.push(new scope_1.Variable(fieldNodes[i], scope, fieldNodes[i].children[0].token.value, fieldType));
            }
            let struct = new scope_1.Struct(n, scope, n.children[0].token.value, fields);
            if (p.structs[struct.id]) {
                this.logError("A struct with the name " + JSON.stringify(struct.id) + " already found", n);
            }
            else {
                p.structs[struct.id] = struct;
                p.scopes[scope.id] = scope;
            }
            return scope;
        });
        this.registerScope(ast_1.AstType.FunctionDef, (n, p) => {
            let scope = new scope_1.Scope(n, p, n.children[0].token.value);
            let params = [];
            let paramNodes = n.children[1].children;
            for (let i = 0; i < paramNodes.length; i++) {
                if (!paramNodes[i].children.length)
                    continue;
                let paramType = paramNodes[i].token.value;
                if (paramNodes[i].children.length > 1)
                    paramType += '[' + this.tryEval(paramNodes[i].children[1]) + ']';
                if (paramType.indexOf('[') >= 0) {
                    this.logError("Arrays cannot be used as function parameters", paramNodes[i]);
                    continue;
                }
                params.push(new scope_1.Variable(paramNodes[i], scope, paramNodes[i].children[0].token.value, paramType));
            }
            let func = new scope_1.Function(n, scope, n.children[0].token.value, n.token.value, params);
            if (p.funcs[func.id]) {
                this.logError("A function with the name " + JSON.stringify(func.id) + " already found", n);
            }
            else {
                p.funcs[func.id] = func;
                p.scopes[scope.id] = scope;
            }
            return scope;
        });
        this.registerScope(ast_1.AstType.VariableDef, (n, p) => {
            let type = n.token.value;
            if (n.children.length > 1)
                type += '[' + this.tryEval(n.children[1]) + ']';
            let nvar = new scope_1.Variable(n, p, n.children[0].token.value, type);
            if (p.vars[nvar.id]) {
                this.logError("A variable with the name " + JSON.stringify(nvar.id) + " already found", n);
            }
            else {
                p.vars[nvar.id] = nvar;
                nvar.size = this.getSize(nvar.type, p);
                let pn = n.parent;
                while (pn && pn.type != ast_1.AstType.Global)
                    pn = pn.parent;
                if (pn && pn.type == ast_1.AstType.Global)
                    nvar.global = true;
                pn = n.parent;
                while (pn && pn.type != ast_1.AstType.Map)
                    pn = pn.parent;
                if (pn && pn.type == ast_1.AstType.Map) {
                    nvar.global = true;
                    nvar.mapped = true;
                    if (pn.children.length >= 2) {
                        nvar.offset = this.tryEval(pn.children[1]);
                    }
                }
                this.makeComplexScope(nvar, p);
            }
            return p;
        });
        this.registerScope(ast_1.AstType.Indexer, (n, p) => {
            let scope = p;
            this.getScope(n.children[1], p);
            if (n.children[0].type == ast_1.AstType.VariableId) {
                scope = p.getScope(n.children[0].token.value);
            }
            else {
                scope = this.getScope(n.children[0], p);
            }
            if (scope)
                scope = scope.getScope('0');
            if (!scope) {
                this.logError("No scope named " + JSON.stringify(n.children[0].token.value) + " found", n);
                return p;
            }
            return scope;
        });
        this.registerScope(ast_1.AstType.Access, (n, p) => {
            let scope = p;
            if (n.children[0].type == ast_1.AstType.VariableId || n.children[0].type == ast_1.AstType.Type) {
                scope = p.getScope(n.children[0].token.value);
            }
            else {
                scope = this.getScope(n.children[0], p);
            }
            if (!scope) {
                this.logError("Invalid left-hand side of property access", n);
                return p;
            }
            this.getScope(n.children[1], scope);
            if (scope) {
                let childScope = scope.getScope(n.children[1].token.value);
                if (childScope)
                    scope = childScope;
            }
            return scope;
        });
        this.registerScope(ast_1.AstType.Const, (n, p) => {
            let node = n.parent;
            while (node && node.children)
                node = node.children[0];
            if (node) {
                let nvar = p.getVariable(node.token.value);
                if (nvar)
                    nvar.const = true;
            }
            return p;
        });
        this.registerScope(ast_1.AstType.Export, (n, p) => {
            let node = n.parent;
            while (node && node.children)
                node = node.children[0];
            if (node) {
                let nvar = p.getVariable(node.token.value);
                if (nvar)
                    nvar.export = true;
                let func = p.getFunction(node.token.value);
                if (func)
                    func.export = true;
                let struct = p.getStruct(node.token.value);
                if (struct)
                    struct.export = true;
            }
            return p;
        });
        this.registerDataType(ast_1.AstType.Indexer, (n) => {
            if (n.children.length) {
                let node = n.children[0];
                if (node) {
                    let type = this.getDataType(node);
                    type = type.substring(0, type.indexOf('['));
                    return type;
                }
            }
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.Access, (n) => {
            if (n.children.length >= 2) {
                let node = n.children[1];
                if (node)
                    return this.getDataType(node);
            }
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.VariableId, (n) => {
            if (this.getScope(n)) {
                let nvar = this.getScope(n).getVariable(n.token.value);
                if (nvar)
                    return nvar.type;
                else
                    this.logError("No variable named " + JSON.stringify(n.token.value) + " found", n);
            }
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.FunctionId, (n) => {
            if (this.getScope(n)) {
                let func = this.getScope(n).getFunction(n.token.value);
                if (func)
                    return func.type;
                else
                    this.logError("No function named " + JSON.stringify(n.token.value) + " found", n);
            }
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.StructId, (n) => {
            if (this.getScope(n)) {
                let struct = this.getScope(n).getStruct(n.token.value);
                if (struct)
                    return struct.id;
                else
                    this.logError("No struct named " + JSON.stringify(n.token.value) + " found", n);
            }
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.Type, (n) => datatype_1.DataType.Type);
        this.registerDataType(ast_1.AstType.VariableDef, (n) => {
            let type = n.token.value;
            if (n.children.length > 1)
                type += '[' + this.tryEval(n.children[1]) + ']';
            return type;
        });
        this.registerDataType(ast_1.AstType.FunctionDef, (n) => n.token.value);
        this.registerDataType(ast_1.AstType.StructDef, (n) => n.children[0].token.value);
        this.registerDataType(ast_1.AstType.Literal, (n) => {
            let type = datatype_1.DataType.fromTokenType(n.token.type);
            if (type == datatype_1.DataType.Float || type == datatype_1.DataType.Double) {
                return type;
            }
            else if (type == datatype_1.DataType.Int || type == datatype_1.DataType.UInt || type == datatype_1.DataType.Long || type == datatype_1.DataType.ULong) {
                let val = n.token.value;
                let unsigned = type == datatype_1.DataType.UInt || type == datatype_1.DataType.ULong;
                let isLong = type == datatype_1.DataType.Long || type == datatype_1.DataType.ULong;
                let neg = val.startsWith('-');
                if (neg)
                    val = val.substr(1);
                if (unsigned)
                    val = val.substr(0, val.length - 1);
                if (isLong)
                    val = val.substr(0, val.length - 1);
                let radix = 10;
                if (val.startsWith('0x')) {
                    radix = 16;
                    val = val.substr(2);
                }
                if (val.startsWith('0o')) {
                    radix = 8;
                    val = val.substr(2);
                }
                if (val.startsWith('0b')) {
                    radix = 2;
                    val = val.substr(2);
                }
                if (neg)
                    val = '-' + val;
                let isValid = true;
                let long = Long.fromString(val, unsigned, radix);
                if (!isLong && long.gt(Long.fromString(unsigned ? "FFFFFFFF" : "7FFFFFFF", unsigned, 16)))
                    isValid = false;
                if (!isLong && long.lt(Long.fromString(unsigned ? "0" : "-80000000", unsigned, 16)))
                    isValid = false;
                if (long.toString(radix).toUpperCase() != val)
                    isValid = false;
                if (!isValid)
                    console.log(val, long.toString(radix).toUpperCase());
                if (isValid)
                    return type;
            }
            else {
                return type;
            }
            this.logError("The value " + JSON.stringify(n.token.value) + " is out of range", n);
            return datatype_1.DataType.Invalid;
        });
        let intTypeSet = [datatype_1.DataType.Int, datatype_1.DataType.Int, datatype_1.DataType.Int];
        let uintTypeSet = [datatype_1.DataType.UInt, datatype_1.DataType.UInt, datatype_1.DataType.UInt];
        let longTypeSet = [datatype_1.DataType.Long, datatype_1.DataType.Long, datatype_1.DataType.Long];
        let ulongTypeSet = [datatype_1.DataType.ULong, datatype_1.DataType.ULong, datatype_1.DataType.ULong];
        let floatTypeSet = [datatype_1.DataType.Float, datatype_1.DataType.Float, datatype_1.DataType.Float];
        let doubleTypeSet = [datatype_1.DataType.Double, datatype_1.DataType.Double, datatype_1.DataType.Double];
        let fixedTypeSets = [intTypeSet, uintTypeSet, longTypeSet, ulongTypeSet];
        let floatingTypeSets = [floatTypeSet, doubleTypeSet];
        let signedTypeSets = [intTypeSet, longTypeSet, floatTypeSet, doubleTypeSet];
        let numberTypeSets = [intTypeSet, uintTypeSet, longTypeSet, ulongTypeSet, floatTypeSet, doubleTypeSet];
        let boolTypeSet = [datatype_1.DataType.Bool, datatype_1.DataType.Bool, datatype_1.DataType.Bool];
        let compareSets = [[datatype_1.DataType.Int, datatype_1.DataType.Int, datatype_1.DataType.Bool], [datatype_1.DataType.UInt, datatype_1.DataType.UInt, datatype_1.DataType.Bool], [datatype_1.DataType.Long, datatype_1.DataType.Long, datatype_1.DataType.Bool], [datatype_1.DataType.ULong, datatype_1.DataType.ULong, datatype_1.DataType.Bool], [datatype_1.DataType.Float, datatype_1.DataType.Float, datatype_1.DataType.Bool], [datatype_1.DataType.Double, datatype_1.DataType.Double, datatype_1.DataType.Bool]];
        this.registerDataTypeUnaryOp(token_1.TokenType.Neg, signedTypeSets);
        this.registerDataTypeUnaryOp(token_1.TokenType.NOT, fixedTypeSets);
        this.registerDataTypeUnaryOp(token_1.TokenType.Not, [boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.Add, numberTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Sub, numberTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Mul, numberTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Div, numberTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Mod, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.AND, [...fixedTypeSets, boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.OR, [...fixedTypeSets, boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.XOR, [...fixedTypeSets, boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.NOT, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.ShL, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.ShR, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.RotL, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.RotR, fixedTypeSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Eq, [...compareSets, boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.Ne, [...compareSets, boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.Lt, compareSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Le, compareSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Gt, compareSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.Ge, compareSets);
        this.registerDataTypeBinaryOp(token_1.TokenType.And, [boolTypeSet]);
        this.registerDataTypeBinaryOp(token_1.TokenType.Or, [boolTypeSet]);
        this.registerDataType(ast_1.AstType.Assignment, (n) => {
            let ident = this.getIdentifier(n.children[0]);
            if (ident) {
                let nvar = this.getScope(ident).getVariable(ident.token.value);
                if (nvar && nvar.const) {
                    this.logError("Constant globals cannot be assigned to", n);
                    return datatype_1.DataType.Invalid;
                }
            }
            let t0 = this.getDataType(n.children[0]);
            let t1 = this.getDataType(n.children[1]);
            if (t0 == datatype_1.DataType.Invalid || t1 == datatype_1.DataType.Invalid) {
                if (t0 == datatype_1.DataType.Invalid)
                    this.logError("Invalid left-hand side of assignment", n.children[0]);
                if (t1 == datatype_1.DataType.Invalid)
                    this.logError("Invalid right-hand side of assignment", n.children[1]);
                return datatype_1.DataType.Invalid;
            }
            if (t0 != t1) {
                this.logError("Both sides of an assignment must be of the same type", n);
                return datatype_1.DataType.Invalid;
            }
            return t0;
        });
        this.registerDataType(ast_1.AstType.Global, (n) => {
            let t0 = this.getDataType(n.children[0]);
            let t1 = this.getDataType(n.children[1]);
            if (t0 == datatype_1.DataType.Invalid || t1 == datatype_1.DataType.Invalid) {
                if (t0 == datatype_1.DataType.Invalid)
                    this.logError("Invalid left-hand side of assignment", n.children[0]);
                if (t1 == datatype_1.DataType.Invalid)
                    this.logError("Invalid right-hand side of assignment", n.children[1]);
                return datatype_1.DataType.Invalid;
            }
            if (t0 != t1) {
                this.logError("Both sides of an assignment must be of the same type", n);
                return datatype_1.DataType.Invalid;
            }
            return t0;
        });
        this.registerDataType(ast_1.AstType.BinaryOp, (n) => {
            if (n.dataType || n.token.type != token_1.TokenType.As)
                return n.dataType;
            let t0 = this.getDataType(n.children[0]);
            let t1 = (n.children[1].type == ast_1.AstType.Type) ? n.children[1].token.value : datatype_1.DataType.Invalid;
            if (t1 == datatype_1.DataType.Bool)
                t1 = datatype_1.DataType.Invalid;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.Invalid)
                this.logError("Invalid value argument to operator " + n.token.type, n.children[0]);
            if (t1 == datatype_1.DataType.Invalid)
                this.logError("Invalid type argument to operator " + n.token.type, n.children[1]);
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.BinaryOp, (n) => {
            if (n.dataType || n.token.type != token_1.TokenType.To)
                return n.dataType;
            let t0 = this.getDataType(n.children[0]);
            let t1 = (n.children[1].type == ast_1.AstType.Type) ? n.children[1].token.value : datatype_1.DataType.Invalid;
            if (t1 == datatype_1.DataType.Bool)
                t1 = datatype_1.DataType.Invalid;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Double)
                return datatype_1.DataType.Double;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Int)
                return datatype_1.DataType.Int;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.UInt)
                return datatype_1.DataType.UInt;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Long)
                return datatype_1.DataType.Long;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.ULong)
                return datatype_1.DataType.ULong;
            if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Float)
                return datatype_1.DataType.Float;
            if (t0 == datatype_1.DataType.Invalid)
                this.logError("Invalid value argument to operator " + n.token.type, n.children[0]);
            if (t1 == datatype_1.DataType.Invalid)
                this.logError("Invalid type argument to operator " + n.token.type, n.children[1]);
            return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.FunctionCall, (n) => {
            let ident = this.getIdentifier(n.children[0]);
            if (!ident) {
                this.logError("Invalid function identifier", n);
                return datatype_1.DataType.Invalid;
            }
            let func = this.getScope(ident).getFunction(ident.token.value);
            if (!func) {
                this.logError("No function named " + JSON.stringify(ident.token.value) + " found", n);
                return datatype_1.DataType.Invalid;
            }
            if (func.params.length != n.children[1].children.length) {
                this.logError("Function " + JSON.stringify(func.id) + " takes " + func.params.length + " arguments, not " + n.children[1].children.length, n);
                return datatype_1.DataType.Invalid;
            }
            let valid = true;
            for (let i = 0; i < func.params.length; i++) {
                let type = this.getDataType(n.children[1].children[i]);
                if (type != func.params[i].type) {
                    this.logError("The " + formatOrdinal(i + 1) + " parameter (" + JSON.stringify(func.params[i].id) + ") of function " + JSON.stringify(func.id) + " is type " + func.params[i].type + ", not " + type, n.children[1].children[i]);
                    valid = false;
                }
            }
            if (valid)
                return func.type;
            else
                return datatype_1.DataType.Invalid;
        });
        this.registerDataType(ast_1.AstType.Return, (n) => {
            let t = this.getDataType(n.children[0]);
            let p = n.parent;
            while (p && p.type != ast_1.AstType.FunctionDef)
                p = p.parent;
            if (p && (t != p.token.value || p.token.value == datatype_1.DataType.None)) {
                this.logError("Type of return value (" + t + ") does not match function " + p.children[0].token.value + "'s return type (" + p.token.value + ")", n.children[0]);
                return datatype_1.DataType.Invalid;
            }
            return t;
        });
        this.registerDataType(ast_1.AstType.ReturnVoid, (n) => {
            let p = n.parent;
            while (p && p.type != ast_1.AstType.FunctionDef)
                p = p.parent;
            if (p && p.token.value != datatype_1.DataType.None) {
                this.logError("Type of return value (" + datatype_1.DataType.None + ") does not match function " + p.children[0].token.value + "'s return type (" + p.token.value + ")", n.children[0]);
                return datatype_1.DataType.Invalid;
            }
            return datatype_1.DataType.None;
        });
    }
    registerDataTypeUnaryOp(type, typeSets) {
        this.registerDataType(ast_1.AstType.UnaryOp, (n) => {
            if (n.dataType || n.token.type != type)
                return n.dataType;
            let t = this.getDataType(n.children[0]);
            for (let i = 0; i < typeSets.length; i++) {
                if (t == typeSets[i][0])
                    return typeSets[i][1];
            }
            this.logError("Invalid argument to operator " + n.token.type, n.children[0]);
            return datatype_1.DataType.Invalid;
        });
    }
    registerDataTypeBinaryOp(type, typeSets) {
        this.registerDataType(ast_1.AstType.BinaryOp, (n) => {
            if (n.dataType || n.token.type != type)
                return n.dataType;
            let t0 = this.getDataType(n.children[0]);
            let t1 = this.getDataType(n.children[1]);
            for (let i = 0; i < typeSets.length; i++) {
                if (t0 == typeSets[i][0] && t1 == typeSets[i][1])
                    return typeSets[i][2];
            }
            this.logError("Invalid 1st argument to operator " + n.token.type, n.children[0]);
            this.logError("Invalid 2nd argument to operator " + n.token.type, n.children[1]);
            return datatype_1.DataType.Invalid;
        });
    }
    getIdentifier(node) {
        if (node.type == ast_1.AstType.FunctionId || node.type == ast_1.AstType.VariableId)
            return node;
        if (node.type == ast_1.AstType.Access)
            return this.getIdentifier(node.children[1]);
        if (node.type == ast_1.AstType.Indexer)
            return this.getIdentifier(node.children[0]);
        return null;
    }
}
exports.SchwaAnalyzer = SchwaAnalyzer;
