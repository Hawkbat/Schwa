"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogType;
(function (LogType) {
    LogType[LogType["Hint"] = 0] = "Hint";
    LogType[LogType["Info"] = 1] = "Info";
    LogType[LogType["Warning"] = 2] = "Warning";
    LogType[LogType["Error"] = 3] = "Error";
})(LogType = exports.LogType || (exports.LogType = {}));
class LogMsg {
    constructor(type, ctx, msg, row, column, length = 0) {
        this.type = type;
        this.ctx = ctx;
        this.msg = msg;
        this.row = row;
        this.column = column;
        this.length = length;
    }
    toString() {
        return "[" + this.ctx + "] " + LogType[this.type] + ": " + this.msg + " at " + (this.row + 1) + ":" + (this.column + 1) + (this.length > 0 ? "-" + (this.column + 1 + this.length) : "");
    }
}
exports.LogMsg = LogMsg;
class Logger {
    constructor() {
        this.logs = [];
    }
    getLogs() {
        return this.logs.slice(0);
    }
    clear() {
        this.logs.length = 0;
    }
    count(type) {
        let cnt = 0;
        for (let log of this.logs) {
            if (log.type == type)
                cnt++;
        }
        return cnt;
    }
    log(msg) {
        this.logs.push(msg);
    }
}
exports.Logger = Logger;
