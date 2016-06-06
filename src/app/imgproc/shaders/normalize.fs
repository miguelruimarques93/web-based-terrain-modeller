#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;
uniform vec2 u_minMax;

out float normalized;

void main() 
{  
    normalized = (texture(u_input, gl_FragCoord.xy / u_transformSize).x - u_minMax.x) / (u_minMax.y - u_minMax.x);
}

