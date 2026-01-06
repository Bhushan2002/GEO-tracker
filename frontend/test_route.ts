const workspaceId = "67756f8f7c5e2a2f8c5b0b2e"; // Sample ID
const promptId = "69f98bb363151dad2763d9b0";

async function testRoute() {
    try {
        const res = await fetch(`http://localhost:3000/api/prompt-analytics/${promptId}`, {
            headers: {
                'x-workspace-id': workspaceId
            }
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response Body (first 100 chars):", text.substring(0, 100));
        if (text.startsWith("{")) {
            console.log("Body JSON:", JSON.parse(text));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testRoute();
