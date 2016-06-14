#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;

out float magnitude;

const float TOLERANCE = 1e-3;

bool is_fuzzy_zero(float value)
{
    return abs(value) <= TOLERANCE;
}

float sign_1(float value)
{
    return (is_fuzzy_zero(value) || value > 0.0) ? 1.0 : -1.0;
}

void main() 
{  
    vec2 value = texture(u_input, gl_FragCoord.xy / u_transformSize).xy;
    magnitude = sign_1(value.x) * sign_1(value.y) * length(value);
}
