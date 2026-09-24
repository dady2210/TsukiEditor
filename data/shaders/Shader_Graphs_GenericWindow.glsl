// Shader Graphs/GenericWindow
// sacado de ad667f8c1a99840bdb8d44b7f1262520
// declara: White, _Edge, _MainTex, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
uniform 	vec4 _ScaledScreenParams;
uniform 	vec4 _ProjectionParams;
uniform 	vec4 _ScreenParams;
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
	UNITY_UNIFORM float                _Edge;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
bvec2 u_xlatb0;
vec4 u_xlat1;
vec4 u_xlat2;
bool u_xlatb2;
vec4 u_xlat3;
bool u_xlatb3;
vec4 u_xlat4;
bool u_xlatb4;
float u_xlat5;
float u_xlat6;
bool u_xlatb6;
float u_xlat7;
bool u_xlatb7;
float u_xlat8;
bool u_xlatb8;
vec2 u_xlat10;
bool u_xlatb10;
float u_xlat11;
float u_xlat12;
float u_xlat15;
float u_xlat16;
float u_xlat17;
bool u_xlatb17;
float u_xlat18;
bool u_xlatb18;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlatb10 = 0.0<_ProjectionParams.x;
    u_xlat15 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb10) ? u_xlat15 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat10.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat15 = (-u_xlat10.y) + 1.0;
    u_xlat1.x = dot(hlslcc_mtx4x4unity_ObjectToWorld[0].xyz, hlslcc_mtx4x4unity_ObjectToWorld[0].xyz);
    u_xlat1.y = dot(hlslcc_mtx4x4unity_ObjectToWorld[1].xyz, hlslcc_mtx4x4unity_ObjectToWorld[1].xyz);
    u_xlat1.xy = sqrt(u_xlat1.xy);
    u_xlat11 = -0.5 / u_xlat1.y;
    u_xlat16 = u_xlat11 * u_xlat1.x;
    u_xlat2.x = vs_INTERP0.x * u_xlat16 + vs_INTERP0.y;
    u_xlat7 = ceil(u_xlat2.x);
    u_xlat11 = (-u_xlat1.x) * u_xlat11 + vs_INTERP0.y;
    u_xlat11 = vs_INTERP0.x * u_xlat16 + u_xlat11;
    u_xlat11 = floor(u_xlat11);
    u_xlat11 = (-u_xlat11) + u_xlat7;
    u_xlat16 = _Edge / u_xlat1.x;
    u_xlat12 = u_xlat16 + vs_INTERP0.x;
    u_xlat12 = floor(u_xlat12);
    u_xlat17 = _Edge / u_xlat1.y;
    u_xlat3.x = (-u_xlat17) + u_xlat2.x;
    u_xlat3.x = ceil(u_xlat3.x);
    u_xlat3.x = u_xlat7 + (-u_xlat3.x);
    u_xlat12 = u_xlat12 + u_xlat3.x;
    u_xlat12 = u_xlat11 * u_xlat12;
    u_xlat12 = clamp(u_xlat12, 0.0, 1.0);
    u_xlat2.x = (-u_xlat17) * 2.0 + u_xlat2.x;
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat2.x = (-u_xlat2.x) + u_xlat7;
    u_xlat16 = u_xlat16 * 2.0 + vs_INTERP0.x;
    u_xlat16 = floor(u_xlat16);
    u_xlat16 = u_xlat16 + u_xlat2.x;
    u_xlat16 = u_xlat16 * u_xlat11;
    u_xlat16 = clamp(u_xlat16, 0.0, 1.0);
    u_xlat1.w = u_xlat16 + u_xlat12;
    u_xlat2.x = _ScreenParams.y / _ScreenParams.x;
    u_xlat10.x = u_xlat2.x * u_xlat15 + u_xlat10.x;
    u_xlat2.xyz = u_xlat10.xxx * vec3(40.0, 20.0, 10.0);
    u_xlat3.xyz = floor(u_xlat2.xyz);
    u_xlat2.xyz = fract(u_xlat2.xyz);
    u_xlat4.xyz = u_xlat2.xyz * u_xlat2.xyz;
    u_xlat2.xyz = (-u_xlat2.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat2.xyz = u_xlat2.xyz * u_xlat4.xyz;
    u_xlat4 = u_xlat3.xxyy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat15 = dot(u_xlat3.xx, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb17 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb17) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat15 = u_xlat15 * 43758.5469;
    u_xlat15 = fract(u_xlat15);
    u_xlat17 = dot(u_xlat4.yx, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat17 = u_xlat17 * 43758.5469;
    u_xlat17 = fract(u_xlat17);
    u_xlat3.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb18 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb18) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat18 = dot(u_xlat4.yy, vec2(12.9898005, 78.2330017));
    u_xlat18 = u_xlat18 * 0.159154937;
    u_xlatb4 = u_xlat18>=(-u_xlat18);
    u_xlat18 = fract(abs(u_xlat18));
    u_xlat18 = (u_xlatb4) ? u_xlat18 : (-u_xlat18);
    u_xlat18 = u_xlat18 * 6.28318548;
    u_xlat18 = sin(u_xlat18);
    u_xlat3.w = u_xlat18 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat17 = (-u_xlat15) + u_xlat17;
    u_xlat15 = u_xlat2.x * u_xlat17 + u_xlat15;
    u_xlat17 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat17 = u_xlat2.x * u_xlat17 + u_xlat3.x;
    u_xlat17 = (-u_xlat15) + u_xlat17;
    u_xlat15 = u_xlat2.x * u_xlat17 + u_xlat15;
    u_xlat2.x = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb17 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb17) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat17 = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat2.xw = fract(u_xlat2.xw);
    u_xlat3.x = dot(u_xlat4.wz, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb8 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb8) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat8 = dot(u_xlat4.zz, vec2(12.9898005, 78.2330017));
    u_xlat8 = u_xlat8 * 0.159154937;
    u_xlatb18 = u_xlat8>=(-u_xlat8);
    u_xlat8 = fract(abs(u_xlat8));
    u_xlat8 = (u_xlatb18) ? u_xlat8 : (-u_xlat8);
    u_xlat8 = u_xlat8 * 6.28318548;
    u_xlat8 = sin(u_xlat8);
    u_xlat3.y = u_xlat8 * 43758.5469;
    u_xlat3.xy = fract(u_xlat3.xy);
    u_xlat17 = (-u_xlat2.x) + u_xlat2.w;
    u_xlat2.x = u_xlat2.y * u_xlat17 + u_xlat2.x;
    u_xlat17 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat17 = u_xlat2.y * u_xlat17 + u_xlat3.x;
    u_xlat17 = (-u_xlat2.x) + u_xlat17;
    u_xlat2.x = u_xlat2.y * u_xlat17 + u_xlat2.x;
    u_xlat2.x = u_xlat2.x * 0.25;
    u_xlat15 = u_xlat15 * 0.125 + u_xlat2.x;
    u_xlat2.xy = u_xlat3.zz + vec2(0.0, 1.0);
    u_xlat17 = dot(u_xlat3.zz, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat3.x = dot(u_xlat2.yx, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb8 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb8) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat2.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb8 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb8) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat7 = dot(u_xlat2.yy, vec2(12.9898005, 78.2330017));
    u_xlat7 = u_xlat7 * 0.159154937;
    u_xlatb8 = u_xlat7>=(-u_xlat7);
    u_xlat7 = fract(abs(u_xlat7));
    u_xlat7 = (u_xlatb8) ? u_xlat7 : (-u_xlat7);
    u_xlat7 = u_xlat7 * 6.28318548;
    u_xlat7 = sin(u_xlat7);
    u_xlat2.y = u_xlat7 * 43758.5469;
    u_xlat2.xyw = fract(u_xlat2.xyw);
    u_xlat3.x = (-u_xlat2.w) + u_xlat3.x;
    u_xlat17 = u_xlat2.z * u_xlat3.x + u_xlat2.w;
    u_xlat7 = (-u_xlat2.x) + u_xlat2.y;
    u_xlat2.x = u_xlat2.z * u_xlat7 + u_xlat2.x;
    u_xlat2.x = (-u_xlat17) + u_xlat2.x;
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat17;
    u_xlat15 = u_xlat2.x * 0.5 + u_xlat15;
    u_xlat15 = fract(u_xlat15);
    u_xlat0.w = u_xlat15 + 0.5;
    u_xlat5 = u_xlat0.y * u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat1.x + u_xlat5;
    u_xlat0.x = u_xlat0.x * 0.5 + u_xlat10.x;
    u_xlat0.xyz = u_xlat0.xxx * vec3(15.0, 7.5, 3.75);
    u_xlat2.xyz = floor(u_xlat0.xyz);
    u_xlat0.xyz = fract(u_xlat0.xyz);
    u_xlat3.xyz = u_xlat0.xyz * u_xlat0.xyz;
    u_xlat0.xyz = (-u_xlat0.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat0.xyz = u_xlat0.xyz * u_xlat3.xyz;
    u_xlat3 = u_xlat2.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    u_xlat1.x = dot(u_xlat2.xx, vec2(12.9898005, 78.2330017));
    u_xlat1.xw = u_xlat1.xw * vec2(0.159154937, 0.5);
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb2 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb2) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb17 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb17) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat17 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat2.xw = fract(u_xlat2.xw);
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.x * u_xlat6 + u_xlat1.x;
    u_xlat6 = (-u_xlat2.x) + u_xlat2.w;
    u_xlat6 = u_xlat0.x * u_xlat6 + u_xlat2.x;
    u_xlat6 = (-u_xlat1.x) + u_xlat6;
    u_xlat0.x = u_xlat0.x * u_xlat6 + u_xlat1.x;
    u_xlat1.x = dot(u_xlat2.yy, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat3.wz, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb2 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb2) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat7 = dot(u_xlat3.ww, vec2(12.9898005, 78.2330017));
    u_xlat7 = u_xlat7 * 0.159154937;
    u_xlatb17 = u_xlat7>=(-u_xlat7);
    u_xlat7 = fract(abs(u_xlat7));
    u_xlat7 = (u_xlatb17) ? u_xlat7 : (-u_xlat7);
    u_xlat7 = u_xlat7 * 6.28318548;
    u_xlat7 = sin(u_xlat7);
    u_xlat2.y = u_xlat7 * 43758.5469;
    u_xlat2.xy = fract(u_xlat2.xy);
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.y * u_xlat6 + u_xlat1.x;
    u_xlat6 = (-u_xlat2.x) + u_xlat2.y;
    u_xlat6 = u_xlat0.y * u_xlat6 + u_xlat2.x;
    u_xlat6 = (-u_xlat1.x) + u_xlat6;
    u_xlat5 = u_xlat0.y * u_xlat6 + u_xlat1.x;
    u_xlat5 = u_xlat5 * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5;
    u_xlat1.xy = u_xlat2.zz + vec2(0.0, 1.0);
    u_xlat5 = dot(u_xlat2.zz, vec2(12.9898005, 78.2330017));
    u_xlat5 = u_xlat5 * 0.159154937;
    u_xlatb2 = u_xlat5>=(-u_xlat5);
    u_xlat5 = fract(abs(u_xlat5));
    u_xlat5 = (u_xlatb2) ? u_xlat5 : (-u_xlat5);
    u_xlat5 = u_xlat5 * 6.28318548;
    u_xlat5 = sin(u_xlat5);
    u_xlat5 = u_xlat5 * 43758.5469;
    u_xlat5 = fract(u_xlat5);
    u_xlat2.x = dot(u_xlat1.yx, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat1.x = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb7 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb7) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat1.yy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb7 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb7) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = (-u_xlat5) + u_xlat2.x;
    u_xlat5 = u_xlat0.z * u_xlat2.x + u_xlat5;
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.z * u_xlat6 + u_xlat1.x;
    u_xlat1.x = (-u_xlat5) + u_xlat1.x;
    u_xlat5 = u_xlat0.z * u_xlat1.x + u_xlat5;
    u_xlat0.x = u_xlat5 * 0.5 + u_xlat0.x;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.xw = floor(u_xlat0.xw);
    u_xlat0.x = max(u_xlat0.x, u_xlat0.w);
    u_xlat0.x = u_xlat0.x * u_xlat11;
    u_xlat0.x = max(u_xlat0.x, u_xlat1.w);
    u_xlat0.xy = u_xlat0.xx + vec2(-0.100007601, -0.600000024);
    u_xlat0.xy = u_xlat0.xy * vec2(2.00003028, 2.50000024);
    u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);
    u_xlatb0.xy = greaterThanEqual(u_xlat0.xyxx, vec4(0.00999999978, 0.00999999978, 0.0, 0.0)).xy;
    u_xlat5 = u_xlatb0.y ? 1.0 : float(0.0);
    u_xlat10.xy = (u_xlatb0.x) ? vec2(0.686274529, 0.313725471) : vec2(0.784313679, 0.215686321);
    u_xlat10.x = u_xlat5 * u_xlat10.y + u_xlat10.x;
    u_xlat1.w = (-u_xlat10.x) * 0.600000024 + u_xlat11;
    u_xlatb10 = u_xlat1.w==0.0;
    if(u_xlatb10){discard;}
    u_xlat2.xyz = (u_xlatb0.x) ? vec3(0.174647495, 0.423267812, 0.428690612) : vec3(0.238397703, 0.571124971, 0.577580571);
    u_xlat0.xzw = (u_xlatb0.x) ? vec3(0.227330402, 0.567834377, 0.571309388) : vec3(0.163580194, 0.419977248, 0.422419429);
    u_xlat0.xyz = vec3(u_xlat5) * u_xlat0.xzw + u_xlat2.xyz;
    u_xlat0.xyz = log2(u_xlat0.xyz);
    u_xlat0.xyz = u_xlat0.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat0.xyz = exp2(u_xlat0.xyz);
    u_xlat1.xyz = u_xlat0.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat0 = u_xlat1 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
          ºu
                         SKINNED_SPRITE  íY  #ifdef VERTEX


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
uniform 	vec4 _ScaledScreenParams;
uniform 	vec4 _ProjectionParams;
uniform 	vec4 _ScreenParams;
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
	UNITY_UNIFORM float                _Edge;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
bvec2 u_xlatb0;
vec4 u_xlat1;
vec4 u_xlat2;
bool u_xlatb2;
vec4 u_xlat3;
bool u_xlatb3;
vec4 u_xlat4;
bool u_xlatb4;
float u_xlat5;
float u_xlat6;
bool u_xlatb6;
float u_xlat7;
bool u_xlatb7;
float u_xlat8;
bool u_xlatb8;
vec2 u_xlat10;
bool u_xlatb10;
float u_xlat11;
float u_xlat12;
float u_xlat15;
float u_xlat16;
float u_xlat17;
bool u_xlatb17;
float u_xlat18;
bool u_xlatb18;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlatb10 = 0.0<_ProjectionParams.x;
    u_xlat15 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb10) ? u_xlat15 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat10.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat15 = (-u_xlat10.y) + 1.0;
    u_xlat1.x = dot(hlslcc_mtx4x4unity_ObjectToWorld[0].xyz, hlslcc_mtx4x4unity_ObjectToWorld[0].xyz);
    u_xlat1.y = dot(hlslcc_mtx4x4unity_ObjectToWorld[1].xyz, hlslcc_mtx4x4unity_ObjectToWorld[1].xyz);
    u_xlat1.xy = sqrt(u_xlat1.xy);
    u_xlat11 = -0.5 / u_xlat1.y;
    u_xlat16 = u_xlat11 * u_xlat1.x;
    u_xlat2.x = vs_INTERP0.x * u_xlat16 + vs_INTERP0.y;
    u_xlat7 = ceil(u_xlat2.x);
    u_xlat11 = (-u_xlat1.x) * u_xlat11 + vs_INTERP0.y;
    u_xlat11 = vs_INTERP0.x * u_xlat16 + u_xlat11;
    u_xlat11 = floor(u_xlat11);
    u_xlat11 = (-u_xlat11) + u_xlat7;
    u_xlat16 = _Edge / u_xlat1.x;
    u_xlat12 = u_xlat16 + vs_INTERP0.x;
    u_xlat12 = floor(u_xlat12);
    u_xlat17 = _Edge / u_xlat1.y;
    u_xlat3.x = (-u_xlat17) + u_xlat2.x;
    u_xlat3.x = ceil(u_xlat3.x);
    u_xlat3.x = u_xlat7 + (-u_xlat3.x);
    u_xlat12 = u_xlat12 + u_xlat3.x;
    u_xlat12 = u_xlat11 * u_xlat12;
    u_xlat12 = clamp(u_xlat12, 0.0, 1.0);
    u_xlat2.x = (-u_xlat17) * 2.0 + u_xlat2.x;
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat2.x = (-u_xlat2.x) + u_xlat7;
    u_xlat16 = u_xlat16 * 2.0 + vs_INTERP0.x;
    u_xlat16 = floor(u_xlat16);
    u_xlat16 = u_xlat16 + u_xlat2.x;
    u_xlat16 = u_xlat16 * u_xlat11;
    u_xlat16 = clamp(u_xlat16, 0.0, 1.0);
    u_xlat1.w = u_xlat16 + u_xlat12;
    u_xlat2.x = _ScreenParams.y / _ScreenParams.x;
    u_xlat10.x = u_xlat2.x * u_xlat15 + u_xlat10.x;
    u_xlat2.xyz = u_xlat10.xxx * vec3(40.0, 20.0, 10.0);
    u_xlat3.xyz = floor(u_xlat2.xyz);
    u_xlat2.xyz = fract(u_xlat2.xyz);
    u_xlat4.xyz = u_xlat2.xyz * u_xlat2.xyz;
    u_xlat2.xyz = (-u_xlat2.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat2.xyz = u_xlat2.xyz * u_xlat4.xyz;
    u_xlat4 = u_xlat3.xxyy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat15 = dot(u_xlat3.xx, vec2(12.9898005, 78.2330017));
    u_xlat15 = u_xlat15 * 0.159154937;
    u_xlatb17 = u_xlat15>=(-u_xlat15);
    u_xlat15 = fract(abs(u_xlat15));
    u_xlat15 = (u_xlatb17) ? u_xlat15 : (-u_xlat15);
    u_xlat15 = u_xlat15 * 6.28318548;
    u_xlat15 = sin(u_xlat15);
    u_xlat15 = u_xlat15 * 43758.5469;
    u_xlat15 = fract(u_xlat15);
    u_xlat17 = dot(u_xlat4.yx, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat17 = u_xlat17 * 43758.5469;
    u_xlat17 = fract(u_xlat17);
    u_xlat3.x = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb18 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb18) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat18 = dot(u_xlat4.yy, vec2(12.9898005, 78.2330017));
    u_xlat18 = u_xlat18 * 0.159154937;
    u_xlatb4 = u_xlat18>=(-u_xlat18);
    u_xlat18 = fract(abs(u_xlat18));
    u_xlat18 = (u_xlatb4) ? u_xlat18 : (-u_xlat18);
    u_xlat18 = u_xlat18 * 6.28318548;
    u_xlat18 = sin(u_xlat18);
    u_xlat3.w = u_xlat18 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat17 = (-u_xlat15) + u_xlat17;
    u_xlat15 = u_xlat2.x * u_xlat17 + u_xlat15;
    u_xlat17 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat17 = u_xlat2.x * u_xlat17 + u_xlat3.x;
    u_xlat17 = (-u_xlat15) + u_xlat17;
    u_xlat15 = u_xlat2.x * u_xlat17 + u_xlat15;
    u_xlat2.x = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb17 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb17) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat17 = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat2.xw = fract(u_xlat2.xw);
    u_xlat3.x = dot(u_xlat4.wz, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb8 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb8) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat8 = dot(u_xlat4.zz, vec2(12.9898005, 78.2330017));
    u_xlat8 = u_xlat8 * 0.159154937;
    u_xlatb18 = u_xlat8>=(-u_xlat8);
    u_xlat8 = fract(abs(u_xlat8));
    u_xlat8 = (u_xlatb18) ? u_xlat8 : (-u_xlat8);
    u_xlat8 = u_xlat8 * 6.28318548;
    u_xlat8 = sin(u_xlat8);
    u_xlat3.y = u_xlat8 * 43758.5469;
    u_xlat3.xy = fract(u_xlat3.xy);
    u_xlat17 = (-u_xlat2.x) + u_xlat2.w;
    u_xlat2.x = u_xlat2.y * u_xlat17 + u_xlat2.x;
    u_xlat17 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat17 = u_xlat2.y * u_xlat17 + u_xlat3.x;
    u_xlat17 = (-u_xlat2.x) + u_xlat17;
    u_xlat2.x = u_xlat2.y * u_xlat17 + u_xlat2.x;
    u_xlat2.x = u_xlat2.x * 0.25;
    u_xlat15 = u_xlat15 * 0.125 + u_xlat2.x;
    u_xlat2.xy = u_xlat3.zz + vec2(0.0, 1.0);
    u_xlat17 = dot(u_xlat3.zz, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat3.x = dot(u_xlat2.yx, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb8 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb8) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat2.x = dot(u_xlat2.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb8 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb8) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat7 = dot(u_xlat2.yy, vec2(12.9898005, 78.2330017));
    u_xlat7 = u_xlat7 * 0.159154937;
    u_xlatb8 = u_xlat7>=(-u_xlat7);
    u_xlat7 = fract(abs(u_xlat7));
    u_xlat7 = (u_xlatb8) ? u_xlat7 : (-u_xlat7);
    u_xlat7 = u_xlat7 * 6.28318548;
    u_xlat7 = sin(u_xlat7);
    u_xlat2.y = u_xlat7 * 43758.5469;
    u_xlat2.xyw = fract(u_xlat2.xyw);
    u_xlat3.x = (-u_xlat2.w) + u_xlat3.x;
    u_xlat17 = u_xlat2.z * u_xlat3.x + u_xlat2.w;
    u_xlat7 = (-u_xlat2.x) + u_xlat2.y;
    u_xlat2.x = u_xlat2.z * u_xlat7 + u_xlat2.x;
    u_xlat2.x = (-u_xlat17) + u_xlat2.x;
    u_xlat2.x = u_xlat2.z * u_xlat2.x + u_xlat17;
    u_xlat15 = u_xlat2.x * 0.5 + u_xlat15;
    u_xlat15 = fract(u_xlat15);
    u_xlat0.w = u_xlat15 + 0.5;
    u_xlat5 = u_xlat0.y * u_xlat1.y;
    u_xlat0.x = u_xlat0.x * u_xlat1.x + u_xlat5;
    u_xlat0.x = u_xlat0.x * 0.5 + u_xlat10.x;
    u_xlat0.xyz = u_xlat0.xxx * vec3(15.0, 7.5, 3.75);
    u_xlat2.xyz = floor(u_xlat0.xyz);
    u_xlat0.xyz = fract(u_xlat0.xyz);
    u_xlat3.xyz = u_xlat0.xyz * u_xlat0.xyz;
    u_xlat0.xyz = (-u_xlat0.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat0.xyz = u_xlat0.xyz * u_xlat3.xyz;
    u_xlat3 = u_xlat2.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    u_xlat1.x = dot(u_xlat2.xx, vec2(12.9898005, 78.2330017));
    u_xlat1.xw = u_xlat1.xw * vec2(0.159154937, 0.5);
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb2 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb2) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb17 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb17) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat17 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat17 = u_xlat17 * 0.159154937;
    u_xlatb3 = u_xlat17>=(-u_xlat17);
    u_xlat17 = fract(abs(u_xlat17));
    u_xlat17 = (u_xlatb3) ? u_xlat17 : (-u_xlat17);
    u_xlat17 = u_xlat17 * 6.28318548;
    u_xlat17 = sin(u_xlat17);
    u_xlat2.w = u_xlat17 * 43758.5469;
    u_xlat2.xw = fract(u_xlat2.xw);
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.x * u_xlat6 + u_xlat1.x;
    u_xlat6 = (-u_xlat2.x) + u_xlat2.w;
    u_xlat6 = u_xlat0.x * u_xlat6 + u_xlat2.x;
    u_xlat6 = (-u_xlat1.x) + u_xlat6;
    u_xlat0.x = u_xlat0.x * u_xlat6 + u_xlat1.x;
    u_xlat1.x = dot(u_xlat2.yy, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb6 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb6) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat3.wz, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb2 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb2) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = dot(u_xlat3.zw, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat7 = dot(u_xlat3.ww, vec2(12.9898005, 78.2330017));
    u_xlat7 = u_xlat7 * 0.159154937;
    u_xlatb17 = u_xlat7>=(-u_xlat7);
    u_xlat7 = fract(abs(u_xlat7));
    u_xlat7 = (u_xlatb17) ? u_xlat7 : (-u_xlat7);
    u_xlat7 = u_xlat7 * 6.28318548;
    u_xlat7 = sin(u_xlat7);
    u_xlat2.y = u_xlat7 * 43758.5469;
    u_xlat2.xy = fract(u_xlat2.xy);
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.y * u_xlat6 + u_xlat1.x;
    u_xlat6 = (-u_xlat2.x) + u_xlat2.y;
    u_xlat6 = u_xlat0.y * u_xlat6 + u_xlat2.x;
    u_xlat6 = (-u_xlat1.x) + u_xlat6;
    u_xlat5 = u_xlat0.y * u_xlat6 + u_xlat1.x;
    u_xlat5 = u_xlat5 * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat5;
    u_xlat1.xy = u_xlat2.zz + vec2(0.0, 1.0);
    u_xlat5 = dot(u_xlat2.zz, vec2(12.9898005, 78.2330017));
    u_xlat5 = u_xlat5 * 0.159154937;
    u_xlatb2 = u_xlat5>=(-u_xlat5);
    u_xlat5 = fract(abs(u_xlat5));
    u_xlat5 = (u_xlatb2) ? u_xlat5 : (-u_xlat5);
    u_xlat5 = u_xlat5 * 6.28318548;
    u_xlat5 = sin(u_xlat5);
    u_xlat5 = u_xlat5 * 43758.5469;
    u_xlat5 = fract(u_xlat5);
    u_xlat2.x = dot(u_xlat1.yx, vec2(12.9898005, 78.2330017));
    u_xlat2.x = u_xlat2.x * 0.159154937;
    u_xlatb7 = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.x = fract(abs(u_xlat2.x));
    u_xlat2.x = (u_xlatb7) ? u_xlat2.x : (-u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 6.28318548;
    u_xlat2.x = sin(u_xlat2.x);
    u_xlat2.x = u_xlat2.x * 43758.5469;
    u_xlat2.x = fract(u_xlat2.x);
    u_xlat1.x = dot(u_xlat1.xy, vec2(12.9898005, 78.2330017));
    u_xlat1.x = u_xlat1.x * 0.159154937;
    u_xlatb7 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.x = fract(abs(u_xlat1.x));
    u_xlat1.x = (u_xlatb7) ? u_xlat1.x : (-u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 6.28318548;
    u_xlat1.x = sin(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * 43758.5469;
    u_xlat6 = dot(u_xlat1.yy, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb7 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb7) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat1.y = u_xlat6 * 43758.5469;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat2.x = (-u_xlat5) + u_xlat2.x;
    u_xlat5 = u_xlat0.z * u_xlat2.x + u_xlat5;
    u_xlat6 = (-u_xlat1.x) + u_xlat1.y;
    u_xlat1.x = u_xlat0.z * u_xlat6 + u_xlat1.x;
    u_xlat1.x = (-u_xlat5) + u_xlat1.x;
    u_xlat5 = u_xlat0.z * u_xlat1.x + u_xlat5;
    u_xlat0.x = u_xlat5 * 0.5 + u_xlat0.x;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.xw = floor(u_xlat0.xw);
    u_xlat0.x = max(u_xlat0.x, u_xlat0.w);
    u_xlat0.x = u_xlat0.x * u_xlat11;
    u_xlat0.x = max(u_xlat0.x, u_xlat1.w);
    u_xlat0.xy = u_xlat0.xx + vec2(-0.100007601, -0.600000024);
    u_xlat0.xy = u_xlat0.xy * vec2(2.00003028, 2.50000024);
    u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);
    u_xlatb0.xy = greaterThanEqual(u_xlat0.xyxx, vec4(0.00999999978, 0.00999999978, 0.0, 0.0)).xy;
    u_xlat5 = u_xlatb0.y ? 1.0 : float(0.0);
    u_xlat10.xy = (u_xlatb0.x) ? vec2(0.686274529, 0.313725471) : vec2(0.784313679, 0.215686321);
    u_xlat10.x = u_xlat5 * u_xlat10.y + u_xlat10.x;
    u_xlat1.w = (-u_xlat10.x) * 0.600000024 + u_xlat11;
    u_xlatb10 = u_xlat1.w==0.0;
    if(u_xlatb10){discard;}
    u_xlat2.xyz = (u_xlatb0.x) ? vec3(0.174647495, 0.423267812, 0.428690612) : vec3(0.238397703, 0.571124971, 0.577580571);
    u_xlat0.xzw = (u_xlatb0.x) ? vec3(0.227330402, 0.567834377, 0.571309388) : vec3(0.163580194, 0.419977248, 0.422419429);
    u_xlat0.xyz = vec3(u_xlat5) * u_xlat0.xzw + u_xlat2.xyz;
    u_xlat0.xyz = log2(u_xlat0.xyz);
    u_xlat0.xyz = u_xlat0.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat0.xyz = exp2(u_xlat0.xyz);
    u_xlat1.xyz = u_xlat0.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.0549999997, -0.0549999997, -0.0549999997);
    u_xlat0 = u_xlat1 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
          
