declare namespace noise {
    export function seed(seed: number): void;
    
    export function simplex2(x: number, y: number): number;
    export function simplex3(x: number, y: number, z: number): number;
    
    export function perlin2(x: number, y: number): number;
    export function perlin3(x: number, y: number, z: number): number;
}

declare module 'noisejs' {
    export = noise;
}