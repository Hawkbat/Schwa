import { Module } from './compiler'
import * as path from 'path'

export enum LogType {
	Hint,
	Info,
	Warning,
	Error
}

export class LogMsg {
	constructor(public type: LogType, public ctx: string, public msg: string, public mod: Module | undefined, public row: number, public column: number, public length: number = 0) { }

	toString() {
		return '[' + this.ctx + '] ' + LogType[this.type] + ': ' + this.msg + (this.mod ? ' at ' + path.join(this.mod.dir, this.mod.name + '.schwa') : '') + '(' + (this.row + 1) + ',' + (this.column + 1)/* + (this.length > 0 ? '-' + (this.column + 1 + this.length) : '')*/ + ')'
	}
}

export class Logger {
	private logs: LogMsg[] = []

	public get(mod: Module): LogMsg[] {
		return this.logs.filter(v => v.mod == mod)
	}

	public getAll(): LogMsg[] {
		return this.logs.slice(0)
	}

	public clear() {
		this.logs.length = 0
	}

	public count(mod: Module, type: LogType) {
		return this.logs.filter(v => v.mod == mod && v.type == type).length
	}

	public countAll(type: LogType) {
		return this.logs.filter(v => v.type == type).length
	}

	public log(msg: LogMsg) {
		this.logs.push(msg)
	}
}