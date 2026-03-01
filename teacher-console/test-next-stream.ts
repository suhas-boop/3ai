import { fetch } from 'undici';

async function main() {
    console.log("Starting stream test...");
    try {
        const res = await fetch('http://127.0.0.1:8000/api/tutor/qa/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseTopic: "Python Basics",
                moduleLevel: "Beginner",
                moduleObjectives: "Learn to print",
                slideContext: "Slide: How to print. Code: print('hello')",
                question: "Can you explain this very slowly?",
                chatHistory: [],
                mode: 'local',
                allowWebBrowsing: false
            })
        });

        if (!res.ok) {
            console.error("Fetch failed:", res.status, await res.text());
            return;
        }

        console.log("Headers received!", res.headers.get("Content-Type"));
        
        if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                process.stdout.write(chunk);
            }
        }
        console.log("\n--- Stream Finished ---");
    } catch (e) {
        console.error("Test error:", e);
    }
}
main();
