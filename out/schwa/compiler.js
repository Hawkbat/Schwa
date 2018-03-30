"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
const fs = require("fs");
const path = require("path");
class Compiler {
    constructor(options) {
        this.debug = false;
        if (options) {
            if (options.debug)
                this.debug = options.debug;
        }
        if (this.debug)
            console.time("setup");
        this.logger = new _1.Logger();
        this.lexer = new _1.Lexer(this.logger);
        this.parser = new _1.Parser(this.logger);
        this.validator = new _1.Validator(this.logger);
        this.analyzer = new _1.Analyzer(this.logger);
        this.formatter = new _1.Formatter(this.logger);
        this.generator = new _1.Generator(this.logger);
        if (this.debug)
            console.timeEnd("setup");
    }
    compile(modules) {
        this.logger.clear();
        if (modules instanceof Module) {
            if (this.debug)
                console.time("process");
            this.preLinkCompile(modules);
            let linked = [];
            for (let file of fs.readdirSync(modules.dir)) {
                if (file.endsWith('.schwa')) {
                    let filename = path.basename(file, path.extname(file));
                    if (filename != modules.name) {
                        let lines = fs.readFileSync(path.join(modules.dir, file), "utf8").split(/\r?\n/g);
                        let mod = new Module(filename, modules.dir, lines);
                        this.preLinkCompile(mod);
                        linked.push(mod);
                    }
                }
            }
            this.linkCompile(modules, linked);
            this.postLinkCompile(modules);
            if (this.debug)
                console.timeEnd("process");
            if (this.debug)
                this.debugOutput(modules);
        }
        else {
            if (this.debug)
                console.time("process");
            for (let mod of modules) {
                this.preLinkCompile(mod);
            }
            for (let mod of modules) {
                this.linkCompile(mod, modules);
            }
            for (let mod of modules) {
                this.postLinkCompile(mod);
            }
            if (this.debug)
                console.timeEnd("process");
            if (this.debug) {
                for (let mod of modules) {
                    this.debugOutput(mod);
                }
            }
        }
        return modules;
    }
    debugOutput(mod) {
        if (this.debug) {
            console.time("output");
            if (mod.result.ast)
                console.log(mod.result.ast.toString().replace(/\t/g, '\ \ \ \ '));
            if (mod.result.ast && mod.result.ast.scope)
                console.log(mod.result.ast.scope.toString().replace(/\t/g, '\ \ \ \ '));
            if (mod.result.formatted)
                console.log(mod.result.formatted.replace(/\t/g, '\ \ \ \ '));
            console.timeEnd("output");
        }
    }
    preLinkCompile(mod) {
        mod.result.success = false;
        if (this.debug)
            console.time("lexer");
        mod.result.tokens = this.lexer.lex(mod);
        if (this.debug)
            console.timeEnd("lexer");
        mod.result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return;
        if (this.debug)
            console.time("parser");
        mod.result.ast = this.parser.parse(mod);
        if (this.debug)
            console.timeEnd("parser");
        mod.result.msgs = this.logger.getLogs();
        if (!mod.result.ast || this.logger.count(_1.LogType.Error))
            return;
        if (this.debug)
            console.time("validator");
        this.validator.validate(mod);
        if (this.debug)
            console.timeEnd("validator");
        mod.result.msgs = this.logger.getLogs();
        if (this.debug)
            console.time("preAnalyzer");
        this.analyzer.preAnalyze(mod);
        if (this.debug)
            console.timeEnd("preAnalyzer");
        mod.result.msgs = this.logger.getLogs();
    }
    postLinkCompile(mod) {
        if (!mod.result.ast || this.logger.count(_1.LogType.Error))
            return;
        if (this.debug)
            console.time("analyzer");
        this.analyzer.analyze(mod);
        if (this.debug)
            console.timeEnd("analyzer");
        mod.result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return;
        if (this.debug)
            console.time("formatter");
        mod.result.formatted = this.formatter.format(mod);
        if (this.debug)
            console.timeEnd("formatter");
        mod.result.msgs = this.logger.getLogs();
        if (this.logger.count(_1.LogType.Error))
            return;
        if (this.debug)
            console.time("generator");
        mod.result.buffer = this.generator.generate(mod);
        if (this.debug)
            console.timeEnd("generator");
        mod.result.msgs = this.logger.getLogs();
        if (!mod.result.buffer || this.logger.count(_1.LogType.Error))
            return;
        mod.result.success = true;
    }
    linkCompile(mod, modules) {
        this.analyzer.resolveImports(mod, modules.filter(m => m != mod));
    }
}
exports.Compiler = Compiler;
class Module {
    constructor(name, dir, lines) {
        this.name = name;
        this.dir = dir;
        if (lines)
            this.lines = lines;
        else
            this.lines = fs.readFileSync(path.join(dir, name + '.schwa'), 'utf8').split(/\r?\n/g);
        this.result = { success: false };
    }
}
exports.Module = Module;
