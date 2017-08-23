
export enum LogType {
	Hint,
	Info,
	Warning,
	Error
}

export class LogMsg {
	constructor(public type: LogType, public ctx: string, public msg: string, public row: number, public column: number, public length: number = 0) { }

	toString() {
		return "[" + this.ctx + "] " + LogType[this.type] + ": " + this.msg + " at " + (this.row + 1) + ":" + (this.column + 1)
	}
}

export class Logger {
	private logs: LogMsg[] = []

	public getLogs(): LogMsg[] {
		return this.logs.slice(0)
	}

	public log(msg: LogMsg) {
		this.logs.push(msg)
	}
}