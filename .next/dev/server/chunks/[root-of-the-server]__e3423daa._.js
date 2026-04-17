module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Central type definitions and constants for Auth.
// Backend response types from: http://43.207.156.116:8080/api/auth/login
// export interface Permission {
//     permissionId: string;
//     permissionName: string;
//     description: string;
//     createdAt: string;
// }
// export interface Role {
//     roleId: string;
//     roleName: string;
//     description: string;
//     permissions: Permission[];
//     createdAt: string;
// }
__turbopack_context__.s([
    "AUTH_TOKEN_COOKIE",
    ()=>AUTH_TOKEN_COOKIE,
    "AUTH_USER_COOKIE",
    ()=>AUTH_USER_COOKIE,
    "ROLE_PATHS",
    ()=>ROLE_PATHS,
    "accountToUser",
    ()=>accountToUser,
    "introspectToken",
    ()=>introspectToken
]);
const AUTH_TOKEN_COOKIE = "smd-token"; // HttpOnly — stores JWT
const AUTH_USER_COOKIE = "smd-user"; // Regular — stores user info for UI
const ROLE_PATHS = {
    PDCM: "pdcm",
    HOPDC: "hopdc",
    HOCFDC: "hocfdc",
    VP: "vice-principal",
    COLLABORATOR: "collaborator"
};
function accountToUser(account) {
    // Extract role as a string, handling both string and object formats
    let roleString = "";
    if (typeof account.role === "string") {
        roleString = account.role;
    } else if (account.role && typeof account.role === "object") {
        roleString = account.role.roleName || account.role.roleId || "";
    }
    return {
        id: account.accountId,
        accountId: account.accountId,
        email: account.email,
        fullName: account.fullName,
        role: roleString,
        departmentId: account.departmentId
    };
}
async function introspectToken(token) {
    try {
        const BACKEND_URL = process.env.BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/introspect?token=${token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.data === true;
    } catch (error) {
        console.error("Introspection Error:", error);
        return false;
    }
}
}),
"[project]/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.2_9d8d1bf7a8807769963b5151bd760c41/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [middleware] (ecmascript)");
;
;
function getUserFromCookie(request) {
    const userCookie = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["AUTH_USER_COOKIE"])?.value;
    if (!userCookie) return null;
    try {
        return JSON.parse(decodeURIComponent(userCookie));
    } catch  {
        return null;
    }
}
async function proxy(request) {
    const { pathname } = request.nextUrl;
    const user = getUserFromCookie(request);
    const token = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["AUTH_TOKEN_COOKIE"])?.value;
    // 1. Dashboard access check
    if (pathname.startsWith('/dashboard')) {
        // No user or no token -> redirect to login
        if (!user || !token) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', request.url));
        }
        // Token exists -> VALIDATE with backend
        const isValid = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["introspectToken"])(token);
        if (!isValid) {
            console.warn(`[Proxy] Invalid token for ${user.email}. Redirecting to login.`);
            const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', request.url));
            // Clear invalid session cookies
            response.cookies.delete(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["AUTH_TOKEN_COOKIE"]);
            response.cookies.delete(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["AUTH_USER_COOKIE"]);
            return response;
        }
    }
    // 2. Already logged in but accessing /login -> redirect to their dashboard
    if (pathname.startsWith('/login') && user && token) {
        // Even for login, we should probably check if token is still valid if we want to skip login
        const isValid = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["introspectToken"])(token);
        if (isValid) {
            const targetPath = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["ROLE_PATHS"][user.role] || '/';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/dashboard/' + targetPath, request.url));
        }
    }
    // 3. RBAC: Check if user's role matches the dashboard sub-path
    if (pathname.startsWith('/dashboard/') && user) {
        const requiredSegment = pathname.split('/')[2]; // 'pdcm', 'hopdc', etc.
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["ROLE_PATHS"][user.role] !== requiredSegment) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/dashboard/' + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["ROLE_PATHS"][user.role], request.url));
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        '/dashboard/:path*',
        '/login'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e3423daa._.js.map