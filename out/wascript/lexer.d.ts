import { Token, TokenType } from "./token";
import { Logger } from "./log";
export declare type LexerRule = (row: number, column: number) => Token | undefined;
export declare class Lexer {
    protected logger: Logger;
    private rules;
    private lines;
    private tokens;
    constructor(logger: Logger);
    lex(lines: string[]): Token[];
    protected push(token: Token): void;
    protected getLine(row: number, col?: number, len?: number): string;
    protected register(rule: LexerRule): void;
    protected registerMatch(type: TokenType, pattern: string): void;
    protected registerRegex(type: TokenType, pattern: RegExp): void;
}
export declare class WAScriptLexer extends Lexer {
    constructor(logger: Logger);
}
