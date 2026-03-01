import { generateCourseBackground } from './src/lib/jobs/generate-course';

async function run() {
    console.log("Starting script");
    try {
        await generateCourseBackground("test", "Database Implementation", "Beginners", 1, true);
        console.log("Background function executed, waiting for completion");
    } catch (e) {
        console.error("Error", e);
    }
}

// Keep event loop alive
setInterval(() => {}, 1000);
run();
