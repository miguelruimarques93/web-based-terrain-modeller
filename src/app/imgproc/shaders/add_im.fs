#version 300 es

/* inject:defines */

#if defined(F32)

#   define INPUT_TYPE sampler2D
#   define INPUT_TYPE_IM float
#   define OUTPUT_TYPE vec4

#elif define(U8)

#   define INPUT_TYPE usampler2D
#   define INPUT_TYPE_IM uint
#   define OUTPUT_TYPE uvec4

#elif defined(I32)

#   define INPUT_TYPE isampler2D
#   define INPUT_TYPE_IM int
#   define OUTPUT_TYPE ivec4

#else

#   error No type defined.

#endif

precision highp int;
precision highp float;
precision highp sampler2D;
precision lowp  usampler2D;
precision highp isampler2D;

uniform INPUT_TYPE u_input_1;
uniform INPUT_TYPE_IM u_input_2;
uniform vec2 u_transformSize;

out OUTPUT_TYPE result;

void main() 
{          
    vec2 st = gl_FragCoord.xy / u_transformSize;
    result = texture(u_input_1, st) + u_input_2;
}
