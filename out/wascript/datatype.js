"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
var DataType;
(function (DataType) {
    DataType["None"] = "void";
    DataType["Invalid"] = "invalid";
    DataType["Type"] = "type";
    DataType["Int"] = "int";
    DataType["UInt"] = "uint";
    DataType["Long"] = "long";
    DataType["ULong"] = "ulong";
    DataType["Float"] = "float";
    DataType["Double"] = "double";
    DataType["Bool"] = "bool";
})(DataType = exports.DataType || (exports.DataType = {}));
(function (DataType) {
    function fromTokenType(type) {
        if (type == token_1.TokenType.Int)
            return DataType.Int;
        if (type == token_1.TokenType.UInt)
            return DataType.UInt;
        if (type == token_1.TokenType.Long)
            return DataType.Long;
        if (type == token_1.TokenType.ULong)
            return DataType.ULong;
        if (type == token_1.TokenType.Float)
            return DataType.Float;
        if (type == token_1.TokenType.Double)
            return DataType.Double;
        if (type == token_1.TokenType.Bool)
            return DataType.Bool;
        return DataType.Invalid;
    }
    DataType.fromTokenType = fromTokenType;
    function isPrimitive(type) {
        if (type == DataType.None)
            return true;
        if (type == DataType.Invalid)
            return true;
        if (type == DataType.Type)
            return true;
        if (type == DataType.Int)
            return true;
        if (type == DataType.UInt)
            return true;
        if (type == DataType.Long)
            return true;
        if (type == DataType.ULong)
            return true;
        if (type == DataType.Float)
            return true;
        if (type == DataType.Double)
            return true;
        if (type == DataType.Bool)
            return true;
        return false;
    }
    DataType.isPrimitive = isPrimitive;
})(DataType = exports.DataType || (exports.DataType = {}));
