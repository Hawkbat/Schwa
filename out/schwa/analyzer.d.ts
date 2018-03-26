import { Logger } from "./log";
import { TokenType } from "./token";
import { AstNode, AstType } from "./ast";
import { DataType } from "./datatype";
import { Scope, Struct, Variable } from "./scope";
export declare type ScopeRule = (n: AstNode, p: Scope) => Scope;
export declare type DataTypeRule = (n: AstNode) => string | null;
export declare type AnalyzeRule = (n: AstNode) => void;
export declare class Analyzer {
    protected logger: Logger;
    private scopeRuleMap;
    private dataTypeRuleMap;
    private analysisRuleMap;
    protected rootScope: Scope;
    constructor(logger: Logger);
    analyze(ast: AstNode): void;
    protected hoistPass(node: AstNode): void;
    protected scopePass(node: AstNode): void;
    protected getScope(node: AstNode, parentScope?: Scope | null): Scope;
    protected typePass(node: AstNode): void;
    protected getDataType(node: AstNode): string;
    protected analysisPass(node: AstNode): void;
    protected makeComplexScope(v: Variable, p: Scope, depth?: number): void;
    protected makeStructScope(v: Variable, p: Scope, struct: Struct, depth?: number): void;
    protected makeArrayScope(v: Variable, p: Scope, depth?: number): void;
    protected getSize(type: string, p: Scope, depth?: number): number;
    protected tryEval(node: AstNode): any;
    protected registerScope(type: AstType, rule: ScopeRule): void;
    protected registerDataType(type: AstType, rule: DataTypeRule): void;
    protected registerAnalysis(type: AstType, rule: AnalyzeRule): void;
    protected registerBuiltinFunc(path: string, type: DataType, paramTypes: DataType[], paramNames: string[]): void;
    protected logError(msg: string, node: AstNode): void;
}
export declare class SchwaAnalyzer extends Analyzer {
    constructor(logger: Logger);
    protected registerDataTypeUnaryOp(type: TokenType, typeSets: DataType[][]): void;
    protected registerDataTypeBinaryOp(type: TokenType, typeSets: DataType[][]): void;
}
