import { TokenType } from './token'
import { AstNode, AstType } from './ast'
import { Logger, LogMsg, LogType } from './log'
import { DataType } from './datatype'
import { Scope, Function, Variable } from './scope'
import * as utils from './utils'
import { Module } from './compiler'

import * as WASM from './wasm'
import { Writer } from './io'
import * as Long from 'long'

export type GenerateRule = (w: Writer, n: AstNode) => void

export class Generator {
	protected mod: Module | undefined
	private ruleMap: { [key: string]: GenerateRule } = {}

	protected ast: AstNode | null = null
	protected funcTypes: WASM.FunctionType[] = []
	protected funcTypeIndices: number[] = []
	protected funcTypeToTypeIndex: { [key: string]: number } = {}
	protected varIndex: number = 0
	protected varPathToIndex: { [key: string]: number } = {}
	protected funcIndex: number = 0
	protected funcPathToIndex: { [key: string]: number } = {}
	protected funcBodies: WASM.FunctionBody[] = []
	protected startFuncIndex: number = -1
	protected imports: WASM.ImportEntry[] = []
	protected globals: WASM.GlobalEntry[] = []
	protected exports: WASM.ExportEntry[] = []
	protected funcNames: WASM.Naming[] = []
	protected localNames: WASM.LocalName[] = []
	protected names: WASM.NameEntry[] = []

	constructor(protected logger: Logger) { }

	public generate(mod: Module): ArrayBuffer | null {
		this.mod = mod
		if (mod.result.ast) this.ast = mod.result.ast
		this.funcTypes = []
		this.funcTypeIndices = []
		this.funcTypeToTypeIndex = {}
		this.varIndex = 0
		this.varPathToIndex = {}
		this.funcIndex = 0
		this.funcPathToIndex = {}
		this.funcBodies = []
		this.startFuncIndex = -1
		this.imports = []
		this.globals = []
		this.exports = []
		this.funcNames = []
		this.localNames = []
		this.names = []

		let writer = new Writer()
		writer.write(this.getModule(mod.name))
		if (this.logger.count(mod, LogType.Error) > 0) return null
		return writer.toArrayBuffer()
	}

	protected register(type: AstType, rule: GenerateRule) {
		this.ruleMap[type] = rule
	}

	protected gen(w: Writer, node: AstNode): void {
		if (!node) return
		let rule = this.ruleMap[node.type]
		if (rule) rule(w, node)
		else this.logError('No generation rule exists for ' + node.type, node)
		node.generated = true
	}

	private getModule(name: string): WASM.Module {
		if (this.ast && this.ast.scope) {
			for (let id in this.ast.scope.funcs) this.addFunctionImport(this.ast.scope.funcs[id])
			for (let id in this.ast.scope.vars) this.addGlobalImport(this.ast.scope.vars[id])
			for (let id in this.ast.scope.funcs) this.addFunction(this.ast.scope.funcs[id])
			for (let id in this.ast.scope.vars) this.addGlobal(this.ast.scope.vars[id])
			for (let id in this.ast.scope.funcs) this.addFunctionBody(this.ast.scope.funcs[id])
		}

		// Importing memory needs its own syntax
		//this.imports.push(new WASM.ImportEntry('memory', 'memory', WASM.ExternalKind.Memory, new WASM.MemoryType(new WASM.ResizableLimits(1))))

		this.exports.push(new WASM.ExportEntry('memory', WASM.ExternalKind.Memory, 0))

		if (name) this.names.push(new WASM.NameEntry(WASM.NameType.Module, name))
		this.names.push(new WASM.NameEntry(WASM.NameType.Function, new WASM.NameMap(this.funcNames)))
		this.names.push(new WASM.NameEntry(WASM.NameType.Local, new WASM.LocalNames(this.localNames)))

		let sections: WASM.Section[] = []
		sections.push(new WASM.TypeSection(this.funcTypes))
		sections.push(new WASM.ImportSection(this.imports))
		sections.push(new WASM.FunctionSection(this.funcTypeIndices))
		sections.push(new WASM.MemorySection([new WASM.MemoryType(new WASM.ResizableLimits(1))]))
		sections.push(new WASM.GlobalSection(this.globals))
		sections.push(new WASM.ExportSection(this.exports))
		if (this.startFuncIndex >= 0) sections.push(new WASM.StartSection(this.startFuncIndex))
		sections.push(new WASM.CodeSection(this.funcBodies))
		sections.push(new WASM.NameSection(this.names))
		return new WASM.Module(sections)
	}

	private addFunctionImport(func: Function): void {
		if (!func.import || !func.node) return
		this.funcPathToIndex[func.getPath()] = this.funcIndex

		let localNamings: WASM.Naming[] = []
		let params: WASM.LangType[] = []
		let paramIndex = 0
		for (let i = 0; i < func.params.length; i++) {
			let vars = this.getPrimitiveVars(func.params[i])
			for (let param of vars) {
				let type = this.toWasmType(param.type)
				if (!type) continue
				params.push(type)
				localNamings.push(new WASM.Naming(paramIndex, param.getPath(true, true)))
				this.varPathToIndex[param.getPath()] = paramIndex++
			}
		}
		let returns: WASM.LangType[] = []

		if (func.type != DataType.None) {
			let returnType = this.toWasmType(func.type)
			if (!returnType) {
				this.logError('Functions can only return primitive types', func.node)
				return
			}
			returns.push(returnType)
		}

		let typeStr = params.join() + ':' + returns.join()
		let sigIndex
		if (this.funcTypeToTypeIndex[typeStr]) {
			sigIndex = this.funcTypeToTypeIndex[typeStr]
		} else {
			this.funcTypes.push(new WASM.FunctionType(params, returns))
			sigIndex = this.funcTypes.length - 1
			this.funcTypeToTypeIndex[typeStr] = sigIndex
		}

		this.funcNames.push(new WASM.Naming(this.funcPathToIndex[func.getPath()], func.id))
		this.localNames.push(new WASM.LocalName(this.funcPathToIndex[func.getPath()], new WASM.NameMap(localNamings)))

		this.imports.push(new WASM.ImportEntry(func.import, func.getPath(false), WASM.ExternalKind.Function, sigIndex))
		if (func.export) this.exports.push(new WASM.ExportEntry(func.id, WASM.ExternalKind.Function, this.funcPathToIndex[func.getPath()]))
		
		this.funcIndex++
	}

	private addGlobalImport(global: Variable): void {
		if (!global.import || global.mapped) return
		let vars = this.getPrimitiveVars(global)
		for (let gvar of vars) {
			let type = this.toWasmType(gvar.type)
			if (!type) continue
			this.varPathToIndex[gvar.getPath()] = this.varIndex

			this.imports.push(new WASM.ImportEntry(global.import, global.getPath(false), WASM.ExternalKind.Global, new WASM.GlobalType(type, !global.const)))
			if (gvar.export) this.exports.push(new WASM.ExportEntry(gvar.getPath(true, true), WASM.ExternalKind.Global, this.varIndex))

			this.varIndex++
		}
	}

	private addFunction(func: Function): void {
		if (func.import) return
		this.funcPathToIndex[func.getPath()] = this.funcIndex
		if (func.id == 'main') this.startFuncIndex = this.funcIndex
		this.funcIndex++
	}

	private addFunctionBody(func: Function): void {
		if (func.import) return
		if (!func.node) return
		let funcBody = func.node.children[2]
		if (!funcBody) return

		let localNamings: WASM.Naming[] = []
		let params: WASM.LangType[] = []
		let paramIndex = 0
		for (let i = 0; i < func.params.length; i++) {
			let vars = this.getPrimitiveVars(func.params[i])
			for (let param of vars) {
				let type = this.toWasmType(param.type)
				if (!type) continue
				params.push(type)
				localNamings.push(new WASM.Naming(paramIndex, param.getPath()))
				this.varPathToIndex[param.getPath()] = paramIndex++
			}
		}
		let returns: WASM.LangType[] = []

		if (func.type != DataType.None) {
			let returnType = this.toWasmType(func.type)
			if (!returnType) {
				this.logError('Functions can only return primitive types', func.node)
				return
			}
			returns.push(returnType)
		}

		let typeStr = params.join() + ':' + returns.join()
		let index
		if (this.funcTypeToTypeIndex[typeStr]) {
			index = this.funcTypeToTypeIndex[typeStr]
		} else {
			this.funcTypes.push(new WASM.FunctionType(params, returns))
			index = this.funcTypes.length - 1
			this.funcTypeToTypeIndex[typeStr] = index
		}
		this.funcTypeIndices.push(index)

		let locals: WASM.LocalEntry[] = []
		this.addLocals(locals, localNamings, func.node, params.length)

		let writer = new Writer()
		this.gen(writer, funcBody)
		this.funcBodies.push(new WASM.FunctionBody(locals, writer.toTypedArray()))

		this.funcNames.push(new WASM.Naming(this.funcPathToIndex[func.getPath()], func.id))
		this.localNames.push(new WASM.LocalName(this.funcPathToIndex[func.getPath()], new WASM.NameMap(localNamings)))

		if (func.export) this.exports.push(new WASM.ExportEntry(func.id, WASM.ExternalKind.Function, this.funcPathToIndex[func.getPath()]))
	}

	private addLocals(locals: WASM.LocalEntry[], localNamings: WASM.Naming[], node: AstNode, index: number): number {
		let c = node.children[0]
		if (c && node.parent && node.scope && node.type == AstType.VariableDef && node.parent.type != AstType.Parameters) {
			let localVar = node.scope.getVariable(c.token.value)
			if (localVar) {
				let vars = this.getPrimitiveVars(localVar)
				for (let lvar of vars) {
					let type = this.toWasmType(lvar.type)
					if (!type) continue
					let local = new WASM.LocalEntry(1, type)
					localNamings.push(new WASM.Naming(index, lvar.getPath()))
					this.varPathToIndex[lvar.getPath()] = index++
					locals.push(local)
				}
			}
		}
		for (let i = 0; i < node.children.length; i++) {
			let c = node.children[i]
			if (!c) continue
			index = this.addLocals(locals, localNamings, c, index)
		}
		return index
	}

	private addGlobal(global: Variable): void {
		if (global.mapped || global.import) return
		let vars = this.getPrimitiveVars(global)
		for (let gvar of vars) {
			let type = this.toWasmType(gvar.type)
			if (!type) continue
			let initExpr: Uint8Array | null = null
			if (gvar.node && gvar.node.parent) {
				let initBody = gvar.node.parent.children[1]
				if (initBody) {
					let writer = new Writer()
					this.varPathToIndex[gvar.getPath()] = this.varIndex
					this.gen(writer, initBody)
					initExpr = writer.toTypedArray()
				}
			}
			if (!initExpr) initExpr = this.getDefaultInitializer(gvar.type)
			if (gvar.export) this.exports.push(new WASM.ExportEntry(gvar.getPath(), WASM.ExternalKind.Global, this.varIndex))
			this.globals.push(new WASM.GlobalEntry(new WASM.GlobalType(type, !gvar.const), new WASM.InitializerExpression(initExpr)))
			this.varIndex++
		}
	}

	private toWasmType(type: string): WASM.LangType | null {
		if (type == DataType.Int || type == DataType.UInt || type == DataType.Bool) return WASM.LangType.i32
		if (type == DataType.Long || type == DataType.ULong) return WASM.LangType.i64
		if (type == DataType.Float) return WASM.LangType.f32
		if (type == DataType.Double) return WASM.LangType.f64
		return null
	}

	private getDefaultInitializer(type: string): Uint8Array {
		let w = new Writer()
		if (type == DataType.Int || type == DataType.UInt || type == DataType.Bool) {
			w.uint8(WASM.OpCode.i32_const)
			w.varintN(0, 32)
		} else if (type == DataType.Long || type == DataType.ULong) {
			w.uint8(WASM.OpCode.i64_const)
			w.varintN(0, 32)
		} else if (type == DataType.Float) {
			w.uint8(WASM.OpCode.f32_const)
			let arr = new Float32Array(1)
			arr[0] = 0
			w.bytes(new Uint8Array(arr.buffer))
		} else if (type == DataType.Double) {
			w.uint8(WASM.OpCode.f64_const)
			let arr = new Float64Array(1)
			arr[0] = 0
			w.bytes(new Uint8Array(arr.buffer))
		}
		return w.toTypedArray()
	}

	protected getPrimitiveVars(nvar: Variable): Variable[] {
		if (DataType.isPrimitive(nvar.type)) return [nvar]
		let out: Variable[] = []
		let scope = nvar.scope.scopes[nvar.id]
		if (scope) {
			for (let key in scope.vars) out = out.concat(this.getPrimitiveVars(scope.vars[key]))
		}
		return out
	}

	protected logError(msg: string, node: AstNode) {
		this.logger.log(new LogMsg(LogType.Error, 'Generator', msg, this.mod, node.token.row, node.token.column, node.token.value.length))
	}
}

export class SchwaGenerator extends Generator {
	constructor(logger: Logger) {
		super(logger)

		this.register(AstType.Indexer, (w, n) => {
			let r = n.children[1]
			if (r && n.scope && n.scope.parent) {
				let nvar = n.scope.parent.getVariable(n.scope.id)
				if (nvar) {
					w.uint8(WASM.OpCode.i32_const)
					w.varintN(nvar.size, 32)
					this.gen(w, r)
					w.uint8(WASM.OpCode.i32_mul)
				}
			}
		})

		this.register(AstType.Access, (w, n) => {
			let r = n.children[1]
			if (r && n.parent && n.parent.type != AstType.Access && n.parent.type != AstType.Indexer) this.gen(w, r)
		})

		this.register(AstType.VariableId, (w, n) => {
			if (!n.scope) return
			let nodeVar = n.scope.getVariable(n.token.value)
			if (nodeVar) {
				let indexers = []
				let node: AstNode | undefined | null = null
				if (n.parent && (n.parent.type == AstType.Access || n.parent.type == AstType.Indexer)) node = n.parent
				while (node && node.children[0]) node = node.children[0]
				while (node) {
					if (node.type == AstType.Indexer) indexers.push(node)
					node = node.parent
				}

				let vars = this.getPrimitiveVars(nodeVar)
				for (let nvar of vars) {
					if (nvar.mapped) {
						if (indexers.length > 0) {
							for (let i = 0; i < indexers.length; i++) {
								this.gen(w, indexers[i])
								if (i > 0) w.uint8(WASM.OpCode.i32_add)
							}
						} else {
							w.uint8(WASM.OpCode.i32_const)
							w.varintN(0, 32)
						}

						if (nvar.type == DataType.Int || nvar.type == DataType.UInt || nvar.type == DataType.Bool) {
							w.uint8(WASM.OpCode.i32_load)
						} else if (nvar.type == DataType.Long || nvar.type == DataType.ULong) {
							w.uint8(WASM.OpCode.i64_load)
						} else if (nvar.type == DataType.Float) {
							w.uint8(WASM.OpCode.f32_load)
						} else if (nvar.type == DataType.Double) {
							w.uint8(WASM.OpCode.f64_load)
						}
						w.varuintN(2, 32)
						w.varuintN(nvar.offset, 32)
					} else {
						if (nvar.global || nvar.import) w.uint8(WASM.OpCode.get_global)
						else w.uint8(WASM.OpCode.get_local)
						w.varuintN(this.varPathToIndex[nvar.getPath()], 32)
					}
				}
			}
		})

		this.register(AstType.Literal, (w, n) => {
			if (n.dataType == DataType.Bool) {
				w.uint8(WASM.OpCode.i32_const)
				w.varintN(n.token.value == 'true' ? 1 : 0, 32)
			} else if (n.dataType == DataType.Int) {
				w.uint8(WASM.OpCode.i32_const)
				w.varintN(parseInt(this.stripNum(n.token.value)), 32)
			} else if (n.dataType == DataType.UInt) {
				w.uint8(WASM.OpCode.i32_const)
				w.varintN(parseInt(this.stripNum(n.token.value)), 32)
			} else if (n.dataType == DataType.Long) {
				w.uint8(WASM.OpCode.i64_const)
				w.varintLong(Long.fromString(this.stripNum(n.token.value)))
			} else if (n.dataType == DataType.ULong) {
				w.uint8(WASM.OpCode.i64_const)
				w.varintLong(Long.fromString(this.stripNum(n.token.value)))
			} else if (n.dataType == DataType.Float) {
				w.uint8(WASM.OpCode.f32_const)
				let arr = new Float32Array(1)
				arr[0] = parseFloat(this.stripNum(n.token.value))
				w.bytes(new Uint8Array(arr.buffer))
			} else if (n.dataType == DataType.Double) {
				w.uint8(WASM.OpCode.f64_const)
				let arr = new Float64Array(1)
				arr[0] = parseFloat(this.stripNum(n.token.value))
				w.bytes(new Uint8Array(arr.buffer))
			}
		})

		this.register(AstType.UnaryOp, (w, n) => {
			let t = n.dataType
			let c = n.children[0]
			if (!c) return

			if (n.token.type == TokenType.Neg) {
				if (t == DataType.Int) {
					w.uint8(WASM.OpCode.i32_const)
					w.varintN(0, 32)
					this.gen(w, c)
					w.uint8(WASM.OpCode.i32_sub)
				} else if (t == DataType.Long) {
					w.uint8(WASM.OpCode.i64_const)
					w.varintN(0, 64)
					this.gen(w, c)
					w.uint8(WASM.OpCode.i64_sub)
				} else if (t == DataType.Float) {
					this.gen(w, c)
					w.uint8(WASM.OpCode.f32_neg)
				}
				else if (t == DataType.Double) {
					this.gen(w, c)
					w.uint8(WASM.OpCode.f64_neg)
				}
			}
			else if (n.token.type == TokenType.NOT) {
				if (t == DataType.Int || t == DataType.UInt) {
					w.uint8(WASM.OpCode.i32_const)
					w.varintN(-1, 32)
					this.gen(w, c)
					w.uint8(WASM.OpCode.i32_xor)
				}
				else if (t == DataType.Long || t == DataType.ULong) {
					w.uint8(WASM.OpCode.i64_const)
					w.varintN(-1, 64)
					this.gen(w, c)
					w.uint8(WASM.OpCode.i64_xor)
				}
			}
			else if (n.token.type == TokenType.Not) {
				this.gen(w, c)
				w.uint8(WASM.OpCode.i32_eqz)
			}
			else this.logError('Unknown unary op ' + n.token.type, n)
		})

		this.register(AstType.BinaryOp, (w, n) => {
			let t = n.dataType
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return

			if (n.token.type == TokenType.Onto) {
				let t0 = l.dataType
				let t1 = r.token.value

				this.gen(w, l)

				if (t0 == DataType.Int && t1 == DataType.UInt) { /* nop */ }
				else if (t0 == DataType.Int && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_reinterpret_i32)
				else if (t0 == DataType.UInt && t1 == DataType.Int) { /* nop */ }
				else if (t0 == DataType.UInt && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_reinterpret_i32)
				else if (t0 == DataType.Long && t1 == DataType.ULong) { /* nop */ }
				else if (t0 == DataType.Long && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_reinterpret_i64)
				else if (t0 == DataType.ULong && t1 == DataType.Long) { /* nop */ }
				else if (t0 == DataType.ULong && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_reinterpret_i64)
				else if (t0 == DataType.Float && t1 == DataType.Int) w.uint8(WASM.OpCode.i32_reinterpret_f32)
				else if (t0 == DataType.Float && t1 == DataType.UInt) w.uint8(WASM.OpCode.i32_reinterpret_f32)
				else if (t0 == DataType.Double && t1 == DataType.Long) w.uint8(WASM.OpCode.i64_reinterpret_f64)
				else if (t0 == DataType.Double && t1 == DataType.ULong) w.uint8(WASM.OpCode.i64_reinterpret_f64)
			} else if (n.token.type == TokenType.To) {
				let t0 = l.dataType
				let t1 = r.token.value

				this.gen(w, l)

				if (t0 == DataType.Int && t1 == DataType.Long) w.uint8(WASM.OpCode.i64_extend_s_i32)
				else if (t0 == DataType.Int && t1 == DataType.ULong) w.uint8(WASM.OpCode.i64_extend_s_i32)
				else if (t0 == DataType.Int && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_convert_s_i32)
				else if (t0 == DataType.Int && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_convert_s_i32)
				else if (t0 == DataType.UInt && t1 == DataType.Long) w.uint8(WASM.OpCode.i64_extend_u_i32)
				else if (t0 == DataType.UInt && t1 == DataType.ULong) w.uint8(WASM.OpCode.i64_extend_u_i32)
				else if (t0 == DataType.UInt && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_convert_u_i32)
				else if (t0 == DataType.UInt && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_convert_u_i32)
				else if (t0 == DataType.Long && t1 == DataType.Int) w.uint8(WASM.OpCode.i32_wrap_i64)
				else if (t0 == DataType.Long && t1 == DataType.UInt) w.uint8(WASM.OpCode.i32_wrap_i64)
				else if (t0 == DataType.Long && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_convert_s_i64)
				else if (t0 == DataType.Long && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_convert_s_i64)
				else if (t0 == DataType.ULong && t1 == DataType.Int) w.uint8(WASM.OpCode.i32_wrap_i64)
				else if (t0 == DataType.ULong && t1 == DataType.UInt) w.uint8(WASM.OpCode.i32_wrap_i64)
				else if (t0 == DataType.ULong && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_convert_u_i64)
				else if (t0 == DataType.ULong && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_convert_u_i64)
				else if (t0 == DataType.Float && t1 == DataType.Int) w.uint8(WASM.OpCode.i32_trunc_s_f32)
				else if (t0 == DataType.Float && t1 == DataType.UInt) w.uint8(WASM.OpCode.i32_trunc_u_f32)
				else if (t0 == DataType.Float && t1 == DataType.Long) w.uint8(WASM.OpCode.i64_trunc_s_f32)
				else if (t0 == DataType.Float && t1 == DataType.ULong) w.uint8(WASM.OpCode.i64_trunc_u_f32)
				else if (t0 == DataType.Float && t1 == DataType.Double) w.uint8(WASM.OpCode.f64_promote_f32)
				else if (t0 == DataType.Double && t1 == DataType.Int) w.uint8(WASM.OpCode.i32_trunc_s_f64)
				else if (t0 == DataType.Double && t1 == DataType.UInt) w.uint8(WASM.OpCode.i32_trunc_u_f64)
				else if (t0 == DataType.Double && t1 == DataType.Long) w.uint8(WASM.OpCode.i64_trunc_s_f64)
				else if (t0 == DataType.Double && t1 == DataType.ULong) w.uint8(WASM.OpCode.i64_trunc_u_f64)
				else if (t0 == DataType.Double && t1 == DataType.Float) w.uint8(WASM.OpCode.f32_demote_f64)
			} else if (n.token.type == TokenType.And) {
				this.gen(w, l)
				w.uint8(WASM.OpCode.if)
				w.uint8(WASM.LangType.i32)
				this.gen(w, r)
				w.uint8(WASM.OpCode.else)
				w.uint8(WASM.OpCode.i32_const)
				w.varintN(0, 32)
				w.uint8(WASM.OpCode.end)
			} else if (n.token.type == TokenType.Or) {
				this.gen(w, l)
				w.uint8(WASM.OpCode.if)
				w.uint8(WASM.LangType.i32)
				w.uint8(WASM.OpCode.i32_const)
				w.varintN(1, 32)
				w.uint8(WASM.OpCode.else)
				this.gen(w, r)
				w.uint8(WASM.OpCode.end)
			}
			else {
				this.gen(w, l)
				this.gen(w, r)

				if (n.token.type == TokenType.Add) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_add)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_add)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_add)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_add)
				} else if (n.token.type == TokenType.Sub) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_sub)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_sub)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_sub)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_sub)
				} else if (n.token.type == TokenType.Mul) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_mul)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_mul)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_mul)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_mul)
				} else if (n.token.type == TokenType.Div) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_div_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_div_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_div_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_div_u)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_div)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_div)
				} else if (n.token.type == TokenType.Mod) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_rem_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_rem_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_rem_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_rem_u)
				} else if (n.token.type == TokenType.AND) {
					if (t == DataType.Int || t == DataType.UInt || t == DataType.Bool) w.uint8(WASM.OpCode.i32_and)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_and)
				} else if (n.token.type == TokenType.OR) {
					if (t == DataType.Int || t == DataType.UInt || t == DataType.Bool) w.uint8(WASM.OpCode.i32_or)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_or)
				} else if (n.token.type == TokenType.XOR) {
					if (t == DataType.Int || t == DataType.UInt || t == DataType.Bool) w.uint8(WASM.OpCode.i32_xor)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_xor)
				} else if (n.token.type == TokenType.ShL) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_shl)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_shl)
				} else if (n.token.type == TokenType.ShR) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_shr_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_shr_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_shr_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_shr_u)
				} else if (n.token.type == TokenType.RotL) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_rotl)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_rotl)
				} else if (n.token.type == TokenType.RotR) {
					if (t == DataType.Int || t == DataType.UInt) w.uint8(WASM.OpCode.i32_rotr)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_rotr)
				}

				// Switch on the type of the children, not the op itself (for comparison ops, their type is always bool)
				t = l.dataType
				if (n.token.type == TokenType.Eq) {
					if (t == DataType.Int || t == DataType.UInt || t == DataType.Bool) w.uint8(WASM.OpCode.i32_eq)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_eq)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_eq)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_eq)
				} else if (n.token.type == TokenType.Ne) {
					if (t == DataType.Int || t == DataType.UInt || t == DataType.Bool) w.uint8(WASM.OpCode.i32_ne)
					else if (t == DataType.Long || t == DataType.ULong) w.uint8(WASM.OpCode.i64_ne)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_ne)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_ne)
				} else if (n.token.type == TokenType.Lt) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_lt_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_lt_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_lt_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_lt_u)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_lt)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_lt)
				} else if (n.token.type == TokenType.Le) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_le_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_le_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_le_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_le_u)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_le)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_le)
				} else if (n.token.type == TokenType.Gt) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_gt_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_gt_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_gt_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_gt_u)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_gt)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_gt)
				} else if (n.token.type == TokenType.Ge) {
					if (t == DataType.Int) w.uint8(WASM.OpCode.i32_ge_s)
					else if (t == DataType.UInt) w.uint8(WASM.OpCode.i32_ge_u)
					else if (t == DataType.Long) w.uint8(WASM.OpCode.i64_ge_s)
					else if (t == DataType.ULong) w.uint8(WASM.OpCode.i64_ge_u)
					else if (t == DataType.Float) w.uint8(WASM.OpCode.f32_ge)
					else if (t == DataType.Double) w.uint8(WASM.OpCode.f64_ge)
				}
			}
		})

		this.register(AstType.VariableDef, (w, n) => {
			let c = n.children[0]
			if (!c || c.generated) return
			this.gen(w, c)
		})

		this.register(AstType.FunctionCall, (w, n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return
			for (let i = 0; i < r.children.length; i++) {
				let c = r.children[i]
				if (c) this.gen(w, c)
			}

			let id = utils.getIdentifier(l)
			if (!id || !id.scope) return
			let func = id.scope.getFunction(id.token.value)
			if (!func) return
			let path = func.getPath()

			if (path == 'nop') w.uint8(WASM.OpCode.nop)
			else if (path == 'int.loadSByte') {
				w.uint8(WASM.OpCode.i32_load8_s)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'uint.loadByte') {
				w.uint8(WASM.OpCode.i32_load8_u)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.loadShort') {
				w.uint8(WASM.OpCode.i32_load16_s)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'uint.loadUShort') {
				w.uint8(WASM.OpCode.i32_load16_u)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.load' || path == 'uint.load') {
				w.uint8(WASM.OpCode.i32_load)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.storeSByte' || path == 'uint.storeByte') {
				w.uint8(WASM.OpCode.i32_store8)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.storeShort' || path == 'uint.storeUShort') {
				w.uint8(WASM.OpCode.i32_store16)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.store' || path == 'uint.store') {
				w.uint8(WASM.OpCode.i32_store)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.loadSByte') {
				w.uint8(WASM.OpCode.i64_load8_s)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'ulong.loadByte') {
				w.uint8(WASM.OpCode.i64_load8_u)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.loadShort') {
				w.uint8(WASM.OpCode.i64_load16_s)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'ulong.loadUShort') {
				w.uint8(WASM.OpCode.i64_load16_u)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.loadInt') {
				w.uint8(WASM.OpCode.i64_load32_s)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'ulong.loadUInt') {
				w.uint8(WASM.OpCode.i64_load32_u)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.load' || path == 'ulong.load') {
				w.uint8(WASM.OpCode.i64_load)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.storeSByte' || path == 'ulong.storeByte') {
				w.uint8(WASM.OpCode.i64_store8)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.storeShort' || path == 'ulong.storeUShort') {
				w.uint8(WASM.OpCode.i64_store16)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.storeInt' || path == 'ulong.storeUInt') {
				w.uint8(WASM.OpCode.i64_store32)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'long.store' || path == 'ulong.store') {
				w.uint8(WASM.OpCode.i64_store)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'float.load') {
				w.uint8(WASM.OpCode.f32_load)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'float.store') {
				w.uint8(WASM.OpCode.f32_store)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'double.load') {
				w.uint8(WASM.OpCode.f64_load)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'double.store') {
				w.uint8(WASM.OpCode.f64_store)
				w.varuintN(2, 32)
				w.varuintN(0, 32)
			}
			else if (path == 'int.clz' || path == 'uint.clz') w.uint8(WASM.OpCode.i32_clz)
			else if (path == 'int.ctz' || path == 'uint.ctz') w.uint8(WASM.OpCode.i32_ctz)
			else if (path == 'int.popcnt' || path == 'uint.popcnt') w.uint8(WASM.OpCode.i32_popcnt)
			else if (path == 'int.eqz' || path == 'uint.eqz') w.uint8(WASM.OpCode.i32_eqz)
			else if (path == 'long.clz' || path == 'ulong.clz') w.uint8(WASM.OpCode.i64_clz)
			else if (path == 'long.ctz' || path == 'ulong.ctz') w.uint8(WASM.OpCode.i64_ctz)
			else if (path == 'long.popcnt' || path == 'ulong.popcnt') w.uint8(WASM.OpCode.i64_popcnt)
			else if (path == 'long.eqz' || path == 'ulong.eqz') w.uint8(WASM.OpCode.i64_eqz)
			else if (path == 'float.abs') w.uint8(WASM.OpCode.f32_abs)
			else if (path == 'float.copysign') w.uint8(WASM.OpCode.f32_copysign)
			else if (path == 'float.ceil') w.uint8(WASM.OpCode.f32_ceil)
			else if (path == 'float.floor') w.uint8(WASM.OpCode.f32_floor)
			else if (path == 'float.truncate') w.uint8(WASM.OpCode.f32_trunc)
			else if (path == 'float.round') w.uint8(WASM.OpCode.f32_nearest)
			else if (path == 'float.sqrt') w.uint8(WASM.OpCode.f32_sqrt)
			else if (path == 'float.min') w.uint8(WASM.OpCode.f32_min)
			else if (path == 'float.max') w.uint8(WASM.OpCode.f32_max)
			else if (path == 'double.abs') w.uint8(WASM.OpCode.f64_abs)
			else if (path == 'double.copysign') w.uint8(WASM.OpCode.f64_copysign)
			else if (path == 'double.ceil') w.uint8(WASM.OpCode.f64_ceil)
			else if (path == 'double.floor') w.uint8(WASM.OpCode.f64_floor)
			else if (path == 'double.truncate') w.uint8(WASM.OpCode.f64_trunc)
			else if (path == 'double.round') w.uint8(WASM.OpCode.f64_nearest)
			else if (path == 'double.sqrt') w.uint8(WASM.OpCode.f64_sqrt)
			else if (path == 'double.min') w.uint8(WASM.OpCode.f64_min)
			else if (path == 'double.max') w.uint8(WASM.OpCode.f64_max)
			else {
				w.uint8(WASM.OpCode.call)
				w.varuintN(this.funcPathToIndex[path], 32)
			}
		})

		this.register(AstType.Assignment, (w, n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return
			let id = utils.getIdentifier(l)
			if (!id || !id.scope) return

			let nvar = id.scope.getVariable(id.token.value)
			if (nvar) {
				if (!DataType.isPrimitive(nvar.type)) {
					if (nvar.node) this.logError('Non-primitive types cannot be directly assigned to', nvar.node)
					return
				}
				if (nvar.mapped) {
					let indexers = []
					let node: AstNode | undefined | null = l
					while (node && node.children[0]) node = node.children[0]
					while (node) {
						if (node.type == AstType.Indexer) indexers.push(node)
						node = node.parent
					}
					if (indexers.length > 0) {
						for (let i = 0; i < indexers.length; i++) {
							this.gen(w, indexers[i])
							if (i > 0) w.uint8(WASM.OpCode.i32_add)
						}
					} else {
						w.uint8(WASM.OpCode.i32_const)
						w.varintN(0, 32)
					}
					this.gen(w, r)
					if (nvar.type == DataType.Int || nvar.type == DataType.UInt || nvar.type == DataType.Bool) {
						w.uint8(WASM.OpCode.i32_store)
					} else if (nvar.type == DataType.Long || nvar.type == DataType.ULong) {
						w.uint8(WASM.OpCode.i64_store)
					} else if (nvar.type == DataType.Float) {
						w.uint8(WASM.OpCode.f32_store)
					} else if (nvar.type == DataType.Double) {
						w.uint8(WASM.OpCode.f64_store)
					}
					w.varuintN(2, 32)
					w.varuintN(nvar.offset, 32)
				} else {
					this.gen(w, r)
					if (nvar.global) w.uint8(WASM.OpCode.set_global)
					else w.uint8(WASM.OpCode.set_local)
					w.varuintN(this.varPathToIndex[nvar.getPath()], 32)
				}
			}
		})

		this.register(AstType.If, (w, n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l) return
			this.gen(w, l)
			w.uint8(WASM.OpCode.if)
			w.uint8(WASM.LangType.void)
			if (r) this.gen(w, r)

			if (n.parent) {
				let sibling = n.parent.children[n.parent.children.indexOf(n) + 1]
				if (!sibling || (sibling.type != AstType.Else && sibling.type != AstType.ElseIf)) w.uint8(WASM.OpCode.end)
			}
		})

		this.register(AstType.Else, (w, n) => {
			if (n.generated) return
			w.uint8(WASM.OpCode.else)
			let l = n.children[0]
			if (l) this.gen(w, l)
			w.uint8(WASM.OpCode.end)
		})

		this.register(AstType.ElseIf, (w, n) => {
			if (n.generated) return
			let l = n.children[0]
			let r = n.children[1]
			if (!l) return
			w.uint8(WASM.OpCode.else)

			this.gen(w, l)
			w.uint8(WASM.OpCode.if)
			w.uint8(WASM.LangType.void)
			if (r) this.gen(w, r)

			if (n.parent) {
				let sibling = n.parent.children[n.parent.children.indexOf(n) + 1]
				if (sibling && (sibling.type == AstType.Else || sibling.type == AstType.ElseIf)) {
					this.gen(w, sibling)
				} else {
					w.uint8(WASM.OpCode.end)
				}
			}

			w.uint8(WASM.OpCode.end)
		})

		this.register(AstType.While, (w, n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l) return
			this.gen(w, l)
			w.uint8(WASM.OpCode.if)
			w.uint8(WASM.LangType.void)

			w.uint8(WASM.OpCode.loop)
			w.uint8(WASM.LangType.void)

			if (r) this.gen(w, r)

			this.gen(w, l)
			w.uint8(WASM.OpCode.br_if)
			w.varuintN(0, 32)

			w.uint8(WASM.OpCode.end)

			w.uint8(WASM.OpCode.end)
		})

		this.register(AstType.Break, (w, n) => {
			w.uint8(WASM.OpCode.br)
			w.varuintN(1, 32)
		})

		this.register(AstType.Continue, (w, n) => {
			w.uint8(WASM.OpCode.br)
			w.varuintN(0, 32)
		})

		this.register(AstType.Return, (w, n) => {
			let l = n.children[0]
			if (!l) return
			this.gen(w, l)
			w.uint8(WASM.OpCode.return)
		})

		this.register(AstType.ReturnVoid, (w, n) => {
			w.uint8(WASM.OpCode.return)
		})

		this.register(AstType.Comment, (w, n) => { })

		this.register(AstType.Block, (w, n) => {
			for (let i = 0; i < n.children.length; i++) {
				let c = n.children[i]
				if (c) this.gen(w, c)
			}
		})
	}

	private stripNum(str: string): string {
		if (this.parseRadix(str) != 10) str = str.substring(2)
		if (str.endsWith('L')) str = str.substring(0, str.length - 1)
		if (str.endsWith('u')) str = str.substring(0, str.length - 1)
		if (str.endsWith('f')) str = str.substring(0, str.length - 1)
		return str
	}

	private parseRadix(str: string): number {
		if (str.startsWith('0x')) return 16
		if (str.startsWith('0o')) return 8
		if (str.startsWith('0b')) return 2
		return 10
	}

	private parseToInt(str: string): number {
		let radix = this.parseRadix(str)
		str = this.stripNum(str)
		return parseInt(str, radix)
	}

	private parseToFloat(str: string): number {
		let radix = this.parseRadix(str)
		str = this.stripNum(str)

		let bits = str.split(/\./)
		if (bits[0] == '') bits[0] = '0'
		if (bits.length > 1 && bits[1] != '') {
			let n = parseInt(bits[1], radix)
			n *= Math.pow(radix, -bits[1].length)
			return parseInt(bits[0], radix) + n
		}
		return parseInt(bits[0], radix)
	}

	private parseToLong(str: string): Long {
		let radix = this.parseRadix(str)
		let unsigned = str.endsWith('uL') || str.endsWith('u')
		str = this.stripNum(str)
		return Long.fromString(str, unsigned, radix)
	}
}