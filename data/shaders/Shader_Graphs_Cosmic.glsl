// Shader Graphs/Cosmic
// sacado de duplicateassetisolation_assets_all_7a42fe53d9712b1c81bcc2bbbbf83353.bundle
// declara: White, _Background, _MainTex, _Shade, _StarsBig, _StarsSmall, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
uniform 	vec4 _TimeParameters;
uniform 	vec4 _ProjectionParams;
uniform 	float _GlobalDistort;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _Background;
UNITY_LOCATION(2) uniform mediump sampler2D _StarsBig;
UNITY_LOCATION(3) uniform mediump sampler2D _StarsSmall;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
vec4 u_xlat1;
mediump vec3 u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
vec4 u_xlat3;
mediump vec3 u_xlat16_3;
bvec4 u_xlatb3;
vec4 u_xlat4;
bvec4 u_xlatb4;
vec4 u_xlat5;
bvec4 u_xlatb5;
vec4 u_xlat6;
float u_xlat8;
vec2 u_xlat9;
bool u_xlatb9;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat16;
bool u_xlatb16;
vec2 u_xlat17;
bool u_xlatb17;
vec2 u_xlat18;
float u_xlat23;
bool u_xlatb23;
float u_xlat24;
bool u_xlatb24;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.w = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlatb1 = u_xlat0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlatb1 = 0.0<_ProjectionParams.x;
    u_xlat8 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb1) ? u_xlat8 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat1.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat1.z = (-u_xlat1.y) + vs_INTERP2.y;
    u_xlat2.xz = vs_INTERP2.xx;
    u_xlat2.y = float(1.0);
    u_xlat2.w = float(1.0);
    u_xlat1 = u_xlat1.xzxz + u_xlat2;
    u_xlat2.x = _TimeParameters.x * _GlobalDistort;
    u_xlat2.xy = vs_INTERP2.xy * vec2(3.0, 3.0) + u_xlat2.xx;
    u_xlat2.xy = u_xlat2.xy * vec2(vec2(_GlobalDistort, _GlobalDistort));
    u_xlat16.xy = floor(u_xlat2.xy);
    u_xlat2.xy = fract(u_xlat2.xy);
    u_xlat3 = u_xlat16.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb3 = greaterThanEqual(u_xlat3, (-u_xlat3.zwzw));
    u_xlat3.x = (u_xlatb3.x) ? float(289.0) : float(-289.0);
    u_xlat3.y = (u_xlatb3.y) ? float(289.0) : float(-289.0);
    u_xlat3.z = (u_xlatb3.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.w = (u_xlatb3.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat17.xy = u_xlat16.xy * u_xlat3.zw;
    u_xlat17.xy = fract(u_xlat17.xy);
    u_xlat3.xy = u_xlat17.xy * u_xlat3.xy;
    u_xlat17.x = u_xlat3.x * 34.0 + 1.0;
    u_xlat3.x = u_xlat3.x * u_xlat17.x;
    u_xlat17.x = u_xlat3.x * 289.0;
    u_xlatb17 = u_xlat17.x>=(-u_xlat17.x);
    u_xlat17.xy = (bool(u_xlatb17)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat3.x = u_xlat17.y * u_xlat3.x;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.x = u_xlat17.x * u_xlat3.x + u_xlat3.y;
    u_xlat10.x = u_xlat3.x * 34.0 + 1.0;
    u_xlat3.x = u_xlat3.x * u_xlat10.x;
    u_xlat10.x = u_xlat3.x * 289.0;
    u_xlatb10 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.xy = (bool(u_xlatb10)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat3.x = u_xlat10.y * u_xlat3.x;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * u_xlat10.x;
    u_xlat3.x = u_xlat3.x * 0.024390243;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat10.x = floor(u_xlat3.y);
    u_xlat4.x = (-u_xlat10.x) + u_xlat3.x;
    u_xlat4.y = abs(u_xlat3.x) + -0.5;
    u_xlat3.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.xy;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat2.xy);
    u_xlat4 = u_xlat16.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat5 = u_xlat4 * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb5 = greaterThanEqual(u_xlat5, (-u_xlat5));
    u_xlat6.x = (u_xlatb5.x) ? float(289.0) : float(-289.0);
    u_xlat6.y = (u_xlatb5.y) ? float(289.0) : float(-289.0);
    u_xlat6.z = (u_xlatb5.x) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat6.w = (u_xlatb5.y) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat10.xy = u_xlat4.xy * u_xlat6.zw;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat10.xy = u_xlat10.xy * u_xlat6.xy;
    u_xlat24 = u_xlat10.x * 34.0 + 1.0;
    u_xlat10.x = u_xlat10.x * u_xlat24;
    u_xlat24 = u_xlat10.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat10.x = u_xlat10.x * u_xlat4.y;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.x = u_xlat4.x * u_xlat10.x + u_xlat10.y;
    u_xlat17.x = u_xlat10.x * 34.0 + 1.0;
    u_xlat10.x = u_xlat10.x * u_xlat17.x;
    u_xlat17.x = u_xlat10.x * 289.0;
    u_xlatb17 = u_xlat17.x>=(-u_xlat17.x);
    u_xlat17.xy = (bool(u_xlatb17)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat10.x = u_xlat17.y * u_xlat10.x;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * u_xlat17.x;
    u_xlat10.x = u_xlat10.x * 0.024390243;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.xy = u_xlat10.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat17.x = floor(u_xlat10.y);
    u_xlat4.x = (-u_xlat17.x) + u_xlat10.x;
    u_xlat4.y = abs(u_xlat10.x) + -0.5;
    u_xlat10.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat10.x = inversesqrt(u_xlat10.x);
    u_xlat10.xy = u_xlat10.xx * u_xlat4.xy;
    u_xlat6 = u_xlat2.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat10.x = dot(u_xlat10.xy, u_xlat6.xy);
    u_xlat5.x = (u_xlatb5.z) ? float(289.0) : float(-289.0);
    u_xlat5.y = (u_xlatb5.w) ? float(289.0) : float(-289.0);
    u_xlat5.z = (u_xlatb5.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat5.w = (u_xlatb5.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat17.xy = u_xlat4.zw * u_xlat5.zw;
    u_xlat17.xy = fract(u_xlat17.xy);
    u_xlat17.xy = u_xlat17.xy * u_xlat5.xy;
    u_xlat4.x = u_xlat17.x * 34.0 + 1.0;
    u_xlat17.x = u_xlat17.x * u_xlat4.x;
    u_xlat4.x = u_xlat17.x * 289.0;
    u_xlatb4.x = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.xy = (u_xlatb4.x) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat17.x = u_xlat17.x * u_xlat4.y;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.x = u_xlat4.x * u_xlat17.x + u_xlat17.y;
    u_xlat24 = u_xlat17.x * 34.0 + 1.0;
    u_xlat17.x = u_xlat17.x * u_xlat24;
    u_xlat24 = u_xlat17.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat17.x = u_xlat17.x * u_xlat4.y;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.x = u_xlat17.x * u_xlat4.x;
    u_xlat17.x = u_xlat17.x * 0.024390243;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.xy = u_xlat17.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat24 = floor(u_xlat17.y);
    u_xlat4.x = (-u_xlat24) + u_xlat17.x;
    u_xlat4.y = abs(u_xlat17.x) + -0.5;
    u_xlat17.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat17.x = inversesqrt(u_xlat17.x);
    u_xlat17.xy = u_xlat17.xx * u_xlat4.xy;
    u_xlat17.x = dot(u_xlat17.xy, u_xlat6.zw);
    u_xlat16.xy = u_xlat16.xy + vec2(1.0, 1.0);
    u_xlat4 = u_xlat16.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb4 = greaterThanEqual(u_xlat4, (-u_xlat4.zwzw));
    u_xlat4.x = (u_xlatb4.x) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb4.y) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb4.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb4.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.zw;
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.xy;
    u_xlat24 = u_xlat16.x * 34.0 + 1.0;
    u_xlat16.x = u_xlat16.x * u_xlat24;
    u_xlat24 = u_xlat16.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16.x = u_xlat16.x * u_xlat4.y;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.x = u_xlat4.x * u_xlat16.x + u_xlat16.y;
    u_xlat23 = u_xlat16.x * 34.0 + 1.0;
    u_xlat16.x = u_xlat16.x * u_xlat23;
    u_xlat23 = u_xlat16.x * 289.0;
    u_xlatb23 = u_xlat23>=(-u_xlat23);
    u_xlat4.xy = (bool(u_xlatb23)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16.x = u_xlat16.x * u_xlat4.y;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.x = u_xlat16.x * u_xlat4.x;
    u_xlat16.x = u_xlat16.x * 0.024390243;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.xy = u_xlat16.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat23 = floor(u_xlat16.y);
    u_xlat4.x = (-u_xlat23) + u_xlat16.x;
    u_xlat4.y = abs(u_xlat16.x) + -0.5;
    u_xlat16.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat16.x = inversesqrt(u_xlat16.x);
    u_xlat16.xy = u_xlat16.xx * u_xlat4.xy;
    u_xlat4.xy = u_xlat2.xy + vec2(-1.0, -1.0);
    u_xlat16.x = dot(u_xlat16.xy, u_xlat4.xy);
    u_xlat4.xy = u_xlat2.xy * u_xlat2.xy;
    u_xlat4.xy = u_xlat2.xy * u_xlat4.xy;
    u_xlat18.xy = u_xlat2.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat2.xy * u_xlat18.xy + vec2(10.0, 10.0);
    u_xlat2.xy = u_xlat2.xy * u_xlat4.xy;
    u_xlat23 = (-u_xlat3.x) + u_xlat10.x;
    u_xlat23 = u_xlat2.y * u_xlat23 + u_xlat3.x;
    u_xlat16.x = (-u_xlat17.x) + u_xlat16.x;
    u_xlat9.x = u_xlat2.y * u_xlat16.x + u_xlat17.x;
    u_xlat9.x = (-u_xlat23) + u_xlat9.x;
    u_xlat2.x = u_xlat2.x * u_xlat9.x + u_xlat23;
    u_xlat2.x = u_xlat2.x + 0.5;
    u_xlat2.x = u_xlat2.x * _GlobalDistort;
    u_xlat9.xy = u_xlat2.xx * vec2(0.333333343, 0.333333343) + u_xlat1.zw;
    u_xlat3.xyw = texture(_Background, u_xlat9.xy, _GlobalMipBias.x).yzx;
    u_xlatb9 = u_xlat3.x>=u_xlat3.y;
    u_xlat9.x = u_xlatb9 ? 1.0 : float(0.0);
    u_xlat4.xy = u_xlat3.yx;
    u_xlat4.z = float(-1.0);
    u_xlat4.w = float(0.666666687);
    u_xlat5.xy = u_xlat3.xy + (-u_xlat4.xy);
    u_xlat5.z = float(1.0);
    u_xlat5.w = float(-1.0);
    u_xlat4 = u_xlat9.xxxx * u_xlat5 + u_xlat4;
    u_xlatb9 = u_xlat3.w>=u_xlat4.x;
    u_xlat9.x = u_xlatb9 ? 1.0 : float(0.0);
    u_xlat3.xyz = u_xlat4.xyw;
    u_xlat4.xyw = u_xlat3.wyx;
    u_xlat4 = (-u_xlat3) + u_xlat4;
    u_xlat3 = u_xlat9.xxxx * u_xlat4 + u_xlat3;
    u_xlat9.x = min(u_xlat3.y, u_xlat3.w);
    u_xlat9.x = (-u_xlat9.x) + u_xlat3.x;
    u_xlatb16 = u_xlat9.x==0.0;
    u_xlat23 = u_xlat3.x + 1.00000001e-10;
    u_xlat16.x = (u_xlatb16) ? u_xlat3.x : u_xlat23;
    u_xlat3.x = (-u_xlat3.y) + u_xlat3.w;
    u_xlat10.x = u_xlat9.x * 6.0 + 1.00000001e-10;
    u_xlat3.x = u_xlat3.x / u_xlat10.x;
    u_xlat3.x = u_xlat3.x + u_xlat3.z;
    u_xlat9.x = u_xlat9.x / u_xlat23;
    u_xlat2.x = u_xlat2.x * 0.092592597 + abs(u_xlat3.x);
    u_xlatb23 = u_xlat2.x<0.0;
    u_xlatb3.x = 1.0<u_xlat2.x;
    u_xlat10.xy = u_xlat2.xx + vec2(1.0, -1.0);
    u_xlat2.x = (u_xlatb3.x) ? u_xlat10.y : u_xlat2.x;
    u_xlat2.x = (u_xlatb23) ? u_xlat10.x : u_xlat2.x;
    u_xlat3.xyz = u_xlat2.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat3.xyz = u_xlat3.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat3.xyz = abs(u_xlat3.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat3.xyz = clamp(u_xlat3.xyz, 0.0, 1.0);
    u_xlat3.xyz = u_xlat3.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat2.xyw = u_xlat9.xxx * u_xlat3.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat3 = _TimeParameters.xxxx * vec4(0.0078125, 0.0078125, 0.00390625, 0.00390625);
    u_xlat1 = u_xlat1 * vec4(0.25, 0.25, 0.25, 0.25) + u_xlat3;
    u_xlat16_3.xyz = texture(_StarsBig, u_xlat1.xy, _GlobalMipBias.x).xyz;
    u_xlat16_1.xyz = texture(_StarsSmall, u_xlat1.zw, _GlobalMipBias.x).xyz;
    u_xlat1.xyz = u_xlat16_1.xyz + u_xlat16_3.xyz;
    u_xlat0.xyz = u_xlat16.xxx * u_xlat2.xyw + u_xlat1.xyz;
    u_xlat0 = u_xlat0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         ºu
                         SKINNED_SPRITE  
@  #ifdef VERTEX


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
uniform 	vec4 _TimeParameters;
uniform 	vec4 _ProjectionParams;
uniform 	float _GlobalDistort;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _Background;
UNITY_LOCATION(2) uniform mediump sampler2D _StarsBig;
UNITY_LOCATION(3) uniform mediump sampler2D _StarsSmall;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
vec4 u_xlat1;
mediump vec3 u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
vec4 u_xlat3;
mediump vec3 u_xlat16_3;
bvec4 u_xlatb3;
vec4 u_xlat4;
bvec4 u_xlatb4;
vec4 u_xlat5;
bvec4 u_xlatb5;
vec4 u_xlat6;
float u_xlat8;
vec2 u_xlat9;
bool u_xlatb9;
vec2 u_xlat10;
bool u_xlatb10;
vec2 u_xlat16;
bool u_xlatb16;
vec2 u_xlat17;
bool u_xlatb17;
vec2 u_xlat18;
float u_xlat23;
bool u_xlatb23;
float u_xlat24;
bool u_xlatb24;
void main()
{
vec4 hlslcc_FragCoord = vec4(gl_FragCoord.xyz, 1.0/gl_FragCoord.w);
    u_xlat0.w = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x).w;
    u_xlatb1 = u_xlat0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlatb1 = 0.0<_ProjectionParams.x;
    u_xlat8 = (-hlslcc_FragCoord.y) + _ScaledScreenParams.y;
    u_xlat1.y = (u_xlatb1) ? u_xlat8 : hlslcc_FragCoord.y;
    u_xlat1.x = hlslcc_FragCoord.x;
    u_xlat1.xy = u_xlat1.xy / _ScaledScreenParams.xy;
    u_xlat1.z = (-u_xlat1.y) + vs_INTERP2.y;
    u_xlat2.xz = vs_INTERP2.xx;
    u_xlat2.y = float(1.0);
    u_xlat2.w = float(1.0);
    u_xlat1 = u_xlat1.xzxz + u_xlat2;
    u_xlat2.x = _TimeParameters.x * _GlobalDistort;
    u_xlat2.xy = vs_INTERP2.xy * vec2(3.0, 3.0) + u_xlat2.xx;
    u_xlat2.xy = u_xlat2.xy * vec2(vec2(_GlobalDistort, _GlobalDistort));
    u_xlat16.xy = floor(u_xlat2.xy);
    u_xlat2.xy = fract(u_xlat2.xy);
    u_xlat3 = u_xlat16.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb3 = greaterThanEqual(u_xlat3, (-u_xlat3.zwzw));
    u_xlat3.x = (u_xlatb3.x) ? float(289.0) : float(-289.0);
    u_xlat3.y = (u_xlatb3.y) ? float(289.0) : float(-289.0);
    u_xlat3.z = (u_xlatb3.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.w = (u_xlatb3.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat17.xy = u_xlat16.xy * u_xlat3.zw;
    u_xlat17.xy = fract(u_xlat17.xy);
    u_xlat3.xy = u_xlat17.xy * u_xlat3.xy;
    u_xlat17.x = u_xlat3.x * 34.0 + 1.0;
    u_xlat3.x = u_xlat3.x * u_xlat17.x;
    u_xlat17.x = u_xlat3.x * 289.0;
    u_xlatb17 = u_xlat17.x>=(-u_xlat17.x);
    u_xlat17.xy = (bool(u_xlatb17)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat3.x = u_xlat17.y * u_xlat3.x;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.x = u_xlat17.x * u_xlat3.x + u_xlat3.y;
    u_xlat10.x = u_xlat3.x * 34.0 + 1.0;
    u_xlat3.x = u_xlat3.x * u_xlat10.x;
    u_xlat10.x = u_xlat3.x * 289.0;
    u_xlatb10 = u_xlat10.x>=(-u_xlat10.x);
    u_xlat10.xy = (bool(u_xlatb10)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat3.x = u_xlat10.y * u_xlat3.x;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.x = u_xlat3.x * u_xlat10.x;
    u_xlat3.x = u_xlat3.x * 0.024390243;
    u_xlat3.x = fract(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat10.x = floor(u_xlat3.y);
    u_xlat4.x = (-u_xlat10.x) + u_xlat3.x;
    u_xlat4.y = abs(u_xlat3.x) + -0.5;
    u_xlat3.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat3.x = inversesqrt(u_xlat3.x);
    u_xlat3.xy = u_xlat3.xx * u_xlat4.xy;
    u_xlat3.x = dot(u_xlat3.xy, u_xlat2.xy);
    u_xlat4 = u_xlat16.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat5 = u_xlat4 * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb5 = greaterThanEqual(u_xlat5, (-u_xlat5));
    u_xlat6.x = (u_xlatb5.x) ? float(289.0) : float(-289.0);
    u_xlat6.y = (u_xlatb5.y) ? float(289.0) : float(-289.0);
    u_xlat6.z = (u_xlatb5.x) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat6.w = (u_xlatb5.y) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat10.xy = u_xlat4.xy * u_xlat6.zw;
    u_xlat10.xy = fract(u_xlat10.xy);
    u_xlat10.xy = u_xlat10.xy * u_xlat6.xy;
    u_xlat24 = u_xlat10.x * 34.0 + 1.0;
    u_xlat10.x = u_xlat10.x * u_xlat24;
    u_xlat24 = u_xlat10.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat10.x = u_xlat10.x * u_xlat4.y;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.x = u_xlat4.x * u_xlat10.x + u_xlat10.y;
    u_xlat17.x = u_xlat10.x * 34.0 + 1.0;
    u_xlat10.x = u_xlat10.x * u_xlat17.x;
    u_xlat17.x = u_xlat10.x * 289.0;
    u_xlatb17 = u_xlat17.x>=(-u_xlat17.x);
    u_xlat17.xy = (bool(u_xlatb17)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat10.x = u_xlat17.y * u_xlat10.x;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.x = u_xlat10.x * u_xlat17.x;
    u_xlat10.x = u_xlat10.x * 0.024390243;
    u_xlat10.x = fract(u_xlat10.x);
    u_xlat10.xy = u_xlat10.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat17.x = floor(u_xlat10.y);
    u_xlat4.x = (-u_xlat17.x) + u_xlat10.x;
    u_xlat4.y = abs(u_xlat10.x) + -0.5;
    u_xlat10.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat10.x = inversesqrt(u_xlat10.x);
    u_xlat10.xy = u_xlat10.xx * u_xlat4.xy;
    u_xlat6 = u_xlat2.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat10.x = dot(u_xlat10.xy, u_xlat6.xy);
    u_xlat5.x = (u_xlatb5.z) ? float(289.0) : float(-289.0);
    u_xlat5.y = (u_xlatb5.w) ? float(289.0) : float(-289.0);
    u_xlat5.z = (u_xlatb5.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat5.w = (u_xlatb5.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat17.xy = u_xlat4.zw * u_xlat5.zw;
    u_xlat17.xy = fract(u_xlat17.xy);
    u_xlat17.xy = u_xlat17.xy * u_xlat5.xy;
    u_xlat4.x = u_xlat17.x * 34.0 + 1.0;
    u_xlat17.x = u_xlat17.x * u_xlat4.x;
    u_xlat4.x = u_xlat17.x * 289.0;
    u_xlatb4.x = u_xlat4.x>=(-u_xlat4.x);
    u_xlat4.xy = (u_xlatb4.x) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat17.x = u_xlat17.x * u_xlat4.y;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.x = u_xlat4.x * u_xlat17.x + u_xlat17.y;
    u_xlat24 = u_xlat17.x * 34.0 + 1.0;
    u_xlat17.x = u_xlat17.x * u_xlat24;
    u_xlat24 = u_xlat17.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat17.x = u_xlat17.x * u_xlat4.y;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.x = u_xlat17.x * u_xlat4.x;
    u_xlat17.x = u_xlat17.x * 0.024390243;
    u_xlat17.x = fract(u_xlat17.x);
    u_xlat17.xy = u_xlat17.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat24 = floor(u_xlat17.y);
    u_xlat4.x = (-u_xlat24) + u_xlat17.x;
    u_xlat4.y = abs(u_xlat17.x) + -0.5;
    u_xlat17.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat17.x = inversesqrt(u_xlat17.x);
    u_xlat17.xy = u_xlat17.xx * u_xlat4.xy;
    u_xlat17.x = dot(u_xlat17.xy, u_xlat6.zw);
    u_xlat16.xy = u_xlat16.xy + vec2(1.0, 1.0);
    u_xlat4 = u_xlat16.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb4 = greaterThanEqual(u_xlat4, (-u_xlat4.zwzw));
    u_xlat4.x = (u_xlatb4.x) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb4.y) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb4.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb4.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.zw;
    u_xlat16.xy = fract(u_xlat16.xy);
    u_xlat16.xy = u_xlat16.xy * u_xlat4.xy;
    u_xlat24 = u_xlat16.x * 34.0 + 1.0;
    u_xlat16.x = u_xlat16.x * u_xlat24;
    u_xlat24 = u_xlat16.x * 289.0;
    u_xlatb24 = u_xlat24>=(-u_xlat24);
    u_xlat4.xy = (bool(u_xlatb24)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16.x = u_xlat16.x * u_xlat4.y;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.x = u_xlat4.x * u_xlat16.x + u_xlat16.y;
    u_xlat23 = u_xlat16.x * 34.0 + 1.0;
    u_xlat16.x = u_xlat16.x * u_xlat23;
    u_xlat23 = u_xlat16.x * 289.0;
    u_xlatb23 = u_xlat23>=(-u_xlat23);
    u_xlat4.xy = (bool(u_xlatb23)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16.x = u_xlat16.x * u_xlat4.y;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.x = u_xlat16.x * u_xlat4.x;
    u_xlat16.x = u_xlat16.x * 0.024390243;
    u_xlat16.x = fract(u_xlat16.x);
    u_xlat16.xy = u_xlat16.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat23 = floor(u_xlat16.y);
    u_xlat4.x = (-u_xlat23) + u_xlat16.x;
    u_xlat4.y = abs(u_xlat16.x) + -0.5;
    u_xlat16.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat16.x = inversesqrt(u_xlat16.x);
    u_xlat16.xy = u_xlat16.xx * u_xlat4.xy;
    u_xlat4.xy = u_xlat2.xy + vec2(-1.0, -1.0);
    u_xlat16.x = dot(u_xlat16.xy, u_xlat4.xy);
    u_xlat4.xy = u_xlat2.xy * u_xlat2.xy;
    u_xlat4.xy = u_xlat2.xy * u_xlat4.xy;
    u_xlat18.xy = u_xlat2.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat2.xy = u_xlat2.xy * u_xlat18.xy + vec2(10.0, 10.0);
    u_xlat2.xy = u_xlat2.xy * u_xlat4.xy;
    u_xlat23 = (-u_xlat3.x) + u_xlat10.x;
    u_xlat23 = u_xlat2.y * u_xlat23 + u_xlat3.x;
    u_xlat16.x = (-u_xlat17.x) + u_xlat16.x;
    u_xlat9.x = u_xlat2.y * u_xlat16.x + u_xlat17.x;
    u_xlat9.x = (-u_xlat23) + u_xlat9.x;
    u_xlat2.x = u_xlat2.x * u_xlat9.x + u_xlat23;
    u_xlat2.x = u_xlat2.x + 0.5;
    u_xlat2.x = u_xlat2.x * _GlobalDistort;
    u_xlat9.xy = u_xlat2.xx * vec2(0.333333343, 0.333333343) + u_xlat1.zw;
    u_xlat3.xyw = texture(_Background, u_xlat9.xy, _GlobalMipBias.x).yzx;
    u_xlatb9 = u_xlat3.x>=u_xlat3.y;
    u_xlat9.x = u_xlatb9 ? 1.0 : float(0.0);
    u_xlat4.xy = u_xlat3.yx;
    u_xlat4.z = float(-1.0);
    u_xlat4.w = float(0.666666687);
    u_xlat5.xy = u_xlat3.xy + (-u_xlat4.xy);
    u_xlat5.z = float(1.0);
    u_xlat5.w = float(-1.0);
    u_xlat4 = u_xlat9.xxxx * u_xlat5 + u_xlat4;
    u_xlatb9 = u_xlat3.w>=u_xlat4.x;
    u_xlat9.x = u_xlatb9 ? 1.0 : float(0.0);
    u_xlat3.xyz = u_xlat4.xyw;
    u_xlat4.xyw = u_xlat3.wyx;
    u_xlat4 = (-u_xlat3) + u_xlat4;
    u_xlat3 = u_xlat9.xxxx * u_xlat4 + u_xlat3;
    u_xlat9.x = min(u_xlat3.y, u_xlat3.w);
    u_xlat9.x = (-u_xlat9.x) + u_xlat3.x;
    u_xlatb16 = u_xlat9.x==0.0;
    u_xlat23 = u_xlat3.x + 1.00000001e-10;
    u_xlat16.x = (u_xlatb16) ? u_xlat3.x : u_xlat23;
    u_xlat3.x = (-u_xlat3.y) + u_xlat3.w;
    u_xlat10.x = u_xlat9.x * 6.0 + 1.00000001e-10;
    u_xlat3.x = u_xlat3.x / u_xlat10.x;
    u_xlat3.x = u_xlat3.x + u_xlat3.z;
    u_xlat9.x = u_xlat9.x / u_xlat23;
    u_xlat2.x = u_xlat2.x * 0.092592597 + abs(u_xlat3.x);
    u_xlatb23 = u_xlat2.x<0.0;
    u_xlatb3.x = 1.0<u_xlat2.x;
    u_xlat10.xy = u_xlat2.xx + vec2(1.0, -1.0);
    u_xlat2.x = (u_xlatb3.x) ? u_xlat10.y : u_xlat2.x;
    u_xlat2.x = (u_xlatb23) ? u_xlat10.x : u_xlat2.x;
    u_xlat3.xyz = u_xlat2.xxx + vec3(1.0, 0.666666687, 0.333333343);
    u_xlat3.xyz = fract(u_xlat3.xyz);
    u_xlat3.xyz = u_xlat3.xyz * vec3(6.0, 6.0, 6.0) + vec3(-3.0, -3.0, -3.0);
    u_xlat3.xyz = abs(u_xlat3.xyz) + vec3(-1.0, -1.0, -1.0);
    u_xlat3.xyz = clamp(u_xlat3.xyz, 0.0, 1.0);
    u_xlat3.xyz = u_xlat3.xyz + vec3(-1.0, -1.0, -1.0);
    u_xlat2.xyw = u_xlat9.xxx * u_xlat3.xyz + vec3(1.0, 1.0, 1.0);
    u_xlat3 = _TimeParameters.xxxx * vec4(0.0078125, 0.0078125, 0.00390625, 0.00390625);
    u_xlat1 = u_xlat1 * vec4(0.25, 0.25, 0.25, 0.25) + u_xlat3;
    u_xlat16_3.xyz = texture(_StarsBig, u_xlat1.xy, _GlobalMipBias.x).xyz;
    u_xlat16_1.xyz = texture(_StarsSmall, u_xlat1.zw, _GlobalMipBias.x).xyz;
    u_xlat1.xyz = u_xlat16_1.xyz + u_xlat16_3.xyz;
    u_xlat0.xyz = u_xlat16.xxx * u_xlat2.xyw + u_xlat1.xyz;
    u_xlat0 = u_xlat0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
         
