import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toggleTaskStatus } from '../services/interview.api'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// UPGRADED: Interactive Road Map Day Component
const RoadMapDay = ({ day, dayIndex, onToggleTask }) => {
    // Check if the completedTasks array exists (for backward compatibility with old reports)
    const completedList = day.completedTasks || [];

    // Calculate progress
    const progress = Math.round((completedList.length / day.tasks.length) * 100) || 0;

    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span className='roadmap-day__badge'>Day {day.day}</span>
                    <h3 className='roadmap-day__focus'>{day.focus}</h3>
                </div>
                {/* Visual Progress Indicator */}
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: progress === 100 ? '#10b981' : '#8b5cf6' }}>
                    {progress}% Complete
                </div>
            </div>

            <ul className='roadmap-day__tasks' style={{ listStyle: 'none', padding: 0 }}>
                {day.tasks.map((task, taskIndex) => {
                    const isCompleted = completedList.includes(taskIndex);

                    return (
                        <li
                            key={taskIndex}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                marginBottom: '12px',
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                transition: 'background-color 0.2s ease'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => onToggleTask(dayIndex, taskIndex)}
                                style={{
                                    marginTop: '4px',
                                    cursor: 'pointer',
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#10b981' // Green checkmark
                                }}
                            />
                            <span style={{
                                color: isCompleted ? '#64748b' : '#f1f5f9',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                lineHeight: '1.5',
                                cursor: 'pointer'
                            }}
                                onClick={() => onToggleTask(dayIndex, taskIndex)}
                            >
                                {task}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { report, setReport, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    // NEW LOCAL UX TRACKING VARIABLE
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    // INTERCEPTOR FUNCTION FOR RESUME DOWNLOAD
    const handleDownloadResume = async () => {
        try {
            setIsDownloadingPdf(true) // Switch local display text loader on
            await getResumePdf(interviewId) // Trigger the backend Puppeteer loop stream
        } catch (err) {
            console.error("PDF generation failed:", err)
        } finally {
            setIsDownloadingPdf(false) // Safely switch back off when file download dialog opens
        }
    }

    const downloadStrategyAsPDF = () => {
        window.print(); // Triggers the browser's native flawless PDF engine
    };

    // ── FIX: DYNAMIC LOADING CONDITIONS INTERCEPTOR ──
    if (isDownloadingPdf) {
        return (
            <main className='loading-screen'>
                <h1 className="highlight">Downloading your optimized resume...</h1>
            </main>
        )
    }

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    // FIXED: Strictly Immutable Optimistic UI Update
    const handleTaskToggle = async (dayIndex, taskIndex) => {
        // 1. Create a DEEP clone of the preparation plan so React knows it changed
        const newPreparationPlan = report.preparationPlan.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day; // Ignore other days

            // Deep clone the specific day
            const newDay = { ...day, completedTasks: [...(day.completedTasks || [])] };

            // Toggle the task
            const taskCompletedIndex = newDay.completedTasks.indexOf(taskIndex);
            if (taskCompletedIndex === -1) {
                newDay.completedTasks.push(taskIndex);
            } else {
                newDay.completedTasks.splice(taskCompletedIndex, 1);
            }

            return newDay;
        });

        // 2. Update the React state instantly (no loading screen!)
        setReport(prev => ({
            ...prev,
            preparationPlan: newPreparationPlan
        }));

        // 3. Send the silent update to the backend
        try {
            await toggleTaskStatus(interviewId, dayIndex, taskIndex);
        } catch (error) {
            console.error("Failed to update task status:", error);
        }
    };

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Updated button target linked to the new handler */}
                    <button
                        onClick={handleDownloadResume}
                        className='button primary-button'
                        style={{ marginBottom: "0.5rem" }}
                    >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>

                    <button
                        onClick={downloadStrategyAsPDF}
                        className='button secondary-button'
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#182038",
                            color: "#f1f5f9",
                            border: "1px solid #222d4a",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            width: "100%"
                        }}
                    >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Export Plan (.PDF)
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day, index) => (
                                    <RoadMapDay
                                        key={day.day}
                                        day={day}
                                        dayIndex={index} // Pass the array index
                                        onToggleTask={handleTaskToggle} // Pass the function we just wrote
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
            {/* ── HIDDEN PRINT LAYOUT (Only visible in PDF) ── */}
                <div className='print-only-layout'>
                    <h1 style={{ borderBottom: "2px solid #000", paddingBottom: "10px" }}>Interview Strategy Plan</h1>
                    <p><strong>Target Role:</strong> {report.title || 'Untitled Position'}</p>
                    <p><strong>Match Score:</strong> {report.matchScore}%</p>
                    <br/>

                    <h2>1. Technical Questions</h2>
                    {report.technicalQuestions.map((q, i) => (
                        <div key={`tech-${i}`} className="print-card">
                            <h3>Q{i + 1}: {q.question}</h3>
                            <p><strong>Intention:</strong> {q.intention}</p>
                            <p><strong>Strategy:</strong> {q.answer}</p>
                        </div>
                    ))}

                    <h2>2. Behavioral Questions</h2>
                    {report.behavioralQuestions.map((q, i) => (
                        <div key={`behav-${i}`} className="print-card">
                            <h3>Q{i + 1}: {q.question}</h3>
                            <p><strong>Intention:</strong> {q.intention}</p>
                            <p><strong>Strategy:</strong> {q.answer}</p>
                        </div>
                    ))}

                    <h2>3. Preparation Roadmap</h2>
                    {report.preparationPlan.map((day, i) => (
                        <div key={`day-${i}`} className="print-card roadmap-print">
                            <h3>Day {day.day}: {day.focus}</h3>
                            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                                {day.tasks.map((task, tIdx) => (
                                    <li key={tIdx} style={{ marginBottom: "8px" }}>
                                        <strong>[{day.completedTasks?.includes(tIdx) ? '✓' : ' '}]</strong> {task}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            {/* Make sure this is pasted right ABOVE the closing </div> of interview-page */}
        </div>
    )
}

export default Interview