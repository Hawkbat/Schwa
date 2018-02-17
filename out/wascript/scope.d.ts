import { DataType } from "./datatype";
import { AstNode } from "./ast";
export declare class Variable {
    node: AstNode;
    scope: Scope;
    id: string;
    type: DataType;
    constructor(node: AstNode, scope: Scope, id: string, type: DataType);
    getPath(): string;
}
export declare class Function {
    node: AstNode;
    scope: Scope;
    id: string;
    type: DataType;
    params: DataType[];
    constructor(node: AstNode, scope: Scope, id: string, type: DataType, params: DataType[]);
    getPath(): string;
}
export declare class Scope {
    node: AstNode;
    parent: Scope;
    id: string;
    scopes: {
        [key: string]: Scope;
    };
    vars: {
        [key: string]: Variable;
    };
    funcs: {
        [key: string]: Function;
    };
    constructor(node: AstNode, parent: Scope, id: string);
    getScope(id: string): Scope;
    getVariable(id: string): Variable;
    getFunction(id: string): Function;
}
