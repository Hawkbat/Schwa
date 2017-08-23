import { Reader, Writer, Readable, Writable } from "./io"

export enum OpCode {
	unreachable = 0x00,
	nop = 0x01,
	block = 0x02,
	loop = 0x03,
	if = 0x04,
	else = 0x05,

	end = 0x0b,
	br = 0x0c,
	br_if = 0x0d,
	br_table = 0x0e,
	return = 0x0f,
	call = 0x10,
	call_indirect = 0x11,

	drop = 0x1a,
	select = 0x1b,

	get_local = 0x20,
	set_local = 0x21,
	tee_local = 0x22,
	get_global = 0x23,
	set_global = 0x24,

	i32_load = 0x28,
	i64_load = 0x29,
	f32_load = 0x2a,
	f64_load = 0x2b,
	i32_load8_s = 0x2c,
	i32_load8_u = 0x2d,
	i32_load16_s = 0x2e,
	i32_load16_u = 0x2f,
	i64_load8_s = 0x30,
	i64_load8_u = 0x31,
	i64_load16_s = 0x32,
	i64_load16_u = 0x33,
	i64_load32_s = 0x34,
	i64_load32_u = 0x35,
	i32_store = 0x36,
	i64_store = 0x37,
	f32_store = 0x38,
	f64_store = 0x39,
	i32_store8 = 0x3a,
	i32_store16 = 0x3b,
	i64_store8 = 0x3c,
	i64_store16 = 0x3d,
	i64_store32 = 0x3e,
	current_memory = 0x3f,
	grow_memory = 0x40,

	i32_const = 0x41,
	i64_const = 0x42,
	f32_const = 0x43,
	f64_const = 0x44,

	i32_eqz = 0x45,
	i32_eq = 0x46,
	i32_ne = 0x47,
	i32_lt_s = 0x48,
	i32_lt_u = 0x49,
	i32_gt_s = 0x4a,
	i32_gt_u = 0x4b,
	i32_le_s = 0x4c,
	i32_le_u = 0x4d,
	i32_ge_s = 0x4e,
	i32_ge_u = 0x4f,
	i64_eqz = 0x50,
	i64_eq = 0x51,
	i64_ne = 0x52,
	i64_lt_s = 0x53,
	i64_lt_u = 0x54,
	i64_gt_s = 0x55,
	i64_gt_u = 0x56,
	i64_le_s = 0x57,
	i64_le_u = 0x58,
	i64_ge_s = 0x59,
	i64_ge_u = 0x5a,
	f32_eq = 0x5b,
	f32_ne = 0x5c,
	f32_lt = 0x5d,
	f32_gt = 0x5e,
	f32_le = 0x5f,
	f32_ge = 0x60,
	f64_eq = 0x61,
	f64_ne = 0x62,
	f64_lt = 0x63,
	f64_gt = 0x64,
	f64_le = 0x65,
	f64_ge = 0x66,

	i32_clz = 0x67,
	i32_ctz = 0x68,
	i32_popcnt = 0x69,
	i32_add = 0x6a,
	i32_sub = 0x6b,
	i32_mul = 0x6c,
	i32_div_s = 0x6d,
	i32_div_u = 0x6e,
	i32_rem_s = 0x6f,
	i32_rem_u = 0x70,
	i32_and = 0x71,
	i32_or = 0x72,
	i32_xor = 0x73,
	i32_shl = 0x74,
	i32_shr_s = 0x75,
	i32_shr_u = 0x76,
	i32_rotl = 0x77,
	i32_rotr = 0x78,
	i64_clz = 0x79,
	i64_ctz = 0x7a,
	i64_popcnt = 0x7b,
	i64_add = 0x7c,
	i64_sub = 0x7d,
	i64_mul = 0x7e,
	i64_div_s = 0x7f,
	i64_div_u = 0x80,
	i64_rem_s = 0x81,
	i64_rem_u = 0x82,
	i64_and = 0x83,
	i64_or = 0x84,
	i64_xor = 0x85,
	i64_shl = 0x86,
	i64_shr_s = 0x87,
	i64_shr_u = 0x88,
	i64_rotl = 0x89,
	i64_rotr = 0x8a,
	f32_abs = 0x8b,
	f32_neg = 0x8c,
	f32_ceil = 0x8d,
	f32_floor = 0x8e,
	f32_trunc = 0x8f,
	f32_nearest = 0x90,
	f32_sqrt = 0x91,
	f32_add = 0x92,
	f32_sub = 0x93,
	f32_mul = 0x94,
	f32_div = 0x95,
	f32_min = 0x96,
	f32_max = 0x97,
	f32_copysign = 0x98,
	f64_abs = 0x99,
	f64_neg = 0x9a,
	f64_ceil = 0x9b,
	f64_floor = 0x9c,
	f64_trunc = 0x9d,
	f64_nearest = 0x9e,
	f64_sqrt = 0x9f,
	f64_add = 0xa0,
	f64_sub = 0xa1,
	f64_mul = 0xa2,
	f64_div = 0xa3,
	f64_min = 0xa4,
	f64_max = 0xa5,
	f64_copysign = 0xa6,

	i32_wrap_i64 = 0xa7,
	i32_trunc_s_f32 = 0xa8,
	i32_trunc_u_f32 = 0xa9,
	i32_trunc_s_f64 = 0xaa,
	i32_trunc_u_f64 = 0xab,
	i64_extend_s_i32 = 0xac,
	i64_extend_u_i32 = 0xad,
	i64_trunc_s_f32 = 0xae,
	i64_trunc_u_f32 = 0xaf,
	i64_trunc_s_f64 = 0xb0,
	i64_trunc_u_f64 = 0xb1,
	f32_convert_s_i32 = 0xb2,
	f32_convert_u_i32 = 0xb3,
	f32_convert_s_i64 = 0xb4,
	f32_convert_u_i64 = 0xb5,
	f32_demote_f64 = 0xb6,
	f64_convert_s_i32 = 0xb7,
	f64_convert_u_i32 = 0xb8,
	f64_convert_s_i64 = 0xb9,
	f64_convert_u_i64 = 0xba,
	f64_promote_f32 = 0xbb,

	i32_reinterpret_f32 = 0xbc,
	i64_reinterpret_f64 = 0xbd,
	f32_reinterpret_i32 = 0xbe,
	f64_reinterpret_i64 = 0xbf,
}

export enum LangType {
	i32 = 0x7f,
	i64 = 0x7e,
	f32 = 0x7d,
	f64 = 0x7c,
	anyfunc = 0x70,
	func = 0x60,
	void = 0x40,
}

export enum ExternalKind {
	Function = 0,
	Table = 1,
	Memory = 2,
	Global = 3
}

export enum NameType {
	Module = 0,
	Function = 1,
	Local = 2,
}

export class InitializerExpression implements Writable {

	constructor(public code: ArrayLike<number>) { }

	write(w: Writer) {
		w.bytes(this.code)
		w.uint8(OpCode.end)
	}
}

export class FunctionType implements Writable {

	constructor(public paramTypes: LangType[], public returnTypes: LangType[]) { }

	write(w: Writer) {
		w.uint8(LangType.func)
		w.varuintN(this.paramTypes.length, 32)
		for (var i = 0; i < this.paramTypes.length; i++) w.uint8(this.paramTypes[i])
		w.varuintN(this.returnTypes.length, 1)
		for (var i = 0; i < this.returnTypes.length; i++) w.uint8(this.returnTypes[i])
	}
}

export class GlobalType implements Writable {

	constructor(public contentType: LangType, public mutability: boolean) { }

	write(w: Writer) {
		w.uint8(this.contentType)
		w.varuintN(this.mutability ? 1 : 0, 1)
	}
}

export class TableType implements Writable {

	constructor(public elementType: LangType, public limits: ResizableLimits) { }

	write(w: Writer) {
		w.uint8(this.elementType)
		w.write(this.limits)
	}
}

export class MemoryType implements Writable {

	constructor(public limits: ResizableLimits) { }

	write(w: Writer) {
		w.write(this.limits)
	}
}

export class ResizableLimits implements Writable {

	constructor(public initial: number, public maximum?: number) { }

	write(w: Writer) {
		w.varuintN(this.maximum ? 1 : 0, 1)
		w.varuintN(this.initial, 32)
		if (this.maximum) w.varuintN(this.maximum, 32)
	}
}

export class ImportEntry implements Writable {

	constructor(module: string, field: string, kind: ExternalKind.Function, type: number)
	constructor(module: string, field: string, kind: ExternalKind.Table, type: TableType)
	constructor(module: string, field: string, kind: ExternalKind.Memory, type: MemoryType)
	constructor(module: string, field: string, kind: ExternalKind.Global, type: GlobalType)
	constructor(public module: string, public field: string, public kind: ExternalKind, public type: number | TableType | MemoryType | GlobalType) { }

	write(w: Writer) {
		w.utf8(this.module)
		w.utf8(this.field)
		w.uint8(this.kind)

		if (this.kind == ExternalKind.Function) {
			w.varuintN(this.type as number, 32)
		} else if (this.kind == ExternalKind.Table) {
			w.write(this.type as TableType)
		} else if (this.kind == ExternalKind.Memory) {
			w.write(this.type as MemoryType)
		} else if (this.kind == ExternalKind.Global) {
			w.write(this.type as GlobalType)
		}
	}
}

export class GlobalEntry implements Writable {

	constructor(public type: GlobalType, public init: InitializerExpression) { }

	write(w: Writer) {
		w.write(this.type)
		w.write(this.init)
	}
}

export class ExportEntry implements Writable {

	constructor(public field: string, public kind: ExternalKind, public index: number) { }

	write(w: Writer) {
		var buf = Buffer.from(this.field)
		w.varuintN(buf.byteLength, 32)
		w.bytes(buf)

		w.uint8(this.kind)
		w.varuintN(this.index, 32)
	}
}

export class ElementEntry implements Writable {

	constructor(public index: number, public offset: InitializerExpression, public elems: number[]) { }

	write(w: Writer) {
		w.varuintN(this.index, 32)
		w.write(this.offset)
		w.varuintN(this.elems.length, 32)
		for (var i = 0; i < this.elems.length; i++) w.varuintN(this.elems[i], 32)
	}
}

export class LocalEntry implements Writable {

	constructor(public count: number, public type: LangType) { }

	write(w: Writer) {
		w.varuintN(this.count, 32)
		w.uint8(this.type)
	}
}

export class FunctionBody implements Writable {

	constructor(public locals: LocalEntry[], public code: ArrayLike<number>) { }

	write(w: Writer) {
		var subWriter = new Writer()
		subWriter.varuintN(this.locals.length, 32)
		for (var i = 0; i < this.locals.length; i++) subWriter.write(this.locals[i])
		subWriter.bytes(this.code)
		subWriter.uint8(OpCode.end)

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.byteLength, 32)
		w.bytes(buf)
	}
}

export class DataEntry implements Writable {

	constructor(public index: number, public offset: InitializerExpression, public data: number[]) { }

	write(w: Writer) {
		w.varuintN(this.index, 32)
		w.write(this.offset)
		w.varuintN(this.data.length, 32)
		w.bytes(this.data)
	}
}

export class NameEntry implements Writable {

	constructor(nameType: NameType.Module, payload: string)
	constructor(nameType: NameType.Function, payload: NameMap)
	constructor(nameType: NameType.Local, payload: LocalNames)
	constructor(public nameType: NameType, public payload: NameMap | LocalNames | string) { }

	write(w: Writer) {
		w.uint8(this.nameType)

		var subWriter = new Writer()
		if (typeof this.payload == "string") {
			subWriter.utf8(this.payload)
		} else {
			subWriter.write(this.payload)
		}

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.byteLength, 32)
		w.bytes(buf)
	}
}

export class Naming implements Writable {

	constructor(public index: number, public name: string) { }

	write(w: Writer) {
		w.varuintN(this.index, 32)
		w.utf8(this.name)
	}
}

export class NameMap implements Writable {

	constructor(public names: Naming[]) { }

	write(w: Writer) {
		w.varuintN(this.names.length, 32)
		for (var i = 0; i < this.names.length; i++) w.write(this.names[i])
	}
}

export class LocalName implements Writable {

	constructor(public index: number, public localMap: NameMap) { }

	write(w: Writer) {
		w.varuintN(this.index, 32)
		w.write(this.localMap)
	}
}

export class LocalNames implements Writable {

	constructor(public funcs: LocalName[]) { }

	write(w: Writer) {
		w.varuintN(this.funcs.length, 32)
		for (var i = 0; i < this.funcs.length; i++) w.write(this.funcs[i])
	}
}

export class Module implements Writable {

	constructor(public sections: Section[]) { }

	write(w: Writer): void {
		w.uint32(0x6d736100) // Magic number
		w.uint32(0x1) // Version
		for (var i = 0; i < this.sections.length; i++) w.write(this.sections[i])
	}
}

export abstract class Section implements Writable {

	constructor(public readonly id: number) { }

	write(w: Writer): void {
		w.varuintN(this.id, 7)
	}
}

export class TypeSection extends Section {

	constructor(public entries: FunctionType[]) { super(1) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class ImportSection extends Section {

	constructor(public entries: ImportEntry[]) { super(2) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class FunctionSection extends Section {

	constructor(public typeIndices: number[]) { super(3) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.typeIndices.length, 32)
		for (var i = 0; i < this.typeIndices.length; i++) subWriter.varuintN(this.typeIndices[i], 32)

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class TableSection extends Section {

	constructor(public entries: TableType[]) { super(4) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class MemorySection extends Section {

	constructor(public entries: MemoryType[]) { super(5) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class GlobalSection extends Section {

	constructor(public entries: GlobalEntry[]) { super(6) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class ExportSection extends Section {

	constructor(public entries: ExportEntry[]) { super(7) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class StartSection extends Section {

	constructor(public index: number) { super(8) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.index, 32)

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class ElementSection extends Section {

	constructor(public entries: ElementEntry[]) { super(9) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class CodeSection extends Section {

	constructor(public bodies: FunctionBody[]) { super(10) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.bodies.length, 32)
		for (var i = 0; i < this.bodies.length; i++) subWriter.write(this.bodies[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class DataSection extends Section {

	constructor(public entries: DataEntry[]) { super(11) }

	write(w: Writer): void {
		super.write(w)

		var subWriter = new Writer()
		subWriter.varuintN(this.entries.length, 32)
		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf = subWriter.toTypedArray()
		w.varuintN(buf.length, 32)
		w.bytes(buf)
	}
}

export class CustomSection extends Section {

	constructor(public name: string) { super(0) }

	write(w: Writer): void {
		super.write(w)

		var buf = Buffer.from(this.name)
		w.varuintN(buf.byteLength, 32)
		w.bytes(buf)
	}
}

export class NameSection extends CustomSection {

	constructor(public entries: NameEntry[]) { super("name") }

	write(w: Writer): void {
		w.varuintN(this.id, 7)

		var subWriter = new Writer()

		var buf = Buffer.from(this.name)
		subWriter.varuintN(buf.byteLength, 32)
		subWriter.bytes(buf)

		for (var i = 0; i < this.entries.length; i++) subWriter.write(this.entries[i])

		var buf2 = subWriter.toTypedArray()
		w.varuintN(buf2.length, 32)
		w.bytes(buf2)
	}
}