import { AstNode, AstType } from "./ast";
import { Logger } from "./log";
import * as WASM from "./wasm";
import { Writer } from "./io";
export declare type GenerateRule = (w: Writer, n: AstNode) => void;
export declare class Generator {
    protected logger: Logger;
    private ruleMap;
    protected ast: AstNode;
    protected funcTypes: WASM.FunctionType[];
    protected funcTypeIndices: number[];
    protected funcTypeToTypeIndex: {
        [key: string]: number;
    };
    protected varPathToIndex: {
        [key: string]: number;
    };
    protected funcIndex: number;
    protected funcPathToIndex: {
        [key: string]: number;
    };
    protected funcBodies: WASM.FunctionBody[];
    protected startFuncIndex: number;
    protected globals: WASM.GlobalEntry[];
    protected exports: WASM.ExportEntry[];
    protected funcNames: WASM.Naming[];
    protected localNames: WASM.LocalName[];
    protected names: WASM.NameEntry[];
    constructor(logger: Logger);
    generate(ast: AstNode, name?: string): ArrayBuffer;
    protected register(type: AstType, rule: GenerateRule): void;
    protected gen(w: Writer, node: AstNode): void;
    private getModule(name);
    private addFunction(func);
    private addFunctionBody(func);
    private addLocals(locals, localNamings, node, index);
    private addGlobal(global);
    private toWasmType(type);
    protected logError(msg: string, node: AstNode): void;
}
export declare class WAScriptGenerator extends Generator {
    constructor(logger: Logger);
    protected getIdentifier(node: AstNode): AstNode;
    private stripNum(str);
}
