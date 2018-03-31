import { Token, TokenType } from "./token"
import { DataType } from "./datatype"
import { Scope } from "./scope"

export enum AstType {
	None = "none",
	Unknown = "unknown",
	ModuleId = "module identifier",
	VariableId = "variable identifier",
	FunctionId = "function identifier",
	StructId = "struct identifier",
	ScopeId = "scope identifier",
	Alias = "alias",
	Type = "type",
	Const = "const",
	Export = "export",
	From = "from",
	Import = "import",
	Imports = "imports",
	VariableImport = "variable import",
	FunctionImport = "function import",
	StructImport = "struct import",
	UnknownImport = "unresolved import",
	Map = "map",
	Literal = "literal value",
	UnaryOp = "unary operator",
	BinaryOp = "binary operator",
	VariableDef = "variable definition",
	FunctionDef = "function definition",
	StructDef = "struct definition",
	Fields = "fields",
	Parameters = "parameters",
	FunctionCall = "function call",
	Arguments = "arguments",
	Assignment = "assignment",
	Global = "global variable",
	Access = "property access",
	Indexer = "array indexer",
	If = "if",
	Else = "else",
	ElseIf = "else if",
	While = "while",
	Break = "break",
	Continue = "continue",
	Return = "return",
	ReturnVoid = "return void",
	Comment = "comment",
	Block = "scope body",
	Program = "program"
}

export class AstNode {
	public parent: AstNode | null = null
	public valid: boolean | null = null
	public scope: Scope | null = null
	public dataType: string | null = null
	public generated: boolean | null = null

	constructor(public type: AstType, public token: Token, public children: (AstNode | undefined)[]) {
		for (let child of children) if (child) child.parent = this
	}

	toString(depth?: number): string {
		if (!depth) depth = 0
		let out = "\t".repeat(depth)
		out += this.type + " ("
		if (this.token.value != this.token.type) out += this.token.type
		if (this.token.value && this.token.value != this.token.type) out += " "
		if (this.token.value) out += JSON.stringify(this.token.value)
		out += ")"
		if (this.dataType) out += ": " + this.dataType
		out += "\n"
		for (let child of this.children) if (child) out += child.toString(depth + 1)
		return out
	}
}
