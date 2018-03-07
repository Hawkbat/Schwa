import { Lexer, Parser, Validator, Analyzer, Formatter, Generator, Logger, LogType } from "./wascript"
import * as fs from "fs"
import * as path from "path"
import { AstNode } from "./wascript/ast"

function test() {
	let lines = fs.readFileSync("test.was", "utf8").split(/\r?\n/g)

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

	;(() => {

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

		if (logger.count(LogType.Error)) return

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
		wasmBuffer = generator.generate(ast, "test")
		console.timeEnd("generator")

		if (logger.count(LogType.Error)) return
	})()

	console.timeEnd("process")

	console.time("output")
	if (ast) console.log(ast.toString().replace(/\t/g, '\ \ \ \ '))

	if (ast && ast.scope && ast.scope.parent) console.log(ast.scope.parent.toString().replace(/\t/g, '\ \ \ \ '))

	if (prettyPrint) console.log(prettyPrint.replace(/\t/g, '\ \ \ \ '))

	if (wasmBuffer) {
		fs.writeFile('test.wasm', Buffer.from(wasmBuffer), (err) => {
			if (err) throw err
			console.log("Wrote WASM file")
		})
	}

	for (let log of logger.getLogs()) console.log(log.toString())
	console.timeEnd("output")
}

test()