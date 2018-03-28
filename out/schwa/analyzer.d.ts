import { Logger } from "./log";
import { TokenType } from "./token";
import { AstNode, AstType } from "./ast";
import { DataType } from "./datatype";
import { Scope, Struct, Variable } from "./scope";
import { Module } from "./compiler";
export declare type ScopeRule = (n: AstNode, p: Scope) => Scope;
export declare type DataTypeRule = (n: AstNode) => string | null;
export declare type AnalyzeRule = (n: AstNode) => void;
export declare class Analyzer {
    protected logger: Logger;
    protected mod: Module | undefined;
    private hoistRuleMap;
    private scopeRuleMap;
    private dataTypeRuleMap;
    private analysisRuleMap;
    protected rootScope: Scope;
    protected imports: Module[] | undefined;
    constructor(logger: Logger);
    preAnalyze(mod: Module): void;
    analyze(mod: Module): void;
    resolveImports(mod: Module, imports: Module[]): void;
    protected hoistPass(node: AstNode): void;
    protected importPass(node: AstNode): void;
    protected scopePass(node: AstNode): void;
    protected hoistScope(node: AstNode, parentScope?: Scope | null): Scope;
    protected getScope(node: AstNode, parentScope?: Scope | null): Scope;
    protected typePass(node: AstNode): void;
    protected getDataType(node: AstNode): string;
    protected analysisPass(node: AstNode): void;
    protected makeComplexScope(v: Variable, p: Scope, depth?: number): void;
    protected makeStructScope(v: Variable, p: Scope, struct: Struct, depth?: number): void;
    protected makeArrayScope(v: Variable, p: Scope, depth?: number): void;
    protected getSize(type: string, p: Scope, depth?: number): number;
    protected tryEval(node: AstNode): any;
    protected registerHoist(type: AstType, rule: ScopeRule): void;
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
