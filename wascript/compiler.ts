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

    compile(filepath: string, lines: string[]) {
        let filename = path.basename(filepath, path.extname(filepath))
        let dirpath = path.dirname(filepath)

        this.logger.clear()
        let tokens = this.lexer.lex(lines)
        if (this.logger.count(LogType.Error)) return
        let ast = this.parser.parse(tokens)
        if (this.logger.count(LogType.Error)) return
        this.validator.validate(ast)
        if (this.logger.count(LogType.Error)) return
        this.analyzer.analyze(ast)
        if (this.logger.count(LogType.Error)) return
        let prettyPrint = this.formatter.format(ast)
        if (this.logger.count(LogType.Error)) return
        let wasmBuffer = this.generator.generate(ast, filename)
        if (this.logger.count(LogType.Error)) return
        fs.writeFile(path.join(dirpath, filename + '.wasm'), Buffer.from(wasmBuffer), (err) => {
            if (err) throw err
        })
    }
}