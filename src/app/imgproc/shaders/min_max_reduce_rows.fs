#version 300 es

/* inject:defines */

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;

out vec2 minMax;

void main() 
{  
    float incr = 1.0 / u_transformSize.x;
    float y = gl_FragCoord.y / u_transformSize.y;
    float value = texture(u_input, vec2(0, y)).x;
    minMax = vec2(value, value);
    
    int size = int(u_transformSize.x);
    for (int i = 1; i < size; ++i)
    {
      value = texture(u_input, vec2(float(i) * incr, y)).x;
      minMax.x = min(minMax.x, value);
      minMax.y = max(minMax.y, value);
    }
}
