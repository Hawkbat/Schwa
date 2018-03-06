import { DataType } from "./datatype"
import { AstNode } from "./ast"

export class Variable {
	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: DataType) { }

	getPath(): string {
		let path = this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}
}

export class Function {
	constructor(public node: AstNode | null, public scope: Scope, public id: string, public type: DataType, public params: DataType[]) { }

	getPath(): string {
		let path = this.id
		let p: Scope | null = this.scope
		while (p) {
			if (p.id) path = p.id + "." + path
			p = p.parent
		}
		return path
	}
}

export class Scope {
	scopes: { [key: string]: Scope } = {}
	vars: { [key: string]: Variable } = {}
	funcs: { [key: string]: Function } = {}
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
}
