#define IEEE_MANTISSA 0x007FFFFF;
#define IEEE_ONE      0x3F800000;

int hash(int x)
{
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}

int hash(ivec2 v) 
{ 
    return hash( v.x ^ hash(v.y)); 
}

int hash(ivec3 v) 
{ 
    return hash( v.x ^ hash(v.y) ^ hash(v.z)); 
}

float floatConstruct( int m ) 
{
    m &= IEEE_MANTISSA;
    m |= IEEE_ONE;
    
    float f = intBitsToFloat( m );
    return f - 1.0;
}

float random (float x)
{
    return floatConstruct(hash(floatBitsToInt(x)));
}

float random (vec2 v)
{
    return floatConstruct(hash(floatBitsToInt(v)));
}

float random (vec3 v)
{
    return floatConstruct(hash(floatBitsToInt(v)));
}

#pragma glslify: export(random)