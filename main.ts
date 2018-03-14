#!/usr/bin/env node
import { Compiler, Lexer, Parser, Validator, Analyzer, Formatter, Generator, Logger, LogType } from "./schwa"
import * as fs from "fs"
import * as path from "path"
import { AstNode } from "./schwa/ast"
import * as program from "commander"

import * as Long from "long"

let pak = require('../package.json')

program
	.name(pak.name)
	.version(pak.version, '-v, --version')
	.arguments('[src] [dst]')
	.option('-d, --debug', 'Output debug info')
	.option('-t, --test', 'Use example source file')
	.parse(process.argv)

let srcPath = ''
let dstPath = ''

if (program.test) {
	srcPath = path.join(__dirname, "test.schwa")
	dstPath = path.join(__dirname, "test.wasm")
} else if (program.args.length == 1) {
	srcPath = program.args[0]
	let filename = path.basename(srcPath, path.extname(srcPath))
	let dirpath = path.dirname(srcPath)
	dstPath = path.join(dirpath, filename + '.wasm')
} else if (program.args.length == 2) {
	srcPath = program.args[0]
	dstPath = program.args[1]
}

if (srcPath && dstPath) {
	if (program.debug)
		debug(srcPath, dstPath)
	else
		run(srcPath, dstPath)
} else {
	program.help()
}

function run(srcPath: string, dstPath: string) {
	let lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/g)
	let filename = path.basename(dstPath, path.extname(dstPath))

	let compiler = new Compiler()
	let result = compiler.compile(lines, filename)

	if (result.success) {
		fs.writeFileSync(dstPath, Buffer.from(result.buffer as ArrayBuffer))
		console.log("Compilation successful.")
	} else {
		let msgs = compiler.logger.getLogs()
		for (let msg of msgs) console.log(msg.toString())
		console.log("Compilation failed.")
		process.exitCode = 1
	}
}

function debug(srcPath: string, dstPath: string) {
	let lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/g)
	let filename = path.basename(dstPath, path.extname(dstPath))

	console.time("setup")
	let logger = new Logger()
	let lexer = new Lexer(logger)
	let parser = new Parser(logger)
	let validator = new Validator(logger)
	let analyzer = new Analyzer(logger)
	let formatter = new Formatter(logger)
	let generator = new Generator(logger)

	let ast: AstNode | null = null
	let prettyPrint: string = ''
	let wasmBuffer: ArrayBuffer | null = null
	console.timeEnd("setup")

	console.time("process")

		; (() => {

			// Converts raw text input into an array of tokens
			console.time("lexer")
			let tokens = lexer.lex(lines)
			console.timeEnd("lexer")

			if (logger.count(LogType.Error)) return

			// Converts an array of tokens into a syntax tree
			console.time("parser")
			ast = parser.parse(tokens)
			console.timeEnd("parser")

			if (!ast || logger.count(LogType.Error)) return

			// Analyzes a syntax tree for syntactic correctness
			console.time("validator")
			validator.validate(ast)
			console.timeEnd("validator")

			// Analyzes a syntax tree for semantic correctness
			console.time("analyzer")
			analyzer.analyze(ast)
			console.timeEnd("analyzer")

			if (logger.count(LogType.Error)) return

			// Pretty-prints a formatted version of the syntax tree
			console.time("formatter")
			prettyPrint = formatter.format(ast)
			console.timeEnd("formatter")

			if (logger.count(LogType.Error)) return

			// Generates WebAssembly bytecode from the syntax tree
			console.time("generator")
			wasmBuffer = generator.generate(ast, filename)
			console.timeEnd("generator")
		})()

	console.timeEnd("process")

	console.time("output")
	if (ast) console.log(ast.toString().replace(/\t/g, '\ \ \ \ '))

	if (ast && ast.scope && ast.scope.parent) console.log(ast.scope.parent.toString().replace(/\t/g, '\ \ \ \ '))

	if (prettyPrint) console.log(prettyPrint.replace(/\t/g, '\ \ \ \ '))

	if (wasmBuffer) fs.writeFileSync(dstPath, Buffer.from(wasmBuffer))

	for (let log of logger.getLogs()) console.log(log.toString())
	console.timeEnd("output")

	if (logger.count(LogType.Error))
		console.log("Compilation failed.")
	else
		console.log("Compilation successful.")
}
