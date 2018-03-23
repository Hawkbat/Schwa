"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
const ast_1 = require("./ast");
const log_1 = require("./log");
class Formatter {
    constructor(logger) {
        this.logger = logger;
        this.ruleMap = {};
    }
    format(ast) {
        return this.printNode(ast);
    }
    printNode(node) {
        if (!node)
            return "";
        let rule = this.ruleMap[node.type];
        if (rule)
            return rule(node);
        return node.token.value;
    }
    register(type, rule) {
        this.ruleMap[type] = rule;
    }
    logError(msg, node) {
        this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Formatter", msg, node.token.row, node.token.column, node.token.value.length));
    }
}
exports.Formatter = Formatter;
class SchwaFormatter extends Formatter {
    constructor(logger) {
        super(logger);
        this.PRECEDENCE_MAP = {
            [token_1.TokenType.And]: 1,
            [token_1.TokenType.Or]: 2,
            [token_1.TokenType.Eq]: 3,
            [token_1.TokenType.Ne]: 3,
            [token_1.TokenType.Lt]: 3,
            [token_1.TokenType.Le]: 3,
            [token_1.TokenType.Gt]: 3,
            [token_1.TokenType.Ge]: 3,
            [token_1.TokenType.ShL]: 4,
            [token_1.TokenType.ShR]: 4,
            [token_1.TokenType.RotL]: 4,
            [token_1.TokenType.RotR]: 4,
            [token_1.TokenType.OR]: 5,
            [token_1.TokenType.XOR]: 6,
            [token_1.TokenType.AND]: 7,
            [token_1.TokenType.Add]: 8,
            [token_1.TokenType.Sub]: 8,
            [token_1.TokenType.Mul]: 9,
            [token_1.TokenType.Div]: 9,
            [token_1.TokenType.Mod]: 9,
            [token_1.TokenType.As]: 10,
            [token_1.TokenType.To]: 10,
            [token_1.TokenType.Neg]: 11,
            [token_1.TokenType.NOT]: 11,
            [token_1.TokenType.Not]: 11
        };
        this.register(ast_1.AstType.UnaryOp, (n) => {
            let l = n.children[0];
            let out = n.token.value;
            if (l)
                out += this.printNode(l);
            if (this.needsParens(n))
                out = '(' + out + ')';
            return out;
        });
        this.register(ast_1.AstType.BinaryOp, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '';
            if (l)
                out += this.printNode(l) + ' ';
            out += n.token.value;
            if (r)
                out += ' ' + this.printNode(r);
            if (this.needsParens(n))
                out = '(' + out + ')';
            return out;
        });
        this.register(ast_1.AstType.VariableDef, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = n.token.value;
            if (l)
                out += ' ' + this.printNode(l);
            if (r)
                out += '[' + this.printNode(r) + ']';
            return out;
        });
        this.register(ast_1.AstType.FunctionDef, (n) => {
            let c0 = n.children[0];
            let c1 = n.children[1];
            let c2 = n.children[2];
            let out = '\n';
            if (n.children.length > 3) {
                out += n.children.slice(3).reverse().map((c) => this.printNode(c)).join(' ');
                out += ' ';
            }
            out += n.token.value;
            if (c0 || c1 || c2)
                out += ' ';
            if (c0)
                out += this.printNode(c0);
            if (c1)
                out += this.printNode(c1);
            if (c2)
                out += this.printNode(c2);
            return out;
        });
        this.register(ast_1.AstType.StructDef, (n) => {
            let c0 = n.children[0];
            let c1 = n.children[1];
            let out = '\n';
            if (n.children.length > 2) {
                out += n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ');
                out += ' ';
            }
            out += n.token.value;
            if (c0 || c1)
                out += ' ';
            if (c0)
                out += this.printNode(c0);
            if (c1)
                out += this.printNode(c1);
            return out;
        });
        this.register(ast_1.AstType.Fields, (n) => {
            let out = '\n';
            for (let i = 0; i < n.children.length; i++) {
                let c = n.children[i];
                if (!c)
                    continue;
                if (c.token.type == token_1.TokenType.InlineComment && i + 1 < n.children.length) {
                    let cn = n.children[i + 1];
                    if (cn) {
                        let lines = ('\t'.repeat(this.getDepth(cn)) + this.printNode(cn)).split('\n');
                        out += lines[0];
                        out += this.printNode(c);
                        if (lines.length > 1)
                            out += '\n';
                        if (lines.length > 0)
                            out += lines.slice(1).join('\n');
                    }
                    i++;
                }
                else if (c.token.type == token_1.TokenType.Comment) {
                    out += this.printNode(c);
                }
                else {
                    out += '\t'.repeat(this.getDepth(c)) + this.printNode(c);
                }
                if (i != n.children.length - 1)
                    out += '\n';
            }
            return out;
        });
        this.register(ast_1.AstType.Parameters, (n) => {
            let out = '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')';
            return out;
        });
        this.register(ast_1.AstType.FunctionCall, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '';
            if (l)
                out += this.printNode(l);
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.Arguments, (n) => {
            let out = '(' + n.children.map((c) => this.printNode(c)).join(', ') + ')';
            return out;
        });
        this.register(ast_1.AstType.Assignment, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '';
            if (l)
                out += this.printNode(l) + ' ';
            out += '=';
            if (r)
                out += ' ' + this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.Global, (n) => {
            let c0 = n.children[0];
            let c1 = n.children[1];
            let out = '';
            if (n.children.length > 2) {
                out += n.children.slice(2).reverse().map((c) => this.printNode(c)).join(' ');
                out += ' ';
            }
            if (c0)
                out += this.printNode(c0);
            out += ' = ';
            if (c1)
                out += this.printNode(c1);
            return out;
        });
        this.register(ast_1.AstType.Indexer, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '';
            if (l)
                out += this.printNode(l);
            if (r)
                out += '[' + this.printNode(r) + ']';
            return out;
        });
        this.register(ast_1.AstType.Access, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '';
            if (l)
                out += this.printNode(l);
            out += '.';
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.Map, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = '\n';
            out += 'map';
            if (l)
                out += ' ' + this.printNode(l);
            out += ' at ';
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.If, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = 'if';
            if (l || r)
                out += ' ';
            if (l)
                out += this.printNode(l);
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.Else, (n) => {
            let l = n.children[0];
            let out = 'else';
            if (l)
                out += this.printNode(l);
            return out;
        });
        this.register(ast_1.AstType.ElseIf, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = 'else if';
            if (l || r)
                out += ' ';
            if (l)
                out += this.printNode(l);
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.While, (n) => {
            let l = n.children[0];
            let r = n.children[1];
            let out = 'while';
            if (l || r)
                out += ' ';
            if (l)
                out += this.printNode(l);
            if (r)
                out += this.printNode(r);
            return out;
        });
        this.register(ast_1.AstType.Return, (n) => {
            let l = n.children[0];
            let out = 'return';
            if (l)
                out += ' ' + this.printNode(l);
            return out;
        });
        this.register(ast_1.AstType.Block, (n) => {
            let out = '\n';
            for (let i = 0; i < n.children.length; i++) {
                let c = n.children[i];
                if (!c)
                    continue;
                if (c.token.type == token_1.TokenType.InlineComment && i + 1 < n.children.length) {
                    let cn = n.children[i + 1];
                    if (cn) {
                        let lines = ('\t'.repeat(this.getDepth(cn)) + this.printNode(cn)).split('\n');
                        out += lines[0];
                        out += this.printNode(c);
                        if (lines.length > 1)
                            out += '\n';
                        if (lines.length > 0)
                            out += lines.slice(1).join('\n');
                    }
                    i++;
                }
                else if (c.token.type == token_1.TokenType.Comment) {
                    out += this.printNode(c);
                }
                else {
                    out += '\t'.repeat(this.getDepth(c)) + this.printNode(c);
                }
                if (i != n.children.length - 1)
                    out += '\n';
            }
            return out;
        });
        this.register(ast_1.AstType.Program, (n) => {
            let out = '';
            for (let i = 0; i < n.children.length; i++) {
                let c = n.children[i];
                if (!c)
                    continue;
                if (c.token.type == token_1.TokenType.InlineComment && i + 1 < n.children.length) {
                    let cn = n.children[i + 1];
                    if (cn) {
                        let lines = this.printNode(cn).split('\n');
                        out += lines[0];
                        out += this.printNode(c);
                        if (lines.length > 1)
                            out += '\n';
                        if (lines.length > 0)
                            out += lines.slice(1).join('\n');
                    }
                    i++;
                    out += '\n';
                }
                else if (c.token.type == token_1.TokenType.Comment) {
                    out += '\n';
                    out += this.printNode(c);
                }
                else {
                    out += this.printNode(c);
                    out += '\n';
                }
            }
            return out;
        });
    }
    needsParens(n) {
        if (n.parent && (n.parent.type == ast_1.AstType.BinaryOp || n.parent.type == ast_1.AstType.UnaryOp)) {
            let isLeft = n == n.parent.children[0];
            let nP = this.PRECEDENCE_MAP[n.token.type];
            let pP = this.PRECEDENCE_MAP[n.parent.token.type];
            if (isLeft && nP < pP)
                return true;
            if (!isLeft && nP <= pP)
                return true;
        }
        return false;
    }
    getDepth(node) {
        if (!node.parent)
            return 0;
        if (node.parent.type == ast_1.AstType.Block || node.parent.type == ast_1.AstType.Fields)
            return this.getDepth(node.parent) + 1;
        else
            return this.getDepth(node.parent);
    }
}
exports.SchwaFormatter = SchwaFormatter;
