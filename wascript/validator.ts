import { LogType, LogMsg, Logger } from "./log"
import { TokenType } from "./token"
import { AstNode, AstType } from "./ast"

export type ValidateRule = (n: AstNode) => void

export class Validator {
	private ruleMap: { [key: number]: ValidateRule[] } = {}

	constructor(protected logger: Logger) { }

	public validate(ast: AstNode) {
		this.validateNode(ast)
	}

	private validateNode(node: AstNode) {
		let rules = this.ruleMap[node.type]
		node.valid = true
		if (rules) {
			for (let rule of rules) rule(node)
		}
		if (node.children) {
			for (let child of node.children) this.validateNode(child)
		}
	}

	protected register(type: AstType, rule: ValidateRule) {
		if (!this.ruleMap[type]) this.ruleMap[type] = []
		this.ruleMap[type].push(rule)
	}

	protected logError(msg: string, node: AstNode) {
		this.logger.log(new LogMsg(LogType.Error, "Validator", msg, node.token.row, node.token.column, node.token.value.length))
	}
}

export class WAScriptValidator extends Validator {
	constructor(logger: Logger) {
		super(logger)
		this.registerChildrenType(AstType.Program, [AstType.FunctionDef, AstType.Global, AstType.Comment])
		this.registerChildrenType(AstType.Block, [AstType.VariableDef, AstType.Assignment, AstType.FunctionCall, AstType.Comment, AstType.If, AstType.Else, AstType.ElseIf, AstType.While, AstType.Break, AstType.Continue, AstType.Return, AstType.ReturnVoid])
		this.registerChildCount(AstType.Access, 2)
		this.registerChildTypes(AstType.Access, [[AstType.VariableId, AstType.Type], [AstType.FunctionId, AstType.VariableId, AstType.Access]])
		this.registerChildCount(AstType.If, 2)
		this.registerChildTypes(AstType.If, [[AstType.VariableId, AstType.Access, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])
		this.registerChildCount(AstType.Else, 1)
		this.registerPreviousSiblingType(AstType.Else, [AstType.If, AstType.ElseIf])
		this.registerChildTypes(AstType.Else, [[AstType.Block]])
		this.registerChildCount(AstType.ElseIf, 2)
		this.registerPreviousSiblingType(AstType.ElseIf, [AstType.If, AstType.ElseIf])
		this.registerChildTypes(AstType.ElseIf, [[AstType.VariableId, AstType.Access, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])
		this.registerChildCount(AstType.While, 2)
		this.registerChildTypes(AstType.While, [[AstType.VariableId, AstType.Access, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])
		this.registerChildCount(AstType.Break, 0)
		this.registerAncestorType(AstType.Break, [AstType.While])
		this.registerChildCount(AstType.Continue, 0)
		this.registerAncestorType(AstType.Continue, [AstType.While])
		this.registerChildCount(AstType.Return, 1)
		this.registerChildTypes(AstType.Return, [[AstType.VariableId, AstType.Access, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall]])
		this.registerAncestorType(AstType.Return, [AstType.FunctionDef])
		this.registerChildCount(AstType.ReturnVoid, 0)
		this.registerAncestorType(AstType.ReturnVoid, [AstType.FunctionDef])
		this.registerChildCount(AstType.Assignment, 2)
		this.registerChildTypes(AstType.Assignment, [[AstType.VariableDef, AstType.VariableId, AstType.Access]])
		this.registerChildTypes(AstType.Global, [[AstType.VariableDef], [AstType.Literal]])
		this.registerChildrenType(AstType.Global, [AstType.Const, AstType.Export], 2)
		this.registerChildCount(AstType.FunctionCall, 2)
		this.registerChildTypes(AstType.FunctionCall, [[AstType.FunctionId, AstType.Access], [AstType.Arguments]])
		this.registerChildrenType(AstType.Arguments, [AstType.VariableId, AstType.Access, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp])
		this.registerChildTypes(AstType.FunctionDef, [[AstType.FunctionId], [AstType.Parameters], [AstType.Block]])
		this.registerChildrenType(AstType.FunctionDef, [AstType.Export], 3)
		this.registerChildrenType(AstType.Parameters, [AstType.VariableDef])
		this.registerChildCount(AstType.VariableDef, 1)
		this.registerChildTypes(AstType.VariableDef, [[AstType.VariableId]])
		this.registerAncestorType(AstType.VariableDef, [AstType.Assignment, AstType.Global, AstType.Parameters])
		this.registerChildCount(AstType.UnaryOp, 1)
		this.registerChildrenType(AstType.UnaryOp, [AstType.VariableId, AstType.Access, AstType.Type, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall])
		this.registerChildCount(AstType.BinaryOp, 2)
		this.registerChildrenType(AstType.BinaryOp, [AstType.VariableId, AstType.Access, AstType.Type, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall])
		this.registerChildCount(AstType.VariableId, 0)
		this.registerChildCount(AstType.FunctionId, 0)
		this.registerChildCount(AstType.Export, 0)
		this.registerChildCount(AstType.Const, 0)
		this.registerChildCount(AstType.Type, 0)
		this.registerChildCount(AstType.Literal, 0)
	}

	protected registerParentType(type: AstType, parentTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected parent of " + AstType[type] + " node to be " + parentTypes.map(t => AstType[t]).join(" node or ") + " node but node has no parent", n)
				n.valid = false
			} else {
				let validType = false
				for (let type of parentTypes) {
					if (n.parent.type == type) {
						validType = true
						break
					}
				}
				if (!validType) {
					this.logError("Expected parent of " + AstType[type] + " node to be " + parentTypes.map(t => AstType[t]).join(" node or ") + " node but found " + AstType[n.parent.type] + " node instead", n.parent)
					n.valid = false
				}
			}
		})
	}

	protected registerAncestorType(type: AstType, ancestorTypes: AstType[]) {
		this.register(type, (n) => {
			let p = n.parent
			while (p) {
				for (let type of ancestorTypes) {
					if (p.type == type) return
				}
				p = p.parent
			}
			this.logError("Expected ancestor of " + AstType[type] + " node to be " + ancestorTypes.map(t => AstType[t]).join(" node or ") + " node but no suitable node found", n.parent ? n.parent : n)
			n.valid = false
		})
	}

	protected registerChildCount(type: AstType, count: number) {
		this.register(type, (n) => {
			if ((!n.children && count > 0) || (n.children && n.children.length != count)) {
				this.logError("Expected " + AstType[type] + " node to have " + count + (count == 1 ? " child" : " children") + " but " + ((!n.children || n.children.length == 0) ? "none" : "" + n.children.length) + " found", n)
				n.valid = false
			}
		})
	}

	protected formatOrdinal(n: number): string {
		let str = n.toFixed()
		if (str != "11" && str.endsWith('1')) return str + "st"
		else if (str != "12" && str.endsWith('2')) return str + "nd"
		else if (str != "13" && str.endsWith('3')) return str + "rd"
		else return str + "th"
	}

	protected registerChildTypes(type: AstType, childTypes: AstType[][], startIndex: number = 0) {
		this.register(type, (n) => {
			for (let i = startIndex; i < startIndex + childTypes.length; i++) {
				if (!n.children || n.children.length <= i) {
					this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + AstType[type] + " node to be " + childTypes[i - startIndex].map(t => AstType[t]).join(" node or ") + " node but node has no " + this.formatOrdinal(i + 1) + " child", n)
					n.valid = false
				} else {
					let validType = false
					for (let type of childTypes[i - startIndex]) {
						if (n.children[i].type == type) {
							validType = true
							break
						}
					}
					if (!validType) {
						this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + AstType[type] + " node to be " + childTypes[i - startIndex].map(t => AstType[t]).join(" node or ") + " node but found " + AstType[n.children[i].type] + " node instead", n.children[i])
						n.valid = false
					}
				}
			}
		})
	}

	protected registerChildrenType(type: AstType, childrenTypes: AstType[], startIndex: number = 0) {
		this.register(type, (n) => {
			if (n.children) {
				for (let i = startIndex; i < n.children.length; i++) {
					let validType = false
					for (let type of childrenTypes) {
						if (n.children[i].type == type) {
							validType = true
							break
						}
					}
					if (!validType) {
						this.logError("Expected child of " + AstType[type] + " node to be " + childrenTypes.map(t => AstType[t]).join(" node or ") + " node but found " + AstType[n.children[i].type] + " node instead", n.children[i])
						n.valid = false
					}
				}
			}
		})
	}

	protected registerNextSiblingType(type: AstType, siblingTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected next sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but node has no parent", n)
				n.valid = false
				return
			}
			let index = n.parent.children.indexOf(n)
			if (index == n.parent.children.length - 1) {
				this.logError("Expected next sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but node has no next sibling", n)
				n.valid = false
			} else {
				let sibling = n.parent.children[index + 1]
				let validType = false
				for (let type of siblingTypes) {
					if (sibling.type == type) {
						validType = true
						break
					}
				}
				if (!validType) {
					this.logError("Expected next sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but found " + AstType[sibling.type] + " node instead", sibling)
					n.valid = false
				}
			}
		})
	}

	protected registerPreviousSiblingType(type: AstType, siblingTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected next sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but node has no parent", n)
				n.valid = false
				return
			}
			let index = n.parent.children.indexOf(n)
			if (index == 0) {
				this.logError("Expected previous sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but node has no previous sibling", n)
				n.valid = false
			} else {
				let sibling = n.parent.children[index - 1]
				let validType = false
				for (let type of siblingTypes) {
					if (sibling.type == type) {
						validType = true
						break
					}
				}
				if (!validType) {
					this.logError("Expected previous sibling of " + AstType[type] + " node to be " + siblingTypes.map(t => AstType[t]).join(" node or ") + " node but found " + AstType[sibling.type] + " node instead", sibling)
					n.valid = false
				}
			}
		})
	}
}
