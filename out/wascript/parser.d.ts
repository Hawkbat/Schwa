import { Token, TokenType } from "./token";
import { Logger } from "./log";
import { AstNode } from "./ast";
export declare type PrefixFunc = (token: Token) => AstNode;
export declare type InfixFunc = (left: AstNode, token: Token) => AstNode;
export declare class Parser {
    protected logger: Logger;
    private prefixFuncMap;
    private infixFuncMap;
    private prefixPrecedenceMap;
    private infixPrecedenceMap;
    private index;
    private tokens;
    constructor(logger: Logger);
    parse(tokens: Token[]): AstNode;
    protected parseNode(precedence?: number): AstNode;
    private getPrecedence();
    protected consume(): Token;
    protected peek(): Token;
    protected consumeMatch(type: TokenType): Token;
    protected match(type: TokenType): boolean;
    protected registerPrefix(type: TokenType, precedence: number, func: PrefixFunc): void;
    protected registerPrefixOp(type: TokenType, precedence: number): void;
    protected registerInfix(type: TokenType, precedence: number, func: InfixFunc): void;
    protected registerInfixOp(type: TokenType, precedence: number, rightAssociative: boolean): void;
    protected registerPostfixOp(type: TokenType, precedence: number): void;
}
export declare class WAScriptParser extends Parser {
    constructor(logger: Logger);
}
