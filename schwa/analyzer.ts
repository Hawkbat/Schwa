import { LogType, LogMsg, Logger } from "./log"
import { TokenType, Token } from "./token"
import { AstNode, AstType } from "./ast"
import { DataType } from "./datatype"
import { Scope, Struct, Function, Variable } from "./scope"
import { Module, Compiler } from "./compiler"
import * as utils from "./utils"
import * as Long from "long"

const MAX_TYPE_DEPTH = 16

function formatOrdinal(n: number): string {
	let str = n.toFixed()
	if (str != "11" && str.endsWith('1')) return str + "st"
	else if (str != "12" && str.endsWith('2')) return str + "nd"
	else if (str != "13" && str.endsWith('3')) return str + "rd"
	else return str + "th"
}

export type ScopeRule = (n: AstNode, p: Scope) => Scope
export type DataTypeRule = (n: AstNode) => string | null
export type AnalyzeRule = (n: AstNode) => void

export class Analyzer {
	protected mod: Module | undefined
	private hoistRuleMap: { [key: string]: ScopeRule[] } = {}
	private scopeRuleMap: { [key: string]: ScopeRule[] } = {}
	private dataTypeRuleMap: { [key: string]: DataTypeRule[] } = {}
	private analysisRuleMap: { [key: string]: AnalyzeRule[] } = {}

	protected rootScope: Scope = new Scope(null, null, '')
	protected imports: Module[] | undefined

	constructor(protected logger: Logger) { }

	public preAnalyze(mod: Module) {
		this.mod = mod
		if (mod.result.ast) this.hoistPass(mod.result.ast)
	}

	public analyze(mod: Module) {
		this.mod = mod
		if (mod.result.ast) {
			this.scopePass(mod.result.ast)
			this.typePass(mod.result.ast)
			this.analysisPass(mod.result.ast)
		}
	}

	public resolveImports(mod: Module, imports: Module[]) {
		this.mod = mod
		this.imports = imports
		if (mod.result.ast) this.importPass(mod.result.ast)
	}

	protected hoistPass(node: AstNode) {
		node.scope = this.hoistScope(node)
		for (let child of node.children) {
			if (!child) continue
			if (child.type == AstType.Export || child.type == AstType.Const) {
				this.hoistPass(child)
			}
		}
		for (let child of node.children) {
			if (!child) continue
			if (child.type == AstType.StructDef) {
				this.hoistPass(child)
			}
		}
		for (let child of node.children) {
			if (!child) continue
			if (child.type == AstType.FunctionDef) {
				this.hoistPass(child)
			}
		}
		for (let child of node.children) {
			if (!child) continue
			if (child.type == AstType.Global || child.type == AstType.Map) {
				this.hoistPass(child)
			}
		}
	}

	protected importPass(node: AstNode) {
		node.scope = this.hoistScope(node)
		for (let child of node.children) {
			if (!child) continue
			if (child.type == AstType.Import) {
				this.importPass(child)
			}
		}
	}

	protected scopePass(node: AstNode) {
		node.scope = this.getScope(node)
		for (let child of node.children) {
			if (child) this.scopePass(child)
		}
	}

	protected hoistScope(node: AstNode, parentScope: Scope | null = null): Scope {
		if (node.scope) return node.scope
		if (!parentScope) parentScope = (node.parent) ? this.getScope(node.parent) : this.rootScope

		let rules = this.hoistRuleMap[node.type]
		if (rules) {
			for (let rule of rules) node.scope = rule(node, parentScope)
		}

		if (!node.scope) node.scope = parentScope
		return node.scope
	}

	protected getScope(node: AstNode, parentScope: Scope | null = null): Scope {
		if (node.scope) return node.scope
		if (!parentScope) parentScope = (node.parent) ? this.getScope(node.parent) : this.rootScope

		let rules = this.scopeRuleMap[node.type]
		if (rules) {
			for (let rule of rules) node.scope = rule(node, parentScope)
		}

		if (!node.scope) node.scope = parentScope
		return node.scope
	}

	protected typePass(node: AstNode) {
		node.dataType = this.getDataType(node)
		for (let child of node.children) {
			if (child) this.typePass(child)
		}
	}

	protected getDataType(node: AstNode): string {
		if (!node.valid) node.dataType = DataType.Invalid
		if (node.dataType) return node.dataType

		let rules = this.dataTypeRuleMap[node.type]
		if (rules) {
			for (let rule of rules) node.dataType = rule(node)
		}

		if (!node.dataType) node.dataType = DataType.None
		return node.dataType
	}

	protected analysisPass(node: AstNode) {
		let rules = this.analysisRuleMap[node.type]
		if (rules) {
			for (let rule of rules) rule(node)
		}
		for (let child of node.children) {
			if (child) this.analysisPass(child)
		}
	}

	protected makeComplexScope(v: Variable, p: Scope, depth = 0) {
		if (depth > MAX_TYPE_DEPTH) return
		if (DataType.isPrimitive(v.type)) return
		if (v.type.indexOf('[') >= 0) {
			this.makeArrayScope(v, p, depth)
			return
		}
		let struct = p.getStruct(v.type)
		if (struct) {
			this.makeStructScope(v, p, struct, depth)
		} else if (v.node) {
			this.logError('No struct named ' + v.type + ' found', v.node)
		}
	}

	protected makeStructScope(v: Variable, p: Scope, struct: Struct, depth = 0) {
		if (!struct) return
		let scope = new Scope(v.node, p, v.id)
		p.scopes[scope.id] = scope
		let offset = v.offset
		for (let field of struct.fields) {
			let nvar = new Variable(null, scope, field.id, field.type)
			scope.vars[nvar.id] = nvar
			nvar.import = v.import
			nvar.const = v.const
			nvar.export = v.export
			nvar.mapped = v.mapped
			nvar.offset = offset
			nvar.size = this.getSize(nvar.type, scope)
			offset += nvar.size
			this.makeComplexScope(nvar, scope, depth + 1)
		}
	}

	protected makeArrayScope(v: Variable, p: Scope, depth = 0) {
		let baseType = v.type.substring(0, v.type.indexOf('['))
		let length = parseInt(v.type.substring(v.type.indexOf('[') + 1, v.type.indexOf(']')))

		let scope = new Scope(v.node, p, v.id)
		p.scopes[scope.id] = scope

		for (let i = 0; i < length; i++) {
			let nvar = new Variable(null, scope, '' + i, baseType)
			scope.vars[nvar.id] = nvar
			nvar.import = v.import
			nvar.const = v.const
			nvar.export = v.export
			nvar.mapped = v.mapped
			nvar.size = this.getSize(nvar.type, scope)
			nvar.offset = v.offset + nvar.size * i
			this.makeComplexScope(nvar, scope, depth + 1)
		}
	}

	protected getSize(type: string, p: Scope, depth: number = 0): number {
		if (depth > MAX_TYPE_DEPTH) return 0
		switch (type) {
			case DataType.Int:
			case DataType.UInt:
			case DataType.Float:
			case DataType.Bool:
				return 4
			case DataType.Long:
			case DataType.ULong:
			case DataType.Double:
				return 8
		}
		if (DataType.isPrimitive(type)) return 0
		if (type.indexOf('[') >= 0) {
			let length = parseInt(type.substring(type.indexOf('[') + 1, type.indexOf(']')))
			let size = this.getSize(type.substring(0, type.indexOf('[')), p, depth + 1)
			return size * length
		}
		let struct = p.getStruct(type)
		if (!struct) {
			return 0
		}
		let size = 0
		for (let field of struct.fields) size += this.getSize(field.type, field.scope, depth + 1)
		return size
	}

	protected tryEval(node: AstNode) {
		if (node.token.type != TokenType.Int && node.token.type != TokenType.UInt) {
			this.logError("Invalid constant expression " + JSON.stringify(node.token.value), node)
			return 0
		}
		try {
			let result = eval(node.token.value)
			return result
		} catch (e) {
			this.logError("Invalid constant expression " + JSON.stringify(node.token.value), node)
			return 0
		}
	}

	protected registerHoist(type: AstType, rule: ScopeRule) {
		if (!this.hoistRuleMap[type]) this.hoistRuleMap[type] = []
		this.hoistRuleMap[type].push(rule)
	}

	protected registerScope(type: AstType, rule: ScopeRule) {
		if (!this.scopeRuleMap[type]) this.scopeRuleMap[type] = []
		this.scopeRuleMap[type].push(rule)
	}

	protected registerDataType(type: AstType, rule: DataTypeRule) {
		if (!this.dataTypeRuleMap[type]) this.dataTypeRuleMap[type] = []
		this.dataTypeRuleMap[type].push(rule)
	}

	protected registerAnalysis(type: AstType, rule: AnalyzeRule) {
		if (!this.analysisRuleMap[type]) this.analysisRuleMap[type] = []
		this.analysisRuleMap[type].push(rule)
	}

	protected registerBuiltinFunc(path: string, type: DataType, paramTypes: DataType[], paramNames: string[]) {
		let parts = path.split('.')
		let id = parts.pop()
		let scope = this.rootScope
		for (let i = 0; i < parts.length; i++) {
			if (!scope.scopes[parts[i]]) scope.scopes[parts[i]] = new Scope(null, scope, parts[i])
			scope = scope.scopes[parts[i]]
		}
		let params = []
		for (let i = 0; i < paramTypes.length; i++) {
			params.push(new Variable(null, scope, paramNames[i], paramTypes[i]))
		}
		if (id)
			scope.funcs[id] = new Function(null, scope, id, type, params)
	}

	protected logError(msg: string, node: AstNode) {
		this.logger.log(new LogMsg(LogType.Error, "Analyzer", msg, utils.getModulePath(this.mod), node.token.row, node.token.column, node.token.value.length))
	}
}

export class SchwaAnalyzer extends Analyzer {
	constructor(logger: Logger) {
		super(logger)
		this.registerBuiltinFunc('nop', DataType.None, [], [])

		this.registerBuiltinFunc('int.loadSByte', DataType.Int, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('int.loadShort', DataType.Int, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('int.load', DataType.Int, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('int.storeSByte', DataType.None, [DataType.UInt, DataType.Int], ["addr", "val"])
		this.registerBuiltinFunc('int.storeShort', DataType.None, [DataType.UInt, DataType.Int], ["addr", "val"])
		this.registerBuiltinFunc('int.store', DataType.None, [DataType.UInt, DataType.Int], ["addr", "val"])

		this.registerBuiltinFunc('uint.loadByte', DataType.UInt, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('uint.loadUShort', DataType.UInt, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('uint.load', DataType.UInt, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('uint.storeByte', DataType.None, [DataType.UInt, DataType.UInt], ["addr", "val"])
		this.registerBuiltinFunc('uint.storeUShort', DataType.None, [DataType.UInt, DataType.UInt], ["addr", "val"])
		this.registerBuiltinFunc('uint.store', DataType.None, [DataType.UInt, DataType.UInt], ["addr", "val"])

		this.registerBuiltinFunc('long.loadSByte', DataType.Long, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('long.loadShort', DataType.Long, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('long.loadInt', DataType.Long, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('long.load', DataType.Long, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('long.storeSByte', DataType.None, [DataType.UInt, DataType.Long], ["addr", "val"])
		this.registerBuiltinFunc('long.storeShort', DataType.None, [DataType.UInt, DataType.Long], ["addr", "val"])
		this.registerBuiltinFunc('long.storeInt', DataType.None, [DataType.UInt, DataType.Long], ["addr", "val"])
		this.registerBuiltinFunc('long.store', DataType.None, [DataType.UInt, DataType.Long], ["addr", "val"])

		this.registerBuiltinFunc('ulong.loadByte', DataType.ULong, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('ulong.loadUShort', DataType.ULong, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('ulong.loadUInt', DataType.ULong, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('ulong.load', DataType.ULong, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('ulong.storeByte', DataType.None, [DataType.UInt, DataType.ULong], ["addr", "val"])
		this.registerBuiltinFunc('ulong.storeUShort', DataType.None, [DataType.UInt, DataType.ULong], ["addr", "val"])
		this.registerBuiltinFunc('ulong.storeUInt', DataType.None, [DataType.UInt, DataType.ULong], ["addr", "val"])
		this.registerBuiltinFunc('ulong.store', DataType.None, [DataType.UInt, DataType.ULong], ["addr", "val"])

		this.registerBuiltinFunc('float.load', DataType.Float, [DataType.UInt], ["addr"])
		this.registerBuiltinFunc('float.store', DataType.None, [DataType.UInt, DataType.Float], ["addr", "val"])
		this.registerBuiltinFunc('double.load', DataType.Double, [DataType.UInt], ["addr", "val"])
		this.registerBuiltinFunc('double.store', DataType.None, [DataType.UInt, DataType.Double], ["addr", "val"])

		this.registerBuiltinFunc('int.clz', DataType.Int, [DataType.Int], ["n"])
		this.registerBuiltinFunc('int.ctz', DataType.Int, [DataType.Int], ["n"])
		this.registerBuiltinFunc('int.popcnt', DataType.Int, [DataType.Int], ["n"])
		this.registerBuiltinFunc('int.eqz', DataType.Int, [DataType.Int], ["n"])

		this.registerBuiltinFunc('uint.clz', DataType.UInt, [DataType.UInt], ["n"])
		this.registerBuiltinFunc('uint.ctz', DataType.UInt, [DataType.UInt], ["n"])
		this.registerBuiltinFunc('uint.popcnt', DataType.UInt, [DataType.UInt], ["n"])
		this.registerBuiltinFunc('uint.eqz', DataType.UInt, [DataType.UInt], ["n"])

		this.registerBuiltinFunc('long.clz', DataType.Long, [DataType.Long], ["n"])
		this.registerBuiltinFunc('long.ctz', DataType.Long, [DataType.Long], ["n"])
		this.registerBuiltinFunc('long.popcnt', DataType.Long, [DataType.Long], ["n"])
		this.registerBuiltinFunc('long.eqz', DataType.Long, [DataType.Long], ["n"])

		this.registerBuiltinFunc('ulong.clz', DataType.ULong, [DataType.ULong], ["n"])
		this.registerBuiltinFunc('ulong.ctz', DataType.ULong, [DataType.ULong], ["n"])
		this.registerBuiltinFunc('ulong.popcnt', DataType.ULong, [DataType.ULong], ["n"])
		this.registerBuiltinFunc('ulong.eqz', DataType.ULong, [DataType.ULong], ["n"])

		this.registerBuiltinFunc('float.abs', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.ceil', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.floor', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.truncate', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.round', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.sqrt', DataType.Float, [DataType.Float], ["n"])
		this.registerBuiltinFunc('float.copysign', DataType.Float, [DataType.Float, DataType.Float], ["a", "b"])
		this.registerBuiltinFunc('float.min', DataType.Float, [DataType.Float, DataType.Float], ["a", "b"])
		this.registerBuiltinFunc('float.max', DataType.Float, [DataType.Float, DataType.Float], ["a", "b"])

		this.registerBuiltinFunc('double.abs', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.ceil', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.floor', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.truncate', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.round', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.sqrt', DataType.Double, [DataType.Double], ["n"])
		this.registerBuiltinFunc('double.copysign', DataType.Double, [DataType.Double, DataType.Double], ["a", "b"])
		this.registerBuiltinFunc('double.min', DataType.Double, [DataType.Double, DataType.Double], ["a", "b"])
		this.registerBuiltinFunc('double.max', DataType.Double, [DataType.Double, DataType.Double], ["a", "b"])

		this.registerHoist(AstType.Program, (n, p) => {
			let scope = new Scope(n, p, '')
			p.scopes[scope.id] = scope
			return scope
		})
		this.registerScope(AstType.Block, (n, p) => {
			let scope = new Scope(n, p, '')
			p.scopes[scope.id] = scope
			return scope
		})
		this.registerHoist(AstType.Import, (n, p) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l) return p
			let mod: Module | undefined
			if (this.imports) mod = this.imports.find(m => l != null && m.name == l.token.value)
			if (mod && mod.result.ast && mod.result.ast.scope) {
				if (r) {
					let children = (r.type == AstType.Imports) ? r.children : [r]
					for (let c of children) {
						if (!c) continue
						let id = (c.type == AstType.UnknownImport) ? c : c.children[0]
						let aliasId = utils.getIdentifier(c)
						if (!id) continue

						let nvar = mod.result.ast.scope.getVariable(id.token.value)
						if (nvar && nvar.export) {
							nvar = nvar.clone(c, p, aliasId ? aliasId.token.value : id.token.value)
							nvar.export = c.children.some(v => !!v && v.type == AstType.Export)
							nvar.import = mod.name

							if (p.vars[nvar.id]) {
								this.logError('A variable named ' + JSON.stringify(nvar.id) + ' already found', c)
							} else {
								p.vars[nvar.id] = nvar
								if (aliasId != id) {
									nvar.alias = nvar.id
									nvar.id = id.token.value
								}
							}
						}

						let func = mod.result.ast.scope.getFunction(id.token.value)
						if (func && func.export) {
							func = func.clone(c, p, aliasId ? aliasId.token.value : id.token.value)
							func.export = c.children.some(v => !!v && v.type == AstType.Export)
							func.import = mod.name

							if (p.funcs[func.id]) {
								this.logError('A function named ' + JSON.stringify(func.id) + ' already found', c)
							} else {
								p.funcs[func.id] = func
								if (aliasId != id) {
									func.alias = func.id
									func.id = id.token.value
								}
							}
						}

						let struct = mod.result.ast.scope.getStruct(id.token.value)
						if (struct && struct.export) {
							struct = struct.clone(c, p, aliasId ? aliasId.token.value : id.token.value)
							struct.export = c.children.some(v => !!v && v.type == AstType.Export)
							struct.import = mod.name

							if (p.structs[struct.id]) {
								this.logError('A struct named ' + JSON.stringify(struct.id) + ' already found', c)
							} else {
								p.structs[struct.id] = struct
								if (aliasId != id) {
									struct.alias = struct.id
									struct.id = id.token.value
								}
							}
						}

						if (!nvar && !func && !struct) {
							this.logError('No variable, function, or struct named ' + JSON.stringify(id.token.value) + ' is exported by module ' + mod.name, c)
						}
					}
				} else {
					let id = l
					let aliasId = utils.getIdentifier(l)
					if (id) {
						let src = mod.result.ast.scope
						let scope = src.clone(l, p, aliasId ? aliasId.token.value : id.token.value)
						scope.import = mod.name
						p.scopes[scope.id] = scope

						for (let key in src.vars) {
							if (src.vars[key].export) {
								scope.vars[key] = src.vars[key].clone(null, scope, key)
								scope.vars[key].import = mod.name
								scope.vars[key].export = false
							}
						}
						for (let key in src.funcs) {
							if (src.funcs[key].export) {
								scope.funcs[key] = src.funcs[key].clone(null, scope, key)
								scope.funcs[key].import = mod.name
								scope.funcs[key].export = false
							}
						}
						for (let key in src.structs) {
							if (src.structs[key].export) {
								scope.structs[key] = src.structs[key].clone(null, scope, key)
								scope.structs[key].import = mod.name
								scope.structs[key].export = false
							}
						}

						if (aliasId != id) {
							scope.alias = scope.id
							scope.id = id.token.value
						}
						// To-do: nested scopes (i.e. namespaces)
					}
				}
			} else {
				this.logError('Could not locate module ' + JSON.stringify(l.token.value), n)
			}
			return p
		})
		this.registerScope(AstType.VariableImport, (n, p) => {
			let id = utils.getIdentifier(n)
			let scope = new Scope(n, p, id ? id.token.value : n.token.value)
			return scope
		})
		this.registerScope(AstType.FunctionImport, (n, p) => {
			let id = utils.getIdentifier(n)
			let scope = new Scope(n, p, id ? id.token.value : n.token.value)
			return scope
		})
		this.registerScope(AstType.StructImport, (n, p) => {
			let id = utils.getIdentifier(n)
			let scope = new Scope(n, p, id ? id.token.value : n.token.value)
			return scope
		})
		this.registerHoist(AstType.StructDef, (n, p) => {
			let l = n.children[0]
			let id = utils.getIdentifier(l)
			let r = n.children[1]
			if (!id || !l || !r) return p
			let scope = new Scope(n, p, id.token.value)
			let fields: Variable[] = []
			let fieldNodes = r.children
			for (let i = 0; i < r.children.length; i++) {
				let fieldNode = r.children[i]
				if (!fieldNode || fieldNode.type != AstType.VariableDef) continue
				let fieldType = fieldNode.token.value
				let fl = fieldNode.children[0]
				if (!fl) continue
				let fr = fieldNode.children[1]
				if (fr && fr.type == AstType.Literal) fieldType += '[' + this.tryEval(fr) + ']'
				fields.push(new Variable(fieldNode, scope, fl.token.value, fieldType))
			}
			let struct = new Struct(n, scope, id.token.value, fields)
			if (p.structs[struct.id]) {
				this.logError("A struct with the name " + JSON.stringify(struct.id) + " already found", n)
			} else {
				p.structs[struct.id] = struct
				p.scopes[scope.id] = scope
				if (id != l) {
					struct.alias = struct.id
					scope.alias = scope.id
					struct.id = l.token.value
					scope.id = l.token.value
				}
			}
			return scope
		})
		this.registerHoist(AstType.FunctionDef, (n, p) => {
			let l = n.children[0]
			let id = utils.getIdentifier(l)
			let r = n.children[1]
			if (!id || !l || !r) return p
			let scope = new Scope(n, p, id.token.value)
			let params: Variable[] = []
			for (let i = 0; i < r.children.length; i++) {
				let paramNode = r.children[i]
				if (!paramNode) continue
				let pl = paramNode.children[0]
				let pr = paramNode.children[1]
				if (!pl) continue
				let paramType = paramNode.token.value
				if (pr && pr.type == AstType.Literal) paramType += '[' + this.tryEval(pr) + ']'
				if (paramType.indexOf('[') >= 0) {
					this.logError("Arrays cannot be used as function parameters", paramNode)
					continue
				}
				params.push(new Variable(paramNode, scope, pl.token.value, paramType))
			}
			let func = new Function(n, scope, id.token.value, n.token.value, params)
			if (p.funcs[func.id]) {
				this.logError("A function with the name " + JSON.stringify(func.id) + " already found", n)
			} else {
				p.funcs[func.id] = func
				p.scopes[scope.id] = scope
				if (id != l) {
					func.alias = func.id
					scope.alias = scope.id
					func.id = l.token.value
					scope.id = l.token.value
				}
			}
			return scope
		})
		this.registerHoist(AstType.Global, (n, p) => {
			let l = n.children[0]
			if (!l) return p
			let r = l.children[1]
			let id = utils.getIdentifier(l)
			if (!id) return p
			let type = l.token.value
			if (r && r.type == AstType.Literal) type += '[' + this.tryEval(r) + ']'
			let nvar = new Variable(l, p, id.token.value, type)
			nvar.global = true
			p.vars[nvar.id] = nvar
			return p
		})
		this.registerHoist(AstType.Map, (n, p) => {
			let l = n.children[0]
			if (!l) return p
			let r = l.children[1]
			let id = utils.getIdentifier(l)
			if (!id) return p
			let type = l.token.value
			if (r && r.type == AstType.Literal) type += '[' + this.tryEval(r) + ']'
			let nvar = new Variable(n, p, id.token.value, type)
			nvar.global = true
			nvar.mapped = true
			let pr = n.children[1]
			if (pr) nvar.offset = this.tryEval(pr)
			p.vars[nvar.id] = nvar
			return p
		})
		this.registerScope(AstType.VariableDef, (n, p) => {
			let l = n.children[0]
			let id = utils.getIdentifier(l)
			let r = n.children[1]
			if (!l || !id) return p
			let type = n.token.value
			if (r && r.type == AstType.Literal) type += '[' + this.tryEval(r) + ']'
			let nvar = p.vars[id.token.value]
			if (p.vars[id.token.value] && (!n.parent || (n.parent.type != AstType.Global && n.parent.type != AstType.Map))) {
				this.logError("A variable with the name " + JSON.stringify(id.token.value) + " already found", n)
			} else {
				if (!nvar) nvar = new Variable(n, p, id.token.value, type)
				p.vars[nvar.id] = nvar
				if (id != l) {
					nvar.alias = nvar.id
					nvar.id = l.token.value
				}
				nvar.size = this.getSize(nvar.type, p)

				let pn = n.parent
				while (pn && pn.type != AstType.Global) pn = pn.parent
				if (pn && pn.type == AstType.Global) nvar.global = true

				pn = n.parent
				while (pn && pn.type != AstType.Map) pn = pn.parent
				if (pn && pn.type == AstType.Map) {
					nvar.global = true
					nvar.mapped = true
					let pr = pn.children[1]
					if (pr) nvar.offset = this.tryEval(pr)
				}

				this.makeComplexScope(nvar, p)
			}
			return p
		})
		this.registerScope(AstType.Indexer, (n, p) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return p
			let scope: Scope | null = p
			this.getScope(r, p)
			if (l.type == AstType.VariableId) {
				scope = p.getScope(l.token.value)
			} else {
				scope = this.getScope(l, p)
			}
			if (scope) scope = scope.getScope('0')
			if (!scope) {
				this.logError("No scope named " + JSON.stringify(l.token.value) + " found", n)
				return p
			}
			return scope
		})
		this.registerScope(AstType.Access, (n, p) => {
			let l = n.children[0]
			let r = utils.getIdentifier(n.children[1])
			if (!l) return p
			let scope: Scope | null = p

			if (l.type == AstType.VariableId || l.type == AstType.ScopeId) {
				l.type = AstType.ScopeId
				scope = p.getScope(l.token.value)
			} else {
				scope = this.getScope(l, p)
			}
			if (!scope) {
				this.logError("Invalid left-hand side of property access", n)
				return p
			}
			if (r) {
				this.getScope(r, scope)
				if (scope) {
					let childScope = scope.getScope(r.token.value)
					if (childScope) scope = childScope
				}
			}
			return scope
		})
		this.registerHoist(AstType.Const, (n, p) => {
			let node: AstNode | undefined | null = utils.getIdentifier(n.parent)
			if (node) {
				let nvar = p.getVariable(node.token.value)
				if (nvar) nvar.const = true
			}
			return p
		})
		this.registerHoist(AstType.Export, (n, p) => {
			let node: AstNode | undefined | null = utils.getIdentifier(n.parent)
			if (node) {
				let nvar = p.getVariable(node.token.value)
				if (nvar) nvar.export = true
				let func = p.getFunction(node.token.value)
				if (func) func.export = true
				let struct = p.getStruct(node.token.value)
				if (struct) struct.export = true
			}
			return p
		})

		this.registerDataType(AstType.Indexer, (n) => {
			if (n.children.length) {
				let node = n.children[0]
				if (node) {
					let type = this.getDataType(node)
					type = type.substring(0, type.indexOf('['))
					return type
				}
			}
			return DataType.Invalid
		})
		this.registerDataType(AstType.Access, (n) => {
			if (n.children.length >= 2) {
				let node = n.children[1]
				if (node) return this.getDataType(node)
			}
			return DataType.Invalid
		})
		this.registerDataType(AstType.VariableId, (n) => {
			let id = utils.getIdentifier(n)
			if (id && this.getScope(n)) {
				let nvar = this.getScope(n).getVariable(id.token.value)
				if (nvar) return nvar.type
				else this.logError("No variable named " + JSON.stringify(id.token.value) + " found", n)
			}
			return DataType.Invalid
		})
		this.registerDataType(AstType.FunctionId, (n) => {
			let id = utils.getIdentifier(n)
			if (id && this.getScope(n)) {
				let func = this.getScope(n).getFunction(id.token.value)
				if (func) return func.type
				else this.logError("No function named " + JSON.stringify(id.token.value) + " found", n)
			}
			return DataType.Invalid
		})
		this.registerDataType(AstType.StructId, (n) => {
			let id = utils.getIdentifier(n)
			if (id && this.getScope(n)) {
				let struct = this.getScope(n).getStruct(id.token.value)
				if (struct) return struct.id
				else this.logError("No struct named " + JSON.stringify(id.token.value) + " found", n)
			}
			return DataType.Invalid
		})
		this.registerDataType(AstType.Type, (n) => DataType.Type)
		this.registerDataType(AstType.VariableDef, (n) => {
			let type = n.token.value
			let r = n.children[1]
			if (r) type += '[' + this.tryEval(r) + ']'
			return type
		})
		this.registerDataType(AstType.FunctionDef, (n) => n.token.value)
		this.registerDataType(AstType.StructDef, (n) => {
			let l = n.children[0]
			if (l) return l.token.value
			return DataType.Invalid
		})
		this.registerDataType(AstType.Literal, (n) => {
			let type = DataType.fromTokenType(n.token.type)
			if (type == DataType.Float || type == DataType.Double) {
				return type
			} else if (type == DataType.Int || type == DataType.UInt || type == DataType.Long || type == DataType.ULong) {
				let val = n.token.value
				let unsigned = type == DataType.UInt || type == DataType.ULong
				let isLong = type == DataType.Long || type == DataType.ULong
				let neg = val.startsWith('-')
				if (neg) val = val.substr(1)

				if (unsigned) val = val.substr(0, val.length - 1)
				if (isLong) val = val.substr(0, val.length - 1)

				let radix = 10
				if (val.startsWith('0x')) {
					radix = 16
					val = val.substr(2)
				}
				if (val.startsWith('0o')) {
					radix = 8
					val = val.substr(2)
				}
				if (val.startsWith('0b')) {
					radix = 2
					val = val.substr(2)
				}

				if (neg) val = '-' + val

				let isValid = true

				let long = Long.fromString(val, unsigned, radix)
				if (!isLong && long.gt(Long.fromString(unsigned ? "FFFFFFFF" : "7FFFFFFF", unsigned, 16))) isValid = false
				if (!isLong && long.lt(Long.fromString(unsigned ? "0" : "-80000000", unsigned, 16))) isValid = false
				if (long.toString(radix).toUpperCase() != val) isValid = false
				if (!isValid) console.log(val, long.toString(radix).toUpperCase())
				if (isValid) return type
			} else {
				return type
			}
			this.logError("The value " + JSON.stringify(n.token.value) + " is out of range", n)
			return DataType.Invalid
		})

		let intTypeSet = [DataType.Int, DataType.Int, DataType.Int]
		let uintTypeSet = [DataType.UInt, DataType.UInt, DataType.UInt]
		let longTypeSet = [DataType.Long, DataType.Long, DataType.Long]
		let ulongTypeSet = [DataType.ULong, DataType.ULong, DataType.ULong]
		let floatTypeSet = [DataType.Float, DataType.Float, DataType.Float]
		let doubleTypeSet = [DataType.Double, DataType.Double, DataType.Double]
		let fixedTypeSets = [intTypeSet, uintTypeSet, longTypeSet, ulongTypeSet]
		let floatingTypeSets = [floatTypeSet, doubleTypeSet]
		let signedTypeSets = [intTypeSet, longTypeSet, floatTypeSet, doubleTypeSet]
		let numberTypeSets = [intTypeSet, uintTypeSet, longTypeSet, ulongTypeSet, floatTypeSet, doubleTypeSet]
		let boolTypeSet = [DataType.Bool, DataType.Bool, DataType.Bool]
		let compareSets = [[DataType.Int, DataType.Int, DataType.Bool], [DataType.UInt, DataType.UInt, DataType.Bool], [DataType.Long, DataType.Long, DataType.Bool], [DataType.ULong, DataType.ULong, DataType.Bool], [DataType.Float, DataType.Float, DataType.Bool], [DataType.Double, DataType.Double, DataType.Bool]]

		this.registerDataTypeUnaryOp(TokenType.Neg, signedTypeSets)
		this.registerDataTypeUnaryOp(TokenType.NOT, fixedTypeSets)
		this.registerDataTypeUnaryOp(TokenType.Not, [boolTypeSet])

		this.registerDataTypeBinaryOp(TokenType.Add, numberTypeSets)
		this.registerDataTypeBinaryOp(TokenType.Sub, numberTypeSets)
		this.registerDataTypeBinaryOp(TokenType.Mul, numberTypeSets)
		this.registerDataTypeBinaryOp(TokenType.Div, numberTypeSets)
		this.registerDataTypeBinaryOp(TokenType.Mod, fixedTypeSets)
		this.registerDataTypeBinaryOp(TokenType.AND, [...fixedTypeSets, boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.OR, [...fixedTypeSets, boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.XOR, [...fixedTypeSets, boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.NOT, fixedTypeSets)
		this.registerDataTypeBinaryOp(TokenType.ShL, fixedTypeSets)
		this.registerDataTypeBinaryOp(TokenType.ShR, fixedTypeSets)
		this.registerDataTypeBinaryOp(TokenType.RotL, fixedTypeSets)
		this.registerDataTypeBinaryOp(TokenType.RotR, fixedTypeSets)

		this.registerDataTypeBinaryOp(TokenType.Eq, [...compareSets, boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.Ne, [...compareSets, boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.Lt, compareSets)
		this.registerDataTypeBinaryOp(TokenType.Le, compareSets)
		this.registerDataTypeBinaryOp(TokenType.Gt, compareSets)
		this.registerDataTypeBinaryOp(TokenType.Ge, compareSets)

		this.registerDataTypeBinaryOp(TokenType.And, [boolTypeSet])
		this.registerDataTypeBinaryOp(TokenType.Or, [boolTypeSet])

		this.registerDataType(AstType.Assignment, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			let ident = utils.getIdentifier(l)
			if (ident) {
				let nvar = this.getScope(ident).getVariable(ident.token.value)
				if (nvar && nvar.const) {
					this.logError("Constant globals cannot be assigned to", n)
					return DataType.Invalid
				}
			}

			let t0 = this.getDataType(l)
			let t1 = this.getDataType(r)
			if (t0 == DataType.Invalid || t1 == DataType.Invalid) {
				if (t0 == DataType.Invalid) this.logError("Invalid left-hand side of assignment", l)
				if (t1 == DataType.Invalid) this.logError("Invalid right-hand side of assignment", r)
				return DataType.Invalid
			}
			if (t0 != t1) {
				this.logError("Both sides of an assignment must be of the same type", n)
				return DataType.Invalid
			}
			return t0
		})

		this.registerDataType(AstType.Global, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			let t0 = this.getDataType(l)
			let t1 = this.getDataType(r)
			if (t0 == DataType.Invalid || t1 == DataType.Invalid) {
				if (t0 == DataType.Invalid) this.logError("Invalid left-hand side of assignment", l)
				if (t1 == DataType.Invalid) this.logError("Invalid right-hand side of assignment", r)
				return DataType.Invalid
			}
			if (t0 != t1) {
				this.logError("Both sides of an assignment must be of the same type", n)
				return DataType.Invalid
			}
			return t0
		})

		this.registerDataType(AstType.BinaryOp, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			if (n.dataType || n.token.type != TokenType.Onto) return n.dataType
			let t0 = this.getDataType(l)
			let t1 = (r.type == AstType.Type) ? r.token.value : DataType.Invalid
			if (t1 == DataType.Bool) t1 = DataType.Invalid

			if (t0 == DataType.Int && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.Int && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.UInt && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.UInt && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.Long && t1 == DataType.ULong) return DataType.ULong
			if (t0 == DataType.Long && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.ULong && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.ULong && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.Float && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.Float && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.Double && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.Double && t1 == DataType.ULong) return DataType.ULong

			if (t0 == DataType.Invalid) this.logError("Invalid value argument to operator " + n.token.type, l)
			if (t1 == DataType.Invalid) this.logError("Invalid type argument to operator " + n.token.type, r)
			return DataType.Invalid
		})

		this.registerDataType(AstType.BinaryOp, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			if (n.dataType || n.token.type != TokenType.To) return n.dataType
			let t0 = this.getDataType(l)
			let t1 = (r.type == AstType.Type) ? r.token.value : DataType.Invalid
			if (t1 == DataType.Bool) t1 = DataType.Invalid

			if (t0 == DataType.Int && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.Int && t1 == DataType.ULong) return DataType.ULong
			if (t0 == DataType.Int && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.Int && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.UInt && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.UInt && t1 == DataType.ULong) return DataType.ULong
			if (t0 == DataType.UInt && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.UInt && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.Long && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.Long && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.Long && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.Long && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.ULong && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.ULong && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.ULong && t1 == DataType.Float) return DataType.Float
			if (t0 == DataType.ULong && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.Float && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.Float && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.Float && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.Float && t1 == DataType.ULong) return DataType.ULong
			if (t0 == DataType.Float && t1 == DataType.Double) return DataType.Double
			if (t0 == DataType.Double && t1 == DataType.Int) return DataType.Int
			if (t0 == DataType.Double && t1 == DataType.UInt) return DataType.UInt
			if (t0 == DataType.Double && t1 == DataType.Long) return DataType.Long
			if (t0 == DataType.Double && t1 == DataType.ULong) return DataType.ULong
			if (t0 == DataType.Double && t1 == DataType.Float) return DataType.Float

			if (t0 == DataType.Invalid) this.logError("Invalid value argument to operator " + n.token.type, l)
			if (t1 == DataType.Invalid) this.logError("Invalid type argument to operator " + n.token.type, r)
			return DataType.Invalid
		})

		this.registerDataType(AstType.FunctionCall, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			let ident = utils.getIdentifier(l)
			if (!ident) {
				this.logError("Invalid function identifier", n)
				return DataType.Invalid
			}
			let func = this.getScope(ident).getFunction(ident.token.value)
			if (!func) {
				this.logError("No function named " + JSON.stringify(ident.token.value) + " found", n)
				return DataType.Invalid
			}
			if (func.params.length != r.children.length) {
				this.logError("Function " + JSON.stringify(func.id) + " takes " + func.params.length + " arguments, not " + r.children.length, n)
				return DataType.Invalid
			}
			let valid = true
			for (let i = 0; i < func.params.length; i++) {
				let param = r.children[i]
				if (!param) continue
				let type = this.getDataType(param)
				if (type != func.params[i].type) {
					this.logError("The " + formatOrdinal(i + 1) + " parameter (" + JSON.stringify(func.params[i].id) + ") of function " + JSON.stringify(func.id) + " is type " + func.params[i].type + ", not " + type, param)
					valid = false
				}
			}
			if (valid) return func.type
			else return DataType.Invalid
		})

		this.registerDataType(AstType.Return, (n) => {
			let l = n.children[0]
			if (!l) return DataType.Invalid
			let t = this.getDataType(l)
			let p = n.parent
			while (p && p.type != AstType.FunctionDef) p = p.parent
			if (p && (t != p.token.value || p.token.value == DataType.None)) {
				let pn = p.children[0]
				if (pn) this.logError("Type of return value (" + t + ") does not match function " + pn.token.value + "'s return type (" + p.token.value + ")", l)
				return DataType.Invalid
			}
			return t
		})

		this.registerDataType(AstType.ReturnVoid, (n) => {
			let l = n.children[0]
			if (!l) return DataType.Invalid
			let p = n.parent
			while (p && p.type != AstType.FunctionDef) p = p.parent
			if (p && p.token.value != DataType.None) {
				let pn = p.children[0]
				if (pn) this.logError("Type of return value (" + DataType.None + ") does not match function " + pn.token.value + "'s return type (" + p.token.value + ")", l)
				return DataType.Invalid
			}
			return DataType.None
		})
	}

	protected registerDataTypeUnaryOp(type: TokenType, typeSets: DataType[][]) {
		this.registerDataType(AstType.UnaryOp, (n) => {
			let l = n.children[0]
			if (!l) return DataType.Invalid
			if (n.dataType || n.token.type != type) return n.dataType
			let t = this.getDataType(l)
			for (let i = 0; i < typeSets.length; i++) {
				if (t == typeSets[i][0]) return typeSets[i][1]
			}
			this.logError("Invalid argument to operator " + n.token.type, l)
			return DataType.Invalid
		})
	}

	protected registerDataTypeBinaryOp(type: TokenType, typeSets: DataType[][]) {
		this.registerDataType(AstType.BinaryOp, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			if (!l || !r) return DataType.Invalid
			if (n.dataType || n.token.type != type) return n.dataType
			let t0 = this.getDataType(l)
			let t1 = this.getDataType(r)
			for (let i = 0; i < typeSets.length; i++) {
				if (t0 == typeSets[i][0] && t1 == typeSets[i][1]) return typeSets[i][2]
			}
			this.logError("Invalid 1st argument to operator " + n.token.type, l)
			this.logError("Invalid 2nd argument to operator " + n.token.type, r)
			return DataType.Invalid
		})
	}
}
