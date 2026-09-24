// Shader Graphs/Spray
// sacado de furniture_assets_all_22d367c8beca55276af4138414a20260.bundle
// declara: White, _MainTex, _Placing, _Power, _TempTint, _Transition, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM float                _Transition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float                _Placing;
	UNITY_UNIFORM vec4                _TempTint;
	UNITY_UNIFORM float                _Power;
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
vec4 u_xlat0;
vec3 u_xlat1;
mediump float u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
vec4 u_xlat4;
float u_xlat5;
vec2 u_xlat6;
ivec2 u_xlati6;
uint u_xlatu6;
vec2 u_xlat7;
ivec3 u_xlati7;
float u_xlat10;
float u_xlat11;
int u_xlati11;
uint u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0 = max(vec4(_Transition), vec4(0.0, 0.5, 0.200000003, 0.600000024));
    u_xlat0 = min(u_xlat0, vec4(0.5, 1.0, 0.5, 1.0));
    u_xlat1.x = u_xlat0.x + u_xlat0.x;
    u_xlat6.xy = u_xlat0.xx * vec2(0.5, 0.5) + vs_INTERP0.xy;
    u_xlat0.xy = u_xlat0.yw + vec2(-0.5, -0.600000024);
    u_xlat0.xw = (-u_xlat0.xx) * vec2(0.5, 0.5) + u_xlat6.xy;
    u_xlat0.xw = u_xlat0.xw + u_xlat0.xw;
    u_xlat6.xy = floor(u_xlat0.xw);
    u_xlat0.xw = fract(u_xlat0.xw);
    u_xlati2.xy = ivec2(u_xlat6.xy);
    u_xlati16 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati16 + u_xlati2.x;
    u_xlatu16 = uint(u_xlati16) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu16 >> (5u & uint(0x1F)));
    u_xlati16 = int(uint(u_xlatu16 ^ u_xlatu2.x));
    u_xlatu16 = uint(u_xlati16) * 668265261u;
    u_xlatu16 = uint(u_xlatu16 >> (8u & uint(0x1F)));
    u_xlat16 = float(u_xlatu16);
    u_xlat2.yz = vec2(u_xlat16) * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat7.x = floor(u_xlat2.y);
    u_xlat2.x = u_xlat16 * 5.96046519e-08 + (-u_xlat7.x);
    u_xlat16 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat2.xz;
    u_xlat16 = dot(u_xlat2.xy, u_xlat0.xw);
    u_xlat2 = u_xlat6.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
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
    u_xlat2.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.xz;
    u_xlat4 = u_xlat0.xwxw + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat7.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat7.x = inversesqrt(u_xlat7.x);
    u_xlat7.xy = u_xlat7.xx * u_xlat3.yw;
    u_xlat7.x = dot(u_xlat7.xy, u_xlat4.zw);
    u_xlat6.xy = u_xlat6.xy + vec2(1.0, 1.0);
    u_xlati6.xy = ivec2(u_xlat6.xy);
    u_xlati11 = int(uint(uint(u_xlati6.y) ^ 1103515245u));
    u_xlati6.x = u_xlati11 + u_xlati6.x;
    u_xlatu6 = uint(u_xlati11) * uint(u_xlati6.x);
    u_xlatu11 = uint(u_xlatu6 >> (5u & uint(0x1F)));
    u_xlati6.x = int(uint(u_xlatu11 ^ u_xlatu6));
    u_xlatu6 = uint(u_xlati6.x) * 668265261u;
    u_xlatu6 = uint(u_xlatu6 >> (8u & uint(0x1F)));
    u_xlat6.x = float(u_xlatu6);
    u_xlat3.yz = u_xlat6.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat11 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat6.x * 5.96046519e-08 + (-u_xlat11);
    u_xlat6.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat6.x = inversesqrt(u_xlat6.x);
    u_xlat6.xy = u_xlat6.xx * u_xlat3.xz;
    u_xlat12.xy = u_xlat0.xw + vec2(-1.0, -1.0);
    u_xlat6.x = dot(u_xlat6.xy, u_xlat12.xy);
    u_xlat12.xy = u_xlat0.xw * u_xlat0.xw;
    u_xlat12.xy = u_xlat0.xw * u_xlat12.xy;
    u_xlat3.xy = u_xlat0.xw * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat0.xw = u_xlat0.xw * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat0.xw = u_xlat0.xw * u_xlat12.xy;
    u_xlat11 = (-u_xlat16) + u_xlat2.x;
    u_xlat11 = u_xlat0.w * u_xlat11 + u_xlat16;
    u_xlat6.x = (-u_xlat7.x) + u_xlat6.x;
    u_xlat15 = u_xlat0.w * u_xlat6.x + u_xlat7.x;
    u_xlat15 = (-u_xlat11) + u_xlat15;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat11;
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.x = u_xlat0.z + u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat10 = vs_INTERP0.y + vs_INTERP0.x;
    u_xlat10 = u_xlat10 * 0.5;
    u_xlat10 = log2(abs(u_xlat10));
    u_xlat10 = u_xlat10 * _Power;
    u_xlat10 = exp2(u_xlat10);
    u_xlat15 = u_xlat10 * u_xlat0.x;
    u_xlat15 = u_xlat15 * 0.5 + u_xlat1.x;
    u_xlat15 = u_xlat15 + -0.5;
    u_xlat15 = u_xlat15 + u_xlat15;
    u_xlat15 = clamp(u_xlat15, 0.0, 1.0);
    u_xlat16_1 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat6.x = u_xlat16_1 + -0.5;
    u_xlat6.x = clamp(u_xlat6.x, 0.0, 1.0);
    u_xlat15 = u_xlat15 * u_xlat6.x;
    u_xlat0.x = (-u_xlat0.x) * u_xlat10 + 1.0;
    u_xlat0.x = u_xlat0.x * 0.5 + -0.5;
    u_xlat0.x = u_xlat0.y * 2.5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x + u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat5 = u_xlat16_1 * 2.5;
    u_xlat5 = clamp(u_xlat5, 0.0, 1.0);
    u_xlat0.x = u_xlat5 * u_xlat0.x;
    u_xlat0.x = max(u_xlat0.x, u_xlat15);
    u_xlat10 = _TimeParameters.x + _TimeParameters.x;
    u_xlat10 = sin(u_xlat10);
    u_xlat10 = u_xlat10 * 0.25 + 0.75;
    u_xlat5 = u_xlat5 * u_xlat10 + (-u_xlat0.x);
    u_xlat0.x = _Placing * u_xlat5 + u_xlat0.x;
    u_xlat0.w = u_xlat0.x * vs_INTERP1.w;
    u_xlatb1 = u_xlat0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat1.xyz = (-vs_INTERP1.xyz) + _TempTint.xyz;
    u_xlat0.xyz = vec3(_Placing) * u_xlat1.xyz + vs_INTERP1.xyz;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         ºu
                         SKINNED_SPRITE  Ú,  #ifdef VERTEX


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
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM float                _Transition;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float                _Placing;
	UNITY_UNIFORM vec4                _TempTint;
	UNITY_UNIFORM float                _Power;
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
vec4 u_xlat0;
vec3 u_xlat1;
mediump float u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
ivec4 u_xlati2;
uvec2 u_xlatu2;
vec4 u_xlat3;
vec4 u_xlat4;
float u_xlat5;
vec2 u_xlat6;
ivec2 u_xlati6;
uint u_xlatu6;
vec2 u_xlat7;
ivec3 u_xlati7;
float u_xlat10;
float u_xlat11;
int u_xlati11;
uint u_xlatu11;
vec2 u_xlat12;
uvec2 u_xlatu12;
float u_xlat15;
float u_xlat16;
int u_xlati16;
uint u_xlatu16;
void main()
{
    u_xlat0 = max(vec4(_Transition), vec4(0.0, 0.5, 0.200000003, 0.600000024));
    u_xlat0 = min(u_xlat0, vec4(0.5, 1.0, 0.5, 1.0));
    u_xlat1.x = u_xlat0.x + u_xlat0.x;
    u_xlat6.xy = u_xlat0.xx * vec2(0.5, 0.5) + vs_INTERP0.xy;
    u_xlat0.xy = u_xlat0.yw + vec2(-0.5, -0.600000024);
    u_xlat0.xw = (-u_xlat0.xx) * vec2(0.5, 0.5) + u_xlat6.xy;
    u_xlat0.xw = u_xlat0.xw + u_xlat0.xw;
    u_xlat6.xy = floor(u_xlat0.xw);
    u_xlat0.xw = fract(u_xlat0.xw);
    u_xlati2.xy = ivec2(u_xlat6.xy);
    u_xlati16 = int(uint(uint(u_xlati2.y) ^ 1103515245u));
    u_xlati2.x = u_xlati16 + u_xlati2.x;
    u_xlatu16 = uint(u_xlati16) * uint(u_xlati2.x);
    u_xlatu2.x = uint(u_xlatu16 >> (5u & uint(0x1F)));
    u_xlati16 = int(uint(u_xlatu16 ^ u_xlatu2.x));
    u_xlatu16 = uint(u_xlati16) * 668265261u;
    u_xlatu16 = uint(u_xlatu16 >> (8u & uint(0x1F)));
    u_xlat16 = float(u_xlatu16);
    u_xlat2.yz = vec2(u_xlat16) * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat7.x = floor(u_xlat2.y);
    u_xlat2.x = u_xlat16 * 5.96046519e-08 + (-u_xlat7.x);
    u_xlat16 = dot(u_xlat2.xz, u_xlat2.xz);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat2.xy = vec2(u_xlat16) * u_xlat2.xz;
    u_xlat16 = dot(u_xlat2.xy, u_xlat0.xw);
    u_xlat2 = u_xlat6.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
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
    u_xlat2.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat2.x = inversesqrt(u_xlat2.x);
    u_xlat2.xy = u_xlat2.xx * u_xlat3.xz;
    u_xlat4 = u_xlat0.xwxw + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat2.x = dot(u_xlat2.xy, u_xlat4.xy);
    u_xlat7.x = dot(u_xlat3.yw, u_xlat3.yw);
    u_xlat7.x = inversesqrt(u_xlat7.x);
    u_xlat7.xy = u_xlat7.xx * u_xlat3.yw;
    u_xlat7.x = dot(u_xlat7.xy, u_xlat4.zw);
    u_xlat6.xy = u_xlat6.xy + vec2(1.0, 1.0);
    u_xlati6.xy = ivec2(u_xlat6.xy);
    u_xlati11 = int(uint(uint(u_xlati6.y) ^ 1103515245u));
    u_xlati6.x = u_xlati11 + u_xlati6.x;
    u_xlatu6 = uint(u_xlati11) * uint(u_xlati6.x);
    u_xlatu11 = uint(u_xlatu6 >> (5u & uint(0x1F)));
    u_xlati6.x = int(uint(u_xlatu11 ^ u_xlatu6));
    u_xlatu6 = uint(u_xlati6.x) * 668265261u;
    u_xlatu6 = uint(u_xlatu6 >> (8u & uint(0x1F)));
    u_xlat6.x = float(u_xlatu6);
    u_xlat3.yz = u_xlat6.xx * vec2(5.96046519e-08, 5.96046519e-08) + vec2(0.5, -0.5);
    u_xlat11 = floor(u_xlat3.y);
    u_xlat3.x = u_xlat6.x * 5.96046519e-08 + (-u_xlat11);
    u_xlat6.x = dot(u_xlat3.xz, u_xlat3.xz);
    u_xlat6.x = inversesqrt(u_xlat6.x);
    u_xlat6.xy = u_xlat6.xx * u_xlat3.xz;
    u_xlat12.xy = u_xlat0.xw + vec2(-1.0, -1.0);
    u_xlat6.x = dot(u_xlat6.xy, u_xlat12.xy);
    u_xlat12.xy = u_xlat0.xw * u_xlat0.xw;
    u_xlat12.xy = u_xlat0.xw * u_xlat12.xy;
    u_xlat3.xy = u_xlat0.xw * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat0.xw = u_xlat0.xw * u_xlat3.xy + vec2(10.0, 10.0);
    u_xlat0.xw = u_xlat0.xw * u_xlat12.xy;
    u_xlat11 = (-u_xlat16) + u_xlat2.x;
    u_xlat11 = u_xlat0.w * u_xlat11 + u_xlat16;
    u_xlat6.x = (-u_xlat7.x) + u_xlat6.x;
    u_xlat15 = u_xlat0.w * u_xlat6.x + u_xlat7.x;
    u_xlat15 = (-u_xlat11) + u_xlat15;
    u_xlat0.x = u_xlat0.x * u_xlat15 + u_xlat11;
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.x = u_xlat0.z + u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat10 = vs_INTERP0.y + vs_INTERP0.x;
    u_xlat10 = u_xlat10 * 0.5;
    u_xlat10 = log2(abs(u_xlat10));
    u_xlat10 = u_xlat10 * _Power;
    u_xlat10 = exp2(u_xlat10);
    u_xlat15 = u_xlat10 * u_xlat0.x;
    u_xlat15 = u_xlat15 * 0.5 + u_xlat1.x;
    u_xlat15 = u_xlat15 + -0.5;
    u_xlat15 = u_xlat15 + u_xlat15;
    u_xlat15 = clamp(u_xlat15, 0.0, 1.0);
    u_xlat16_1 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlat6.x = u_xlat16_1 + -0.5;
    u_xlat6.x = clamp(u_xlat6.x, 0.0, 1.0);
    u_xlat15 = u_xlat15 * u_xlat6.x;
    u_xlat0.x = (-u_xlat0.x) * u_xlat10 + 1.0;
    u_xlat0.x = u_xlat0.x * 0.5 + -0.5;
    u_xlat0.x = u_xlat0.y * 2.5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x + u_xlat0.x;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat5 = u_xlat16_1 * 2.5;
    u_xlat5 = clamp(u_xlat5, 0.0, 1.0);
    u_xlat0.x = u_xlat5 * u_xlat0.x;
    u_xlat0.x = max(u_xlat0.x, u_xlat15);
    u_xlat10 = _TimeParameters.x + _TimeParameters.x;
    u_xlat10 = sin(u_xlat10);
    u_xlat10 = u_xlat10 * 0.25 + 0.75;
    u_xlat5 = u_xlat5 * u_xlat10 + (-u_xlat0.x);
    u_xlat0.x = _Placing * u_xlat5 + u_xlat0.x;
    u_xlat0.w = u_xlat0.x * vs_INTERP1.w;
    u_xlatb1 = u_xlat0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat1.xyz = (-vs_INTERP1.xyz) + _TempTint.xyz;
    u_xlat0.xyz = vec3(_Placing) * u_xlat1.xyz + vs_INTERP1.xyz;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         
