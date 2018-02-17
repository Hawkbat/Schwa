export declare enum LogType {
    Hint = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
}
export declare class LogMsg {
    type: LogType;
    ctx: string;
    msg: string;
    row: number;
    column: number;
    length: number;
    constructor(type: LogType, ctx: string, msg: string, row: number, column: number, length?: number);
    toString(): string;
}
export declare class Logger {
    private logs;
    getLogs(): LogMsg[];
    clear(): void;
    count(type: LogType): number;
    log(msg: LogMsg): void;
}
