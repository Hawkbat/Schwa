import { TokenType } from "./token"

export enum DataType {
	None,
	Invalid,
	Type,
	Int,
	UInt,
	Long,
	ULong,
	Float,
	Double,
	Bool
}

export namespace DataType {
	export function fromTokenType(type: TokenType): DataType {
		if (type == TokenType.Int) return DataType.Int
		if (type == TokenType.UInt) return DataType.UInt
		if (type == TokenType.Long) return DataType.Long
		if (type == TokenType.ULong) return DataType.ULong
		if (type == TokenType.Float) return DataType.Float
		if (type == TokenType.Double) return DataType.Double
		if (type == TokenType.Bool) return DataType.Bool
		return DataType.Invalid
	}

	export function fromString(type: string): DataType {
		if (type == "int") return DataType.Int
		if (type == "uint") return DataType.UInt
		if (type == "long") return DataType.Long
		if (type == "ulong") return DataType.ULong
		if (type == "float") return DataType.Float
		if (type == "double") return DataType.Double
		if (type == "bool") return DataType.Bool
		if (type == "void") return DataType.None
		return DataType.Invalid
	}
}