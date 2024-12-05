import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/database.js'; 
import routes from './routes/index.js';
import logger from './config/logger.js';



dotenv.config();
connectDB();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];
app.use(
    cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    })
);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api', routes);


app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});


app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status === 500 ? 'An internal error occurred' : err.message;

    logger.error({
        method: req.method,
        url: req.originalUrl,
        message: err.message,
        stack: err.stack,
        status,
    });

    res.status(status).json({ error: message });
});


const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Closing server gracefully...');
    server.close(async () => {
        await mongoose.connection.close();
        console.log('Database connection closed. Server shut down.');
        process.exit(0);
    });
});
