#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D;
precision highp usampler2D;

uniform usampler2D u_input;
uniform vec2 u_transformSize;
uniform float u_alpha;

out uvec4 normal;

void main() 
{          
    vec2 fragCoord = floor(gl_FragCoord.st);

    vec2 tl_i = clamp(fragCoord + vec2(-1, -1), vec2(0, 0), u_transformSize);
    vec2  l_i = clamp(fragCoord + vec2(-1,  0), vec2(0, 0), u_transformSize);
    vec2 bl_i = clamp(fragCoord + vec2(-1,  1), vec2(0, 0), u_transformSize);
    vec2  t_i = clamp(fragCoord + vec2( 0, -1), vec2(0, 0), u_transformSize);
    vec2  b_i = clamp(fragCoord + vec2( 0,  1), vec2(0, 0), u_transformSize);
    vec2 tr_i = clamp(fragCoord + vec2( 1, -1), vec2(0, 0), u_transformSize);
    vec2  r_i = clamp(fragCoord + vec2( 1,  0), vec2(0, 0), u_transformSize);
    vec2 br_i = clamp(fragCoord + vec2( 1,  1), vec2(0, 0), u_transformSize);

    float tl = float(texture(u_input, tl_i / u_transformSize).x);
    float  l = float(texture(u_input,  l_i / u_transformSize).x);
    float bl = float(texture(u_input, bl_i / u_transformSize).x);
    float  t = float(texture(u_input,  t_i / u_transformSize).x);
    float  b = float(texture(u_input,  b_i / u_transformSize).x);
    float tr = float(texture(u_input, tr_i / u_transformSize).x);
    float  r = float(texture(u_input,  r_i / u_transformSize).x);
    float br = float(texture(u_input, br_i / u_transformSize).x);

    // Compute dx using Sobel:
    //           -1 0 1 
    //           -2 0 2
    //           -1 0 1
    float dX = tr + 2.0 * r + br - tl - 2.0 * l - bl;

    // Compute dy using Sobel:
    //           -1 -2 -1 
    //            0  0  0
    //            1  2  1
    float dY = bl + 2.0 * b + br - tl - 2.0 * t - tr;

    normal = uvec4((vec4(normalize(vec3(dX, dY, 1.0 / u_alpha)), 1.0) * 0.5 + 0.5) * 255.0);
}