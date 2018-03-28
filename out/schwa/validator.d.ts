import { Logger } from "./log";
import { AstNode, AstType } from "./ast";
import { Module } from "./compiler";
export declare type ValidateRule = (n: AstNode) => void;
export declare class Validator {
    protected logger: Logger;
    protected mod: Module | undefined;
    private ruleMap;
    constructor(logger: Logger);
    validate(mod: Module): void;
    private validateNode(node);
    protected register(type: AstType, rule: ValidateRule): void;
    protected logError(msg: string, node: AstNode): void;
}
export declare class SchwaValidator extends Validator {
    constructor(logger: Logger);
    protected registerParentType(type: AstType, parentTypes: AstType[]): void;
    protected registerAncestorType(type: AstType, ancestorTypes: AstType[]): void;
    protected registerChildCount(type: AstType, min: number, max?: number): void;
    protected formatOrdinal(n: number): string;
    protected registerChildTypes(type: AstType, childTypes: AstType[][], startIndex?: number): void;
    protected registerChildrenType(type: AstType, childrenTypes: AstType[], startIndex?: number): void;
    protected registerNextSiblingType(type: AstType, siblingTypes: AstType[]): void;
    protected registerPreviousSiblingType(type: AstType, siblingTypes: AstType[]): void;
}
