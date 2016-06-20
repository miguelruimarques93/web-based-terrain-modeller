#version 300 es

/* inject:defines */

#ifndef N_POINTS
#   define N_POINTS 4
#endif

precision mediump int; 
precision highp float; 
precision highp sampler2D; 

uniform sampler2D u_input;
uniform vec2 u_transformSize;
uniform vec2 u_points[N_POINTS];
uniform float u_tangents[N_POINTS];

out float mapped;

/* Hermite coeficient matrix (Column major order) */
const mat4 h = mat4(
   2.0,  1.0, -2.0,  1.0,
  -3.0, -2.0,  3.0, -1.0,
   0.0,  1.0,  0.0,  0.0,
   1.0,  0.0,  0.0,  0.0
);

vec4 ht(float t) {
    return h * vec4(t*t*t, t*t, t, 1);
}

float interpolate(float x) {
    int i = N_POINTS - 1;
    if (x == u_points[i].x) { 
        return u_points[i].y; 
    }

    /*int low = 0;
    int mid;
    int high = N_POINTS - 1;
    while (low <= high) {
        mid = (low + high) / 2;
        vec2 point_mid = u_points[mid];

        if (point_mid.x < x) { low = mid + 1; }
        else if (point_mid.x > x) { high = mid - 1; }
        else { return point_mid.y; }
    }*/

    int high = 1;
    while(high < N_POINTS && x > u_points[high].x) {
        high++;
    }

    if (x == u_points[high].x) {
        return u_points[high].y;
    }

    int upper = max(0, high);
    int lower = max(0, upper - 1);

    vec2 p_upper = u_points[upper];
    vec2 p_lower = u_points[lower];

    float h = p_upper.x - p_lower.x;
    float t = (x - p_lower.x) / h;

    return dot(vec4(p_lower.y, h * u_tangents[lower], p_upper.y, h * u_tangents[upper]), ht(t));
}

void main() 
{  
    mapped = interpolate(texture(u_input, gl_FragCoord.xy / u_transformSize).x);
}

