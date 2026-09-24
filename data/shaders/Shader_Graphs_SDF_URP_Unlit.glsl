// Shader Graphs/SDF URP Unlit
// sacado de sharedassets14.assets
// declara: _AUTOMATIC_SMOOTHING, _BaseA, _BaseB, _ColorA, _ColorB, _ContoursManualSmoothing, _Cutoff, _MainTex, _QueueControl, _QueueOffset, _SUPERSAMPLE, _TWO_CONTOURS, _USEVERTEXCOLORS, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
out highp vec4 vs_INTERP0;
highp vec4 vs_INTERP1;
highp vec3 vs_INTERP2;
highp vec3 vs_INTERP3;
vec3 u_xlat0;
vec4 u_xlat1;
float u_xlat6;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    vs_INTERP2.xyz = u_xlat0.xyz;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
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
uniform 	float _AlphaToMaskAvailable;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec4 vs_INTERP0;
layout(location = 0) out mediump vec4 SV_Target0;
float u_xlat0;
int u_xlati0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
mediump float u_xlat16_2;
float u_xlat3;
mediump float u_xlat16_5;
mediump float u_xlat16_6;
bool u_xlatb6;
mediump float u_xlat16_8;
int op_not(int value) { return -value - 1; }
ivec2 op_not(ivec2 a) { a.x = op_not(a.x); a.y = op_not(a.y); return a; }
ivec3 op_not(ivec3 a) { a.x = op_not(a.x); a.y = op_not(a.y); a.z = op_not(a.z); return a; }
ivec4 op_not(ivec4 a) { a.x = op_not(a.x); a.y = op_not(a.y); a.z = op_not(a.z); a.w = op_not(a.w); return a; }

void main()
{
    u_xlat0 = _ContoursManualSmoothing.z + _ContoursManualSmoothing.x;
    u_xlat3 = (-_ContoursManualSmoothing.z) + _ContoursManualSmoothing.x;
    u_xlat0 = (-u_xlat3) + u_xlat0;
    u_xlat0 = float(1.0) / u_xlat0;
    u_xlat16_6 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat3 = (-u_xlat3) + u_xlat16_6;
    u_xlat0 = u_xlat0 * u_xlat3;
    u_xlat0 = clamp(u_xlat0, 0.0, 1.0);
    u_xlat3 = u_xlat0 * -2.0 + 3.0;
    u_xlat0 = u_xlat0 * u_xlat0;
    u_xlat0 = u_xlat0 * u_xlat3;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat1 = u_xlat16_1 * _ColorA;
    u_xlat3 = u_xlat0 * u_xlat1.w;
    u_xlat16_2 = u_xlat1.w * u_xlat0 + (-_Cutoff);
    SV_Target0.xyz = u_xlat1.xyz;
    u_xlat16_5 = dFdx(u_xlat3);
    u_xlat16_8 = dFdy(u_xlat3);
    u_xlat16_5 = abs(u_xlat16_8) + abs(u_xlat16_5);
    u_xlat16_8 = (-u_xlat16_5) * 0.5 + u_xlat16_2;
    u_xlat16_5 = max(u_xlat16_5, 9.99999975e-05);
    u_xlat16_5 = u_xlat16_8 / u_xlat16_5;
    u_xlat16_5 = u_xlat16_5 + 1.0;
    u_xlat16_5 = clamp(u_xlat16_5, 0.0, 1.0);
    u_xlati0 = int((0.0>=_Cutoff) ? 0xFFFFFFFFu : uint(0));
    u_xlat16_5 = (u_xlati0 != 0) ? 1.0 : u_xlat16_5;
    u_xlati0 = op_not(u_xlati0);
    u_xlat16_8 = u_xlat16_5 + -9.99999975e-05;
    u_xlatb6 = _AlphaToMaskAvailable!=0.0;
    u_xlati0 = u_xlatb6 ? u_xlati0 : int(0);
    SV_Target0.w = (u_xlatb6) ? u_xlat16_5 : u_xlat3;
    u_xlat16_2 = (u_xlati0 != 0) ? u_xlat16_8 : u_xlat16_2;
    u_xlatb0 = u_xlat16_2<0.0;
    if(u_xlatb0){discard;}
    return;
}

#endif
         ºu
                         _AUTOMATIC_SMOOTHING_ON    _USEVERTEXCOLORS©  #ifdef VERTEX


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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
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
vec3 u_xlat0;
vec4 u_xlat1;
float u_xlat6;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    vs_INTERP2.xyz = u_xlat0.xyz;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
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
uniform 	float _AlphaToMaskAvailable;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
mediump float u_xlat16_3;
float u_xlat4;
int u_xlati4;
mediump float u_xlat16_7;
float u_xlat8;
bool u_xlatb8;
mediump float u_xlat16_11;
int op_not(int value) { return -value - 1; }
ivec2 op_not(ivec2 a) { a.x = op_not(a.x); a.y = op_not(a.y); return a; }
ivec3 op_not(ivec3 a) { a.x = op_not(a.x); a.y = op_not(a.y); a.z = op_not(a.z); return a; }
ivec4 op_not(ivec4 a) { a.x = op_not(a.x); a.y = op_not(a.y); a.z = op_not(a.z); a.w = op_not(a.w); return a; }

void main()
{
    u_xlat0.x = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat4 = dFdx(u_xlat0.x);
    u_xlat8 = dFdy(u_xlat0.x);
    u_xlat4 = abs(u_xlat8) + abs(u_xlat4);
    u_xlat4 = u_xlat4 + _ContoursManualSmoothing.z;
    u_xlat0.z = u_xlat4 + _ContoursManualSmoothing.x;
    u_xlat4 = (-u_xlat4) + _ContoursManualSmoothing.x;
    u_xlat0.xz = (-vec2(u_xlat4)) + u_xlat0.xz;
    u_xlat4 = float(1.0) / u_xlat0.z;
    u_xlat0.x = u_xlat4 * u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat4 = u_xlat0.x * -2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = u_xlat0.x * u_xlat4;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat2 = vs_INTERP1 * _ColorA;
    u_xlat1 = u_xlat16_1 * u_xlat2;
    u_xlat16_3 = u_xlat1.w * u_xlat0.x + (-_Cutoff);
    u_xlat0.x = u_xlat0.x * u_xlat1.w;
    SV_Target0.xyz = u_xlat1.xyz;
    u_xlat16_7 = dFdx(u_xlat0.x);
    u_xlat16_11 = dFdy(u_xlat0.x);
    u_xlat16_7 = abs(u_xlat16_11) + abs(u_xlat16_7);
    u_xlat16_11 = (-u_xlat16_7) * 0.5 + u_xlat16_3;
    u_xlat16_7 = max(u_xlat16_7, 9.99999975e-05);
    u_xlat16_7 = u_xlat16_11 / u_xlat16_7;
    u_xlat16_7 = u_xlat16_7 + 1.0;
    u_xlat16_7 = clamp(u_xlat16_7, 0.0, 1.0);
    u_xlati4 = int((0.0>=_Cutoff) ? 0xFFFFFFFFu : uint(0));
    u_xlat16_7 = (u_xlati4 != 0) ? 1.0 : u_xlat16_7;
    u_xlati4 = op_not(u_xlati4);
    u_xlat16_11 = u_xlat16_7 + -9.99999975e-05;
    u_xlatb8 = _AlphaToMaskAvailable!=0.0;
    u_xlati4 = u_xlatb8 ? u_xlati4 : int(0);
    SV_Target0.w = (u_xlatb8) ? u_xlat16_7 : u_xlat0.x;
    u_xlat16_3 = (u_xlati4 != 0) ? u_xlat16_11 : u_xlat16_3;
    u_xlatb0 = u_xlat16_3<0.0;
    if(u_xlatb0){discard;}
    return;
}

#endif
          ºu
                      $Globals              UnityPerMaterial°              UnityPerDrawð              ºu
                       g(  #ifdef VERTEX


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
uniform 	vec4 hlslcc_mtx4x4_PrevViewProjMatrix[4];
uniform 	vec4 hlslcc_mtx4x4_NonJitteredViewProjMatrix[4];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];
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
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4                unity_MotionVectorsParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
in highp vec3 in_TEXCOORD4;
out highp vec3 vs_CLIP_POSITION_NO_JITTER0;
out highp vec3 vs_PREVIOUS_CLIP_POSITION_NO_JITTER0;
out highp vec4 vs_INTERP0;
highp vec4 vs_INTERP1;
vec4 u_xlat0;
vec4 u_xlat1;
vec3 u_xlat2;
bool u_xlatb9;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    u_xlatb9 = unity_MotionVectorsParams.y!=0.0;
    if(u_xlatb9){
        u_xlatb9 = unity_MotionVectorsParams.x==1.0;
        u_xlat1.xyz = (bool(u_xlatb9)) ? in_TEXCOORD4.xyz : in_POSITION0.xyz;
        u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4_NonJitteredViewProjMatrix[1].xyw;
        u_xlat0.xyw = hlslcc_mtx4x4_NonJitteredViewProjMatrix[0].xyw * u_xlat0.xxx + u_xlat2.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_NonJitteredViewProjMatrix[2].xyw * u_xlat0.zzz + u_xlat0.xyw;
        vs_CLIP_POSITION_NO_JITTER0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_NonJitteredViewProjMatrix[3].xyw;
        u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixPreviousM[1];
        u_xlat0 = hlslcc_mtx4x4unity_MatrixPreviousM[0] * u_xlat1.xxxx + u_xlat0;
        u_xlat0 = hlslcc_mtx4x4unity_MatrixPreviousM[2] * u_xlat1.zzzz + u_xlat0;
        u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixPreviousM[3];
        u_xlat1.xyz = u_xlat0.yyy * hlslcc_mtx4x4_PrevViewProjMatrix[1].xyw;
        u_xlat1.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[0].xyw * u_xlat0.xxx + u_xlat1.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[2].xyw * u_xlat0.zzz + u_xlat1.xyz;
        vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[3].xyw * u_xlat0.www + u_xlat0.xyz;
    } else {
        vs_CLIP_POSITION_NO_JITTER0.xyz = vec3(0.0, 0.0, 0.0);
        vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xyz = vec3(0.0, 0.0, 0.0);
    }
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];
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
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4                unity_MotionVectorsParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec3 vs_CLIP_POSITION_NO_JITTER0;
in highp  vec3 vs_PREVIOUS_CLIP_POSITION_NO_JITTER0;
in highp  vec4 vs_INTERP0;
layout(location = 0) out highp vec4 SV_Target0;
vec2 u_xlat0;
bool u_xlatb0;
float u_xlat1;
mediump float u_xlat16_1;
float u_xlat2;
mediump float u_xlat16_2;
bool u_xlatb2;
void main()
{
    u_xlat0.x = _ContoursManualSmoothing.z + _ContoursManualSmoothing.x;
    u_xlat1 = (-_ContoursManualSmoothing.z) + _ContoursManualSmoothing.x;
    u_xlat0.x = (-u_xlat1) + u_xlat0.x;
    u_xlat0.x = float(1.0) / u_xlat0.x;
    u_xlat16_2 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = (-u_xlat1) + u_xlat16_2;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1 = u_xlat0.x * -2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = u_xlat16_1 * _ColorA.w;
    u_xlat0.x = u_xlat1 * u_xlat0.x + (-_Cutoff);
    u_xlatb0 = u_xlat0.x<0.0;
    if(u_xlatb0){discard;}
    u_xlat0.x = float(1.0) / float(vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.z);
    u_xlat0.xy = u_xlat0.xx * vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xy;
    u_xlat2 = float(1.0) / float(vs_CLIP_POSITION_NO_JITTER0.z);
    u_xlat0.xy = vs_CLIP_POSITION_NO_JITTER0.xy * vec2(u_xlat2) + (-u_xlat0.xy);
    u_xlat0.xy = u_xlat0.xy * vec2(0.5, 0.5);
    u_xlatb2 = unity_MotionVectorsParams.y!=0.0;
    SV_Target0.xy = bool(u_xlatb2) ? u_xlat0.xy : vec2(0.0, 0.0);
    SV_Target0.zw = vec2(0.0, 0.0);
    return;
}

#endif
       ºu
                         _AUTOMATIC_SMOOTHING_ON    _USEVERTEXCOLORSç(  #ifdef VERTEX


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
uniform 	vec4 hlslcc_mtx4x4_PrevViewProjMatrix[4];
uniform 	vec4 hlslcc_mtx4x4_NonJitteredViewProjMatrix[4];
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerDraw {
#endif
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];
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
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4                unity_MotionVectorsParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
in highp vec3 in_TEXCOORD4;
out highp vec3 vs_CLIP_POSITION_NO_JITTER0;
out highp vec3 vs_PREVIOUS_CLIP_POSITION_NO_JITTER0;
out highp vec4 vs_INTERP0;
out highp vec4 vs_INTERP1;
vec4 u_xlat0;
vec4 u_xlat1;
vec3 u_xlat2;
bool u_xlatb9;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];
    u_xlatb9 = unity_MotionVectorsParams.y!=0.0;
    if(u_xlatb9){
        u_xlatb9 = unity_MotionVectorsParams.x==1.0;
        u_xlat1.xyz = (bool(u_xlatb9)) ? in_TEXCOORD4.xyz : in_POSITION0.xyz;
        u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4_NonJitteredViewProjMatrix[1].xyw;
        u_xlat0.xyw = hlslcc_mtx4x4_NonJitteredViewProjMatrix[0].xyw * u_xlat0.xxx + u_xlat2.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_NonJitteredViewProjMatrix[2].xyw * u_xlat0.zzz + u_xlat0.xyw;
        vs_CLIP_POSITION_NO_JITTER0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_NonJitteredViewProjMatrix[3].xyw;
        u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixPreviousM[1];
        u_xlat0 = hlslcc_mtx4x4unity_MatrixPreviousM[0] * u_xlat1.xxxx + u_xlat0;
        u_xlat0 = hlslcc_mtx4x4unity_MatrixPreviousM[2] * u_xlat1.zzzz + u_xlat0;
        u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixPreviousM[3];
        u_xlat1.xyz = u_xlat0.yyy * hlslcc_mtx4x4_PrevViewProjMatrix[1].xyw;
        u_xlat1.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[0].xyw * u_xlat0.xxx + u_xlat1.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[2].xyw * u_xlat0.zzz + u_xlat1.xyz;
        vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xyz = hlslcc_mtx4x4_PrevViewProjMatrix[3].xyw * u_xlat0.www + u_xlat0.xyz;
    } else {
        vs_CLIP_POSITION_NO_JITTER0.xyz = vec3(0.0, 0.0, 0.0);
        vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xyz = vec3(0.0, 0.0, 0.0);
    }
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];
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
	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_MatrixPreviousM[4];
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];
	UNITY_UNIFORM vec4                unity_MotionVectorsParams;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(1) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec3 vs_CLIP_POSITION_NO_JITTER0;
in highp  vec3 vs_PREVIOUS_CLIP_POSITION_NO_JITTER0;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
layout(location = 0) out highp vec4 SV_Target0;
vec3 u_xlat0;
bool u_xlatb0;
float u_xlat1;
mediump float u_xlat16_1;
float u_xlat2;
bool u_xlatb2;
void main()
{
    u_xlat0.x = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = dFdx(u_xlat0.x);
    u_xlat2 = dFdy(u_xlat0.x);
    u_xlat1 = abs(u_xlat2) + abs(u_xlat1);
    u_xlat1 = u_xlat1 + _ContoursManualSmoothing.z;
    u_xlat0.z = u_xlat1 + _ContoursManualSmoothing.x;
    u_xlat1 = (-u_xlat1) + _ContoursManualSmoothing.x;
    u_xlat0.xz = (-vec2(u_xlat1)) + u_xlat0.xz;
    u_xlat1 = float(1.0) / u_xlat0.z;
    u_xlat0.x = u_xlat1 * u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1 = u_xlat0.x * -2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat2 = vs_INTERP1.w * _ColorA.w;
    u_xlat1 = u_xlat2 * u_xlat16_1;
    u_xlat0.x = u_xlat1 * u_xlat0.x + (-_Cutoff);
    u_xlatb0 = u_xlat0.x<0.0;
    if(u_xlatb0){discard;}
    u_xlat0.x = float(1.0) / float(vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.z);
    u_xlat0.xy = u_xlat0.xx * vs_PREVIOUS_CLIP_POSITION_NO_JITTER0.xy;
    u_xlat2 = float(1.0) / float(vs_CLIP_POSITION_NO_JITTER0.z);
    u_xlat0.xy = vs_CLIP_POSITION_NO_JITTER0.xy * vec2(u_xlat2) + (-u_xlat0.xy);
    u_xlat0.xy = u_xlat0.xy * vec2(0.5, 0.5);
    u_xlatb2 = unity_MotionVectorsParams.y!=0.0;
    SV_Target0.xy = bool(u_xlatb2) ? u_xlat0.xy : vec2(0.0, 0.0);
    SV_Target0.zw = vec2(0.0, 0.0);
    return;
}

#endif
       ºu
                       £  #ifdef VERTEX


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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp vec3 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_TEXCOORD0;
in highp vec4 in_COLOR0;
out highp vec4 vs_INTERP0;
highp vec4 vs_INTERP1;
out highp vec3 vs_INTERP2;
vec4 u_xlat0;
vec4 u_xlat1;
float u_xlat6;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
    u_xlat0.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat0.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat0.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat6 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat6 = max(u_xlat6, 1.17549435e-38);
    u_xlat6 = inversesqrt(u_xlat6);
    vs_INTERP2.xyz = vec3(u_xlat6) * u_xlat0.xyz;
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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec4 vs_INTERP0;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
bool u_xlatb0;
float u_xlat1;
mediump float u_xlat16_1;
mediump float u_xlat16_2;
void main()
{
    u_xlat0.x = _ContoursManualSmoothing.z + _ContoursManualSmoothing.x;
    u_xlat1 = (-_ContoursManualSmoothing.z) + _ContoursManualSmoothing.x;
    u_xlat0.x = (-u_xlat1) + u_xlat0.x;
    u_xlat0.x = float(1.0) / u_xlat0.x;
    u_xlat16_2 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = (-u_xlat1) + u_xlat16_2;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1 = u_xlat0.x * -2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = u_xlat16_1 * _ColorA.w;
    u_xlat0.x = u_xlat1 * u_xlat0.x + (-_Cutoff);
    u_xlatb0 = u_xlat0.x<0.0;
    if(u_xlatb0){discard;}
    u_xlat0.x = dot(vs_INTERP2.xyz, vs_INTERP2.xyz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xyz = u_xlat0.xxx * vs_INTERP2.xyz;
    SV_Target0.xyz = u_xlat0.xyz;
    SV_Target0.w = 0.0;
    return;
}

#endif
        ºu
                         _AUTOMATIC_SMOOTHING_ON    _USEVERTEXCOLORS2  #ifdef VERTEX


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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteColor;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpriteProps;
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
vec4 u_xlat0;
vec4 u_xlat1;
float u_xlat6;
void main()
{
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];
    vs_INTERP0 = in_TEXCOORD0;
    vs_INTERP1 = in_COLOR0;
    u_xlat0.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat0.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat0.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat6 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat6 = max(u_xlat6, 1.17549435e-38);
    u_xlat6 = inversesqrt(u_xlat6);
    vs_INTERP2.xyz = vec3(u_xlat6) * u_xlat0.xyz;
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
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _ContoursManualSmoothing;
	UNITY_UNIFORM vec4                _ColorA;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseA_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_ColorB;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_BaseB_TexelSize;
	UNITY_UNIFORM float                _Cutoff;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _BaseA;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
bool u_xlatb0;
float u_xlat1;
mediump float u_xlat16_1;
float u_xlat2;
void main()
{
    u_xlat0.x = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat1 = dFdx(u_xlat0.x);
    u_xlat2 = dFdy(u_xlat0.x);
    u_xlat1 = abs(u_xlat2) + abs(u_xlat1);
    u_xlat1 = u_xlat1 + _ContoursManualSmoothing.z;
    u_xlat0.z = u_xlat1 + _ContoursManualSmoothing.x;
    u_xlat1 = (-u_xlat1) + _ContoursManualSmoothing.x;
    u_xlat0.xz = (-vec2(u_xlat1)) + u_xlat0.xz;
    u_xlat1 = float(1.0) / u_xlat0.z;
    u_xlat0.x = u_xlat1 * u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat1 = u_xlat0.x * -2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = u_xlat0.x * u_xlat1;
    u_xlat16_1 = texture(_BaseA, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat2 = vs_INTERP1.w * _ColorA.w;
    u_xlat1 = u_xlat2 * u_xlat16_1;
    u_xlat0.x = u_xlat1 * u_xlat0.x + (-_Cutoff);
    u_xlatb0 = u_xlat0.x<0.0;
    if(u_xlatb0){discard;}
    u_xlat0.x = dot(vs_INTERP2.xyz, vs_INTERP2.xyz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xyz = u_xlat0.xxx * vs_INTERP2.xyz;
    SV_Target0.xyz = u_xlat0.xyz;
    SV_Target0.w = 0.0;
    return;
}

#endif
         
