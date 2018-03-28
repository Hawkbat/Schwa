
export enum LogType {
	Hint,
	Info,
	Warning,
	Error
}

export class LogMsg {
	constructor(public type: LogType, public ctx: string, public msg: string, public path: string, public row: number, public column: number, public length: number = 0) { }

	toString() {
		return "[" + this.ctx + "] " + LogType[this.type] + ": " + this.msg + " at " + this.path + "(" + (this.row + 1) + "," + (this.column + 1) + (this.length > 0 ? "-" + (this.column + 1 + this.length) : "") + ")"
	}
}

export class Logger {
	private logs: LogMsg[] = []

	public getLogs(): LogMsg[] {
		return this.logs.slice(0)
	}

	public clear() {
		this.logs.length = 0
	}

	public count(type: LogType) {
		let cnt = 0
		for (let log of this.logs) {
			if (log.type == type) cnt++
		}
		return cnt
	}

	public log(msg: LogMsg) {
		this.logs.push(msg)
	}
}