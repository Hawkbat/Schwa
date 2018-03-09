import { Logger, Lexer, Parser, Validator, Analyzer, Formatter, Generator, LogType } from "./"
import * as fs from "fs"
import * as path from "path"

export class Compiler {
    logger: Logger
    lexer: Lexer
    parser: Parser
    validator: Validator
    analyzer: Analyzer
    formatter: Formatter
    generator: Generator

    constructor() {
        this.logger = new Logger()
        this.lexer = new Lexer(this.logger)
        this.parser = new Parser(this.logger)
        this.validator = new Validator(this.logger)
        this.analyzer = new Analyzer(this.logger)
        this.formatter = new Formatter(this.logger)
        this.generator = new Generator(this.logger)
    }

    compile(lines: string[], moduleName: string = ""): ArrayBuffer | null {
        this.logger.clear()
        let tokens = this.lexer.lex(lines)
        if (this.logger.count(LogType.Error)) return null
        let ast = this.parser.parse(tokens)
        if (!ast || this.logger.count(LogType.Error)) return null
        this.validator.validate(ast)
        if (this.logger.count(LogType.Error)) return null
        this.analyzer.analyze(ast)
        if (this.logger.count(LogType.Error)) return null
        let prettyPrint = this.formatter.format(ast)
        if (this.logger.count(LogType.Error)) return null
        let wasmBuffer = this.generator.generate(ast, moduleName)
        if (!wasmBuffer || this.logger.count(LogType.Error)) return null
		return wasmBuffer
    }
}
