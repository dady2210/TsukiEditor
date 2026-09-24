// Shader Graphs/AbstractArt
// sacado de sharedassets70.assets
// declara: White, _MainTex, _Seed, _Steps, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


// ===== VERTICE =====
#version 300 es

#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 1
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
uniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];
uniform 	mediump vec4 _RendererColor;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;
	UNITY_UNIFORM vec4                unity_SpriteColor;
	UNITY_UNIFORM vec4                unity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
out highp vec3 vs_INTERP2;
highp vec3 vs_INTERP3;
vec4 u_xlat0;
vec4 u_xlat1;
vec3 u_xlat2;
float u_xlat6;
void main()
{
    u_xlat0.xy = in_POSITION0.xy * unity_SpriteProps.xy;
    u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * u_xlat0.xxx + u_xlat2.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    vs_INTERP2.xyz = u_xlat0.xyz;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    u_xlat0 = _RendererColor * unity_SpriteColor;
    vs_INTERP1 = u_xlat0 * in_COLOR0;
    u_xlat0.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat0.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat0.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat6 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat6 = max(u_xlat6, 1.17549435e-38);
    u_xlat6 = inversesqrt(u_xlat6);
    vs_INTERP3.xyz = vec3(u_xlat6) * u_xlat0.xyz;
    return;
}

#endif
#ifdef FRAGMENT


// ===== FRAGMENTO =====
#version 300 es

precision highp float;
precision highp int;
#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 1
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;
	UNITY_UNIFORM vec4                unity_SpriteColor;
	UNITY_UNIFORM vec4                unity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float                _Steps;
	UNITY_UNIFORM vec2                _Seed;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
ivec2 u_xlati0;
uint u_xlatu0;
bool u_xlatb0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
float u_xlat5;
int u_xlati5;
uint u_xlatu5;
bool u_xlatb5;
vec2 u_xlat6;
float u_xlat7;
ivec3 u_xlati7;
vec2 u_xlat8;
ivec3 u_xlati8;
uvec2 u_xlatu8;
vec2 u_xlat10;
ivec2 u_xlati10;
uvec2 u_xlatu10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uvec2 u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
vec2 u_xlat13;
uvec2 u_xlatu13;
float u_xlat15;
int u_xlati15;
uint u_xlatu15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlat0.xy = u_xlat0.xy + vec2(_Seed.x, _Seed.y);
    u_xlat1 = u_xlat0.xyxy * vec4(10.0, 10.0, 5.0, 5.0);
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati10.xy = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xy = u_xlati10.xy + u_xlati3.xz;
    u_xlatu10.xy = uvec2(u_xlati10.xy) * uvec2(u_xlati3.xy);
    u_xlatu3.xy = uvec2(u_xlatu10.x >> (uint(5u) & uint(0x1F)), u_xlatu10.y >> (uint(5u) & uint(0x1F)));
    u_xlati10.xy = ivec2(uvec2(u_xlatu10.x ^ u_xlatu3.x, u_xlatu10.y ^ u_xlatu3.y));
    u_xlatu10.xy = uvec2(u_xlati10.xy) * uvec2(668265261u, 668265261u);
    u_xlatu10.xy = uvec2(u_xlatu10.x >> (uint(8u) & uint(0x1F)), u_xlatu10.y >> (uint(8u) & uint(0x1F)));
    u_xlat10.xy = vec2(u_xlatu10.xy);
    u_xlati3 = ivec4(u_xlat2);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat3.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlat15 = u_xlat10.y * 5.96046519e-08 + (-u_xlat3.y);
    u_xlat4 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat4;
    u_xlat15 = u_xlat1.z * u_xlat15 + u_xlat3.y;
    u_xlat4 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat2 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati8.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati8.xy + u_xlati4.xz;
    u_xlatu8.xy = uvec2(u_xlati8.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu8.x >> (uint(5u) & uint(0x1F)), u_xlatu8.y >> (uint(5u) & uint(0x1F)));
    u_xlati8.xy = ivec2(uvec2(u_xlatu8.x ^ u_xlatu4.x, u_xlatu8.y ^ u_xlatu4.y));
    u_xlatu8.xy = uvec2(u_xlati8.xy) * uvec2(668265261u, 668265261u);
    u_xlatu8.xy = uvec2(u_xlatu8.x >> (uint(8u) & uint(0x1F)), u_xlatu8.y >> (uint(8u) & uint(0x1F)));
    u_xlat8.xy = vec2(u_xlatu8.xy);
    u_xlat8.x = u_xlat8.x * 5.96046519e-08;
    u_xlat13.x = u_xlat8.y * 5.96046519e-08 + (-u_xlat8.x);
    u_xlat11.x = u_xlat1.z * u_xlat13.x + u_xlat8.x;
    u_xlat11.x = (-u_xlat15) + u_xlat11.x;
    u_xlat15 = u_xlat1.w * u_xlat11.x + u_xlat15;
    u_xlat15 = u_xlat15 * 0.25;
    u_xlati11.xy = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xy = u_xlati11.xy + u_xlati2.xz;
    u_xlatu11.xy = uvec2(u_xlati11.xy) * uvec2(u_xlati2.xy);
    u_xlatu2.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.y >> (uint(5u) & uint(0x1F)));
    u_xlati11.xy = ivec2(uvec2(u_xlatu11.x ^ u_xlatu2.x, u_xlatu11.y ^ u_xlatu2.y));
    u_xlatu11.xy = uvec2(u_xlati11.xy) * uvec2(668265261u, 668265261u);
    u_xlatu11.xy = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.y >> (uint(8u) & uint(0x1F)));
    u_xlat11.xy = vec2(u_xlatu11.xy);
    u_xlat16 = u_xlat11.y * 5.96046519e-08;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat3.x);
    u_xlat11.x = u_xlat1.x * u_xlat11.x + u_xlat3.x;
    u_xlat10.x = u_xlat10.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat16;
    u_xlat10.x = (-u_xlat11.x) + u_xlat10.x;
    u_xlat10.x = u_xlat1.y * u_xlat10.x + u_xlat11.x;
    u_xlat10.x = u_xlat10.x * 0.125 + u_xlat15;
    u_xlat1.xy = u_xlat0.xy * vec2(2.5, 2.5);
    u_xlat11.xy = floor(u_xlat1.xy);
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.xy = u_xlat11.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati15 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati15 + u_xlati2.x;
    u_xlatu15 = uint(u_xlati15) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu15 >> (5u & uint(0x1F)));
    u_xlati15 = int(uint(u_xlatu15 ^ u_xlatu2.x));
    u_xlatu15 = uint(u_xlati15) * 668265261u;
    u_xlatu15 = uint(u_xlatu15 >> (8u & uint(0x1F)));
    u_xlat15 = float(u_xlatu15);
    u_xlat2 = u_xlat11.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati11.xy = ivec2(u_xlat11.xy);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat7 = u_xlat2.y * 5.96046519e-08;
    u_xlat15 = u_xlat15 * 5.96046519e-08 + (-u_xlat7);
    u_xlat12.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat1.xy = (-u_xlat1.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat1.xy = u_xlat1.xy * u_xlat12.xy;
    u_xlat15 = u_xlat1.x * u_xlat15 + u_xlat7;
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat11.x = u_xlat11.x * 5.96046519e-08;
    u_xlat16 = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat1.x = u_xlat1.x * u_xlat16 + u_xlat11.x;
    u_xlat15 = u_xlat15 + (-u_xlat1.x);
    u_xlat15 = u_xlat1.y * u_xlat15 + u_xlat1.x;
    u_xlat10.x = u_xlat15 * 0.5 + u_xlat10.x;
    u_xlat0.xy = u_xlat10.xx + u_xlat0.xy;
    u_xlat1.xy = fract(u_xlat0.xy);
    u_xlat0.xy = floor(u_xlat0.xy);
    u_xlat11.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat11.xy = u_xlat1.xy * u_xlat11.xy;
    u_xlat2.xy = u_xlat1.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat1.xy * u_xlat2.xy + vec2(10.0, 10.0);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.xy = u_xlat0.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati15 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati15 + u_xlati2.x;
    u_xlatu15 = uint(u_xlati15) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu15 >> (5u & uint(0x1F)));
    u_xlati15 = int(uint(u_xlatu15 ^ u_xlatu2.x));
    u_xlatu15 = uint(u_xlati15) * 668265261u;
    u_xlatu15 = uint(u_xlatu15 >> (8u & uint(0x1F)));
    u_xlat15 = float(u_xlatu15);
    u_xlat2.yz = vec2(u_xlat15) * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat7 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat15 * 5.96046519e-08 + (-u_xlat7);
    u_xlat15 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat15 = inversesqrt(u_xlat15);
    u_xlat2.xy = vec2(u_xlat15) * u_xlat2.xz;
    u_xlat12.xy = u_xlat1.xy + vec2(-1.0, -1.0);
    u_xlat15 = dot(u_xlat2.xy, u_xlat12.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat3 = u_xlat0.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati0.xy = ivec2(u_xlat0.xy);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat13.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat13.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat12.x = dot(u_xlat3.xy, u_xlat2.zw);
    u_xlat15 = u_xlat15 + (-u_xlat12.x);
    u_xlat15 = u_xlat11.y * u_xlat15 + u_xlat12.x;
    u_xlat12.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat12.x = inversesqrt(u_xlat12.x);
    u_xlat12.xy = u_xlat12.xx * u_xlat4.xz;
    u_xlat2.x = dot(u_xlat12.xy, u_xlat2.xy);
    u_xlati5 = int(uint(uint(u_xlati0.y) ^ 1103515245u));
    u_xlati0.x = u_xlati5 + u_xlati0.x;
    u_xlatu0 = uint(u_xlati5) * uint(u_xlati0.x);
    u_xlatu5 = uint(u_xlatu0 >> (5u & uint(0x1F)));
    u_xlati0.x = int(uint(u_xlatu5 ^ u_xlatu0));
    u_xlatu0 = uint(u_xlati0.x) * 668265261u;
    u_xlatu0 = uint(u_xlatu0 >> (8u & uint(0x1F)));
    u_xlat0.x = float(u_xlatu0);
    u_xlat3.yz = u_xlat0.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat5 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat0.x * 5.96046519e-08 + (-u_xlat5);
    u_xlat0.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xy = u_xlat0.xx * u_xlat3.xz;
    u_xlat0.x = dot(u_xlat0.xy, u_xlat1.xy);
    u_xlat5 = (-u_xlat0.x) + u_xlat2.x;
    u_xlat0.x = u_xlat11.y * u_xlat5 + u_xlat0.x;
    u_xlat5 = (-u_xlat0.x) + u_xlat15;
    u_xlat0.x = u_xlat11.x * u_xlat5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat5 = roundEven(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * _Steps;
    u_xlat0.x = floor(u_xlat0.x);
    u_xlat0.x = u_xlat0.x / _Steps;
    u_xlat15 = u_xlat0.x + -0.500007629;
    u_xlat0.x = u_xlat0.x * 1.99996948;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1.xyz = u_xlat0.xxx * vec3(0.5841313, 0.666859388, 0.588920116) + vec3(0.116970703, 0.155926496, 0.194617793);
    u_xlat1.xyz = log2(u_xlat1.xyz);
    u_xlat1.xyz = u_xlat1.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat1.xyz = exp2(u_xlat1.xyz);
    u_xlat1.xyz = u_xlat1.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat0.x = u_xlat15 * 2.00003052;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat2.xyz = u_xlat0.xxx * vec3(-0.207219481, -0.265673876, -0.23355478) + vec3(0.791297972, 0.617206573, 0.520995677);
    u_xlat2.xyz = log2(u_xlat2.xyz);
    u_xlat2.xyz = u_xlat2.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat2.xyz = exp2(u_xlat2.xyz);
    u_xlat2.xyz = u_xlat2.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat2.xyz = (-u_xlat1.xyz) + u_xlat2.xyz;
    u_xlat1.xyw = vec3(u_xlat5) * u_xlat2.yzx + u_xlat1.yzx;
    u_xlatb0 = u_xlat1.x>=u_xlat1.y;
    u_xlat0.x = u_xlatb0 ? 1.0 : float(0.0);
    u_xlat2.xy = u_xlat1.yx;
    u_xlat3.xy = u_xlat1.xy + (-u_xlat2.xy);
    u_xlat2.z = float(-1.0);
    u_xlat2.w = float(0.666666687);
    u_xlat3.z = float(1.0);
    u_xlat3.w = float(-1.0);
    u_xlat2 = u_xlat0.xxxx * u_xlat3 + u_xlat2;
    u_xlatb0 = u_xlat1.w>=u_xlat2.x;
    u_xlat0.x = u_xlatb0 ? 1.0 : float(0.0);
    u_xlat1.xyz = u_xlat2.xyw;
    u_xlat2.xyw = u_xlat1.wyx;
    u_xlat2 = (-u_xlat1) + u_xlat2;
    u_xlat1 = u_xlat0.xxxx * u_xlat2 + u_xlat1;
    u_xlat0.x = (-u_xlat1.y) + u_xlat1.w;
    u_xlat5 = min(u_xlat1.y, u_xlat1.w);
    u_xlat5 = (-u_xlat5) + u_xlat1.x;
    u_xlat15 = u_xlat5 * 6.0 + 1.00000001e-10;
    u_xlat0.x = u_xlat0.x / u_xlat15;
    u_xlat0.x = u_xlat0.x + u_xlat1.z;
    u_xlat0.x = u_xlat10.x * 0.055555556 + abs(u_xlat0.x);
    u_xlatb10 = 1.0<u_xlat0.x;
    u_xlat6.xy = u_xlat0.xx + vec2(1.0, -1.0);
    u_xlat10.x = (u_xlatb10) ? u_xlat6.y : u_xlat0.x;
    u_xlatb0 = u_xlat0.x<0.0;
    u_xlat0.x = (u_xlatb0) ? u_xlat6.x : u_xlat10.x;
    u_xlat0.xzw = u_xlat0.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat0.xzw = fract(u_xlat0.xzw);
    u_xlat0.xzw = u_xlat0.xzw * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat0.xzw = abs(u_xlat0.xzw) + vec3(-1.0, -1.0, -1.0);
    u_xlat0.xzw = clamp(u_xlat0.xzw, 0.0, 1.0);
    u_xlat0.xzw = u_xlat0.xzw + vec3(-1.0, -1.0, -1.0);
    u_xlat6.x = u_xlat1.x + 1.00000001e-10;
    u_xlat11.x = u_xlat5 / u_xlat6.x;
    u_xlatb5 = u_xlat5==0.0;
    u_xlat5 = (u_xlatb5) ? u_xlat1.x : u_xlat6.x;
    u_xlat0.xzw = u_xlat11.xxx * u_xlat0.xzw + vec3(1.0, 1.0, 1.0);
    u_xlat0.xyz = u_xlat0.xzw * vec3(u_xlat5);
    u_xlat0.w = 1.0;
    u_xlat0 = u_xlat0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
       ºu
                         SKINNED_SPRITE  üS  #ifdef VERTEX


// ===== VERTICE =====
#version 300 es

#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 1
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
uniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];
uniform 	mediump vec4 _RendererColor;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;
	UNITY_UNIFORM vec4                unity_SpriteColor;
	UNITY_UNIFORM vec4                unity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
out highp vec3 vs_INTERP2;
highp vec3 vs_INTERP3;
vec4 u_xlat0;
vec4 u_xlat1;
vec3 u_xlat2;
float u_xlat6;
void main()
{
    u_xlat0.xy = in_POSITION0.xy * unity_SpriteProps.xy;
    u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * u_xlat0.xxx + u_xlat2.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    vs_INTERP2.xyz = u_xlat0.xyz;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    u_xlat0 = _RendererColor * unity_SpriteColor;
    vs_INTERP1 = u_xlat0 * in_COLOR0;
    u_xlat0.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat0.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat0.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat6 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat6 = max(u_xlat6, 1.17549435e-38);
    u_xlat6 = inversesqrt(u_xlat6);
    vs_INTERP3.xyz = vec3(u_xlat6) * u_xlat0.xyz;
    return;
}

#endif
#ifdef FRAGMENT


// ===== FRAGMENTO =====
#version 300 es

precision highp float;
precision highp int;
#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 1
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_Rotation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;
	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;
	UNITY_UNIFORM vec4                unity_SpriteColor;
	UNITY_UNIFORM vec4                unity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float                _Steps;
	UNITY_UNIFORM vec2                _Seed;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
ivec2 u_xlati0;
uint u_xlatu0;
bool u_xlatb0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
float u_xlat5;
int u_xlati5;
uint u_xlatu5;
bool u_xlatb5;
vec2 u_xlat6;
float u_xlat7;
ivec3 u_xlati7;
vec2 u_xlat8;
ivec3 u_xlati8;
uvec2 u_xlatu8;
vec2 u_xlat10;
ivec2 u_xlati10;
uvec2 u_xlatu10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uvec2 u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
vec2 u_xlat13;
uvec2 u_xlatu13;
float u_xlat15;
int u_xlati15;
uint u_xlatu15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlat0.xy = u_xlat0.xy + vec2(_Seed.x, _Seed.y);
    u_xlat1 = u_xlat0.xyxy * vec4(10.0, 10.0, 5.0, 5.0);
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati10.xy = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xy = u_xlati10.xy + u_xlati3.xz;
    u_xlatu10.xy = uvec2(u_xlati10.xy) * uvec2(u_xlati3.xy);
    u_xlatu3.xy = uvec2(u_xlatu10.x >> (uint(5u) & uint(0x1F)), u_xlatu10.y >> (uint(5u) & uint(0x1F)));
    u_xlati10.xy = ivec2(uvec2(u_xlatu10.x ^ u_xlatu3.x, u_xlatu10.y ^ u_xlatu3.y));
    u_xlatu10.xy = uvec2(u_xlati10.xy) * uvec2(668265261u, 668265261u);
    u_xlatu10.xy = uvec2(u_xlatu10.x >> (uint(8u) & uint(0x1F)), u_xlatu10.y >> (uint(8u) & uint(0x1F)));
    u_xlat10.xy = vec2(u_xlatu10.xy);
    u_xlati3 = ivec4(u_xlat2);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat3.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlat15 = u_xlat10.y * 5.96046519e-08 + (-u_xlat3.y);
    u_xlat4 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat4;
    u_xlat15 = u_xlat1.z * u_xlat15 + u_xlat3.y;
    u_xlat4 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat2 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati8.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati8.xy + u_xlati4.xz;
    u_xlatu8.xy = uvec2(u_xlati8.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu8.x >> (uint(5u) & uint(0x1F)), u_xlatu8.y >> (uint(5u) & uint(0x1F)));
    u_xlati8.xy = ivec2(uvec2(u_xlatu8.x ^ u_xlatu4.x, u_xlatu8.y ^ u_xlatu4.y));
    u_xlatu8.xy = uvec2(u_xlati8.xy) * uvec2(668265261u, 668265261u);
    u_xlatu8.xy = uvec2(u_xlatu8.x >> (uint(8u) & uint(0x1F)), u_xlatu8.y >> (uint(8u) & uint(0x1F)));
    u_xlat8.xy = vec2(u_xlatu8.xy);
    u_xlat8.x = u_xlat8.x * 5.96046519e-08;
    u_xlat13.x = u_xlat8.y * 5.96046519e-08 + (-u_xlat8.x);
    u_xlat11.x = u_xlat1.z * u_xlat13.x + u_xlat8.x;
    u_xlat11.x = (-u_xlat15) + u_xlat11.x;
    u_xlat15 = u_xlat1.w * u_xlat11.x + u_xlat15;
    u_xlat15 = u_xlat15 * 0.25;
    u_xlati11.xy = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xy = u_xlati11.xy + u_xlati2.xz;
    u_xlatu11.xy = uvec2(u_xlati11.xy) * uvec2(u_xlati2.xy);
    u_xlatu2.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.y >> (uint(5u) & uint(0x1F)));
    u_xlati11.xy = ivec2(uvec2(u_xlatu11.x ^ u_xlatu2.x, u_xlatu11.y ^ u_xlatu2.y));
    u_xlatu11.xy = uvec2(u_xlati11.xy) * uvec2(668265261u, 668265261u);
    u_xlatu11.xy = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.y >> (uint(8u) & uint(0x1F)));
    u_xlat11.xy = vec2(u_xlatu11.xy);
    u_xlat16 = u_xlat11.y * 5.96046519e-08;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat3.x);
    u_xlat11.x = u_xlat1.x * u_xlat11.x + u_xlat3.x;
    u_xlat10.x = u_xlat10.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat16;
    u_xlat10.x = (-u_xlat11.x) + u_xlat10.x;
    u_xlat10.x = u_xlat1.y * u_xlat10.x + u_xlat11.x;
    u_xlat10.x = u_xlat10.x * 0.125 + u_xlat15;
    u_xlat1.xy = u_xlat0.xy * vec2(2.5, 2.5);
    u_xlat11.xy = floor(u_xlat1.xy);
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.xy = u_xlat11.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati15 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati15 + u_xlati2.x;
    u_xlatu15 = uint(u_xlati15) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu15 >> (5u & uint(0x1F)));
    u_xlati15 = int(uint(u_xlatu15 ^ u_xlatu2.x));
    u_xlatu15 = uint(u_xlati15) * 668265261u;
    u_xlatu15 = uint(u_xlatu15 >> (8u & uint(0x1F)));
    u_xlat15 = float(u_xlatu15);
    u_xlat2 = u_xlat11.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati11.xy = ivec2(u_xlat11.xy);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat7 = u_xlat2.y * 5.96046519e-08;
    u_xlat15 = u_xlat15 * 5.96046519e-08 + (-u_xlat7);
    u_xlat12.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat1.xy = (-u_xlat1.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat1.xy = u_xlat1.xy * u_xlat12.xy;
    u_xlat15 = u_xlat1.x * u_xlat15 + u_xlat7;
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat11.x = u_xlat11.x * 5.96046519e-08;
    u_xlat16 = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat1.x = u_xlat1.x * u_xlat16 + u_xlat11.x;
    u_xlat15 = u_xlat15 + (-u_xlat1.x);
    u_xlat15 = u_xlat1.y * u_xlat15 + u_xlat1.x;
    u_xlat10.x = u_xlat15 * 0.5 + u_xlat10.x;
    u_xlat0.xy = u_xlat10.xx + u_xlat0.xy;
    u_xlat1.xy = fract(u_xlat0.xy);
    u_xlat0.xy = floor(u_xlat0.xy);
    u_xlat11.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat11.xy = u_xlat1.xy * u_xlat11.xy;
    u_xlat2.xy = u_xlat1.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat1.xy * u_xlat2.xy + vec2(10.0, 10.0);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.xy = u_xlat0.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati15 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati15 + u_xlati2.x;
    u_xlatu15 = uint(u_xlati15) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu15 >> (5u & uint(0x1F)));
    u_xlati15 = int(uint(u_xlatu15 ^ u_xlatu2.x));
    u_xlatu15 = uint(u_xlati15) * 668265261u;
    u_xlatu15 = uint(u_xlatu15 >> (8u & uint(0x1F)));
    u_xlat15 = float(u_xlatu15);
    u_xlat2.yz = vec2(u_xlat15) * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat7 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat15 * 5.96046519e-08 + (-u_xlat7);
    u_xlat15 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat15 = inversesqrt(u_xlat15);
    u_xlat2.xy = vec2(u_xlat15) * u_xlat2.xz;
    u_xlat12.xy = u_xlat1.xy + vec2(-1.0, -1.0);
    u_xlat15 = dot(u_xlat2.xy, u_xlat12.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat3 = u_xlat0.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati0.xy = ivec2(u_xlat0.xy);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat13.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat13.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat12.x = dot(u_xlat3.xy, u_xlat2.zw);
    u_xlat15 = u_xlat15 + (-u_xlat12.x);
    u_xlat15 = u_xlat11.y * u_xlat15 + u_xlat12.x;
    u_xlat12.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat12.x = inversesqrt(u_xlat12.x);
    u_xlat12.xy = u_xlat12.xx * u_xlat4.xz;
    u_xlat2.x = dot(u_xlat12.xy, u_xlat2.xy);
    u_xlati5 = int(uint(uint(u_xlati0.y) ^ 1103515245u));
    u_xlati0.x = u_xlati5 + u_xlati0.x;
    u_xlatu0 = uint(u_xlati5) * uint(u_xlati0.x);
    u_xlatu5 = uint(u_xlatu0 >> (5u & uint(0x1F)));
    u_xlati0.x = int(uint(u_xlatu5 ^ u_xlatu0));
    u_xlatu0 = uint(u_xlati0.x) * 668265261u;
    u_xlatu0 = uint(u_xlatu0 >> (8u & uint(0x1F)));
    u_xlat0.x = float(u_xlatu0);
    u_xlat3.yz = u_xlat0.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat5 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat0.x * 5.96046519e-08 + (-u_xlat5);
    u_xlat0.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xy = u_xlat0.xx * u_xlat3.xz;
    u_xlat0.x = dot(u_xlat0.xy, u_xlat1.xy);
    u_xlat5 = (-u_xlat0.x) + u_xlat2.x;
    u_xlat0.x = u_xlat11.y * u_xlat5 + u_xlat0.x;
    u_xlat5 = (-u_xlat0.x) + u_xlat15;
    u_xlat0.x = u_xlat11.x * u_xlat5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat5 = roundEven(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * _Steps;
    u_xlat0.x = floor(u_xlat0.x);
    u_xlat0.x = u_xlat0.x / _Steps;
    u_xlat15 = u_xlat0.x + -0.500007629;
    u_xlat0.x = u_xlat0.x * 1.99996948;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1.xyz = u_xlat0.xxx * vec3(0.5841313, 0.666859388, 0.588920116) + vec3(0.116970703, 0.155926496, 0.194617793);
    u_xlat1.xyz = log2(u_xlat1.xyz);
    u_xlat1.xyz = u_xlat1.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat1.xyz = exp2(u_xlat1.xyz);
    u_xlat1.xyz = u_xlat1.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat0.x = u_xlat15 * 2.00003052;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat2.xyz = u_xlat0.xxx * vec3(-0.207219481, -0.265673876, -0.23355478) + vec3(0.791297972, 0.617206573, 0.520995677);
    u_xlat2.xyz = log2(u_xlat2.xyz);
    u_xlat2.xyz = u_xlat2.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat2.xyz = exp2(u_xlat2.xyz);
    u_xlat2.xyz = u_xlat2.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat2.xyz = (-u_xlat1.xyz) + u_xlat2.xyz;
    u_xlat1.xyw = vec3(u_xlat5) * u_xlat2.yzx + u_xlat1.yzx;
    u_xlatb0 = u_xlat1.x>=u_xlat1.y;
    u_xlat0.x = u_xlatb0 ? 1.0 : float(0.0);
    u_xlat2.xy = u_xlat1.yx;
    u_xlat3.xy = u_xlat1.xy + (-u_xlat2.xy);
    u_xlat2.z = float(-1.0);
    u_xlat2.w = float(0.666666687);
    u_xlat3.z = float(1.0);
    u_xlat3.w = float(-1.0);
    u_xlat2 = u_xlat0.xxxx * u_xlat3 + u_xlat2;
    u_xlatb0 = u_xlat1.w>=u_xlat2.x;
    u_xlat0.x = u_xlatb0 ? 1.0 : float(0.0);
    u_xlat1.xyz = u_xlat2.xyw;
    u_xlat2.xyw = u_xlat1.wyx;
    u_xlat2 = (-u_xlat1) + u_xlat2;
    u_xlat1 = u_xlat0.xxxx * u_xlat2 + u_xlat1;
    u_xlat0.x = (-u_xlat1.y) + u_xlat1.w;
    u_xlat5 = min(u_xlat1.y, u_xlat1.w);
    u_xlat5 = (-u_xlat5) + u_xlat1.x;
    u_xlat15 = u_xlat5 * 6.0 + 1.00000001e-10;
    u_xlat0.x = u_xlat0.x / u_xlat15;
    u_xlat0.x = u_xlat0.x + u_xlat1.z;
    u_xlat0.x = u_xlat10.x * 0.055555556 + abs(u_xlat0.x);
    u_xlatb10 = 1.0<u_xlat0.x;
    u_xlat6.xy = u_xlat0.xx + vec2(1.0, -1.0);
    u_xlat10.x = (u_xlatb10) ? u_xlat6.y : u_xlat0.x;
    u_xlatb0 = u_xlat0.x<0.0;
    u_xlat0.x = (u_xlatb0) ? u_xlat6.x : u_xlat10.x;
    u_xlat0.xzw = u_xlat0.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat0.xzw = fract(u_xlat0.xzw);
    u_xlat0.xzw = u_xlat0.xzw * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat0.xzw = abs(u_xlat0.xzw) + vec3(-1.0, -1.0, -1.0);
    u_xlat0.xzw = clamp(u_xlat0.xzw, 0.0, 1.0);
    u_xlat0.xzw = u_xlat0.xzw + vec3(-1.0, -1.0, -1.0);
    u_xlat6.x = u_xlat1.x + 1.00000001e-10;
    u_xlat11.x = u_xlat5 / u_xlat6.x;
    u_xlatb5 = u_xlat5==0.0;
    u_xlat5 = (u_xlatb5) ? u_xlat1.x : u_xlat6.x;
    u_xlat0.xzw = u_xlat11.xxx * u_xlat0.xzw + vec3(1.0, 1.0, 1.0);
    u_xlat0.xyz = u_xlat0.xzw * vec3(u_xlat5);
    u_xlat0.w = 1.0;
    u_xlat0 = u_xlat0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
       
