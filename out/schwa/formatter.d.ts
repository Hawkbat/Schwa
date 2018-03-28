import { AstNode, AstType } from "./ast";
import { Logger } from "./log";
import { Module } from "./compiler";
export declare type FormatRule = (n: AstNode) => string;
export declare class Formatter {
    protected logger: Logger;
    protected mod: Module | undefined;
    private ruleMap;
    constructor(logger: Logger);
    format(mod: Module): string;
    protected printNode(node: AstNode | undefined | null): string;
    protected register(type: AstType, rule: FormatRule): void;
    protected logError(msg: string, node: AstNode): void;
}
export declare class SchwaFormatter extends Formatter {
    constructor(logger: Logger);
    protected PRECEDENCE_MAP: {
        [key: string]: number;
    };
    protected needsParens(n: AstNode): boolean;
    protected getDepth(node: AstNode): number;
}
