declare namespace jsfeat {
    export const REVISION: string;
    
    export const EPSILON: number;
    export const FLT_MIN: number;
    
    export enum DataType { }
    export const U8_t: DataType;
    export const S32_t: DataType;
    export const F32_t: DataType;
    export const S64_t: DataType;
    export const F64_t: DataType;
    
    export const C1_t: DataType;
    export const C2_t: DataType;
    export const C3_t: DataType;
    export const C4_t: DataType;
    
    export const U8C1_t: DataType;
    export const U8C3_t: DataType;
    export const U8C4_t: DataType;
    export const F32C1_t: DataType;
    export const F32C2_t: DataType;
    export const S32C1_t: DataType;
    export const S32C2_t: DataType;
    
    
    
    export function get_data_type(type:DataType): DataType;
    export function get_channel(type:DataType): DataType;
    export function get_data_type_size(type:DataType): number;
    
    export enum ColorConversion { }
    export const COLOR_RGBA2GRAY: ColorConversion;
    export const COLOR_RGB2GRAY: ColorConversion;
    export const COLOR_BGRA2GRAY: ColorConversion;
    export const COLOR_BGR2GRAY: ColorConversion;
    
    export enum BoxBlurOptions { }
    export const BOX_BLUR_NOSCALE: BoxBlurOptions;
    
    export enum SvdOptions { }
    export const SVD_U_T: SvdOptions;
    export const SVD_V_T: SvdOptions;
    
    export class data_t {
        constructor(size_in_bytes: number, buffer?: ArrayBuffer);
        
        size: number;
        buffer: ArrayBuffer;
        u8: Uint8Array;
        i32: Int32Array;
        f32: Float32Array;
        f64: Float64Array;
    }
    
    export class matrix_t {
        constructor(columns?: number, rows?: number, data_type?: DataType, data_buffer?: data_t);
        
        type: DataType;
        channel: DataType;
        cols: number;
        rows: number;
        buffer: data_t;
        data: (Uint8Array|Int32Array|Float32Array|Float64Array);
        
        allocate(): void;
        copy_to(other: matrix_t): void;
        resize(columns: number, rows: number, channel?: DataType): void;
    }
    
    export class pyramid_t {
        constructor(levels?: number);
        
        levels: number;
        data: Array<matrix_t>;
        
        allocate(start_w: number, start_h: number, data_type: DataType): void;
        build(input: matrix_t, skip_first_level: boolean): void;
    }
    
    export class keypoint_t {
        constructor(x?: number, y?: number, score?: number, level?: number, angle?: number);
        
        x: number;
        y: number;
        score: number;
        level: number;
        angle: number;
    }
    
    export namespace cache {
        
        class _pool_node_t {
            constructor(size_in_bytes: number);
            
            next: _pool_node_t;
            data: data_t;
            size: number;
            buffer: ArrayBuffer;
            u8: Uint8Array;
            i32: Int32Array;
            f32: Float32Array;
            f64: Float64Array;
            
            resize(size_in_bytes: number);
        }
        
        export function allocate(capacity: number, data_size: number): void;
        export function get_buffer(size_in_bytes: number) :_pool_node_t;
        export function put_buffer(node: _pool_node_t): void;
    }
    
    export namespace math {
        export function get_gaussian_kernel(size: number, sigma: number, kernel: Array<number>, data_type: DataType): void;
        export function perspective_4point_transform(model: matrix_t, src_x0: number, src_y0: number, dst_x0: number, dst_y0: number, src_x1: number, src_y1: number, dst_x1: number, dst_y1: number, src_x2: number, src_y2: number, dst_x2: number, dst_y2: number, src_x3: number, src_y3: number, dst_x3: number, dst_y3: number): void;
        export function qsort(array: Array<number>, low: number, high: number, cmp: Function): void;
        export function median(array: Array<number>, low: number, high: number): number; 
    }
    
    export namespace matmath {
        export function identity(M: matrix_t, value?: number): void;
        export function transpose(At: matrix_t, A: matrix_t): void;
        export function multiply(C: matrix_t, A: matrix_t, B: matrix_t): void;
        export function multiply_ABt(C: matrix_t, A: matrix_t, B: matrix_t): void;
        export function multiply_AtB(C: matrix_t, A: matrix_t, B: matrix_t): void;
        export function multiply_AAt(C: matrix_t, A: matrix_t): void;
        export function multiply_AtA(C: matrix_t, A: matrix_t): void;
        export function invert_3x3(C: matrix_t, A: matrix_t): void;
        export function multiply_3x3(C: matrix_t, A: matrix_t, B: matrix_t): void;
        export function mat3x3_determinant(M: matrix_t): number;
        export function determinant_3x3(M11: number, M12: number, M13: number, M21: number, M22: number, M23: number, M31: number, M32: number, M33: number): number;
    }
    
    export namespace linalg {
        export function lu_solve(A: matrix_t, B: matrix_t): void;
        export function cholesky_solve(A: matrix_t, B: matrix_t): void;
        export function svd_decompose(A: matrix_t, W: matrix_t, U: matrix_t, V: matrix_t, options: SvdOptions): void;
        export function svd_solve(A: matrix_t, X: matrix_t, B: matrix_t): void;
        export function svd_invert(Ainvert: matrix_t, A: matrix_t): void;
        export function eigenVV(A: matrix_t, vects?: matrix_t, vals?: matrix_t): void;
    }
    
    export namespace motion_model {
        export class affine2d {
            constructor();
            
            run(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, model: matrix_t, count: number): void;
            error(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, model: matrix_t, err: matrix_t, count: number): void;
            check_subset(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, count: number): boolean;
        }
        
        export class homography2d {
            constructor();
            
            run(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, model: matrix_t, count: number): void;
            error(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, model: matrix_t, err: matrix_t, count: number): void;
            check_subset(from: Array<{x: number, y: number}>, to: Array<{x: number, y: number}>, count: number): boolean;
        }
    }
    
    export class ransac_params_t {
        constructor(size?: number, thresh?: number, eps?: number, prob?: number);
        
        size: number;
        thresh: number;
        eps: number;
        prob: number;
        
        update_iters(_eps: number, max_iters: number);
    }
    
    export namespace motion_estimator {
        export function ransac(params: ransac_params_t, kernel: motion_model.homography2d, from: Array<{x: number, y:number}>, to: Array<{x: number, y:number}>, count: number, model: matrix_t, mask: matrix_t, max_iters?: number): boolean;
        export function lmeds(params: ransac_params_t, kernel: motion_model.affine2d, from: Array<{x: number, y:number}>, to: Array<{x: number, y:number}>, count: number, model: matrix_t, mask: matrix_t, max_iters?: number): boolean;
    }
    
    export namespace imgproc {
        export function grayscale(src: Array<number>, width: number, height: number, dst: matrix_t, code: ColorConversion): void;
        export function resample(src: matrix_t, dst: matrix_t, new_width: number, new_height: number): void;
        export function box_blur_gray(src: matrix_t, dst: matrix_t, radius: number, options?: BoxBlurOptions): void;
        export function gaussian_blur(src: matrix_t, dst: matrix_t, kernel_size: number, sigma?: number): void;
        export function pyrdown(src: matrix_t, dst: matrix_t, sx?: number, sy?: number): void;
        export function scharr_derivatives(src: matrix_t, dst: matrix_t): void;
        export function sobel_derivatives(src: matrix_t, dst: matrix_t): void;
        export function compute_integral_image(src: matrix_t, dst_sum: Array<number>, dst_sqsum: Array<number>, dst_tilted: Array<number>): void;
        export function equalize_histogram(src: matrix_t, dst: matrix_t): void;
        export function canny(src: matrix_t, dst: matrix_t, low_thresh: number, high_thresh: number): void;
        export function warp_perspective(src: matrix_t, dst: matrix_t, transform: matrix_t, fill_value?: number): void;
        export function warp_affine(src: matrix_t, dst: matrix_t, transform: matrix_t, fill_value?: number): void;
        export function skindetector(src: matrix_t, dst: matrix_t): void;
    }
    
    export namespace fast_corners {
        export function set_threshold(threshold: number): void;
        export function detect(src: matrix_t, corners: Array<keypoint_t>, border?: number): number;
    }
    
    export namespace yape06 {
        export var laplacian_threshold: number;
        export var min_eigen_value_threshold: number;
        
        export function detect(src: matrix_t, points: Array<keypoint_t>, border ?: number): number;
    }
    
    export namespace yape {
        export function init(width: number, height: number, radius: number, pyramid_levels ?: number): void;
        export function detect(src: matrix_t, points: Array<keypoint_t>, border ?: number): number;
    }
    
    export namespace orb {
        export function describe(src: matrix_t, corners: Array<keypoint_t>, count: number, descriptors: matrix_t): void;
    }
    
    export namespace optical_flow_lk {
        export function track(prev_pyr:pyramid_t, curr_pyr:pyramid_t, prev_xy:Array<{x: number, y: number}>, curr_xy:Array<{x: number, y: number}>, count: number, win_size: number, max_iter ?: number, status?: Array<number>, eps ?: number, min_eigen_threshold?: number): void;
    }
    
    export type Rect = {x: number, y: number, width: number, height: number, neighbors: number, confidence: number};
    
    export namespace haar {
        export function detect_single_scale(int_sum: Array<number>, int_sqsum: Array<number>, int_titled: Array<number>, int_canny_sum: Array<number>, width: number, height: number, scale: number, classifier): Array<Rect>;
        export function detect_multi_scale(int_sum: Array<number>, int_sqsum: Array<number>, int_titled: Array<number>, int_canny_sum: Array<number>, width: number, height: number, classifier, scale_factor?: number, scale_min?: number): Array<Rect>;
        export function group_rectangles(rects: Array<Rect>, min_neighbors?: number): Array<Rect>;
    }
    
    export namespace bbf {
        export function prepare_cascade(cascade): void;
        export function build_pyramid(src: matrix_t, min_width: number, min_height: number, interval?: number): pyramid_t;
        export function detect(pyramid: pyramid_t, cascade): Array<Rect>;
        export function group_rectangles(rects: Array<Rect>, min_neighbors ?: number): Array<Rect>;
    }
}

declare module 'jsfeat' {
    export default jsfeat;
}