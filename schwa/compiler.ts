import { Logger, Lexer, Parser, Validator, Analyzer, Formatter, Generator, LogType, AstNode, LogMsg, Token } from "./"
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

    compile(lines: string[], moduleName: string = ""): CompilerResult {
        let result: CompilerResult = { success: false }

        this.logger.clear()

        result.tokens = this.lexer.lex(lines)
        result.msgs = this.logger.getLogs()
        if (this.logger.count(LogType.Error)) return result

        result.ast = this.parser.parse(result.tokens)
		result.msgs = this.logger.getLogs()
		
        if (!result.ast || this.logger.count(LogType.Error)) return result

        this.validator.validate(result.ast)
        result.msgs = this.logger.getLogs()

        this.analyzer.analyze(result.ast)
        result.msgs = this.logger.getLogs()
		
        if (this.logger.count(LogType.Error)) return result

        result.formatted = this.formatter.format(result.ast)
		result.msgs = this.logger.getLogs()
		
        if (this.logger.count(LogType.Error)) return result

        result.buffer = this.generator.generate(result.ast, moduleName)
		result.msgs = this.logger.getLogs()
		
        if (!result.buffer || this.logger.count(LogType.Error)) return result

        result.success = true
        return result
    }
}

export interface CompilerResult {
    tokens?: Token[] | null,
    ast?: AstNode | null,
    formatted?: string | null,
    buffer?: ArrayBuffer | null,
    msgs?: LogMsg[] | null,
    success: boolean
}
