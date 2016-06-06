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
    float incr = 1.0 / u_transformSize.y;
    float x = gl_FragCoord.x / u_transformSize.x;
    minMax = texture(u_input, vec2(x, 0)).xy;
    
    int size = int(u_transformSize.y);
    for (int i = 1; i < size; ++i)
    {
      vec2 value = texture(u_input, vec2(x, float(i) * incr)).xy;
      minMax.x = min(minMax.x, value.x);
      minMax.x = min(minMax.x, value.y);
      
      minMax.y = max(minMax.y, value.x);
      minMax.y = max(minMax.y, value.y);
    }
}
