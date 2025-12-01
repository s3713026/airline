import { FlightModel } from '@/models/flightModel';
import { IApiResponse, IFlight } from '@/types/interfaces';
import { Request, Response } from 'express';

// Thêm interface cho dữ liệu import
interface ImportFlightData {
  flights: Array<Omit<IFlight, 'flightId'>>;
}

export class FlightController {
    /**
     * Lấy danh sách tất cả các chuyến bay
     */
    public static async getAllFlights(req: Request, res: Response): Promise<void> {
        try {
            const flights = await FlightModel.getAllFlights();
            const response: IApiResponse<IFlight[]> = {
                success: true,
                data: flights,
                message: 'Lấy danh sách chuyến bay thành công'
            };
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách chuyến bay:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                message: 'Đã xảy ra lỗi khi lấy danh sách chuyến bay'
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Lấy thông tin chi tiết một chuyến bay
     */
    public static async getFlightById(req: Request, res: Response): Promise<void> {
        try {
            const flightId = parseInt(req.params.id);

            if (isNaN(flightId)) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'ID không hợp lệ',
                    message: 'ID chuyến bay không hợp lệ'
                };
                res.status(400).json(response);
                return;
            }

            const flight = await FlightModel.getFlightById(flightId);

            if (!flight) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Không tìm thấy',
                    message: 'Không tìm thấy chuyến bay'
                };
                res.status(404).json(response);
                return;
            }

            const response: IApiResponse<IFlight> = {
                success: true,
                data: flight,
                message: 'Lấy thông tin chuyến bay thành công'
            };
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin chuyến bay:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                message: 'Đã xảy ra lỗi khi lấy thông tin chuyến bay'
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Tạo chuyến bay mới
     */
    public static async createFlight(req: Request, res: Response): Promise<void> {
        try {
            const flightData: Omit<IFlight, 'flightId'> = req.body;

            if (!flightData.flightCode || !flightData.airline || !flightData.price || !flightData.duration) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Dữ liệu không đầy đủ',
                    message: 'Thiếu thông tin bắt buộc cho chuyến bay'
                };
                res.status(400).json(response);
                return;
            }

            if (!flightData.departure?.airportCode || !flightData.departure?.departureTime) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Thiếu thông tin sân bay khởi hành',
                    message: 'Thiếu thông tin sân bay khởi hành'
                };
                res.status(400).json(response);
                return;
            }

            if (!flightData.arrival?.airportCode || !flightData.arrival?.arrivalTime) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Thiếu thông tin sân bay đến',
                    message: 'Thiếu thông tin sân bay đến'
                };
                res.status(400).json(response);
                return;
            }

            const newFlight = await FlightModel.createFlight(flightData);

            const response: IApiResponse<IFlight> = {
                success: true,
                data: newFlight,
                message: 'Tạo chuyến bay mới thành công'
            };
            res.status(201).json(response);
        } catch (error) {
            console.error('Lỗi khi tạo chuyến bay mới:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                message: 'Đã xảy ra lỗi khi tạo chuyến bay mới'
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Cập nhật thông tin chuyến bay
     */
    public static async updateFlight(req: Request, res: Response): Promise<void> {
        try {
            const flightId = parseInt(req.params.id);
            const updateData: Partial<IFlight> = req.body;

            if (isNaN(flightId)) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'ID không hợp lệ',
                    message: 'ID chuyến bay không hợp lệ'
                };
                res.status(400).json(response);
                return;
            }

            // Kiểm tra xem chuyến bay có tồn tại không
            const existingFlight = await FlightModel.getFlightById(flightId);
            if (!existingFlight) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Không tìm thấy',
                    message: 'Không tìm thấy chuyến bay'
                };
                res.status(404).json(response);
                return;
            }

            await FlightModel.updateFlight(flightId, updateData);

            const response: IApiResponse<null> = {
                success: true,
                message: 'Cập nhật chuyến bay thành công'
            };
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi cập nhật chuyến bay:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                message: 'Đã xảy ra lỗi khi cập nhật chuyến bay'
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Xóa chuyến bay
     */
    public static async deleteFlight(req: Request, res: Response): Promise<void> {
        try {
            const flightId = parseInt(req.params.id);

            if (isNaN(flightId)) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'ID không hợp lệ',
                    message: 'ID chuyến bay không hợp lệ'
                };
                res.status(400).json(response);
                return;
            }

            // Kiểm tra xem chuyến bay có tồn tại không
            const existingFlight = await FlightModel.getFlightById(flightId);
            if (!existingFlight) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Không tìm thấy',
                    message: 'Không tìm thấy chuyến bay'
                };
                res.status(404).json(response);
                return;
            }

            await FlightModel.deleteFlight(flightId);

            const response: IApiResponse<null> = {
                success: true,
                message: 'Xóa chuyến bay thành công'
            };
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi xóa chuyến bay:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                message: 'Đã xảy ra lỗi khi xóa chuyến bay'
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Import nhiều chuyến bay
     */
    public static async importFlights(req: Request, res: Response): Promise<void> {
        try {
            const { flights } = req.body as ImportFlightData;

            if (!Array.isArray(flights)) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: "Dữ liệu không hợp lệ",
                    message: "Dữ liệu import phải là một mảng các chuyến bay"
                };
                res.status(400).json(response);
                return;
            }

            // Validate dữ liệu đầu vào
            const invalidData = flights.some(flight =>
                !flight.flightCode ||
                !flight.airline ||
                !flight.departure?.airportCode ||
                !flight.arrival?.airportCode
            );

            if (invalidData) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: "Dữ liệu không hợp lệ",
                    message: "Mỗi chuyến bay phải có đầy đủ thông tin cơ bản"
                };
                res.status(400).json(response);
                return;
            }

            // Import dữ liệu
            const results = await Promise.all(
                flights.map(async flight => {
                    return FlightModel.createFlight(flight);
                })
            );

            const response: IApiResponse<{
                importedCount: number;
                flights: IFlight[];
            }> = {
                success: true,
                data: {
                    importedCount: results.length,
                    flights: results
                },
                message: `Import thành công ${results.length} chuyến bay`
            };
            res.status(200).json(response);

        } catch (error) {
            console.error("Lỗi khi import dữ liệu chuyến bay:", error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: "Lỗi khi import dữ liệu",
                message: error instanceof Error ? error.message : "Lỗi không xác định"
            };
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Xóa tất cả chuyến bay
     */
    public static async deleteAllFlights(req: Request, res: Response): Promise<void> {
        try {
            await FlightModel.deleteAllFlights();

            const response: IApiResponse<null> = {
                success: true,
                message: 'Đã xóa tất cả chuyến bay thành công'
            };
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi xóa tất cả chuyến bay:', error);
            const errorResponse: IApiResponse<null> = {
                success: false,
                error: 'Lỗi khi xóa tất cả chuyến bay',
                message: error instanceof Error ? error.message : 'Lỗi không xác định'
            };
            res.status(500).json(errorResponse);
        }
    }

}
