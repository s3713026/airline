import { getBankConfig } from '@/helpers/configHelper';
import { BookingModel } from '@/models/bookingModel';
import { EmailService } from '@/services/emailService';
import { IApiResponse } from '@/types/interfaces';
import { Request, Response } from 'express';
export class BookingController {
    private static readonly bookingModel: BookingModel = new BookingModel();

    private static extractDomainFromEmail(email: string): string {
        try {
            return email.split('@')[1];
        } catch (error) {
            console.error('Lỗi khi trích xuất tên miền từ email:', error);
            return '';
        }
    }

    public static async createBooking(req: Request, res: Response): Promise<void> {
        try {
            const bookingData = req.body;
            const result = await BookingController.bookingModel.createBooking(bookingData);
            const bankConfig = await getBankConfig();
            const totalAmount = bookingData.bookingInfo.totalAmount;
            if (result.success && result.bookingCode) {
                try {
                    const { departureFlight, returnFlight, passengers } = bookingData.bookingInfo.selectedFlights;
                    await EmailService.sendBookingConfirmation(
                        bookingData.personalInfo.email,
                        bookingData.personalInfo.fullName,
                        result.bookingCode,
                        bankConfig.name,
                        bankConfig.account,
                        bankConfig.branch,
                        totalAmount,
                        departureFlight,
                        passengers,
                        returnFlight
                    );
                } catch (emailError) {
                    console.error('Lỗi khi gửi email xác nhận:', emailError);
                }
            }

            const response: IApiResponse<{ bookingCode: string }> = {
                success: result.success,
                message: result.success ? 'Đặt vé thành công' : (result.error ?? 'Đặt vé thất bại'),
                data: result.success && result.bookingCode ? { bookingCode: result.bookingCode } : undefined
            };

            res.status(result.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('Lỗi controller khi đặt vé:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                message: 'Lỗi server khi xử lý đặt vé'
            };
            res.status(500).json(errorResponse);
        }
    }

    public static async getBooking(req: Request, res: Response): Promise<void> {
        try {
            const { bookingCode } = req.params;
            const booking = await BookingController.bookingModel.getBookingByCode(bookingCode);

            const response: IApiResponse<any> = {
                success: !!booking,
                data: booking ?? undefined,
                message: !booking ? 'Không tìm thấy thông tin đặt vé' : undefined
            };

            res.status(booking ? 200 : 404).json(response);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin đặt vé:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                message: 'Lỗi server khi lấy thông tin đặt vé'
            };
            res.status(500).json(errorResponse);
        }
    }

    public static async updatePaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const { bookingCode } = req.params;
            const { isPaid } = req.body;

            const success = await BookingController.bookingModel.updatePaymentStatus(bookingCode, isPaid);
            if (success) {
                const booking = await BookingController.bookingModel.getBookingByCode(bookingCode);
                if (booking && isPaid) {
                    await EmailService.sendPaymentConfirmation(
                        booking.email,
                        booking.full_name,
                        bookingCode,
                        booking.total_amount
                    );
                    console.log('Đã gửi email xác nhận thanh toán cho booking:', bookingCode);
                }
            }
            const response: IApiResponse<null> = {
                success,
                message: success
                    ? 'Cập nhật trạng thái thanh toán thành công'
                    : 'Cập nhật trạng thái thanh toán thất bại'
            };

            res.status(success ? 200 : 400).json(response);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                message: 'Lỗi server khi cập nhật trạng thái thanh toán'
            };
            res.status(500).json(errorResponse);
        }
    }

    public static async deleteBooking(req: Request, res: Response): Promise<void> {
        try {
            const { bookingCode } = req.params;
            const success = await BookingController.bookingModel.deleteBooking(bookingCode);

            const response: IApiResponse<null> = {
                success,
                message: success
                    ? 'Xóa đặt vé thành công'
                    : 'Xóa đặt vé thất bại'
            };

            res.status(success ? 200 : 400).json(response);
        } catch (error) {
            console.error('Lỗi khi xóa đặt vé:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                message: 'Lỗi server khi xóa đặt vé'
            };
            res.status(500).json(errorResponse);
        }
    }

    public static async getAllBookings(req: Request, res: Response): Promise<void> {
        try {
            const bookings = await BookingController.bookingModel.getAllBookings();

            const response: IApiResponse<any[]> = {
                success: true,
                data: bookings,
                message: bookings.length ? undefined : 'Không có đặt vé nào'
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đặt vé:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                message: 'Lỗi server khi lấy danh sách đặt vé'
            };
            res.status(500).json(errorResponse);
        }
    }

    private static async handlePaymentUpdate(bookingCode: string, isPaid: boolean) {
        try {
            const success = await BookingController.bookingModel.updatePaymentStatus(bookingCode, isPaid);
            if (success) {
                const booking = await BookingController.bookingModel.getBookingByCode(bookingCode);
                if (booking && isPaid) {
                    await EmailService.sendPaymentConfirmation(
                        booking.email,
                        booking.full_name,
                        bookingCode,
                        booking.total_amount
                    );
                    console.log('Đã gửi email xác nhận thanh toán cho booking:', bookingCode);
                }
            }
            return success;
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
            throw error;
        }
    }
}