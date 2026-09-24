// Shader Graphs/Shafts
// sacado de furniture_assets_all_22d367c8beca55276af4138414a20260.bundle
// declara: White, _MainTex, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
uniform 	vec4 _TimeParameters;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
mediump vec4 u_xlat16_0;
vec2 u_xlat1;
bool u_xlatb1;
vec3 u_xlat2;
ivec3 u_xlati2;
uvec3 u_xlatu2;
vec4 u_xlat3;
ivec3 u_xlati3;
uvec3 u_xlatu3;
vec3 u_xlat5;
vec2 u_xlat6;
vec2 u_xlat9;
int u_xlati9;
uint u_xlatu9;
float u_xlat10;
float u_xlat13;
int u_xlati13;
uint u_xlatu13;
void main()
{
    u_xlat16_0 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat1.xy = vs_INTERP0.xy + _TimeParameters.xx;
    u_xlat1.x = u_xlat1.y * -0.666666687 + u_xlat1.x;
    u_xlat1.x = u_xlat1.x + u_xlat1.x;
    u_xlat5.x = floor(u_xlat1.x);
    u_xlat1.x = fract(u_xlat1.x);
    u_xlati9 = int(u_xlat5.x);
    u_xlati13 = int(uint(uint(u_xlati9) ^ 1103515245u));
    u_xlati9 = u_xlati13 + u_xlati9;
    u_xlatu9 = uint(u_xlati13) * uint(u_xlati9);
    u_xlatu13 = uint(u_xlatu9 >> (5u & uint(0x1F)));
    u_xlati9 = int(uint(u_xlatu13 ^ u_xlatu9));
    u_xlatu9 = uint(u_xlati9) * 668265261u;
    u_xlatu9 = uint(u_xlatu9 >> (8u & uint(0x1F)));
    u_xlat9.x = float(u_xlatu9);
    u_xlat2.yz = u_xlat9.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat13 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat9.x * 5.96046519e-08 + (-u_xlat13);
    u_xlat9.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat9.x = inversesqrt(u_xlat9.x);
    u_xlat9.xy = u_xlat9.xx * u_xlat2.xz;
    u_xlat9.x = dot(u_xlat9.xy, u_xlat1.xx);
    u_xlat2.xyz = u_xlat5.xxx + vec3(0.0, 1.0, 1.0);
    u_xlati2.xyz = ivec3(u_xlat2.xyz);
    u_xlati3.xyz = ivec3(uvec3(uint(u_xlati2.z) ^ uint(1103515245u), uint(u_xlati2.x) ^ uint(1103515245u), uint(u_xlati2.z) ^ uint(1103515245u)));
    u_xlati2.xyz = u_xlati2.xyz + u_xlati3.xyz;
    u_xlatu2.xyz = uvec3(u_xlati3.xyz) * uvec3(u_xlati2.xyz);
    u_xlatu3.xyz = uvec3(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)), u_xlatu2.z >> (uint(5u) & uint(0x1F)));
    u_xlati2.xyz = ivec3(uvec3(u_xlatu2.x ^ u_xlatu3.x, u_xlatu2.y ^ u_xlatu3.y, u_xlatu2.z ^ u_xlatu3.z));
    u_xlatu2.xyz = uvec3(u_xlati2.xyz) * uvec3(668265261u, 668265261u, 668265261u);
    u_xlatu2.xyz = uvec3(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)), u_xlatu2.z >> (uint(8u) & uint(0x1F)));
    u_xlat2.xyz = vec3(u_xlatu2.xyz);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat5.xz = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat5.xz);
    u_xlat5.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat5.x = inversesqrt(u_xlat5.x);
    u_xlat5.xz = u_xlat5.xx * u_xlat3.xz;
    u_xlat2.xy = u_xlat1.xx + vec2(-1.0, -0.0);
    u_xlat5.x = dot(u_xlat5.zx, u_xlat2.xy);
    u_xlat13 = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat13 = inversesqrt(u_xlat13);
    u_xlat3.xy = vec2(u_xlat13) * u_xlat3.yw;
    u_xlat13 = dot(u_xlat3.xy, u_xlat2.xy);
    u_xlat3.yz = u_xlat2.zz * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6.x = floor(u_xlat3.y);
    u_xlat3.x = u_xlat2.z * 5.96046519e-08 + (-u_xlat6.x);
    u_xlat6.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat6.x = inversesqrt(u_xlat6.x);
    u_xlat6.xy = u_xlat6.xx * u_xlat3.xz;
    u_xlat2.x = dot(u_xlat6.xy, u_xlat2.xx);
    u_xlat6.x = u_xlat1.x * u_xlat1.x;
    u_xlat6.x = u_xlat1.x * u_xlat6.x;
    u_xlat10 = u_xlat1.x * 6.0 + -15.0;
    u_xlat1.x = u_xlat1.x * u_xlat10 + 10.0;
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat5.x = (-u_xlat9.x) + u_xlat5.x;
    u_xlat5.x = u_xlat1.x * u_xlat5.x + u_xlat9.x;
    u_xlat9.x = (-u_xlat13) + u_xlat2.x;
    u_xlat9.x = u_xlat1.x * u_xlat9.x + u_xlat13;
    u_xlat9.x = (-u_xlat5.x) + u_xlat9.x;
    u_xlat1.x = u_xlat1.x * u_xlat9.x + u_xlat5.x;
    u_xlat1.x = u_xlat1.x + 0.800000012;
    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);
    u_xlat16_0.w = u_xlat16_0.w * u_xlat1.x;
    u_xlatb1 = u_xlat16_0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat0 = u_xlat16_0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         ºu
                         SKINNED_SPRITE  "  #ifdef VERTEX


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
uniform 	vec4 _TimeParameters;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
mediump vec4 u_xlat16_0;
vec2 u_xlat1;
bool u_xlatb1;
vec3 u_xlat2;
ivec3 u_xlati2;
uvec3 u_xlatu2;
vec4 u_xlat3;
ivec3 u_xlati3;
uvec3 u_xlatu3;
vec3 u_xlat5;
vec2 u_xlat6;
vec2 u_xlat9;
int u_xlati9;
uint u_xlatu9;
float u_xlat10;
float u_xlat13;
int u_xlati13;
uint u_xlatu13;
void main()
{
    u_xlat16_0 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat1.xy = vs_INTERP0.xy + _TimeParameters.xx;
    u_xlat1.x = u_xlat1.y * -0.666666687 + u_xlat1.x;
    u_xlat1.x = u_xlat1.x + u_xlat1.x;
    u_xlat5.x = floor(u_xlat1.x);
    u_xlat1.x = fract(u_xlat1.x);
    u_xlati9 = int(u_xlat5.x);
    u_xlati13 = int(uint(uint(u_xlati9) ^ 1103515245u));
    u_xlati9 = u_xlati13 + u_xlati9;
    u_xlatu9 = uint(u_xlati13) * uint(u_xlati9);
    u_xlatu13 = uint(u_xlatu9 >> (5u & uint(0x1F)));
    u_xlati9 = int(uint(u_xlatu13 ^ u_xlatu9));
    u_xlatu9 = uint(u_xlati9) * 668265261u;
    u_xlatu9 = uint(u_xlatu9 >> (8u & uint(0x1F)));
    u_xlat9.x = float(u_xlatu9);
    u_xlat2.yz = u_xlat9.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat13 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat9.x * 5.96046519e-08 + (-u_xlat13);
    u_xlat9.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat9.x = inversesqrt(u_xlat9.x);
    u_xlat9.xy = u_xlat9.xx * u_xlat2.xz;
    u_xlat9.x = dot(u_xlat9.xy, u_xlat1.xx);
    u_xlat2.xyz = u_xlat5.xxx + vec3(0.0, 1.0, 1.0);
    u_xlati2.xyz = ivec3(u_xlat2.xyz);
    u_xlati3.xyz = ivec3(uvec3(uint(u_xlati2.z) ^ uint(1103515245u), uint(u_xlati2.x) ^ uint(1103515245u), uint(u_xlati2.z) ^ uint(1103515245u)));
    u_xlati2.xyz = u_xlati2.xyz + u_xlati3.xyz;
    u_xlatu2.xyz = uvec3(u_xlati3.xyz) * uvec3(u_xlati2.xyz);
    u_xlatu3.xyz = uvec3(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)), u_xlatu2.z >> (uint(5u) & uint(0x1F)));
    u_xlati2.xyz = ivec3(uvec3(u_xlatu2.x ^ u_xlatu3.x, u_xlatu2.y ^ u_xlatu3.y, u_xlatu2.z ^ u_xlatu3.z));
    u_xlatu2.xyz = uvec3(u_xlati2.xyz) * uvec3(668265261u, 668265261u, 668265261u);
    u_xlatu2.xyz = uvec3(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)), u_xlatu2.z >> (uint(8u) & uint(0x1F)));
    u_xlat2.xyz = vec3(u_xlatu2.xyz);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat5.xz = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat5.xz);
    u_xlat5.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat5.x = inversesqrt(u_xlat5.x);
    u_xlat5.xz = u_xlat5.xx * u_xlat3.xz;
    u_xlat2.xy = u_xlat1.xx + vec2(-1.0, -0.0);
    u_xlat5.x = dot(u_xlat5.zx, u_xlat2.xy);
    u_xlat13 = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat13 = inversesqrt(u_xlat13);
    u_xlat3.xy = vec2(u_xlat13) * u_xlat3.yw;
    u_xlat13 = dot(u_xlat3.xy, u_xlat2.xy);
    u_xlat3.yz = u_xlat2.zz * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6.x = floor(u_xlat3.y);
    u_xlat3.x = u_xlat2.z * 5.96046519e-08 + (-u_xlat6.x);
    u_xlat6.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat6.x = inversesqrt(u_xlat6.x);
    u_xlat6.xy = u_xlat6.xx * u_xlat3.xz;
    u_xlat2.x = dot(u_xlat6.xy, u_xlat2.xx);
    u_xlat6.x = u_xlat1.x * u_xlat1.x;
    u_xlat6.x = u_xlat1.x * u_xlat6.x;
    u_xlat10 = u_xlat1.x * 6.0 + -15.0;
    u_xlat1.x = u_xlat1.x * u_xlat10 + 10.0;
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat5.x = (-u_xlat9.x) + u_xlat5.x;
    u_xlat5.x = u_xlat1.x * u_xlat5.x + u_xlat9.x;
    u_xlat9.x = (-u_xlat13) + u_xlat2.x;
    u_xlat9.x = u_xlat1.x * u_xlat9.x + u_xlat13;
    u_xlat9.x = (-u_xlat5.x) + u_xlat9.x;
    u_xlat1.x = u_xlat1.x * u_xlat9.x + u_xlat5.x;
    u_xlat1.x = u_xlat1.x + 0.800000012;
    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);
    u_xlat16_0.w = u_xlat16_0.w * u_xlat1.x;
    u_xlatb1 = u_xlat16_0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat0 = u_xlat16_0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         
