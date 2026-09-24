// Shader Graphs/Concrete
// sacado de 8757dc46e0a6245559edf7051bb5ccbd
// declara: White, _Delta, _Hue, _HueSpan, _Line, _LineDarkness, _MainTex, _Patch, _RidgeScale, _Saturation, _Scale, _Threshold, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
out highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
highp vec3 vs_INTERP2;
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
uniform 	vec2 _GlobalMipBias;
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
	UNITY_UNIFORM vec4                _MainTex_ST;
	UNITY_UNIFORM float                _Patch;
	UNITY_UNIFORM float                _Line;
	UNITY_UNIFORM float                _Scale;
	UNITY_UNIFORM float                _LineDarkness;
	UNITY_UNIFORM float                _RidgeScale;
	UNITY_UNIFORM float                _Threshold;
	UNITY_UNIFORM float                _Hue;
	UNITY_UNIFORM float                _HueSpan;
	UNITY_UNIFORM float                _Delta;
	UNITY_UNIFORM float                _Saturation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uvec2 u_xlatu1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec4 u_xlatu3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec3 u_xlat5;
ivec2 u_xlati5;
uint u_xlatu5;
bool u_xlatb5;
vec3 u_xlat6;
int u_xlati6;
uint u_xlatu6;
vec2 u_xlat7;
ivec3 u_xlati7;
ivec3 u_xlati8;
vec2 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
vec2 u_xlat13;
ivec2 u_xlati13;
uvec2 u_xlatu13;
float u_xlat15;
int u_xlati15;
uint u_xlatu15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.x = roundEven(vs_INTERP1.w);
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * 2.0 + -1.0;
    u_xlat0.x = u_xlat0.x * vs_INTERP0.x;
    u_xlat0.y = vs_INTERP0.y;
    u_xlat10.xy = u_xlat0.xy * vec2(_RidgeScale);
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat11.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati11.xy = ivec2(u_xlat11.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2 = u_xlat1.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat16 = u_xlat2.y * 5.96046519e-08;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat10.xy = (-u_xlat10.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat11.x = u_xlat10.x * u_xlat11.x + u_xlat16;
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1.x = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1.x >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1.x));
    u_xlatu1.x = uint(u_xlati1.x) * 668265261u;
    u_xlatu1.x = uint(u_xlatu1.x >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1.x);
    u_xlat1.x = u_xlat1.x * 5.96046519e-08;
    u_xlat6.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat1.x);
    u_xlat10.x = u_xlat10.x * u_xlat6.x + u_xlat1.x;
    u_xlat1.x = (-u_xlat10.x) + u_xlat11.x;
    u_xlat10.x = u_xlat10.y * u_xlat1.x + u_xlat10.x;
    u_xlat1.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat1 = u_xlat0.xyxy * u_xlat1.xxyy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat2 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat4 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati13.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati13.xy + u_xlati4.xz;
    u_xlatu13.xy = uvec2(u_xlati13.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu13.x >> (uint(5u) & uint(0x1F)), u_xlatu13.y >> (uint(5u) & uint(0x1F)));
    u_xlati13.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu4.x, u_xlatu13.y ^ u_xlatu4.y));
    u_xlatu13.xy = uvec2(u_xlati13.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.zw = uvec2(u_xlatu13.x >> (uint(8u) & uint(0x1F)), u_xlatu13.y >> (uint(8u) & uint(0x1F)));
    u_xlat3 = vec4(u_xlatu3);
    u_xlat15 = u_xlat3.w * 5.96046519e-08;
    u_xlat3.x = u_xlat3.x * 5.96046519e-08 + (-u_xlat15);
    u_xlat4 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat4;
    u_xlat15 = u_xlat1.x * u_xlat3.x + u_xlat15;
    u_xlati4 = ivec4(u_xlat2);
    u_xlat2 = u_xlat2.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati3.xw = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati3.xw + u_xlati4.xz;
    u_xlatu3.xw = uvec2(u_xlati3.xw) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.w >> (uint(5u) & uint(0x1F)));
    u_xlati3.xw = ivec2(uvec2(u_xlatu3.x ^ u_xlatu4.x, u_xlatu3.w ^ u_xlatu4.y));
    u_xlatu3.xw = uvec2(u_xlati3.xw) * uvec2(668265261u, 668265261u);
    u_xlatu3.xw = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.w >> (uint(8u) & uint(0x1F)));
    u_xlat3.xw = vec2(u_xlatu3.xw);
    u_xlat3.xw = u_xlat3.xw * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlat13.x = u_xlat3.z * 5.96046519e-08 + (-u_xlat3.x);
    u_xlat1.x = u_xlat1.x * u_xlat13.x + u_xlat3.x;
    u_xlat15 = u_xlat15 + (-u_xlat1.x);
    u_xlat15 = u_xlat1.y * u_xlat15 + u_xlat1.x;
    u_xlat15 = u_xlat15 * 0.25;
    u_xlat10.x = u_xlat10.x * 0.125 + u_xlat15;
    u_xlati1.xy = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xy = u_xlati1.xy + u_xlati2.xz;
    u_xlatu1.xy = uvec2(u_xlati1.xy) * uvec2(u_xlati2.xy);
    u_xlatu2.xy = uvec2(u_xlatu1.x >> (uint(5u) & uint(0x1F)), u_xlatu1.y >> (uint(5u) & uint(0x1F)));
    u_xlati1.xy = ivec2(uvec2(u_xlatu1.x ^ u_xlatu2.x, u_xlatu1.y ^ u_xlatu2.y));
    u_xlatu1.xy = uvec2(u_xlati1.xy) * uvec2(668265261u, 668265261u);
    u_xlatu1.xy = uvec2(u_xlatu1.x >> (uint(8u) & uint(0x1F)), u_xlatu1.y >> (uint(8u) & uint(0x1F)));
    u_xlat1.xy = vec2(u_xlatu1.xy);
    u_xlat15 = u_xlat1.y * 5.96046519e-08;
    u_xlat1.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat3.w);
    u_xlat1.x = u_xlat1.z * u_xlat1.x + u_xlat3.w;
    u_xlat6.x = u_xlat3.y * 5.96046519e-08 + (-u_xlat15);
    u_xlat15 = u_xlat1.z * u_xlat6.x + u_xlat15;
    u_xlat15 = (-u_xlat1.x) + u_xlat15;
    u_xlat15 = u_xlat1.w * u_xlat15 + u_xlat1.x;
    u_xlat10.x = u_xlat15 * 0.5 + u_xlat10.x;
    u_xlat10.x = u_xlat10.x + -0.5;
    u_xlat1.xy = u_xlat0.xy + hlslcc_mtx4x4unity_ObjectToWorld[3].xy;
    u_xlat0.xy = u_xlat0.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x).x;
    u_xlat1.z = u_xlat1.x * 0.5 + u_xlat1.y;
    u_xlat5.xy = u_xlat10.xx * vec2(0.5, 0.5) + u_xlat1.xz;
    u_xlat5.xy = u_xlat5.xy * vec2(vec2(_Scale, _Scale));
    u_xlat1.xy = fract(u_xlat5.xy);
    u_xlat5.xy = floor(u_xlat5.xy);
    u_xlat11.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat11.xy = u_xlat1.xy * u_xlat11.xy;
    u_xlat2.xy = u_xlat1.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat1.xy * u_xlat2.xy + vec2(10.0, 10.0);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.xy = u_xlat5.xy + vec2(1.0, 1.0);
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
    u_xlat7.x = floor(u_xlat2.y);
    u_xlat2.x = u_xlat15 * 5.96046519e-08 + (-u_xlat7.x);
    u_xlat15 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat15 = inversesqrt(u_xlat15);
    u_xlat2.xy = vec2(u_xlat15) * u_xlat2.xz;
    u_xlat12.xy = u_xlat1.xy + vec2(-1.0, -1.0);
    u_xlat15 = dot(u_xlat2.xy, u_xlat12.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat3 = u_xlat5.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati5.xy = ivec2(u_xlat5.xy);
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
    u_xlati10 = int(uint(uint(u_xlati5.y) ^ 1103515245u));
    u_xlati5.x = u_xlati10 + u_xlati5.x;
    u_xlatu5 = uint(u_xlati10) * uint(u_xlati5.x);
    u_xlatu10 = uint(u_xlatu5 >> (5u & uint(0x1F)));
    u_xlati5.x = int(uint(u_xlatu10 ^ u_xlatu5));
    u_xlatu5 = uint(u_xlati5.x) * 668265261u;
    u_xlatu5 = uint(u_xlatu5 >> (8u & uint(0x1F)));
    u_xlat5.x = float(u_xlatu5);
    u_xlat3.yz = u_xlat5.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat3.y);
    u_xlat3.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat5.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat5.x = inversesqrt(u_xlat5.x);
    u_xlat5.xy = u_xlat5.xx * u_xlat3.xz;
    u_xlat5.x = dot(u_xlat5.xy, u_xlat1.xy);
    u_xlat10.x = (-u_xlat5.x) + u_xlat2.x;
    u_xlat5.x = u_xlat11.y * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.x) + u_xlat15;
    u_xlat5.x = u_xlat11.x * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x + 0.5;
    u_xlat5.x = u_xlat5.x + (-_Patch);
    u_xlat10.x = ceil(u_xlat5.x);
    u_xlat15 = (-u_xlat10.x) + 1.0;
    u_xlat10.x = (-u_xlat15) + u_xlat10.x;
    u_xlat1.x = _Patch + -0.5;
    u_xlat1.x = ceil(u_xlat1.x);
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat15;
    u_xlat15 = u_xlat16_0 + (-_Threshold);
    u_xlat15 = ceil(u_xlat15);
    u_xlat10.x = u_xlat15 * u_xlat10.x;
    u_xlat15 = u_xlat16_0 * _Delta + (-u_xlat16_0);
    u_xlat0.x = u_xlat10.x * u_xlat15 + u_xlat16_0;
    u_xlat10.x = _Scale * _Line;
    u_xlat10.xy = u_xlat10.xx * vec2(0.5, -0.5);
    u_xlat5.x = max(u_xlat10.y, u_xlat5.x);
    u_xlat5.x = min(u_xlat10.x, u_xlat5.x);
    u_xlat5.x = abs(u_xlat5.x) / u_xlat10.x;
    u_xlat5.x = (-u_xlat5.x) + 1.0;
    u_xlat5.x = u_xlat5.x * 4.0;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat10.x = (-_Delta) + 0.300000012;
    u_xlat10.x = _LineDarkness * u_xlat10.x + _Delta;
    u_xlat10.x = u_xlat10.x + -1.0;
    u_xlat5.x = u_xlat5.x * u_xlat10.x + 1.0;
    u_xlat0.x = min(u_xlat5.x, u_xlat0.x);
    u_xlat5.x = (-_Delta) * 0.899999976 + u_xlat0.x;
    u_xlat10.x = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat5.x = u_xlat5.x / u_xlat10.x;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat5.xy = (-u_xlat5.xx) + vec2(1.0, 1.25);
    u_xlat5.x = u_xlat5.x * _HueSpan + _Hue;
    u_xlat10.x = roundEven(u_xlat5.y);
    u_xlat5.x = u_xlat10.x * u_xlat5.x;
    u_xlat15 = _Saturation + -1.0;
    u_xlat10.x = u_xlat10.x * u_xlat15 + 1.0;
    u_xlat15 = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat1.xyz = (-vec3(u_xlat15)) + vs_INTERP1.xyz;
    u_xlat1.xyw = u_xlat10.xxx * u_xlat1.yzx + vec3(u_xlat15);
    u_xlatb10 = u_xlat1.x>=u_xlat1.y;
    u_xlat10.x = u_xlatb10 ? 1.0 : float(0.0);
    u_xlat2.xy = u_xlat1.yx;
    u_xlat3.xy = u_xlat1.xy + (-u_xlat2.xy);
    u_xlat2.z = float(-1.0);
    u_xlat2.w = float(0.666666687);
    u_xlat3.z = float(1.0);
    u_xlat3.w = float(-1.0);
    u_xlat2 = u_xlat10.xxxx * u_xlat3 + u_xlat2;
    u_xlatb10 = u_xlat1.w>=u_xlat2.x;
    u_xlat10.x = u_xlatb10 ? 1.0 : float(0.0);
    u_xlat1.xyz = u_xlat2.xyw;
    u_xlat2.xyw = u_xlat1.wyx;
    u_xlat2 = (-u_xlat1) + u_xlat2;
    u_xlat1 = u_xlat10.xxxx * u_xlat2 + u_xlat1;
    u_xlat10.x = (-u_xlat1.y) + u_xlat1.w;
    u_xlat15 = min(u_xlat1.y, u_xlat1.w);
    u_xlat15 = (-u_xlat15) + u_xlat1.x;
    u_xlat6.x = u_xlat15 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat6.x;
    u_xlat10.x = u_xlat10.x + u_xlat1.z;
    u_xlat5.x = u_xlat5.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = 1.0<u_xlat5.x;
    u_xlat6.xy = u_xlat5.xx + vec2(1.0, -1.0);
    u_xlat10.x = (u_xlatb10) ? u_xlat6.y : u_xlat5.x;
    u_xlatb5 = u_xlat5.x<0.0;
    u_xlat5.x = (u_xlatb5) ? u_xlat6.x : u_xlat10.x;
    u_xlat6.xyz = u_xlat5.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat6.xyz = fract(u_xlat6.xyz);
    u_xlat6.xyz = u_xlat6.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat6.xyz = abs(u_xlat6.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat6.xyz = clamp(u_xlat6.xyz, 0.0, 1.0);
    u_xlat6.xyz = u_xlat6.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat5.x = u_xlat1.x + 1.00000001e-10;
    u_xlat10.x = u_xlat15 / u_xlat5.x;
    u_xlatb15 = u_xlat15==0.0;
    u_xlat5.x = (u_xlatb15) ? u_xlat1.x : u_xlat5.x;
    u_xlat1.xyz = u_xlat10.xxx * u_xlat6.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat5.xyz = u_xlat5.xxx * u_xlat1.xyz;
    u_xlat0.xyz = u_xlat5.xyz * u_xlat0.xxx;
    SV_TARGET0.xyz = u_xlat0.xyz;
    SV_TARGET0.w = 1.0;
    return;
}

#endif
          ºu
                         SKINNED_SPRITE  ©X  #ifdef VERTEX


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
out highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
highp vec3 vs_INTERP2;
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
uniform 	vec2 _GlobalMipBias;
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
	UNITY_UNIFORM vec4                _MainTex_ST;
	UNITY_UNIFORM float                _Patch;
	UNITY_UNIFORM float                _Line;
	UNITY_UNIFORM float                _Scale;
	UNITY_UNIFORM float                _LineDarkness;
	UNITY_UNIFORM float                _RidgeScale;
	UNITY_UNIFORM float                _Threshold;
	UNITY_UNIFORM float                _Hue;
	UNITY_UNIFORM float                _HueSpan;
	UNITY_UNIFORM float                _Delta;
	UNITY_UNIFORM float                _Saturation;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uvec2 u_xlatu1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec4 u_xlatu3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec3 u_xlat5;
ivec2 u_xlati5;
uint u_xlatu5;
bool u_xlatb5;
vec3 u_xlat6;
int u_xlati6;
uint u_xlatu6;
vec2 u_xlat7;
ivec3 u_xlati7;
ivec3 u_xlati8;
vec2 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
vec2 u_xlat13;
ivec2 u_xlati13;
uvec2 u_xlatu13;
float u_xlat15;
int u_xlati15;
uint u_xlatu15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.x = roundEven(vs_INTERP1.w);
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * 2.0 + -1.0;
    u_xlat0.x = u_xlat0.x * vs_INTERP0.x;
    u_xlat0.y = vs_INTERP0.y;
    u_xlat10.xy = u_xlat0.xy * vec2(_RidgeScale);
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat11.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati11.xy = ivec2(u_xlat11.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2 = u_xlat1.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat16 = u_xlat2.y * 5.96046519e-08;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat10.xy = (-u_xlat10.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat11.x = u_xlat10.x * u_xlat11.x + u_xlat16;
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1.x = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1.x >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1.x));
    u_xlatu1.x = uint(u_xlati1.x) * 668265261u;
    u_xlatu1.x = uint(u_xlatu1.x >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1.x);
    u_xlat1.x = u_xlat1.x * 5.96046519e-08;
    u_xlat6.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat1.x);
    u_xlat10.x = u_xlat10.x * u_xlat6.x + u_xlat1.x;
    u_xlat1.x = (-u_xlat10.x) + u_xlat11.x;
    u_xlat10.x = u_xlat10.y * u_xlat1.x + u_xlat10.x;
    u_xlat1.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat1 = u_xlat0.xyxy * u_xlat1.xxyy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat2 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati8.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati8.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati8.xz) * uvec2(u_xlati3.xz);
    u_xlatu13.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu3.x, u_xlatu13.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat4 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati13.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati13.xy + u_xlati4.xz;
    u_xlatu13.xy = uvec2(u_xlati13.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu13.x >> (uint(5u) & uint(0x1F)), u_xlatu13.y >> (uint(5u) & uint(0x1F)));
    u_xlati13.xy = ivec2(uvec2(u_xlatu13.x ^ u_xlatu4.x, u_xlatu13.y ^ u_xlatu4.y));
    u_xlatu13.xy = uvec2(u_xlati13.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.zw = uvec2(u_xlatu13.x >> (uint(8u) & uint(0x1F)), u_xlatu13.y >> (uint(8u) & uint(0x1F)));
    u_xlat3 = vec4(u_xlatu3);
    u_xlat15 = u_xlat3.w * 5.96046519e-08;
    u_xlat3.x = u_xlat3.x * 5.96046519e-08 + (-u_xlat15);
    u_xlat4 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat4;
    u_xlat15 = u_xlat1.x * u_xlat3.x + u_xlat15;
    u_xlati4 = ivec4(u_xlat2);
    u_xlat2 = u_xlat2.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati3.xw = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati3.xw + u_xlati4.xz;
    u_xlatu3.xw = uvec2(u_xlati3.xw) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.w >> (uint(5u) & uint(0x1F)));
    u_xlati3.xw = ivec2(uvec2(u_xlatu3.x ^ u_xlatu4.x, u_xlatu3.w ^ u_xlatu4.y));
    u_xlatu3.xw = uvec2(u_xlati3.xw) * uvec2(668265261u, 668265261u);
    u_xlatu3.xw = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.w >> (uint(8u) & uint(0x1F)));
    u_xlat3.xw = vec2(u_xlatu3.xw);
    u_xlat3.xw = u_xlat3.xw * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlat13.x = u_xlat3.z * 5.96046519e-08 + (-u_xlat3.x);
    u_xlat1.x = u_xlat1.x * u_xlat13.x + u_xlat3.x;
    u_xlat15 = u_xlat15 + (-u_xlat1.x);
    u_xlat15 = u_xlat1.y * u_xlat15 + u_xlat1.x;
    u_xlat15 = u_xlat15 * 0.25;
    u_xlat10.x = u_xlat10.x * 0.125 + u_xlat15;
    u_xlati1.xy = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xy = u_xlati1.xy + u_xlati2.xz;
    u_xlatu1.xy = uvec2(u_xlati1.xy) * uvec2(u_xlati2.xy);
    u_xlatu2.xy = uvec2(u_xlatu1.x >> (uint(5u) & uint(0x1F)), u_xlatu1.y >> (uint(5u) & uint(0x1F)));
    u_xlati1.xy = ivec2(uvec2(u_xlatu1.x ^ u_xlatu2.x, u_xlatu1.y ^ u_xlatu2.y));
    u_xlatu1.xy = uvec2(u_xlati1.xy) * uvec2(668265261u, 668265261u);
    u_xlatu1.xy = uvec2(u_xlatu1.x >> (uint(8u) & uint(0x1F)), u_xlatu1.y >> (uint(8u) & uint(0x1F)));
    u_xlat1.xy = vec2(u_xlatu1.xy);
    u_xlat15 = u_xlat1.y * 5.96046519e-08;
    u_xlat1.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat3.w);
    u_xlat1.x = u_xlat1.z * u_xlat1.x + u_xlat3.w;
    u_xlat6.x = u_xlat3.y * 5.96046519e-08 + (-u_xlat15);
    u_xlat15 = u_xlat1.z * u_xlat6.x + u_xlat15;
    u_xlat15 = (-u_xlat1.x) + u_xlat15;
    u_xlat15 = u_xlat1.w * u_xlat15 + u_xlat1.x;
    u_xlat10.x = u_xlat15 * 0.5 + u_xlat10.x;
    u_xlat10.x = u_xlat10.x + -0.5;
    u_xlat1.xy = u_xlat0.xy + hlslcc_mtx4x4unity_ObjectToWorld[3].xy;
    u_xlat0.xy = u_xlat0.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x).x;
    u_xlat1.z = u_xlat1.x * 0.5 + u_xlat1.y;
    u_xlat5.xy = u_xlat10.xx * vec2(0.5, 0.5) + u_xlat1.xz;
    u_xlat5.xy = u_xlat5.xy * vec2(vec2(_Scale, _Scale));
    u_xlat1.xy = fract(u_xlat5.xy);
    u_xlat5.xy = floor(u_xlat5.xy);
    u_xlat11.xy = u_xlat1.xy * u_xlat1.xy;
    u_xlat11.xy = u_xlat1.xy * u_xlat11.xy;
    u_xlat2.xy = u_xlat1.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat1.xy * u_xlat2.xy + vec2(10.0, 10.0);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.xy = u_xlat5.xy + vec2(1.0, 1.0);
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
    u_xlat7.x = floor(u_xlat2.y);
    u_xlat2.x = u_xlat15 * 5.96046519e-08 + (-u_xlat7.x);
    u_xlat15 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat15 = inversesqrt(u_xlat15);
    u_xlat2.xy = vec2(u_xlat15) * u_xlat2.xz;
    u_xlat12.xy = u_xlat1.xy + vec2(-1.0, -1.0);
    u_xlat15 = dot(u_xlat2.xy, u_xlat12.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat3 = u_xlat5.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati5.xy = ivec2(u_xlat5.xy);
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
    u_xlati10 = int(uint(uint(u_xlati5.y) ^ 1103515245u));
    u_xlati5.x = u_xlati10 + u_xlati5.x;
    u_xlatu5 = uint(u_xlati10) * uint(u_xlati5.x);
    u_xlatu10 = uint(u_xlatu5 >> (5u & uint(0x1F)));
    u_xlati5.x = int(uint(u_xlatu10 ^ u_xlatu5));
    u_xlatu5 = uint(u_xlati5.x) * 668265261u;
    u_xlatu5 = uint(u_xlatu5 >> (8u & uint(0x1F)));
    u_xlat5.x = float(u_xlatu5);
    u_xlat3.yz = u_xlat5.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat3.y);
    u_xlat3.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat5.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat5.x = inversesqrt(u_xlat5.x);
    u_xlat5.xy = u_xlat5.xx * u_xlat3.xz;
    u_xlat5.x = dot(u_xlat5.xy, u_xlat1.xy);
    u_xlat10.x = (-u_xlat5.x) + u_xlat2.x;
    u_xlat5.x = u_xlat11.y * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.x) + u_xlat15;
    u_xlat5.x = u_xlat11.x * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x + 0.5;
    u_xlat5.x = u_xlat5.x + (-_Patch);
    u_xlat10.x = ceil(u_xlat5.x);
    u_xlat15 = (-u_xlat10.x) + 1.0;
    u_xlat10.x = (-u_xlat15) + u_xlat10.x;
    u_xlat1.x = _Patch + -0.5;
    u_xlat1.x = ceil(u_xlat1.x);
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat15;
    u_xlat15 = u_xlat16_0 + (-_Threshold);
    u_xlat15 = ceil(u_xlat15);
    u_xlat10.x = u_xlat15 * u_xlat10.x;
    u_xlat15 = u_xlat16_0 * _Delta + (-u_xlat16_0);
    u_xlat0.x = u_xlat10.x * u_xlat15 + u_xlat16_0;
    u_xlat10.x = _Scale * _Line;
    u_xlat10.xy = u_xlat10.xx * vec2(0.5, -0.5);
    u_xlat5.x = max(u_xlat10.y, u_xlat5.x);
    u_xlat5.x = min(u_xlat10.x, u_xlat5.x);
    u_xlat5.x = abs(u_xlat5.x) / u_xlat10.x;
    u_xlat5.x = (-u_xlat5.x) + 1.0;
    u_xlat5.x = u_xlat5.x * 4.0;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat10.x = (-_Delta) + 0.300000012;
    u_xlat10.x = _LineDarkness * u_xlat10.x + _Delta;
    u_xlat10.x = u_xlat10.x + -1.0;
    u_xlat5.x = u_xlat5.x * u_xlat10.x + 1.0;
    u_xlat0.x = min(u_xlat5.x, u_xlat0.x);
    u_xlat5.x = (-_Delta) * 0.899999976 + u_xlat0.x;
    u_xlat10.x = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat5.x = u_xlat5.x / u_xlat10.x;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat5.xy = (-u_xlat5.xx) + vec2(1.0, 1.25);
    u_xlat5.x = u_xlat5.x * _HueSpan + _Hue;
    u_xlat10.x = roundEven(u_xlat5.y);
    u_xlat5.x = u_xlat10.x * u_xlat5.x;
    u_xlat15 = _Saturation + -1.0;
    u_xlat10.x = u_xlat10.x * u_xlat15 + 1.0;
    u_xlat15 = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat1.xyz = (-vec3(u_xlat15)) + vs_INTERP1.xyz;
    u_xlat1.xyw = u_xlat10.xxx * u_xlat1.yzx + vec3(u_xlat15);
    u_xlatb10 = u_xlat1.x>=u_xlat1.y;
    u_xlat10.x = u_xlatb10 ? 1.0 : float(0.0);
    u_xlat2.xy = u_xlat1.yx;
    u_xlat3.xy = u_xlat1.xy + (-u_xlat2.xy);
    u_xlat2.z = float(-1.0);
    u_xlat2.w = float(0.666666687);
    u_xlat3.z = float(1.0);
    u_xlat3.w = float(-1.0);
    u_xlat2 = u_xlat10.xxxx * u_xlat3 + u_xlat2;
    u_xlatb10 = u_xlat1.w>=u_xlat2.x;
    u_xlat10.x = u_xlatb10 ? 1.0 : float(0.0);
    u_xlat1.xyz = u_xlat2.xyw;
    u_xlat2.xyw = u_xlat1.wyx;
    u_xlat2 = (-u_xlat1) + u_xlat2;
    u_xlat1 = u_xlat10.xxxx * u_xlat2 + u_xlat1;
    u_xlat10.x = (-u_xlat1.y) + u_xlat1.w;
    u_xlat15 = min(u_xlat1.y, u_xlat1.w);
    u_xlat15 = (-u_xlat15) + u_xlat1.x;
    u_xlat6.x = u_xlat15 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat6.x;
    u_xlat10.x = u_xlat10.x + u_xlat1.z;
    u_xlat5.x = u_xlat5.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = 1.0<u_xlat5.x;
    u_xlat6.xy = u_xlat5.xx + vec2(1.0, -1.0);
    u_xlat10.x = (u_xlatb10) ? u_xlat6.y : u_xlat5.x;
    u_xlatb5 = u_xlat5.x<0.0;
    u_xlat5.x = (u_xlatb5) ? u_xlat6.x : u_xlat10.x;
    u_xlat6.xyz = u_xlat5.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat6.xyz = fract(u_xlat6.xyz);
    u_xlat6.xyz = u_xlat6.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat6.xyz = abs(u_xlat6.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat6.xyz = clamp(u_xlat6.xyz, 0.0, 1.0);
    u_xlat6.xyz = u_xlat6.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat5.x = u_xlat1.x + 1.00000001e-10;
    u_xlat10.x = u_xlat15 / u_xlat5.x;
    u_xlatb15 = u_xlat15==0.0;
    u_xlat5.x = (u_xlatb15) ? u_xlat1.x : u_xlat5.x;
    u_xlat1.xyz = u_xlat10.xxx * u_xlat6.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat5.xyz = u_xlat5.xxx * u_xlat1.xyz;
    u_xlat0.xyz = u_xlat5.xyz * u_xlat0.xxx;
    SV_TARGET0.xyz = u_xlat0.xyz;
    SV_TARGET0.w = 1.0;
    return;
}

#endif
          
