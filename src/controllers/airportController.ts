import { AirportModel } from "@/models/airportModel";
import { FlightModel } from "@/models/flightModel";
import {
  IAirport,
  IApiResponse,
  IPricingRule
} from "@/types/interfaces";
import { Request, Response } from "express";

interface ImportAirportData {
  airports: Array<{
    code: string;
    name: string;
  }>;
}

export class AirportController {


  public static async getAirports(req: Request, res: Response): Promise<void> {
    try {
      const airports = await AirportModel.findAll();
      const response: IApiResponse<IAirport[]> = {
        success: true,
        data: airports,
        message: "Lấy danh sách sân bay thành công",
      };
      res.status(200).json(response);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sân bay:", error);
      const response: IApiResponse<null> = {
        success: false,
        error: "Lỗi khi lấy danh sách sân bay",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      };
      res.status(500).json(response);
    }
  }

  public static async getPricingRules(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const rules = await FlightModel.getPricingRules();
      res.status(200).json({
        success: true,
        data: rules,
        message: "Lấy quy tắc tính giá thành công",
      } as IApiResponse<IPricingRule>);
    } catch (error) {
      console.error("Lỗi khi lấy quy tắc tính giá:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi khi lấy quy tắc tính giá",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  public static async updatePricingRules(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const updates = req.body;

      // Validate input
      if (!updates || Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: "Thiếu thông tin cập nhật",
          message: "Vui lòng cung cấp ít nhất một quy tắc tính giá để cập nhật",
        });
        return;
      }

      // Validate each rule if provided
      for (const [type, rule] of Object.entries(updates)) {
        if (
          rule &&
          typeof rule === "object" &&
          "price_multiplier" in rule &&
          (typeof rule.price_multiplier !== "number" ||
            rule.price_multiplier <= 0)
        ) {
          res.status(400).json({
            success: false,
            error: "Hệ số giá không hợp lệ",
            message: `Hệ số giá của ${type} phải là số dương`,
          });
          return;
        }
      }

      const updatedRules = await FlightModel.updatePricingRules(updates);

      res.status(200).json({
        success: true,
        data: updatedRules,
        message: "Cập nhật quy tắc tính giá thành công",
      } as IApiResponse<IPricingRule>);
    } catch (error) {
      console.error("Lỗi khi cập nhật quy tắc tính giá:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi khi cập nhật quy tắc tính giá",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  public static async addAirport(req: Request, res: Response): Promise<void> {
    try {
      const { code, name } = req.body;

      if (!code || !name) {
        const response: IApiResponse<null> = {
          success: false,
          error: "Thiếu thông tin",
          message: "Vui lòng cung cấp đầy đủ mã và tên sân bay",
        };
        res.status(400).json(response);
        return;
      }

      // Kiểm tra mã sân bay đã tồn tại
      const existingAirport = await AirportModel.findByCode(code);
      if (existingAirport) {
        const response: IApiResponse<null> = {
          success: false,
          error: "Mã sân bay đã tồn tại",
          message: "Vui lòng sử dụng mã sân bay khác",
        };
        res.status(400).json(response);
        return;
      }

      const newAirport = await AirportModel.create({ code, name });
      const response: IApiResponse<IAirport> = {
        success: true,
        data: newAirport,
        message: "Thêm sân bay mới thành công",
      };
      res.status(201).json(response);
    } catch (error) {
      console.error("Lỗi khi thêm sân bay mới:", error);
      const response: IApiResponse<null> = {
        success: false,
        error: "Lỗi khi thêm sân bay",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      };
      res.status(500).json(response);
    }
  }

  public static async updateAirport(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const updates = req.body;

      // Validate input
      if (!updates || Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: "Thiếu thông tin cập nhật",
          message: "Vui lòng cung cấp thông tin cần cập nhật",
        });
        return;
      }

      // Kiểm tra sân bay tồn tại
      const existingAirport = await AirportModel.findByCode(code);
      if (!existingAirport) {
        res.status(404).json({
          success: false,
          error: "Không tìm thấy sân bay",
          message: "Mã sân bay không tồn tại trong hệ thống",
        });
        return;
      }

      const updatedAirport = await AirportModel.update(code, updates);
      if (!updatedAirport) {
        const response: IApiResponse<null> = {
          success: false,
          error: "Cập nhật thất bại",
          message: "Không thể cập nhật thông tin sân bay",
        };
        res.status(400).json(response);
        return;
      }

      const response: IApiResponse<IAirport> = {
        success: true,
        data: updatedAirport,
        message: "Cập nhật thông tin sân bay thành công",
      };
      res.status(200).json(response);
    } catch (error) {
      console.error("Lỗi khi cập nhật sân bay:", error);
      const response: IApiResponse<null> = {
        success: false,
        error: "Lỗi khi cập nhật sân bay",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      };
      res.status(500).json(response);
    }
  }

  public static async deleteAirport(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      // Kiểm tra sân bay tồn tại
      const existingAirport = await AirportModel.findByCode(code);
      if (!existingAirport) {
        res.status(404).json({
          success: false,
          error: "Không tìm thấy sân bay",
          message: "Mã sân bay không tồn tại trong hệ thống",
        });
        return;
      }

      // Kiểm tra sân bay có đang được sử dụng trong chuyến bay
      const isUsed = await FlightModel.isAirportInUse(code);
      if (isUsed) {
        res.status(400).json({
          success: false,
          error: "Không thể xóa sân bay",
          message: "Sân bay đang được sử dụng trong các chuyến bay",
        });
        return;
      }

      await AirportModel.delete(code);
      const response: IApiResponse<null> = {
        success: true,
        message: "Xóa sân bay thành công",
      };
      res.status(200).json(response);
    } catch (error) {
      console.error("Lỗi khi xóa sân bay:", error);
      const response: IApiResponse<null> = {
        success: false,
        error: "Lỗi khi xóa sân bay",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      };
      res.status(500).json(response);
    }
  }

  public static async importAirports(req: Request, res: Response): Promise<void> {
    try {
      const { airports } = req.body as ImportAirportData;

      if (!Array.isArray(airports)) {
        res.status(400).json({
          success: false,
          error: "Dữ liệu không hợp lệ",
          message: "Dữ liệu import phải là một mảng các sân bay",
        });
        return;
      }

      // Validate dữ liệu đầu vào
      const invalidData = airports.some(airport => !airport.code || !airport.name);
      if (invalidData) {
        res.status(400).json({
          success: false,
          error: "Dữ liệu không hợp lệ",
          message: "Mỗi sân bay phải có đầy đủ mã (code) và tên (name)",
        });
        return;
      }

      // Import hoặc cập nhật dữ liệu
      const results = await Promise.all(
        airports.map(async airport => {
          const existing = await AirportModel.findByCode(airport.code);
          if (existing) {
            // Cập nhật nếu đã tồn tại
            return AirportModel.update(airport.code, { name: airport.name });
          } else {
            // Thêm mới nếu chưa tồn tại
            return AirportModel.create(airport);
          }
        })
      );

      const importedAirports = results.filter((result): result is IAirport => result !== null);

      const response: IApiResponse<{
        importedCount: number;
        airports: IAirport[];
      }> = {
        success: true,
        data: {
          importedCount: importedAirports.length,
          airports: importedAirports,
        },
        message: `Import thành công ${importedAirports.length} sân bay`,
      };
      res.status(200).json(response);

    } catch (error) {
      console.error("Lỗi khi import dữ liệu sân bay:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi khi import dữ liệu",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  public static async deleteAllAirports(req: Request, res: Response): Promise<void> {
    try {
      // Kiểm tra xem có sân bay nào đang được sử dụng
      const airports = await AirportModel.findAll();
      for (const airport of airports) {
        const isUsed = await FlightModel.isAirportInUse(airport.code);
        if (isUsed) {
          res.status(400).json({
            success: false,
            error: "Không thể xóa tất cả sân bay",
            message: "Có sân bay đang được sử dụng trong các chuyến bay",
          });
          return;
        }
      }

      // Thực hiện xóa tất cả sân bay
      const result = await AirportModel.deleteAll();

      if (result) {
        res.status(200).json({
          success: true,
          message: "Đã xóa tất cả sân bay thành công",
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Không có sân bay nào để xóa",
          message: "Danh sách sân bay đã trống",
        });
      }
    } catch (error) {
      console.error("Lỗi khi xóa tất cả sân bay:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi khi xóa tất cả sân bay",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }
}
