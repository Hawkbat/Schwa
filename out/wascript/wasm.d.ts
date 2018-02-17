import { Writer, Writable } from "./io";
export declare enum OpCode {
    unreachable = 0,
    nop = 1,
    block = 2,
    loop = 3,
    if = 4,
    else = 5,
    end = 11,
    br = 12,
    br_if = 13,
    br_table = 14,
    return = 15,
    call = 16,
    call_indirect = 17,
    drop = 26,
    select = 27,
    get_local = 32,
    set_local = 33,
    tee_local = 34,
    get_global = 35,
    set_global = 36,
    i32_load = 40,
    i64_load = 41,
    f32_load = 42,
    f64_load = 43,
    i32_load8_s = 44,
    i32_load8_u = 45,
    i32_load16_s = 46,
    i32_load16_u = 47,
    i64_load8_s = 48,
    i64_load8_u = 49,
    i64_load16_s = 50,
    i64_load16_u = 51,
    i64_load32_s = 52,
    i64_load32_u = 53,
    i32_store = 54,
    i64_store = 55,
    f32_store = 56,
    f64_store = 57,
    i32_store8 = 58,
    i32_store16 = 59,
    i64_store8 = 60,
    i64_store16 = 61,
    i64_store32 = 62,
    current_memory = 63,
    grow_memory = 64,
    i32_const = 65,
    i64_const = 66,
    f32_const = 67,
    f64_const = 68,
    i32_eqz = 69,
    i32_eq = 70,
    i32_ne = 71,
    i32_lt_s = 72,
    i32_lt_u = 73,
    i32_gt_s = 74,
    i32_gt_u = 75,
    i32_le_s = 76,
    i32_le_u = 77,
    i32_ge_s = 78,
    i32_ge_u = 79,
    i64_eqz = 80,
    i64_eq = 81,
    i64_ne = 82,
    i64_lt_s = 83,
    i64_lt_u = 84,
    i64_gt_s = 85,
    i64_gt_u = 86,
    i64_le_s = 87,
    i64_le_u = 88,
    i64_ge_s = 89,
    i64_ge_u = 90,
    f32_eq = 91,
    f32_ne = 92,
    f32_lt = 93,
    f32_gt = 94,
    f32_le = 95,
    f32_ge = 96,
    f64_eq = 97,
    f64_ne = 98,
    f64_lt = 99,
    f64_gt = 100,
    f64_le = 101,
    f64_ge = 102,
    i32_clz = 103,
    i32_ctz = 104,
    i32_popcnt = 105,
    i32_add = 106,
    i32_sub = 107,
    i32_mul = 108,
    i32_div_s = 109,
    i32_div_u = 110,
    i32_rem_s = 111,
    i32_rem_u = 112,
    i32_and = 113,
    i32_or = 114,
    i32_xor = 115,
    i32_shl = 116,
    i32_shr_s = 117,
    i32_shr_u = 118,
    i32_rotl = 119,
    i32_rotr = 120,
    i64_clz = 121,
    i64_ctz = 122,
    i64_popcnt = 123,
    i64_add = 124,
    i64_sub = 125,
    i64_mul = 126,
    i64_div_s = 127,
    i64_div_u = 128,
    i64_rem_s = 129,
    i64_rem_u = 130,
    i64_and = 131,
    i64_or = 132,
    i64_xor = 133,
    i64_shl = 134,
    i64_shr_s = 135,
    i64_shr_u = 136,
    i64_rotl = 137,
    i64_rotr = 138,
    f32_abs = 139,
    f32_neg = 140,
    f32_ceil = 141,
    f32_floor = 142,
    f32_trunc = 143,
    f32_nearest = 144,
    f32_sqrt = 145,
    f32_add = 146,
    f32_sub = 147,
    f32_mul = 148,
    f32_div = 149,
    f32_min = 150,
    f32_max = 151,
    f32_copysign = 152,
    f64_abs = 153,
    f64_neg = 154,
    f64_ceil = 155,
    f64_floor = 156,
    f64_trunc = 157,
    f64_nearest = 158,
    f64_sqrt = 159,
    f64_add = 160,
    f64_sub = 161,
    f64_mul = 162,
    f64_div = 163,
    f64_min = 164,
    f64_max = 165,
    f64_copysign = 166,
    i32_wrap_i64 = 167,
    i32_trunc_s_f32 = 168,
    i32_trunc_u_f32 = 169,
    i32_trunc_s_f64 = 170,
    i32_trunc_u_f64 = 171,
    i64_extend_s_i32 = 172,
    i64_extend_u_i32 = 173,
    i64_trunc_s_f32 = 174,
    i64_trunc_u_f32 = 175,
    i64_trunc_s_f64 = 176,
    i64_trunc_u_f64 = 177,
    f32_convert_s_i32 = 178,
    f32_convert_u_i32 = 179,
    f32_convert_s_i64 = 180,
    f32_convert_u_i64 = 181,
    f32_demote_f64 = 182,
    f64_convert_s_i32 = 183,
    f64_convert_u_i32 = 184,
    f64_convert_s_i64 = 185,
    f64_convert_u_i64 = 186,
    f64_promote_f32 = 187,
    i32_reinterpret_f32 = 188,
    i64_reinterpret_f64 = 189,
    f32_reinterpret_i32 = 190,
    f64_reinterpret_i64 = 191,
}
export declare enum LangType {
    i32 = 127,
    i64 = 126,
    f32 = 125,
    f64 = 124,
    anyfunc = 112,
    func = 96,
    void = 64,
}
export declare enum ExternalKind {
    Function = 0,
    Table = 1,
    Memory = 2,
    Global = 3,
}
export declare enum NameType {
    Module = 0,
    Function = 1,
    Local = 2,
}
export declare class InitializerExpression implements Writable {
    code: ArrayLike<number>;
    constructor(code: ArrayLike<number>);
    write(w: Writer): void;
}
export declare class FunctionType implements Writable {
    paramTypes: LangType[];
    returnTypes: LangType[];
    constructor(paramTypes: LangType[], returnTypes: LangType[]);
    write(w: Writer): void;
}
export declare class GlobalType implements Writable {
    contentType: LangType;
    mutability: boolean;
    constructor(contentType: LangType, mutability: boolean);
    write(w: Writer): void;
}
export declare class TableType implements Writable {
    elementType: LangType;
    limits: ResizableLimits;
    constructor(elementType: LangType, limits: ResizableLimits);
    write(w: Writer): void;
}
export declare class MemoryType implements Writable {
    limits: ResizableLimits;
    constructor(limits: ResizableLimits);
    write(w: Writer): void;
}
export declare class ResizableLimits implements Writable {
    initial: number;
    maximum: number;
    constructor(initial: number, maximum?: number);
    write(w: Writer): void;
}
export declare class ImportEntry implements Writable {
    module: string;
    field: string;
    kind: ExternalKind;
    type: number | TableType | MemoryType | GlobalType;
    constructor(module: string, field: string, kind: ExternalKind.Function, type: number);
    constructor(module: string, field: string, kind: ExternalKind.Table, type: TableType);
    constructor(module: string, field: string, kind: ExternalKind.Memory, type: MemoryType);
    constructor(module: string, field: string, kind: ExternalKind.Global, type: GlobalType);
    write(w: Writer): void;
}
export declare class GlobalEntry implements Writable {
    type: GlobalType;
    init: InitializerExpression;
    constructor(type: GlobalType, init: InitializerExpression);
    write(w: Writer): void;
}
export declare class ExportEntry implements Writable {
    field: string;
    kind: ExternalKind;
    index: number;
    constructor(field: string, kind: ExternalKind, index: number);
    write(w: Writer): void;
}
export declare class ElementEntry implements Writable {
    index: number;
    offset: InitializerExpression;
    elems: number[];
    constructor(index: number, offset: InitializerExpression, elems: number[]);
    write(w: Writer): void;
}
export declare class LocalEntry implements Writable {
    count: number;
    type: LangType;
    constructor(count: number, type: LangType);
    write(w: Writer): void;
}
export declare class FunctionBody implements Writable {
    locals: LocalEntry[];
    code: ArrayLike<number>;
    constructor(locals: LocalEntry[], code: ArrayLike<number>);
    write(w: Writer): void;
}
export declare class DataEntry implements Writable {
    index: number;
    offset: InitializerExpression;
    data: number[];
    constructor(index: number, offset: InitializerExpression, data: number[]);
    write(w: Writer): void;
}
export declare class NameEntry implements Writable {
    nameType: NameType;
    payload: NameMap | LocalNames | string;
    constructor(nameType: NameType.Module, payload: string);
    constructor(nameType: NameType.Function, payload: NameMap);
    constructor(nameType: NameType.Local, payload: LocalNames);
    write(w: Writer): void;
}
export declare class Naming implements Writable {
    index: number;
    name: string;
    constructor(index: number, name: string);
    write(w: Writer): void;
}
export declare class NameMap implements Writable {
    names: Naming[];
    constructor(names: Naming[]);
    write(w: Writer): void;
}
export declare class LocalName implements Writable {
    index: number;
    localMap: NameMap;
    constructor(index: number, localMap: NameMap);
    write(w: Writer): void;
}
export declare class LocalNames implements Writable {
    funcs: LocalName[];
    constructor(funcs: LocalName[]);
    write(w: Writer): void;
}
export declare class Module implements Writable {
    sections: Section[];
    constructor(sections: Section[]);
    write(w: Writer): void;
}
export declare abstract class Section implements Writable {
    readonly id: number;
    constructor(id: number);
    write(w: Writer): void;
}
export declare class TypeSection extends Section {
    entries: FunctionType[];
    constructor(entries: FunctionType[]);
    write(w: Writer): void;
}
export declare class ImportSection extends Section {
    entries: ImportEntry[];
    constructor(entries: ImportEntry[]);
    write(w: Writer): void;
}
export declare class FunctionSection extends Section {
    typeIndices: number[];
    constructor(typeIndices: number[]);
    write(w: Writer): void;
}
export declare class TableSection extends Section {
    entries: TableType[];
    constructor(entries: TableType[]);
    write(w: Writer): void;
}
export declare class MemorySection extends Section {
    entries: MemoryType[];
    constructor(entries: MemoryType[]);
    write(w: Writer): void;
}
export declare class GlobalSection extends Section {
    entries: GlobalEntry[];
    constructor(entries: GlobalEntry[]);
    write(w: Writer): void;
}
export declare class ExportSection extends Section {
    entries: ExportEntry[];
    constructor(entries: ExportEntry[]);
    write(w: Writer): void;
}
export declare class StartSection extends Section {
    index: number;
    constructor(index: number);
    write(w: Writer): void;
}
export declare class ElementSection extends Section {
    entries: ElementEntry[];
    constructor(entries: ElementEntry[]);
    write(w: Writer): void;
}
export declare class CodeSection extends Section {
    bodies: FunctionBody[];
    constructor(bodies: FunctionBody[]);
    write(w: Writer): void;
}
export declare class DataSection extends Section {
    entries: DataEntry[];
    constructor(entries: DataEntry[]);
    write(w: Writer): void;
}
export declare class CustomSection extends Section {
    name: string;
    constructor(name: string);
    write(w: Writer): void;
}
export declare class NameSection extends CustomSection {
    entries: NameEntry[];
    constructor(entries: NameEntry[]);
    write(w: Writer): void;
}
