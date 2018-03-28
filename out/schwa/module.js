"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Module {
    constructor(name, path, lines) {
        this.name = name;
        this.path = path;
        if (lines)
            this.lines = lines;
        else
            this.lines = fs.readFileSync(path, 'utf8').split(/\r?\n/g);
        this.result = { success: false };
    }
}
exports.Module = Module;
