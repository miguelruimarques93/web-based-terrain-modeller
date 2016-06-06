#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;
uniform float u_alpha;

out vec3 normal;

void main() 
{          
    float h1 = texture(u_input, vec2(gl_FragCoord.x + 1.0, gl_FragCoord.y) / u_transformSize).x;
    float h2 = texture(u_input, vec2(gl_FragCoord.x - 1.0, gl_FragCoord.y) / u_transformSize).x;
    float h3 = texture(u_input, vec2(gl_FragCoord.x, gl_FragCoord.y + 1.0) / u_transformSize).x;
    float h4 = texture(u_input, vec2(gl_FragCoord.x, gl_FragCoord.y - 1.0) / u_transformSize).x;

    normal.x = u_alpha * (h1 - h2);
    normal.y = u_alpha * (h3 - h4);
    normal.z = 1.0;

    normal /= length(normal);
}