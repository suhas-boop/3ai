async function main() {
    const llmPayload = {
        module: {
            id: "fake-module-id",
            title: "Module 1: Basic Patterns and Syntax",
            objectives: ["Define core tenets", "Identify basic use cases"],
            duration_minutes: 60,
        },
        course_topic: "Dart Language",
        audience: "Beginner",
        tone: "supportive"
    };

    const res = await fetch('http://127.0.0.1:8000/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(llmPayload)
    });

    if (res.ok) {
        const lessonData = await res.json();
        console.log("Slides count:", lessonData.slides?.length);
        console.log("Reading list count:", lessonData.reading_list?.length);
        console.log("Quizzes count:", lessonData.quizzes?.length);
    } else {
        console.error("LLM Generation failed:", res.status, await res.text());
    }
}
main();
