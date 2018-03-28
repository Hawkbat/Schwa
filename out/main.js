#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schwa_1 = require("./schwa");
const fs = require("fs");
const path = require("path");
const program = require("commander");
let pak = require('../package.json');
program
    .name(pak.name)
    .version(pak.version, '-v, --version')
    .arguments('[src] [dst]')
    .option('-d, --debug', 'Output debug info')
    .option('-t, --test', 'Use example source file')
    .parse(process.argv);
let srcPath = '';
let dstPath = '';
if (program.test) {
    srcPath = path.join(__dirname, "test.schwa");
    dstPath = path.join(__dirname, "test.wasm");
}
else if (program.args.length == 1) {
    srcPath = program.args[0];
    let filename = path.basename(srcPath, path.extname(srcPath));
    let dirpath = path.dirname(srcPath);
    dstPath = path.join(dirpath, filename + '.wasm');
}
else if (program.args.length == 2) {
    srcPath = program.args[0];
    dstPath = program.args[1];
}
if (srcPath && dstPath) {
    run(srcPath, dstPath, program.debug);
}
else {
    program.help();
}
function run(srcPath, dstPath, debug) {
    let lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/g);
    let filename = path.basename(dstPath, path.extname(dstPath));
    let mod = new schwa_1.Module(filename, path.dirname(srcPath), lines);
    let compiler = new schwa_1.Compiler({ debug });
    let result = compiler.compile(mod).result;
    if (result.success) {
        fs.writeFileSync(dstPath, Buffer.from(result.buffer));
        console.log("Compilation successful.");
    }
    else {
        let msgs = compiler.logger.getLogs();
        for (let msg of msgs)
            console.log(msg.toString());
        console.log("Compilation failed.");
        process.exitCode = 1;
    }
}
