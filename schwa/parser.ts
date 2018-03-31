import { Token, TokenType } from "./token"
import { LogType, LogMsg, Logger } from "./log"
import { AstType, AstNode } from "./ast"
import { Module } from "./compiler"
import * as utils from "./utils"

export type PrefixFunc = (token: Token) => AstNode
export type InfixFunc = (left: AstNode | null, token: Token) => AstNode

export class Parser {
	protected mod: Module | undefined
	private prefixFuncMap: { [key: string]: PrefixFunc } = {}
	private infixFuncMap: { [key: string]: InfixFunc } = {}
	private prefixPrecedenceMap: { [key: string]: number } = {}
	private infixPrecedenceMap: { [key: string]: number } = {}

	private index: number = 0
	private tokens: Token[] | null | undefined = null

	constructor(protected logger: Logger) { }

	public parse(mod: Module): AstNode | null {
		this.mod = mod
		this.index = 0
		this.tokens = mod.result.tokens
		return this.parseNode(0)
	}

	protected parseNode(precedence?: number): AstNode | null {
		if (!precedence) precedence = 0
		let token = this.consume()
		if (!token) return null
		let prefixFunc = this.prefixFuncMap[token.type]

		if (!prefixFunc) {
			if (token.type != TokenType.Unknown)
				this.logError("Unable to parse token " + token.type + (token.type == token.value ? "" : " " + JSON.stringify(token.value)), token)
			return new AstNode(AstType.Unknown, token, [])
		}

		let left = prefixFunc(token)

		while (this.peek() && precedence < this.getPrecedence()) {
			token = this.consume()
			if (token) {
				let infixFunc = this.infixFuncMap[token.type]
				left = infixFunc(left, token)
			}
		}
		return left
	}

	private getPrecedence(): number {
		let token = this.peek()
		if (token) {
			let infixFunc = this.infixFuncMap[token.type]
			if (!infixFunc) return 0
			return this.infixPrecedenceMap[token.type]
		}
		return 0
	}

	protected consume(): Token | null {
		if (!this.tokens) return null
		return this.tokens[this.index++]
	}

	protected peek(): Token | null {
		if (!this.tokens) return null
		return this.tokens[this.index]
	}

	protected consumeMatch(type: TokenType, match: TokenType): Token | null {
		let token = this.peek()
		if (token && token.type != match) {
			this.logWarning(type + " expected " + match + " but got " + (token.type == token.value ? token.type : token.type + " " + JSON.stringify(token.value)), token)
			return token
		}
		return this.consume()
	}

	protected match(type: TokenType): boolean {
		let token = this.peek()
		return token ? token.type == type : false
	}

	protected registerPrefix(type: TokenType, precedence: number, func: PrefixFunc): void {
		this.prefixPrecedenceMap[type] = precedence
		this.prefixFuncMap[type] = func
	}

	protected registerPrefixOp(type: TokenType, precedence: number) {
		this.registerPrefix(type, precedence, (token) => {
			let n
			if (!this.match(TokenType.EOL)) {
				n = this.parseNode(precedence)
			}
			return new AstNode(AstType.UnaryOp, token, n ? [n] : [])
		})
	}

	protected registerInfix(type: TokenType, precedence: number, func: InfixFunc): void {
		this.infixPrecedenceMap[type] = precedence
		this.infixFuncMap[type] = func
	}

	protected registerInfixOp(type: TokenType, precedence: number, rightAssociative: boolean) {
		this.registerInfix(type, precedence, (left, token) => {
			let children = []
			if (left) children.push(left)
			if (!this.match(TokenType.EOL)) {
				let n = this.parseNode((rightAssociative) ? precedence - 1 : precedence)
				if (n) children.push(n)
			}
			return new AstNode(AstType.BinaryOp, token, children)
		})
	}

	protected registerPostfixOp(type: TokenType, precedence: number): void {
		this.registerInfix(type, precedence, (left, token) => new AstNode(AstType.UnaryOp, token, left ? [left] : []))
	}

	protected logError(msg: string, token: Token) {
		this.logger.log(new LogMsg(LogType.Error, "Parser", msg, utils.getModulePath(this.mod), token.row, token.column, token.value.length))
	}

	protected logWarning(msg: string, token: Token) {
		this.logger.log(new LogMsg(LogType.Warning, "Parser", msg, utils.getModulePath(this.mod), token.row, token.column, token.value.length))
	}
}

export class SchwaParser extends Parser {
	constructor(logger: Logger) {
		super(logger)
		this.registerPrefix(TokenType.Name, 0, (t) => {
			if (this.match(TokenType.Name)) {
				let r = this.parseNode(1)
				if (r && r.type == AstType.Indexer) {
					return new AstNode(AstType.VariableDef, t, [...r.children])
				}
				if (r && r.type == AstType.VariableId) {
					return new AstNode(AstType.VariableDef, t, [r])
				}
				else if (r && r.type == AstType.FunctionCall) {
					let params = r.children[1]
					if (params) params.type = AstType.Parameters
					return new AstNode(AstType.FunctionDef, t, [r.children[0], params])
				}
			}
			return new AstNode(AstType.VariableId, t, [])
		})
		this.registerPrefix(TokenType.Int, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.UInt, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.Long, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.ULong, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.Float, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.Double, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.Bool, 0, (t) => new AstNode(AstType.Literal, t, []))
		this.registerPrefix(TokenType.Type, 2, (t) => {
			if (this.match(TokenType.Name)) {
				let r = this.parseNode(1)
				if (r && r.type == AstType.VariableId) {
					return new AstNode(AstType.VariableDef, t, [r])
				}
				else if (r && r.type == AstType.FunctionCall) {
					let params = r.children[1]
					if (params) params.type = AstType.Parameters
					return new AstNode(AstType.FunctionDef, t, [r.children[0], params])
				}
			}
			if (this.match(TokenType.Period)) {
				return new AstNode(AstType.ScopeId, t, [])
			}
			return new AstNode(AstType.Type, t, [])
		})
		this.registerPrefix(TokenType.Const, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			if (!n) return new AstNode(AstType.Const, t, [])
			return new AstNode(n.type, n.token, [...n.children, new AstNode(AstType.Const, t, [])])
		})
		this.registerPrefix(TokenType.Export, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			if (!n) return new AstNode(AstType.Export, t, [])
			return new AstNode(n.type, n.token, [...n.children, new AstNode(AstType.Export, t, [])])
		})
		this.registerPrefix(TokenType.Struct, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) {
				n = this.parseNode()
				if (n && n.type == AstType.VariableId) n.type = AstType.StructId
			}
			return new AstNode(AstType.StructDef, t, n ? [n] : [])
		})
		this.registerPrefix(TokenType.Map, 2, (t) => {
			let children = []
			if (this.match(TokenType.Name) || this.match(TokenType.Type)) {
				let n = this.parseNode()
				if (n) children.push(n)
			}
			if (this.match(TokenType.At)) {
				this.consume()
				if (!this.match(TokenType.EOL)) {
					let n = this.parseNode()
					if (n) children.push(n)
				}
			}
			return new AstNode(AstType.Map, t, children)
		})
		this.registerPrefix(TokenType.From, 2, (t) => {
			let n
			if (!this.match(TokenType.EOL) && this.match(TokenType.Name)) n = this.parseNode()
			if (!n) return new AstNode(AstType.From, t, [])
			n.type = AstType.ModuleId
			if (this.match(TokenType.Import)) {
				let r = this.parseNode()
				if (r && r.children.length > 0) {
					let rn = r.children[0]
					if (rn && rn.type == AstType.ModuleId) rn.type = AstType.UnknownImport
				}
				if (r) return new AstNode(r.type, r.token, [n, ...r.children])
			}
			return new AstNode(AstType.From, t, [n])
		})
		this.registerPrefix(TokenType.Import, 2, (t) => {
			let children = []
			if (this.match(TokenType.Name) || this.match(TokenType.Type)) {
				let n = this.parseNode()
				if (n) {
					if (n.type == AstType.VariableDef) n.type = AstType.VariableImport
					if (n.type == AstType.FunctionDef) n.type = AstType.FunctionImport
					if (n.type == AstType.StructDef) n.type = AstType.StructImport
					if (n.type == AstType.VariableId) n.type = AstType.ModuleId
					children.push(n)
				}
			}
			return new AstNode(AstType.Import, t, children)
		})
		this.registerPrefix(TokenType.Comment, 0, (t) => new AstNode(AstType.Comment, t, []))
		this.registerPrefix(TokenType.InlineComment, 0, (t) => new AstNode(AstType.Comment, t, []))
		this.registerPrefix(TokenType.If, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			return new AstNode(AstType.If, t, n ? [n] : [])
		})
		this.registerPrefix(TokenType.Else, 1, (t) => new AstNode(AstType.Else, t, []))
		this.registerPrefix(TokenType.ElseIf, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			return new AstNode(AstType.ElseIf, t, n ? [n] : [])
		})
		this.registerPrefix(TokenType.While, 1, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			return new AstNode(AstType.While, t, n ? [n] : [])
		})
		this.registerPrefix(TokenType.Break, 1, (t) => new AstNode(AstType.Break, t, []))
		this.registerPrefix(TokenType.Continue, 1, (t) => new AstNode(AstType.Continue, t, []))
		this.registerPrefix(TokenType.Return, 1, (t) => {
			if (this.match(TokenType.EOL)) return new AstNode(AstType.ReturnVoid, t, [])
			else {
				let n = this.parseNode()
				return new AstNode(AstType.Return, t, n ? [n] : [])
			}
		})
		this.registerInfix(TokenType.Assign, 1, (l, t) => {
			let children = []
			if (l) children.push(l)
			if (!this.match(TokenType.EOL)) {
				let n = this.parseNode()
				if (n) children.push(n)
			}
			return new AstNode(AstType.Assignment, t, children)
		})
		this.registerInfixOp(TokenType.And, 1, false)
		this.registerInfixOp(TokenType.Or, 2, false)
		this.registerInfixOp(TokenType.Eq, 3, false)
		this.registerInfixOp(TokenType.Ne, 3, false)
		this.registerInfixOp(TokenType.Lt, 3, false)
		this.registerInfixOp(TokenType.Le, 3, false)
		this.registerInfixOp(TokenType.Gt, 3, false)
		this.registerInfixOp(TokenType.Ge, 3, false)
		this.registerInfixOp(TokenType.ShL, 4, false)
		this.registerInfixOp(TokenType.ShR, 4, false)
		this.registerInfixOp(TokenType.RotL, 4, false)
		this.registerInfixOp(TokenType.RotR, 4, false)
		this.registerInfixOp(TokenType.OR, 5, false)
		this.registerInfixOp(TokenType.XOR, 6, false)
		this.registerInfixOp(TokenType.AND, 7, false)
		this.registerInfixOp(TokenType.Add, 8, false)
		this.registerInfixOp(TokenType.Sub, 8, false)
		this.registerInfixOp(TokenType.Mul, 9, false)
		this.registerInfixOp(TokenType.Div, 9, false)
		this.registerInfixOp(TokenType.Mod, 9, false)
		this.registerInfixOp(TokenType.Onto, 10, false)
		this.registerInfixOp(TokenType.To, 10, false)
		// Unary negation reinterprets prefix Sub as Neg to distinguish them in the AST
		this.registerPrefix(TokenType.Sub, 11, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode(10)
			return new AstNode(AstType.UnaryOp, new Token(TokenType.Neg, t.value, t.row, t.column), n ? [n] : [])
		})
		this.registerPrefixOp(TokenType.NOT, 11)
		this.registerPrefixOp(TokenType.Not, 11)
		// Grouping parentheses
		this.registerPrefix(TokenType.LParen, 12, (t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			this.consumeMatch(TokenType.LParen, TokenType.RParen)
			if (!n) return new AstNode(AstType.Unknown, t, [])
			return n
		})
		// Function calls
		this.registerInfix(TokenType.LParen, 12, (l, t) => {
			let args: AstNode[] = []
			while (!this.match(TokenType.RParen) && !this.match(TokenType.EOL)) {
				let n
				if (!this.match(TokenType.EOL)) n = this.parseNode()
				if (n) args.push(n)
				if (this.match(TokenType.Comma)) this.consume()
			}
			this.consumeMatch(TokenType.LParen, TokenType.RParen)
			let id: AstNode | undefined | null = l
			if (id) {
				while (id && (id.type == AstType.Access || id.type == AstType.Indexer)) {
					if (id.type == AstType.Indexer) id = id.children[0]
					else if (id.type == AstType.Access) id = id.children[1]
				}
				if (id && id.type == AstType.VariableId) id.type = AstType.FunctionId
			}
			let children = []
			if (l) children.push(l)
			children.push(new AstNode(AstType.Arguments, t, args))
			return new AstNode(AstType.FunctionCall, new Token(TokenType.None, '', t.row, t.column), children)
		})
		// Array indexing
		this.registerInfix(TokenType.LBracket, 13, (l, t) => {
			let children = []
			if (l) children.push(l)
			while (!this.match(TokenType.RBracket) && !this.match(TokenType.EOL)) {
				let n
				if (!this.match(TokenType.EOL)) n = this.parseNode()
				if (n) children.push(n)
				if (this.match(TokenType.Comma)) this.consume()
			}
			this.consumeMatch(TokenType.LBracket, TokenType.RBracket)
			return new AstNode(AstType.Indexer, t, children)
		})
		// Scope access
		this.registerInfix(TokenType.Period, 14, (l, t) => {
			let children = []
			if (l) children.push(l)
			if (this.match(TokenType.Name)) {
				let n = this.parseNode(14)
				if (n) children.push(n)
			} else {
				this.consumeMatch(TokenType.Period, TokenType.Name)
			}
			return new AstNode(AstType.Access, t, children)
		})
		// Aliasing
		this.registerInfix(TokenType.As, 15, (l, t) => {
			let n
			if (!this.match(TokenType.EOL)) n = this.parseNode()
			if (l && n) {
				n.type = AstType.Alias
				let id = utils.getIdentifier(l)
				if (id) {
					n.parent = id
					id.children.push(n)
				}
				return l
			}
			if (n) {
				n.type = AstType.Alias
				return n
			}
			else return new AstNode(AstType.Alias, t, [])
		})
		// Statements
		this.registerPrefix(TokenType.BOL, 16, (t) => {
			let n = this.parseNode()
			this.consumeMatch(TokenType.BOL, TokenType.EOL)
			if (!n) return new AstNode(AstType.Unknown, t, [])
			return n
		})
		// Blocks
		this.registerInfix(TokenType.Indent, 17, (l, t) => {
			let children: AstNode[] = []
			while (!this.match(TokenType.Dedent)) {
				let n = this.parseNode()
				if (n) children.push(n)
			}
			this.consumeMatch(TokenType.Indent, TokenType.Dedent)
			let n = new AstNode(AstType.Block, t, children)
			if (l) {
				if (l.type == AstType.FunctionDef) {
					l.children.splice(2, 0, n)
					return new AstNode(l.type, l.token, l.children)
				} else if (l.type == AstType.StructDef) {
					n.type = AstType.Fields
					l.children.splice(1, 0, n)
					return new AstNode(l.type, l.token, l.children)
				} else if (l.type == AstType.Import) {
					n.type = AstType.Imports
					for (let child of children) {
						if (child.type == AstType.VariableDef) child.type = AstType.VariableImport
						if (child.type == AstType.FunctionDef) child.type = AstType.FunctionImport
						if (child.type == AstType.StructDef) child.type = AstType.StructImport
						if (child.type == AstType.VariableId) child.type = AstType.UnknownImport
					}
				}
				return new AstNode(l.type, l.token, l.children.concat([n]))
			}
			return n
		})
		// Program
		this.registerPrefix(TokenType.BOF, 18, (t) => {
			let children: AstNode[] = []
			while (!this.match(TokenType.EOF)) {
				let child = this.parseNode()
				if (child) {
					if (child.type == AstType.Assignment) child.type = AstType.Global
					children.push(child)
				}
			}
			this.consumeMatch(TokenType.EOF, TokenType.EOF)
			return new AstNode(AstType.Program, t, children)
		})
	}
}