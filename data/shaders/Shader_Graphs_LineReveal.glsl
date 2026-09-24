// Shader Graphs/LineReveal
// sacado de sharedassets70.assets
// declara: White, _Fuzz, _LineColor, _MainTex, _NoiseClip, _NoiseScale, _NoiseThreshold, _RevealOffset, _RevealThreshold, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
UNITY_BINDING(1) uniform UnityPerDraw {
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
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _LineColor;
	UNITY_UNIFORM float                _NoiseClip;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _Fuzz;
	UNITY_UNIFORM float                _NoiseThreshold;
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
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uint u_xlatu1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
bool u_xlatb2;
vec4 u_xlat3;
vec4 u_xlat4;
vec3 u_xlat5;
bool u_xlatb5;
float u_xlat6;
int u_xlati6;
uint u_xlatu6;
bool u_xlatb6;
vec2 u_xlat7;
ivec3 u_xlati7;
bool u_xlatb7;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
bool u_xlatb11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP0.xy * vec2(vec2(_Fuzz, _Fuzz));
    u_xlat10.xy = floor(u_xlat0.xy);
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat1.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat0.xy = (-u_xlat0.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy;
    u_xlat1 = u_xlat10.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat2.xy = u_xlat10.xy + vec2(1.0, 1.0);
    u_xlat10.x = dot(u_xlat10.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat10.y = u_xlat15 * 43758.5469;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat1.x = dot(u_xlat1.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb11 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb11) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat15 = (-u_xlat10.x) + u_xlat10.y;
    u_xlat10.x = u_xlat0.x * u_xlat15 + u_xlat10.x;
    u_xlat15 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat1.x;
    u_xlat0.x = (-u_xlat10.x) + u_xlat0.x;
    u_xlat0.x = u_xlat0.y * u_xlat0.x + u_xlat10.x;
    u_xlat1 = vec4(vec4(_Fuzz, _Fuzz, _Fuzz, _Fuzz)) * vec4(0.5, 0.5, 0.25, 0.25);
    u_xlat1 = u_xlat1 * vs_INTERP0.xyxy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat3;
    u_xlat3 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat4 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlat5.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb2 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb2) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat2.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.x * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat2.x;
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.y * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5.x;
    u_xlat3 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat5.x = dot(u_xlat2.zw, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat1.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.z * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat1.x;
    u_xlat10.x = u_xlat1.z * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.w * u_xlat10.x + u_xlat5.x;
    u_xlat0.x = u_xlat5.x * 0.5 + u_xlat0.x;
    u_xlat5.x = vs_INTERP0.y + -0.5;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat0.xz = (-u_xlat0.xx) * vec2(0.333333343, 0.333333343) + vs_INTERP0.xy;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).w;
    u_xlat0.x = u_xlat16_0 * 1.5;
    u_xlat10.x = abs(u_xlat5.x) + abs(u_xlat5.x);
    u_xlat5.x = -abs(u_xlat5.x) * 2.0 + 1.0;
    u_xlat5.x = u_xlat5.x * 1.5;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.x = u_xlat10.x / _NoiseThreshold;
    u_xlat10.xy = vs_INTERP2.xy * vec2(vec2(_NoiseScale, _NoiseScale));
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlati11.xy = ivec2(u_xlat1.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2.yz = u_xlat11.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat16 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat11.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xz;
    u_xlat11.x = dot(u_xlat11.xy, u_xlat10.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat12.xy = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat12.xy);
    u_xlat16 = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat3.xz;
    u_xlat4 = u_xlat10.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat2.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.yw;
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.zw);
    u_xlat1.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1 = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1 >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1));
    u_xlatu1 = uint(u_xlati1.x) * 668265261u;
    u_xlatu1 = uint(u_xlatu1 >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1);
    u_xlat3.yz = u_xlat1.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat6);
    u_xlat1.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat3.xz;
    u_xlat7.xy = u_xlat10.xy + vec2(-1.0, -1.0);
    u_xlat1.x = dot(u_xlat1.xy, u_xlat7.xy);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat7.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat3.xy = u_xlat10.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat6 = (-u_xlat11.x) + u_xlat16;
    u_xlat6 = u_xlat10.y * u_xlat6 + u_xlat11.x;
    u_xlat1.x = (-u_xlat2.x) + u_xlat1.x;
    u_xlat15 = u_xlat10.y * u_xlat1.x + u_xlat2.x;
    u_xlat15 = (-u_xlat6) + u_xlat15;
    u_xlat10.x = u_xlat10.x * u_xlat15 + u_xlat6;
    u_xlat10.x = u_xlat10.x + 0.5;
    u_xlat10.x = u_xlat10.x + (-_NoiseClip);
    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);
    u_xlat15 = (-_NoiseClip) + 1.0;
    u_xlat15 = max(u_xlat15, 0.00100000005);
    u_xlat10.x = u_xlat10.x / u_xlat15;
    u_xlat5.x = (-u_xlat5.x) * u_xlat10.x + 1.0;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat5.x = dot(u_xlat5.xy, u_xlat5.xy);
    u_xlat5.x = u_xlat5.x + (-_RevealThreshold);
    u_xlat5.x = ceil(u_xlat5.x);
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat5.x;
    u_xlatb5 = u_xlat0.x==0.0;
    if(u_xlatb5){discard;}
    u_xlat1.xyz = vs_INTERP1.xyz * _LineColor.xyz;
    u_xlat1.w = u_xlat0.x * vs_INTERP1.w;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         INSTANCING_ON   ×A  #ifdef VERTEX


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
UNITY_BINDING(1) uniform UnityInstancing_PerDraw0 {
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
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _LineColor;
	UNITY_UNIFORM float                _NoiseClip;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _Fuzz;
	UNITY_UNIFORM float                _NoiseThreshold;
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
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uint u_xlatu1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
bool u_xlatb2;
vec4 u_xlat3;
vec4 u_xlat4;
vec3 u_xlat5;
bool u_xlatb5;
float u_xlat6;
int u_xlati6;
uint u_xlatu6;
bool u_xlatb6;
vec2 u_xlat7;
ivec3 u_xlati7;
bool u_xlatb7;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
bool u_xlatb11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP0.xy * vec2(vec2(_Fuzz, _Fuzz));
    u_xlat10.xy = floor(u_xlat0.xy);
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat1.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat0.xy = (-u_xlat0.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy;
    u_xlat1 = u_xlat10.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat2.xy = u_xlat10.xy + vec2(1.0, 1.0);
    u_xlat10.x = dot(u_xlat10.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat10.y = u_xlat15 * 43758.5469;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat1.x = dot(u_xlat1.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb11 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb11) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat15 = (-u_xlat10.x) + u_xlat10.y;
    u_xlat10.x = u_xlat0.x * u_xlat15 + u_xlat10.x;
    u_xlat15 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat1.x;
    u_xlat0.x = (-u_xlat10.x) + u_xlat0.x;
    u_xlat0.x = u_xlat0.y * u_xlat0.x + u_xlat10.x;
    u_xlat1 = vec4(vec4(_Fuzz, _Fuzz, _Fuzz, _Fuzz)) * vec4(0.5, 0.5, 0.25, 0.25);
    u_xlat1 = u_xlat1 * vs_INTERP0.xyxy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat3;
    u_xlat3 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat4 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlat5.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb2 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb2) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat2.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.x * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat2.x;
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.y * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5.x;
    u_xlat3 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat5.x = dot(u_xlat2.zw, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat1.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.z * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat1.x;
    u_xlat10.x = u_xlat1.z * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.w * u_xlat10.x + u_xlat5.x;
    u_xlat0.x = u_xlat5.x * 0.5 + u_xlat0.x;
    u_xlat5.x = vs_INTERP0.y + -0.5;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat0.xz = (-u_xlat0.xx) * vec2(0.333333343, 0.333333343) + vs_INTERP0.xy;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).w;
    u_xlat0.x = u_xlat16_0 * 1.5;
    u_xlat10.x = abs(u_xlat5.x) + abs(u_xlat5.x);
    u_xlat5.x = -abs(u_xlat5.x) * 2.0 + 1.0;
    u_xlat5.x = u_xlat5.x * 1.5;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.x = u_xlat10.x / _NoiseThreshold;
    u_xlat10.xy = vs_INTERP2.xy * vec2(vec2(_NoiseScale, _NoiseScale));
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlati11.xy = ivec2(u_xlat1.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2.yz = u_xlat11.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat16 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat11.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xz;
    u_xlat11.x = dot(u_xlat11.xy, u_xlat10.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat12.xy = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat12.xy);
    u_xlat16 = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat3.xz;
    u_xlat4 = u_xlat10.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat2.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.yw;
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.zw);
    u_xlat1.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1 = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1 >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1));
    u_xlatu1 = uint(u_xlati1.x) * 668265261u;
    u_xlatu1 = uint(u_xlatu1 >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1);
    u_xlat3.yz = u_xlat1.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat6);
    u_xlat1.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat3.xz;
    u_xlat7.xy = u_xlat10.xy + vec2(-1.0, -1.0);
    u_xlat1.x = dot(u_xlat1.xy, u_xlat7.xy);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat7.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat3.xy = u_xlat10.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat6 = (-u_xlat11.x) + u_xlat16;
    u_xlat6 = u_xlat10.y * u_xlat6 + u_xlat11.x;
    u_xlat1.x = (-u_xlat2.x) + u_xlat1.x;
    u_xlat15 = u_xlat10.y * u_xlat1.x + u_xlat2.x;
    u_xlat15 = (-u_xlat6) + u_xlat15;
    u_xlat10.x = u_xlat10.x * u_xlat15 + u_xlat6;
    u_xlat10.x = u_xlat10.x + 0.5;
    u_xlat10.x = u_xlat10.x + (-_NoiseClip);
    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);
    u_xlat15 = (-_NoiseClip) + 1.0;
    u_xlat15 = max(u_xlat15, 0.00100000005);
    u_xlat10.x = u_xlat10.x / u_xlat15;
    u_xlat5.x = (-u_xlat5.x) * u_xlat10.x + 1.0;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat5.x = dot(u_xlat5.xy, u_xlat5.xy);
    u_xlat5.x = u_xlat5.x + (-_RevealThreshold);
    u_xlat5.x = ceil(u_xlat5.x);
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat5.x;
    u_xlatb5 = u_xlat0.x==0.0;
    if(u_xlatb5){discard;}
    u_xlat1.xyz = vs_INTERP1.xyz * _LineColor.xyz;
    u_xlat1.w = u_xlat0.x * vs_INTERP1.w;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         SKINNED_SPRITE  sD  #ifdef VERTEX


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
UNITY_BINDING(1) uniform UnityPerDraw {
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
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _LineColor;
	UNITY_UNIFORM float                _NoiseClip;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _Fuzz;
	UNITY_UNIFORM float                _NoiseThreshold;
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
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uint u_xlatu1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
bool u_xlatb2;
vec4 u_xlat3;
vec4 u_xlat4;
vec3 u_xlat5;
bool u_xlatb5;
float u_xlat6;
int u_xlati6;
uint u_xlatu6;
bool u_xlatb6;
vec2 u_xlat7;
ivec3 u_xlati7;
bool u_xlatb7;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
bool u_xlatb11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP0.xy * vec2(vec2(_Fuzz, _Fuzz));
    u_xlat10.xy = floor(u_xlat0.xy);
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat1.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat0.xy = (-u_xlat0.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy;
    u_xlat1 = u_xlat10.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat2.xy = u_xlat10.xy + vec2(1.0, 1.0);
    u_xlat10.x = dot(u_xlat10.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat10.y = u_xlat15 * 43758.5469;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat1.x = dot(u_xlat1.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb11 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb11) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat15 = (-u_xlat10.x) + u_xlat10.y;
    u_xlat10.x = u_xlat0.x * u_xlat15 + u_xlat10.x;
    u_xlat15 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat1.x;
    u_xlat0.x = (-u_xlat10.x) + u_xlat0.x;
    u_xlat0.x = u_xlat0.y * u_xlat0.x + u_xlat10.x;
    u_xlat1 = vec4(vec4(_Fuzz, _Fuzz, _Fuzz, _Fuzz)) * vec4(0.5, 0.5, 0.25, 0.25);
    u_xlat1 = u_xlat1 * vs_INTERP0.xyxy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat3;
    u_xlat3 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat4 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlat5.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb2 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb2) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat2.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.x * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat2.x;
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.y * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5.x;
    u_xlat3 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat5.x = dot(u_xlat2.zw, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat1.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.z * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat1.x;
    u_xlat10.x = u_xlat1.z * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.w * u_xlat10.x + u_xlat5.x;
    u_xlat0.x = u_xlat5.x * 0.5 + u_xlat0.x;
    u_xlat5.x = vs_INTERP0.y + -0.5;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat0.xz = (-u_xlat0.xx) * vec2(0.333333343, 0.333333343) + vs_INTERP0.xy;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).w;
    u_xlat0.x = u_xlat16_0 * 1.5;
    u_xlat10.x = abs(u_xlat5.x) + abs(u_xlat5.x);
    u_xlat5.x = -abs(u_xlat5.x) * 2.0 + 1.0;
    u_xlat5.x = u_xlat5.x * 1.5;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.x = u_xlat10.x / _NoiseThreshold;
    u_xlat10.xy = vs_INTERP2.xy * vec2(vec2(_NoiseScale, _NoiseScale));
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlati11.xy = ivec2(u_xlat1.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2.yz = u_xlat11.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat16 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat11.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xz;
    u_xlat11.x = dot(u_xlat11.xy, u_xlat10.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat12.xy = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat12.xy);
    u_xlat16 = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat3.xz;
    u_xlat4 = u_xlat10.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat2.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.yw;
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.zw);
    u_xlat1.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1 = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1 >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1));
    u_xlatu1 = uint(u_xlati1.x) * 668265261u;
    u_xlatu1 = uint(u_xlatu1 >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1);
    u_xlat3.yz = u_xlat1.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat6);
    u_xlat1.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat3.xz;
    u_xlat7.xy = u_xlat10.xy + vec2(-1.0, -1.0);
    u_xlat1.x = dot(u_xlat1.xy, u_xlat7.xy);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat7.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat3.xy = u_xlat10.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat6 = (-u_xlat11.x) + u_xlat16;
    u_xlat6 = u_xlat10.y * u_xlat6 + u_xlat11.x;
    u_xlat1.x = (-u_xlat2.x) + u_xlat1.x;
    u_xlat15 = u_xlat10.y * u_xlat1.x + u_xlat2.x;
    u_xlat15 = (-u_xlat6) + u_xlat15;
    u_xlat10.x = u_xlat10.x * u_xlat15 + u_xlat6;
    u_xlat10.x = u_xlat10.x + 0.5;
    u_xlat10.x = u_xlat10.x + (-_NoiseClip);
    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);
    u_xlat15 = (-_NoiseClip) + 1.0;
    u_xlat15 = max(u_xlat15, 0.00100000005);
    u_xlat10.x = u_xlat10.x / u_xlat15;
    u_xlat5.x = (-u_xlat5.x) * u_xlat10.x + 1.0;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat5.x = dot(u_xlat5.xy, u_xlat5.xy);
    u_xlat5.x = u_xlat5.x + (-_RevealThreshold);
    u_xlat5.x = ceil(u_xlat5.x);
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat5.x;
    u_xlatb5 = u_xlat0.x==0.0;
    if(u_xlatb5){discard;}
    u_xlat1.xyz = vs_INTERP1.xyz * _LineColor.xyz;
    u_xlat1.w = u_xlat0.x * vs_INTERP1.w;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        ºu
                         INSTANCING_ON      SKINNED_SPRITE  ×A  #ifdef VERTEX


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
UNITY_BINDING(1) uniform UnityInstancing_PerDraw0 {
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
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec3                _RevealOffset;
	UNITY_UNIFORM float                _RevealThreshold;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _LineColor;
	UNITY_UNIFORM float                _NoiseClip;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _Fuzz;
	UNITY_UNIFORM float                _NoiseThreshold;
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
vec3 u_xlat0;
mediump float u_xlat16_0;
vec4 u_xlat1;
ivec2 u_xlati1;
uint u_xlatu1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
bool u_xlatb2;
vec4 u_xlat3;
vec4 u_xlat4;
vec3 u_xlat5;
bool u_xlatb5;
float u_xlat6;
int u_xlati6;
uint u_xlatu6;
bool u_xlatb6;
vec2 u_xlat7;
ivec3 u_xlati7;
bool u_xlatb7;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat11;
ivec2 u_xlati11;
uint u_xlatu11;
bool u_xlatb11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
bool u_xlatb15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0.xy = vs_INTERP0.xy * vec2(vec2(_Fuzz, _Fuzz));
    u_xlat10.xy = floor(u_xlat0.xy);
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat1.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat0.xy = (-u_xlat0.xy) * vec2(2.0, 2.0) + vec2(3.0, 3.0);
    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy;
    u_xlat1 = u_xlat10.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat2.xy = u_xlat10.xy + vec2(1.0, 1.0);
    u_xlat10.x = dot(u_xlat10.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat10.y = u_xlat15 * 43758.5469;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat1.x = dot(u_xlat1.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb11 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb11) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat15 = (-u_xlat10.x) + u_xlat10.y;
    u_xlat10.x = u_xlat0.x * u_xlat15 + u_xlat10.x;
    u_xlat15 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat1.x;
    u_xlat0.x = (-u_xlat10.x) + u_xlat0.x;
    u_xlat0.x = u_xlat0.y * u_xlat0.x + u_xlat10.x;
    u_xlat1 = vec4(vec4(_Fuzz, _Fuzz, _Fuzz, _Fuzz)) * vec4(0.5, 0.5, 0.25, 0.25);
    u_xlat1 = u_xlat1 * vs_INTERP0.xyxy;
    u_xlat2 = floor(u_xlat1);
    u_xlat1 = fract(u_xlat1);
    u_xlat3 = u_xlat1 * u_xlat1;
    u_xlat1 = (-u_xlat1) * vec4(2.0, 2.0, 2.0, 2.0) + vec4(3.0, 3.0, 3.0, 3.0);
    u_xlat1 = u_xlat1 * u_xlat3;
    u_xlat3 = u_xlat2.xyxy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat4 = u_xlat2 + vec4(1.0, 1.0, 1.0, 0.0);
    u_xlat5.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb2 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb2) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat2.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.x * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat2.x;
    u_xlat10.x = u_xlat1.x * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.y * u_xlat10.x + u_xlat5.x;
    u_xlat5.x = u_xlat5.x * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5.x;
    u_xlat3 = u_xlat2.zwzw + vec4(0.0, 1.0, 1.0, 1.0);
    u_xlat5.x = dot(u_xlat2.zw, vec2(12.9898005, 78.2330017));
    u_xlat5.x = u_xlat5.x * 0.159154937;
    u_xlatb10 = u_xlat5.x>=(-u_xlat5.x);
    u_xlat5.x = fract(abs(u_xlat5.x));
    u_xlat5.x = (u_xlatb10) ? u_xlat5.x : (-u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 6.28318548;
    u_xlat5.x = sin(u_xlat5.x);
    u_xlat5.x = u_xlat5.x * 43758.5469;
    u_xlat10.x = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat10.x = u_xlat10.x * 0.159154937;
    u_xlatb15 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.x = fract(abs(u_xlat10.x));
    u_xlat10.x = (u_xlatb15) ? u_xlat10.x : (-u_xlat10.x);
    u_xlat10.x = u_xlat10.x * 6.28318548;
    u_xlat10.x = sin(u_xlat10.x);
    u_xlat5.y = u_xlat10.x * 43758.5469;
    u_xlat15 = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb1 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb1) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat5.z = u_xlat15 * 43758.5469;
    u_xlat5.xyz = fract(u_xlat5.xyz);
    u_xlat1.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat10.x = (-u_xlat5.x) + u_xlat5.y;
    u_xlat5.x = u_xlat1.z * u_xlat10.x + u_xlat5.x;
    u_xlat10.x = (-u_xlat5.z) + u_xlat1.x;
    u_xlat10.x = u_xlat1.z * u_xlat10.x + u_xlat5.z;
    u_xlat10.x = (-u_xlat5.x) + u_xlat10.x;
    u_xlat5.x = u_xlat1.w * u_xlat10.x + u_xlat5.x;
    u_xlat0.x = u_xlat5.x * 0.5 + u_xlat0.x;
    u_xlat5.x = vs_INTERP0.y + -0.5;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat0.xz = (-u_xlat0.xx) * vec2(0.333333343, 0.333333343) + vs_INTERP0.xy;
    u_xlat16_0 = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).w;
    u_xlat0.x = u_xlat16_0 * 1.5;
    u_xlat10.x = abs(u_xlat5.x) + abs(u_xlat5.x);
    u_xlat5.x = -abs(u_xlat5.x) * 2.0 + 1.0;
    u_xlat5.x = u_xlat5.x * 1.5;
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.x = u_xlat10.x / _NoiseThreshold;
    u_xlat10.xy = vs_INTERP2.xy * vec2(vec2(_NoiseScale, _NoiseScale));
    u_xlat1.xy = floor(u_xlat10.xy);
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlati11.xy = ivec2(u_xlat1.xy);
    u_xlati16 = int(uint(uint(u_xlati11.y) ^ 1103515245u));
    u_xlati11.x = u_xlati16 + u_xlati11.x;
    u_xlatu11 = uint(u_xlati16) * uint(u_xlati11.x);
    u_xlatu16 = uint(u_xlatu11 >> (5u & uint(0x1F)));
    u_xlati11.x = int(uint(u_xlatu16 ^ u_xlatu11));
    u_xlatu11 = uint(u_xlati11.x) * 668265261u;
    u_xlatu11 = uint(u_xlatu11 >> (8u & uint(0x1F)));
    u_xlat11.x = float(u_xlatu11);
    u_xlat2.yz = u_xlat11.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat16 = floor(u_xlat2.y);
    u_xlat2.x = u_xlat11.x * 5.96046519e-08 + (-u_xlat16);
    u_xlat11.x = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xz;
    u_xlat11.x = dot(u_xlat11.xy, u_xlat10.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlati2 = ivec4(u_xlat2);
    u_xlati7.xz = ivec2(uvec2(uint(u_xlati2.y) ^ uint(1103515245u), uint(u_xlati2.w) ^ uint(1103515245u)));
    u_xlati2.xz = u_xlati7.xz + u_xlati2.xz;
    u_xlatu2.xy = uvec2(u_xlati7.xz) * uvec2(u_xlati2.xz);
    u_xlatu12.xy = uvec2(u_xlatu2.x >> (uint(5u) & uint(0x1F)), u_xlatu2.y >> (uint(5u) & uint(0x1F)));
    u_xlati2.xy = ivec2(uvec2(u_xlatu12.x ^ u_xlatu2.x, u_xlatu12.y ^ u_xlatu2.y));
    u_xlatu2.xy = uvec2(u_xlati2.xy) * uvec2(668265261u, 668265261u);
    u_xlatu2.xy = uvec2(u_xlatu2.x >> (uint(8u) & uint(0x1F)), u_xlatu2.y >> (uint(8u) & uint(0x1F)));
    u_xlat2.xy = vec2(u_xlatu2.xy);
    u_xlat3 = u_xlat2.xyxy * vec4(5.96046519e-08, 5.96046519e-08, 5.96046519e-08, 5.96046519e-08) + vec4(0.5, 0.5, -0.5, -0.5);
    u_xlat12.xy = floor(u_xlat3.xy);
    u_xlat3.xy = u_xlat2.xy * vec2(5.96046519e-08, 5.96046519e-08) + (-u_xlat12.xy);
    u_xlat16 = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat3.xz;
    u_xlat4 = u_xlat10.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat2.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.yw;
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.zw);
    u_xlat1.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlati1.xy = ivec2(u_xlat1.xy);
    u_xlati6 = int(uint(uint(u_xlati1.y) ^ 1103515245u));
    u_xlati1.x = u_xlati6 + u_xlati1.x;
    u_xlatu1 = uint(u_xlati6) * uint(u_xlati1.x);
    u_xlatu6 = uint(u_xlatu1 >> (5u & uint(0x1F)));
    u_xlati1.x = int(uint(u_xlatu6 ^ u_xlatu1));
    u_xlatu1 = uint(u_xlati1.x) * 668265261u;
    u_xlatu1 = uint(u_xlatu1 >> (8u & uint(0x1F)));
    u_xlat1.x = float(u_xlatu1);
    u_xlat3.yz = u_xlat1.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat6 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat1.x * 5.96046519e-08 + (-u_xlat6);
    u_xlat1.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat3.xz;
    u_xlat7.xy = u_xlat10.xy + vec2(-1.0, -1.0);
    u_xlat1.x = dot(u_xlat1.xy, u_xlat7.xy);
    u_xlat7.xy = u_xlat10.xy * u_xlat10.xy;
    u_xlat7.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat3.xy = u_xlat10.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat10.xy = u_xlat10.xy * u_xlat7.xy;
    u_xlat6 = (-u_xlat11.x) + u_xlat16;
    u_xlat6 = u_xlat10.y * u_xlat6 + u_xlat11.x;
    u_xlat1.x = (-u_xlat2.x) + u_xlat1.x;
    u_xlat15 = u_xlat10.y * u_xlat1.x + u_xlat2.x;
    u_xlat15 = (-u_xlat6) + u_xlat15;
    u_xlat10.x = u_xlat10.x * u_xlat15 + u_xlat6;
    u_xlat10.x = u_xlat10.x + 0.5;
    u_xlat10.x = u_xlat10.x + (-_NoiseClip);
    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);
    u_xlat15 = (-_NoiseClip) + 1.0;
    u_xlat15 = max(u_xlat15, 0.00100000005);
    u_xlat10.x = u_xlat10.x / u_xlat15;
    u_xlat5.x = (-u_xlat5.x) * u_xlat10.x + 1.0;
    u_xlat0.x = u_xlat5.x * u_xlat0.x;
    u_xlat5.xy = vs_INTERP2.xy + (-_RevealOffset.xy);
    u_xlat5.x = dot(u_xlat5.xy, u_xlat5.xy);
    u_xlat5.x = u_xlat5.x + (-_RevealThreshold);
    u_xlat5.x = ceil(u_xlat5.x);
    u_xlat5.x = clamp(u_xlat5.x, 0.0, 1.0);
    u_xlat0.x = u_xlat0.x * u_xlat5.x;
    u_xlatb5 = u_xlat0.x==0.0;
    if(u_xlatb5){discard;}
    u_xlat1.xyz = vs_INTERP1.xyz * _LineColor.xyz;
    u_xlat1.w = u_xlat0.x * vs_INTERP1.w;
    SV_TARGET0 = u_xlat1;
    return;
}

#endif
        
