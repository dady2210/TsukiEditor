// Shader Graphs/LineworkDodge
// sacado de b90f3e2f9605749a093914f5e13ecc71
// declara: White, _BlueChannel, _GreenChannel, _MainTex, _RedChannel, unity_Lightmaps, unity_LightmapsInd, unity_ShadowMasks


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
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _RedChannel;
	UNITY_UNIFORM vec4                _BlueChannel;
	UNITY_UNIFORM vec4                _GreenChannel;
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
mediump vec4 u_xlat16_0;
vec4 u_xlat1;
bool u_xlatb1;
vec4 u_xlat2;
vec3 u_xlat3;
vec3 u_xlat4;
vec3 u_xlat5;
vec3 u_xlat7;
float u_xlat13;
vec2 u_xlat14;
void main()
{
    u_xlat16_0 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlatb1 = u_xlat16_0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat1 = u_xlat16_0.xyzx + vec4(-0.100000001, -0.100000001, -0.100000001, 0.649999976);
    u_xlat2 = (-u_xlat16_0.yzxz) + u_xlat1.xxyy;
    u_xlat1.xy = (-u_xlat2.yw) + u_xlat2.xz;
    u_xlat1.xy = abs(u_xlat1.xy) * vec2(5.0, 5.0);
    u_xlat1.xy = min(u_xlat1.xy, vec2(1.0, 1.0));
    u_xlat1.xy = roundEven(u_xlat1.xy);
    u_xlat1.xy = (-u_xlat1.xy) + vec2(1.0, 1.0);
    u_xlat2 = ceil(u_xlat2);
    u_xlat2.xy = u_xlat2.yw * u_xlat2.xz;
    u_xlat1.xy = u_xlat1.xy * u_xlat2.xy;
    u_xlat14.xy = (-u_xlat16_0.yx) + u_xlat1.zz;
    u_xlat3.xy = ceil(u_xlat14.xy);
    u_xlat13 = u_xlat3.y * u_xlat3.x;
    u_xlat14.x = (-u_xlat14.y) + u_xlat14.x;
    u_xlat14.x = abs(u_xlat14.x) * 5.0;
    u_xlat14.x = min(u_xlat14.x, 1.0);
    u_xlat14.x = roundEven(u_xlat14.x);
    u_xlat14.x = (-u_xlat14.x) + 1.0;
    u_xlat1.z = u_xlat13 * u_xlat14.x;
    u_xlat2.xyz = u_xlat16_0.xyz * u_xlat1.xyz;
    u_xlat1.xy = u_xlat16_0.xy * u_xlat1.xy + vec2(-0.300000012, -0.300000012);
    u_xlat1.xy = ceil(u_xlat1.xy);
    u_xlat3.xz = u_xlat1.xy * u_xlat2.xy;
    u_xlat1.x = u_xlat16_0.z * u_xlat1.z + -0.300000012;
    u_xlat1.x = ceil(u_xlat1.x);
    u_xlat3.y = u_xlat1.x * u_xlat2.z;
    u_xlat1.x = floor(u_xlat1.w);
    u_xlat1.x = (-u_xlat1.x) + 1.0;
    u_xlat2 = u_xlat16_0.xyyz + vec4(-0.25, 0.649999976, -0.25, 0.649999976);
    u_xlat7.xy = ceil(u_xlat2.xz);
    u_xlat1.x = u_xlat7.x * u_xlat1.x;
    u_xlat7.xz = floor(u_xlat2.yw);
    u_xlat7.xz = (-u_xlat7.xz) + vec2(1.0, 1.0);
    u_xlat7.x = u_xlat7.y * u_xlat7.x;
    u_xlat1.x = u_xlat7.x * u_xlat1.x;
    u_xlat2 = u_xlat16_0.zxyz + vec4(-0.25, -0.699999988, -0.699999988, -0.699999988);
    u_xlat2 = ceil(u_xlat2);
    u_xlat7.x = u_xlat7.z * u_xlat2.x;
    u_xlat1.x = (-u_xlat1.x) * u_xlat7.x + 1.0;
    u_xlat1.xyz = u_xlat3.xyz * u_xlat1.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat1.xyz = u_xlat1.xyz * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat3.xyz = (-u_xlat16_0.zzy) + u_xlat16_0.yxx;
    u_xlat3.xyz = abs(u_xlat3.xyz) * vec3(10.0, 10.0, 10.0);
    u_xlat3.xyz = roundEven(u_xlat3.xyz);
    u_xlat3.xyz = min(u_xlat3.xyz, vec3(1.0, 1.0, 1.0));
    u_xlat3.xyz = (-u_xlat3.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat3.xyz = u_xlat16_0.yzx * u_xlat3.xyz;
    u_xlat2.xyz = u_xlat2.yzw * u_xlat3.xyz;
    u_xlat3.xyz = _RedChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat3.xyz = u_xlat1.xxx * u_xlat3.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat4.xyz = (-u_xlat3.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat3.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat3.xyz;
    u_xlat4.xyz = ceil(u_xlat1.xyz);
    u_xlat3.xyz = (-u_xlat16_0.xyz) + u_xlat3.xyz;
    u_xlat3.xyz = u_xlat4.xxx * u_xlat3.xyz + u_xlat16_0.xyz;
    u_xlat5.xyz = _BlueChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat1.xyw = u_xlat1.yyy * u_xlat5.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat5.xyz = (-u_xlat1.xyw) + vec3(1.0, 1.0, 1.0);
    u_xlat1.xyw = u_xlat2.zzz * u_xlat5.xyz + u_xlat1.xyw;
    u_xlat1.xyw = (-u_xlat3.xyz) + u_xlat1.xyw;
    u_xlat1.xyw = u_xlat4.yyy * u_xlat1.xyw + u_xlat3.xyz;
    u_xlat2.xzw = _GreenChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat2.xzw = u_xlat1.zzz * u_xlat2.xzw + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat3.xyz = (-u_xlat2.xzw) + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat2.yyy * u_xlat3.xyz + u_xlat2.xzw;
    u_xlat2.xyz = (-u_xlat1.xyw) + u_xlat2.xyz;
    u_xlat16_0.xyz = u_xlat4.zzz * u_xlat2.xyz + u_xlat1.xyw;
    u_xlat0 = u_xlat16_0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
       ºu
                         SKINNED_SPRITE  ä$  #ifdef VERTEX


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
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
UNITY_BINDING(0) uniform UnityPerMaterial {
#endif
	UNITY_UNIFORM vec4 Xhlslcc_UnusedX_MainTex_TexelSize;
	UNITY_UNIFORM vec4                _RedChannel;
	UNITY_UNIFORM vec4                _BlueChannel;
	UNITY_UNIFORM vec4                _GreenChannel;
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
mediump vec4 u_xlat16_0;
vec4 u_xlat1;
bool u_xlatb1;
vec4 u_xlat2;
vec3 u_xlat3;
vec3 u_xlat4;
vec3 u_xlat5;
vec3 u_xlat7;
float u_xlat13;
vec2 u_xlat14;
void main()
{
    u_xlat16_0 = texture(_MainTex, vs_INTERP0.xy, _GlobalMipBias.x);
    u_xlatb1 = u_xlat16_0.w==0.0;
    if(u_xlatb1){discard;}
    u_xlat1 = u_xlat16_0.xyzx + vec4(-0.100000001, -0.100000001, -0.100000001, 0.649999976);
    u_xlat2 = (-u_xlat16_0.yzxz) + u_xlat1.xxyy;
    u_xlat1.xy = (-u_xlat2.yw) + u_xlat2.xz;
    u_xlat1.xy = abs(u_xlat1.xy) * vec2(5.0, 5.0);
    u_xlat1.xy = min(u_xlat1.xy, vec2(1.0, 1.0));
    u_xlat1.xy = roundEven(u_xlat1.xy);
    u_xlat1.xy = (-u_xlat1.xy) + vec2(1.0, 1.0);
    u_xlat2 = ceil(u_xlat2);
    u_xlat2.xy = u_xlat2.yw * u_xlat2.xz;
    u_xlat1.xy = u_xlat1.xy * u_xlat2.xy;
    u_xlat14.xy = (-u_xlat16_0.yx) + u_xlat1.zz;
    u_xlat3.xy = ceil(u_xlat14.xy);
    u_xlat13 = u_xlat3.y * u_xlat3.x;
    u_xlat14.x = (-u_xlat14.y) + u_xlat14.x;
    u_xlat14.x = abs(u_xlat14.x) * 5.0;
    u_xlat14.x = min(u_xlat14.x, 1.0);
    u_xlat14.x = roundEven(u_xlat14.x);
    u_xlat14.x = (-u_xlat14.x) + 1.0;
    u_xlat1.z = u_xlat13 * u_xlat14.x;
    u_xlat2.xyz = u_xlat16_0.xyz * u_xlat1.xyz;
    u_xlat1.xy = u_xlat16_0.xy * u_xlat1.xy + vec2(-0.300000012, -0.300000012);
    u_xlat1.xy = ceil(u_xlat1.xy);
    u_xlat3.xz = u_xlat1.xy * u_xlat2.xy;
    u_xlat1.x = u_xlat16_0.z * u_xlat1.z + -0.300000012;
    u_xlat1.x = ceil(u_xlat1.x);
    u_xlat3.y = u_xlat1.x * u_xlat2.z;
    u_xlat1.x = floor(u_xlat1.w);
    u_xlat1.x = (-u_xlat1.x) + 1.0;
    u_xlat2 = u_xlat16_0.xyyz + vec4(-0.25, 0.649999976, -0.25, 0.649999976);
    u_xlat7.xy = ceil(u_xlat2.xz);
    u_xlat1.x = u_xlat7.x * u_xlat1.x;
    u_xlat7.xz = floor(u_xlat2.yw);
    u_xlat7.xz = (-u_xlat7.xz) + vec2(1.0, 1.0);
    u_xlat7.x = u_xlat7.y * u_xlat7.x;
    u_xlat1.x = u_xlat7.x * u_xlat1.x;
    u_xlat2 = u_xlat16_0.zxyz + vec4(-0.25, -0.699999988, -0.699999988, -0.699999988);
    u_xlat2 = ceil(u_xlat2);
    u_xlat7.x = u_xlat7.z * u_xlat2.x;
    u_xlat1.x = (-u_xlat1.x) * u_xlat7.x + 1.0;
    u_xlat1.xyz = u_xlat3.xyz * u_xlat1.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat1.xyz = u_xlat1.xyz * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat3.xyz = (-u_xlat16_0.zzy) + u_xlat16_0.yxx;
    u_xlat3.xyz = abs(u_xlat3.xyz) * vec3(10.0, 10.0, 10.0);
    u_xlat3.xyz = roundEven(u_xlat3.xyz);
    u_xlat3.xyz = min(u_xlat3.xyz, vec3(1.0, 1.0, 1.0));
    u_xlat3.xyz = (-u_xlat3.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat3.xyz = u_xlat16_0.yzx * u_xlat3.xyz;
    u_xlat2.xyz = u_xlat2.yzw * u_xlat3.xyz;
    u_xlat3.xyz = _RedChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat3.xyz = u_xlat1.xxx * u_xlat3.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat4.xyz = (-u_xlat3.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat3.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat3.xyz;
    u_xlat4.xyz = ceil(u_xlat1.xyz);
    u_xlat3.xyz = (-u_xlat16_0.xyz) + u_xlat3.xyz;
    u_xlat3.xyz = u_xlat4.xxx * u_xlat3.xyz + u_xlat16_0.xyz;
    u_xlat5.xyz = _BlueChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat1.xyw = u_xlat1.yyy * u_xlat5.xyz + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat5.xyz = (-u_xlat1.xyw) + vec3(1.0, 1.0, 1.0);
    u_xlat1.xyw = u_xlat2.zzz * u_xlat5.xyz + u_xlat1.xyw;
    u_xlat1.xyw = (-u_xlat3.xyz) + u_xlat1.xyw;
    u_xlat1.xyw = u_xlat4.yyy * u_xlat1.xyw + u_xlat3.xyz;
    u_xlat2.xzw = _GreenChannel.xyz + vec3(-0.313725501, -0.313725501, -0.313725501);
    u_xlat2.xzw = u_xlat1.zzz * u_xlat2.xzw + vec3(0.313725501, 0.313725501, 0.313725501);
    u_xlat3.xyz = (-u_xlat2.xzw) + vec3(1.0, 1.0, 1.0);
    u_xlat2.xyz = u_xlat2.yyy * u_xlat3.xyz + u_xlat2.xzw;
    u_xlat2.xyz = (-u_xlat1.xyw) + u_xlat2.xyz;
    u_xlat16_0.xyz = u_xlat4.zzz * u_xlat2.xyz + u_xlat1.xyw;
    u_xlat0 = u_xlat16_0 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
       
