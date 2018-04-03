import { AstNode } from './ast'

export class Variable {
	public alias: string = ''
	public global: boolean = false
	public const: boolean = false
	public export: boolean = false
	public import: string = ''
	public mapped: boolean = false
	public offset: number = 0
	public size: number = 0

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: string) { }

	getPath(useAlias: boolean = true, untilNode: boolean = false): string {
		let path = useAlias && this.alias ? this.alias : this.id
		if (untilNode && this.node) return path
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + '.' + path
			if (untilNode && p.node) break
			p = p.parent
		}
		return path
	}

	clone(node?: AstNode | null, scope?: Scope, id?: string): Variable {
		let nvar = new Variable(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.type)
		nvar.alias = this.alias
		nvar.global = this.global
		nvar.const = this.const
		nvar.export = this.export
		nvar.import = this.import
		nvar.mapped = this.mapped
		nvar.offset = this.offset
		nvar.size = this.size
		return nvar
	}

	toString() {
		let out = ''
		if (this.import) out += 'from ' + this.import + ' import '
		if (this.export) out += 'export '
		if (this.const) out += 'const '
		out += this.type + ' ' + this.id
		if (this.alias) out += ' as ' + this.alias
		if (this.mapped) out += ' mapped at ' + this.offset
		return out
	}
}

export class Function {
	public alias: string = ''
	public import: string = ''
	public export: boolean = false

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: string, public params: Variable[]) { }

	getPath(useAlias: boolean = true): string {
		let path = useAlias && this.alias ? this.alias : this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + '.' + path
			p = p.parent
		}
		return path
	}

	clone(node?: AstNode | null, scope?: Scope, id?: string): Function {
		let func = new Function(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.type, this.params.map(v => v.clone()))
		func.alias = this.alias
		func.import = this.import
		func.export = this.export
		return func
	}

	toString() {
		let out = ''
		if (this.import) out += 'from ' + this.import + ' import '
		if (this.export) out += 'export '
		out += this.type + ' ' + this.id + '(' + this.params.join(', ') + ')'
		if (this.alias) out += ' as ' + this.alias
		return out
	}
}

export class Struct {
	public alias: string = ''
	public import: string = ''
	public export: boolean = false

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public fields: Variable[]) { }

	getPath(useAlias: boolean = true): string {
		let path = useAlias && this.alias ? this.alias : this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + '.' + path
			p = p.parent
		}
		return path
	}

	clone(node?: AstNode | null, scope?: Scope, id?: string): Struct {
		let struct = new Struct(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.fields.map(v => v.clone()))
		struct.alias = this.alias
		struct.import = this.import
		struct.export = this.export
		return struct
	}

	toString() {
		let out = ''
		if (this.import) out += 'from ' + this.import + ' import '
		if (this.export) out += 'export '
		out += 'struct ' + this.id + '(' + this.fields.join(', ') + ')'
		if (this.alias) out += ' as ' + this.alias
		return out
	}
}

export class Scope {
	public alias: string = ''
	import: string = ''
	export: boolean = false

	scopes: { [key: string]: Scope } = {}
	vars: { [key: string]: Variable } = {}
	funcs: { [key: string]: Function } = {}
	structs: { [key: string]: Struct } = {}
	constructor(public node: AstNode | null, public parent: Scope | null, public id: string) { }

	getScope(id: string): Scope | null {
		if (this.scopes[id]) return this.scopes[id]
		if (this.parent) return this.parent.getScope(id)
		return null
	}

	getVariable(id: string): Variable | null {
		if (this.vars[id]) return this.vars[id]
		if (this.parent) return this.parent.getVariable(id)
		return null
	}

	getFunction(id: string): Function | null {
		if (this.funcs[id]) return this.funcs[id]
		if (this.parent) return this.parent.getFunction(id)
		return null
	}

	getStruct(id: string): Struct | null {
		if (this.structs[id]) return this.structs[id]
		if (this.parent) return this.parent.getStruct(id)
		return null
	}

	getPath(useAlias: boolean = true): string {
		let path = useAlias && this.alias ? this.alias : this.id
		let p: Scope | null = this.parent
		while (p) {
			if (p.id) path = p.id + '.' + path
			p = p.parent
		}
		return path
	}

	clone(node?: AstNode | null, parent?: Scope | null, id?: string): Scope {
		let scope = new Scope(node !== undefined ? node : this.node, parent !== undefined ? parent : this.parent, id !== undefined ? id : this.id)
		scope.alias = this.alias
		scope.import = this.import
		scope.export = this.export
		return scope
	}

	toString() {
		return this.print(0, false)
	}

	print(depth: number, skipLabel: boolean) {
		let indent = '\t'.repeat(depth)
		let out = ''
		if (!skipLabel) {
			out += indent

			if (this.import) out += 'import '
			if (this.export) out += 'export '

			let type = 'scope'
			if (!this.parent) type = 'root'
			else if (!this.parent.parent && !this.id) type = 'program'
			else if (!this.id) type = 'block'
			else if (this.id) type = 'scope ' + this.id
			out += type
			if (this.alias) out += ' as ' + this.alias
			out += '\n'
		}
		for (let key in this.vars) {
			out += indent + '\t' + this.vars[key] + '\n'
			if (this.scopes[key]) out += this.scopes[key].print(depth + 1, true)
		}
		for (let key in this.funcs) {
			out += indent + '\t' + this.funcs[key] + '\n'
			if (this.scopes[key]) out += this.scopes[key].print(depth + 1, true)
		}
		for (let key in this.structs) {
			out += indent + '\t' + this.structs[key] + '\n'
			if (this.scopes[key]) out += this.scopes[key].print(depth + 1, true)
		}
		for (let key in this.scopes) {
			if (!this.vars[key] && !this.funcs[key] && !this.structs[key])
				out += this.scopes[key].print(depth + 1, false)
		}
		return out
	}
}
