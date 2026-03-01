import { generateCourseBackground } from './src/lib/jobs/generate-course';
const courseId = "test-course";
generateCourseBackground(courseId, "Web Development", "Beginners", 1, true);
setTimeout(() => console.log("Done"), 60000);
