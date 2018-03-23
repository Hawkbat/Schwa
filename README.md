# Schwa
[![npm version](https://badge.fury.io/js/schwa.svg)](https://badge.fury.io/js/schwa)
<img src="./docs/Schwa.png" width="128" align="right">

A toolchain written in Node for a toy language with a C-like syntax that compiles to WebAssembly.

## Installation

```bat
npm install schwa --save
```

## Usage
### Module
```typescript
// TypeScript and JavaScript ES6+
import { Compiler } from "schwa"
let compiler = new Compiler()
compiler.compile(inputLineArray, wasmModuleName)

// JavaScript ES5 and older
var Compiler = require('schwa').Compiler
var compiler = new Compiler()
compiler.compile(inputLineArray, wasmModuleName)
```

### Command Line
```bat
schwa --help
```

## Features
* Strong Static Typing
* Minimal C-Like Syntax
* Opinionated Auto-Formatter
* WASM Binary Output
* Near Feature Parity with WebAssembly
* Separate Type-Checked Signed/Unsigned and Boolean Types
* Simplified Memory Access Via Memory-Mapped Structs and Arrays
* Modular Node API
* TypeScript Type Definitions
* Command Line Compiler

## Planned
* VSCode Language Plugin
* JavaScript Wrapper Generator
* JS and Schwa Imports/Exports
* Project-Aware Compilation
* Formal Language Specification

## Examples

### Fibonacci
```
export int fibonacci(int n)
    if n <= 1
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)
```
### Syntax Sample
```
int y = 1333 // Set up y

int hexExample = -0x80000000
uint octalExample = 0o371u
float binaryExample = 0b111.111f

export const int SOME_CONST = 5

void main()
    DoSomething(true, 23uL)

export void DoSomething(bool alphabet, ulong soup)
    int z = 10 / SOME_CONST / 1f as int
    // Initialize x
    int x = (50.0f + -20f + 2f * float.floor(20.5f)) to int |> SOME_CONST
    y = -y
    if x == 70 & SOME_CONST //Check logic
        x = ((20f + 10uL to float) * float.ceil(20.25f)) to int
        if !alphabet && x == 20
            nop()
        else if y == 70 && x > 0
            while y > 0
                y = y - 15
                if y < 0
                    break
                else
                    continue
                bool foo = true
            DoSomething(!alphabet, soup)
        else
            nop() //Null operation
        return

export int add(int a, int b)
    return a + b

export int inc()
    int val = add(int.load(0u), 1)
    int.store(0u, val)
    return val

// Accessing this struct's properties will emit loads/stores starting at address 64
map Object object at 64

export float getLength(Vector v)
    return float.sqrt(v.x * v.x + v.y * v.y)

export void normalize()
    float len = getLength(object.position)
    float x = object.position.x / len
    float y = object.position.y / len
    object.position.x = x
    object.position.y = y

export void resetColor(int i)
    object.colors[i].r = 0
    object.colors[i].g = 0
    object.colors[i].b = 0
    object.colors[i].a = 255


struct Vector
    float x // The horizontal coordinate
    float y // The vertical coordinate

struct Color
    int r
    int g
    int b
    int a

struct Object
    Vector position
    Color colors[4]
```

## Usage and Contribution
1. Clone the repository (`git clone https://github.com/Hawkbat/Schwa`)
2. Install dependencies (`npm install`)
3. Install TypeScript compiler (`npm install -g typescript`)
4. Edit source code as desired
5. Compile TypeScript source (`tsc`)
6. Commit changes (`git commit`)
7. Submit upstream pull request

## License
MIT
