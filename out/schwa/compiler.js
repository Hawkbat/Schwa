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
        let result = { success: false };
        this.logger.clear();
        result.tokens = this.lexer.lex(lines);
        result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return result;
        result.ast = this.parser.parse(result.tokens);
        result.msgs = this.logger.getLogs();
        if (!result.ast || this.logger.count(_1.LogType.Error))
            return result;
        this.validator.validate(result.ast);
        result.msgs = this.logger.getLogs();
        this.analyzer.analyze(result.ast);
        result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return result;
        result.formatted = this.formatter.format(result.ast);
        result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return result;
        result.buffer = this.generator.generate(result.ast, moduleName);
        result.msgs = this.logger.getLogs();
        if (!result.buffer || this.logger.count(_1.LogType.Error))
            return result;
        result.success = true;
        return result;
    }
}
exports.Compiler = Compiler;
