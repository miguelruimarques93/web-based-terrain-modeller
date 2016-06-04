#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;

out float magnitude;

void main() 
{  
    magnitude = length(texture(u_input, gl_FragCoord.xy / u_transformSize).xy);
}
