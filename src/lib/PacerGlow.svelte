<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { breath } from '$lib/breath.svelte';

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let gl: WebGL2RenderingContext | null = null;
	let program: WebGLProgram | null = null;
	let rafId: number | null = null;
	let uniforms: {
		resolution: WebGLUniformLocation | null;
		time: WebGLUniformLocation | null;
		breath: WebGLUniformLocation | null;
		orbColor: WebGLUniformLocation | null;
		bgColor: WebGLUniformLocation | null;
	} | null = null;

	let { onUnsupported }: { onUnsupported?: () => void } = $props();

	const VERTEX_SRC = `#version 300 es
in vec2 a_position;
void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
}`;

	const FRAGMENT_SRC = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_breath;
uniform vec3 u_orbColor;
uniform vec3 u_bgColor;
out vec4 fragColor;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
	vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
	float dist = length(uv);

	// Subtle noise drift so the orb feels alive, not static.
	float n = noise(uv * 5.0 + u_time * 0.06);
	float warp = (n - 0.5) * 0.014;
	float d = dist + warp;

	float radius = mix(0.16, 0.40, u_breath);

	// Core: bright center, soft edge
	float core = 1.0 - smoothstep(0.0, radius, d);
	core = pow(core, 1.6);

	// Outer bloom: extends ~0.35 beyond the radius
	float bloomRadius = radius + 0.35;
	float bloom = 1.0 - smoothstep(radius, bloomRadius, d);
	bloom = pow(bloom, 2.5) * 0.7;

	vec3 color = u_orbColor * (core * 1.5 + bloom * 0.55);
	color += u_bgColor + uv.y * 0.005;

	fragColor = vec4(color, 1.0);
}`;

	function compile(type: number, source: string): WebGLShader | null {
		if (!gl) return null;
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Shader compile error:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	function setupProgram(): boolean {
		if (!gl) return false;
		const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
		const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
		if (!vs || !fs) return false;
		program = gl.createProgram();
		if (!program) return false;
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Program link error:', gl.getProgramInfoLog(program));
			return false;
		}

		// Fullscreen quad
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW
		);
		const posAttrib = gl.getAttribLocation(program, 'a_position');
		gl.enableVertexAttribArray(posAttrib);
		gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

		uniforms = {
			resolution: gl.getUniformLocation(program, 'u_resolution'),
			time: gl.getUniformLocation(program, 'u_time'),
			breath: gl.getUniformLocation(program, 'u_breath'),
			orbColor: gl.getUniformLocation(program, 'u_orbColor'),
			bgColor: gl.getUniformLocation(program, 'u_bgColor')
		};

		return true;
	}

	function resize() {
		if (!canvasEl || !gl) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const rect = canvasEl.getBoundingClientRect();
		const w = Math.max(1, Math.round(rect.width * dpr));
		const h = Math.max(1, Math.round(rect.height * dpr));
		if (canvasEl.width !== w || canvasEl.height !== h) {
			canvasEl.width = w;
			canvasEl.height = h;
			gl.viewport(0, 0, w, h);
		}
	}

	function easeInOut(t: number): number {
		return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	}

	function breathAmplitude(): number {
		switch (breath.phase) {
			case 'inhale':
				return easeInOut(breath.phaseProgress);
			case 'hold_full':
				return 1.0;
			case 'exhale':
				return 1 - easeInOut(breath.phaseProgress);
			case 'hold_empty':
				return 0.0;
			default:
				return 0.18;
		}
	}

	function render(now: number) {
		if (!gl || !program || !uniforms) return;
		resize();
		const isDark = document.documentElement.classList.contains('dark');
		gl.useProgram(program);
		gl.uniform2f(uniforms.resolution, canvasEl!.width, canvasEl!.height);
		gl.uniform1f(uniforms.time, now * 0.001);
		gl.uniform1f(uniforms.breath, breathAmplitude());
		if (isDark) {
			gl.uniform3f(uniforms.orbColor, 0.32, 0.72, 1.0);
			gl.uniform3f(uniforms.bgColor, 0.01, 0.02, 0.05);
		} else {
			gl.uniform3f(uniforms.orbColor, 0.22, 0.6, 0.95);
			gl.uniform3f(uniforms.bgColor, 0.93, 0.96, 0.99);
		}
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		rafId = requestAnimationFrame(render);
	}

	onMount(() => {
		if (!canvasEl) return;
		gl = canvasEl.getContext('webgl2');
		if (!gl) {
			onUnsupported?.();
			return;
		}
		if (!setupProgram()) {
			onUnsupported?.();
			return;
		}
		rafId = requestAnimationFrame(render);
	});

	onDestroy(() => {
		if (rafId !== null) cancelAnimationFrame(rafId);
	});
</script>

<canvas
	bind:this={canvasEl}
	data-testid="pacer-glow"
	class="aspect-square w-full max-w-[min(360px,55vh)] rounded-3xl"
></canvas>
