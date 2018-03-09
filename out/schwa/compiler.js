"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
class Compiler {
    constructor() {
        this.logger = new _1.Logger();
        this.lexer = new _1.Lexer(this.logger);
        this.parser = new _1.Parser(this.logger);
        this.validator = new _1.Validator(this.logger);
        this.analyzer = new _1.Analyzer(this.logger);
        this.formatter = new _1.Formatter(this.logger);
        this.generator = new _1.Generator(this.logger);
    }
    compile(lines, moduleName = "") {
        this.logger.clear();
        let tokens = this.lexer.lex(lines);
        if (this.logger.count(_1.LogType.Error))
            return null;
        let ast = this.parser.parse(tokens);
        if (!ast || this.logger.count(_1.LogType.Error))
            return null;
        this.validator.validate(ast);
        if (this.logger.count(_1.LogType.Error))
            return null;
        this.analyzer.analyze(ast);
        if (this.logger.count(_1.LogType.Error))
            return null;
        let prettyPrint = this.formatter.format(ast);
        if (this.logger.count(_1.LogType.Error))
            return null;
        let wasmBuffer = this.generator.generate(ast, moduleName);
        if (!wasmBuffer || this.logger.count(_1.LogType.Error))
            return null;
        return wasmBuffer;
    }
}
exports.Compiler = Compiler;
