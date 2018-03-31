import { Token, TokenType } from "./token"
import { LogType, LogMsg, Logger } from "./log"
import { Module } from "./compiler"
import * as utils from "./utils"

export type LexerRule = (row: number, column: number) => Token | null

export class Lexer {
	protected mod: Module | undefined
	private rules: LexerRule[] = []

	private lines: string[] = []
	private tokens: Token[] = []

	constructor(protected logger: Logger) { }

	public lex(mod: Module): Token[] {
		this.mod = mod
		this.lines = mod.lines
		this.tokens = []
		this.push(new Token(TokenType.BOF, '', 0, 0))

		let depth = 0
		for (let row = 0; row < this.lines.length; row++) {
			if (this.lines[row].trim() == '') continue

			let newDepth = 0
			while (this.lines[row].charAt(newDepth) == '\t') newDepth++
			for (let d = depth; d < newDepth; d++) this.push(new Token(TokenType.Indent, '\t', row, d))
			for (let d = newDepth; d < depth; d++) this.push(new Token(TokenType.Dedent, '', row, d))
			depth = newDepth

			this.push(new Token(TokenType.BOL, '', row, depth))

			for (let col = 0; col < this.lines[row].length; col++) {
				let token: Token | null = null
				for (let rule of this.rules) {
					token = rule(row, col)
					if (token) break
				}
				if (token) {
					col += token.value.length - 1
					if (token.type == TokenType.Comment && this.tokens[this.tokens.length - 1].type != TokenType.BOL) {
						token.type = TokenType.InlineComment
						let i = this.tokens.length - 1
						while (this.tokens[i].type != TokenType.BOL) i--
						this.tokens.splice(i, 0, token)
					} else {
						this.push(token)
					}
				} else {
					let end = col
					while (!token && end < this.lines[row].length) {
						for (let rule of this.rules) {
							token = rule(row, end)
							if (token) break
						}
						if (token) break
						end++
					}
					let val = this.lines[row].substring(col, end)
					this.logError("Unknown token " + JSON.stringify(val), row, col, end - col)
					this.tokens.push(new Token(TokenType.Unknown, val, row, col))
					col = end - 1
				}
			}
			this.push(new Token(TokenType.EOL, '\n', row, this.lines[row].length))
		}
		while (depth > 0) this.push(new Token(TokenType.Dedent, '', this.lines.length - 1, --depth))
		this.push(new Token(TokenType.EOF, '', this.lines.length - 1, this.lines[this.lines.length - 1].length))
		return this.tokens
	}

	protected push(token: Token) {
		if (token.type != TokenType.None)
			this.tokens.push(token)
	}

	protected getLine(row: number, col?: number, len?: number) {
		let line = this.lines[row]
		if (col) line = line.substr(col, len)
		return line
	}

	protected register(rule: LexerRule) {
		this.rules.push(rule)
	}

	protected registerMatch(type: TokenType, pattern: string) {
		this.register((r, c) => {
			if (this.getLine(r, c, pattern.length) == pattern)
				return new Token(type, pattern, r, c)
			return null
		})
	}

	protected registerRegex(type: TokenType, pattern: RegExp) {
		this.register((r, c) => {
			let res = pattern.exec(this.getLine(r, c))
			if (res && res.index == 0)
				return new Token(type, res[0], r, c)
			return null
		})
	}

	protected logError(msg: string, row: number, col: number, len: number) {
		this.logger.log(new LogMsg(LogType.Error, "Lexer", msg, utils.getModulePath(this.mod), row, col, len))
	}
}

export class SchwaLexer extends Lexer {
	constructor(logger: Logger) {
		super(logger)

		this.registerRegex(TokenType.Comment, /\s*\/\/.*/)

		this.registerRegex(TokenType.None, /\s/)

		// Longer matches first to keep precedence over shorter matches 
		this.registerMatch(TokenType.ShL, "<<")
		this.registerMatch(TokenType.ShR, ">>")
		this.registerMatch(TokenType.RotL, "<|")
		this.registerMatch(TokenType.RotR, "|>")
		this.registerMatch(TokenType.Eq, "==")
		this.registerMatch(TokenType.Ne, "!=")
		this.registerMatch(TokenType.Le, "<=")
		this.registerMatch(TokenType.Ge, ">=")
		this.registerMatch(TokenType.And, "&&")
		this.registerMatch(TokenType.Or, "||")

		this.registerMatch(TokenType.Add, "+")
		this.registerMatch(TokenType.Mul, "*")
		this.registerMatch(TokenType.Div, "/")
		this.registerMatch(TokenType.Mod, "%")
		this.registerMatch(TokenType.AND, "&")
		this.registerMatch(TokenType.OR, "|")
		this.registerMatch(TokenType.XOR, "^")
		this.registerMatch(TokenType.NOT, "~")
		this.registerMatch(TokenType.Lt, "<")
		this.registerMatch(TokenType.Gt, ">")
		this.registerMatch(TokenType.Not, "!")
		this.registerMatch(TokenType.Assign, "=")
		this.registerMatch(TokenType.LBracket, "[")
		this.registerMatch(TokenType.RBracket, "]")
		this.registerMatch(TokenType.LParen, "(")
		this.registerMatch(TokenType.RParen, ")")
		this.registerMatch(TokenType.Comma, ",")
		this.registerMatch(TokenType.Period, ".")

		this.registerRegex(TokenType.ElseIf, /\belse if\b/)
		this.registerRegex(TokenType.If, /\bif\b/)
		this.registerRegex(TokenType.Else, /\belse\b/)
		this.registerRegex(TokenType.While, /\bwhile\b/)
		this.registerRegex(TokenType.Break, /\bbreak\b/)
		this.registerRegex(TokenType.Continue, /\bcontinue\b/)
		this.registerRegex(TokenType.Return, /\breturn\b/)
		this.registerRegex(TokenType.Onto, /\bonto\b/)
		this.registerRegex(TokenType.To, /\bto\b/)
		this.registerRegex(TokenType.Bool, /\b(?:true|false)\b/)
		this.registerRegex(TokenType.Type, /\b(?:void|int|uint|long|ulong|float|double|bool)\b/)
		this.registerRegex(TokenType.Const, /\bconst\b/)
		this.registerRegex(TokenType.Export, /\bexport\b/)
		this.registerRegex(TokenType.From, /\bfrom\b/)
		this.registerRegex(TokenType.Import, /\bimport\b/)
		this.registerRegex(TokenType.As, /\bas\b/)
		this.registerRegex(TokenType.Struct, /\bstruct\b/)
		this.registerRegex(TokenType.Map, /\bmap\b/)
		this.registerRegex(TokenType.At, /\bat\b/)

		this.registerRegex(TokenType.Name, /\b[^\d\W]\w*\b/)
		this.registerRegex(TokenType.Float, /(?:-|\b)(?:0b[0-1]+\.?[0-1]*|0o[0-7]+\.?[0-7]*|0x[0-9A-F]+\.?[0-9A-F]*|\d+\.?\d*)f\b/)
		this.registerRegex(TokenType.Double, /(?:-|\b)(?:0b[0-1]+\.[0-1]*|0o[0-7]+\.[0-7]*|0x[0-9A-F]+\.[0-9A-F]*|\d+\.\d*)\b/)
		this.registerRegex(TokenType.ULong, /\b(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)uL\b/)
		this.registerRegex(TokenType.Long, /(?:-|\b)(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)L\b/)
		this.registerRegex(TokenType.UInt, /\b(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)u\b/)
		this.registerRegex(TokenType.Int, /(?:-|\b)(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)\b/)

		// After the number regexes so it doesn't overrule negative constants
		this.registerMatch(TokenType.Sub, "-")
	}
}