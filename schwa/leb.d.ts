
declare module "leb" {
	export function decodeInt32(buffer: Buffer, index?: number): { value: number, nextIndex: number }
	export function decodeInt64(buffer: Buffer, index?: number): { value: number, nextIndex: number, lossy: boolean }
	export function decodeIntBuffer(buffer: Buffer, index?: number): { value: Buffer, nextIndex: number }
	export function decodeUInt32(buffer: Buffer, index?: number): { value: number, nextIndex: number }
	export function decodeUInt64(buffer: Buffer, index?: number): { value: number, nextIndex: number, lossy: boolean }
	export function decodeUIntBuffer(buffer: Buffer, index?: number): { value: Buffer, nextIndex: number }
	export function encodeInt32(num: number): Buffer
	export function encodeInt64(num: number): Buffer
	export function encodeIntBuffer(buffer: Buffer): Buffer
	export function encodeUInt32(num: number): Buffer
	export function encodeUInt64(num: number): Buffer
	export function encodeUIntBuffer(buffer: Buffer): Buffer
}
