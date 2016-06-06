#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input_1;
uniform float u_input_2;
uniform vec2 u_transformSize;

out vec4 result;

void main() 
{          
    vec2 st = gl_FragCoord.xy / u_transformSize;
    result = texture(u_input_1, st) * u_input_2;
}
