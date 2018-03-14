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

	protected printNode(node: AstNode): string {
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
			let out = n.token.value + this.printNode(n.children[0])
			if (this.needsParens(n)) out = '(' + out + ')'
			return out
		})
		this.register(AstType.BinaryOp, (n) => {
			let out = this.printNode(n.children[0]) + ' ' + n.token.value + ' ' + this.printNode(n.children[1])
			if (this.needsParens(n)) out = '(' + out + ')'
			return out
		})
		this.register(AstType.VariableDef, (n) => n.token.value + ' ' + this.printNode(n.children[0]))
		this.register(AstType.FunctionDef, (n) => '\n' + n.children.slice(3).reverse().map((c) => this.printNode(c)).join(' ') + (n.children.length > 3 ? ' ' : '') + n.token.value + ' ' + this.printNode(n.children[0]) + this.printNode(n.children[1]) + this.printNode(n.children[2]))
		this.register(AstType.StructDef, (n) => '\n' + n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ') + (n.children.length > 2 ? ' ' : '') + n.token.value + ' ' + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Fields, (n) => {
			let out = '\n'
			for (let i = 0; i < n.children.length; i++) {
				if (n.children[i].token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let lines = ('\t'.repeat(this.getDepth(n.children[i + 1])) + this.printNode(n.children[i + 1])).split('\n')
					out += lines[0]
					out += this.printNode(n.children[i])
					if (lines.length > 1) out += '\n'
					if (lines.length > 0) out += lines.slice(1).join('\n')
					i++
				} else if (n.children[i].token.type == TokenType.Comment) {
					out += this.printNode(n.children[i])
				} else {
					out += '\t'.repeat(this.getDepth(n.children[i])) + this.printNode(n.children[i])
				}
				if (i != n.children.length - 1) out += '\n'
			}
			return out
		})
		this.register(AstType.Parameters, (n) => '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')')
		this.register(AstType.FunctionCall, (n) => this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Arguments, (n) => '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')')
		this.register(AstType.Assignment, (n) => this.printNode(n.children[0]) + ' ' + n.token.value + ' ' + this.printNode(n.children[1]))
		this.register(AstType.Global, (n) => n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ') + (n.children.length > 2 ? ' ' : '') + this.printNode(n.children[0]) + ' ' + n.token.value + ' ' + this.printNode(n.children[1]))
		this.register(AstType.Access, (n) => this.printNode(n.children[0]) + n.token.value + this.printNode(n.children[1]))
		this.register(AstType.Map, (n) => '\n' + n.token.value + ' ' + this.printNode(n.children[0]) + ' at ' + this.printNode(n.children[1]))
		this.register(AstType.If, (n) => n.token.value + ' ' + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Else, (n) => n.token.value + this.printNode(n.children[0]))
		this.register(AstType.ElseIf, (n) => n.token.value + ' ' + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.While, (n) => n.token.value + ' ' + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Return, (n) => n.token.value + ' ' + this.printNode(n.children[0]))
		this.register(AstType.Block, (n) => {
			let out = '\n'
			for (let i = 0; i < n.children.length; i++) {
				if (n.children[i].token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let lines = ('\t'.repeat(this.getDepth(n.children[i + 1])) + this.printNode(n.children[i + 1])).split('\n')
					out += lines[0]
					out += this.printNode(n.children[i])
					if (lines.length > 1) out += '\n'
					if (lines.length > 0) out += lines.slice(1).join('\n')
					i++
				} else if (n.children[i].token.type == TokenType.Comment) {
					out += this.printNode(n.children[i])
				} else {
					out += '\t'.repeat(this.getDepth(n.children[i])) + this.printNode(n.children[i])
				}
				if (i != n.children.length - 1) out += '\n'
			}
			return out
		})
		this.register(AstType.Program, (n) => {
			let out = ''
			for (let i = 0; i < n.children.length; i++) {
				if (n.children[i].token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let lines = this.printNode(n.children[i + 1]).split('\n')
					out += lines[0]
					out += this.printNode(n.children[i])
					if (lines.length > 1) out += '\n'
					if (lines.length > 0) out += lines.slice(1).join('\n')
					i++
				} else {
					out += this.printNode(n.children[i])
				}
				out += '\n'
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
		[TokenType.As]: 10,
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