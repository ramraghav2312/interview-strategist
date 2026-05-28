const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Stable model to prevent 503 errors
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}

async function generatePdfFromHtml(htmlContent) {
    // Puppeteer configured perfectly for Render/Cloud Linux environments
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    })
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", 
        margin: {
            top: "15mm",
            bottom: "15mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        The response must be a JSON object with a single field "html" containing clean, premium HTML code tailored directly to the target description requirements.
                        
                        CRITICAL DESIGN BLUEPRINT DIRECTION:
                        - Do not style with standard or raw primitive colors. Use a high-end corporate palette: Header font primary text #0f172a (Slate Midnight), subtitles and lines #6366f1 (Indigo Indigo Glow), body paragraph copy #334155 (Charcoal Gray).
                        - Embed a clean style block in the head element with the following explicit formatting requirements:
                          * Use standard crisp professional sans-serif system stacks ('Inter', 'Helvetica Neue', Arial).
                          * Keep layout structurally optimized for standard A4 printing matrices with fluid padding blocks.
                          * Sections (Summary, Skills, Work Experience, Projects, Education) must lead with a clean text-transform: uppercase section title coupled with an inline border accent line (#6366f1) beneath them.
                          * Avoid bullet indentation overflow clusters; wrap list objects inside highly padded clean flex elements.
                          * Ensure the HTML contains explicit print directive rules inside the style tag: "@media print { body { -webkit-print-color-adjust: exact; } .project-card { page-break-inside: avoid; } }" to guarantee execution without splitting text frames over margins.
                        
                        CONTENT ARCHITECTURE GUIDELINES:
                        - The tailored experiences must look indistinguishable from real, elite human-written layout copies without generic corporate fluff words or obvious AI generation tells.
                        - Match structural keywords natively so it scores exceptionally high on standard ATS evaluation crawlers.
                        - Enforce strict layout economy constraints. Ensure structural content scales perfectly to fill exactly 1 to 2 crisp pages max without trailing whitespace leakage blocks.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Stable model to prevent 503 errors
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }