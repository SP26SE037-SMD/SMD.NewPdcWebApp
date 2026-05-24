const BACKEND_URL = "http://43.207.156.116";

async function run() {
    try {
        const response = await fetch(`${BACKEND_URL}/swagger/v1/swagger.json`);
        const data = await response.json();
        const paths = Object.keys(data.paths || {});
        console.log("ALL PATHS:");
        console.log(paths.filter(p => p.includes("account") || p.includes("request") || p.includes("vp")));
    } catch (err) {
        console.error(err);
    }
}

run();
