// Shader Graphs/Tar
// sacado de sharedassets50.assets
// declara: White, _Darkness, _DistortStrength, _MainTex, _NoiseScale, _NoiseStrength, _Tar, _TextureRamp, _TextureScale, _TextureStrength, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
uniform 	vec2 _GlobalMipBias;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float Xhlslcc_UnusedX_NoiseStrength;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _DistortStrength;
	UNITY_UNIFORM float                _TextureScale;
	UNITY_UNIFORM float                _TextureStrength;
	UNITY_UNIFORM float                _TextureRamp;
	UNITY_UNIFORM float                _Darkness;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_Tar_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _Tar;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
vec2 u_xlat1;
mediump vec3 u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
bvec4 u_xlatb2;
vec4 u_xlat3;
bvec4 u_xlatb3;
vec4 u_xlat4;
bvec4 u_xlatb4;
float u_xlat5;
vec3 u_xlat6;
bool u_xlatb6;
vec2 u_xlat10;
vec2 u_xlat11;
vec2 u_xlat12;
bool u_xlatb12;
vec2 u_xlat13;
mediump float u_xlat16_15;
float u_xlat16;
bool u_xlatb16;
void main()
{
    u_xlat0 = vs_INTERP2.xyxy * vec4(_NoiseScale, _NoiseScale, _TextureScale, _TextureScale);
    u_xlat1.xy = floor(u_xlat0.xy);
    u_xlat11.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlat2 = u_xlat11.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb2 = greaterThanEqual(u_xlat2, (-u_xlat2.zwzw));
    u_xlat2.x = (u_xlatb2.x) ? float(289.0) : float(-289.0);
    u_xlat2.y = (u_xlatb2.y) ? float(289.0) : float(-289.0);
    u_xlat2.z = (u_xlatb2.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat2.w = (u_xlatb2.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.zw;
    u_xlat11.xy = fract(u_xlat11.xy);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.x = u_xlat11.x * 34.0 + 1.0;
    u_xlat11.x = u_xlat11.x * u_xlat2.x;
    u_xlat2.x = u_xlat11.x * 289.0;
    u_xlatb2.x = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.xy = (u_xlatb2.x) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat11.x = u_xlat11.x * u_xlat2.y;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat11.x + u_xlat11.y;
    u_xlat16 = u_xlat11.x * 34.0 + 1.0;
    u_xlat11.x = u_xlat11.x * u_xlat16;
    u_xlat16 = u_xlat11.x * 289.0;
    u_xlatb16 = u_xlat16>=(-u_xlat16);
    u_xlat2.xy = (bool(u_xlatb16)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat11.x = u_xlat11.x * u_xlat2.y;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.x = u_xlat11.x * u_xlat2.x;
    u_xlat11.x = u_xlat11.x * 0.024390243;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat16 = floor(u_xlat11.y);
    u_xlat2.x = (-u_xlat16) + u_xlat11.x;
    u_xlat2.y = abs(u_xlat11.x) + -0.5;
    u_xlat11.x = dot(u_xlat2.xy, u_xlat2.xy);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xy;
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat2.xy = u_xlat0.xy + vec2(-1.0, -1.0);
    u_xlat11.x = dot(u_xlat11.xy, u_xlat2.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat3 = u_xlat2 * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb3 = greaterThanEqual(u_xlat3, (-u_xlat3));
    u_xlat4.x = (u_xlatb3.z) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb3.w) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb3.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb3.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.x = (u_xlatb3.x) ? float(289.0) : float(-289.0);
    u_xlat3.y = (u_xlatb3.y) ? float(289.0) : float(-289.0);
    u_xlat3.z = (u_xlatb3.x) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.w = (u_xlatb3.y) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat2.zw = u_xlat2.zw * u_xlat4.zw;
    u_xlat2.xy = u_xlat2.xy * u_xlat3.zw;
    u_xlat2 = fract(u_xlat2);
    u_xlat2.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat12.xy = u_xlat2.zw * u_xlat4.xy;
    u_xlat16 = u_xlat12.x * 34.0 + 1.0;
    u_xlat16 = u_xlat12.x * u_xlat16;
    u_xlat12.x = u_xlat16 * 289.0;
    u_xlatb12 = u_xlat12.x>=(-u_xlat12.x);
    u_xlat3.xy = (bool(u_xlatb12)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16 = u_xlat16 * u_xlat3.y;
    u_xlat16 = fract(u_xlat16);
    u_xlat16 = u_xlat3.x * u_xlat16 + u_xlat12.y;
    u_xlat12.x = u_xlat16 * 34.0 + 1.0;
    u_xlat16 = u_xlat16 * u_xlat12.x;
    u_xlat12.x = u_xlat16 * 289.0;
    u_xlatb12 = u_xlat12.x>=(-u_xlat12.x);
    u_xlat12.xy = (bool(u_xlatb12)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16 = u_xlat16 * u_xlat12.y;
    u_xlat16 = fract(u_xlat16);
    u_xlat16 = u_xlat16 * u_xlat12.x;
    u_xlat16 = u_xlat16 * 0.024390243;
    u_xlat16 = fract(u_xlat16);
    u_xlat12.xy = vec2(u_xlat16) * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat16 = floor(u_xlat12.y);
    u_xlat3.x = (-u_xlat16) + u_xlat12.x;
    u_xlat3.y = abs(u_xlat12.x) + -0.5;
    u_xlat16 = dot(u_xlat3.xy, u_xlat3.xy);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat12.xy = vec2(u_xlat16) * u_xlat3.xy;
    u_xlat3 = u_xlat0.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat12.xy, u_xlat3.zw);
    u_xlat11.x = (-u_xlat16) + u_xlat11.x;
    u_xlat12.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat12.xy = u_xlat0.xy * u_xlat12.xy;
    u_xlat13.xy = u_xlat0.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat13.xy = u_xlat0.xy * u_xlat13.xy + vec2(10.0, 10.0);
    u_xlat12.xy = u_xlat12.xy * u_xlat13.xy;
    u_xlat11.x = u_xlat12.y * u_xlat11.x + u_xlat16;
    u_xlat4 = u_xlat1.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb4 = greaterThanEqual(u_xlat4, (-u_xlat4.zwzw));
    u_xlat4.x = (u_xlatb4.x) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb4.y) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb4.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb4.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat1.xy = u_xlat1.xy * u_xlat4.zw;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat1.xy = u_xlat1.xy * u_xlat4.xy;
    u_xlat16 = u_xlat1.x * 34.0 + 1.0;
    u_xlat1.x = u_xlat1.x * u_xlat16;
    u_xlat16 = u_xlat1.x * 289.0;
    u_xlatb16 = u_xlat16>=(-u_xlat16);
    u_xlat13.xy = (bool(u_xlatb16)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat1.x = u_xlat1.x * u_xlat13.y;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.x = u_xlat13.x * u_xlat1.x + u_xlat1.y;
    u_xlat6.x = u_xlat1.x * 34.0 + 1.0;
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat6.x = u_xlat1.x * 289.0;
    u_xlatb6 = u_xlat6.x>=(-u_xlat6.x);
    u_xlat6.xz = (bool(u_xlatb6)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat1.x = u_xlat6.z * u_xlat1.x;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat1.x = u_xlat1.x * 0.024390243;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat6.x = floor(u_xlat1.y);
    u_xlat4.x = (-u_xlat6.x) + u_xlat1.x;
    u_xlat4.y = abs(u_xlat1.x) + -0.5;
    u_xlat1.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat4.xy;
    u_xlat0.x = dot(u_xlat1.xy, u_xlat0.xy);
    u_xlat5 = u_xlat2.x * 34.0 + 1.0;
    u_xlat5 = u_xlat2.x * u_xlat5;
    u_xlat1.x = u_xlat5 * 289.0;
    u_xlatb1 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.xy = (bool(u_xlatb1)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat5 = u_xlat5 * u_xlat1.y;
    u_xlat5 = fract(u_xlat5);
    u_xlat5 = u_xlat1.x * u_xlat5 + u_xlat2.y;
    u_xlat1.x = u_xlat5 * 34.0 + 1.0;
    u_xlat5 = u_xlat5 * u_xlat1.x;
    u_xlat1.x = u_xlat5 * 289.0;
    u_xlatb1 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.xy = (bool(u_xlatb1)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat5 = u_xlat5 * u_xlat1.y;
    u_xlat5 = fract(u_xlat5);
    u_xlat5 = u_xlat5 * u_xlat1.x;
    u_xlat5 = u_xlat5 * 0.024390243;
    u_xlat5 = fract(u_xlat5);
    u_xlat1.xy = vec2(u_xlat5) * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat5 = floor(u_xlat1.y);
    u_xlat2.x = (-u_xlat5) + u_xlat1.x;
    u_xlat2.y = abs(u_xlat1.x) + -0.5;
    u_xlat5 = dot(u_xlat2.xy, u_xlat2.xy);
    u_xlat5 = inversesqrt(u_xlat5);
    u_xlat1.xy = vec2(u_xlat5) * u_xlat2.xy;
    u_xlat5 = dot(u_xlat1.xy, u_xlat3.xy);
    u_xlat5 = (-u_xlat0.x) + u_xlat5;
    u_xlat0.x = u_xlat12.y * u_xlat5 + u_xlat0.x;
    u_xlat5 = (-u_xlat0.x) + u_xlat11.x;
    u_xlat0.x = u_xlat12.x * u_xlat5 + u_xlat0.x;
    u_xlat5 = max(u_xlat0.x, -0.150000006);
    u_xlat5 = min(u_xlat5, 0.150000006);
    u_xlat5 = u_xlat5 * 6.66666651 + 1.0;
    u_xlat1.x = _TextureScale * _DistortStrength;
    u_xlat0.xz = u_xlat0.xx * u_xlat1.xx + u_xlat0.zw;
    u_xlat16_15 = texture(_Tar, u_xlat0.xz, _GlobalMipBias.x).y;
    u_xlat16_1.xyz = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).xyz;
    u_xlat0.x = u_xlat16_15 + _TextureRamp;
    u_xlat10.xy = vec2(_TextureRamp, _TextureStrength) + vec2(1.0, 1.0);
    u_xlat0.x = u_xlat0.x / u_xlat10.x;
    u_xlat0.x = u_xlat0.x * _TextureStrength;
    u_xlat0.x = u_xlat5 * 0.5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x / u_xlat10.y;
    u_xlat0.xyz = u_xlat0.xxx * (-vec3(vec3(_Darkness, _Darkness, _Darkness))) + vs_INTERP1.xyz;
    u_xlat0.xyz = u_xlat0.xyz * u_xlat16_1.xyz;
    SV_TARGET0.xyz = u_xlat0.xyz;
    SV_TARGET0.w = 1.0;
    return;
}

#endif
         ºu
                         SKINNED_SPRITE  8  #ifdef VERTEX


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
uniform 	vec2 _GlobalMipBias;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM float Xhlslcc_UnusedX_NoiseStrength;
	UNITY_UNIFORM float                _NoiseScale;
	UNITY_UNIFORM float                _DistortStrength;
	UNITY_UNIFORM float                _TextureScale;
	UNITY_UNIFORM float                _TextureStrength;
	UNITY_UNIFORM float                _TextureRamp;
	UNITY_UNIFORM float                _Darkness;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_Tar_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_ST;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_TexelSize;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_MipInfo;
	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MipmapStreaming_DebugTex_StreamInfo;
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
};
#endif
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _Tar;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
vec2 u_xlat1;
mediump vec3 u_xlat16_1;
bool u_xlatb1;
vec4 u_xlat2;
bvec4 u_xlatb2;
vec4 u_xlat3;
bvec4 u_xlatb3;
vec4 u_xlat4;
bvec4 u_xlatb4;
float u_xlat5;
vec3 u_xlat6;
bool u_xlatb6;
vec2 u_xlat10;
vec2 u_xlat11;
vec2 u_xlat12;
bool u_xlatb12;
vec2 u_xlat13;
mediump float u_xlat16_15;
float u_xlat16;
bool u_xlatb16;
void main()
{
    u_xlat0 = vs_INTERP2.xyxy * vec4(_NoiseScale, _NoiseScale, _TextureScale, _TextureScale);
    u_xlat1.xy = floor(u_xlat0.xy);
    u_xlat11.xy = u_xlat1.xy + vec2(1.0, 1.0);
    u_xlat2 = u_xlat11.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb2 = greaterThanEqual(u_xlat2, (-u_xlat2.zwzw));
    u_xlat2.x = (u_xlatb2.x) ? float(289.0) : float(-289.0);
    u_xlat2.y = (u_xlatb2.y) ? float(289.0) : float(-289.0);
    u_xlat2.z = (u_xlatb2.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat2.w = (u_xlatb2.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.zw;
    u_xlat11.xy = fract(u_xlat11.xy);
    u_xlat11.xy = u_xlat11.xy * u_xlat2.xy;
    u_xlat2.x = u_xlat11.x * 34.0 + 1.0;
    u_xlat11.x = u_xlat11.x * u_xlat2.x;
    u_xlat2.x = u_xlat11.x * 289.0;
    u_xlatb2.x = u_xlat2.x>=(-u_xlat2.x);
    u_xlat2.xy = (u_xlatb2.x) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat11.x = u_xlat11.x * u_xlat2.y;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.x = u_xlat2.x * u_xlat11.x + u_xlat11.y;
    u_xlat16 = u_xlat11.x * 34.0 + 1.0;
    u_xlat11.x = u_xlat11.x * u_xlat16;
    u_xlat16 = u_xlat11.x * 289.0;
    u_xlatb16 = u_xlat16>=(-u_xlat16);
    u_xlat2.xy = (bool(u_xlatb16)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat11.x = u_xlat11.x * u_xlat2.y;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.x = u_xlat11.x * u_xlat2.x;
    u_xlat11.x = u_xlat11.x * 0.024390243;
    u_xlat11.x = fract(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat16 = floor(u_xlat11.y);
    u_xlat2.x = (-u_xlat16) + u_xlat11.x;
    u_xlat2.y = abs(u_xlat11.x) + -0.5;
    u_xlat11.x = dot(u_xlat2.xy, u_xlat2.xy);
    u_xlat11.x = inversesqrt(u_xlat11.x);
    u_xlat11.xy = u_xlat11.xx * u_xlat2.xy;
    u_xlat0.xy = fract(u_xlat0.xy);
    u_xlat2.xy = u_xlat0.xy + vec2(-1.0, -1.0);
    u_xlat11.x = dot(u_xlat11.xy, u_xlat2.xy);
    u_xlat2 = u_xlat1.xyxy + vec4(0.0, 1.0, 1.0, 0.0);
    u_xlat3 = u_xlat2 * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb3 = greaterThanEqual(u_xlat3, (-u_xlat3));
    u_xlat4.x = (u_xlatb3.z) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb3.w) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb3.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb3.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.x = (u_xlatb3.x) ? float(289.0) : float(-289.0);
    u_xlat3.y = (u_xlatb3.y) ? float(289.0) : float(-289.0);
    u_xlat3.z = (u_xlatb3.x) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat3.w = (u_xlatb3.y) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat2.zw = u_xlat2.zw * u_xlat4.zw;
    u_xlat2.xy = u_xlat2.xy * u_xlat3.zw;
    u_xlat2 = fract(u_xlat2);
    u_xlat2.xy = u_xlat2.xy * u_xlat3.xy;
    u_xlat12.xy = u_xlat2.zw * u_xlat4.xy;
    u_xlat16 = u_xlat12.x * 34.0 + 1.0;
    u_xlat16 = u_xlat12.x * u_xlat16;
    u_xlat12.x = u_xlat16 * 289.0;
    u_xlatb12 = u_xlat12.x>=(-u_xlat12.x);
    u_xlat3.xy = (bool(u_xlatb12)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16 = u_xlat16 * u_xlat3.y;
    u_xlat16 = fract(u_xlat16);
    u_xlat16 = u_xlat3.x * u_xlat16 + u_xlat12.y;
    u_xlat12.x = u_xlat16 * 34.0 + 1.0;
    u_xlat16 = u_xlat16 * u_xlat12.x;
    u_xlat12.x = u_xlat16 * 289.0;
    u_xlatb12 = u_xlat12.x>=(-u_xlat12.x);
    u_xlat12.xy = (bool(u_xlatb12)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat16 = u_xlat16 * u_xlat12.y;
    u_xlat16 = fract(u_xlat16);
    u_xlat16 = u_xlat16 * u_xlat12.x;
    u_xlat16 = u_xlat16 * 0.024390243;
    u_xlat16 = fract(u_xlat16);
    u_xlat12.xy = vec2(u_xlat16) * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat16 = floor(u_xlat12.y);
    u_xlat3.x = (-u_xlat16) + u_xlat12.x;
    u_xlat3.y = abs(u_xlat12.x) + -0.5;
    u_xlat16 = dot(u_xlat3.xy, u_xlat3.xy);
    u_xlat16 = inversesqrt(u_xlat16);
    u_xlat12.xy = vec2(u_xlat16) * u_xlat3.xy;
    u_xlat3 = u_xlat0.xyxy + vec4(-0.0, -1.0, -1.0, -0.0);
    u_xlat16 = dot(u_xlat12.xy, u_xlat3.zw);
    u_xlat11.x = (-u_xlat16) + u_xlat11.x;
    u_xlat12.xy = u_xlat0.xy * u_xlat0.xy;
    u_xlat12.xy = u_xlat0.xy * u_xlat12.xy;
    u_xlat13.xy = u_xlat0.xy * vec2(6.0, 6.0) + vec2(-15.0, -15.0);
    u_xlat13.xy = u_xlat0.xy * u_xlat13.xy + vec2(10.0, 10.0);
    u_xlat12.xy = u_xlat12.xy * u_xlat13.xy;
    u_xlat11.x = u_xlat12.y * u_xlat11.x + u_xlat16;
    u_xlat4 = u_xlat1.xyxy * vec4(289.0, 289.0, 289.0, 289.0);
    u_xlatb4 = greaterThanEqual(u_xlat4, (-u_xlat4.zwzw));
    u_xlat4.x = (u_xlatb4.x) ? float(289.0) : float(-289.0);
    u_xlat4.y = (u_xlatb4.y) ? float(289.0) : float(-289.0);
    u_xlat4.z = (u_xlatb4.z) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat4.w = (u_xlatb4.w) ? float(0.00346020772) : float(-0.00346020772);
    u_xlat1.xy = u_xlat1.xy * u_xlat4.zw;
    u_xlat1.xy = fract(u_xlat1.xy);
    u_xlat1.xy = u_xlat1.xy * u_xlat4.xy;
    u_xlat16 = u_xlat1.x * 34.0 + 1.0;
    u_xlat1.x = u_xlat1.x * u_xlat16;
    u_xlat16 = u_xlat1.x * 289.0;
    u_xlatb16 = u_xlat16>=(-u_xlat16);
    u_xlat13.xy = (bool(u_xlatb16)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat1.x = u_xlat1.x * u_xlat13.y;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.x = u_xlat13.x * u_xlat1.x + u_xlat1.y;
    u_xlat6.x = u_xlat1.x * 34.0 + 1.0;
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat6.x = u_xlat1.x * 289.0;
    u_xlatb6 = u_xlat6.x>=(-u_xlat6.x);
    u_xlat6.xz = (bool(u_xlatb6)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat1.x = u_xlat6.z * u_xlat1.x;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.x = u_xlat1.x * u_xlat6.x;
    u_xlat1.x = u_xlat1.x * 0.024390243;
    u_xlat1.x = fract(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat6.x = floor(u_xlat1.y);
    u_xlat4.x = (-u_xlat6.x) + u_xlat1.x;
    u_xlat4.y = abs(u_xlat1.x) + -0.5;
    u_xlat1.x = dot(u_xlat4.xy, u_xlat4.xy);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat1.xy = u_xlat1.xx * u_xlat4.xy;
    u_xlat0.x = dot(u_xlat1.xy, u_xlat0.xy);
    u_xlat5 = u_xlat2.x * 34.0 + 1.0;
    u_xlat5 = u_xlat2.x * u_xlat5;
    u_xlat1.x = u_xlat5 * 289.0;
    u_xlatb1 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.xy = (bool(u_xlatb1)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat5 = u_xlat5 * u_xlat1.y;
    u_xlat5 = fract(u_xlat5);
    u_xlat5 = u_xlat1.x * u_xlat5 + u_xlat2.y;
    u_xlat1.x = u_xlat5 * 34.0 + 1.0;
    u_xlat5 = u_xlat5 * u_xlat1.x;
    u_xlat1.x = u_xlat5 * 289.0;
    u_xlatb1 = u_xlat1.x>=(-u_xlat1.x);
    u_xlat1.xy = (bool(u_xlatb1)) ? vec2(289.0, 0.00346020772) : vec2(-289.0, -0.00346020772);
    u_xlat5 = u_xlat5 * u_xlat1.y;
    u_xlat5 = fract(u_xlat5);
    u_xlat5 = u_xlat5 * u_xlat1.x;
    u_xlat5 = u_xlat5 * 0.024390243;
    u_xlat5 = fract(u_xlat5);
    u_xlat1.xy = vec2(u_xlat5) * vec2(2.0, 2.0) + vec2(-1.0, -0.5);
    u_xlat5 = floor(u_xlat1.y);
    u_xlat2.x = (-u_xlat5) + u_xlat1.x;
    u_xlat2.y = abs(u_xlat1.x) + -0.5;
    u_xlat5 = dot(u_xlat2.xy, u_xlat2.xy);
    u_xlat5 = inversesqrt(u_xlat5);
    u_xlat1.xy = vec2(u_xlat5) * u_xlat2.xy;
    u_xlat5 = dot(u_xlat1.xy, u_xlat3.xy);
    u_xlat5 = (-u_xlat0.x) + u_xlat5;
    u_xlat0.x = u_xlat12.y * u_xlat5 + u_xlat0.x;
    u_xlat5 = (-u_xlat0.x) + u_xlat11.x;
    u_xlat0.x = u_xlat12.x * u_xlat5 + u_xlat0.x;
    u_xlat5 = max(u_xlat0.x, -0.150000006);
    u_xlat5 = min(u_xlat5, 0.150000006);
    u_xlat5 = u_xlat5 * 6.66666651 + 1.0;
    u_xlat1.x = _TextureScale * _DistortStrength;
    u_xlat0.xz = u_xlat0.xx * u_xlat1.xx + u_xlat0.zw;
    u_xlat16_15 = texture(_Tar, u_xlat0.xz, _GlobalMipBias.x).y;
    u_xlat16_1.xyz = texture(_MainTex, u_xlat0.xz, _GlobalMipBias.x).xyz;
    u_xlat0.x = u_xlat16_15 + _TextureRamp;
    u_xlat10.xy = vec2(_TextureRamp, _TextureStrength) + vec2(1.0, 1.0);
    u_xlat0.x = u_xlat0.x / u_xlat10.x;
    u_xlat0.x = u_xlat0.x * _TextureStrength;
    u_xlat0.x = u_xlat5 * 0.5 + u_xlat0.x;
    u_xlat0.x = u_xlat0.x / u_xlat10.y;
    u_xlat0.xyz = u_xlat0.xxx * (-vec3(vec3(_Darkness, _Darkness, _Darkness))) + vs_INTERP1.xyz;
    u_xlat0.xyz = u_xlat0.xyz * u_xlat16_1.xyz;
    SV_TARGET0.xyz = u_xlat0.xyz;
    SV_TARGET0.w = 1.0;
    return;
}

#endif
         
