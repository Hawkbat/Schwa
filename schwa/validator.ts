import { LogType, LogMsg, Logger } from "./log"
import { TokenType } from "./token"
import { AstNode, AstType } from "./ast"
import { Module } from "./compiler"

export type ValidateRule = (n: AstNode) => void

export class Validator {
	protected mod: Module | undefined
	private ruleMap: { [key: string]: ValidateRule[] } = {}

	constructor(protected logger: Logger) { }

	public validate(mod: Module) {
		this.mod = mod
		if (mod.result.ast) this.validateNode(mod.result.ast)
	}

	private validateNode(node: AstNode) {
		let rules = this.ruleMap[node.type]
		node.valid = true
		if (rules) {
			for (let rule of rules) rule(node)
		}
		if (node.children) {
			for (let child of node.children) if (child) this.validateNode(child)
		}
	}

	protected register(type: AstType, rule: ValidateRule) {
		if (!this.ruleMap[type]) this.ruleMap[type] = []
		this.ruleMap[type].push(rule)
	}

	protected logError(msg: string, node: AstNode) {
		this.logger.log(new LogMsg(LogType.Error, "Validator", msg, this.mod ? this.mod.dir + "/" + this.mod.name : "", node.token.row, node.token.column, node.token.value.length))
	}
}

export class SchwaValidator extends Validator {
	constructor(logger: Logger) {
		super(logger)
		this.registerChildrenType(AstType.Program, [AstType.FunctionDef, AstType.Global, AstType.Comment, AstType.StructDef, AstType.Map, AstType.Import])

		this.registerChildrenType(AstType.Block, [AstType.VariableDef, AstType.Assignment, AstType.FunctionCall, AstType.Comment, AstType.If, AstType.Else, AstType.ElseIf, AstType.While, AstType.Break, AstType.Continue, AstType.Return, AstType.ReturnVoid])

		this.registerChildCount(AstType.Access, 2)
		this.registerChildTypes(AstType.Access, [[AstType.VariableId, AstType.Type, AstType.Indexer, AstType.Access], [AstType.FunctionId, AstType.VariableId]])

		this.registerChildCount(AstType.If, 2)
		this.registerChildTypes(AstType.If, [[AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])

		this.registerChildCount(AstType.Else, 1)
		this.registerPreviousSiblingType(AstType.Else, [AstType.If, AstType.ElseIf])
		this.registerChildTypes(AstType.Else, [[AstType.Block]])

		this.registerChildCount(AstType.ElseIf, 2)
		this.registerPreviousSiblingType(AstType.ElseIf, [AstType.If, AstType.ElseIf])
		this.registerChildTypes(AstType.ElseIf, [[AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])

		this.registerChildCount(AstType.While, 2)
		this.registerChildTypes(AstType.While, [[AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall], [AstType.Block]])

		this.registerChildCount(AstType.Break, 0)
		this.registerAncestorType(AstType.Break, [AstType.While])

		this.registerChildCount(AstType.Continue, 0)
		this.registerAncestorType(AstType.Continue, [AstType.While])

		this.registerChildCount(AstType.Return, 1)
		this.registerChildTypes(AstType.Return, [[AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall]])

		this.registerAncestorType(AstType.Return, [AstType.FunctionDef])

		this.registerChildCount(AstType.ReturnVoid, 0)
		this.registerAncestorType(AstType.ReturnVoid, [AstType.FunctionDef])

		this.registerChildCount(AstType.Assignment, 2)
		this.registerChildTypes(AstType.Assignment, [[AstType.VariableDef, AstType.VariableId, AstType.Access, AstType.Indexer]])

		this.registerChildTypes(AstType.Global, [[AstType.VariableDef], [AstType.Literal]])
		this.registerChildrenType(AstType.Global, [AstType.Const, AstType.Export], 2)

		this.registerChildCount(AstType.FunctionCall, 2)
		this.registerChildTypes(AstType.FunctionCall, [[AstType.FunctionId, AstType.Access], [AstType.Arguments]])

		this.registerChildrenType(AstType.Arguments, [AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall])

		this.registerChildrenType(AstType.Fields, [AstType.VariableDef, AstType.Comment])

		this.registerChildTypes(AstType.StructDef, [[AstType.StructId], [AstType.Fields]])
		this.registerChildrenType(AstType.StructDef, [AstType.Export], 2)

		this.registerChildTypes(AstType.FunctionDef, [[AstType.FunctionId], [AstType.Parameters], [AstType.Block]])
		this.registerChildrenType(AstType.FunctionDef, [AstType.Export], 3)

		this.registerChildrenType(AstType.Parameters, [AstType.VariableDef])

		this.registerChildCount(AstType.VariableDef, 1, 2)
		this.registerChildTypes(AstType.VariableDef, [[AstType.VariableId]])
		this.registerChildrenType(AstType.VariableDef, [AstType.Literal], 1)
		this.registerAncestorType(AstType.VariableDef, [AstType.Assignment, AstType.Global, AstType.Map, AstType.Parameters, AstType.Fields])

		this.registerChildCount(AstType.UnaryOp, 1)
		this.registerChildrenType(AstType.UnaryOp, [AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Type, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall])

		this.registerChildCount(AstType.BinaryOp, 2)
		this.registerChildrenType(AstType.BinaryOp, [AstType.VariableId, AstType.Access, AstType.Indexer, AstType.Type, AstType.Literal, AstType.UnaryOp, AstType.BinaryOp, AstType.FunctionCall])

		this.registerChildCount(AstType.StructId, 0, 1)
		this.registerChildrenType(AstType.VariableId, [AstType.Alias])

		this.registerChildCount(AstType.VariableId, 0, 1)
		this.registerChildrenType(AstType.VariableId, [AstType.Alias])

		this.registerChildCount(AstType.FunctionId, 0, 1)
		this.registerChildrenType(AstType.VariableId, [AstType.Alias])

		this.registerChildTypes(AstType.Map, [[AstType.VariableDef], [AstType.Literal]])

		this.registerAncestorType(AstType.VariableImport, [AstType.Import])
		this.registerAncestorType(AstType.FunctionImport, [AstType.Import])
		this.registerAncestorType(AstType.StructImport, [AstType.Import])

		this.registerChildrenType(AstType.Imports, [AstType.VariableImport, AstType.FunctionImport, AstType.StructImport, AstType.UnknownImport])

		this.registerChildCount(AstType.Import, 1, 2)
		this.registerChildTypes(AstType.Import, [[AstType.ModuleId]])
		this.registerChildrenType(AstType.Import, [AstType.VariableImport, AstType.FunctionImport, AstType.StructImport, AstType.UnknownImport, AstType.Imports], 1)

		this.registerChildCount(AstType.Export, 0)

		this.registerChildCount(AstType.Const, 0)

		this.registerChildCount(AstType.Type, 0)

		this.registerChildCount(AstType.Literal, 0)
	}

	protected registerParentType(type: AstType, parentTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected parent of " + type + " to be " + parentTypes.join(" or ") + " but node has no parent", n)
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
					this.logError("Expected parent of " + type + " to be " + parentTypes.join(" or ") + " but found " + n.parent.type + " instead", n.parent)
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
			this.logError("Expected ancestor of " + type + " to be " + ancestorTypes.join(" or ") + " but no suitable node found", n.parent ? n.parent : n)
			n.valid = false
		})
	}

	protected registerChildCount(type: AstType, min: number, max: number = min) {
		this.register(type, (n) => {
			if (n.children.length < min || n.children.length > max) {
				this.logError("Expected " + type + " to have " + (min == max ? min : min + '-' + max) + ((min == max && min == 1) ? " child" : " children") + " but " + ((!n.children || n.children.length == 0) ? "none" : "" + n.children.length) + " found", n)
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
					this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + type + " to be " + childTypes[i - startIndex].join(" or ") + " but node has no " + this.formatOrdinal(i + 1) + " child", n)
					n.valid = false
				} else {
					let child = n.children[i]
					if (child) {
						let validType = false
						for (let type of childTypes[i - startIndex]) {
							if (child.type == type) {
								validType = true
								break
							}
						}
						if (!validType) {
							this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + type + " to be " + childTypes[i - startIndex].join(" or ") + " but found " + child.type + " instead", child)
							n.valid = false
						}
					}
				}
			}
		})
	}

	protected registerChildrenType(type: AstType, childrenTypes: AstType[], startIndex: number = 0) {
		this.register(type, (n) => {
			if (n.children) {
				for (let i = startIndex; i < n.children.length; i++) {
					let child = n.children[i]
					if (child) {
						let validType = false
						for (let type of childrenTypes) {
							if (child.type == type) {
								validType = true
								break
							}
						}
						if (!validType) {
							this.logError("Expected child of " + type + " to be " + childrenTypes.join(" or ") + " but found " + child.type + " instead", child)
							n.valid = false
						}
					}
				}
			}
		})
	}

	protected registerNextSiblingType(type: AstType, siblingTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no parent", n)
				n.valid = false
				return
			}
			let index = n.parent.children.indexOf(n)
			if (index == n.parent.children.length - 1) {
				this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no next sibling", n)
				n.valid = false
			} else {
				let sibling = n.parent.children[index + 1]
				if (sibling) {
					let validType = false
					for (let type of siblingTypes) {
						if (sibling.type == type) {
							validType = true
							break
						}
					}
					if (!validType) {
						this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but found " + sibling.type + " instead", sibling)
						n.valid = false
					}
				}
			}
		})
	}

	protected registerPreviousSiblingType(type: AstType, siblingTypes: AstType[]) {
		this.register(type, (n) => {
			if (!n.parent) {
				this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no parent", n)
				n.valid = false
				return
			}
			let index = n.parent.children.indexOf(n)
			if (index == 0) {
				this.logError("Expected previous sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no previous sibling", n)
				n.valid = false
			} else {
				let sibling = n.parent.children[index - 1]
				if (sibling) {
					let validType = false
					for (let type of siblingTypes) {
						if (sibling.type == type) {
							validType = true
							break
						}
					}
					if (!validType) {
						this.logError("Expected previous sibling of " + type + " to be " + siblingTypes.join(" or ") + " but found " + sibling.type + " instead", sibling)
						n.valid = false
					}
				}
			}
		})
	}
}
