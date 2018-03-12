"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
const log_1 = require("./log");
class Lexer {
    constructor(logger) {
        this.logger = logger;
        this.rules = [];
        this.lines = [];
        this.tokens = [];
    }
    lex(lines) {
        this.lines = lines;
        this.tokens = [];
        this.push(new token_1.Token(token_1.TokenType.BOF, '', 0, 0));
        let depth = 0;
        for (let row = 0; row < this.lines.length; row++) {
            if (this.lines[row].trim() == '')
                continue;
            let newDepth = 0;
            while (this.lines[row].charAt(newDepth) == '\t')
                newDepth++;
            for (let d = depth; d < newDepth; d++)
                this.push(new token_1.Token(token_1.TokenType.Indent, '\t', row, d));
            for (let d = newDepth; d < depth; d++)
                this.push(new token_1.Token(token_1.TokenType.Dedent, '', row, d));
            depth = newDepth;
            this.push(new token_1.Token(token_1.TokenType.BOL, '', row, depth));
            for (let col = 0; col < this.lines[row].length; col++) {
                let token = null;
                for (let rule of this.rules) {
                    token = rule(row, col);
                    if (token)
                        break;
                }
                if (token) {
                    col += token.value.length - 1;
                    if (token.type == token_1.TokenType.Comment && this.tokens[this.tokens.length - 1].type != token_1.TokenType.BOL) {
                        token.type = token_1.TokenType.InlineComment;
                        let i = this.tokens.length - 1;
                        while (this.tokens[i].type != token_1.TokenType.BOL)
                            i--;
                        this.tokens.splice(i, 0, token);
                    }
                    else {
                        this.push(token);
                    }
                }
                else {
                    let end = col;
                    while (!token && end < this.lines[row].length) {
                        for (let rule of this.rules) {
                            token = rule(row, end);
                            if (token)
                                break;
                        }
                        if (token)
                            break;
                        end++;
                    }
                    let val = this.lines[row].substring(col, end);
                    this.logger.log(new log_1.LogMsg(log_1.LogType.Error, "Lexer", "Unknown token " + JSON.stringify(val), row, col, end - col));
                    this.tokens.push(new token_1.Token(token_1.TokenType.Unknown, val, row, col));
                    col = end - 1;
                }
            }
            this.push(new token_1.Token(token_1.TokenType.EOL, '\n', row, this.lines[row].length));
        }
        while (depth > 0)
            this.push(new token_1.Token(token_1.TokenType.Dedent, '', this.lines.length - 1, --depth));
        this.push(new token_1.Token(token_1.TokenType.EOF, '', this.lines.length - 1, this.lines[this.lines.length - 1].length));
        return this.tokens;
    }
    push(token) {
        if (token.type != token_1.TokenType.None)
            this.tokens.push(token);
    }
    getLine(row, col, len) {
        let line = this.lines[row];
        if (col)
            line = line.substr(col, len);
        return line;
    }
    register(rule) {
        this.rules.push(rule);
    }
    registerMatch(type, pattern) {
        this.register((r, c) => {
            if (this.getLine(r, c, pattern.length) == pattern)
                return new token_1.Token(type, pattern, r, c);
            return null;
        });
    }
    registerRegex(type, pattern) {
        this.register((r, c) => {
            let res = pattern.exec(this.getLine(r, c));
            if (res && res.index == 0)
                return new token_1.Token(type, res[0], r, c);
            return null;
        });
    }
}
exports.Lexer = Lexer;
class SchwaLexer extends Lexer {
    constructor(logger) {
        super(logger);
        this.registerRegex(token_1.TokenType.Comment, /\s*\/\/.*/);
        this.registerRegex(token_1.TokenType.None, /\s/);
        // Longer matches first to keep precedence over shorter matches 
        this.registerMatch(token_1.TokenType.ShL, "<<");
        this.registerMatch(token_1.TokenType.ShR, ">>");
        this.registerMatch(token_1.TokenType.RotL, "<|");
        this.registerMatch(token_1.TokenType.RotR, "|>");
        this.registerMatch(token_1.TokenType.Eq, "==");
        this.registerMatch(token_1.TokenType.Ne, "!=");
        this.registerMatch(token_1.TokenType.Le, "<=");
        this.registerMatch(token_1.TokenType.Ge, ">=");
        this.registerMatch(token_1.TokenType.And, "&&");
        this.registerMatch(token_1.TokenType.Or, "||");
        this.registerMatch(token_1.TokenType.Add, "+");
        this.registerMatch(token_1.TokenType.Mul, "*");
        this.registerMatch(token_1.TokenType.Div, "/");
        this.registerMatch(token_1.TokenType.Mod, "%");
        this.registerMatch(token_1.TokenType.AND, "&");
        this.registerMatch(token_1.TokenType.OR, "|");
        this.registerMatch(token_1.TokenType.XOR, "^");
        this.registerMatch(token_1.TokenType.NOT, "~");
        this.registerMatch(token_1.TokenType.Lt, "<");
        this.registerMatch(token_1.TokenType.Gt, ">");
        this.registerMatch(token_1.TokenType.Not, "!");
        this.registerMatch(token_1.TokenType.Assign, "=");
        this.registerMatch(token_1.TokenType.LParen, "(");
        this.registerMatch(token_1.TokenType.RParen, ")");
        this.registerMatch(token_1.TokenType.Comma, ",");
        this.registerMatch(token_1.TokenType.Period, ".");
        this.registerRegex(token_1.TokenType.ElseIf, /\belse if\b/);
        this.registerRegex(token_1.TokenType.If, /\bif\b/);
        this.registerRegex(token_1.TokenType.Else, /\belse\b/);
        this.registerRegex(token_1.TokenType.While, /\bwhile\b/);
        this.registerRegex(token_1.TokenType.Break, /\bbreak\b/);
        this.registerRegex(token_1.TokenType.Continue, /\bcontinue\b/);
        this.registerRegex(token_1.TokenType.Return, /\breturn\b/);
        this.registerRegex(token_1.TokenType.As, /\bas\b/);
        this.registerRegex(token_1.TokenType.To, /\bto\b/);
        this.registerRegex(token_1.TokenType.Bool, /\b(?:true|false)\b/);
        this.registerRegex(token_1.TokenType.Type, /\b(?:void|int|uint|long|ulong|float|double|bool)\b/);
        this.registerRegex(token_1.TokenType.Const, /\bconst\b/);
        this.registerRegex(token_1.TokenType.Export, /\bexport\b/);
        this.registerRegex(token_1.TokenType.Struct, /\bstruct\b/);
        this.registerRegex(token_1.TokenType.Map, /\bmap\b/);
        this.registerRegex(token_1.TokenType.At, /\bat\b/);
        this.registerRegex(token_1.TokenType.Name, /\b[^\d\W]\w*\b/);
        this.registerRegex(token_1.TokenType.Float, /(?:-|\b)(?:0b[0-1]+\.?[0-1]*|0o[0-7]+\.?[0-7]*|0x[0-9A-F]+\.?[0-9A-F]*|\d+\.?\d*)f\b/);
        this.registerRegex(token_1.TokenType.Double, /(?:-|\b)(?:0b[0-1]+\.[0-1]*|0o[0-7]+\.[0-7]*|0x[0-9A-F]+\.[0-9A-F]*|\d+\.\d*)\b/);
        this.registerRegex(token_1.TokenType.ULong, /\b(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)uL\b/);
        this.registerRegex(token_1.TokenType.Long, /(?:-|\b)(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)L\b/);
        this.registerRegex(token_1.TokenType.UInt, /\b(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)u\b/);
        this.registerRegex(token_1.TokenType.Int, /(?:-|\b)(?:0b[0-1]+|0o[0-7]+|0x[0-9A-F]+|\d+)\b/);
        // After the number regexes so it doesn't overrule negative constants
        this.registerMatch(token_1.TokenType.Sub, "-");
    }
}
exports.SchwaLexer = SchwaLexer;
