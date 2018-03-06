import { Logger } from "./log";
import { TokenType } from "./token";
import { AstNode, AstType } from "./ast";
import { DataType } from "./datatype";
import { Scope } from "./scope";
export declare type ScopeRule = (n: AstNode, p: Scope) => Scope;
export declare type DataTypeRule = (n: AstNode) => DataType | null;
export declare type AnalyzeRule = (n: AstNode) => void;
export declare class Analyzer {
    protected logger: Logger;
    private scopeRuleMap;
    private dataTypeRuleMap;
    private analysisRuleMap;
    protected rootScope: Scope;
    constructor(logger: Logger);
    analyze(ast: AstNode): void;
    protected scopePass(node: AstNode): void;
    protected getScope(node: AstNode): Scope;
    protected typePass(node: AstNode): void;
    protected getDataType(node: AstNode): DataType;
    protected analysisPass(node: AstNode): void;
    protected registerScope(type: AstType, rule: ScopeRule): void;
    protected registerDataType(type: AstType, rule: DataTypeRule): void;
    protected registerAnalysis(type: AstType, rule: AnalyzeRule): void;
    protected registerBuiltinFunc(path: string, type: DataType, params: DataType[]): void;
    protected logError(msg: string, node: AstNode): void;
}
export declare class WAScriptAnalyzer extends Analyzer {
    constructor(logger: Logger);
    protected registerDataTypeUnaryOp(type: TokenType, typeSets: DataType[][]): void;
    protected registerDataTypeBinaryOp(type: TokenType, typeSets: DataType[][]): void;
    protected getIdentifier(node: AstNode): AstNode | null;
}
