#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 

uniform vec2 u_transformSize;
uniform uint u_seed;

out float random_value;

#pragma glslify: random = require(./random.glsl)

void main() 
{          
    random_value = random(vec3(gl_FragCoord.xy / u_transformSize, uintBitsToFloat(u_seed)));
}
