const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    let resumeContentText = "";

    // Safely check if a file exists, then parse it and extract ONLY the text string
    if (req.file && req.file.buffer) {
        const parsedPdf = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        resumeContentText = parsedPdf.text; // <-- THIS IS THE FIX
    }

    const { selfDescription, jobDescription } = req.body;

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContentText,
        selfDescription,
        jobDescription
    });

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContentText,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    });

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    });
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const { search } = req.query
    let query = { user: req.user.id }

    if (search) {
        query.title = { $regex: search, $options: 'i' }
    }

    const interviewReports = await interviewReportModel.find(query).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
 * @description Controller to toggle the completion status of a specific task in the preparation plan.
 */
async function toggleTaskCompletionController(req, res) {
    const { interviewId } = req.params;
    const { dayIndex, taskIndex } = req.body;

    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!report) {
        return res.status(404).json({ message: "Interview report not found." });
    }

    const dayPlan = report.preparationPlan[dayIndex];
    if (!dayPlan) {
        return res.status(400).json({ message: "Invalid day index." });
    }

    // Check if the task index is already in our completed array
    const taskCompletedIndex = dayPlan.completedTasks.indexOf(taskIndex);

    if (taskCompletedIndex === -1) {
        // Task is NOT completed yet, so add the index to mark it as done
        dayPlan.completedTasks.push(taskIndex);
    } else {
        // Task IS completed, so user is un-checking it. Remove the index.
        dayPlan.completedTasks.splice(taskCompletedIndex, 1);
    }

    // Tell Mongoose this specific array changed, then save to Database
    report.markModified(`preparationPlan.${dayIndex}.completedTasks`);
    await report.save();

    res.status(200).json({
        message: "Task status updated successfully.",
        preparationPlan: report.preparationPlan
    });
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, toggleTaskCompletionController }