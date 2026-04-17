module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/app/api/auth/logout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.2_9d8d1bf7a8807769963b5151bd760c41/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.2_9d8d1bf7a8807769963b5151bd760c41/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
;
;
;
async function POST() {
    // 1. Lấy ra cái kho Cookie (chỉ dùng được trên Server)
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_TOKEN_COOKIE"])?.value;
    // 2. Gọi API Backend để invalidate Token (nếu có token)
    if (token) {
        try {
            const baseUrl = process.env.BACKEND_URL || 'http://43.207.156.116';
            const response = await fetch(`${baseUrl}/api/auth/logout?jwt=${token}`, {
                method: 'POST'
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend logout failed with status:", response.status, errorText);
            } else {
                console.log("Backend logout success for token:", token.substring(0, 10) + "...");
            }
        } catch (error) {
            console.error("Backend logout network error:", error);
        }
    }
    // 3. Tiêu diệt Cookie HttpOnly (chứa JWT Token thật)
    cookieStore.set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_TOKEN_COOKIE"], '', {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
    // 4. Tiêu diệt Cookie thường (chứa thông tin User để hiển thị UI)
    cookieStore.set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_USER_COOKIE"], '', {
        httpOnly: false,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$2_9d8d1bf7a8807769963b5151bd760c41$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: true
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f5b8bf26._.js.map