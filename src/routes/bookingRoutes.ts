import { BookingController } from '@/controllers/bookingController';
import { requireAuth } from '@/middleware/authMiddleware';
import { Router } from 'express';
const bookingRoutes = Router();

// Tạo đặt vé mới
bookingRoutes.post('/create', BookingController.createBooking);

// Lấy thông tin đặt vé theo mã
bookingRoutes.get('/:bookingCode', BookingController.getBooking);

// Cập nhật trạng thái thanh toán
bookingRoutes.put('/:bookingCode/payment', requireAuth, BookingController.updatePaymentStatus);

// Xóa đặt vé
bookingRoutes.delete('/:bookingCode', requireAuth, BookingController.deleteBooking);

// Lấy tất cả đặt vé
bookingRoutes.get('/', BookingController.getAllBookings);

export default bookingRoutes;
