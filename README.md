# WAScript
A toolchain written in NodeJS for a toy language with a C-like syntax that closely maps and compiles to WebAssembly.

## Features
* Modular Node API
* Strong Static Typing
* Clean Syntax
* Auto-Formatter
* Outputs WASM Binaries
* Near Feature Parity with WebAssembly
* Separate Type-Checked Signed/Unsigned and Boolean Types

## Planned
* VSCode Syntax Highlighting
* VSCode Language Plugin
* Command-line API and NPM Package
* JavaScript Wrapper Generator
* Arrays and Structs
* Simplified Memory Access

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

export const int SOME_CONST = 5

void main()
    DoSomething(true, 23ul)

export void DoSomething(bool alphabet, ulong soup)
    int z = 10 / SOME_CONST / 1f as int
    // Initialize x
    int x = (50.0f + -20f + 2f * float.floor(20.5f)) to int |> SOME_CONST
    y = -y
    if x == 70 & SOME_CONST // Check logic
        x = ((20f + 10ul to float) * float.ceil(20.25f)) to int
        if !alphabet && x == 20
            nop()
        else if y == 70
            while y > 0
                y = y - 15
                if y < 0
                    break
                else
                    continue
                bool foo = true
            DoSomething(!alphabet, soup)
        else
            nop() // Null operation
        return

export int add(int a, int b)
    return a + b
```

## Usage and Contribution
1. Clone the repository (`git clone https://github.com/Hawkbat/WAScript`)
2. Install dependencies (`npm install`)
3. Install TypeScript compiler (`npm install -g typescript`)
4. Compile TypeScript source (`tsc`)
5. Run `main.js` (`node out/main.js`)
6. Modify `test.was` as desired

## License
MIT
