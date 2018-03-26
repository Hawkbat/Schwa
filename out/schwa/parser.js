"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
const log_1 = require("./log");
const ast_1 = require("./ast");
const utils = require("./utils");
class Parser {
    constructor(logger) {
        this.logger = logger;
        this.prefixFuncMap = {};
        this.infixFuncMap = {};
        this.prefixPrecedenceMap = {};
        this.infixPrecedenceMap = {};
        this.index = 0;
        this.tokens = null;
    }
    parse(tokens) {
        this.index = 0;
        this.tokens = tokens;
        return this.parseNode(0);
    }
    parseNode(precedence) {
        if (!precedence)
            precedence = 0;
        let token = this.consume();
        if (!token)
            return null;
        let prefixFunc = this.prefixFuncMap[token.type];
        if (!prefixFunc) {
            if (token.type != token_1.TokenType.Unknown)
                this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Parser", "Unable to parse token " + token.type + (token.type == token.value ? "" : " " + JSON.stringify(token.value)), token.row, token.column, token.value.length));
            return new ast_1.AstNode(ast_1.AstType.Unknown, token, []);
        }
        let left = prefixFunc(token);
        while (this.peek() && precedence < this.getPrecedence()) {
            token = this.consume();
            if (token) {
                let infixFunc = this.infixFuncMap[token.type];
                left = infixFunc(left, token);
            }
        }
        return left;
    }
    getPrecedence() {
        let token = this.peek();
        if (token) {
            let infixFunc = this.infixFuncMap[token.type];
            if (!infixFunc)
                return 0;
            return this.infixPrecedenceMap[token.type];
        }
        return 0;
    }
    consume() {
        if (!this.tokens)
            return null;
        return this.tokens[this.index++];
    }
    peek() {
        if (!this.tokens)
            return null;
        return this.tokens[this.index];
    }
    consumeMatch(type, match) {
        let token = this.peek();
        if (token && token.type != match) {
            this.logger.log(new log_1.LogMsg(log_1.LogType.Warning, "Parser", type + " expected " + match + " but got " + (token.type == token.value ? token.type : token.type + " " + JSON.stringify(token.value)), token.row, token.column, token.value.length));
            return token;
        }
        return this.consume();
    }
    match(type) {
        let token = this.peek();
        return token ? token.type == type : false;
    }
    registerPrefix(type, precedence, func) {
        this.prefixPrecedenceMap[type] = precedence;
        this.prefixFuncMap[type] = func;
    }
    registerPrefixOp(type, precedence) {
        this.registerPrefix(type, precedence, (token) => {
            let n;
            if (!this.match(token_1.TokenType.EOL)) {
                n = this.parseNode(precedence);
            }
            return new ast_1.AstNode(ast_1.AstType.UnaryOp, token, n ? [n] : []);
        });
    }
    registerInfix(type, precedence, func) {
        this.infixPrecedenceMap[type] = precedence;
        this.infixFuncMap[type] = func;
    }
    registerInfixOp(type, precedence, rightAssociative) {
        this.registerInfix(type, precedence, (left, token) => {
            let children = [];
            if (left)
                children.push(left);
            if (!this.match(token_1.TokenType.EOL)) {
                let n = this.parseNode((rightAssociative) ? precedence - 1 : precedence);
                if (n)
                    children.push(n);
            }
            return new ast_1.AstNode(ast_1.AstType.BinaryOp, token, children);
        });
    }
    registerPostfixOp(type, precedence) {
        this.registerInfix(type, precedence, (left, token) => new ast_1.AstNode(ast_1.AstType.UnaryOp, token, left ? [left] : []));
    }
}
exports.Parser = Parser;
class SchwaParser extends Parser {
    constructor(logger) {
        super(logger);
        this.registerPrefix(token_1.TokenType.Name, 0, (t) => {
            if (this.match(token_1.TokenType.Name)) {
                let r = this.parseNode(1);
                if (r && r.type == ast_1.AstType.Indexer) {
                    return new ast_1.AstNode(ast_1.AstType.VariableDef, t, [...r.children]);
                }
                if (r && r.type == ast_1.AstType.VariableId) {
                    return new ast_1.AstNode(ast_1.AstType.VariableDef, t, [r]);
                }
                else if (r && r.type == ast_1.AstType.FunctionCall) {
                    let params = r.children[1];
                    if (params)
                        params.type = ast_1.AstType.Parameters;
                    return new ast_1.AstNode(ast_1.AstType.FunctionDef, t, [r.children[0], params]);
                }
            }
            return new ast_1.AstNode(ast_1.AstType.VariableId, t, []);
        });
        this.registerPrefix(token_1.TokenType.Int, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.UInt, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.Long, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.ULong, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.Float, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.Double, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.Bool, 0, (t) => new ast_1.AstNode(ast_1.AstType.Literal, t, []));
        this.registerPrefix(token_1.TokenType.Type, 2, (t) => {
            if (this.match(token_1.TokenType.Name)) {
                let r = this.parseNode(1);
                if (r && r.type == ast_1.AstType.VariableId) {
                    return new ast_1.AstNode(ast_1.AstType.VariableDef, t, [r]);
                }
                else if (r && r.type == ast_1.AstType.FunctionCall) {
                    let params = r.children[1];
                    if (params)
                        params.type = ast_1.AstType.Parameters;
                    return new ast_1.AstNode(ast_1.AstType.FunctionDef, t, [r.children[0], params]);
                }
            }
            return new ast_1.AstNode(ast_1.AstType.Type, t, []);
        });
        this.registerPrefix(token_1.TokenType.Const, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            if (!n)
                return new ast_1.AstNode(ast_1.AstType.Const, t, []);
            return new ast_1.AstNode(n.type, n.token, [...n.children, new ast_1.AstNode(ast_1.AstType.Const, t, [])]);
        });
        this.registerPrefix(token_1.TokenType.Export, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            if (!n)
                return new ast_1.AstNode(ast_1.AstType.Export, t, []);
            return new ast_1.AstNode(n.type, n.token, [...n.children, new ast_1.AstNode(ast_1.AstType.Export, t, [])]);
        });
        this.registerPrefix(token_1.TokenType.Struct, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL)) {
                n = this.parseNode();
                if (n && n.type == ast_1.AstType.VariableId)
                    n.type = ast_1.AstType.StructId;
            }
            return new ast_1.AstNode(ast_1.AstType.StructDef, t, n ? [n] : []);
        });
        this.registerPrefix(token_1.TokenType.Map, 2, (t) => {
            let children = [];
            if (this.match(token_1.TokenType.Name) || this.match(token_1.TokenType.Type)) {
                let n = this.parseNode();
                if (n)
                    children.push(n);
            }
            if (this.match(token_1.TokenType.At)) {
                this.consume();
                if (!this.match(token_1.TokenType.EOL)) {
                    let n = this.parseNode();
                    if (n)
                        children.push(n);
                }
            }
            return new ast_1.AstNode(ast_1.AstType.Map, t, children);
        });
        this.registerPrefix(token_1.TokenType.From, 2, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL) && this.match(token_1.TokenType.Name))
                n = this.parseNode();
            if (!n)
                return new ast_1.AstNode(ast_1.AstType.From, t, []);
            n.type = ast_1.AstType.ModuleId;
            if (this.match(token_1.TokenType.Import)) {
                let r = this.parseNode();
                if (r)
                    return new ast_1.AstNode(r.type, r.token, [n, ...r.children]);
            }
            return new ast_1.AstNode(ast_1.AstType.From, t, [n]);
        });
        this.registerPrefix(token_1.TokenType.Import, 2, (t) => {
            let children = [];
            if (this.match(token_1.TokenType.Name) || this.match(token_1.TokenType.Type)) {
                let n = this.parseNode();
                if (n) {
                    if (n.type == ast_1.AstType.VariableDef)
                        n.type = ast_1.AstType.VariableImport;
                    if (n.type == ast_1.AstType.FunctionDef)
                        n.type = ast_1.AstType.FunctionImport;
                    if (n.type == ast_1.AstType.StructDef)
                        n.type = ast_1.AstType.StructImport;
                    if (n.type == ast_1.AstType.VariableId)
                        n.type = ast_1.AstType.ModuleId;
                    children.push(n);
                }
            }
            return new ast_1.AstNode(ast_1.AstType.Import, t, children);
        });
        this.registerPrefix(token_1.TokenType.Comment, 0, (t) => new ast_1.AstNode(ast_1.AstType.Comment, t, []));
        this.registerPrefix(token_1.TokenType.InlineComment, 0, (t) => new ast_1.AstNode(ast_1.AstType.Comment, t, []));
        this.registerPrefix(token_1.TokenType.If, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            return new ast_1.AstNode(ast_1.AstType.If, t, n ? [n] : []);
        });
        this.registerPrefix(token_1.TokenType.Else, 1, (t) => new ast_1.AstNode(ast_1.AstType.Else, t, []));
        this.registerPrefix(token_1.TokenType.ElseIf, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            return new ast_1.AstNode(ast_1.AstType.ElseIf, t, n ? [n] : []);
        });
        this.registerPrefix(token_1.TokenType.While, 1, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            return new ast_1.AstNode(ast_1.AstType.While, t, n ? [n] : []);
        });
        this.registerPrefix(token_1.TokenType.Break, 1, (t) => new ast_1.AstNode(ast_1.AstType.Break, t, []));
        this.registerPrefix(token_1.TokenType.Continue, 1, (t) => new ast_1.AstNode(ast_1.AstType.Continue, t, []));
        this.registerPrefix(token_1.TokenType.Return, 1, (t) => {
            if (this.match(token_1.TokenType.EOL))
                return new ast_1.AstNode(ast_1.AstType.ReturnVoid, t, []);
            else {
                let n = this.parseNode();
                return new ast_1.AstNode(ast_1.AstType.Return, t, n ? [n] : []);
            }
        });
        this.registerInfix(token_1.TokenType.Assign, 1, (l, t) => {
            let children = [];
            if (l)
                children.push(l);
            if (!this.match(token_1.TokenType.EOL)) {
                let n = this.parseNode();
                if (n)
                    children.push(n);
            }
            return new ast_1.AstNode(ast_1.AstType.Assignment, t, children);
        });
        this.registerInfixOp(token_1.TokenType.And, 1, false);
        this.registerInfixOp(token_1.TokenType.Or, 2, false);
        this.registerInfixOp(token_1.TokenType.Eq, 3, false);
        this.registerInfixOp(token_1.TokenType.Ne, 3, false);
        this.registerInfixOp(token_1.TokenType.Lt, 3, false);
        this.registerInfixOp(token_1.TokenType.Le, 3, false);
        this.registerInfixOp(token_1.TokenType.Gt, 3, false);
        this.registerInfixOp(token_1.TokenType.Ge, 3, false);
        this.registerInfixOp(token_1.TokenType.ShL, 4, false);
        this.registerInfixOp(token_1.TokenType.ShR, 4, false);
        this.registerInfixOp(token_1.TokenType.RotL, 4, false);
        this.registerInfixOp(token_1.TokenType.RotR, 4, false);
        this.registerInfixOp(token_1.TokenType.OR, 5, false);
        this.registerInfixOp(token_1.TokenType.XOR, 6, false);
        this.registerInfixOp(token_1.TokenType.AND, 7, false);
        this.registerInfixOp(token_1.TokenType.Add, 8, false);
        this.registerInfixOp(token_1.TokenType.Sub, 8, false);
        this.registerInfixOp(token_1.TokenType.Mul, 9, false);
        this.registerInfixOp(token_1.TokenType.Div, 9, false);
        this.registerInfixOp(token_1.TokenType.Mod, 9, false);
        this.registerInfixOp(token_1.TokenType.Onto, 10, false);
        this.registerInfixOp(token_1.TokenType.To, 10, false);
        // Unary negation reinterprets prefix Sub as Neg to distinguish them in the AST
        this.registerPrefix(token_1.TokenType.Sub, 11, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode(10);
            return new ast_1.AstNode(ast_1.AstType.UnaryOp, new token_1.Token(token_1.TokenType.Neg, t.value, t.row, t.column), n ? [n] : []);
        });
        this.registerPrefixOp(token_1.TokenType.NOT, 11);
        this.registerPrefixOp(token_1.TokenType.Not, 11);
        // Grouping parentheses
        this.registerPrefix(token_1.TokenType.LParen, 12, (t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            this.consumeMatch(token_1.TokenType.LParen, token_1.TokenType.RParen);
            if (!n)
                return new ast_1.AstNode(ast_1.AstType.Unknown, t, []);
            return n;
        });
        // Function calls
        this.registerInfix(token_1.TokenType.LParen, 12, (l, t) => {
            let args = [];
            while (!this.match(token_1.TokenType.RParen) && !this.match(token_1.TokenType.EOL)) {
                let n;
                if (!this.match(token_1.TokenType.EOL))
                    n = this.parseNode();
                if (n)
                    args.push(n);
                if (this.match(token_1.TokenType.Comma))
                    this.consume();
            }
            this.consumeMatch(token_1.TokenType.LParen, token_1.TokenType.RParen);
            let id = l;
            if (id) {
                while (id && (id.type == ast_1.AstType.Access || id.type == ast_1.AstType.Indexer)) {
                    if (id.type == ast_1.AstType.Indexer)
                        id = id.children[0];
                    else if (id.type == ast_1.AstType.Access)
                        id = id.children[1];
                }
                if (id && id.type == ast_1.AstType.VariableId)
                    id.type = ast_1.AstType.FunctionId;
            }
            let children = [];
            if (l)
                children.push(l);
            children.push(new ast_1.AstNode(ast_1.AstType.Arguments, t, args));
            return new ast_1.AstNode(ast_1.AstType.FunctionCall, new token_1.Token(token_1.TokenType.None, '', t.row, t.column), children);
        });
        // Array indexing
        this.registerInfix(token_1.TokenType.LBracket, 13, (l, t) => {
            let children = [];
            if (l)
                children.push(l);
            while (!this.match(token_1.TokenType.RBracket) && !this.match(token_1.TokenType.EOL)) {
                let n;
                if (!this.match(token_1.TokenType.EOL))
                    n = this.parseNode();
                if (n)
                    children.push(n);
                if (this.match(token_1.TokenType.Comma))
                    this.consume();
            }
            this.consumeMatch(token_1.TokenType.LBracket, token_1.TokenType.RBracket);
            return new ast_1.AstNode(ast_1.AstType.Indexer, t, children);
        });
        // Scope access
        this.registerInfix(token_1.TokenType.Period, 14, (l, t) => {
            let children = [];
            if (l)
                children.push(l);
            if (this.match(token_1.TokenType.Name)) {
                let n = this.parseNode(14);
                if (n)
                    children.push(n);
            }
            else {
                this.consumeMatch(token_1.TokenType.Period, token_1.TokenType.Name);
            }
            return new ast_1.AstNode(ast_1.AstType.Access, t, children);
        });
        // Aliasing
        this.registerInfix(token_1.TokenType.As, 15, (l, t) => {
            let n;
            if (!this.match(token_1.TokenType.EOL))
                n = this.parseNode();
            if (l && n) {
                n.type = ast_1.AstType.Alias;
                let id = utils.getIdentifier(l);
                if (id)
                    id.children.push(n);
                return l;
            }
            if (n) {
                n.type = ast_1.AstType.Alias;
                return n;
            }
            else
                return new ast_1.AstNode(ast_1.AstType.Alias, t, []);
        });
        // Statements
        this.registerPrefix(token_1.TokenType.BOL, 16, (t) => {
            let n = this.parseNode();
            this.consumeMatch(token_1.TokenType.BOL, token_1.TokenType.EOL);
            if (!n)
                return new ast_1.AstNode(ast_1.AstType.Unknown, t, []);
            return n;
        });
        // Blocks
        this.registerInfix(token_1.TokenType.Indent, 17, (l, t) => {
            let children = [];
            while (!this.match(token_1.TokenType.Dedent)) {
                let n = this.parseNode();
                if (n)
                    children.push(n);
            }
            this.consumeMatch(token_1.TokenType.Indent, token_1.TokenType.Dedent);
            let n = new ast_1.AstNode(ast_1.AstType.Block, t, children);
            if (l) {
                if (l.type == ast_1.AstType.FunctionDef) {
                    l.children.splice(2, 0, n);
                    return new ast_1.AstNode(l.type, l.token, l.children);
                }
                else if (l.type == ast_1.AstType.StructDef) {
                    n.type = ast_1.AstType.Fields;
                }
                else if (l.type == ast_1.AstType.Import) {
                    n.type = ast_1.AstType.Imports;
                    for (let child of children) {
                        if (child.type == ast_1.AstType.VariableDef)
                            child.type = ast_1.AstType.VariableImport;
                        if (child.type == ast_1.AstType.FunctionDef)
                            child.type = ast_1.AstType.FunctionImport;
                        if (child.type == ast_1.AstType.StructDef)
                            child.type = ast_1.AstType.StructImport;
                    }
                }
                return new ast_1.AstNode(l.type, l.token, l.children.concat([n]));
            }
            return n;
        });
        // Program
        this.registerPrefix(token_1.TokenType.BOF, 18, (t) => {
            let children = [];
            while (!this.match(token_1.TokenType.EOF)) {
                let child = this.parseNode();
                if (child) {
                    if (child.type == ast_1.AstType.Assignment)
                        child.type = ast_1.AstType.Global;
                    children.push(child);
                }
            }
            this.consumeMatch(token_1.TokenType.EOF, token_1.TokenType.EOF);
            return new ast_1.AstNode(ast_1.AstType.Program, t, children);
        });
    }
}
exports.SchwaParser = SchwaParser;
