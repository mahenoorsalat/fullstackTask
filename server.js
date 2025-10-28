import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import jobRoutes from './routes/jobRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();    

app.use(cors());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', authRoutes );
app.use('/api/jobs' ,jobRoutes );
app.use('/api/applications' , applicationRoutes)
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});