import { Lexer, Parser, Validator, Analyzer, Formatter, Generator, Logger } from "./wascript"
import * as fs from "fs"

let lines = fs.readFileSync("test.was", "utf8").split(/\r?\n/g)

console.time("process")

// Collects errors from the other components
let logger = new Logger()

// Converts raw text input into an array of tokens
console.time("lexer")
var lexer = new Lexer(logger, lines)
let tokens = lexer.lex()
console.timeEnd("lexer")

// Converts an array of tokens into a syntax tree
console.time("parser")
var parser = new Parser(logger, tokens)
var ast = parser.parse()
console.timeEnd("parser")

// Analyzes a syntax tree for syntactic correctness
console.time("validator")
var validator = new Validator(logger, ast)
validator.validate()
console.timeEnd("validator")

// Analyzes a syntax tree for semantic correctness
console.time("analyzer")
var analyzer = new Analyzer(logger, ast)
analyzer.analyze()
console.timeEnd("analyzer")

// Pretty-prints a formatted version of the syntax tree
console.time("formatter")
var formatter = new Formatter(logger, ast)
let prettyPrint = formatter.print()
console.timeEnd("formatter")

// Generates WebAssembly bytecode from the syntax tree
console.time("generator")
var generator = new Generator(logger, ast)
let wasmBuffer = generator.generate("test")
console.timeEnd("generator")

console.timeEnd("process")

for (let log of logger.getLogs()) console.log(log.toString())

console.log(ast.toString().replace(/\t/g, '\ \ \ \ '))

console.log(prettyPrint.replace(/\t/g, '\ \ \ \ '))

fs.writeFile('test.wasm', Buffer.from(wasmBuffer), (err) => {
	if (err) throw err
	console.log("Wrote WASM file")
})
