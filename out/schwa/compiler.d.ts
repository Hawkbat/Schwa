import { Logger, Lexer, Parser, Validator, Analyzer, Formatter, Generator, AstNode, LogMsg, Token } from "./";
export declare class Compiler {
    logger: Logger;
    lexer: Lexer;
    parser: Parser;
    validator: Validator;
    analyzer: Analyzer;
    formatter: Formatter;
    generator: Generator;
    constructor();
    compile(lines: string[], moduleName?: string): CompilerResult;
}
export interface CompilerResult {
    tokens?: Token[] | null;
    ast?: AstNode | null;
    formatted?: string | null;
    buffer?: ArrayBuffer | null;
    msgs?: LogMsg[] | null;
    success: boolean;
}
