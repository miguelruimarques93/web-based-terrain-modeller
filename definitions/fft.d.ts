declare namespace FFT {
    export function init(n: number): void;
    
    export function fft1d(real: Array<number>, imag: Array<number>): void;
    export function ifft1d(real: Array<number>, imag: Array<number>): void;
    
    export function fft2d(real: Array<number>, imag: Array<number>): void;
    export function ifft2d(real: Array<number>, imag: Array<number>): void;
    
    export function fft(real: Array<number>, imag: Array<number>): void;
    export function ifft(real: Array<number>, imag: Array<number>): void;
}

declare namespace FrequencyFilter {
    export function init(n: number): void;
    
    export function swap(real: Array<number>, image: Array<number>): void;
    export function HPF(real: Array<number>, image: Array<number>, radius: number): void;
    export function LPF(real: Array<number>, image: Array<number>, radius: number): void;
    export function BPF(real: Array<number>, image: Array<number>, radius: number, bandwidth: number): void;
    export function windowing(data: Array<number>, inverse: number): void;
}

declare module 'FFT' {
    export = { FFT, FrequencyFilter };
}