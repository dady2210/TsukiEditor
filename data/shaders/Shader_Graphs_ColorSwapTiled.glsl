// Shader Graphs/ColorSwapTiled
// sacado de sharedassets49.assets
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
uniform 	vec4 _MainTex_ST;
uniform 	vec3 _CameraPosition;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
vec4 u_xlat3;
vec3 u_xlat4;
vec3 u_xlat5;
vec3 u_xlat7;
vec2 u_xlat10;
bool u_xlatb10;
float u_xlat12;
vec2 u_xlat13;
void main()
{
    u_xlat0.xy = _CameraPosition.xy * vec2(-0.0500000007, -0.0500000007) + _MainTex_ST.zw;
    u_xlat10.xy = vs_INTERP0.xy * _MainTex_ST.xy + u_xlat0.xy;
    u_xlat16_1 = texture(_MainTex, u_xlat10.xy, _GlobalMipBias.x);
    u_xlatb10 = u_xlat16_1.w==0.0;
    if(u_xlatb10){discard;}
    u_xlat0.xy = vs_INTERP2.xy * vec2(0.0732600763, 0.0732600763) + u_xlat0.xy;
    u_xlat0.xy = roundEven(u_xlat0.xy);
    u_xlat0.x = dot(u_xlat0.xy, vec2(12.9898005, 78.2330017));
    u_xlat0.x = sin(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * 43758.5469;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat5.xyz = u_xlat0.xxx * vec3(-0.0170933008, -0.126103789, -0.0998969972) + vec3(0.291770697, 0.376262188, 0.366252691);
    u_xlat5.xyz = log2(u_xlat5.xyz);
    u_xlat5.xyz = u_xlat5.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat5.xyz = exp2(u_xlat5.xyz);
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
    u_xlat13.xy = (-u_xlat16_1.yx) + u_xlat2.zz;
    u_xlat4.xy = ceil(u_xlat13.xy);
    u_xlat12 = u_xlat4.y * u_xlat4.x;
    u_xlat13.x = (-u_xlat13.y) + u_xlat13.x;
    u_xlat13.x = abs(u_xlat13.x) * 5.0;
    u_xlat13.x = min(u_xlat13.x, 1.0);
    u_xlat13.x = roundEven(u_xlat13.x);
    u_xlat13.x = (-u_xlat13.x) + 1.0;
    u_xlat2.z = u_xlat12 * u_xlat13.x;
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
    u_xlat7.xy = ceil(u_xlat3.xz);
    u_xlat2.x = u_xlat7.x * u_xlat2.x;
    u_xlat7.xz = floor(u_xlat3.yw);
    u_xlat7.xz = (-u_xlat7.xz) + vec2(1.0, 1.0);
    u_xlat7.x = u_xlat7.y * u_xlat7.x;
    u_xlat2.x = u_xlat7.x * u_xlat2.x;
    u_xlat7.x = u_xlat16_1.z + -0.25;
    u_xlat7.x = ceil(u_xlat7.x);
    u_xlat7.x = u_xlat7.x * u_xlat7.z;
    u_xlat2.x = (-u_xlat2.x) * u_xlat7.x + 1.0;
    u_xlat2.xyz = u_xlat4.xyz * u_xlat2.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat2.xyz = u_xlat2.xyz * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat5.xyz = u_xlat5.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat5.xyz = u_xlat2.xxx * u_xlat5.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat3.xyz = ceil(u_xlat2.xyz);
    u_xlat5.xyz = (-u_xlat16_1.xyz) + u_xlat5.xyz;
    u_xlat5.xyz = u_xlat3.xxx * u_xlat5.xyz + u_xlat16_1.xyz;
    u_xlat4.xyz = u_xlat0.xxx * vec3(-0.207404196, -0.103289798, -0.0545289963) + vec3(0.351532698, 0.262250692, 0.201556295);
    u_xlat4.xyz = log2(u_xlat4.xyz);
    u_xlat4.xyz = u_xlat4.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat4.xyz = exp2(u_xlat4.xyz);
    u_xlat4.xyz = u_xlat4.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat2.xyw = u_xlat2.yyy * u_xlat4.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat2.xyw = (-u_xlat5.xyz) + u_xlat2.xyw;
    u_xlat5.xyz = u_xlat3.yyy * u_xlat2.xyw + u_xlat5.xyz;
    u_xlat2.xyw = u_xlat0.xxx * vec3(-0.189192995, 0.1080672, 0.0377358198) + vec3(0.336843401, 0.245194003, 0.358490586);
    u_xlat2.xyw = log2(u_xlat2.xyw);
    u_xlat2.xyw = u_xlat2.xyw * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat2.xyw = exp2(u_xlat2.xyw);
    u_xlat2.xyw = u_xlat2.xyw * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat2.xyz = u_xlat2.zzz * u_xlat2.xyw + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat2.xyz = (-u_xlat5.xyz) + u_xlat2.xyz;
    u_xlat16_1.xyz = u_xlat3.zzz * u_xlat2.xyz + u_xlat5.xyz;
    u_xlat0 = u_xlat16_1 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
        ºu
                         SKINNED_SPRITE  C%  #ifdef VERTEX


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
uniform 	vec4 _MainTex_ST;
uniform 	vec3 _CameraPosition;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
in highp  vec4 vs_INTERP0;
in highp  vec4 vs_INTERP1;
in highp  vec3 vs_INTERP2;
layout(location = 0) out mediump vec4 SV_TARGET0;
vec4 u_xlat0;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
vec4 u_xlat3;
vec3 u_xlat4;
vec3 u_xlat5;
vec3 u_xlat7;
vec2 u_xlat10;
bool u_xlatb10;
float u_xlat12;
vec2 u_xlat13;
void main()
{
    u_xlat0.xy = _CameraPosition.xy * vec2(-0.0500000007, -0.0500000007) + _MainTex_ST.zw;
    u_xlat10.xy = vs_INTERP0.xy * _MainTex_ST.xy + u_xlat0.xy;
    u_xlat16_1 = texture(_MainTex, u_xlat10.xy, _GlobalMipBias.x);
    u_xlatb10 = u_xlat16_1.w==0.0;
    if(u_xlatb10){discard;}
    u_xlat0.xy = vs_INTERP2.xy * vec2(0.0732600763, 0.0732600763) + u_xlat0.xy;
    u_xlat0.xy = roundEven(u_xlat0.xy);
    u_xlat0.x = dot(u_xlat0.xy, vec2(12.9898005, 78.2330017));
    u_xlat0.x = sin(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * 43758.5469;
    u_xlat0.x = fract(u_xlat0.x);
    u_xlat5.xyz = u_xlat0.xxx * vec3(-0.0170933008, -0.126103789, -0.0998969972) + vec3(0.291770697, 0.376262188, 0.366252691);
    u_xlat5.xyz = log2(u_xlat5.xyz);
    u_xlat5.xyz = u_xlat5.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat5.xyz = exp2(u_xlat5.xyz);
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
    u_xlat13.xy = (-u_xlat16_1.yx) + u_xlat2.zz;
    u_xlat4.xy = ceil(u_xlat13.xy);
    u_xlat12 = u_xlat4.y * u_xlat4.x;
    u_xlat13.x = (-u_xlat13.y) + u_xlat13.x;
    u_xlat13.x = abs(u_xlat13.x) * 5.0;
    u_xlat13.x = min(u_xlat13.x, 1.0);
    u_xlat13.x = roundEven(u_xlat13.x);
    u_xlat13.x = (-u_xlat13.x) + 1.0;
    u_xlat2.z = u_xlat12 * u_xlat13.x;
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
    u_xlat7.xy = ceil(u_xlat3.xz);
    u_xlat2.x = u_xlat7.x * u_xlat2.x;
    u_xlat7.xz = floor(u_xlat3.yw);
    u_xlat7.xz = (-u_xlat7.xz) + vec2(1.0, 1.0);
    u_xlat7.x = u_xlat7.y * u_xlat7.x;
    u_xlat2.x = u_xlat7.x * u_xlat2.x;
    u_xlat7.x = u_xlat16_1.z + -0.25;
    u_xlat7.x = ceil(u_xlat7.x);
    u_xlat7.x = u_xlat7.x * u_xlat7.z;
    u_xlat2.x = (-u_xlat2.x) * u_xlat7.x + 1.0;
    u_xlat2.xyz = u_xlat4.xyz * u_xlat2.xxx + vec3(-0.300000012, -0.300000012, -0.300000012);
    u_xlat2.xyz = u_xlat2.xyz * vec3(1.42857146, 1.42857146, 1.42857146);
    u_xlat5.xyz = u_xlat5.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat5.xyz = u_xlat2.xxx * u_xlat5.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat3.xyz = ceil(u_xlat2.xyz);
    u_xlat5.xyz = (-u_xlat16_1.xyz) + u_xlat5.xyz;
    u_xlat5.xyz = u_xlat3.xxx * u_xlat5.xyz + u_xlat16_1.xyz;
    u_xlat4.xyz = u_xlat0.xxx * vec3(-0.207404196, -0.103289798, -0.0545289963) + vec3(0.351532698, 0.262250692, 0.201556295);
    u_xlat4.xyz = log2(u_xlat4.xyz);
    u_xlat4.xyz = u_xlat4.xyz * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat4.xyz = exp2(u_xlat4.xyz);
    u_xlat4.xyz = u_xlat4.xyz * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat2.xyw = u_xlat2.yyy * u_xlat4.xyz + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat2.xyw = (-u_xlat5.xyz) + u_xlat2.xyw;
    u_xlat5.xyz = u_xlat3.yyy * u_xlat2.xyw + u_xlat5.xyz;
    u_xlat2.xyw = u_xlat0.xxx * vec3(-0.189192995, 0.1080672, 0.0377358198) + vec3(0.336843401, 0.245194003, 0.358490586);
    u_xlat2.xyw = log2(u_xlat2.xyw);
    u_xlat2.xyw = u_xlat2.xyw * vec3(0.416666657, 0.416666657, 0.416666657);
    u_xlat2.xyw = exp2(u_xlat2.xyw);
    u_xlat2.xyw = u_xlat2.xyw * vec3(1.05499995, 1.05499995, 1.05499995) + vec3(-0.355000019, -0.355000019, -0.355000019);
    u_xlat2.xyz = u_xlat2.zzz * u_xlat2.xyw + vec3(0.300000012, 0.300000012, 0.300000012);
    u_xlat2.xyz = (-u_xlat5.xyz) + u_xlat2.xyz;
    u_xlat16_1.xyz = u_xlat3.zzz * u_xlat2.xyz + u_xlat5.xyz;
    u_xlat0 = u_xlat16_1 * vs_INTERP1;
    SV_TARGET0 = u_xlat0;
    return;
}

#endif
        
