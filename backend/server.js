import dotenv from 'dotenv'
dotenv.config()

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path' ;
import {fileURLToPath} from 'url'
import connectDB from './config/db.js'
import errorHandler from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import documentRouets from './routes/documentRoutes.js'
import flashCardRoutes from './routes/flashCardRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import { apiLimiter } from './middleware/rateLimiter.js'

//ES6 modile__dirname  altername

const __filename= fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)

// initialize express app

const app=express()


// connect to MongoDB
connectDB()

// MiddleWare to handle CROS
// NOTE: cookies + `credentials: true` require an explicit origin — a
// wildcard '*' is rejected by browsers whenever a request carries cookies.
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods:['GET','POST','PUT','DELETE'],
    allowedHeaders:['Content-Type','Authorization'],
    credentials:true
}))


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

// static folder for upload

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api', apiLimiter)
app.use('/api/auth',authRoutes)
app.use('/api/documents',documentRouets)
app.use('/api/flashcards',flashCardRoutes)
app.use('/api/ai',aiRoutes)
app.use('/api/quizzes',quizRoutes)
app.use('/api/progress',progressRoutes)



// 404 route
app.use((req,res)=>{
    res.status(404).json({
        success:false,
        error:'Route not found',
        statusCode:404
    })
})

app.use(errorHandler)

//start serever
const PORT=process.env.PORT||8000
app.listen(PORT,()=>{
    console.log(`Server running in ${process.env.NODE_ENV} mode  on ${PORT}`)
})

process.on('unhandledRejection',(err)=>{
    console.error(err.message)
    process.exit(1)
})
