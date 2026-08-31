import { Ziggy } from './ziggy';

declare global {
    // eslint-disable-next-line no-var
    var Ziggy: typeof import('./ziggy').Ziggy | undefined;
}

// During SSR (and the Vite dev server's SSR module-graph warm-up), our entry
// module is evaluated in Node — there's no `<script>` tag from the `@routes`
// Blade directive to define the global `Ziggy` config, so any top-level
// `route(...)` call (e.g. in app-sidebar.tsx) crashes with "Cannot read
// properties of undefined". Seed a fallback from the build-time generated
// config so `route()` always has something to read from.
//
// This must be the FIRST import in app.tsx: ES module imports are evaluated
// depth-first in source order before any of the importing module's own
// top-level code runs, so if this ran after other imports (e.g. the layout
// imports that pull in app-sidebar.tsx, which calls `route()` at module
// scope), it would already be too late.
if (typeof globalThis.Ziggy === 'undefined') {
    globalThis.Ziggy = Ziggy;
}
