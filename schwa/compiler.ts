import { Logger, Lexer, Parser, Validator, Analyzer, Formatter, Generator, LogType, AstNode, LogMsg, Token } from './'
import * as fs from 'fs'
import * as path from 'path'

export class Compiler {
    logger: Logger
    lexer: Lexer
    parser: Parser
    validator: Validator
    analyzer: Analyzer
    formatter: Formatter
    generator: Generator

    debug: boolean = false

    constructor(options?: CompilerOptions) {
        if (options) {
            if (options.debug) this.debug = options.debug
        }

        if (this.debug) console.time('setup')
        this.logger = new Logger()
        this.lexer = new Lexer(this.logger)
        this.parser = new Parser(this.logger)
        this.validator = new Validator(this.logger)
        this.analyzer = new Analyzer(this.logger)
        this.formatter = new Formatter(this.logger)
        this.generator = new Generator(this.logger)
        if (this.debug) console.timeEnd('setup')
    }

    compile(module: Module): Module
    compile(modules: Module[]): Module[]
    compile(modules: Module[] | Module): Module[] | Module {

        this.logger.clear()

        if (modules instanceof Module) {
            if (this.debug) console.time('process')
            this.preLinkCompile(modules)
            let linked: Module[] = []
            for (let file of fs.readdirSync(modules.dir)) {
                if (file.endsWith('.schwa')) {
                    let filename = path.basename(file, path.extname(file))
                    if (filename != modules.name) {
                        let lines = fs.readFileSync(path.join(modules.dir, file), 'utf8').split(/\r?\n/g)
                        let mod = new Module(filename, modules.dir, lines)
                        this.preLinkCompile(mod)
                        linked.push(mod)
                    }
                }
            }
            this.linkCompile(modules, linked)
            this.postLinkCompile(modules)
            if (this.debug) console.timeEnd('process')
            if (this.debug) this.debugOutput(modules)
        } else {
            if (this.debug) console.time('process')
            for (let mod of modules) {
                this.preLinkCompile(mod)
            }
            for (let mod of modules) {
                this.linkCompile(mod, modules)
            }
            for (let mod of modules) {
                this.postLinkCompile(mod)
            }
            if (this.debug) console.timeEnd('process')
            if (this.debug) {
                for (let mod of modules) {
                    this.debugOutput(mod)
                }
            }
        }
        return modules
    }

    protected debugOutput(mod: Module) {
        if (this.debug) {
            console.time('output')
            if (mod.result.ast) console.log(mod.result.ast.toString().replace(/\t/g, '\ \ \ \ '))

            if (mod.result.ast && mod.result.ast.scope) console.log(mod.result.ast.scope.toString().replace(/\t/g, '\ \ \ \ '))

            if (mod.result.formatted) console.log(mod.result.formatted.replace(/\t/g, '\ \ \ \ '))
            console.timeEnd('output')
        }
    }

    protected preLinkCompile(mod: Module) {
        mod.result.success = false

        if (this.debug) console.time('lexer')
        mod.result.tokens = this.lexer.lex(mod)
        if (this.debug) console.timeEnd('lexer')

		mod.result.msgs = this.logger.get(mod)
		
        if (this.logger.count(mod, LogType.Error)) return

        if (this.debug) console.time('parser')
        mod.result.ast = this.parser.parse(mod)
        if (this.debug) console.timeEnd('parser')

        mod.result.msgs = this.logger.get(mod)

        if (!mod.result.ast || this.logger.count(mod, LogType.Error)) return

        if (this.debug) console.time('validator')
        this.validator.validate(mod)
        if (this.debug) console.timeEnd('validator')

        mod.result.msgs = this.logger.get(mod)

        if (this.debug) console.time('preAnalyzer')
        this.analyzer.preAnalyze(mod)
        if (this.debug) console.timeEnd('preAnalyzer')

        mod.result.msgs = this.logger.get(mod)
    }

    protected postLinkCompile(mod: Module) {
        if (!mod.result.ast || this.logger.count(mod, LogType.Error)) return

        if (this.debug) console.time('analyzer')
        this.analyzer.analyze(mod)
        if (this.debug) console.timeEnd('analyzer')

        mod.result.msgs = this.logger.get(mod)

        if (this.logger.count(mod, LogType.Error)) return

        if (this.debug) console.time('formatter')
        mod.result.formatted = this.formatter.format(mod)
        if (this.debug) console.timeEnd('formatter')

        mod.result.msgs = this.logger.get(mod)

        if (this.logger.count(mod, LogType.Error)) return

        if (this.debug) console.time('generator')
        mod.result.buffer = this.generator.generate(mod)
        if (this.debug) console.timeEnd('generator')

        mod.result.msgs = this.logger.get(mod)

        if (!mod.result.buffer || this.logger.count(mod, LogType.Error)) return

        mod.result.success = true
    }

    protected linkCompile(mod: Module, modules: Module[]) {
        if (this.debug) console.time('linker')
        this.analyzer.resolveImports(mod, modules.filter(m => this.logger.count(m, LogType.Error) == 0 && m != mod))
        if (this.debug) console.timeEnd('linker')

        mod.result.msgs = this.logger.get(mod)
    }
}

export class Module {
    name: string
    dir: string
    lines: string[]
    result: CompilerResult

    constructor(name: string, dir: string, lines?: string[]) {
        this.name = name
        this.dir = dir
        if (lines) this.lines = lines
        else this.lines = fs.readFileSync(path.join(dir, name + '.schwa'), 'utf8').split(/\r?\n/g)
        this.result = { success: false }
    }
}

export interface CompilerOptions {
    debug?: boolean
}

export interface CompilerResult {
    tokens?: Token[] | null,
    ast?: AstNode | null,
    formatted?: string | null,
    buffer?: ArrayBuffer | null,
    msgs?: LogMsg[] | null,
    success: boolean
}
