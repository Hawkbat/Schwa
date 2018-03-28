import { Logger, Lexer, Parser, Validator, Analyzer, Formatter, Generator, AstNode, LogMsg, Token } from "./";
export declare class Compiler {
    logger: Logger;
    lexer: Lexer;
    parser: Parser;
    validator: Validator;
    analyzer: Analyzer;
    formatter: Formatter;
    generator: Generator;
    debug: boolean;
    constructor(options?: CompilerOptions);
    compile(module: Module): Module;
    compile(modules: Module[]): Module[];
    protected debugOutput(mod: Module): void;
    protected preLinkCompile(mod: Module): void;
    protected postLinkCompile(mod: Module): void;
    protected linkCompile(mod: Module, modules: Module[]): void;
}
export declare class Module {
    name: string;
    dir: string;
    lines: string[];
    result: CompilerResult;
    constructor(name: string, dir: string, lines?: string[]);
}
export interface CompilerOptions {
    debug?: boolean;
}
export interface CompilerResult {
    tokens?: Token[] | null;
    ast?: AstNode | null;
    formatted?: string | null;
    buffer?: ArrayBuffer | null;
    msgs?: LogMsg[] | null;
    success: boolean;
}
