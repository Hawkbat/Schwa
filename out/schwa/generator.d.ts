import { AstNode, AstType } from "./ast";
import { Logger } from "./log";
import { Variable } from "./scope";
import { Module } from "./compiler";
import * as WASM from "./wasm";
import { Writer } from "./io";
export declare type GenerateRule = (w: Writer, n: AstNode) => void;
export declare class Generator {
    protected logger: Logger;
    protected mod: Module | undefined;
    private ruleMap;
    protected ast: AstNode | null;
    protected funcTypes: WASM.FunctionType[];
    protected funcTypeIndices: number[];
    protected funcTypeToTypeIndex: {
        [key: string]: number;
    };
    protected varIndex: number;
    protected varPathToIndex: {
        [key: string]: number;
    };
    protected funcIndex: number;
    protected funcPathToIndex: {
        [key: string]: number;
    };
    protected funcBodies: WASM.FunctionBody[];
    protected startFuncIndex: number;
    protected imports: WASM.ImportEntry[];
    protected globals: WASM.GlobalEntry[];
    protected exports: WASM.ExportEntry[];
    protected funcNames: WASM.Naming[];
    protected localNames: WASM.LocalName[];
    protected names: WASM.NameEntry[];
    constructor(logger: Logger);
    generate(mod: Module): ArrayBuffer | null;
    protected register(type: AstType, rule: GenerateRule): void;
    protected gen(w: Writer, node: AstNode): void;
    private getModule(name);
    private addFunctionImport(func);
    private addGlobalImport(global);
    private addFunction(func);
    private addFunctionBody(func);
    private addLocals(locals, localNamings, node, index);
    private addGlobal(global);
    private toWasmType(type);
    private getDefaultInitializer(type);
    protected getPrimitiveVars(nvar: Variable): Variable[];
    protected logError(msg: string, node: AstNode): void;
}
export declare class SchwaGenerator extends Generator {
    constructor(logger: Logger);
    private stripNum(str);
    private parseRadix(str);
    private parseToInt(str);
    private parseToFloat(str);
    private parseToLong(str);
}
