const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: function (origin, callback) {
        // Agar request Postman ya mobile app se aaye (jiska origin nahi hota)
        if (!origin) return callback(null, true);
        
        // Localhost ko aur VERCEL ke kisi bhi URL ko allow karne ki ninja technique
        if (origin === "http://localhost:5173" || origin.includes("vercel.app")) {
            return callback(null, true);
        } else {
            console.log("Blocked by CORS. Origin:", origin); // Render logs me clear dikhega
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true // Cookies allow karne ke liye
}));

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app