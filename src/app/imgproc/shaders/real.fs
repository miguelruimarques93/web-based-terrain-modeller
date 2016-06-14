#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;

out float real;

void main() 
{  
    real = texture(u_input, gl_FragCoord.xy / u_transformSize).x;
}
