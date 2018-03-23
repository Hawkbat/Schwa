"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./log");
const ast_1 = require("./ast");
class Validator {
    constructor(logger) {
        this.logger = logger;
        this.ruleMap = {};
    }
    validate(ast) {
        this.validateNode(ast);
    }
    validateNode(node) {
        let rules = this.ruleMap[node.type];
        node.valid = true;
        if (rules) {
            for (let rule of rules)
                rule(node);
        }
        if (node.children) {
            for (let child of node.children)
                if (child)
                    this.validateNode(child);
        }
    }
    register(type, rule) {
        if (!this.ruleMap[type])
            this.ruleMap[type] = [];
        this.ruleMap[type].push(rule);
    }
    logError(msg, node) {
        this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Validator", msg, node.token.row, node.token.column, node.token.value.length));
    }
}
exports.Validator = Validator;
class SchwaValidator extends Validator {
    constructor(logger) {
        super(logger);
        this.registerChildrenType(ast_1.AstType.Program, [ast_1.AstType.FunctionDef, ast_1.AstType.Global, ast_1.AstType.Comment, ast_1.AstType.StructDef, ast_1.AstType.Map]);
        this.registerChildrenType(ast_1.AstType.Block, [ast_1.AstType.VariableDef, ast_1.AstType.Assignment, ast_1.AstType.FunctionCall, ast_1.AstType.Comment, ast_1.AstType.If, ast_1.AstType.Else, ast_1.AstType.ElseIf, ast_1.AstType.While, ast_1.AstType.Break, ast_1.AstType.Continue, ast_1.AstType.Return, ast_1.AstType.ReturnVoid]);
        this.registerChildCount(ast_1.AstType.Access, 2);
        this.registerChildTypes(ast_1.AstType.Access, [[ast_1.AstType.VariableId, ast_1.AstType.Type, ast_1.AstType.Indexer, ast_1.AstType.Access], [ast_1.AstType.FunctionId, ast_1.AstType.VariableId]]);
        this.registerChildCount(ast_1.AstType.If, 2);
        this.registerChildTypes(ast_1.AstType.If, [[ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall], [ast_1.AstType.Block]]);
        this.registerChildCount(ast_1.AstType.Else, 1);
        this.registerPreviousSiblingType(ast_1.AstType.Else, [ast_1.AstType.If, ast_1.AstType.ElseIf]);
        this.registerChildTypes(ast_1.AstType.Else, [[ast_1.AstType.Block]]);
        this.registerChildCount(ast_1.AstType.ElseIf, 2);
        this.registerPreviousSiblingType(ast_1.AstType.ElseIf, [ast_1.AstType.If, ast_1.AstType.ElseIf]);
        this.registerChildTypes(ast_1.AstType.ElseIf, [[ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall], [ast_1.AstType.Block]]);
        this.registerChildCount(ast_1.AstType.While, 2);
        this.registerChildTypes(ast_1.AstType.While, [[ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall], [ast_1.AstType.Block]]);
        this.registerChildCount(ast_1.AstType.Break, 0);
        this.registerAncestorType(ast_1.AstType.Break, [ast_1.AstType.While]);
        this.registerChildCount(ast_1.AstType.Continue, 0);
        this.registerAncestorType(ast_1.AstType.Continue, [ast_1.AstType.While]);
        this.registerChildCount(ast_1.AstType.Return, 1);
        this.registerChildTypes(ast_1.AstType.Return, [[ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall]]);
        this.registerAncestorType(ast_1.AstType.Return, [ast_1.AstType.FunctionDef]);
        this.registerChildCount(ast_1.AstType.ReturnVoid, 0);
        this.registerAncestorType(ast_1.AstType.ReturnVoid, [ast_1.AstType.FunctionDef]);
        this.registerChildCount(ast_1.AstType.Assignment, 2);
        this.registerChildTypes(ast_1.AstType.Assignment, [[ast_1.AstType.VariableDef, ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer]]);
        this.registerChildTypes(ast_1.AstType.Global, [[ast_1.AstType.VariableDef], [ast_1.AstType.Literal]]);
        this.registerChildrenType(ast_1.AstType.Global, [ast_1.AstType.Const, ast_1.AstType.Export], 2);
        this.registerChildCount(ast_1.AstType.FunctionCall, 2);
        this.registerChildTypes(ast_1.AstType.FunctionCall, [[ast_1.AstType.FunctionId, ast_1.AstType.Access], [ast_1.AstType.Arguments]]);
        this.registerChildrenType(ast_1.AstType.Arguments, [ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall]);
        this.registerChildrenType(ast_1.AstType.Fields, [ast_1.AstType.VariableDef, ast_1.AstType.Comment]);
        this.registerChildTypes(ast_1.AstType.StructDef, [[ast_1.AstType.StructId], [ast_1.AstType.Fields]]);
        this.registerChildrenType(ast_1.AstType.StructDef, [ast_1.AstType.Export], 2);
        this.registerChildTypes(ast_1.AstType.FunctionDef, [[ast_1.AstType.FunctionId], [ast_1.AstType.Parameters], [ast_1.AstType.Block]]);
        this.registerChildrenType(ast_1.AstType.FunctionDef, [ast_1.AstType.Export], 3);
        this.registerChildrenType(ast_1.AstType.Parameters, [ast_1.AstType.VariableDef]);
        this.registerChildCount(ast_1.AstType.VariableDef, 1, 2);
        this.registerChildTypes(ast_1.AstType.VariableDef, [[ast_1.AstType.VariableId]]);
        this.registerChildrenType(ast_1.AstType.VariableDef, [ast_1.AstType.Literal], 1);
        this.registerAncestorType(ast_1.AstType.VariableDef, [ast_1.AstType.Assignment, ast_1.AstType.Global, ast_1.AstType.Map, ast_1.AstType.Parameters, ast_1.AstType.Fields]);
        this.registerChildCount(ast_1.AstType.UnaryOp, 1);
        this.registerChildrenType(ast_1.AstType.UnaryOp, [ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Type, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall]);
        this.registerChildCount(ast_1.AstType.BinaryOp, 2);
        this.registerChildrenType(ast_1.AstType.BinaryOp, [ast_1.AstType.VariableId, ast_1.AstType.Access, ast_1.AstType.Indexer, ast_1.AstType.Type, ast_1.AstType.Literal, ast_1.AstType.UnaryOp, ast_1.AstType.BinaryOp, ast_1.AstType.FunctionCall]);
        this.registerChildCount(ast_1.AstType.StructId, 0);
        this.registerChildCount(ast_1.AstType.VariableId, 0);
        this.registerChildCount(ast_1.AstType.FunctionId, 0);
        this.registerChildTypes(ast_1.AstType.Map, [[ast_1.AstType.VariableDef], [ast_1.AstType.Literal]]);
        this.registerChildCount(ast_1.AstType.Export, 0);
        this.registerChildCount(ast_1.AstType.Const, 0);
        this.registerChildCount(ast_1.AstType.Type, 0);
        this.registerChildCount(ast_1.AstType.Literal, 0);
    }
    registerParentType(type, parentTypes) {
        this.register(type, (n) => {
            if (!n.parent) {
                this.logError("Expected parent of " + type + " to be " + parentTypes.join(" or ") + " but node has no parent", n);
                n.valid = false;
            }
            else {
                let validType = false;
                for (let type of parentTypes) {
                    if (n.parent.type == type) {
                        validType = true;
                        break;
                    }
                }
                if (!validType) {
                    this.logError("Expected parent of " + type + " to be " + parentTypes.join(" or ") + " but found " + n.parent.type + " instead", n.parent);
                    n.valid = false;
                }
            }
        });
    }
    registerAncestorType(type, ancestorTypes) {
        this.register(type, (n) => {
            let p = n.parent;
            while (p) {
                for (let type of ancestorTypes) {
                    if (p.type == type)
                        return;
                }
                p = p.parent;
            }
            this.logError("Expected ancestor of " + type + " to be " + ancestorTypes.join(" or ") + " but no suitable node found", n.parent ? n.parent : n);
            n.valid = false;
        });
    }
    registerChildCount(type, min, max = min) {
        this.register(type, (n) => {
            if (n.children.length < min || n.children.length > max) {
                this.logError("Expected " + type + " to have " + (min == max ? min : min + '-' + max) + ((min == max && min == 1) ? " child" : " children") + " but " + ((!n.children || n.children.length == 0) ? "none" : "" + n.children.length) + " found", n);
                n.valid = false;
            }
        });
    }
    formatOrdinal(n) {
        let str = n.toFixed();
        if (str != "11" && str.endsWith('1'))
            return str + "st";
        else if (str != "12" && str.endsWith('2'))
            return str + "nd";
        else if (str != "13" && str.endsWith('3'))
            return str + "rd";
        else
            return str + "th";
    }
    registerChildTypes(type, childTypes, startIndex = 0) {
        this.register(type, (n) => {
            for (let i = startIndex; i < startIndex + childTypes.length; i++) {
                if (!n.children || n.children.length <= i) {
                    this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + type + " to be " + childTypes[i - startIndex].join(" or ") + " but node has no " + this.formatOrdinal(i + 1) + " child", n);
                    n.valid = false;
                }
                else {
                    let child = n.children[i];
                    if (child) {
                        let validType = false;
                        for (let type of childTypes[i - startIndex]) {
                            if (child.type == type) {
                                validType = true;
                                break;
                            }
                        }
                        if (!validType) {
                            this.logError("Expected " + this.formatOrdinal(i + 1) + " child of " + type + " to be " + childTypes[i - startIndex].join(" or ") + " but found " + child.type + " instead", child);
                            n.valid = false;
                        }
                    }
                }
            }
        });
    }
    registerChildrenType(type, childrenTypes, startIndex = 0) {
        this.register(type, (n) => {
            if (n.children) {
                for (let i = startIndex; i < n.children.length; i++) {
                    let child = n.children[i];
                    if (child) {
                        let validType = false;
                        for (let type of childrenTypes) {
                            if (child.type == type) {
                                validType = true;
                                break;
                            }
                        }
                        if (!validType) {
                            this.logError("Expected child of " + type + " to be " + childrenTypes.join(" or ") + " but found " + child.type + " instead", child);
                            n.valid = false;
                        }
                    }
                }
            }
        });
    }
    registerNextSiblingType(type, siblingTypes) {
        this.register(type, (n) => {
            if (!n.parent) {
                this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no parent", n);
                n.valid = false;
                return;
            }
            let index = n.parent.children.indexOf(n);
            if (index == n.parent.children.length - 1) {
                this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no next sibling", n);
                n.valid = false;
            }
            else {
                let sibling = n.parent.children[index + 1];
                if (sibling) {
                    let validType = false;
                    for (let type of siblingTypes) {
                        if (sibling.type == type) {
                            validType = true;
                            break;
                        }
                    }
                    if (!validType) {
                        this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but found " + sibling.type + " instead", sibling);
                        n.valid = false;
                    }
                }
            }
        });
    }
    registerPreviousSiblingType(type, siblingTypes) {
        this.register(type, (n) => {
            if (!n.parent) {
                this.logError("Expected next sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no parent", n);
                n.valid = false;
                return;
            }
            let index = n.parent.children.indexOf(n);
            if (index == 0) {
                this.logError("Expected previous sibling of " + type + " to be " + siblingTypes.join(" or ") + " but node has no previous sibling", n);
                n.valid = false;
            }
            else {
                let sibling = n.parent.children[index - 1];
                if (sibling) {
                    let validType = false;
                    for (let type of siblingTypes) {
                        if (sibling.type == type) {
                            validType = true;
                            break;
                        }
                    }
                    if (!validType) {
                        this.logError("Expected previous sibling of " + type + " to be " + siblingTypes.join(" or ") + " but found " + sibling.type + " instead", sibling);
                        n.valid = false;
                    }
                }
            }
        });
    }
}
exports.SchwaValidator = SchwaValidator;
