import { db } from "@/config/database";
interface BookingData {
    personalInfo: {
        fullName: string;
        gender: string;
        dateOfBirth: {
            day: string;
            month: string;
            year: string;
        };
        idNumber: string;
        phone: string;
        email: string;
    };
    bookingInfo: {
        selectedFlights: {
            departureFlight: any;
            returnFlight?: any;
            passengers: {
                adults: number;
                children: number;
                infants: number;
            };
            price: {
                adultPrice: number;
                childPrice: number;
                infantPrice: number;
                total: number;
            };
            tripType: 'one-way' | 'round-trip';
        };
        totalAmount: number;
    };
}

export class BookingModel {

    private generateBookingCode(): string {
        const prefix = 'BK';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    async createBooking(bookingData: BookingData): Promise<{ success: boolean; bookingCode?: string; error?: string }> {
        return new Promise((resolve) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                try {
                    const bookingCode = this.generateBookingCode();
                    const dateOfBirth = `${bookingData.personalInfo.dateOfBirth.year}-${bookingData.personalInfo.dateOfBirth.month}-${bookingData.personalInfo.dateOfBirth.day}`;
                    const bookingDate = new Date().toISOString();

                    const { departureFlight, returnFlight } = bookingData.bookingInfo.selectedFlights;
                    const { adults, children, infants } = bookingData.bookingInfo.selectedFlights.passengers;
                    const { adultPrice, childPrice, infantPrice } = bookingData.bookingInfo.selectedFlights.price;

                    db.run(
                        `INSERT INTO booking_history (
                            booking_code, full_name, gender, date_of_birth, id_number,
                            phone, email, trip_type, total_amount, booking_date,
                            departure_flight_id, departure_flight_code, departure_airline,
                            departure_price, departure_duration, departure_from_code,
                            departure_from_name, departure_time, departure_to_code,
                            departure_to_name, departure_arrival_time,
                            return_flight_id, return_flight_code, return_airline,
                            return_price, return_duration, return_from_code,
                            return_from_name, return_time, return_to_code,
                            return_to_name, return_arrival_time,
                            adult_count, child_count, infant_count,
                            adult_price, child_price, infant_price
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            bookingCode,
                            bookingData.personalInfo.fullName,
                            bookingData.personalInfo.gender,
                            dateOfBirth,
                            bookingData.personalInfo.idNumber,
                            bookingData.personalInfo.phone,
                            bookingData.personalInfo.email,
                            bookingData.bookingInfo.selectedFlights.tripType,
                            bookingData.bookingInfo.totalAmount,
                            bookingDate,
                            departureFlight.flightId,
                            departureFlight.flightCode,
                            departureFlight.airline,
                            departureFlight.price,
                            departureFlight.duration,
                            departureFlight.departure.airportCode,
                            departureFlight.departure.airportName,
                            departureFlight.departure.departureTime,
                            departureFlight.arrival.airportCode,
                            departureFlight.arrival.airportName,
                            departureFlight.arrival.arrivalTime,
                            returnFlight?.flightId ?? null,
                            returnFlight?.flightCode ?? null,
                            returnFlight?.airline ?? null,
                            returnFlight?.price ?? null,
                            returnFlight?.duration ?? null,
                            returnFlight?.departure?.airportCode ?? null,
                            returnFlight?.departure?.airportName ?? null,
                            returnFlight?.departure?.departureTime ?? null,
                            returnFlight?.arrival?.airportCode ?? null,
                            returnFlight?.arrival?.airportName ?? null,
                            returnFlight?.arrival?.arrivalTime ?? null,
                            adults,
                            children,
                            infants,
                            adultPrice,
                            childPrice,
                            infantPrice
                        ],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                console.error('Lỗi khi tạo đặt vé:', err);
                                resolve({ success: false, error: 'Lỗi khi tạo đặt vé' });
                            } else {
                                db.run('COMMIT');
                                resolve({ success: true, bookingCode });
                            }
                        }
                    );
                } catch (error) {
                    db.run('ROLLBACK');
                    console.error('Lỗi khi xử lý đặt vé:', error);
                    resolve({ success: false, error: 'Lỗi khi xử lý đặt vé' });
                }
            });
        });
    }

    async getBookingByCode(bookingCode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT
                    email,
                    full_name as customerName,
                    total_amount as totalAmount,
                    booking_code,
                    *
                FROM booking_history
                WHERE booking_code = ?`,
                [bookingCode],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async updatePaymentStatus(bookingCode: string, isPaid: boolean): Promise<boolean> {
        return new Promise((resolve) => {
            db.run(
                'UPDATE booking_history SET is_paid = ? WHERE booking_code = ?',
                [isPaid ? 1 : 0, bookingCode],
                (err) => {
                    if (err) {
                        console.error('Lỗi khi cập nhật trạng thái thanh toán:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    async deleteBooking(bookingCode: string): Promise<boolean> {
        return new Promise((resolve) => {
            db.run('DELETE FROM booking_history WHERE booking_code = ?', [bookingCode], (err) => {
                resolve(!err);
            });
        });
    }

    async getAllBookings(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM booking_history ORDER BY booking_date DESC',
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Lỗi khi lấy danh sách đặt vé:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }
}