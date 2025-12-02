import 'module-alias/register';
import { AirlineController } from '@/controllers/airlineController';
import adminRoutes from '@/routes/adminRoutes';
import airlineRoutes from '@/routes/airlineRoutes';
import bookingRoutes from '@/routes/bookingRoutes';
import companyRoutes from '@/routes/companyRoutes';
import configRoutes from '@/routes/configRoutes';
import contactRoutes from '@/routes/contactRoutes';
import flightRoutes from '@/routes/flightRoutes';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';

declare module 'express-session' {
    interface SessionData {
        user?: {
            username: string;
            isAuthenticated: boolean;
        };
    }
}

const app = express();
const PORT = process.env.PORT ?? 8080;

// Khởi tạo thư mục uploads
AirlineController.initializeUploadDirectories()
    .then(() => console.log('Khởi tạo thư mục uploads thành công'))
    .catch((error) => console.error('Lỗi khởi tạo thư mục uploads:', error));

// Middleware
app.use(helmet());
app.use(express.static('public'));
app.use(express.json());

// CORS setup cho dev + production
const allowedOrigins = [
    'http://localhost:5173',              // dev
    'https://vietjetair-cee.web.app'     // production frontend
];

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like curl, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Session configuration
app.use(
    session({
        secret: 'ovftank', // Change this to a secure secret
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'none',      // cross-domain cookie
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/config', configRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Error handling
app.use(
    (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        res.status(500).json({
            success: false,
            error: 'Lỗi không xác định',
            message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
        next(err);
    }
);

app.listen(PORT, () => {
    console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
});
