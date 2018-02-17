import { AstNode, AstType } from "./ast";
import { Logger } from "./log";
export declare type FormatRule = (n: AstNode) => string;
export declare class Formatter {
    protected logger: Logger;
    private ruleMap;
    constructor(logger: Logger);
    format(ast: AstNode): string;
    protected printNode(node: AstNode): string;
    protected register(type: AstType, rule: FormatRule): void;
    protected logError(msg: string, node: AstNode): void;
}
export declare class WAScriptFormatter extends Formatter {
    constructor(logger: Logger);
    protected getDepth(node: AstNode): number;
}