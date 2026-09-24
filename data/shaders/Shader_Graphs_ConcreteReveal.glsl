// Shader Graphs/ConcreteReveal
// sacado de sharedassets70.assets
// declara: White, _Delta, _Hue, _HueSpan, _Line, _LineDarkness, _MainTex, _Patch, _RevealOffset, _RevealThreshold, _RidgeScale, _Saturation, _Scale, _Threshold, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
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
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec2 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec2 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
bool u_xlatb3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec4 u_xlat5;
ivec4 u_xlati5;
uvec2 u_xlatu5;
vec4 u_xlat6;
ivec4 u_xlati7;
vec3 u_xlat8;
mediump float u_xlat16_8;
bool u_xlatb8;
vec3 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec3 u_xlat11;
ivec3 u_xlati11;
uvec3 u_xlatu11;
ivec3 u_xlati12;
ivec3 u_xlati13;
vec2 u_xlat16;
vec2 u_xlat18;
ivec2 u_xlati18;
uint u_xlatu18;
bool u_xlatb18;
vec2 u_xlat19;
uvec2 u_xlatu19;
uvec2 u_xlatu20;
uvec2 u_xlatu21;
float u_xlat24;
bool u_xlatb24;
float u_xlat26;
int u_xlati26;
uint u_xlatu26;
float u_xlat27;
int u_xlati27;
uint u_xlatu27;
void main()
{
    u_xlat0.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat0.x = dot(u_xlat0.xy, u_xlat0.xy);
    u_xlat0.x = u_xlat0.x + (-_RevealThreshold);
    u_xlat1.w = ceil(u_xlat0.x);
    u_xlat1.w = clamp(u_xlat1.w, 0.0, 1.0);
    u_xlatb8 = u_xlat1.w==0.0;
    if(u_xlatb8){discard;}
    u_xlat8.x = roundEven(vs_INTERP1.w);
    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);
    u_xlat8.x = u_xlat8.x * 2.0 + -1.0;
    u_xlat2.x = u_xlat8.x * vs_INTERP0.x;
    u_xlat2.y = vs_INTERP0.y;
    u_xlat8.xy = u_xlat2.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_8 = texture(_MainTex, u_xlat8.xy, _GlobalMipBias.x).x;
    u_xlat3.xy = u_xlat2.xy + hlslcc_mtx4x4unity_ObjectToWorld[3].xy;
    u_xlat3.z = u_xlat3.x * 0.5 + u_xlat3.y;
    u_xlat16.xy = u_xlat2.xy * vec2(_RidgeScale);
    u_xlat18.xy = floor(u_xlat16.xy);
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlat11.xz = u_xlat16.xy * u_xlat16.xy;
    u_xlat16.xy = (-u_xlat16.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat11.xz;
    u_xlat4 = u_xlat18.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat11.xz = u_xlat18.xy + vec2(1.0, 1.0);
    u_xlati18.xy = ivec2(u_xlat18.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat18.x = u_xlat18.x * 5.96046519e-08;
    u_xlati4 = ivec4(u_xlat4);
    u_xlati12.xz = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xz = u_xlati12.xz + u_xlati4.xz;
    u_xlatu4.xy = uvec2(u_xlati12.xz) * uvec2(u_xlati4.xz);
    u_xlatu20.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu20.x ^ u_xlatu4.x, u_xlatu20.y ^ u_xlatu4.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat26 = u_xlat4.y * 5.96046519e-08;
    u_xlati11.xz = ivec2(u_xlat11.xz);
    u_xlati27 = int(uint(uint(u_xlati11.z) ^ 1103515245u));
    u_xlati11.x = u_xlati27 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati27) * uint(u_xlati11.x);
    u_xlatu27 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu27 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat27 = u_xlat4.x * 5.96046519e-08 + (-u_xlat18.x);
    u_xlat18.x = u_xlat16.x * u_xlat27 + u_xlat18.x;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat16.x = u_xlat16.x * u_xlat11.x + u_xlat26;
    u_xlat16.x = (-u_xlat18.x) + u_xlat16.x;
    u_xlat16.x = u_xlat16.y * u_xlat16.x + u_xlat18.x;
    u_xlat18.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat2 = u_xlat18.xxyy * u_xlat2.xyxy;
    u_xlat4 = floor(u_xlat2);
    u_xlat2 = fract(u_xlat2);
    u_xlat5 = u_xlat2 * u_xlat2;
    u_xlat2 = (-u_xlat2) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat2 = u_xlat2 * u_xlat5;
    u_xlat5 = u_xlat4.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat6 = u_xlat4 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati7 = ivec4(u_xlat4);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati7.y) ^ uint(1103515245u), uint(u_xlati7.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati11.xz + u_xlati7.xz;
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.z >> (uint(5u) & uint(0x1F)));
    u_xlati11.xz = ivec2(uvec2(u_xlatu11.x ^ u_xlatu4.x, u_xlatu11.z ^ u_xlatu4.y));
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(668265261u, 668265261u);
    u_xlatu11.xz = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.z >> (uint(8u) & uint(0x1F)));
    u_xlat11.xz = vec2(u_xlatu11.xz);
    u_xlat11.xz = u_xlat11.xz * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlati5 = ivec4(u_xlat5);
    u_xlati4.xy = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xy = u_xlati4.xy + u_xlati5.xz;
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(u_xlati5.xy);
    u_xlatu5.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu4.x ^ u_xlatu5.x, u_xlatu4.y ^ u_xlatu5.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat24 = u_xlat4.y * 5.96046519e-08;
    u_xlati5 = ivec4(u_xlat6);
    u_xlati13.xz = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xz = u_xlati13.xz + u_xlati5.xz;
    u_xlatu5.xy = uvec2(u_xlati13.xz) * uvec2(u_xlati5.xz);
    u_xlatu21.xy = uvec2(u_xlatu5.x >> (uint(5u) & uint(0x1F)), u_xlatu5.y >> (uint(5u) & uint(0x1F)));
    u_xlati5.xy = ivec2(uvec2(u_xlatu21.x ^ u_xlatu5.x, u_xlatu21.y ^ u_xlatu5.y));
    u_xlatu5.xy = uvec2(u_xlati5.xy) * uvec2(668265261u, 668265261u);
    u_xlatu5.xy = uvec2(u_xlatu5.x >> (uint(8u) & uint(0x1F)), u_xlatu5.y >> (uint(8u) & uint(0x1F)));
    u_xlat5.xy = vec2(u_xlatu5.xy);
    u_xlat4.x = u_xlat4.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat4.x + u_xlat11.x;
    u_xlat4.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.x * u_xlat4.x + u_xlat24;
    u_xlat24 = (-u_xlat11.x) + u_xlat24;
    u_xlat24 = u_xlat2.y * u_xlat24 + u_xlat11.x;
    u_xlat24 = u_xlat24 * 0.25;
    u_xlat16.x = u_xlat16.x * 0.125 + u_xlat24;
    u_xlat4 = u_xlat4.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati2.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati2.xy + u_xlati4.xz;
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu2.x ^ u_xlatu4.x, u_xlatu2.y ^ u_xlatu4.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat24 = u_xlat2.y * 5.96046519e-08;
    u_xlat2.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.z);
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat11.z;
    u_xlat10.x = u_xlat5.y * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.z * u_xlat10.x + u_xlat24;
    u_xlat24 = (-u_xlat2.x) + u_xlat24;
    u_xlat24 = u_xlat2.w * u_xlat24 + u_xlat2.x;
    u_xlat16.x = u_xlat24 * 0.5 + u_xlat16.x;
    u_xlat16.x = u_xlat16.x + -0.5;
    u_xlat16.xy = u_xlat16.xx * vec2(0.5, 0.5) + u_xlat3.xz;
    u_xlat16.xy = u_xlat16.xy * vec2(vec2(_Scale, _Scale));
    u_xlat2.xy = floor(u_xlat16.xy);
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlati18.xy = ivec2(u_xlat2.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat3.yz = u_xlat18.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat26 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat18.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat18.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat18.x = inversesqrt(u_xlat18.x);
    u_xlat18.xy = u_xlat18.xx * u_xlat3.xz;
    u_xlat18.x = dot(u_xlat18.xy, u_xlat16.xy);
    u_xlat3 = u_xlat2.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati11.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati11.xz) * uvec2(u_xlati3.xz);
    u_xlatu19.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu19.x ^ u_xlatu3.x, u_xlatu19.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat19.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat19.xy);
    u_xlat26 = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat26 = inversesqrt(u_xlat26);
    u_xlat3.xy = vec2(u_xlat26) * u_xlat4.xz;
    u_xlat5 = u_xlat16.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat26 = dot(u_xlat3.xy, u_xlat5.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat5.zw);
    u_xlat2.xy = u_xlat2.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati10 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati10 + u_xlati2.x;
    u_xlatu2.x = uint(u_xlati10) * uint(u_xlati2.x);
    u_xlatu10 = uint(u_xlatu2.x >> (5u & uint(0x1F)));
    u_xlati2.x = int(uint(u_xlatu10 ^ u_xlatu2.x));
    u_xlatu2.x = uint(u_xlati2.x) * 668265261u;
    u_xlatu2.x = uint(u_xlatu2.x >> (8u & uint(0x1F)));
    u_xlat2.x = float(u_xlatu2.x);
    u_xlat4.yz = u_xlat2.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat4.y);
    u_xlat4.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat2.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat4.xz;
    u_xlat11.xy = u_xlat16.xy + vec2(-1.0, -1.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat11.xy);
    u_xlat11.xy = u_xlat16.xy * u_xlat16.xy;
    u_xlat11.xy = u_xlat16.xy * u_xlat11.xy;
    u_xlat4.xy = u_xlat16.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.xy + vec2(10.0, 10.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat11.xy;
    u_xlat10.x = (-u_xlat18.x) + u_xlat26;
    u_xlat10.x = u_xlat16.y * u_xlat10.x + u_xlat18.x;
    u_xlat2.x = (-u_xlat3.x) + u_xlat2.x;
    u_xlat24 = u_xlat16.y * u_xlat2.x + u_xlat3.x;
    u_xlat24 = (-u_xlat10.x) + u_xlat24;
    u_xlat16.x = u_xlat16.x * u_xlat24 + u_xlat10.x;
    u_xlat16.x = u_xlat16.x + 0.5;
    u_xlat16.x = u_xlat16.x + (-_Patch);
    u_xlat24 = ceil(u_xlat16.x);
    u_xlat2.x = (-u_xlat24) + 1.0;
    u_xlat10.x = _Patch + -0.5;
    u_xlat10.x = ceil(u_xlat10.x);
    u_xlat24 = u_xlat24 + (-u_xlat2.x);
    u_xlat24 = u_xlat10.x * u_xlat24 + u_xlat2.x;
    u_xlat2.x = u_xlat16_8 + (-_Threshold);
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat24 = u_xlat24 * u_xlat2.x;
    u_xlat2.x = u_xlat16_8 * _Delta + (-u_xlat16_8);
    u_xlat8.x = u_xlat24 * u_xlat2.x + u_xlat16_8;
    u_xlat24 = (-_Delta) + 0.300000012;
    u_xlat24 = _LineDarkness * u_xlat24 + _Delta;
    u_xlat2.x = _Scale * _Line;
    u_xlat2.xy = u_xlat2.xx * vec2(0.5, -0.5);
    u_xlat16.x = max(u_xlat16.x, u_xlat2.y);
    u_xlat16.x = min(u_xlat2.x, u_xlat16.x);
    u_xlat16.x = abs(u_xlat16.x) / u_xlat2.x;
    u_xlat16.x = (-u_xlat16.x) + 1.0;
    u_xlat16.x = u_xlat16.x * 4.0;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat24 = u_xlat24 + -1.0;
    u_xlat16.x = u_xlat16.x * u_xlat24 + 1.0;
    u_xlat8.x = min(u_xlat16.x, u_xlat8.x);
    u_xlat16.x = (-_Delta) * 0.899999976 + u_xlat8.x;
    u_xlat24 = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat16.x = u_xlat16.x / u_xlat24;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.xy = (-u_xlat16.xx) + vec2(1.0, 1.25);
    u_xlat24 = roundEven(u_xlat16.y);
    u_xlat2.x = _Saturation + -1.0;
    u_xlat2.x = u_xlat24 * u_xlat2.x + 1.0;
    u_xlat10.x = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat3.xyz = (-u_xlat10.xxx) + vs_INTERP1.xyz;
    u_xlat2.xyw = u_xlat2.xxx * u_xlat3.yzx + u_xlat10.xxx;
    u_xlat16.x = u_xlat16.x * _HueSpan + _Hue;
    u_xlat16.x = u_xlat24 * u_xlat16.x;
    u_xlatb24 = u_xlat2.x>=u_xlat2.y;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat3.xy = u_xlat2.yx;
    u_xlat3.z = float(-1.0);
    u_xlat3.w = float(0.666666687);
    u_xlat4.xy = u_xlat2.xy + (-u_xlat3.xy);
    u_xlat4.z = float(1.0);
    u_xlat4.w = float(-1.0);
    u_xlat3 = vec4(u_xlat24) * u_xlat4 + u_xlat3;
    u_xlatb24 = u_xlat2.w>=u_xlat3.x;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat2.xyz = u_xlat3.xyw;
    u_xlat3.xyw = u_xlat2.wyx;
    u_xlat3 = (-u_xlat2) + u_xlat3;
    u_xlat2 = vec4(u_xlat24) * u_xlat3 + u_xlat2;
    u_xlat24 = min(u_xlat2.y, u_xlat2.w);
    u_xlat24 = (-u_xlat24) + u_xlat2.x;
    u_xlatb3 = u_xlat24==0.0;
    u_xlat11.x = u_xlat2.x + 1.00000001e-10;
    u_xlat2.x = (u_xlatb3) ? u_xlat2.x : u_xlat11.x;
    u_xlat10.x = (-u_xlat2.y) + u_xlat2.w;
    u_xlat26 = u_xlat24 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat26;
    u_xlat10.x = u_xlat10.x + u_xlat2.z;
    u_xlat24 = u_xlat24 / u_xlat11.x;
    u_xlat16.x = u_xlat16.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = u_xlat16.x<0.0;
    u_xlatb18 = 1.0<u_xlat16.x;
    u_xlat3.xy = u_xlat16.xx + vec2(1.0, -1.0);
    u_xlat16.x = (u_xlatb18) ? u_xlat3.y : u_xlat16.x;
    u_xlat16.x = (u_xlatb10) ? u_xlat3.x : u_xlat16.x;
    u_xlat10.xyz = u_xlat16.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat10.xyz = fract(u_xlat10.xyz);
    u_xlat10.xyz = u_xlat10.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat10.xyz = abs(u_xlat10.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = clamp(u_xlat10.xyz, 0.0, 1.0);
    u_xlat10.xyz = u_xlat10.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = vec3(u_xlat24) * u_xlat10.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat10.xyz * u_xlat2.xxx;
    u_xlat3.xyz = u_xlat8.xxx * u_xlat2.xyz;
    u_xlat0.x = max(u_xlat0.x, 0.0);
    u_xlat16.x = sqrt(_RevealThreshold);
    u_xlat0.x = (-u_xlat16.x) * 0.100000001 + u_xlat0.x;
    u_xlat0.x = ceil((-u_xlat0.x));
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat1.w;
    u_xlat8.xyz = (-u_xlat8.xxx) * u_xlat2.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat3.xyz;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         INSTANCING_ON   T  #ifdef VERTEX


// ===== VERTICE =====
#version 300 es
#ifndef UNITY_RUNTIME_INSTANCING_ARRAY_SIZE
	#define UNITY_RUNTIME_INSTANCING_ARRAY_SIZE 2
#endif

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
uniform 	int unity_BaseInstanceID;
uniform 	mediump vec4 _RendererColor;
struct unity_Builtins0Array_Type {
	vec4 hlslcc_mtx4x4unity_ObjectToWorldArray[4];
	vec4 hlslcc_mtx4x4unity_WorldToObjectArray[4];
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityInstancing_PerDraw0 {
#endif
	UNITY_UNIFORM unity_Builtins0Array_Type                unity_Builtins0Array[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
struct PerDrawSpriteArray_Type {
	vec4 unity_SpriteRendererColorArray;
	vec2 unity_SpriteFlipArray;
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(2) uniform UnityInstancing_PerDrawSprite {
#endif
	UNITY_UNIFORM PerDrawSpriteArray_Type                PerDrawSpriteArray[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
out highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
out highp vec3 vs_INTERP2;
highp vec3 vs_INTERP3;
flat out highp uint vs_CUSTOM_INSTANCE_ID0;
float u_xlat0;
ivec2 u_xlati0;
vec4 u_xlat1;
vec4 u_xlat2;
vec2 u_xlat6;
void main()
{
    u_xlati0.x = gl_InstanceID + unity_BaseInstanceID;
    u_xlati0.xy = ivec2(u_xlati0.x << (int(1) & int(0x1F)), u_xlati0.x << (int(3) & int(0x1F)));
    u_xlat6.xy = in_POSITION0.xy * PerDrawSpriteArray[u_xlati0.x / 2].unity_SpriteFlipArray.xy;
    u_xlat1.xyz = u_xlat6.yyy * unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[1].xyz;
    u_xlat1.xyz = unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[0].xyz * u_xlat6.xxx + u_xlat1.xyz;
    u_xlat1.xyz = unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[2].xyz * in_POSITION0.zzz + u_xlat1.xyz;
    u_xlat1.xyz = u_xlat1.xyz + unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[3].xyz;
    u_xlat2 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat2;
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat2;
    vs_INTERP2.xyz = u_xlat1.xyz;
    gl_Position = u_xlat2 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    u_xlat1 = _RendererColor * PerDrawSpriteArray[u_xlati0.x / 2].unity_SpriteRendererColorArray;
    vs_INTERP1 = u_xlat1 * in_COLOR0;
    u_xlat1.x = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[0].xyz);
    u_xlat1.y = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[1].xyz);
    u_xlat1.z = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[2].xyz);
    u_xlat0 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat0 = max(u_xlat0, 1.17549435e-38);
    u_xlat0 = inversesqrt(u_xlat0);
    vs_INTERP3.xyz = vec3(u_xlat0) * u_xlat1.xyz;
    vs_CUSTOM_INSTANCE_ID0 =  uint(gl_InstanceID);
    return;
}

#endif
#ifdef FRAGMENT


// ===== FRAGMENTO =====
#version 300 es
#ifndef UNITY_RUNTIME_INSTANCING_ARRAY_SIZE
	#define UNITY_RUNTIME_INSTANCING_ARRAY_SIZE 2
#endif

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
uniform 	int unity_BaseInstanceID;
struct unity_Builtins0Array_Type {
	vec4 hlslcc_mtx4x4unity_ObjectToWorldArray[4];
	vec4 hlslcc_mtx4x4unity_WorldToObjectArray[4];
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityInstancing_PerDraw0 {
#endif
	UNITY_UNIFORM unity_Builtins0Array_Type                unity_Builtins0Array[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
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
in highp  vec3 vs_INTERP2;
flat in highp  uint vs_CUSTOM_INSTANCE_ID0;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec2 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec2 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
bool u_xlatb3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec4 u_xlat5;
ivec4 u_xlati5;
uvec2 u_xlatu5;
vec4 u_xlat6;
ivec4 u_xlati7;
vec3 u_xlat8;
int u_xlati8;
bool u_xlatb8;
vec3 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec3 u_xlat11;
ivec3 u_xlati11;
uvec3 u_xlatu11;
ivec3 u_xlati12;
ivec3 u_xlati13;
vec2 u_xlat16;
mediump float u_xlat16_16;
vec2 u_xlat18;
ivec2 u_xlati18;
uint u_xlatu18;
bool u_xlatb18;
vec2 u_xlat19;
uvec2 u_xlatu19;
uvec2 u_xlatu20;
uvec2 u_xlatu21;
float u_xlat24;
bool u_xlatb24;
float u_xlat26;
int u_xlati26;
uint u_xlatu26;
float u_xlat27;
int u_xlati27;
uint u_xlatu27;
void main()
{
    u_xlat0.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat0.x = dot(u_xlat0.xy, u_xlat0.xy);
    u_xlat0.x = u_xlat0.x + (-_RevealThreshold);
    u_xlat1.w = ceil(u_xlat0.x);
    u_xlat1.w = clamp(u_xlat1.w, 0.0, 1.0);
    u_xlatb8 = u_xlat1.w==0.0;
    if(u_xlatb8){discard;}
    u_xlati8 = int(vs_CUSTOM_INSTANCE_ID0) + unity_BaseInstanceID;
    u_xlat16.x = roundEven(vs_INTERP1.w);
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.x = u_xlat16.x * 2.0 + -1.0;
    u_xlat2.x = u_xlat16.x * vs_INTERP0.x;
    u_xlat2.y = vs_INTERP0.y;
    u_xlat16.xy = u_xlat2.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_16 = texture(_MainTex, u_xlat16.xy, _GlobalMipBias.x).x;
    u_xlati8 = int(u_xlati8 << (3 & int(0x1F)));
    u_xlat3.xy = u_xlat2.xy + unity_Builtins0Array[u_xlati8 / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[3].xy;
    u_xlat3.z = u_xlat3.x * 0.5 + u_xlat3.y;
    u_xlat8.xz = u_xlat2.xy * vec2(_RidgeScale);
    u_xlat18.xy = floor(u_xlat8.xz);
    u_xlat8.xz = fract(u_xlat8.xz);
    u_xlat11.xz = u_xlat8.xz * u_xlat8.xz;
    u_xlat8.xz = (-u_xlat8.xz) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat11.xz;
    u_xlat4 = u_xlat18.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat11.xz = u_xlat18.xy + vec2(1.0, 1.0);
    u_xlati18.xy = ivec2(u_xlat18.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat18.x = u_xlat18.x * 5.96046519e-08;
    u_xlati4 = ivec4(u_xlat4);
    u_xlati12.xz = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xz = u_xlati12.xz + u_xlati4.xz;
    u_xlatu4.xy = uvec2(u_xlati12.xz) * uvec2(u_xlati4.xz);
    u_xlatu20.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu20.x ^ u_xlatu4.x, u_xlatu20.y ^ u_xlatu4.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat26 = u_xlat4.y * 5.96046519e-08;
    u_xlati11.xz = ivec2(u_xlat11.xz);
    u_xlati27 = int(uint(uint(u_xlati11.z) ^ 1103515245u));
    u_xlati11.x = u_xlati27 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati27) * uint(u_xlati11.x);
    u_xlatu27 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu27 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat27 = u_xlat4.x * 5.96046519e-08 + (-u_xlat18.x);
    u_xlat18.x = u_xlat8.x * u_xlat27 + u_xlat18.x;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat8.x = u_xlat8.x * u_xlat11.x + u_xlat26;
    u_xlat8.x = (-u_xlat18.x) + u_xlat8.x;
    u_xlat8.x = u_xlat8.z * u_xlat8.x + u_xlat18.x;
    u_xlat18.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat2 = u_xlat18.xxyy * u_xlat2.xyxy;
    u_xlat4 = floor(u_xlat2);
    u_xlat2 = fract(u_xlat2);
    u_xlat5 = u_xlat2 * u_xlat2;
    u_xlat2 = (-u_xlat2) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat2 = u_xlat2 * u_xlat5;
    u_xlat5 = u_xlat4.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat6 = u_xlat4 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati7 = ivec4(u_xlat4);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati7.y) ^ uint(1103515245u), uint(u_xlati7.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati11.xz + u_xlati7.xz;
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.z >> (uint(5u) & uint(0x1F)));
    u_xlati11.xz = ivec2(uvec2(u_xlatu11.x ^ u_xlatu4.x, u_xlatu11.z ^ u_xlatu4.y));
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(668265261u, 668265261u);
    u_xlatu11.xz = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.z >> (uint(8u) & uint(0x1F)));
    u_xlat11.xz = vec2(u_xlatu11.xz);
    u_xlat11.xz = u_xlat11.xz * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlati5 = ivec4(u_xlat5);
    u_xlati4.xy = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xy = u_xlati4.xy + u_xlati5.xz;
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(u_xlati5.xy);
    u_xlatu5.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu4.x ^ u_xlatu5.x, u_xlatu4.y ^ u_xlatu5.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat24 = u_xlat4.y * 5.96046519e-08;
    u_xlati5 = ivec4(u_xlat6);
    u_xlati13.xz = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xz = u_xlati13.xz + u_xlati5.xz;
    u_xlatu5.xy = uvec2(u_xlati13.xz) * uvec2(u_xlati5.xz);
    u_xlatu21.xy = uvec2(u_xlatu5.x >> (uint(5u) & uint(0x1F)), u_xlatu5.y >> (uint(5u) & uint(0x1F)));
    u_xlati5.xy = ivec2(uvec2(u_xlatu21.x ^ u_xlatu5.x, u_xlatu21.y ^ u_xlatu5.y));
    u_xlatu5.xy = uvec2(u_xlati5.xy) * uvec2(668265261u, 668265261u);
    u_xlatu5.xy = uvec2(u_xlatu5.x >> (uint(8u) & uint(0x1F)), u_xlatu5.y >> (uint(8u) & uint(0x1F)));
    u_xlat5.xy = vec2(u_xlatu5.xy);
    u_xlat4.x = u_xlat4.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat4.x + u_xlat11.x;
    u_xlat4.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.x * u_xlat4.x + u_xlat24;
    u_xlat24 = (-u_xlat11.x) + u_xlat24;
    u_xlat24 = u_xlat2.y * u_xlat24 + u_xlat11.x;
    u_xlat24 = u_xlat24 * 0.25;
    u_xlat8.x = u_xlat8.x * 0.125 + u_xlat24;
    u_xlat4 = u_xlat4.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati2.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati2.xy + u_xlati4.xz;
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu2.x ^ u_xlatu4.x, u_xlatu2.y ^ u_xlatu4.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat24 = u_xlat2.y * 5.96046519e-08;
    u_xlat2.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.z);
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat11.z;
    u_xlat10.x = u_xlat5.y * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.z * u_xlat10.x + u_xlat24;
    u_xlat24 = (-u_xlat2.x) + u_xlat24;
    u_xlat24 = u_xlat2.w * u_xlat24 + u_xlat2.x;
    u_xlat8.x = u_xlat24 * 0.5 + u_xlat8.x;
    u_xlat8.x = u_xlat8.x + -0.5;
    u_xlat8.xz = u_xlat8.xx * vec2(0.5, 0.5) + u_xlat3.xz;
    u_xlat8.xz = u_xlat8.xz * vec2(vec2(_Scale, _Scale));
    u_xlat2.xy = floor(u_xlat8.xz);
    u_xlat8.xz = fract(u_xlat8.xz);
    u_xlati18.xy = ivec2(u_xlat2.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat3.yz = u_xlat18.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat26 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat18.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat18.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat18.x = inversesqrt(u_xlat18.x);
    u_xlat18.xy = u_xlat18.xx * u_xlat3.xz;
    u_xlat18.x = dot(u_xlat18.xy, u_xlat8.xz);
    u_xlat3 = u_xlat2.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati11.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati11.xz) * uvec2(u_xlati3.xz);
    u_xlatu19.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu19.x ^ u_xlatu3.x, u_xlatu19.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat19.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat19.xy);
    u_xlat26 = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat26 = inversesqrt(u_xlat26);
    u_xlat3.xy = vec2(u_xlat26) * u_xlat4.xz;
    u_xlat5 = u_xlat8.xzxz + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat26 = dot(u_xlat3.xy, u_xlat5.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat5.zw);
    u_xlat2.xy = u_xlat2.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati10 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati10 + u_xlati2.x;
    u_xlatu2.x = uint(u_xlati10) * uint(u_xlati2.x);
    u_xlatu10 = uint(u_xlatu2.x >> (5u & uint(0x1F)));
    u_xlati2.x = int(uint(u_xlatu10 ^ u_xlatu2.x));
    u_xlatu2.x = uint(u_xlati2.x) * 668265261u;
    u_xlatu2.x = uint(u_xlatu2.x >> (8u & uint(0x1F)));
    u_xlat2.x = float(u_xlatu2.x);
    u_xlat4.yz = u_xlat2.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat4.y);
    u_xlat4.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat2.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat4.xz;
    u_xlat11.xy = u_xlat8.xz + vec2(-1.0, -1.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat11.xy);
    u_xlat11.xy = u_xlat8.xz * u_xlat8.xz;
    u_xlat11.xy = u_xlat8.xz * u_xlat11.xy;
    u_xlat4.xy = u_xlat8.xz * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat4.xy + vec2(10.0, 10.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat11.xy;
    u_xlat10.x = (-u_xlat18.x) + u_xlat26;
    u_xlat10.x = u_xlat8.z * u_xlat10.x + u_xlat18.x;
    u_xlat2.x = (-u_xlat3.x) + u_xlat2.x;
    u_xlat24 = u_xlat8.z * u_xlat2.x + u_xlat3.x;
    u_xlat24 = (-u_xlat10.x) + u_xlat24;
    u_xlat8.x = u_xlat8.x * u_xlat24 + u_xlat10.x;
    u_xlat8.x = u_xlat8.x + 0.5;
    u_xlat8.x = u_xlat8.x + (-_Patch);
    u_xlat24 = ceil(u_xlat8.x);
    u_xlat2.x = (-u_xlat24) + 1.0;
    u_xlat10.x = _Patch + -0.5;
    u_xlat10.x = ceil(u_xlat10.x);
    u_xlat24 = u_xlat24 + (-u_xlat2.x);
    u_xlat24 = u_xlat10.x * u_xlat24 + u_xlat2.x;
    u_xlat2.x = u_xlat16_16 + (-_Threshold);
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat24 = u_xlat24 * u_xlat2.x;
    u_xlat2.x = u_xlat16_16 * _Delta + (-u_xlat16_16);
    u_xlat16.x = u_xlat24 * u_xlat2.x + u_xlat16_16;
    u_xlat24 = (-_Delta) + 0.300000012;
    u_xlat24 = _LineDarkness * u_xlat24 + _Delta;
    u_xlat2.x = _Scale * _Line;
    u_xlat2.xy = u_xlat2.xx * vec2(0.5, -0.5);
    u_xlat8.x = max(u_xlat8.x, u_xlat2.y);
    u_xlat8.x = min(u_xlat2.x, u_xlat8.x);
    u_xlat8.x = abs(u_xlat8.x) / u_xlat2.x;
    u_xlat8.x = (-u_xlat8.x) + 1.0;
    u_xlat8.x = u_xlat8.x * 4.0;
    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);
    u_xlat24 = u_xlat24 + -1.0;
    u_xlat8.x = u_xlat8.x * u_xlat24 + 1.0;
    u_xlat8.x = min(u_xlat8.x, u_xlat16.x);
    u_xlat16.x = (-_Delta) * 0.899999976 + u_xlat8.x;
    u_xlat24 = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat16.x = u_xlat16.x / u_xlat24;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.xy = (-u_xlat16.xx) + vec2(1.0, 1.25);
    u_xlat24 = roundEven(u_xlat16.y);
    u_xlat2.x = _Saturation + -1.0;
    u_xlat2.x = u_xlat24 * u_xlat2.x + 1.0;
    u_xlat10.x = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat3.xyz = (-u_xlat10.xxx) + vs_INTERP1.xyz;
    u_xlat2.xyw = u_xlat2.xxx * u_xlat3.yzx + u_xlat10.xxx;
    u_xlat16.x = u_xlat16.x * _HueSpan + _Hue;
    u_xlat16.x = u_xlat24 * u_xlat16.x;
    u_xlatb24 = u_xlat2.x>=u_xlat2.y;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat3.xy = u_xlat2.yx;
    u_xlat3.z = float(-1.0);
    u_xlat3.w = float(0.666666687);
    u_xlat4.xy = u_xlat2.xy + (-u_xlat3.xy);
    u_xlat4.z = float(1.0);
    u_xlat4.w = float(-1.0);
    u_xlat3 = vec4(u_xlat24) * u_xlat4 + u_xlat3;
    u_xlatb24 = u_xlat2.w>=u_xlat3.x;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat2.xyz = u_xlat3.xyw;
    u_xlat3.xyw = u_xlat2.wyx;
    u_xlat3 = (-u_xlat2) + u_xlat3;
    u_xlat2 = vec4(u_xlat24) * u_xlat3 + u_xlat2;
    u_xlat24 = min(u_xlat2.y, u_xlat2.w);
    u_xlat24 = (-u_xlat24) + u_xlat2.x;
    u_xlatb3 = u_xlat24==0.0;
    u_xlat11.x = u_xlat2.x + 1.00000001e-10;
    u_xlat2.x = (u_xlatb3) ? u_xlat2.x : u_xlat11.x;
    u_xlat10.x = (-u_xlat2.y) + u_xlat2.w;
    u_xlat26 = u_xlat24 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat26;
    u_xlat10.x = u_xlat10.x + u_xlat2.z;
    u_xlat24 = u_xlat24 / u_xlat11.x;
    u_xlat16.x = u_xlat16.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = u_xlat16.x<0.0;
    u_xlatb18 = 1.0<u_xlat16.x;
    u_xlat3.xy = u_xlat16.xx + vec2(1.0, -1.0);
    u_xlat16.x = (u_xlatb18) ? u_xlat3.y : u_xlat16.x;
    u_xlat16.x = (u_xlatb10) ? u_xlat3.x : u_xlat16.x;
    u_xlat10.xyz = u_xlat16.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat10.xyz = fract(u_xlat10.xyz);
    u_xlat10.xyz = u_xlat10.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat10.xyz = abs(u_xlat10.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = clamp(u_xlat10.xyz, 0.0, 1.0);
    u_xlat10.xyz = u_xlat10.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = vec3(u_xlat24) * u_xlat10.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat10.xyz * u_xlat2.xxx;
    u_xlat3.xyz = u_xlat8.xxx * u_xlat2.xyz;
    u_xlat0.x = max(u_xlat0.x, 0.0);
    u_xlat16.x = sqrt(_RevealThreshold);
    u_xlat0.x = (-u_xlat16.x) * 0.100000001 + u_xlat0.x;
    u_xlat0.x = ceil((-u_xlat0.x));
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat1.w;
    u_xlat8.xyz = (-u_xlat8.xxx) * u_xlat2.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat3.xyz;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         SKINNED_SPRITE  \  #ifdef VERTEX


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
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
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
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec2 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec2 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
bool u_xlatb3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec4 u_xlat5;
ivec4 u_xlati5;
uvec2 u_xlatu5;
vec4 u_xlat6;
ivec4 u_xlati7;
vec3 u_xlat8;
mediump float u_xlat16_8;
bool u_xlatb8;
vec3 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec3 u_xlat11;
ivec3 u_xlati11;
uvec3 u_xlatu11;
ivec3 u_xlati12;
ivec3 u_xlati13;
vec2 u_xlat16;
vec2 u_xlat18;
ivec2 u_xlati18;
uint u_xlatu18;
bool u_xlatb18;
vec2 u_xlat19;
uvec2 u_xlatu19;
uvec2 u_xlatu20;
uvec2 u_xlatu21;
float u_xlat24;
bool u_xlatb24;
float u_xlat26;
int u_xlati26;
uint u_xlatu26;
float u_xlat27;
int u_xlati27;
uint u_xlatu27;
void main()
{
    u_xlat0.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat0.x = dot(u_xlat0.xy, u_xlat0.xy);
    u_xlat0.x = u_xlat0.x + (-_RevealThreshold);
    u_xlat1.w = ceil(u_xlat0.x);
    u_xlat1.w = clamp(u_xlat1.w, 0.0, 1.0);
    u_xlatb8 = u_xlat1.w==0.0;
    if(u_xlatb8){discard;}
    u_xlat8.x = roundEven(vs_INTERP1.w);
    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);
    u_xlat8.x = u_xlat8.x * 2.0 + -1.0;
    u_xlat2.x = u_xlat8.x * vs_INTERP0.x;
    u_xlat2.y = vs_INTERP0.y;
    u_xlat8.xy = u_xlat2.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_8 = texture(_MainTex, u_xlat8.xy, _GlobalMipBias.x).x;
    u_xlat3.xy = u_xlat2.xy + hlslcc_mtx4x4unity_ObjectToWorld[3].xy;
    u_xlat3.z = u_xlat3.x * 0.5 + u_xlat3.y;
    u_xlat16.xy = u_xlat2.xy * vec2(_RidgeScale);
    u_xlat18.xy = floor(u_xlat16.xy);
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlat11.xz = u_xlat16.xy * u_xlat16.xy;
    u_xlat16.xy = (-u_xlat16.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat11.xz;
    u_xlat4 = u_xlat18.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat11.xz = u_xlat18.xy + vec2(1.0, 1.0);
    u_xlati18.xy = ivec2(u_xlat18.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat18.x = u_xlat18.x * 5.96046519e-08;
    u_xlati4 = ivec4(u_xlat4);
    u_xlati12.xz = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xz = u_xlati12.xz + u_xlati4.xz;
    u_xlatu4.xy = uvec2(u_xlati12.xz) * uvec2(u_xlati4.xz);
    u_xlatu20.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu20.x ^ u_xlatu4.x, u_xlatu20.y ^ u_xlatu4.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat26 = u_xlat4.y * 5.96046519e-08;
    u_xlati11.xz = ivec2(u_xlat11.xz);
    u_xlati27 = int(uint(uint(u_xlati11.z) ^ 1103515245u));
    u_xlati11.x = u_xlati27 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati27) * uint(u_xlati11.x);
    u_xlatu27 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu27 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat27 = u_xlat4.x * 5.96046519e-08 + (-u_xlat18.x);
    u_xlat18.x = u_xlat16.x * u_xlat27 + u_xlat18.x;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat16.x = u_xlat16.x * u_xlat11.x + u_xlat26;
    u_xlat16.x = (-u_xlat18.x) + u_xlat16.x;
    u_xlat16.x = u_xlat16.y * u_xlat16.x + u_xlat18.x;
    u_xlat18.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat2 = u_xlat18.xxyy * u_xlat2.xyxy;
    u_xlat4 = floor(u_xlat2);
    u_xlat2 = fract(u_xlat2);
    u_xlat5 = u_xlat2 * u_xlat2;
    u_xlat2 = (-u_xlat2) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat2 = u_xlat2 * u_xlat5;
    u_xlat5 = u_xlat4.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat6 = u_xlat4 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati7 = ivec4(u_xlat4);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati7.y) ^ uint(1103515245u), uint(u_xlati7.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati11.xz + u_xlati7.xz;
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.z >> (uint(5u) & uint(0x1F)));
    u_xlati11.xz = ivec2(uvec2(u_xlatu11.x ^ u_xlatu4.x, u_xlatu11.z ^ u_xlatu4.y));
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(668265261u, 668265261u);
    u_xlatu11.xz = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.z >> (uint(8u) & uint(0x1F)));
    u_xlat11.xz = vec2(u_xlatu11.xz);
    u_xlat11.xz = u_xlat11.xz * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlati5 = ivec4(u_xlat5);
    u_xlati4.xy = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xy = u_xlati4.xy + u_xlati5.xz;
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(u_xlati5.xy);
    u_xlatu5.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu4.x ^ u_xlatu5.x, u_xlatu4.y ^ u_xlatu5.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat24 = u_xlat4.y * 5.96046519e-08;
    u_xlati5 = ivec4(u_xlat6);
    u_xlati13.xz = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xz = u_xlati13.xz + u_xlati5.xz;
    u_xlatu5.xy = uvec2(u_xlati13.xz) * uvec2(u_xlati5.xz);
    u_xlatu21.xy = uvec2(u_xlatu5.x >> (uint(5u) & uint(0x1F)), u_xlatu5.y >> (uint(5u) & uint(0x1F)));
    u_xlati5.xy = ivec2(uvec2(u_xlatu21.x ^ u_xlatu5.x, u_xlatu21.y ^ u_xlatu5.y));
    u_xlatu5.xy = uvec2(u_xlati5.xy) * uvec2(668265261u, 668265261u);
    u_xlatu5.xy = uvec2(u_xlatu5.x >> (uint(8u) & uint(0x1F)), u_xlatu5.y >> (uint(8u) & uint(0x1F)));
    u_xlat5.xy = vec2(u_xlatu5.xy);
    u_xlat4.x = u_xlat4.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat4.x + u_xlat11.x;
    u_xlat4.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.x * u_xlat4.x + u_xlat24;
    u_xlat24 = (-u_xlat11.x) + u_xlat24;
    u_xlat24 = u_xlat2.y * u_xlat24 + u_xlat11.x;
    u_xlat24 = u_xlat24 * 0.25;
    u_xlat16.x = u_xlat16.x * 0.125 + u_xlat24;
    u_xlat4 = u_xlat4.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati2.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati2.xy + u_xlati4.xz;
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu2.x ^ u_xlatu4.x, u_xlatu2.y ^ u_xlatu4.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat24 = u_xlat2.y * 5.96046519e-08;
    u_xlat2.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.z);
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat11.z;
    u_xlat10.x = u_xlat5.y * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.z * u_xlat10.x + u_xlat24;
    u_xlat24 = (-u_xlat2.x) + u_xlat24;
    u_xlat24 = u_xlat2.w * u_xlat24 + u_xlat2.x;
    u_xlat16.x = u_xlat24 * 0.5 + u_xlat16.x;
    u_xlat16.x = u_xlat16.x + -0.5;
    u_xlat16.xy = u_xlat16.xx * vec2(0.5, 0.5) + u_xlat3.xz;
    u_xlat16.xy = u_xlat16.xy * vec2(vec2(_Scale, _Scale));
    u_xlat2.xy = floor(u_xlat16.xy);
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlati18.xy = ivec2(u_xlat2.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat3.yz = u_xlat18.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat26 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat18.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat18.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat18.x = inversesqrt(u_xlat18.x);
    u_xlat18.xy = u_xlat18.xx * u_xlat3.xz;
    u_xlat18.x = dot(u_xlat18.xy, u_xlat16.xy);
    u_xlat3 = u_xlat2.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati11.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati11.xz) * uvec2(u_xlati3.xz);
    u_xlatu19.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu19.x ^ u_xlatu3.x, u_xlatu19.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat19.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat19.xy);
    u_xlat26 = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat26 = inversesqrt(u_xlat26);
    u_xlat3.xy = vec2(u_xlat26) * u_xlat4.xz;
    u_xlat5 = u_xlat16.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat26 = dot(u_xlat3.xy, u_xlat5.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat5.zw);
    u_xlat2.xy = u_xlat2.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati10 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati10 + u_xlati2.x;
    u_xlatu2.x = uint(u_xlati10) * uint(u_xlati2.x);
    u_xlatu10 = uint(u_xlatu2.x >> (5u & uint(0x1F)));
    u_xlati2.x = int(uint(u_xlatu10 ^ u_xlatu2.x));
    u_xlatu2.x = uint(u_xlati2.x) * 668265261u;
    u_xlatu2.x = uint(u_xlatu2.x >> (8u & uint(0x1F)));
    u_xlat2.x = float(u_xlatu2.x);
    u_xlat4.yz = u_xlat2.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat4.y);
    u_xlat4.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat2.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat4.xz;
    u_xlat11.xy = u_xlat16.xy + vec2(-1.0, -1.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat11.xy);
    u_xlat11.xy = u_xlat16.xy * u_xlat16.xy;
    u_xlat11.xy = u_xlat16.xy * u_xlat11.xy;
    u_xlat4.xy = u_xlat16.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.xy + vec2(10.0, 10.0);
    u_xlat16.xy = u_xlat16.xy * u_xlat11.xy;
    u_xlat10.x = (-u_xlat18.x) + u_xlat26;
    u_xlat10.x = u_xlat16.y * u_xlat10.x + u_xlat18.x;
    u_xlat2.x = (-u_xlat3.x) + u_xlat2.x;
    u_xlat24 = u_xlat16.y * u_xlat2.x + u_xlat3.x;
    u_xlat24 = (-u_xlat10.x) + u_xlat24;
    u_xlat16.x = u_xlat16.x * u_xlat24 + u_xlat10.x;
    u_xlat16.x = u_xlat16.x + 0.5;
    u_xlat16.x = u_xlat16.x + (-_Patch);
    u_xlat24 = ceil(u_xlat16.x);
    u_xlat2.x = (-u_xlat24) + 1.0;
    u_xlat10.x = _Patch + -0.5;
    u_xlat10.x = ceil(u_xlat10.x);
    u_xlat24 = u_xlat24 + (-u_xlat2.x);
    u_xlat24 = u_xlat10.x * u_xlat24 + u_xlat2.x;
    u_xlat2.x = u_xlat16_8 + (-_Threshold);
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat24 = u_xlat24 * u_xlat2.x;
    u_xlat2.x = u_xlat16_8 * _Delta + (-u_xlat16_8);
    u_xlat8.x = u_xlat24 * u_xlat2.x + u_xlat16_8;
    u_xlat24 = (-_Delta) + 0.300000012;
    u_xlat24 = _LineDarkness * u_xlat24 + _Delta;
    u_xlat2.x = _Scale * _Line;
    u_xlat2.xy = u_xlat2.xx * vec2(0.5, -0.5);
    u_xlat16.x = max(u_xlat16.x, u_xlat2.y);
    u_xlat16.x = min(u_xlat2.x, u_xlat16.x);
    u_xlat16.x = abs(u_xlat16.x) / u_xlat2.x;
    u_xlat16.x = (-u_xlat16.x) + 1.0;
    u_xlat16.x = u_xlat16.x * 4.0;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat24 = u_xlat24 + -1.0;
    u_xlat16.x = u_xlat16.x * u_xlat24 + 1.0;
    u_xlat8.x = min(u_xlat16.x, u_xlat8.x);
    u_xlat16.x = (-_Delta) * 0.899999976 + u_xlat8.x;
    u_xlat24 = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat16.x = u_xlat16.x / u_xlat24;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.xy = (-u_xlat16.xx) + vec2(1.0, 1.25);
    u_xlat24 = roundEven(u_xlat16.y);
    u_xlat2.x = _Saturation + -1.0;
    u_xlat2.x = u_xlat24 * u_xlat2.x + 1.0;
    u_xlat10.x = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat3.xyz = (-u_xlat10.xxx) + vs_INTERP1.xyz;
    u_xlat2.xyw = u_xlat2.xxx * u_xlat3.yzx + u_xlat10.xxx;
    u_xlat16.x = u_xlat16.x * _HueSpan + _Hue;
    u_xlat16.x = u_xlat24 * u_xlat16.x;
    u_xlatb24 = u_xlat2.x>=u_xlat2.y;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat3.xy = u_xlat2.yx;
    u_xlat3.z = float(-1.0);
    u_xlat3.w = float(0.666666687);
    u_xlat4.xy = u_xlat2.xy + (-u_xlat3.xy);
    u_xlat4.z = float(1.0);
    u_xlat4.w = float(-1.0);
    u_xlat3 = vec4(u_xlat24) * u_xlat4 + u_xlat3;
    u_xlatb24 = u_xlat2.w>=u_xlat3.x;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat2.xyz = u_xlat3.xyw;
    u_xlat3.xyw = u_xlat2.wyx;
    u_xlat3 = (-u_xlat2) + u_xlat3;
    u_xlat2 = vec4(u_xlat24) * u_xlat3 + u_xlat2;
    u_xlat24 = min(u_xlat2.y, u_xlat2.w);
    u_xlat24 = (-u_xlat24) + u_xlat2.x;
    u_xlatb3 = u_xlat24==0.0;
    u_xlat11.x = u_xlat2.x + 1.00000001e-10;
    u_xlat2.x = (u_xlatb3) ? u_xlat2.x : u_xlat11.x;
    u_xlat10.x = (-u_xlat2.y) + u_xlat2.w;
    u_xlat26 = u_xlat24 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat26;
    u_xlat10.x = u_xlat10.x + u_xlat2.z;
    u_xlat24 = u_xlat24 / u_xlat11.x;
    u_xlat16.x = u_xlat16.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = u_xlat16.x<0.0;
    u_xlatb18 = 1.0<u_xlat16.x;
    u_xlat3.xy = u_xlat16.xx + vec2(1.0, -1.0);
    u_xlat16.x = (u_xlatb18) ? u_xlat3.y : u_xlat16.x;
    u_xlat16.x = (u_xlatb10) ? u_xlat3.x : u_xlat16.x;
    u_xlat10.xyz = u_xlat16.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat10.xyz = fract(u_xlat10.xyz);
    u_xlat10.xyz = u_xlat10.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat10.xyz = abs(u_xlat10.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = clamp(u_xlat10.xyz, 0.0, 1.0);
    u_xlat10.xyz = u_xlat10.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = vec3(u_xlat24) * u_xlat10.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat10.xyz * u_xlat2.xxx;
    u_xlat3.xyz = u_xlat8.xxx * u_xlat2.xyz;
    u_xlat0.x = max(u_xlat0.x, 0.0);
    u_xlat16.x = sqrt(_RevealThreshold);
    u_xlat0.x = (-u_xlat16.x) * 0.100000001 + u_xlat0.x;
    u_xlat0.x = ceil((-u_xlat0.x));
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat1.w;
    u_xlat8.xyz = (-u_xlat8.xxx) * u_xlat2.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat3.xyz;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         INSTANCING_ON      SKINNED_SPRITE  T  #ifdef VERTEX


// ===== VERTICE =====
#version 300 es
#ifndef UNITY_RUNTIME_INSTANCING_ARRAY_SIZE
	#define UNITY_RUNTIME_INSTANCING_ARRAY_SIZE 2
#endif

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
uniform 	int unity_BaseInstanceID;
uniform 	mediump vec4 _RendererColor;
struct unity_Builtins0Array_Type {
	vec4 hlslcc_mtx4x4unity_ObjectToWorldArray[4];
	vec4 hlslcc_mtx4x4unity_WorldToObjectArray[4];
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityInstancing_PerDraw0 {
#endif
	UNITY_UNIFORM unity_Builtins0Array_Type                unity_Builtins0Array[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
struct PerDrawSpriteArray_Type {
	vec4 unity_SpriteRendererColorArray;
	vec2 unity_SpriteFlipArray;
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(2) uniform UnityInstancing_PerDrawSprite {
#endif
	UNITY_UNIFORM PerDrawSpriteArray_Type                PerDrawSpriteArray[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
out highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
out highp vec3 vs_INTERP2;
highp vec3 vs_INTERP3;
flat out highp uint vs_CUSTOM_INSTANCE_ID0;
float u_xlat0;
ivec2 u_xlati0;
vec4 u_xlat1;
vec4 u_xlat2;
vec2 u_xlat6;
void main()
{
    u_xlati0.x = gl_InstanceID + unity_BaseInstanceID;
    u_xlati0.xy = ivec2(u_xlati0.x << (int(1) & int(0x1F)), u_xlati0.x << (int(3) & int(0x1F)));
    u_xlat6.xy = in_POSITION0.xy * PerDrawSpriteArray[u_xlati0.x / 2].unity_SpriteFlipArray.xy;
    u_xlat1.xyz = u_xlat6.yyy * unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[1].xyz;
    u_xlat1.xyz = unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[0].xyz * u_xlat6.xxx + u_xlat1.xyz;
    u_xlat1.xyz = unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[2].xyz * in_POSITION0.zzz + u_xlat1.xyz;
    u_xlat1.xyz = u_xlat1.xyz + unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[3].xyz;
    u_xlat2 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat2;
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat2;
    vs_INTERP2.xyz = u_xlat1.xyz;
    gl_Position = u_xlat2 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    u_xlat1 = _RendererColor * PerDrawSpriteArray[u_xlati0.x / 2].unity_SpriteRendererColorArray;
    vs_INTERP1 = u_xlat1 * in_COLOR0;
    u_xlat1.x = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[0].xyz);
    u_xlat1.y = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[1].xyz);
    u_xlat1.z = dot(in_NORMAL0.xyz, unity_Builtins0Array[u_xlati0.y / 8].hlslcc_mtx4x4unity_WorldToObjectArray[2].xyz);
    u_xlat0 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat0 = max(u_xlat0, 1.17549435e-38);
    u_xlat0 = inversesqrt(u_xlat0);
    vs_INTERP3.xyz = vec3(u_xlat0) * u_xlat1.xyz;
    vs_CUSTOM_INSTANCE_ID0 =  uint(gl_InstanceID);
    return;
}

#endif
#ifdef FRAGMENT


// ===== FRAGMENTO =====
#version 300 es
#ifndef UNITY_RUNTIME_INSTANCING_ARRAY_SIZE
	#define UNITY_RUNTIME_INSTANCING_ARRAY_SIZE 2
#endif

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
uniform 	int unity_BaseInstanceID;
struct unity_Builtins0Array_Type {
	vec4 hlslcc_mtx4x4unity_ObjectToWorldArray[4];
	vec4 hlslcc_mtx4x4unity_WorldToObjectArray[4];
};
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityInstancing_PerDraw0 {
#endif
	UNITY_UNIFORM unity_Builtins0Array_Type                unity_Builtins0Array[UNITY_RUNTIME_INSTANCING_ARRAY_SIZE];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
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
in highp  vec3 vs_INTERP2;
flat in highp  uint vs_CUSTOM_INSTANCE_ID0;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec2 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
ivec2 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
ivec4 u_xlati3;
uvec2 u_xlatu3;
bool u_xlatb3;
vec4 u_xlat4;
ivec4 u_xlati4;
uvec2 u_xlatu4;
vec4 u_xlat5;
ivec4 u_xlati5;
uvec2 u_xlatu5;
vec4 u_xlat6;
ivec4 u_xlati7;
vec3 u_xlat8;
int u_xlati8;
bool u_xlatb8;
vec3 u_xlat10;
int u_xlati10;
uint u_xlatu10;
bool u_xlatb10;
vec3 u_xlat11;
ivec3 u_xlati11;
uvec3 u_xlatu11;
ivec3 u_xlati12;
ivec3 u_xlati13;
vec2 u_xlat16;
mediump float u_xlat16_16;
vec2 u_xlat18;
ivec2 u_xlati18;
uint u_xlatu18;
bool u_xlatb18;
vec2 u_xlat19;
uvec2 u_xlatu19;
uvec2 u_xlatu20;
uvec2 u_xlatu21;
float u_xlat24;
bool u_xlatb24;
float u_xlat26;
int u_xlati26;
uint u_xlatu26;
float u_xlat27;
int u_xlati27;
uint u_xlatu27;
void main()
{
    u_xlat0.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat0.x = dot(u_xlat0.xy, u_xlat0.xy);
    u_xlat0.x = u_xlat0.x + (-_RevealThreshold);
    u_xlat1.w = ceil(u_xlat0.x);
    u_xlat1.w = clamp(u_xlat1.w, 0.0, 1.0);
    u_xlatb8 = u_xlat1.w==0.0;
    if(u_xlatb8){discard;}
    u_xlati8 = int(vs_CUSTOM_INSTANCE_ID0) + unity_BaseInstanceID;
    u_xlat16.x = roundEven(vs_INTERP1.w);
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.x = u_xlat16.x * 2.0 + -1.0;
    u_xlat2.x = u_xlat16.x * vs_INTERP0.x;
    u_xlat2.y = vs_INTERP0.y;
    u_xlat16.xy = u_xlat2.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlat16_16 = texture(_MainTex, u_xlat16.xy, _GlobalMipBias.x).x;
    u_xlati8 = int(u_xlati8 << (3 & int(0x1F)));
    u_xlat3.xy = u_xlat2.xy + unity_Builtins0Array[u_xlati8 / 8].hlslcc_mtx4x4unity_ObjectToWorldArray[3].xy;
    u_xlat3.z = u_xlat3.x * 0.5 + u_xlat3.y;
    u_xlat8.xz = u_xlat2.xy * vec2(_RidgeScale);
    u_xlat18.xy = floor(u_xlat8.xz);
    u_xlat8.xz = fract(u_xlat8.xz);
    u_xlat11.xz = u_xlat8.xz * u_xlat8.xz;
    u_xlat8.xz = (-u_xlat8.xz) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat11.xz;
    u_xlat4 = u_xlat18.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat11.xz = u_xlat18.xy + vec2(1.0, 1.0);
    u_xlati18.xy = ivec2(u_xlat18.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat18.x = u_xlat18.x * 5.96046519e-08;
    u_xlati4 = ivec4(u_xlat4);
    u_xlati12.xz = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xz = u_xlati12.xz + u_xlati4.xz;
    u_xlatu4.xy = uvec2(u_xlati12.xz) * uvec2(u_xlati4.xz);
    u_xlatu20.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu20.x ^ u_xlatu4.x, u_xlatu20.y ^ u_xlatu4.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat26 = u_xlat4.y * 5.96046519e-08;
    u_xlati11.xz = ivec2(u_xlat11.xz);
    u_xlati27 = int(uint(uint(u_xlati11.z) ^ 1103515245u));
    u_xlati11.x = u_xlati27 + u_xlati11.x;
    u_xlatu11.x = uint(u_xlati27) * uint(u_xlati11.x);
    u_xlatu27 = uint(u_xlatu11.x >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu27 ^ u_xlatu11.x));
    u_xlatu11.x = uint(u_xlati11.x) * 668265261u;
    u_xlatu11.x = uint(u_xlatu11.x >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11.x);
    u_xlat27 = u_xlat4.x * 5.96046519e-08 + (-u_xlat18.x);
    u_xlat18.x = u_xlat8.x * u_xlat27 + u_xlat18.x;
    u_xlat11.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat8.x = u_xlat8.x * u_xlat11.x + u_xlat26;
    u_xlat8.x = (-u_xlat18.x) + u_xlat8.x;
    u_xlat8.x = u_xlat8.z * u_xlat8.x + u_xlat18.x;
    u_xlat18.xy = vec2(_RidgeScale) * vec2(0.5, 0.25);
    u_xlat2 = u_xlat18.xxyy * u_xlat2.xyxy;
    u_xlat4 = floor(u_xlat2);
    u_xlat2 = fract(u_xlat2);
    u_xlat5 = u_xlat2 * u_xlat2;
    u_xlat2 = (-u_xlat2) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat2 = u_xlat2 * u_xlat5;
    u_xlat5 = u_xlat4.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat6 = u_xlat4 + vec4(1.0, 1.0, 1.0, 1.0);
    u_xlati7 = ivec4(u_xlat4);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati7.y) ^ uint(1103515245u), uint(u_xlati7.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati11.xz + u_xlati7.xz;
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu11.x >> (uint(5u) & uint(0x1F)), u_xlatu11.z >> (uint(5u) & uint(0x1F)));
    u_xlati11.xz = ivec2(uvec2(u_xlatu11.x ^ u_xlatu4.x, u_xlatu11.z ^ u_xlatu4.y));
    u_xlatu11.xz = uvec2(u_xlati11.xz) * uvec2(668265261u, 668265261u);
    u_xlatu11.xz = uvec2(u_xlatu11.x >> (uint(8u) & uint(0x1F)), u_xlatu11.z >> (uint(8u) & uint(0x1F)));
    u_xlat11.xz = vec2(u_xlatu11.xz);
    u_xlat11.xz = u_xlat11.xz * vec2(5.96046519e-08, 5.96046519e-08);
    u_xlati5 = ivec4(u_xlat5);
    u_xlati4.xy = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xy = u_xlati4.xy + u_xlati5.xz;
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(u_xlati5.xy);
    u_xlatu5.xy = uvec2(u_xlatu4.x >> (uint(5u) & uint(0x1F)), u_xlatu4.y >> (uint(5u) & uint(0x1F)));
    u_xlati4.xy = ivec2(uvec2(u_xlatu4.x ^ u_xlatu5.x, u_xlatu4.y ^ u_xlatu5.y));
    u_xlatu4.xy = uvec2(u_xlati4.xy) * uvec2(668265261u, 668265261u);
    u_xlatu4.xy = uvec2(u_xlatu4.x >> (uint(8u) & uint(0x1F)), u_xlatu4.y >> (uint(8u) & uint(0x1F)));
    u_xlat4.xy = vec2(u_xlatu4.xy);
    u_xlat24 = u_xlat4.y * 5.96046519e-08;
    u_xlati5 = ivec4(u_xlat6);
    u_xlati13.xz = ivec2(uvec2(uint(u_xlati5.y) ^ uint(1103515245u), uint(u_xlati5.w) ^ uint(1103515245u)));
    u_xlati5.xz = u_xlati13.xz + u_xlati5.xz;
    u_xlatu5.xy = uvec2(u_xlati13.xz) * uvec2(u_xlati5.xz);
    u_xlatu21.xy = uvec2(u_xlatu5.x >> (uint(5u) & uint(0x1F)), u_xlatu5.y >> (uint(5u) & uint(0x1F)));
    u_xlati5.xy = ivec2(uvec2(u_xlatu21.x ^ u_xlatu5.x, u_xlatu21.y ^ u_xlatu5.y));
    u_xlatu5.xy = uvec2(u_xlati5.xy) * uvec2(668265261u, 668265261u);
    u_xlatu5.xy = uvec2(u_xlatu5.x >> (uint(8u) & uint(0x1F)), u_xlatu5.y >> (uint(8u) & uint(0x1F)));
    u_xlat5.xy = vec2(u_xlatu5.xy);
    u_xlat4.x = u_xlat4.x * 5.96046519e-08 + (-u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat4.x + u_xlat11.x;
    u_xlat4.x = u_xlat5.x * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.x * u_xlat4.x + u_xlat24;
    u_xlat24 = (-u_xlat11.x) + u_xlat24;
    u_xlat24 = u_xlat2.y * u_xlat24 + u_xlat11.x;
    u_xlat24 = u_xlat24 * 0.25;
    u_xlat8.x = u_xlat8.x * 0.125 + u_xlat24;
    u_xlat4 = u_xlat4.zwzw + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlati4 = ivec4(u_xlat4);
    u_xlati2.xy = ivec2(uvec2(uint(u_xlati4.y) ^ uint(1103515245u), uint(u_xlati4.w) ^ uint(1103515245u)));
    u_xlati4.xy = u_xlati2.xy + u_xlati4.xz;
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(u_xlati4.xy);
    u_xlatu4.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu2.x ^ u_xlatu4.x, u_xlatu2.y ^ u_xlatu4.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat24 = u_xlat2.y * 5.96046519e-08;
    u_xlat2.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat11.z);
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat11.z;
    u_xlat10.x = u_xlat5.y * 5.96046519e-08 + (-u_xlat24);
    u_xlat24 = u_xlat2.z * u_xlat10.x + u_xlat24;
    u_xlat24 = (-u_xlat2.x) + u_xlat24;
    u_xlat24 = u_xlat2.w * u_xlat24 + u_xlat2.x;
    u_xlat8.x = u_xlat24 * 0.5 + u_xlat8.x;
    u_xlat8.x = u_xlat8.x + -0.5;
    u_xlat8.xz = u_xlat8.xx * vec2(0.5, 0.5) + u_xlat3.xz;
    u_xlat8.xz = u_xlat8.xz * vec2(vec2(_Scale, _Scale));
    u_xlat2.xy = floor(u_xlat8.xz);
    u_xlat8.xz = fract(u_xlat8.xz);
    u_xlati18.xy = ivec2(u_xlat2.xy);
    u_xlati26 = int(uint(uint(u_xlati18.y) ^ 1103515245u));
    u_xlati18.x = u_xlati26 + u_xlati18.x;
    u_xlatu18 = uint(u_xlati26) * uint(u_xlati18.x);
    u_xlatu26 = uint(u_xlatu18 >> (5u & uint(0x1F)));
    u_xlati18.x = int(uint(u_xlatu26 ^ u_xlatu18));
    u_xlatu18 = uint(u_xlati18.x) * 668265261u;
    u_xlatu18 = uint(u_xlatu18 >> (8u & uint(0x1F)));
    u_xlat18.x = float(u_xlatu18);
    u_xlat3.yz = u_xlat18.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat26 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat18.x * 5.96046519e-08 + (-u_xlat26);
    u_xlat18.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat18.x = inversesqrt(u_xlat18.x);
    u_xlat18.xy = u_xlat18.xx * u_xlat3.xz;
    u_xlat18.x = dot(u_xlat18.xy, u_xlat8.xz);
    u_xlat3 = u_xlat2.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati3 = ivec4(u_xlat3);
    u_xlati11.xz = ivec2(uvec2(uint(u_xlati3.y) ^ uint(1103515245u), uint(u_xlati3.w) ^ uint(1103515245u)));
    u_xlati3.xz = u_xlati11.xz + u_xlati3.xz;
    u_xlatu3.xy = uvec2(u_xlati11.xz) * uvec2(u_xlati3.xz);
    u_xlatu19.xy = uvec2(u_xlatu3.x >> (uint(5u) & uint(0x1F)), u_xlatu3.y >> (uint(5u) & uint(0x1F)));
    u_xlati3.xy = ivec2(uvec2(u_xlatu19.x ^ u_xlatu3.x, u_xlatu19.y ^ u_xlatu3.y));
    u_xlatu3.xy = uvec2(u_xlati3.xy) * uvec2(668265261u, 668265261u);
    u_xlatu3.xy = uvec2(u_xlatu3.x >> (uint(8u) & uint(0x1F)), u_xlatu3.y >> (uint(8u) & uint(0x1F)));
    u_xlat3.xy = vec2(u_xlatu3.xy);
    u_xlat4 = u_xlat3.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat19.xy = floor(u_xlat4.xy);
    u_xlat4.xy = u_xlat3.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat19.xy);
    u_xlat26 = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat26 = inversesqrt(u_xlat26);
    u_xlat3.xy = vec2(u_xlat26) * u_xlat4.xz;
    u_xlat5 = u_xlat8.xzxz + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat26 = dot(u_xlat3.xy, u_xlat5.xy);
    u_xlat3.x = dot(u_xlat4.yw, u_xlat4.yw);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.yw;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat5.zw);
    u_xlat2.xy = u_xlat2.xy + vec2(1.0, 1.0);
    u_xlati2.xy = ivec2(u_xlat2.xy);
    u_xlati10 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati10 + u_xlati2.x;
    u_xlatu2.x = uint(u_xlati10) * uint(u_xlati2.x);
    u_xlatu10 = uint(u_xlatu2.x >> (5u & uint(0x1F)));
    u_xlati2.x = int(uint(u_xlatu10 ^ u_xlatu2.x));
    u_xlatu2.x = uint(u_xlati2.x) * 668265261u;
    u_xlatu2.x = uint(u_xlatu2.x >> (8u & uint(0x1F)));
    u_xlat2.x = float(u_xlatu2.x);
    u_xlat4.yz = u_xlat2.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat10.x = floor(u_xlat4.y);
    u_xlat4.x = u_xlat2.x * 5.96046519e-08 + (-u_xlat10.x);
    u_xlat2.x = dot(u_xlat4.xz, u_xlat4.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat4.xz;
    u_xlat11.xy = u_xlat8.xz + vec2(-1.0, -1.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat11.xy);
    u_xlat11.xy = u_xlat8.xz * u_xlat8.xz;
    u_xlat11.xy = u_xlat8.xz * u_xlat11.xy;
    u_xlat4.xy = u_xlat8.xz * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat4.xy + vec2(10.0, 10.0);
    u_xlat8.xz = u_xlat8.xz * u_xlat11.xy;
    u_xlat10.x = (-u_xlat18.x) + u_xlat26;
    u_xlat10.x = u_xlat8.z * u_xlat10.x + u_xlat18.x;
    u_xlat2.x = (-u_xlat3.x) + u_xlat2.x;
    u_xlat24 = u_xlat8.z * u_xlat2.x + u_xlat3.x;
    u_xlat24 = (-u_xlat10.x) + u_xlat24;
    u_xlat8.x = u_xlat8.x * u_xlat24 + u_xlat10.x;
    u_xlat8.x = u_xlat8.x + 0.5;
    u_xlat8.x = u_xlat8.x + (-_Patch);
    u_xlat24 = ceil(u_xlat8.x);
    u_xlat2.x = (-u_xlat24) + 1.0;
    u_xlat10.x = _Patch + -0.5;
    u_xlat10.x = ceil(u_xlat10.x);
    u_xlat24 = u_xlat24 + (-u_xlat2.x);
    u_xlat24 = u_xlat10.x * u_xlat24 + u_xlat2.x;
    u_xlat2.x = u_xlat16_16 + (-_Threshold);
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat24 = u_xlat24 * u_xlat2.x;
    u_xlat2.x = u_xlat16_16 * _Delta + (-u_xlat16_16);
    u_xlat16.x = u_xlat24 * u_xlat2.x + u_xlat16_16;
    u_xlat24 = (-_Delta) + 0.300000012;
    u_xlat24 = _LineDarkness * u_xlat24 + _Delta;
    u_xlat2.x = _Scale * _Line;
    u_xlat2.xy = u_xlat2.xx * vec2(0.5, -0.5);
    u_xlat8.x = max(u_xlat8.x, u_xlat2.y);
    u_xlat8.x = min(u_xlat2.x, u_xlat8.x);
    u_xlat8.x = abs(u_xlat8.x) / u_xlat2.x;
    u_xlat8.x = (-u_xlat8.x) + 1.0;
    u_xlat8.x = u_xlat8.x * 4.0;
    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);
    u_xlat24 = u_xlat24 + -1.0;
    u_xlat8.x = u_xlat8.x * u_xlat24 + 1.0;
    u_xlat8.x = min(u_xlat8.x, u_xlat16.x);
    u_xlat16.x = (-_Delta) * 0.899999976 + u_xlat8.x;
    u_xlat24 = (-_Delta) * 0.899999976 + 0.899999976;
    u_xlat16.x = u_xlat16.x / u_xlat24;
    u_xlat16.x = clamp(u_xlat16.x, 0.0, 1.0);
    u_xlat16.xy = (-u_xlat16.xx) + vec2(1.0, 1.25);
    u_xlat24 = roundEven(u_xlat16.y);
    u_xlat2.x = _Saturation + -1.0;
    u_xlat2.x = u_xlat24 * u_xlat2.x + 1.0;
    u_xlat10.x = dot(vs_INTERP1.xyz, vec3(0.212672904, 0.715152204, 0.0721750036));
    u_xlat3.xyz = (-u_xlat10.xxx) + vs_INTERP1.xyz;
    u_xlat2.xyw = u_xlat2.xxx * u_xlat3.yzx + u_xlat10.xxx;
    u_xlat16.x = u_xlat16.x * _HueSpan + _Hue;
    u_xlat16.x = u_xlat24 * u_xlat16.x;
    u_xlatb24 = u_xlat2.x>=u_xlat2.y;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat3.xy = u_xlat2.yx;
    u_xlat3.z = float(-1.0);
    u_xlat3.w = float(0.666666687);
    u_xlat4.xy = u_xlat2.xy + (-u_xlat3.xy);
    u_xlat4.z = float(1.0);
    u_xlat4.w = float(-1.0);
    u_xlat3 = vec4(u_xlat24) * u_xlat4 + u_xlat3;
    u_xlatb24 = u_xlat2.w>=u_xlat3.x;
    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);
    u_xlat2.xyz = u_xlat3.xyw;
    u_xlat3.xyw = u_xlat2.wyx;
    u_xlat3 = (-u_xlat2) + u_xlat3;
    u_xlat2 = vec4(u_xlat24) * u_xlat3 + u_xlat2;
    u_xlat24 = min(u_xlat2.y, u_xlat2.w);
    u_xlat24 = (-u_xlat24) + u_xlat2.x;
    u_xlatb3 = u_xlat24==0.0;
    u_xlat11.x = u_xlat2.x + 1.00000001e-10;
    u_xlat2.x = (u_xlatb3) ? u_xlat2.x : u_xlat11.x;
    u_xlat10.x = (-u_xlat2.y) + u_xlat2.w;
    u_xlat26 = u_xlat24 * 6.0 + 1.00000001e-10;
    u_xlat10.x = u_xlat10.x / u_xlat26;
    u_xlat10.x = u_xlat10.x + u_xlat2.z;
    u_xlat24 = u_xlat24 / u_xlat11.x;
    u_xlat16.x = u_xlat16.x * 0.00277777785 + abs(u_xlat10.x);
    u_xlatb10 = u_xlat16.x<0.0;
    u_xlatb18 = 1.0<u_xlat16.x;
    u_xlat3.xy = u_xlat16.xx + vec2(1.0, -1.0);
    u_xlat16.x = (u_xlatb18) ? u_xlat3.y : u_xlat16.x;
    u_xlat16.x = (u_xlatb10) ? u_xlat3.x : u_xlat16.x;
    u_xlat10.xyz = u_xlat16.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat10.xyz = fract(u_xlat10.xyz);
    u_xlat10.xyz = u_xlat10.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat10.xyz = abs(u_xlat10.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = clamp(u_xlat10.xyz, 0.0, 1.0);
    u_xlat10.xyz = u_xlat10.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat10.xyz = vec3(u_xlat24) * u_xlat10.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat10.xyz * u_xlat2.xxx;
    u_xlat3.xyz = u_xlat8.xxx * u_xlat2.xyz;
    u_xlat0.x = max(u_xlat0.x, 0.0);
    u_xlat16.x = sqrt(_RevealThreshold);
    u_xlat0.x = (-u_xlat16.x) * 0.100000001 + u_xlat0.x;
    u_xlat0.x = ceil((-u_xlat0.x));
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat1.w;
    u_xlat8.xyz = (-u_xlat8.xxx) * u_xlat2.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat3.xyz;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        
