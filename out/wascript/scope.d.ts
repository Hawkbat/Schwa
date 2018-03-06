import { AstNode } from "./ast";
export declare class Variable {
    node: AstNode | null;
    scope: Scope;
    id: string;
    type: string;
    constructor(node: AstNode | null, scope: Scope, id: string, type: string);
    getPath(): string;
}
export declare class Function {
    node: AstNode | null;
    scope: Scope;
    id: string;
    type: string;
    params: string[];
    constructor(node: AstNode | null, scope: Scope, id: string, type: string, params: string[]);
    getPath(): string;
}
export declare class Scope {
    node: AstNode | null;
    parent: Scope | null;
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
    constructor(node: AstNode | null, parent: Scope | null, id: string);
    getScope(id: string): Scope | null;
    getVariable(id: string): Variable | null;
    getFunction(id: string): Function | null;
}
