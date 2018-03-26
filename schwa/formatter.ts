import { TokenType, Token } from "./token"
import { AstNode, AstType } from "./ast"
import { Logger, LogMsg, LogType } from "./log"

export type FormatRule = (n: AstNode) => string

export class Formatter {
	private ruleMap: { [key: string]: FormatRule } = {}

	constructor(protected logger: Logger) { }

	public format(ast: AstNode): string {
		return this.printNode(ast)
	}

	protected printNode(node: AstNode | undefined | null): string {
		if (!node) return ""
		let rule = this.ruleMap[node.type]
		if (rule) return rule(node)
		return node.token.value
	}

	protected register(type: AstType, rule: FormatRule) {
		this.ruleMap[type] = rule
	}

	protected logError(msg: string, node: AstNode) {
		this.logger.log(new LogMsg(LogType.Error, "Formatter", msg, node.token.row, node.token.column, node.token.value.length))
	}
}

export class SchwaFormatter extends Formatter {
	constructor(logger: Logger) {
		super(logger)
		this.register(AstType.UnaryOp, (n) => {
			let l = n.children[0]
			let out = n.token.value
			if (l) out += this.printNode(l)
			if (this.needsParens(n)) out = '(' + out + ')'
			return out
		})
		this.register(AstType.BinaryOp, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = ''
			if (l) out += this.printNode(l) + ' '
			out += n.token.value
			if (r) out += ' ' + this.printNode(r)
			if (this.needsParens(n)) out = '(' + out + ')'
			return out
		})
		this.register(AstType.VariableDef, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = n.token.value
			if (l) out += ' ' + this.printNode(l)
			if (r) out += '[' + this.printNode(r) + ']'
			return out
		})
		this.register(AstType.FunctionDef, (n) => {
			let c0 = n.children[0]
			let c1 = n.children[1]
			let c2 = n.children[2]
			let out = '\n'
			if (n.children.length > 3) {
				out += n.children.slice(3).reverse().map((c) => this.printNode(c)).join(' ')
				out += ' '
			}
			out += n.token.value
			if (c0 || c1 || c2) out += ' '
			if (c0) out += this.printNode(c0)
			if (c1) out += this.printNode(c1)
			if (c2) out += this.printNode(c2)
			return out
		})
		this.register(AstType.StructDef, (n) => {
			let c0 = n.children[0]
			let c1 = n.children[1]
			let out = '\n'
			if (n.children.length > 2) {
				out += n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ')
				out += ' '
			}
			out += n.token.value
			if (c0 || c1) out += ' '
			if (c0) out += this.printNode(c0)
			if (c1) out += this.printNode(c1)
			return out
		})
		this.register(AstType.Fields, (n) => {
			let out = '\n'
			for (let i = 0; i < n.children.length; i++) {
				let c = n.children[i]
				if (!c) continue
				if (c.token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let cn = n.children[i + 1]
					if (cn) {
						let lines = ('\t'.repeat(this.getDepth(cn)) + this.printNode(cn)).split('\n')
						out += lines[0]
						out += this.printNode(c)
						if (lines.length > 1) out += '\n'
						if (lines.length > 0) out += lines.slice(1).join('\n')
					}
					i++
				} else if (c.token.type == TokenType.Comment) {
					out += this.printNode(c)
				} else {
					out += '\t'.repeat(this.getDepth(c)) + this.printNode(c)
				}
				if (i != n.children.length - 1) out += '\n'
			}
			return out
		})
		this.register(AstType.Parameters, (n) => {
			let out = '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')'
			return out
		})
		this.register(AstType.FunctionCall, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = ''
			if (l) out += this.printNode(l)
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.Arguments, (n) => {
			let out = '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')'
			return out
		})
		this.register(AstType.Assignment, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = ''
			if (l) out += this.printNode(l) + ' '
			out += '='
			if (r) out += ' ' + this.printNode(r)
			return out
		})
		this.register(AstType.Global, (n) => {
			let c0 = n.children[0]
			let c1 = n.children[1]
			let out = ''
			if (n.children.length > 2) {
				out += n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ')
				out += ' '
			}
			if (c0) out += this.printNode(c0)
			out += ' = '
			if (c1) out += this.printNode(c1)
			return out
		})
		this.register(AstType.Indexer, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = ''
			if (l) out += this.printNode(l)
			if (r) out += '[' + this.printNode(r) + ']'
			return out
		})
		this.register(AstType.Access, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = ''
			if (l) out += this.printNode(l)
			out += '.'
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.Map, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = '\n'
			out += 'map'
			if (l) out += ' ' + this.printNode(l)
			out += ' at '
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.If, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = 'if'
			if (l || r) out += ' '
			if (l) out += this.printNode(l)
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.Else, (n) => {
			let l = n.children[0]
			let out = 'else'
			if (l) out += this.printNode(l)
			return out
		})
		this.register(AstType.ElseIf, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = 'else if'
			if (l || r) out += ' '
			if (l) out += this.printNode(l)
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.While, (n) => {
			let l = n.children[0]
			let r = n.children[1]
			let out = 'while'
			if (l || r) out += ' '
			if (l) out += this.printNode(l)
			if (r) out += this.printNode(r)
			return out
		})
		this.register(AstType.Return, (n) => {
			let l = n.children[0]
			let out = 'return'
			if (l) out += ' ' + this.printNode(l)
			return out
		})
		this.register(AstType.Block, (n) => {
			let out = '\n'
			for (let i = 0; i < n.children.length; i++) {
				let c = n.children[i]
				if (!c) continue
				if (c.token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let cn = n.children[i + 1]
					if (cn) {
						let lines = ('\t'.repeat(this.getDepth(cn)) + this.printNode(cn)).split('\n')
						out += lines[0]
						out += this.printNode(c)
						if (lines.length > 1) out += '\n'
						if (lines.length > 0) out += lines.slice(1).join('\n')
					}
					i++
				} else if (c.token.type == TokenType.Comment) {
					out += this.printNode(c)
				} else {
					out += '\t'.repeat(this.getDepth(c)) + this.printNode(c)
				}
				if (i != n.children.length - 1) out += '\n'
			}
			return out
		})
		this.register(AstType.Program, (n) => {
			let out = ''
			for (let i = 0; i < n.children.length; i++) {
				let c = n.children[i]
				if (!c) continue
				if (c.token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let cn = n.children[i + 1]
					if (cn) {
						let lines = this.printNode(cn).split('\n')
						out += lines[0]
						out += this.printNode(c)
						if (lines.length > 1) out += '\n'
						if (lines.length > 0) out += lines.slice(1).join('\n')
					}
					i++
					out += '\n'
				} else if (c.token.type == TokenType.Comment) {
					out += '\n'
					out += this.printNode(c)
				} else {
					out += this.printNode(c)
					out += '\n'
				}
			}
			return out
		})
	}

	protected PRECEDENCE_MAP: { [key: string]: number } = {
		[TokenType.And]: 1,
		[TokenType.Or]: 2,
		[TokenType.Eq]: 3,
		[TokenType.Ne]: 3,
		[TokenType.Lt]: 3,
		[TokenType.Le]: 3,
		[TokenType.Gt]: 3,
		[TokenType.Ge]: 3,
		[TokenType.ShL]: 4,
		[TokenType.ShR]: 4,
		[TokenType.RotL]: 4,
		[TokenType.RotR]: 4,
		[TokenType.OR]: 5,
		[TokenType.XOR]: 6,
		[TokenType.AND]: 7,
		[TokenType.Add]: 8,
		[TokenType.Sub]: 8,
		[TokenType.Mul]: 9,
		[TokenType.Div]: 9,
		[TokenType.Mod]: 9,
		[TokenType.Onto]: 10,
		[TokenType.To]: 10,
		[TokenType.Neg]: 11,
		[TokenType.NOT]: 11,
		[TokenType.Not]: 11
	}

	protected needsParens(n: AstNode): boolean {
		if (n.parent && (n.parent.type == AstType.BinaryOp || n.parent.type == AstType.UnaryOp)) {
			let isLeft = n == n.parent.children[0]
			let nP = this.PRECEDENCE_MAP[n.token.type]
			let pP = this.PRECEDENCE_MAP[n.parent.token.type]
			if (isLeft && nP < pP) return true
			if (!isLeft && nP <= pP) return true
		}
		return false
	}

	protected getDepth(node: AstNode): number {
		if (!node.parent) return 0
		if (node.parent.type == AstType.Block || node.parent.type == AstType.Fields) return this.getDepth(node.parent) + 1
		else return this.getDepth(node.parent)
	}
}