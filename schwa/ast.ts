import { Token, TokenType } from "./token"
import { DataType } from "./datatype"
import { Scope } from "./scope"

export enum AstType {
	None,
	Unknown,
	VariableId,
	FunctionId,
	StructId,
	Type,
	Const,
	Export,
	Map,
	Literal,
	UnaryOp,
	BinaryOp,
	VariableDef,
	FunctionDef,
	StructDef,
	Fields,
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
	public parent: AstNode | null = null
	public valid: boolean | null = null
	public scope: Scope | null = null
	public dataType: string | null = null
	public generated: boolean | null = null

	constructor(public type: AstType, public token: Token, public children: AstNode[]) {
		for (let child of children) child.parent = this
	}

	toString(depth?: number): string {
		if (!depth) depth = 0
		let out = "\t".repeat(depth)
		out += AstType[this.type] + " (" + TokenType[this.token.type]
		if (this.token.value) out += " " + JSON.stringify(this.token.value)
		out += ")"
		if (this.dataType) out += ": " + this.dataType
		out += "\n"
		for (let child of this.children) out += child.toString(depth + 1)
		return out
	}
}
