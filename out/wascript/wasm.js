"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io_1 = require("./io");
var OpCode;
(function (OpCode) {
    OpCode[OpCode["unreachable"] = 0] = "unreachable";
    OpCode[OpCode["nop"] = 1] = "nop";
    OpCode[OpCode["block"] = 2] = "block";
    OpCode[OpCode["loop"] = 3] = "loop";
    OpCode[OpCode["if"] = 4] = "if";
    OpCode[OpCode["else"] = 5] = "else";
    OpCode[OpCode["end"] = 11] = "end";
    OpCode[OpCode["br"] = 12] = "br";
    OpCode[OpCode["br_if"] = 13] = "br_if";
    OpCode[OpCode["br_table"] = 14] = "br_table";
    OpCode[OpCode["return"] = 15] = "return";
    OpCode[OpCode["call"] = 16] = "call";
    OpCode[OpCode["call_indirect"] = 17] = "call_indirect";
    OpCode[OpCode["drop"] = 26] = "drop";
    OpCode[OpCode["select"] = 27] = "select";
    OpCode[OpCode["get_local"] = 32] = "get_local";
    OpCode[OpCode["set_local"] = 33] = "set_local";
    OpCode[OpCode["tee_local"] = 34] = "tee_local";
    OpCode[OpCode["get_global"] = 35] = "get_global";
    OpCode[OpCode["set_global"] = 36] = "set_global";
    OpCode[OpCode["i32_load"] = 40] = "i32_load";
    OpCode[OpCode["i64_load"] = 41] = "i64_load";
    OpCode[OpCode["f32_load"] = 42] = "f32_load";
    OpCode[OpCode["f64_load"] = 43] = "f64_load";
    OpCode[OpCode["i32_load8_s"] = 44] = "i32_load8_s";
    OpCode[OpCode["i32_load8_u"] = 45] = "i32_load8_u";
    OpCode[OpCode["i32_load16_s"] = 46] = "i32_load16_s";
    OpCode[OpCode["i32_load16_u"] = 47] = "i32_load16_u";
    OpCode[OpCode["i64_load8_s"] = 48] = "i64_load8_s";
    OpCode[OpCode["i64_load8_u"] = 49] = "i64_load8_u";
    OpCode[OpCode["i64_load16_s"] = 50] = "i64_load16_s";
    OpCode[OpCode["i64_load16_u"] = 51] = "i64_load16_u";
    OpCode[OpCode["i64_load32_s"] = 52] = "i64_load32_s";
    OpCode[OpCode["i64_load32_u"] = 53] = "i64_load32_u";
    OpCode[OpCode["i32_store"] = 54] = "i32_store";
    OpCode[OpCode["i64_store"] = 55] = "i64_store";
    OpCode[OpCode["f32_store"] = 56] = "f32_store";
    OpCode[OpCode["f64_store"] = 57] = "f64_store";
    OpCode[OpCode["i32_store8"] = 58] = "i32_store8";
    OpCode[OpCode["i32_store16"] = 59] = "i32_store16";
    OpCode[OpCode["i64_store8"] = 60] = "i64_store8";
    OpCode[OpCode["i64_store16"] = 61] = "i64_store16";
    OpCode[OpCode["i64_store32"] = 62] = "i64_store32";
    OpCode[OpCode["current_memory"] = 63] = "current_memory";
    OpCode[OpCode["grow_memory"] = 64] = "grow_memory";
    OpCode[OpCode["i32_const"] = 65] = "i32_const";
    OpCode[OpCode["i64_const"] = 66] = "i64_const";
    OpCode[OpCode["f32_const"] = 67] = "f32_const";
    OpCode[OpCode["f64_const"] = 68] = "f64_const";
    OpCode[OpCode["i32_eqz"] = 69] = "i32_eqz";
    OpCode[OpCode["i32_eq"] = 70] = "i32_eq";
    OpCode[OpCode["i32_ne"] = 71] = "i32_ne";
    OpCode[OpCode["i32_lt_s"] = 72] = "i32_lt_s";
    OpCode[OpCode["i32_lt_u"] = 73] = "i32_lt_u";
    OpCode[OpCode["i32_gt_s"] = 74] = "i32_gt_s";
    OpCode[OpCode["i32_gt_u"] = 75] = "i32_gt_u";
    OpCode[OpCode["i32_le_s"] = 76] = "i32_le_s";
    OpCode[OpCode["i32_le_u"] = 77] = "i32_le_u";
    OpCode[OpCode["i32_ge_s"] = 78] = "i32_ge_s";
    OpCode[OpCode["i32_ge_u"] = 79] = "i32_ge_u";
    OpCode[OpCode["i64_eqz"] = 80] = "i64_eqz";
    OpCode[OpCode["i64_eq"] = 81] = "i64_eq";
    OpCode[OpCode["i64_ne"] = 82] = "i64_ne";
    OpCode[OpCode["i64_lt_s"] = 83] = "i64_lt_s";
    OpCode[OpCode["i64_lt_u"] = 84] = "i64_lt_u";
    OpCode[OpCode["i64_gt_s"] = 85] = "i64_gt_s";
    OpCode[OpCode["i64_gt_u"] = 86] = "i64_gt_u";
    OpCode[OpCode["i64_le_s"] = 87] = "i64_le_s";
    OpCode[OpCode["i64_le_u"] = 88] = "i64_le_u";
    OpCode[OpCode["i64_ge_s"] = 89] = "i64_ge_s";
    OpCode[OpCode["i64_ge_u"] = 90] = "i64_ge_u";
    OpCode[OpCode["f32_eq"] = 91] = "f32_eq";
    OpCode[OpCode["f32_ne"] = 92] = "f32_ne";
    OpCode[OpCode["f32_lt"] = 93] = "f32_lt";
    OpCode[OpCode["f32_gt"] = 94] = "f32_gt";
    OpCode[OpCode["f32_le"] = 95] = "f32_le";
    OpCode[OpCode["f32_ge"] = 96] = "f32_ge";
    OpCode[OpCode["f64_eq"] = 97] = "f64_eq";
    OpCode[OpCode["f64_ne"] = 98] = "f64_ne";
    OpCode[OpCode["f64_lt"] = 99] = "f64_lt";
    OpCode[OpCode["f64_gt"] = 100] = "f64_gt";
    OpCode[OpCode["f64_le"] = 101] = "f64_le";
    OpCode[OpCode["f64_ge"] = 102] = "f64_ge";
    OpCode[OpCode["i32_clz"] = 103] = "i32_clz";
    OpCode[OpCode["i32_ctz"] = 104] = "i32_ctz";
    OpCode[OpCode["i32_popcnt"] = 105] = "i32_popcnt";
    OpCode[OpCode["i32_add"] = 106] = "i32_add";
    OpCode[OpCode["i32_sub"] = 107] = "i32_sub";
    OpCode[OpCode["i32_mul"] = 108] = "i32_mul";
    OpCode[OpCode["i32_div_s"] = 109] = "i32_div_s";
    OpCode[OpCode["i32_div_u"] = 110] = "i32_div_u";
    OpCode[OpCode["i32_rem_s"] = 111] = "i32_rem_s";
    OpCode[OpCode["i32_rem_u"] = 112] = "i32_rem_u";
    OpCode[OpCode["i32_and"] = 113] = "i32_and";
    OpCode[OpCode["i32_or"] = 114] = "i32_or";
    OpCode[OpCode["i32_xor"] = 115] = "i32_xor";
    OpCode[OpCode["i32_shl"] = 116] = "i32_shl";
    OpCode[OpCode["i32_shr_s"] = 117] = "i32_shr_s";
    OpCode[OpCode["i32_shr_u"] = 118] = "i32_shr_u";
    OpCode[OpCode["i32_rotl"] = 119] = "i32_rotl";
    OpCode[OpCode["i32_rotr"] = 120] = "i32_rotr";
    OpCode[OpCode["i64_clz"] = 121] = "i64_clz";
    OpCode[OpCode["i64_ctz"] = 122] = "i64_ctz";
    OpCode[OpCode["i64_popcnt"] = 123] = "i64_popcnt";
    OpCode[OpCode["i64_add"] = 124] = "i64_add";
    OpCode[OpCode["i64_sub"] = 125] = "i64_sub";
    OpCode[OpCode["i64_mul"] = 126] = "i64_mul";
    OpCode[OpCode["i64_div_s"] = 127] = "i64_div_s";
    OpCode[OpCode["i64_div_u"] = 128] = "i64_div_u";
    OpCode[OpCode["i64_rem_s"] = 129] = "i64_rem_s";
    OpCode[OpCode["i64_rem_u"] = 130] = "i64_rem_u";
    OpCode[OpCode["i64_and"] = 131] = "i64_and";
    OpCode[OpCode["i64_or"] = 132] = "i64_or";
    OpCode[OpCode["i64_xor"] = 133] = "i64_xor";
    OpCode[OpCode["i64_shl"] = 134] = "i64_shl";
    OpCode[OpCode["i64_shr_s"] = 135] = "i64_shr_s";
    OpCode[OpCode["i64_shr_u"] = 136] = "i64_shr_u";
    OpCode[OpCode["i64_rotl"] = 137] = "i64_rotl";
    OpCode[OpCode["i64_rotr"] = 138] = "i64_rotr";
    OpCode[OpCode["f32_abs"] = 139] = "f32_abs";
    OpCode[OpCode["f32_neg"] = 140] = "f32_neg";
    OpCode[OpCode["f32_ceil"] = 141] = "f32_ceil";
    OpCode[OpCode["f32_floor"] = 142] = "f32_floor";
    OpCode[OpCode["f32_trunc"] = 143] = "f32_trunc";
    OpCode[OpCode["f32_nearest"] = 144] = "f32_nearest";
    OpCode[OpCode["f32_sqrt"] = 145] = "f32_sqrt";
    OpCode[OpCode["f32_add"] = 146] = "f32_add";
    OpCode[OpCode["f32_sub"] = 147] = "f32_sub";
    OpCode[OpCode["f32_mul"] = 148] = "f32_mul";
    OpCode[OpCode["f32_div"] = 149] = "f32_div";
    OpCode[OpCode["f32_min"] = 150] = "f32_min";
    OpCode[OpCode["f32_max"] = 151] = "f32_max";
    OpCode[OpCode["f32_copysign"] = 152] = "f32_copysign";
    OpCode[OpCode["f64_abs"] = 153] = "f64_abs";
    OpCode[OpCode["f64_neg"] = 154] = "f64_neg";
    OpCode[OpCode["f64_ceil"] = 155] = "f64_ceil";
    OpCode[OpCode["f64_floor"] = 156] = "f64_floor";
    OpCode[OpCode["f64_trunc"] = 157] = "f64_trunc";
    OpCode[OpCode["f64_nearest"] = 158] = "f64_nearest";
    OpCode[OpCode["f64_sqrt"] = 159] = "f64_sqrt";
    OpCode[OpCode["f64_add"] = 160] = "f64_add";
    OpCode[OpCode["f64_sub"] = 161] = "f64_sub";
    OpCode[OpCode["f64_mul"] = 162] = "f64_mul";
    OpCode[OpCode["f64_div"] = 163] = "f64_div";
    OpCode[OpCode["f64_min"] = 164] = "f64_min";
    OpCode[OpCode["f64_max"] = 165] = "f64_max";
    OpCode[OpCode["f64_copysign"] = 166] = "f64_copysign";
    OpCode[OpCode["i32_wrap_i64"] = 167] = "i32_wrap_i64";
    OpCode[OpCode["i32_trunc_s_f32"] = 168] = "i32_trunc_s_f32";
    OpCode[OpCode["i32_trunc_u_f32"] = 169] = "i32_trunc_u_f32";
    OpCode[OpCode["i32_trunc_s_f64"] = 170] = "i32_trunc_s_f64";
    OpCode[OpCode["i32_trunc_u_f64"] = 171] = "i32_trunc_u_f64";
    OpCode[OpCode["i64_extend_s_i32"] = 172] = "i64_extend_s_i32";
    OpCode[OpCode["i64_extend_u_i32"] = 173] = "i64_extend_u_i32";
    OpCode[OpCode["i64_trunc_s_f32"] = 174] = "i64_trunc_s_f32";
    OpCode[OpCode["i64_trunc_u_f32"] = 175] = "i64_trunc_u_f32";
    OpCode[OpCode["i64_trunc_s_f64"] = 176] = "i64_trunc_s_f64";
    OpCode[OpCode["i64_trunc_u_f64"] = 177] = "i64_trunc_u_f64";
    OpCode[OpCode["f32_convert_s_i32"] = 178] = "f32_convert_s_i32";
    OpCode[OpCode["f32_convert_u_i32"] = 179] = "f32_convert_u_i32";
    OpCode[OpCode["f32_convert_s_i64"] = 180] = "f32_convert_s_i64";
    OpCode[OpCode["f32_convert_u_i64"] = 181] = "f32_convert_u_i64";
    OpCode[OpCode["f32_demote_f64"] = 182] = "f32_demote_f64";
    OpCode[OpCode["f64_convert_s_i32"] = 183] = "f64_convert_s_i32";
    OpCode[OpCode["f64_convert_u_i32"] = 184] = "f64_convert_u_i32";
    OpCode[OpCode["f64_convert_s_i64"] = 185] = "f64_convert_s_i64";
    OpCode[OpCode["f64_convert_u_i64"] = 186] = "f64_convert_u_i64";
    OpCode[OpCode["f64_promote_f32"] = 187] = "f64_promote_f32";
    OpCode[OpCode["i32_reinterpret_f32"] = 188] = "i32_reinterpret_f32";
    OpCode[OpCode["i64_reinterpret_f64"] = 189] = "i64_reinterpret_f64";
    OpCode[OpCode["f32_reinterpret_i32"] = 190] = "f32_reinterpret_i32";
    OpCode[OpCode["f64_reinterpret_i64"] = 191] = "f64_reinterpret_i64";
})(OpCode = exports.OpCode || (exports.OpCode = {}));
var LangType;
(function (LangType) {
    LangType[LangType["i32"] = 127] = "i32";
    LangType[LangType["i64"] = 126] = "i64";
    LangType[LangType["f32"] = 125] = "f32";
    LangType[LangType["f64"] = 124] = "f64";
    LangType[LangType["anyfunc"] = 112] = "anyfunc";
    LangType[LangType["func"] = 96] = "func";
    LangType[LangType["void"] = 64] = "void";
})(LangType = exports.LangType || (exports.LangType = {}));
var ExternalKind;
(function (ExternalKind) {
    ExternalKind[ExternalKind["Function"] = 0] = "Function";
    ExternalKind[ExternalKind["Table"] = 1] = "Table";
    ExternalKind[ExternalKind["Memory"] = 2] = "Memory";
    ExternalKind[ExternalKind["Global"] = 3] = "Global";
})(ExternalKind = exports.ExternalKind || (exports.ExternalKind = {}));
var NameType;
(function (NameType) {
    NameType[NameType["Module"] = 0] = "Module";
    NameType[NameType["Function"] = 1] = "Function";
    NameType[NameType["Local"] = 2] = "Local";
})(NameType = exports.NameType || (exports.NameType = {}));
class InitializerExpression {
    constructor(code) {
        this.code = code;
    }
    write(w) {
        w.bytes(this.code);
        w.uint8(OpCode.end);
    }
}
exports.InitializerExpression = InitializerExpression;
class FunctionType {
    constructor(paramTypes, returnTypes) {
        this.paramTypes = paramTypes;
        this.returnTypes = returnTypes;
    }
    write(w) {
        w.uint8(LangType.func);
        w.varuintN(this.paramTypes.length, 32);
        for (var i = 0; i < this.paramTypes.length; i++)
            w.uint8(this.paramTypes[i]);
        w.varuintN(this.returnTypes.length, 1);
        for (var i = 0; i < this.returnTypes.length; i++)
            w.uint8(this.returnTypes[i]);
    }
}
exports.FunctionType = FunctionType;
class GlobalType {
    constructor(contentType, mutability) {
        this.contentType = contentType;
        this.mutability = mutability;
    }
    write(w) {
        w.uint8(this.contentType);
        w.varuintN(this.mutability ? 1 : 0, 1);
    }
}
exports.GlobalType = GlobalType;
class TableType {
    constructor(elementType, limits) {
        this.elementType = elementType;
        this.limits = limits;
    }
    write(w) {
        w.uint8(this.elementType);
        w.write(this.limits);
    }
}
exports.TableType = TableType;
class MemoryType {
    constructor(limits) {
        this.limits = limits;
    }
    write(w) {
        w.write(this.limits);
    }
}
exports.MemoryType = MemoryType;
class ResizableLimits {
    constructor(initial, maximum) {
        this.initial = initial;
        this.maximum = maximum;
    }
    write(w) {
        w.varuintN(this.maximum ? 1 : 0, 1);
        w.varuintN(this.initial, 32);
        if (this.maximum)
            w.varuintN(this.maximum, 32);
    }
}
exports.ResizableLimits = ResizableLimits;
class ImportEntry {
    constructor(module, field, kind, type) {
        this.module = module;
        this.field = field;
        this.kind = kind;
        this.type = type;
    }
    write(w) {
        w.utf8(this.module);
        w.utf8(this.field);
        w.uint8(this.kind);
        if (this.kind == ExternalKind.Function) {
            w.varuintN(this.type, 32);
        }
        else if (this.kind == ExternalKind.Table) {
            w.write(this.type);
        }
        else if (this.kind == ExternalKind.Memory) {
            w.write(this.type);
        }
        else if (this.kind == ExternalKind.Global) {
            w.write(this.type);
        }
    }
}
exports.ImportEntry = ImportEntry;
class GlobalEntry {
    constructor(type, init) {
        this.type = type;
        this.init = init;
    }
    write(w) {
        w.write(this.type);
        w.write(this.init);
    }
}
exports.GlobalEntry = GlobalEntry;
class ExportEntry {
    constructor(field, kind, index) {
        this.field = field;
        this.kind = kind;
        this.index = index;
    }
    write(w) {
        var buf = Buffer.from(this.field);
        w.varuintN(buf.byteLength, 32);
        w.bytes(buf);
        w.uint8(this.kind);
        w.varuintN(this.index, 32);
    }
}
exports.ExportEntry = ExportEntry;
class ElementEntry {
    constructor(index, offset, elems) {
        this.index = index;
        this.offset = offset;
        this.elems = elems;
    }
    write(w) {
        w.varuintN(this.index, 32);
        w.write(this.offset);
        w.varuintN(this.elems.length, 32);
        for (var i = 0; i < this.elems.length; i++)
            w.varuintN(this.elems[i], 32);
    }
}
exports.ElementEntry = ElementEntry;
class LocalEntry {
    constructor(count, type) {
        this.count = count;
        this.type = type;
    }
    write(w) {
        w.varuintN(this.count, 32);
        w.uint8(this.type);
    }
}
exports.LocalEntry = LocalEntry;
class FunctionBody {
    constructor(locals, code) {
        this.locals = locals;
        this.code = code;
    }
    write(w) {
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.locals.length, 32);
        for (var i = 0; i < this.locals.length; i++)
            subWriter.write(this.locals[i]);
        subWriter.bytes(this.code);
        subWriter.uint8(OpCode.end);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.byteLength, 32);
        w.bytes(buf);
    }
}
exports.FunctionBody = FunctionBody;
class DataEntry {
    constructor(index, offset, data) {
        this.index = index;
        this.offset = offset;
        this.data = data;
    }
    write(w) {
        w.varuintN(this.index, 32);
        w.write(this.offset);
        w.varuintN(this.data.length, 32);
        w.bytes(this.data);
    }
}
exports.DataEntry = DataEntry;
class NameEntry {
    constructor(nameType, payload) {
        this.nameType = nameType;
        this.payload = payload;
    }
    write(w) {
        w.uint8(this.nameType);
        var subWriter = new io_1.Writer();
        if (typeof this.payload == "string") {
            subWriter.utf8(this.payload);
        }
        else {
            subWriter.write(this.payload);
        }
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.byteLength, 32);
        w.bytes(buf);
    }
}
exports.NameEntry = NameEntry;
class Naming {
    constructor(index, name) {
        this.index = index;
        this.name = name;
    }
    write(w) {
        w.varuintN(this.index, 32);
        w.utf8(this.name);
    }
}
exports.Naming = Naming;
class NameMap {
    constructor(names) {
        this.names = names;
    }
    write(w) {
        w.varuintN(this.names.length, 32);
        for (var i = 0; i < this.names.length; i++)
            w.write(this.names[i]);
    }
}
exports.NameMap = NameMap;
class LocalName {
    constructor(index, localMap) {
        this.index = index;
        this.localMap = localMap;
    }
    write(w) {
        w.varuintN(this.index, 32);
        w.write(this.localMap);
    }
}
exports.LocalName = LocalName;
class LocalNames {
    constructor(funcs) {
        this.funcs = funcs;
    }
    write(w) {
        w.varuintN(this.funcs.length, 32);
        for (var i = 0; i < this.funcs.length; i++)
            w.write(this.funcs[i]);
    }
}
exports.LocalNames = LocalNames;
class Module {
    constructor(sections) {
        this.sections = sections;
    }
    write(w) {
        w.uint32(0x6d736100); // Magic number
        w.uint32(0x1); // Version
        for (var i = 0; i < this.sections.length; i++)
            w.write(this.sections[i]);
    }
}
exports.Module = Module;
class Section {
    constructor(id) {
        this.id = id;
    }
    write(w) {
        w.varuintN(this.id, 7);
    }
}
exports.Section = Section;
class TypeSection extends Section {
    constructor(entries) {
        super(1);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.TypeSection = TypeSection;
class ImportSection extends Section {
    constructor(entries) {
        super(2);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.ImportSection = ImportSection;
class FunctionSection extends Section {
    constructor(typeIndices) {
        super(3);
        this.typeIndices = typeIndices;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.typeIndices.length, 32);
        for (var i = 0; i < this.typeIndices.length; i++)
            subWriter.varuintN(this.typeIndices[i], 32);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.FunctionSection = FunctionSection;
class TableSection extends Section {
    constructor(entries) {
        super(4);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.TableSection = TableSection;
class MemorySection extends Section {
    constructor(entries) {
        super(5);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.MemorySection = MemorySection;
class GlobalSection extends Section {
    constructor(entries) {
        super(6);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.GlobalSection = GlobalSection;
class ExportSection extends Section {
    constructor(entries) {
        super(7);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.ExportSection = ExportSection;
class StartSection extends Section {
    constructor(index) {
        super(8);
        this.index = index;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.index, 32);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.StartSection = StartSection;
class ElementSection extends Section {
    constructor(entries) {
        super(9);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.ElementSection = ElementSection;
class CodeSection extends Section {
    constructor(bodies) {
        super(10);
        this.bodies = bodies;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.bodies.length, 32);
        for (var i = 0; i < this.bodies.length; i++)
            subWriter.write(this.bodies[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.CodeSection = CodeSection;
class DataSection extends Section {
    constructor(entries) {
        super(11);
        this.entries = entries;
    }
    write(w) {
        super.write(w);
        var subWriter = new io_1.Writer();
        subWriter.varuintN(this.entries.length, 32);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf = subWriter.toTypedArray();
        w.varuintN(buf.length, 32);
        w.bytes(buf);
    }
}
exports.DataSection = DataSection;
class CustomSection extends Section {
    constructor(name) {
        super(0);
        this.name = name;
    }
    write(w) {
        super.write(w);
        var buf = Buffer.from(this.name);
        w.varuintN(buf.byteLength, 32);
        w.bytes(buf);
    }
}
exports.CustomSection = CustomSection;
class NameSection extends CustomSection {
    constructor(entries) {
        super("name");
        this.entries = entries;
    }
    write(w) {
        w.varuintN(this.id, 7);
        var subWriter = new io_1.Writer();
        var buf = Buffer.from(this.name);
        subWriter.varuintN(buf.byteLength, 32);
        subWriter.bytes(buf);
        for (var i = 0; i < this.entries.length; i++)
            subWriter.write(this.entries[i]);
        var buf2 = subWriter.toTypedArray();
        w.varuintN(buf2.length, 32);
        w.bytes(buf2);
    }
}
exports.NameSection = NameSection;
