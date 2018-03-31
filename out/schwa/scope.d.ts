import { AstNode } from "./ast";
export declare class Variable {
    node: AstNode | null;
    scope: Scope;
    id: string;
    type: string;
    alias: string;
    global: boolean;
    const: boolean;
    export: boolean;
    import: string;
    mapped: boolean;
    offset: number;
    size: number;
    constructor(node: AstNode | null, scope: Scope, id: string, type: string);
    getPath(untilNode?: boolean): string;
    clone(node?: AstNode | null, scope?: Scope, id?: string): Variable;
    toString(): string;
}
export declare class Function {
    node: AstNode | null;
    scope: Scope;
    id: string;
    type: string;
    params: Variable[];
    alias: string;
    import: string;
    export: boolean;
    constructor(node: AstNode | null, scope: Scope, id: string, type: string, params: Variable[]);
    getPath(): string;
    clone(node?: AstNode | null, scope?: Scope, id?: string): Function;
    toString(): string;
}
export declare class Struct {
    node: AstNode | null;
    scope: Scope;
    id: string;
    fields: Variable[];
    alias: string;
    import: string;
    export: boolean;
    constructor(node: AstNode | null, scope: Scope, id: string, fields: Variable[]);
    getPath(): string;
    clone(node?: AstNode | null, scope?: Scope, id?: string): Struct;
    toString(): string;
}
export declare class Scope {
    node: AstNode | null;
    parent: Scope | null;
    id: string;
    alias: string;
    import: string;
    export: boolean;
    scopes: {
        [key: string]: Scope;
    };
    vars: {
        [key: string]: Variable;
    };
    funcs: {
        [key: string]: Function;
    };
    structs: {
        [key: string]: Struct;
    };
    constructor(node: AstNode | null, parent: Scope | null, id: string);
    getScope(id: string): Scope | null;
    getVariable(id: string): Variable | null;
    getFunction(id: string): Function | null;
    getStruct(id: string): Struct | null;
    getPath(): string;
    clone(node?: AstNode | null, parent?: Scope | null, id?: string): Scope;
    toString(): string;
    print(depth: number, skipLabel: boolean): string;
}
