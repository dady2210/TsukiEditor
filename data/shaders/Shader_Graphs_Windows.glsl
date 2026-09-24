// Shader Graphs/Windows
// sacado de de1117e2c31bb420eb7b350bf7939ad3
// declara: White, _Glass, _GreenChannel, _MainTex, _RedChannel, _Threshold, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
uniform 	vec2 _GlobalMipBias;
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
	UNITY_UNIFORM float Xhlslcc_UnusedX_Threshold;
	UNITY_UNIFORM vec4                _RedChannel;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _GreenChannel;
	UNITY_UNIFORM vec4                _Glass;
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
vec4 u_xlat0;
vec3 u_xlat1;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
vec4 u_xlat3;
vec4 u_xlat4;
bool u_xlatb4;
vec4 u_xlat5;
bool u_xlatb5;
float u_xlat6;
vec3 u_xlat8;
float u_xlat9;
bool u_xlatb9;
float u_xlat10;
bool u_xlatb10;
vec2 u_xlat12;
bool u_xlatb12;
vec2 u_xlat14;
vec2 u_xlat15;
bool u_xlatb15;
float u_xlat18;
float u_xlat21;
bool u_xlatb21;
float u_xlat22;
bool u_xlatb22;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlatb12 = 0.0<_ProjectionParams.x;
    u_xlat18 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb12) ? u_xlat18 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat12.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat18 = (-u_xlat12.y) + 1.0;
    u_xlat16_1 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat2 = u_xlat16_1.xyzx + vec4(-0.100000001, -0.100000001, -0.100000001, 0.649999976);
    u_xlat3 = (-u_xlat16_1.yzxz) + u_xlat2.xxyy;
    u_xlat2.xy = (-u_xlat3.yw) + u_xlat3.xz;
    u_xlat2.xy = abs(u_xlat2.xy) * vec2(5.0, 5.0);
    u_xlat2.xy = min(u_xlat2.xy, vec2(1.0, 1.0));
    u_xlat2.xy = roundEven(u_xlat2.xy);
    u_xlat2.xy = (-u_xlat2.xy) + vec2(1.0, 1.0);
    u_xlat3 = ceil(u_xlat3);
    u_xlat3.xy = u_xlat3.yw * u_xlat3.xz;
    u_xlat2.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat15.xy = (-u_xlat16_1.yx) + u_xlat2.zz;
    u_xlat4.xy = ceil(u_xlat15.xy);
    u_xlat14.x = u_xlat4.y * u_xlat4.x;
    u_xlat15.x = (-u_xlat15.y) + u_xlat15.x;
    u_xlat15.x = abs(u_xlat15.x) * 5.0;
    u_xlat15.x = min(u_xlat15.x, 1.0);
    u_xlat15.x = roundEven(u_xlat15.x);
    u_xlat15.x = (-u_xlat15.x) + 1.0;
    u_xlat2.z = u_xlat14.x * u_xlat15.x;
    u_xlat3.xyz = u_xlat16_1.xyz * u_xlat2.xyz;
    u_xlat2.xy = u_xlat16_1.xy * u_xlat2.xy + vec2(-0.300000012, -0.300000012);
    u_xlat2.xy = ceil(u_xlat2.xy);
    u_xlat4.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat2.x = u_xlat16_1.z * u_xlat2.z + -0.300000012;
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat4.z = u_xlat2.x * u_xlat3.z;
    u_xlat2.x = floor(u_xlat2.w);
    u_xlat2.x = (-u_xlat2.x) + 1.0;
    u_xlat3 = u_xlat16_1.xyyz + vec4(-0.25, 0.649999976, -0.25, 0.649999976);
    u_xlat8.xy = ceil(u_xlat3.xz);
    u_xlat2.x = u_xlat8.x * u_xlat2.x;
    u_xlat8.xz = floor(u_xlat3.yw);
    u_xlat8.xz = (-u_xlat8.xz) + vec2(1.0, 1.0);
    u_xlat8.x = u_xlat8.y * u_xlat8.x;
    u_xlat2.x = u_xlat8.x * u_xlat2.x;
    u_xlat8.xy = u_xlat16_1.zz + vec2(-0.25, 0.200000003);
    u_xlat8.x = ceil(u_xlat8.x);
    u_xlat8.x = u_xlat8.x * u_xlat8.z;
    u_xlat2.x = (-u_xlat2.x) * u_xlat8.x + 1.0;
    u_xlat2.xyw = u_xlat4.xyz * u_xlat2.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat2.xyw = u_xlat2.xyw * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat3.x = _ScreenParams.y / _ScreenParams.x;
    u_xlat12.x = u_xlat3.x * u_xlat18 + u_xlat12.x;
    u_xlat3.xyz = u_xlat12.xxx * vec3(40.0, 20.0, 10.0);
    u_xlat4.xyz = floor(u_xlat3.xyz);
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat5.xyz = u_xlat3.xyz * u_xlat3.xyz;
    u_xlat3.xyz = (-u_xlat3.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat3.xyz = u_xlat3.xyz * u_xlat5.xyz;
    u_xlat5 = u_xlat4.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    u_xlat18 = dot(u_xlat4.xx, vec2(12.9898005, 78.2330017));
    u_xlat18 = u_xlat18 * 0.159154937;
    u_xlatb21 = u_xlat18>=(-u_xlat18);
    u_xlat18 = fract(abs(u_xlat18));
    u_xlat18 = (u_xlatb21) ? u_xlat18 : (-u_xlat18);
    u_xlat18 = u_xlat18 * 6.28318548;
    u_xlat18 = sin(u_xlat18);
    u_xlat18 = u_xlat18 * 43758.5469;
    u_xlat18 = fract(u_xlat18);
    u_xlat21 = dot(u_xlat5.yx, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat21 = u_xlat21 * 43758.5469;
    u_xlat21 = fract(u_xlat21);
    u_xlat4.x = dot(u_xlat5.xy, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb22 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb22) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat22 = dot(u_xlat5.yy, vec2(12.9898005, 78.2330017));
    u_xlat22 = u_xlat22 * 0.159154937;
    u_xlatb5 = u_xlat22>=(-u_xlat22);
    u_xlat22 = fract(abs(u_xlat22));
    u_xlat22 = (u_xlatb5) ? u_xlat22 : (-u_xlat22);
    u_xlat22 = u_xlat22 * 6.28318548;
    u_xlat22 = sin(u_xlat22);
    u_xlat4.w = u_xlat22 * 43758.5469;
    u_xlat4.xw = fract(u_xlat4.xw);
    u_xlat21 = (-u_xlat18) + u_xlat21;
    u_xlat18 = u_xlat3.x * u_xlat21 + u_xlat18;
    u_xlat21 = (-u_xlat4.x) + u_xlat4.w;
    u_xlat21 = u_xlat3.x * u_xlat21 + u_xlat4.x;
    u_xlat21 = (-u_xlat18) + u_xlat21;
    u_xlat18 = u_xlat3.x * u_xlat21 + u_xlat18;
    u_xlat3.x = dot(u_xlat4.yy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat21 = dot(u_xlat5.wz, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat4.x = dot(u_xlat5.zw, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat10 = dot(u_xlat5.ww, vec2(12.9898005, 78.2330017));
    u_xlat10 = u_xlat10 * 0.159154937;
    u_xlatb22 = u_xlat10>=(-u_xlat10);
    u_xlat10 = fract(abs(u_xlat10));
    u_xlat10 = (u_xlatb22) ? u_xlat10 : (-u_xlat10);
    u_xlat10 = u_xlat10 * 6.28318548;
    u_xlat10 = sin(u_xlat10);
    u_xlat4.y = u_xlat10 * 43758.5469;
    u_xlat4.xy = fract(u_xlat4.xy);
    u_xlat21 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat3.x = u_xlat3.y * u_xlat21 + u_xlat3.x;
    u_xlat21 = (-u_xlat4.x) + u_xlat4.y;
    u_xlat21 = u_xlat3.y * u_xlat21 + u_xlat4.x;
    u_xlat21 = (-u_xlat3.x) + u_xlat21;
    u_xlat3.x = u_xlat3.y * u_xlat21 + u_xlat3.x;
    u_xlat3.x = u_xlat3.x * 0.25;
    u_xlat18 = u_xlat18 * 0.125 + u_xlat3.x;
    u_xlat3.xy = u_xlat4.zz + vec2(0.0, 1.0);
    u_xlat21 = dot(u_xlat4.zz, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat4.x = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.x = fract(u_xlat4.x);
    u_xlat3.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb10 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb10) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb10 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb10) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat3.xyw = fract(u_xlat3.xyw);
    u_xlat4.x = (-u_xlat3.w) + u_xlat4.x;
    u_xlat21 = u_xlat3.z * u_xlat4.x + u_xlat3.w;
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat3.z * u_xlat9 + u_xlat3.x;
    u_xlat3.x = (-u_xlat21) + u_xlat3.x;
    u_xlat3.x = u_xlat3.z * u_xlat3.x + u_xlat21;
    u_xlat18 = u_xlat3.x * 0.5 + u_xlat18;
    u_xlat18 = fract(u_xlat18);
    u_xlat0.w = u_xlat18 + 0.5;
    u_xlat3.x = dot(hlslcc_mtx4x4unity_ObjectToWorld[0].xyz, hlslcc_mtx4x4unity_ObjectToWorld[0].xyz);
    u_xlat3.y = dot(hlslcc_mtx4x4unity_ObjectToWorld[1].xyz, hlslcc_mtx4x4unity_ObjectToWorld[1].xyz);
    u_xlat3.xy = sqrt(u_xlat3.xy);
    u_xlat6 = u_xlat0.y * u_xlat3.y;
    u_xlat0.x = u_xlat0.x * u_xlat3.x + u_xlat6;
    u_xlat0.x = u_xlat0.x * 0.5 + u_xlat12.x;
    u_xlat0.xyz = u_xlat0.xxx * vec3(15.0, 7.5, 3.75);
    u_xlat3.xyz = floor(u_xlat0.xyz);
    u_xlat0.xyz = fract(u_xlat0.xyz);
    u_xlat4.xyz = u_xlat0.xyz * u_xlat0.xyz;
    u_xlat0.xyz = (-u_xlat0.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat0.xyz = u_xlat0.xyz * u_xlat4.xyz;
    u_xlat4 = u_xlat3.xxyy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat3.x = dot(u_xlat3.xx, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat21 = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb5 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb5) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat10 = dot(u_xlat4.yx, vec2(12.9898005, 78.2330017));
    u_xlat10 = u_xlat10 * 0.159154937;
    u_xlatb5 = u_xlat10>=(-u_xlat10);
    u_xlat10 = fract(abs(u_xlat10));
    u_xlat10 = (u_xlatb5) ? u_xlat10 : (-u_xlat10);
    u_xlat10 = u_xlat10 * 6.28318548;
    u_xlat10 = sin(u_xlat10);
    u_xlat4.y = u_xlat10 * 43758.5469;
    u_xlat4.x = dot(u_xlat4.xx, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb5 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb5) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.xy = fract(u_xlat4.xy);
    u_xlat21 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat3.x = u_xlat0.x * u_xlat21 + u_xlat3.x;
    u_xlat21 = (-u_xlat4.y) + u_xlat4.x;
    u_xlat21 = u_xlat0.x * u_xlat21 + u_xlat4.y;
    u_xlat21 = (-u_xlat3.x) + u_xlat21;
    u_xlat0.x = u_xlat0.x * u_xlat21 + u_xlat3.x;
    u_xlat3.x = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb9 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb9) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat4.wz, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb21 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb21) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat21 = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xyw = fract(u_xlat3.xyw);
    u_xlat4.x = dot(u_xlat4.ww, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.x = fract(u_xlat4.x);
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat0.y * u_xlat9 + u_xlat3.x;
    u_xlat9 = (-u_xlat3.w) + u_xlat4.x;
    u_xlat9 = u_xlat0.y * u_xlat9 + u_xlat3.w;
    u_xlat9 = (-u_xlat3.x) + u_xlat9;
    u_xlat6 = u_xlat0.y * u_xlat9 + u_xlat3.x;
    u_xlat6 = u_xlat6 * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat6;
    u_xlat3.xy = u_xlat3.zz + vec2(0.0, 1.0);
    u_xlat6 = dot(u_xlat3.zz, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb15 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb15) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat6 = u_xlat6 * 43758.5469;
    u_xlat6 = fract(u_xlat6);
    u_xlat15.x = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat15.x = u_xlat15.x * 0.159154937;
    u_xlatb21 = u_xlat15.x>=(-u_xlat15.x);
    u_xlat15.x = fract(abs(u_xlat15.x));
    u_xlat15.x = (u_xlatb21) ? u_xlat15.x : (-u_xlat15.x);
    u_xlat15.x = u_xlat15.x * 6.28318548;
    u_xlat15.x = sin(u_xlat15.x);
    u_xlat3.z = u_xlat15.x * 43758.5469;
    u_xlat3.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb21 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb21) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat15.x = (-u_xlat6) + u_xlat3.z;
    u_xlat6 = u_xlat0.z * u_xlat15.x + u_xlat6;
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat0.z * u_xlat9 + u_xlat3.x;
    u_xlat3.x = (-u_xlat6) + u_xlat3.x;
    u_xlat6 = u_xlat0.z * u_xlat3.x + u_xlat6;
    u_xlat0.x = u_xlat6 * 0.5 + u_xlat0.x;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.xw = floor(u_xlat0.xw);
    u_xlat0.x = max(u_xlat0.x, u_xlat0.w);
    u_xlat6 = roundEven(u_xlat8.y);
    u_xlat0.x = u_xlat6 * u_xlat0.x;
    u_xlat6 = u_xlat6 * u_xlat16_1.z;
    u_xlat0.x = max(u_xlat6, u_xlat0.x);
    u_xlat6 = ceil(u_xlat2.w);
    u_xlat12.x = roundEven(u_xlat16_1.w);
    u_xlat12.x = u_xlat12.x * u_xlat6;
    u_xlat12.x = u_xlat12.x * u_xlat0.x;
    u_xlat3.w = (-u_xlat12.x) * 0.600000024 + u_xlat16_1.w;
    u_xlatb12 = u_xlat3.w==0.0;
    if(u_xlatb12){discard;}
    u_xlat12.xy = u_xlat16_1.xy + vec2(-0.699999988, -0.699999988);
    u_xlat12.xy = ceil(u_xlat12.xy);
    u_xlat14.xy = (-u_xlat16_1.zz) + u_xlat16_1.yx;
    u_xlat14.xy = abs(u_xlat14.xy) * vec2(10.0, 10.0);
    u_xlat14.xy = roundEven(u_xlat14.xy);
    u_xlat14.xy = min(u_xlat14.xy, vec2(1.0, 1.0));
    u_xlat14.xy = (-u_xlat14.xy) + vec2(1.0, 1.0);
    u_xlat14.xy = u_xlat16_1.yz * u_xlat14.xy;
    u_xlat12.xy = u_xlat12.xy * u_xlat14.xy;
    u_xlat4.xyz = _RedChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat4.xyz = u_xlat2.xxx * u_xlat4.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat5.xyz = (-u_xlat4.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat4.xyz = u_xlat12.xxx * u_xlat5.xyz + u_xlat4.xyz;
    u_xlat2.xz = ceil(u_xlat2.xy);
    u_xlat4.xyz = (-u_xlat16_1.xyz) + u_xlat4.xyz;
    u_xlat1.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat16_1.xyz;
    u_xlat4.xyz = _GreenChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat2.xyw = u_xlat2.yyy * u_xlat4.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat4.xyz = (-u_xlat2.xyw) + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyw = u_xlat12.yyy * u_xlat4.xyz + u_xlat2.xyw;
    u_xlat2.xyw = (-u_xlat1.xyz) + u_xlat2.xyw;
    u_xlat1.xyz = u_xlat2.zzz * u_xlat2.xyw + u_xlat1.xyz;
    u_xlat0.xzw = _Glass.xyz * u_xlat0.xxx + (-u_xlat1.xyz);
    u_xlat3.xyz = vec3(u_xlat6) * u_xlat0.xzw + u_xlat1.xyz;
    u_xlat0 = u_xlat3 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
        ºu
                         SKINNED_SPRITE  ï`  #ifdef VERTEX


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
uniform 	vec2 _GlobalMipBias;
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
	UNITY_UNIFORM float Xhlslcc_UnusedX_Threshold;
	UNITY_UNIFORM vec4                _RedChannel;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _GreenChannel;
	UNITY_UNIFORM vec4                _Glass;
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
vec4 u_xlat0;
vec3 u_xlat1;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
vec4 u_xlat3;
vec4 u_xlat4;
bool u_xlatb4;
vec4 u_xlat5;
bool u_xlatb5;
float u_xlat6;
vec3 u_xlat8;
float u_xlat9;
bool u_xlatb9;
float u_xlat10;
bool u_xlatb10;
vec2 u_xlat12;
bool u_xlatb12;
vec2 u_xlat14;
vec2 u_xlat15;
bool u_xlatb15;
float u_xlat18;
float u_xlat21;
bool u_xlatb21;
float u_xlat22;
bool u_xlatb22;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.xy = vs_INTERP2.yy * hlslcc_mtx4x4unity_WorldToObject[1].xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[0].xy * vs_INTERP2.xx + u_xlat0.xy;
    u_xlat0.xy = hlslcc_mtx4x4unity_WorldToObject[2].xy * vs_INTERP2.zz + u_xlat0.xy;
    u_xlat0.xy = u_xlat0.xy + hlslcc_mtx4x4unity_WorldToObject[3].xy;
    u_xlatb12 = 0.0<_ProjectionParams.x;
    u_xlat18 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb12) ? u_xlat18 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat12.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat18 = (-u_xlat12.y) + 1.0;
    u_xlat16_1 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlat2 = u_xlat16_1.xyzx + vec4(-0.100000001, -0.100000001, -0.100000001, 0.649999976);
    u_xlat3 = (-u_xlat16_1.yzxz) + u_xlat2.xxyy;
    u_xlat2.xy = (-u_xlat3.yw) + u_xlat3.xz;
    u_xlat2.xy = abs(u_xlat2.xy) * vec2(5.0, 5.0);
    u_xlat2.xy = min(u_xlat2.xy, vec2(1.0, 1.0));
    u_xlat2.xy = roundEven(u_xlat2.xy);
    u_xlat2.xy = (-u_xlat2.xy) + vec2(1.0, 1.0);
    u_xlat3 = ceil(u_xlat3);
    u_xlat3.xy = u_xlat3.yw * u_xlat3.xz;
    u_xlat2.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat15.xy = (-u_xlat16_1.yx) + u_xlat2.zz;
    u_xlat4.xy = ceil(u_xlat15.xy);
    u_xlat14.x = u_xlat4.y * u_xlat4.x;
    u_xlat15.x = (-u_xlat15.y) + u_xlat15.x;
    u_xlat15.x = abs(u_xlat15.x) * 5.0;
    u_xlat15.x = min(u_xlat15.x, 1.0);
    u_xlat15.x = roundEven(u_xlat15.x);
    u_xlat15.x = (-u_xlat15.x) + 1.0;
    u_xlat2.z = u_xlat14.x * u_xlat15.x;
    u_xlat3.xyz = u_xlat16_1.xyz * u_xlat2.xyz;
    u_xlat2.xy = u_xlat16_1.xy * u_xlat2.xy + vec2(-0.300000012, -0.300000012);
    u_xlat2.xy = ceil(u_xlat2.xy);
    u_xlat4.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat2.x = u_xlat16_1.z * u_xlat2.z + -0.300000012;
    u_xlat2.x = ceil(u_xlat2.x);
    u_xlat4.z = u_xlat2.x * u_xlat3.z;
    u_xlat2.x = floor(u_xlat2.w);
    u_xlat2.x = (-u_xlat2.x) + 1.0;
    u_xlat3 = u_xlat16_1.xyyz + vec4(-0.25, 0.649999976, -0.25, 0.649999976);
    u_xlat8.xy = ceil(u_xlat3.xz);
    u_xlat2.x = u_xlat8.x * u_xlat2.x;
    u_xlat8.xz = floor(u_xlat3.yw);
    u_xlat8.xz = (-u_xlat8.xz) + vec2(1.0, 1.0);
    u_xlat8.x = u_xlat8.y * u_xlat8.x;
    u_xlat2.x = u_xlat8.x * u_xlat2.x;
    u_xlat8.xy = u_xlat16_1.zz + vec2(-0.25, 0.200000003);
    u_xlat8.x = ceil(u_xlat8.x);
    u_xlat8.x = u_xlat8.x * u_xlat8.z;
    u_xlat2.x = (-u_xlat2.x) * u_xlat8.x + 1.0;
    u_xlat2.xyw = u_xlat4.xyz * u_xlat2.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat2.xyw = u_xlat2.xyw * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat3.x = _ScreenParams.y / _ScreenParams.x;
    u_xlat12.x = u_xlat3.x * u_xlat18 + u_xlat12.x;
    u_xlat3.xyz = u_xlat12.xxx * vec3(40.0, 20.0, 10.0);
    u_xlat4.xyz = floor(u_xlat3.xyz);
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat5.xyz = u_xlat3.xyz * u_xlat3.xyz;
    u_xlat3.xyz = (-u_xlat3.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat3.xyz = u_xlat3.xyz * u_xlat5.xyz;
    u_xlat5 = u_xlat4.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    u_xlat18 = dot(u_xlat4.xx, vec2(12.9898005, 78.2330017));
    u_xlat18 = u_xlat18 * 0.159154937;
    u_xlatb21 = u_xlat18>=(-u_xlat18);
    u_xlat18 = fract(abs(u_xlat18));
    u_xlat18 = (u_xlatb21) ? u_xlat18 : (-u_xlat18);
    u_xlat18 = u_xlat18 * 6.28318548;
    u_xlat18 = sin(u_xlat18);
    u_xlat18 = u_xlat18 * 43758.5469;
    u_xlat18 = fract(u_xlat18);
    u_xlat21 = dot(u_xlat5.yx, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat21 = u_xlat21 * 43758.5469;
    u_xlat21 = fract(u_xlat21);
    u_xlat4.x = dot(u_xlat5.xy, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb22 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb22) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat22 = dot(u_xlat5.yy, vec2(12.9898005, 78.2330017));
    u_xlat22 = u_xlat22 * 0.159154937;
    u_xlatb5 = u_xlat22>=(-u_xlat22);
    u_xlat22 = fract(abs(u_xlat22));
    u_xlat22 = (u_xlatb5) ? u_xlat22 : (-u_xlat22);
    u_xlat22 = u_xlat22 * 6.28318548;
    u_xlat22 = sin(u_xlat22);
    u_xlat4.w = u_xlat22 * 43758.5469;
    u_xlat4.xw = fract(u_xlat4.xw);
    u_xlat21 = (-u_xlat18) + u_xlat21;
    u_xlat18 = u_xlat3.x * u_xlat21 + u_xlat18;
    u_xlat21 = (-u_xlat4.x) + u_xlat4.w;
    u_xlat21 = u_xlat3.x * u_xlat21 + u_xlat4.x;
    u_xlat21 = (-u_xlat18) + u_xlat21;
    u_xlat18 = u_xlat3.x * u_xlat21 + u_xlat18;
    u_xlat3.x = dot(u_xlat4.yy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat21 = dot(u_xlat5.wz, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat4.x = dot(u_xlat5.zw, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat10 = dot(u_xlat5.ww, vec2(12.9898005, 78.2330017));
    u_xlat10 = u_xlat10 * 0.159154937;
    u_xlatb22 = u_xlat10>=(-u_xlat10);
    u_xlat10 = fract(abs(u_xlat10));
    u_xlat10 = (u_xlatb22) ? u_xlat10 : (-u_xlat10);
    u_xlat10 = u_xlat10 * 6.28318548;
    u_xlat10 = sin(u_xlat10);
    u_xlat4.y = u_xlat10 * 43758.5469;
    u_xlat4.xy = fract(u_xlat4.xy);
    u_xlat21 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat3.x = u_xlat3.y * u_xlat21 + u_xlat3.x;
    u_xlat21 = (-u_xlat4.x) + u_xlat4.y;
    u_xlat21 = u_xlat3.y * u_xlat21 + u_xlat4.x;
    u_xlat21 = (-u_xlat3.x) + u_xlat21;
    u_xlat3.x = u_xlat3.y * u_xlat21 + u_xlat3.x;
    u_xlat3.x = u_xlat3.x * 0.25;
    u_xlat18 = u_xlat18 * 0.125 + u_xlat3.x;
    u_xlat3.xy = u_xlat4.zz + vec2(0.0, 1.0);
    u_xlat21 = dot(u_xlat4.zz, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat4.x = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.x = fract(u_xlat4.x);
    u_xlat3.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb10 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb10) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb10 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb10) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat3.xyw = fract(u_xlat3.xyw);
    u_xlat4.x = (-u_xlat3.w) + u_xlat4.x;
    u_xlat21 = u_xlat3.z * u_xlat4.x + u_xlat3.w;
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat3.z * u_xlat9 + u_xlat3.x;
    u_xlat3.x = (-u_xlat21) + u_xlat3.x;
    u_xlat3.x = u_xlat3.z * u_xlat3.x + u_xlat21;
    u_xlat18 = u_xlat3.x * 0.5 + u_xlat18;
    u_xlat18 = fract(u_xlat18);
    u_xlat0.w = u_xlat18 + 0.5;
    u_xlat3.x = dot(hlslcc_mtx4x4unity_ObjectToWorld[0].xyz, hlslcc_mtx4x4unity_ObjectToWorld[0].xyz);
    u_xlat3.y = dot(hlslcc_mtx4x4unity_ObjectToWorld[1].xyz, hlslcc_mtx4x4unity_ObjectToWorld[1].xyz);
    u_xlat3.xy = sqrt(u_xlat3.xy);
    u_xlat6 = u_xlat0.y * u_xlat3.y;
    u_xlat0.x = u_xlat0.x * u_xlat3.x + u_xlat6;
    u_xlat0.x = u_xlat0.x * 0.5 + u_xlat12.x;
    u_xlat0.xyz = u_xlat0.xxx * vec3(15.0, 7.5, 3.75);
    u_xlat3.xyz = floor(u_xlat0.xyz);
    u_xlat0.xyz = fract(u_xlat0.xyz);
    u_xlat4.xyz = u_xlat0.xyz * u_xlat0.xyz;
    u_xlat0.xyz = (-u_xlat0.xyz) * vec3(2.0, 2.0, 2.0) + vec3(3.0, 3.0, 3.0);
    u_xlat0.xyz = u_xlat0.xyz * u_xlat4.xyz;
    u_xlat4 = u_xlat3.xxyy + vec4(1.0, 0.0, 0.0, 1.0);
    u_xlat3.x = dot(u_xlat3.xx, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat21 = dot(u_xlat4.xy, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb5 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb5) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xw = fract(u_xlat3.xw);
    u_xlat10 = dot(u_xlat4.yx, vec2(12.9898005, 78.2330017));
    u_xlat10 = u_xlat10 * 0.159154937;
    u_xlatb5 = u_xlat10>=(-u_xlat10);
    u_xlat10 = fract(abs(u_xlat10));
    u_xlat10 = (u_xlatb5) ? u_xlat10 : (-u_xlat10);
    u_xlat10 = u_xlat10 * 6.28318548;
    u_xlat10 = sin(u_xlat10);
    u_xlat4.y = u_xlat10 * 43758.5469;
    u_xlat4.x = dot(u_xlat4.xx, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb5 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb5) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.xy = fract(u_xlat4.xy);
    u_xlat21 = (-u_xlat3.x) + u_xlat3.w;
    u_xlat3.x = u_xlat0.x * u_xlat21 + u_xlat3.x;
    u_xlat21 = (-u_xlat4.y) + u_xlat4.x;
    u_xlat21 = u_xlat0.x * u_xlat21 + u_xlat4.y;
    u_xlat21 = (-u_xlat3.x) + u_xlat21;
    u_xlat0.x = u_xlat0.x * u_xlat21 + u_xlat3.x;
    u_xlat3.x = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb9 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb9) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat4.wz, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb21 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb21) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat21 = dot(u_xlat4.zw, vec2(12.9898005, 78.2330017));
    u_xlat21 = u_xlat21 * 0.159154937;
    u_xlatb4 = u_xlat21>=(-u_xlat21);
    u_xlat21 = fract(abs(u_xlat21));
    u_xlat21 = (u_xlatb4) ? u_xlat21 : (-u_xlat21);
    u_xlat21 = u_xlat21 * 6.28318548;
    u_xlat21 = sin(u_xlat21);
    u_xlat3.w = u_xlat21 * 43758.5469;
    u_xlat3.xyw = fract(u_xlat3.xyw);
    u_xlat4.x = dot(u_xlat4.ww, vec2(12.9898005, 78.2330017));
    u_xlat4.x = u_xlat4.x * 0.159154937;
    u_xlatb10 = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.x = fract(abs(u_xlat4.x));
    u_xlat4.x = (u_xlatb10) ? u_xlat4.x : (-u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 6.28318548;
    u_xlat4.x = sin(u_xlat4.x);
    u_xlat4.x = u_xlat4.x * 43758.5469;
    u_xlat4.x = fract(u_xlat4.x);
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat0.y * u_xlat9 + u_xlat3.x;
    u_xlat9 = (-u_xlat3.w) + u_xlat4.x;
    u_xlat9 = u_xlat0.y * u_xlat9 + u_xlat3.w;
    u_xlat9 = (-u_xlat3.x) + u_xlat9;
    u_xlat6 = u_xlat0.y * u_xlat9 + u_xlat3.x;
    u_xlat6 = u_xlat6 * 0.25;
    u_xlat0.x = u_xlat0.x * 0.125 + u_xlat6;
    u_xlat3.xy = u_xlat3.zz + vec2(0.0, 1.0);
    u_xlat6 = dot(u_xlat3.zz, vec2(12.9898005, 78.2330017));
    u_xlat6 = u_xlat6 * 0.159154937;
    u_xlatb15 = u_xlat6>=(-u_xlat6);
    u_xlat6 = fract(abs(u_xlat6));
    u_xlat6 = (u_xlatb15) ? u_xlat6 : (-u_xlat6);
    u_xlat6 = u_xlat6 * 6.28318548;
    u_xlat6 = sin(u_xlat6);
    u_xlat6 = u_xlat6 * 43758.5469;
    u_xlat6 = fract(u_xlat6);
    u_xlat15.x = dot(u_xlat3.yx, vec2(12.9898005, 78.2330017));
    u_xlat15.x = u_xlat15.x * 0.159154937;
    u_xlatb21 = u_xlat15.x>=(-u_xlat15.x);
    u_xlat15.x = fract(abs(u_xlat15.x));
    u_xlat15.x = (u_xlatb21) ? u_xlat15.x : (-u_xlat15.x);
    u_xlat15.x = u_xlat15.x * 6.28318548;
    u_xlat15.x = sin(u_xlat15.x);
    u_xlat3.z = u_xlat15.x * 43758.5469;
    u_xlat3.x = dot(u_xlat3.xy, vec2(12.9898005, 78.2330017));
    u_xlat3.x = u_xlat3.x * 0.159154937;
    u_xlatb21 = u_xlat3.x>=(-u_xlat3.x);
    u_xlat3.x = fract(abs(u_xlat3.x));
    u_xlat3.x = (u_xlatb21) ? u_xlat3.x : (-u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 6.28318548;
    u_xlat3.x = sin(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * 43758.5469;
    u_xlat9 = dot(u_xlat3.yy, vec2(12.9898005, 78.2330017));
    u_xlat9 = u_xlat9 * 0.159154937;
    u_xlatb21 = u_xlat9>=(-u_xlat9);
    u_xlat9 = fract(abs(u_xlat9));
    u_xlat9 = (u_xlatb21) ? u_xlat9 : (-u_xlat9);
    u_xlat9 = u_xlat9 * 6.28318548;
    u_xlat9 = sin(u_xlat9);
    u_xlat3.y = u_xlat9 * 43758.5469;
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat15.x = (-u_xlat6) + u_xlat3.z;
    u_xlat6 = u_xlat0.z * u_xlat15.x + u_xlat6;
    u_xlat9 = (-u_xlat3.x) + u_xlat3.y;
    u_xlat3.x = u_xlat0.z * u_xlat9 + u_xlat3.x;
    u_xlat3.x = (-u_xlat6) + u_xlat3.x;
    u_xlat6 = u_xlat0.z * u_xlat3.x + u_xlat6;
    u_xlat0.x = u_xlat6 * 0.5 + u_xlat0.x;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat0.x = u_xlat0.x + 0.5;
    u_xlat0.xw = floor(u_xlat0.xw);
    u_xlat0.x = max(u_xlat0.x, u_xlat0.w);
    u_xlat6 = roundEven(u_xlat8.y);
    u_xlat0.x = u_xlat6 * u_xlat0.x;
    u_xlat6 = u_xlat6 * u_xlat16_1.z;
    u_xlat0.x = max(u_xlat6, u_xlat0.x);
    u_xlat6 = ceil(u_xlat2.w);
    u_xlat12.x = roundEven(u_xlat16_1.w);
    u_xlat12.x = u_xlat12.x * u_xlat6;
    u_xlat12.x = u_xlat12.x * u_xlat0.x;
    u_xlat3.w = (-u_xlat12.x) * 0.600000024 + u_xlat16_1.w;
    u_xlatb12 = u_xlat3.w==0.0;
    if(u_xlatb12){discard;}
    u_xlat12.xy = u_xlat16_1.xy + vec2(-0.699999988, -0.699999988);
    u_xlat12.xy = ceil(u_xlat12.xy);
    u_xlat14.xy = (-u_xlat16_1.zz) + u_xlat16_1.yx;
    u_xlat14.xy = abs(u_xlat14.xy) * vec2(10.0, 10.0);
    u_xlat14.xy = roundEven(u_xlat14.xy);
    u_xlat14.xy = min(u_xlat14.xy, vec2(1.0, 1.0));
    u_xlat14.xy = (-u_xlat14.xy) + vec2(1.0, 1.0);
    u_xlat14.xy = u_xlat16_1.yz * u_xlat14.xy;
    u_xlat12.xy = u_xlat12.xy * u_xlat14.xy;
    u_xlat4.xyz = _RedChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat4.xyz = u_xlat2.xxx * u_xlat4.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat5.xyz = (-u_xlat4.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat4.xyz = u_xlat12.xxx * u_xlat5.xyz + u_xlat4.xyz;
    u_xlat2.xz = ceil(u_xlat2.xy);
    u_xlat4.xyz = (-u_xlat16_1.xyz) + u_xlat4.xyz;
    u_xlat1.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat16_1.xyz;
    u_xlat4.xyz = _GreenChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat2.xyw = u_xlat2.yyy * u_xlat4.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat4.xyz = (-u_xlat2.xyw) + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyw = u_xlat12.yyy * u_xlat4.xyz + u_xlat2.xyw;
    u_xlat2.xyw = (-u_xlat1.xyz) + u_xlat2.xyw;
    u_xlat1.xyz = u_xlat2.zzz * u_xlat2.xyw + u_xlat1.xyz;
    u_xlat0.xzw = _Glass.xyz * u_xlat0.xxx + (-u_xlat1.xyz);
    u_xlat3.xyz = vec3(u_xlat6) * u_xlat0.xzw + u_xlat1.xyz;
    u_xlat0 = u_xlat3 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
        
