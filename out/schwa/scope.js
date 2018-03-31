"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Variable {
    constructor(node, scope, id, type) {
        this.node = node;
        this.scope = scope;
        this.id = id;
        this.type = type;
        this.alias = '';
        this.global = false;
        this.const = false;
        this.export = false;
        this.import = '';
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
    clone(node, scope, id) {
        let nvar = new Variable(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.type);
        nvar.alias = this.alias;
        nvar.global = this.global;
        nvar.const = this.const;
        nvar.export = this.export;
        nvar.import = this.import;
        nvar.mapped = this.mapped;
        nvar.offset = this.offset;
        nvar.size = this.size;
        return nvar;
    }
    toString() {
        let out = '';
        if (this.import)
            out += 'from ' + this.import + ' import ';
        if (this.export)
            out += 'export ';
        if (this.const)
            out += 'const ';
        out += this.type + ' ' + this.id;
        if (this.alias)
            out += ' as ' + this.alias;
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
        this.alias = '';
        this.import = '';
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
    clone(node, scope, id) {
        let func = new Function(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.type, this.params.map(v => v.clone()));
        func.alias = this.alias;
        func.import = this.import;
        func.export = this.export;
        return func;
    }
    toString() {
        let out = '';
        if (this.import)
            out += 'from ' + this.import + ' import ';
        if (this.export)
            out += 'export ';
        out += this.type + ' ' + this.id + '(' + this.params.join(', ') + ')';
        if (this.alias)
            out += ' as ' + this.alias;
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
        this.alias = '';
        this.import = '';
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
    clone(node, scope, id) {
        let struct = new Struct(node !== undefined ? node : this.node, scope !== undefined ? scope : this.scope, id !== undefined ? id : this.id, this.fields.map(v => v.clone()));
        struct.alias = this.alias;
        struct.import = this.import;
        struct.export = this.export;
        return struct;
    }
    toString() {
        let out = '';
        if (this.import)
            out += 'from ' + this.import + ' import ';
        if (this.export)
            out += 'export ';
        out += 'struct ' + this.id + '(' + this.fields.join(', ') + ')';
        if (this.alias)
            out += ' as ' + this.alias;
        return out;
    }
}
exports.Struct = Struct;
class Scope {
    constructor(node, parent, id) {
        this.node = node;
        this.parent = parent;
        this.id = id;
        this.alias = '';
        this.import = '';
        this.export = false;
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
    clone(node, parent, id) {
        let scope = new Scope(node !== undefined ? node : this.node, parent !== undefined ? parent : this.parent, id !== undefined ? id : this.id);
        scope.alias = this.alias;
        scope.import = this.import;
        scope.export = this.export;
        return scope;
    }
    toString() {
        return this.print(0, false);
    }
    print(depth, skipLabel) {
        let indent = '\t'.repeat(depth);
        let out = '';
        if (!skipLabel) {
            out += indent;
            if (this.import)
                out += 'import ';
            if (this.export)
                out += 'export ';
            let type = 'scope';
            if (!this.parent)
                type = 'root';
            else if (!this.parent.parent && !this.id)
                type = 'program';
            else if (!this.id)
                type = 'block';
            else if (this.id)
                type = 'scope ' + this.id;
            out += type;
            if (this.alias)
                out += ' as ' + this.alias;
            out += '\n';
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
