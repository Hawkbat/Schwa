import { Token, TokenType } from "./token";
import { Logger } from "./log";
import { AstNode } from "./ast";
import { Module } from "./compiler";
export declare type PrefixFunc = (token: Token) => AstNode;
export declare type InfixFunc = (left: AstNode | null, token: Token) => AstNode;
export declare class Parser {
    protected logger: Logger;
    protected mod: Module | undefined;
    private prefixFuncMap;
    private infixFuncMap;
    private prefixPrecedenceMap;
    private infixPrecedenceMap;
    private index;
    private tokens;
    constructor(logger: Logger);
    parse(mod: Module): AstNode | null;
    protected parseNode(precedence?: number): AstNode | null;
    private getPrecedence();
    protected consume(): Token | null;
    protected peek(): Token | null;
    protected consumeMatch(type: TokenType, match: TokenType): Token | null;
    protected match(type: TokenType): boolean;
    protected registerPrefix(type: TokenType, precedence: number, func: PrefixFunc): void;
    protected registerPrefixOp(type: TokenType, precedence: number): void;
    protected registerInfix(type: TokenType, precedence: number, func: InfixFunc): void;
    protected registerInfixOp(type: TokenType, precedence: number, rightAssociative: boolean): void;
    protected registerPostfixOp(type: TokenType, precedence: number): void;
}
export declare class SchwaParser extends Parser {
    constructor(logger: Logger);
}
