import { AstNode, AstType } from './ast'

export function getIdentifier(n: AstNode | null | undefined): AstNode | null | undefined {
	if (!n) return null
	let l = n.children[0]
	if (l) {
		if (n.type == AstType.VariableId) return getIdentifier(l)
		if (n.type == AstType.FunctionId) return getIdentifier(l)
		if (n.type == AstType.StructId) return getIdentifier(l)
		if (n.type == AstType.ModuleId) return getIdentifier(l)
		if (n.type == AstType.VariableImport) return getIdentifier(l)
		if (n.type == AstType.FunctionImport) return getIdentifier(l)
		if (n.type == AstType.StructImport) return getIdentifier(l)
		if (n.type == AstType.UnknownImport) return getIdentifier(l)
		if (n.type == AstType.Import) return getIdentifier(l)
		if (n.type == AstType.Map) return getIdentifier(l)
		if (n.type == AstType.VariableDef) return getIdentifier(l)
		if (n.type == AstType.FunctionDef) return getIdentifier(l)
		if (n.type == AstType.StructDef) return getIdentifier(l)
		if (n.type == AstType.FunctionCall) return getIdentifier(l)
		if (n.type == AstType.Assignment) return getIdentifier(l)
		if (n.type == AstType.Global) return getIdentifier(l)
		if (n.type == AstType.Indexer) return getIdentifier(l)
	}
	let r = n.children[1]
	if (r) {
		if (n.type == AstType.Access) return getIdentifier(r)
	}
	if (n.type == AstType.FunctionId ||
		n.type == AstType.VariableId ||
		n.type == AstType.StructId ||
		n.type == AstType.UnknownImport ||
		n.type == AstType.Alias) return n
	return null
}