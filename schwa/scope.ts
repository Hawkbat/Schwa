import { AstNode } from "./ast"

export class Variable {
	public global: boolean = false
	public const: boolean = false
	public export: boolean = false
	public mapped: boolean = false
	public offset: number = 0
	public size: number = 0

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: string) { }

	getPath(untilNode: boolean = false): string {
		let path = this.id
		if (untilNode && this.node) return path
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			if (untilNode && p.node) break
			p = p.parent
		}
		return path
	}

	toString() {
		let out = ''
		if (this.export) out += 'export '
		if (this.const) out += 'const '
		out += this.type + ' ' + this.id
		if (this.mapped) out += ' mapped at ' + this.offset
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

	constructor(public node: AstNode | null, public scope: Scope, public id: string, public fields: Variable[]) {}
	
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
	
	getPath(): string {
		let path = this.id
		let p: Scope | null = this.parent
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}

	toString() {
		return this.print(0, false)
	}

	print(depth: number, skipLabel: boolean) {
		let indent = '\t'.repeat(depth)
		let out = ''
		if (!skipLabel) {
			let type = 'scope'
			if (!this.parent) type = 'root'
			else if (!this.parent.parent && !this.id) type = 'program'
			else if (!this.id) type = 'block'
			else if (this.id) type = 'scope ' + this.id
			out += indent + type + '\n'
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
