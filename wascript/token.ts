
export enum TokenType {
	None,
	Unknown,

	Name,
	Type,
	Const,
	Export,

	Int,
	UInt,
	Long,
	ULong,
	Float,
	Double,
	Bool,

	Add,
	Sub,
	Mul,
	Div,
	Mod,
	Neg,
	AND,
	OR,
	XOR,
	NOT,
	ShL,
	ShR,
	RotL,
	RotR,
	Eq,
	Ne,
	Lt,
	Le,
	Gt,
	Ge,
	And,
	Or,
	Not,
	As,
	To,
	Assign,

	If,
	Else,
	ElseIf,
	While,
	Break,
	Continue,
	Return,

	Comment,
	InlineComment,

	LParen,
	RParen,
	Comma,
	Period,

	Indent,
	Dedent,

	BOL,
	EOL,

	BOF,
	EOF
}

export class Token {
	constructor(public type: TokenType, public value: string, public row: number, public column: number) { }

	toString(): string {
		return "(" + TokenType[this.type] + ((this.value) ? ":" + this.value + ")" : ")") + ":" + this.row + ":" + this.column
	}
}