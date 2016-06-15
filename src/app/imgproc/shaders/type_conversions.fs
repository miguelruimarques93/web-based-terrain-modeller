#version 300 es

/* inject:defines */

#if defined(I_F32)

#ifdef O_F32
#error Type conversion from f32 to f32.
#endif

#define INPUT_TYPE sampler2D

#elif defined(I_U8)

#ifdef O_U8
#error Type conversion from u8 to u8.
#endif

#define INPUT_TYPE usampler2D

#elif defined(I_I32)

#ifdef O_I32
#error Type conversion from i32 to i32.
#endif

#define INPUT_TYPE isampler2D

#endif

#if defined(O_F32)

#define OUTPUT_TYPE vec4

#elif defined(O_U8)

#define OUTPUT_TYPE uvec4

#elif defined(O_I32)

#define OUTPUT_TYPE ivec4

#endif

precision highp int;
precision highp float;
precision highp sampler2D;
precision lowp  usampler2D;
precision highp isampler2D;

uniform INPUT_TYPE u_input;
uniform vec2 u_transformSize;

out OUTPUT_TYPE result;

void main()
{
    vec2 st = gl_FragCoord.xy / u_transformSize;
    result = OUTPUT_TYPE(texture(u_input, st));
}
