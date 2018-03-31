import { AstNode } from './ast';
import { Module } from './compiler';
export declare function getIdentifier(n: AstNode | null | undefined): AstNode | null | undefined;
export declare function getModulePath(mod: Module | null | undefined): string;
