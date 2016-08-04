#version 300 es

/* inject:defines */

#define IEEE_MANTISSA 0x007FFFFFu;
#define IEEE_ONE      0x3F800000u;

precision mediump int; 
precision highp float; 

uniform vec2 u_transformSize;

uniform uint u_octaves;
uniform float u_frequency;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_base;

out float random_value;

#pragma glslify: snoise2 = require(./noise2D.glsl)

float generate(float x, float y)
{
    float freq = 1.0;
    float amp = 1.0;
    float max = 1.0;
    float total = snoise2(vec2(x * freq + u_base, y * freq + u_base)) * amp;
    
    for (uint i = 0u; i < u_octaves; ++i)
    {
        freq *= u_lacunarity;
        amp *= u_persistence;
        max += amp;
        total += snoise2(vec2(x * freq + u_base, y * freq + u_base)) * amp;
    }
    
    return total / max;
}

void main() 
{          
    vec2 xy = gl_FragCoord.xy / u_frequency;
    random_value = generate(xy.x, xy.y);
}
