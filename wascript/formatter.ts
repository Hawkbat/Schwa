import { TokenType } from "./token"
import { AstNode, AstType } from "./ast"
import { Logger, LogMsg, LogType } from "./log"

export type FormatRule = (n: AstNode) => string

export class Formatter {
	private ruleMap: { [key: number]: FormatRule } = {}

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

export class WAScriptFormatter extends Formatter {
	constructor(logger: Logger) {
		super(logger)
		this.register(AstType.UnaryOp, (n) => n.token.value + this.printNode(n.children[0]))
		this.register(AstType.BinaryOp, (n) => this.printNode(n.children[0]) + " " + n.token.value + " " + this.printNode(n.children[1]))
		this.register(AstType.VariableDef, (n) => n.token.value + " " + this.printNode(n.children[0]))
		this.register(AstType.FunctionDef, (n) => '\n' + n.children.slice(3).reverse().map((c) => this.printNode(c)).join(' ') + (n.children.length > 3 ? ' ' : '') + n.token.value + " " + this.printNode(n.children[0]) + this.printNode(n.children[1]) + this.printNode(n.children[2]))
		this.register(AstType.Parameters, (n) => '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')')
		this.register(AstType.FunctionCall, (n) => this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Arguments, (n) => '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')')
		this.register(AstType.Assignment, (n) => this.printNode(n.children[0]) + " " + n.token.value + " " + this.printNode(n.children[1]))
		this.register(AstType.Global, (n) => n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ') + (n.children.length > 2 ? ' ' : '') + this.printNode(n.children[0]) + " " + n.token.value + " " + this.printNode(n.children[1]))
		this.register(AstType.Access, (n) => this.printNode(n.children[0]) + n.token.value + this.printNode(n.children[1]))
		this.register(AstType.If, (n) => n.token.value + " " + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Else, (n) => n.token.value + this.printNode(n.children[0]))
		this.register(AstType.ElseIf, (n) => n.token.value + " " + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.While, (n) => n.token.value + " " + this.printNode(n.children[0]) + this.printNode(n.children[1]))
		this.register(AstType.Return, (n) => n.token.value + " " + this.printNode(n.children[0]))
		this.register(AstType.Block, (n) => {
			let out = '\n'
			for (let i = 0; i < n.children.length; i++) {
				if (n.children[i].token.type == TokenType.InlineComment && i + 1 < n.children.length) {
					let lines = ('\t'.repeat(this.getDepth(n.children[i + 1])) + this.printNode(n.children[i + 1])).split('\n')
					out += lines[0]
					out += this.printNode(n.children[i]) + '\n'
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
					out += this.printNode(n.children[i]) + '\n'
					if (lines.length > 0) out += lines.slice(1).join('\n')
					i++
				} else {
					out += this.printNode(n.children[i])
				}
				if (i != n.children.length - 1) out += '\n'
			}
			out += '\n'
			return out
		})
	}

	protected getDepth(node: AstNode): number {
		if (!node.parent) return 0
		if (node.parent.type == AstType.Block) return this.getDepth(node.parent) + 1
		else return this.getDepth(node.parent)
	}
}