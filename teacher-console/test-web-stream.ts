import { PrismaClient } from '@prisma/client'
import { WebAugmentedTutorProvider } from './src/lib/tutors/index'

async function main() {
    const tutor = new WebAugmentedTutorProvider()
    console.log("Testing with allowWebBrowsing: true")
    const res = await tutor.answerQuestion({
        courseTopic: 'Math',
        moduleLevel: 'Beginner',
        moduleObjectives: 'Learn to add',
        slideContext: '1+1=2',
        question: 'Teach me this slide.',
        chatHistory: [],
        allowWebBrowsing: true
    })
    
    if (res instanceof Response) {
        console.log("Got response stream! Reading first chunks...");
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let totalChunk = "";
        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            process.stdout.write(chunk);
            totalChunk += chunk;
            if (totalChunk.length > 50) {
               console.log("... [TRUNCATED]");
               break;
            }
        }
    } else {
        console.log("Got static object:", res);
    }
}
main()
