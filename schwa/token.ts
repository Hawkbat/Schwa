
export enum TokenType {
	None = '',
	Unknown = '',

	Name = 'identifier',
	Type = 'type',
	Const = 'const',
	Export = 'export',

	Struct = 'struct',
	Map = 'map',
	At = 'at',

	Int = 'int literal',
	UInt = 'uint literal',
	Long = 'long literal',
	ULong = 'ulong literal',
	Float = 'float literal',
	Double = 'double literal',
	Bool = 'bool literal',

	Add = '+',
	Sub = '-',
	Mul = '*',
	Div = '/',
	Mod = '%',
	Neg = '-',
	AND = '&',
	OR = '|',
	XOR = '^',
	NOT = '~',
	ShL = '<<',
	ShR = '>>',
	RotL = '<|',
	RotR = '|>',
	Eq = '==',
	Ne = '!=',
	Lt = '<',
	Le = '<=',
	Gt = '>',
	Ge = '>=',
	And = '&&',
	Or = '||',
	Not = '!',
	As = 'as',
	To = 'to',
	Assign = '=',

	If = 'if',
	Else = 'else',
	ElseIf = 'else if',
	While = 'while',
	Break = 'break',
	Continue = 'continue',
	Return = 'return',

	Comment = '//',
	InlineComment = ' //',
	
	LBracket = '[',
	RBracket = ']',
	LParen = '(',
	RParen = ')',
	Comma = ',',
	Period = '.',

	Indent = 'indent',
	Dedent = 'dedent',

	BOL = 'SOL',
	EOL = 'EOL',

	BOF = 'BOF',
	EOF = 'EOF'
}

export class Token {
	constructor(public type: TokenType, public value: string, public row: number, public column: number) { }

	toString(): string {
		return "(" + (this.type != this.value ? this.type : '') + ((this.value) ? ":" + this.value + ")" : ")") + ":" + this.row + ":" + this.column
	}
}