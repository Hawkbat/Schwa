"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Variable {
    constructor(node, scope, id, type) {
        this.node = node;
        this.scope = scope;
        this.id = id;
        this.type = type;
        this.global = false;
        this.const = false;
        this.export = false;
        this.import = false;
        this.mapped = false;
        this.offset = 0;
        this.size = 0;
    }
    getPath(untilNode = false) {
        let path = this.id;
        if (untilNode && this.node)
            return path;
        let p = this.scope;
        while (p) {
            if (p.id)
                path = p.id + "." + path;
            if (untilNode && p.node)
                break;
            p = p.parent;
        }
        return path;
    }
    toString() {
        let out = '';
        if (this.import)
            out += 'import ';
        if (this.export)
            out += 'export ';
        if (this.const)
            out += 'const ';
        out += this.type + ' ' + this.id;
        if (this.mapped)
            out += ' mapped at ' + this.offset;
        return out;
    }
}
exports.Variable = Variable;
class Function {
    constructor(node, scope, id, type, params) {
        this.node = node;
        this.scope = scope;
        this.id = id;
        this.type = type;
        this.params = params;
        this.import = false;
        this.export = false;
    }
    getPath() {
        let path = this.id;
        let p = this.scope;
        while (p) {
            if (p.id)
                path = p.id + "." + path;
            p = p.parent;
        }
        return path;
    }
    toString() {
        let out = '';
        if (this.export)
            out += 'export ';
        out += this.type + ' ' + this.id + '(' + this.params.join(', ') + ')';
        return out;
    }
}
exports.Function = Function;
class Struct {
    constructor(node, scope, id, fields) {
        this.node = node;
        this.scope = scope;
        this.id = id;
        this.fields = fields;
        this.import = false;
        this.export = false;
    }
    getPath() {
        let path = this.id;
        let p = this.scope;
        while (p) {
            if (p.id)
                path = p.id + "." + path;
            p = p.parent;
        }
        return path;
    }
    toString() {
        let out = '';
        if (this.export)
            out += 'export ';
        out += 'struct ' + this.id + '(' + this.fields.join(', ') + ')';
        return out;
    }
}
exports.Struct = Struct;
class Scope {
    constructor(node, parent, id) {
        this.node = node;
        this.parent = parent;
        this.id = id;
        this.scopes = {};
        this.vars = {};
        this.funcs = {};
        this.structs = {};
    }
    getScope(id) {
        if (this.scopes[id])
            return this.scopes[id];
        if (this.parent)
            return this.parent.getScope(id);
        return null;
    }
    getVariable(id) {
        if (this.vars[id])
            return this.vars[id];
        if (this.parent)
            return this.parent.getVariable(id);
        return null;
    }
    getFunction(id) {
        if (this.funcs[id])
            return this.funcs[id];
        if (this.parent)
            return this.parent.getFunction(id);
        return null;
    }
    getStruct(id) {
        if (this.structs[id])
            return this.structs[id];
        if (this.parent)
            return this.parent.getStruct(id);
        return null;
    }
    getPath() {
        let path = this.id;
        let p = this.parent;
        while (p) {
            if (p.id)
                path = p.id + "." + path;
            p = p.parent;
        }
        return path;
    }
    toString() {
        return this.print(0, false);
    }
    print(depth, skipLabel) {
        let indent = '\t'.repeat(depth);
        let out = '';
        if (!skipLabel) {
            let type = 'scope';
            if (!this.parent)
                type = 'root';
            else if (!this.parent.parent && !this.id)
                type = 'program';
            else if (!this.id)
                type = 'block';
            else if (this.id)
                type = 'scope ' + this.id;
            out += indent + type + '\n';
        }
        for (let key in this.vars) {
            out += indent + '\t' + this.vars[key] + '\n';
            if (this.scopes[key])
                out += this.scopes[key].print(depth + 1, true);
        }
        for (let key in this.funcs) {
            out += indent + '\t' + this.funcs[key] + '\n';
            if (this.scopes[key])
                out += this.scopes[key].print(depth + 1, true);
        }
        for (let key in this.structs) {
            out += indent + '\t' + this.structs[key] + '\n';
            if (this.scopes[key])
                out += this.scopes[key].print(depth + 1, true);
        }
        for (let key in this.scopes) {
            if (!this.vars[key] && !this.funcs[key] && !this.structs[key])
                out += this.scopes[key].print(depth + 1, false);
        }
        return out;
    }
}
exports.Scope = Scope;
