import { AstNode } from "./ast"

export class Variable {
	public global: boolean = false
	public const: boolean = false
	public export: boolean = false

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: string) { }

	getPath(): string {
		let path = this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}

	toString() {
		let out = ''
		if (this.export) out += 'export '
		if (this.const) out += 'const '
		out += this.type + ' ' + this.id
		return out
	}
}

export class Function {
	public export: boolean = false

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: string, public params: Variable[]) { }

	getPath(): string {
		let path = this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}

	toString() {
		let out = ''
		if (this.export) out += 'export '
		out += this.type + ' ' + this.id + '(' + this.params.join(', ') + ')'
		return out
	}
}

export class Struct {
	public export: boolean = false

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public fields: Variable[]) { }
	
	getPath(): string {
		let path = this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}

	toString() {
		let out = ''
		if (this.export) out += 'export '
		out += 'struct ' + this.id + '(' + this.fields.join(', ') + ')'
		return out
	}
}

export class Scope {
	scopes: { [key: string]: Scope } = {}
	vars: { [key: string]: Variable } = {}
	funcs: { [key: string]: Function } = {}
	structs: { [key: string]: Struct } = {}
	constructor(private node: AstNode | null, public parent: Scope | null, public id: string) { }

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

	toString() {
		let out = ''
		out += '.' + this.id + '\n'
		for (let key in this.vars) out += '\t' + this.vars[key] + '\n'
		for (let key in this.funcs) out += '\t' + this.funcs[key] + '\n'
		for (let key in this.structs) out += '\t' + this.structs[key] + '\n'
		for (let key in this.scopes) {
			out += ('' + this.scopes[key]).split('\n').map(v => '\t' + v).join('\n') + '\n'
		}
		return out
	}
}
