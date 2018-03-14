"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
const ast_1 = require("./ast");
const log_1 = require("./log");
const datatype_1 = require("./datatype");
const WASM = require("./wasm");
const io_1 = require("./io");
const Long = require("long");
class Generator {
    constructor(logger) {
        this.logger = logger;
        this.ruleMap = {};
        this.ast = null;
        this.funcTypes = [];
        this.funcTypeIndices = [];
        this.funcTypeToTypeIndex = {};
        this.varPathToIndex = {};
        this.funcIndex = 0;
        this.funcPathToIndex = {};
        this.funcBodies = [];
        this.startFuncIndex = -1;
        this.globals = [];
        this.exports = [];
        this.funcNames = [];
        this.localNames = [];
        this.names = [];
    }
    generate(ast, name = "") {
        this.ast = ast;
        this.funcTypes = [];
        this.funcTypeIndices = [];
        this.funcTypeToTypeIndex = {};
        this.varPathToIndex = {};
        this.funcIndex = 0;
        this.funcPathToIndex = {};
        this.funcBodies = [];
        this.startFuncIndex = -1;
        this.globals = [];
        this.exports = [];
        this.funcNames = [];
        this.localNames = [];
        this.names = [];
        let writer = new io_1.Writer();
        writer.write(this.getModule(name));
        if (this.logger.count(log_1.LogType.Error) > 0)
            return null;
        return writer.toArrayBuffer();
    }
    register(type, rule) {
        this.ruleMap[type] = rule;
    }
    gen(w, node) {
        if (!node)
            return;
        let rule = this.ruleMap[node.type];
        if (rule)
            rule(w, node);
        else
            console.log("No rule for " + node.type);
        node.generated = true;
    }
    getModule(name) {
        if (this.ast && this.ast.scope) {
            for (let id in this.ast.scope.funcs)
                this.addFunction(this.ast.scope.funcs[id]);
            for (let id in this.ast.scope.vars)
                this.addGlobal(this.ast.scope.vars[id]);
            for (let id in this.ast.scope.funcs)
                this.addFunctionBody(this.ast.scope.funcs[id]);
        }
        this.exports.push(new WASM.ExportEntry("memory", WASM.ExternalKind.Memory, 0));
        if (name)
            this.names.push(new WASM.NameEntry(WASM.NameType.Module, name));
        this.names.push(new WASM.NameEntry(WASM.NameType.Function, new WASM.NameMap(this.funcNames)));
        this.names.push(new WASM.NameEntry(WASM.NameType.Local, new WASM.LocalNames(this.localNames)));
        let sections = [];
        sections.push(new WASM.TypeSection(this.funcTypes));
        sections.push(new WASM.FunctionSection(this.funcTypeIndices));
        sections.push(new WASM.MemorySection([new WASM.MemoryType(new WASM.ResizableLimits(1))]));
        sections.push(new WASM.GlobalSection(this.globals));
        sections.push(new WASM.ExportSection(this.exports));
        if (this.startFuncIndex >= 0)
            sections.push(new WASM.StartSection(this.startFuncIndex));
        sections.push(new WASM.CodeSection(this.funcBodies));
        sections.push(new WASM.NameSection(this.names));
        return new WASM.Module(sections);
    }
    addFunction(func) {
        this.funcPathToIndex[func.getPath()] = this.funcIndex;
        if (func.id == "main")
            this.startFuncIndex = this.funcIndex;
        this.funcIndex++;
    }
    addFunctionBody(func) {
        let localNamings = [];
        if (!func.node)
            return;
        let params = [];
        let paramIndex = 0;
        for (let i = 0; i < func.params.length; i++) {
            let vars = this.getPrimitiveVars(func.params[i]);
            for (let param of vars) {
                let type = this.toWasmType(param.type);
                if (!type)
                    continue;
                params.push(type);
                localNamings.push(new WASM.Naming(paramIndex, param.getPath(true)));
                this.varPathToIndex[param.getPath()] = paramIndex++;
            }
        }
        let returns = [];
        if (func.type != datatype_1.DataType.None) {
            let returnType = this.toWasmType(func.type);
            if (!returnType) {
                this.logError('Functions can only return primitive types', func.node);
                return;
            }
            returns.push(returnType);
        }
        let typeStr = params.join() + ":" + returns.join();
        let index;
        if (this.funcTypeToTypeIndex[typeStr]) {
            index = this.funcTypeToTypeIndex[typeStr];
        }
        else {
            this.funcTypes.push(new WASM.FunctionType(params, returns));
            index = this.funcTypes.length - 1;
            this.funcTypeToTypeIndex[typeStr] = index;
        }
        this.funcTypeIndices.push(index);
        let locals = [];
        this.addLocals(locals, localNamings, func.node, params.length);
        let writer = new io_1.Writer();
        this.gen(writer, func.node.children[2]);
        this.funcBodies.push(new WASM.FunctionBody(locals, writer.toTypedArray()));
        this.funcNames.push(new WASM.Naming(this.funcPathToIndex[func.getPath()], func.id));
        this.localNames.push(new WASM.LocalName(this.funcPathToIndex[func.getPath()], new WASM.NameMap(localNamings)));
        if (func.export)
            this.exports.push(new WASM.ExportEntry(func.id, WASM.ExternalKind.Function, this.funcPathToIndex[func.getPath()]));
    }
    addLocals(locals, localNamings, node, index) {
        if (node.parent && node.scope && node.type == ast_1.AstType.VariableDef && node.parent.type != ast_1.AstType.Parameters) {
            let localVar = node.scope.getVariable(node.children[0].token.value);
            if (localVar) {
                let vars = this.getPrimitiveVars(localVar);
                for (let lvar of vars) {
                    let type = this.toWasmType(lvar.type);
                    if (!type)
                        continue;
                    let local = new WASM.LocalEntry(1, type);
                    localNamings.push(new WASM.Naming(index, lvar.getPath(true)));
                    this.varPathToIndex[lvar.getPath()] = index++;
                    locals.push(local);
                }
            }
        }
        for (let i = 0; i < node.children.length; i++) {
            index = this.addLocals(locals, localNamings, node.children[i], index);
        }
        return index;
    }
    addGlobal(global) {
        if (global.mapped)
            return;
        let vars = this.getPrimitiveVars(global);
        for (let gvar of vars) {
            let type = this.toWasmType(gvar.type);
            if (!type)
                continue;
            let initExpr = null;
            if (gvar.node && gvar.node.parent) {
                let writer = new io_1.Writer();
                this.varPathToIndex[gvar.getPath()] = this.globals.length;
                this.gen(writer, gvar.node.parent.children[1]);
                initExpr = writer.toTypedArray();
            }
            else {
                initExpr = this.getDefaultInitializer(gvar.type);
            }
            if (gvar.export)
                this.exports.push(new WASM.ExportEntry(gvar.getPath(true), WASM.ExternalKind.Global, this.globals.length));
            this.globals.push(new WASM.GlobalEntry(new WASM.GlobalType(type, !gvar.const), new WASM.InitializerExpression(initExpr)));
        }
    }
    toWasmType(type) {
        if (type == datatype_1.DataType.Int || type == datatype_1.DataType.UInt || type == datatype_1.DataType.Bool)
            return WASM.LangType.i32;
        if (type == datatype_1.DataType.Long || type == datatype_1.DataType.ULong)
            return WASM.LangType.i64;
        if (type == datatype_1.DataType.Float)
            return WASM.LangType.f32;
        if (type == datatype_1.DataType.Double)
            return WASM.LangType.f64;
        return null;
    }
    getDefaultInitializer(type) {
        let w = new io_1.Writer();
        if (type == datatype_1.DataType.Int || type == datatype_1.DataType.UInt || type == datatype_1.DataType.Bool) {
            w.uint8(WASM.OpCode.i32_const);
            w.varintN(0, 32);
        }
        else if (type == datatype_1.DataType.Long || type == datatype_1.DataType.ULong) {
            w.uint8(WASM.OpCode.i64_const);
            w.varintN(0, 32);
        }
        else if (type == datatype_1.DataType.Float) {
            w.uint8(WASM.OpCode.f32_const);
            let arr = new Float32Array(1);
            arr[0] = 0;
            w.bytes(new Uint8Array(arr.buffer));
        }
        else if (type == datatype_1.DataType.Double) {
            w.uint8(WASM.OpCode.f64_const);
            let arr = new Float64Array(1);
            arr[0] = 0;
            w.bytes(new Uint8Array(arr.buffer));
        }
        return w.toTypedArray();
    }
    getPrimitiveVars(nvar) {
        if (datatype_1.DataType.isPrimitive(nvar.type))
            return [nvar];
        let out = [];
        let scope = nvar.scope.scopes[nvar.id];
        if (scope) {
            for (let key in scope.vars)
                out = out.concat(this.getPrimitiveVars(scope.vars[key]));
        }
        return out;
    }
    logError(msg, node) {
        this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Generator", msg, node.token.row, node.token.column, node.token.value.length));
    }
}
exports.Generator = Generator;
class SchwaGenerator extends Generator {
    constructor(logger) {
        super(logger);
        this.register(ast_1.AstType.Access, (w, n) => {
            this.gen(w, n.children[1]);
        });
        this.register(ast_1.AstType.VariableId, (w, n) => {
            if (!n.scope)
                return;
            let nodeVar = n.scope.getVariable(n.token.value);
            if (nodeVar) {
                let vars = this.getPrimitiveVars(nodeVar);
                for (let nvar of vars) {
                    if (nvar.mapped) {
                        w.uint8(WASM.OpCode.i32_const);
                        w.varintN(nvar.offset, 32);
                        if (nvar.type == datatype_1.DataType.Int || nvar.type == datatype_1.DataType.UInt || nvar.type == datatype_1.DataType.Bool) {
                            w.uint8(WASM.OpCode.i32_load);
                        }
                        else if (nvar.type == datatype_1.DataType.Long || nvar.type == datatype_1.DataType.ULong) {
                            w.uint8(WASM.OpCode.i64_load);
                        }
                        else if (nvar.type == datatype_1.DataType.Float) {
                            w.uint8(WASM.OpCode.f32_load);
                        }
                        else if (nvar.type == datatype_1.DataType.Double) {
                            w.uint8(WASM.OpCode.f64_load);
                        }
                        w.varuintN(2, 32);
                        w.varuintN(0, 32);
                    }
                    else {
                        if (nvar.global)
                            w.uint8(WASM.OpCode.get_global);
                        else
                            w.uint8(WASM.OpCode.get_local);
                        w.varuintN(this.varPathToIndex[nvar.getPath()], 32);
                    }
                }
            }
        });
        this.register(ast_1.AstType.Literal, (w, n) => {
            if (n.dataType == datatype_1.DataType.Bool) {
                w.uint8(WASM.OpCode.i32_const);
                w.varintN(n.token.value == "true" ? 1 : 0, 32);
            }
            else if (n.dataType == datatype_1.DataType.Int) {
                w.uint8(WASM.OpCode.i32_const);
                w.varintN(parseInt(this.stripNum(n.token.value)), 32);
            }
            else if (n.dataType == datatype_1.DataType.UInt) {
                w.uint8(WASM.OpCode.i32_const);
                w.varintN(parseInt(this.stripNum(n.token.value)), 32);
            }
            else if (n.dataType == datatype_1.DataType.Long) {
                w.uint8(WASM.OpCode.i64_const);
                w.varintLong(Long.fromString(this.stripNum(n.token.value)));
            }
            else if (n.dataType == datatype_1.DataType.ULong) {
                w.uint8(WASM.OpCode.i64_const);
                w.varintLong(Long.fromString(this.stripNum(n.token.value)));
            }
            else if (n.dataType == datatype_1.DataType.Float) {
                w.uint8(WASM.OpCode.f32_const);
                let arr = new Float32Array(1);
                arr[0] = parseFloat(this.stripNum(n.token.value));
                w.bytes(new Uint8Array(arr.buffer));
            }
            else if (n.dataType == datatype_1.DataType.Double) {
                w.uint8(WASM.OpCode.f64_const);
                let arr = new Float64Array(1);
                arr[0] = parseFloat(this.stripNum(n.token.value));
                w.bytes(new Uint8Array(arr.buffer));
            }
        });
        this.register(ast_1.AstType.UnaryOp, (w, n) => {
            let t = n.dataType;
            if (n.token.type == token_1.TokenType.Neg) {
                if (t == datatype_1.DataType.Int) {
                    w.uint8(WASM.OpCode.i32_const);
                    w.varintN(0, 32);
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.i32_sub);
                }
                else if (t == datatype_1.DataType.Long) {
                    w.uint8(WASM.OpCode.i64_const);
                    w.varintN(0, 64);
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.i64_sub);
                }
                else if (t == datatype_1.DataType.Float) {
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.f32_neg);
                }
                else if (t == datatype_1.DataType.Double) {
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.f64_neg);
                }
            }
            else if (n.token.type == token_1.TokenType.NOT) {
                if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt) {
                    w.uint8(WASM.OpCode.i32_const);
                    w.varintN(-1, 32);
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.i32_xor);
                }
                else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong) {
                    w.uint8(WASM.OpCode.i64_const);
                    w.varintN(-1, 64);
                    this.gen(w, n.children[0]);
                    w.uint8(WASM.OpCode.i64_xor);
                }
            }
            else if (n.token.type == token_1.TokenType.Not) {
                this.gen(w, n.children[0]);
                w.uint8(WASM.OpCode.i32_eqz);
            }
            else
                this.logError("Unknown unary op " + n.token.type, n);
        });
        this.register(ast_1.AstType.BinaryOp, (w, n) => {
            let t = n.dataType;
            if (n.token.type == token_1.TokenType.As) {
                let t0 = n.children[0].dataType;
                let t1 = n.children[1].token.value;
                this.gen(w, n.children[0]);
                if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.UInt) { }
                else if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_reinterpret_i32);
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Int) { }
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_reinterpret_i32);
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.ULong) { }
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_reinterpret_i64);
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Long) { }
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_reinterpret_i64);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Int)
                    w.uint8(WASM.OpCode.i32_reinterpret_f32);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.UInt)
                    w.uint8(WASM.OpCode.i32_reinterpret_f32);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Long)
                    w.uint8(WASM.OpCode.i64_reinterpret_f64);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.ULong)
                    w.uint8(WASM.OpCode.i64_reinterpret_f64);
            }
            else if (n.token.type == token_1.TokenType.To) {
                let t0 = n.children[0].dataType;
                let t1 = n.children[1].token.value;
                this.gen(w, n.children[0]);
                if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Long)
                    w.uint8(WASM.OpCode.i64_extend_s_i32);
                else if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.ULong)
                    w.uint8(WASM.OpCode.i64_extend_s_i32);
                else if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_convert_s_i32);
                else if (t0 == datatype_1.DataType.Int && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_convert_s_i32);
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Long)
                    w.uint8(WASM.OpCode.i64_extend_u_i32);
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.ULong)
                    w.uint8(WASM.OpCode.i64_extend_u_i32);
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_convert_u_i32);
                else if (t0 == datatype_1.DataType.UInt && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_convert_u_i32);
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Int)
                    w.uint8(WASM.OpCode.i32_wrap_i64);
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.UInt)
                    w.uint8(WASM.OpCode.i32_wrap_i64);
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_convert_s_i64);
                else if (t0 == datatype_1.DataType.Long && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_convert_s_i64);
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Int)
                    w.uint8(WASM.OpCode.i32_wrap_i64);
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.UInt)
                    w.uint8(WASM.OpCode.i32_wrap_i64);
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_convert_u_i64);
                else if (t0 == datatype_1.DataType.ULong && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_convert_u_i64);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Int)
                    w.uint8(WASM.OpCode.i32_trunc_s_f32);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.UInt)
                    w.uint8(WASM.OpCode.i32_trunc_u_f32);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Long)
                    w.uint8(WASM.OpCode.i64_trunc_s_f32);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.ULong)
                    w.uint8(WASM.OpCode.i64_trunc_u_f32);
                else if (t0 == datatype_1.DataType.Float && t1 == datatype_1.DataType.Double)
                    w.uint8(WASM.OpCode.f64_promote_f32);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Int)
                    w.uint8(WASM.OpCode.i32_trunc_s_f64);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.UInt)
                    w.uint8(WASM.OpCode.i32_trunc_u_f64);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Long)
                    w.uint8(WASM.OpCode.i64_trunc_s_f64);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.ULong)
                    w.uint8(WASM.OpCode.i64_trunc_u_f64);
                else if (t0 == datatype_1.DataType.Double && t1 == datatype_1.DataType.Float)
                    w.uint8(WASM.OpCode.f32_demote_f64);
            }
            else if (n.token.type == token_1.TokenType.And) {
                this.gen(w, n.children[0]);
                w.uint8(WASM.OpCode.if);
                w.uint8(WASM.LangType.i32);
                this.gen(w, n.children[1]);
                w.uint8(WASM.OpCode.else);
                w.uint8(WASM.OpCode.i32_const);
                w.varintN(0, 32);
                w.uint8(WASM.OpCode.end);
            }
            else if (n.token.type == token_1.TokenType.Or) {
                this.gen(w, n.children[0]);
                w.uint8(WASM.OpCode.if);
                w.uint8(WASM.LangType.i32);
                w.uint8(WASM.OpCode.i32_const);
                w.varintN(1, 32);
                w.uint8(WASM.OpCode.else);
                this.gen(w, n.children[1]);
                w.uint8(WASM.OpCode.end);
            }
            else {
                this.gen(w, n.children[0]);
                this.gen(w, n.children[1]);
                if (n.token.type == token_1.TokenType.Add) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_add);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_add);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_add);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_add);
                }
                else if (n.token.type == token_1.TokenType.Sub) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_sub);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_sub);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_sub);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_sub);
                }
                else if (n.token.type == token_1.TokenType.Mul) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_mul);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_mul);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_mul);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_mul);
                }
                else if (n.token.type == token_1.TokenType.Div) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_div_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_div_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_div_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_div_u);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_div);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_div);
                }
                else if (n.token.type == token_1.TokenType.Mod) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_rem_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_rem_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_rem_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_rem_u);
                }
                else if (n.token.type == token_1.TokenType.AND) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt || t == datatype_1.DataType.Bool)
                        w.uint8(WASM.OpCode.i32_and);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_and);
                }
                else if (n.token.type == token_1.TokenType.OR) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt || t == datatype_1.DataType.Bool)
                        w.uint8(WASM.OpCode.i32_or);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_or);
                }
                else if (n.token.type == token_1.TokenType.XOR) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt || t == datatype_1.DataType.Bool)
                        w.uint8(WASM.OpCode.i32_xor);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_xor);
                }
                else if (n.token.type == token_1.TokenType.ShL) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_shl);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_shl);
                }
                else if (n.token.type == token_1.TokenType.ShR) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_shr_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_shr_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_shr_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_shr_u);
                }
                else if (n.token.type == token_1.TokenType.RotL) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_rotl);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_rotl);
                }
                else if (n.token.type == token_1.TokenType.RotR) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_rotr);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_rotr);
                }
                // Switch on the type of the children, not the op itself (for comparison ops, their type is always bool)
                t = n.children[0].dataType;
                if (n.token.type == token_1.TokenType.Eq) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt || t == datatype_1.DataType.Bool)
                        w.uint8(WASM.OpCode.i32_eq);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_eq);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_eq);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_eq);
                }
                else if (n.token.type == token_1.TokenType.Ne) {
                    if (t == datatype_1.DataType.Int || t == datatype_1.DataType.UInt || t == datatype_1.DataType.Bool)
                        w.uint8(WASM.OpCode.i32_ne);
                    else if (t == datatype_1.DataType.Long || t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_ne);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_ne);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_ne);
                }
                else if (n.token.type == token_1.TokenType.Lt) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_lt_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_lt_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_lt_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_lt_u);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_lt);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_lt);
                }
                else if (n.token.type == token_1.TokenType.Le) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_le_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_le_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_le_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_le_u);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_le);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_le);
                }
                else if (n.token.type == token_1.TokenType.Gt) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_gt_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_gt_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_gt_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_gt_u);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_gt);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_gt);
                }
                else if (n.token.type == token_1.TokenType.Ge) {
                    if (t == datatype_1.DataType.Int)
                        w.uint8(WASM.OpCode.i32_ge_s);
                    else if (t == datatype_1.DataType.UInt)
                        w.uint8(WASM.OpCode.i32_ge_u);
                    else if (t == datatype_1.DataType.Long)
                        w.uint8(WASM.OpCode.i64_ge_s);
                    else if (t == datatype_1.DataType.ULong)
                        w.uint8(WASM.OpCode.i64_ge_u);
                    else if (t == datatype_1.DataType.Float)
                        w.uint8(WASM.OpCode.f32_ge);
                    else if (t == datatype_1.DataType.Double)
                        w.uint8(WASM.OpCode.f64_ge);
                }
            }
        });
        this.register(ast_1.AstType.FunctionCall, (w, n) => {
            for (let i = 0; i < n.children[1].children.length; i++)
                this.gen(w, n.children[1].children[i]);
            let id = this.getIdentifier(n.children[0]);
            if (!id || !id.scope)
                return;
            let func = id.scope.getFunction(id.token.value);
            if (!func)
                return;
            let path = func.getPath();
            if (path == "nop")
                w.uint8(WASM.OpCode.nop);
            else if (path == "int.loadSByte") {
                w.uint8(WASM.OpCode.i32_load8_s);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "uint.loadByte") {
                w.uint8(WASM.OpCode.i32_load8_u);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.loadShort") {
                w.uint8(WASM.OpCode.i32_load16_s);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "uint.loadUShort") {
                w.uint8(WASM.OpCode.i32_load16_u);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.load" || path == "uint.load") {
                w.uint8(WASM.OpCode.i32_load);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.storeSByte" || path == "uint.storeByte") {
                w.uint8(WASM.OpCode.i32_store8);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.storeShort" || path == "uint.storeUShort") {
                w.uint8(WASM.OpCode.i32_store16);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.store" || path == "uint.store") {
                w.uint8(WASM.OpCode.i32_store);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.loadSByte") {
                w.uint8(WASM.OpCode.i64_load8_s);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "ulong.loadByte") {
                w.uint8(WASM.OpCode.i64_load8_u);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.loadShort") {
                w.uint8(WASM.OpCode.i64_load16_s);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "ulong.loadUShort") {
                w.uint8(WASM.OpCode.i64_load16_u);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.loadInt") {
                w.uint8(WASM.OpCode.i64_load32_s);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "ulong.loadUInt") {
                w.uint8(WASM.OpCode.i64_load32_u);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.load" || path == "ulong.load") {
                w.uint8(WASM.OpCode.i64_load);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.storeSByte" || path == "ulong.storeByte") {
                w.uint8(WASM.OpCode.i64_store8);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.storeShort" || path == "ulong.storeUShort") {
                w.uint8(WASM.OpCode.i64_store16);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.storeInt" || path == "ulong.storeUInt") {
                w.uint8(WASM.OpCode.i64_store32);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "long.store" || path == "ulong.store") {
                w.uint8(WASM.OpCode.i64_store);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "float.load") {
                w.uint8(WASM.OpCode.f32_load);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "float.store") {
                w.uint8(WASM.OpCode.f32_store);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "double.load") {
                w.uint8(WASM.OpCode.f64_load);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "double.store") {
                w.uint8(WASM.OpCode.f64_store);
                w.varuintN(2, 32);
                w.varuintN(0, 32);
            }
            else if (path == "int.clz" || path == "uint.clz")
                w.uint8(WASM.OpCode.i32_clz);
            else if (path == "int.ctz" || path == "uint.ctz")
                w.uint8(WASM.OpCode.i32_ctz);
            else if (path == "int.popcnt" || path == "uint.popcnt")
                w.uint8(WASM.OpCode.i32_popcnt);
            else if (path == "int.eqz" || path == "uint.eqz")
                w.uint8(WASM.OpCode.i32_eqz);
            else if (path == "long.clz" || path == "ulong.clz")
                w.uint8(WASM.OpCode.i64_clz);
            else if (path == "long.ctz" || path == "ulong.ctz")
                w.uint8(WASM.OpCode.i64_ctz);
            else if (path == "long.popcnt" || path == "ulong.popcnt")
                w.uint8(WASM.OpCode.i64_popcnt);
            else if (path == "long.eqz" || path == "ulong.eqz")
                w.uint8(WASM.OpCode.i64_eqz);
            else if (path == "float.abs")
                w.uint8(WASM.OpCode.f32_abs);
            else if (path == "float.copysign")
                w.uint8(WASM.OpCode.f32_copysign);
            else if (path == "float.ceil")
                w.uint8(WASM.OpCode.f32_ceil);
            else if (path == "float.floor")
                w.uint8(WASM.OpCode.f32_floor);
            else if (path == "float.truncate")
                w.uint8(WASM.OpCode.f32_trunc);
            else if (path == "float.round")
                w.uint8(WASM.OpCode.f32_nearest);
            else if (path == "float.sqrt")
                w.uint8(WASM.OpCode.f32_sqrt);
            else if (path == "float.min")
                w.uint8(WASM.OpCode.f32_min);
            else if (path == "float.max")
                w.uint8(WASM.OpCode.f32_max);
            else if (path == "double.abs")
                w.uint8(WASM.OpCode.f64_abs);
            else if (path == "double.copysign")
                w.uint8(WASM.OpCode.f64_copysign);
            else if (path == "double.ceil")
                w.uint8(WASM.OpCode.f64_ceil);
            else if (path == "double.floor")
                w.uint8(WASM.OpCode.f64_floor);
            else if (path == "double.truncate")
                w.uint8(WASM.OpCode.f64_trunc);
            else if (path == "double.round")
                w.uint8(WASM.OpCode.f64_nearest);
            else if (path == "double.sqrt")
                w.uint8(WASM.OpCode.f64_sqrt);
            else if (path == "double.min")
                w.uint8(WASM.OpCode.f64_min);
            else if (path == "double.max")
                w.uint8(WASM.OpCode.f64_max);
            else {
                w.uint8(WASM.OpCode.call);
                w.varuintN(this.funcPathToIndex[path], 32);
            }
        });
        this.register(ast_1.AstType.Assignment, (w, n) => {
            let id = this.getIdentifier(n.children[0]);
            if (!id || !id.scope)
                return;
            let nvar = id.scope.getVariable(id.token.value);
            if (nvar) {
                if (!datatype_1.DataType.isPrimitive(nvar.type)) {
                    if (nvar.node)
                        this.logError('Non-primitive types cannot be directly assigned to', nvar.node);
                    return;
                }
                if (nvar.mapped) {
                    w.uint8(WASM.OpCode.i32_const);
                    w.varintN(nvar.offset, 32);
                    this.gen(w, n.children[1]);
                    if (nvar.type == datatype_1.DataType.Int || nvar.type == datatype_1.DataType.UInt || nvar.type == datatype_1.DataType.Bool) {
                        w.uint8(WASM.OpCode.i32_store);
                    }
                    else if (nvar.type == datatype_1.DataType.Long || nvar.type == datatype_1.DataType.ULong) {
                        w.uint8(WASM.OpCode.i64_store);
                    }
                    else if (nvar.type == datatype_1.DataType.Float) {
                        w.uint8(WASM.OpCode.f32_store);
                    }
                    else if (nvar.type == datatype_1.DataType.Double) {
                        w.uint8(WASM.OpCode.f64_store);
                    }
                    w.varuintN(2, 32);
                    w.varuintN(0, 32);
                }
                else {
                    this.gen(w, n.children[1]);
                    if (nvar.global)
                        w.uint8(WASM.OpCode.set_global);
                    else
                        w.uint8(WASM.OpCode.set_local);
                    w.varuintN(this.varPathToIndex[nvar.getPath()], 32);
                }
            }
        });
        this.register(ast_1.AstType.If, (w, n) => {
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.if);
            w.uint8(WASM.LangType.void);
            this.gen(w, n.children[1]);
            if (n.parent) {
                let sibling = n.parent.children[n.parent.children.indexOf(n) + 1];
                if (!sibling || (sibling.type != ast_1.AstType.Else && sibling.type != ast_1.AstType.ElseIf))
                    w.uint8(WASM.OpCode.end);
            }
        });
        this.register(ast_1.AstType.Else, (w, n) => {
            if (n.generated)
                return;
            w.uint8(WASM.OpCode.else);
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.end);
        });
        this.register(ast_1.AstType.ElseIf, (w, n) => {
            if (n.generated)
                return;
            w.uint8(WASM.OpCode.else);
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.if);
            w.uint8(WASM.LangType.void);
            this.gen(w, n.children[1]);
            if (n.parent) {
                let sibling = n.parent.children[n.parent.children.indexOf(n) + 1];
                if (sibling && (sibling.type == ast_1.AstType.Else || sibling.type == ast_1.AstType.ElseIf)) {
                    this.gen(w, sibling);
                }
                else {
                    w.uint8(WASM.OpCode.end);
                }
            }
            w.uint8(WASM.OpCode.end);
        });
        this.register(ast_1.AstType.While, (w, n) => {
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.if);
            w.uint8(WASM.LangType.void);
            w.uint8(WASM.OpCode.loop);
            w.uint8(WASM.LangType.void);
            this.gen(w, n.children[1]);
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.br_if);
            w.varuintN(0, 32);
            w.uint8(WASM.OpCode.end);
            w.uint8(WASM.OpCode.end);
        });
        this.register(ast_1.AstType.Break, (w, n) => {
            w.uint8(WASM.OpCode.br);
            w.varuintN(1, 32);
        });
        this.register(ast_1.AstType.Continue, (w, n) => {
            w.uint8(WASM.OpCode.br);
            w.varuintN(0, 32);
        });
        this.register(ast_1.AstType.Return, (w, n) => {
            this.gen(w, n.children[0]);
            w.uint8(WASM.OpCode.return);
        });
        this.register(ast_1.AstType.ReturnVoid, (w, n) => {
            w.uint8(WASM.OpCode.return);
        });
        this.register(ast_1.AstType.Comment, (w, n) => { });
        this.register(ast_1.AstType.Block, (w, n) => {
            for (let i = 0; i < n.children.length; i++)
                this.gen(w, n.children[i]);
        });
    }
    getIdentifier(node) {
        if (node.type == ast_1.AstType.FunctionId || node.type == ast_1.AstType.VariableId)
            return node;
        if (node.type == ast_1.AstType.VariableDef)
            return this.getIdentifier(node.children[0]);
        if (node.type == ast_1.AstType.Access)
            return this.getIdentifier(node.children[1]);
        return null;
    }
    stripNum(str) {
        if (this.parseRadix(str) != 10)
            str = str.substring(2);
        if (str.endsWith("L"))
            str = str.substring(0, str.length - 1);
        if (str.endsWith("u"))
            str = str.substring(0, str.length - 1);
        if (str.endsWith("f"))
            str = str.substring(0, str.length - 1);
        return str;
    }
    parseRadix(str) {
        if (str.startsWith('0x'))
            return 16;
        if (str.startsWith('0o'))
            return 8;
        if (str.startsWith('0b'))
            return 2;
        return 10;
    }
    parseToInt(str) {
        let radix = this.parseRadix(str);
        str = this.stripNum(str);
        return parseInt(str, radix);
    }
    parseToFloat(str) {
        let radix = this.parseRadix(str);
        str = this.stripNum(str);
        let bits = str.split(/\./);
        if (bits[0] == '')
            bits[0] = '0';
        if (bits.length > 1 && bits[1] != '') {
            let n = parseInt(bits[1], radix);
            n *= Math.pow(radix, -bits[1].length);
            return parseInt(bits[0], radix) + n;
        }
        return parseInt(bits[0], radix);
    }
    parseToLong(str) {
        let radix = this.parseRadix(str);
        let unsigned = str.endsWith('uL') || str.endsWith('u');
        str = this.stripNum(str);
        return Long.fromString(str, unsigned, radix);
    }
}
exports.SchwaGenerator = SchwaGenerator;
