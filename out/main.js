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
    .arguments('[path]')
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
    srcPath = path.relative(process.cwd(), path.resolve(program.args[0]));
    if (!srcPath)
        srcPath = './';
    if (fs.lstatSync(srcPath).isDirectory()) {
        dstPath = srcPath;
    }
    else {
        let filename = path.basename(srcPath, path.extname(srcPath));
        let dirpath = path.dirname(srcPath);
        dstPath = path.join(dirpath, filename + '.wasm');
    }
}
else if (program.args.length == 2) {
    srcPath = path.relative(process.cwd(), path.resolve(program.args[0]));
    dstPath = path.relative(process.cwd(), path.resolve(program.args[1]));
    if (!srcPath)
        srcPath = './';
    if (!dstPath)
        dstPath = './';
}
if (srcPath && dstPath) {
    run(srcPath, dstPath, program.debug);
}
else {
    program.help();
}
function run(srcPath, dstPath, debug) {
    let compiler = new schwa_1.Compiler({ debug });
    if (fs.lstatSync(srcPath).isDirectory()) {
        let filenames = fs.readdirSync(srcPath).filter(f => f.endsWith('.schwa')).map(f => path.basename(f, path.extname(f)));
        let mods = filenames.map(f => new schwa_1.Module(f, srcPath));
        if (mods.length == 0) {
            console.log('No source files found in "' + path.resolve(srcPath) + '".');
            process.exitCode = 1;
            return;
        }
        for (let mod of mods) {
            console.log('Compiling ' + path.join(mod.dir, mod.name));
        }
        mods = compiler.compile(mods);
        for (let mod of mods) {
            if (mod.result.success) {
                fs.writeFileSync(path.join(dstPath, mod.name) + '.wasm', Buffer.from(mod.result.buffer));
            }
        }
        if (mods.some(mod => !mod.result.success)) {
            let msgs = compiler.logger.getLogs();
            for (let msg of msgs)
                console.log(msg.toString());
            console.log("Compilation failed.");
            process.exitCode = 1;
        }
        else {
            console.log("Compilation successful.");
        }
    }
    else {
        let filename = path.basename(srcPath, path.extname(srcPath));
        let mod = new schwa_1.Module(filename, path.dirname(srcPath));
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
}
