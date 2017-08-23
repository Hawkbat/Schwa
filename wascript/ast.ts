import { Token, TokenType } from "./token"
import { DataType } from "./datatype"
import { Scope } from "./scope"

export enum AstType {
	None,
	Unknown,
	VariableId,
	FunctionId,
	Type,
	Const,
	Export,
	Literal,
	UnaryOp,
	BinaryOp,
	VariableDef,
	FunctionDef,
	Parameters,
	FunctionCall,
	Arguments,
	Assignment,
	Global,
	Access,
	If,
	Else,
	ElseIf,
	While,
	Break,
	Continue,
	Return,
	ReturnVoid,
	Comment,
	Block,
	Program
}

export class AstNode {
	public parent: AstNode
	public valid: boolean
	public scope: Scope
	public dataType: DataType
	public generated: boolean

	constructor(public type: AstType, public token: Token, public children?: AstNode[]) {
		if (children) {
			for (let child of children) child.parent = this
		} else {
			this.children = []
		}
	}

	toString(depth?: number): string {
		if (!depth) depth = 0
		let out = "\t".repeat(depth)
		out += AstType[this.type] + " (" + TokenType[this.token.type]
		if (this.token.value) out += " " + JSON.stringify(this.token.value)
		out += ")"
		if (this.dataType) out += ": " + DataType[this.dataType]
		out += "\n"
		for (let child of this.children) out += child.toString(depth + 1)
		return out
	}
}
