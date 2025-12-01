import { AirlineModel } from '@/models/airlineModel';
import { RequestWithFile } from '@/types/express';
import { IAirline, IApiResponse } from '@/types/interfaces';
import { Request, Response } from 'express';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';

interface ImportAirlineData {
  airlines: Array<{
    name: string;
    logoUrl: string;
  }>;
}

export class AirlineController {
  public static async initializeUploadDirectories(): Promise<void> {
    const publicDir = path.join(process.cwd(), 'public');
    const uploadDir = path.join(publicDir, 'uploads', 'airlines');

    try {
      await fsPromises.mkdir(publicDir, { recursive: true });
      await fsPromises.mkdir(uploadDir, { recursive: true });
      console.log('Đã tạo thư mục uploads thành công');
    } catch (error) {
      console.error('Lỗi khi tạo thư mục uploads:', error);
    }
  }

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const airlines = await AirlineModel.getAll();
      const response: IApiResponse<IAirline[]> = {
        success: true,
        data: airlines,
        message: 'Lấy danh sách hãng hàng không thành công'
      };
      res.json(response);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hãng hàng không:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy danh sách hãng hàng không',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      });
    }
  }

  public static async getByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const airline = await AirlineModel.getByName(name);

      if (!airline) {
        const notFoundResponse: IApiResponse<null> = {
          success: false,
          error: 'Không tìm thấy hãng hàng không',
          message: `Không tìm thấy hãng hàng không với tên ${name}`
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const response: IApiResponse<IAirline> = {
        success: true,
        data: airline,
        message: 'Lấy thông tin hãng hàng không thành công'
      };
      res.json(response);
    } catch (error) {
      const errorResponse: IApiResponse<null> = {
        success: false,
        error: 'Lỗi khi lấy thông tin hãng hàng không',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
      res.status(500).json(errorResponse);
    }
  }

  public static async create(req: RequestWithFile, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      const file = req.file;

      console.log('File từ multer:', file);

      if (!name || !file) {
        res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          message: 'Tên và logo không được để trống'
        });
        return;
      }

      // Tạo đường dẫn đầy đủ đến thư mục public và uploads
      const publicDir = path.join(process.cwd(), 'public');
      const uploadDir = path.join(publicDir, 'uploads', 'airlines');

      console.log('Đường dẫn thư mục:', { publicDir, uploadDir });

      // Đảm bảo cả hai thư mục đều tồn tại
      await fsPromises.mkdir(publicDir, { recursive: true });
      await fsPromises.mkdir(uploadDir, { recursive: true });

      // Kiểm tra xem file tạm có tồn tại không
      if (file.path && fs.existsSync(file.path)) {
        // Copy file từ vị trí tạm thời đến thư mục đích
        const targetPath = path.join(uploadDir, file.filename);
        await fsPromises.copyFile(file.path, targetPath);
        console.log('File đã được copy thành công:', targetPath);
      } else {
        throw new Error('Không tìm thấy file tạm thời');
      }

      // Tạo URL cho ảnh đã upload
      const logoUrl = `/uploads/airlines/${file.filename}`;

      const airline: IAirline = { name, logoUrl };
      await AirlineModel.create(airline);

      const response: IApiResponse<IAirline> = {
        success: true,
        data: airline,
        message: 'Tạo hãng hàng không mới thành công'
      };
      res.status(201).json(response);
    } catch (error) {
      const errorResponse: IApiResponse<null> = {
        success: false,
        error: 'Lỗi khi tạo hãng hàng không mới',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
      res.status(500).json(errorResponse);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { logoUrl } = req.body;

      if (!logoUrl) {
        const badRequestResponse: IApiResponse<null> = {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          message: 'URL logo không được để trống'
        };
        res.status(400).json(badRequestResponse);
        return;
      }

      const airline = await AirlineModel.getByName(name);
      if (!airline) {
        const notFoundResponse: IApiResponse<null> = {
          success: false,
          error: 'Không tìm thấy hãng hàng không',
          message: `Không tìm thấy hãng hàng không với tên ${name}`
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const updatedAirline: IAirline = { name, logoUrl };
      await AirlineModel.update(updatedAirline);

      const response: IApiResponse<IAirline> = {
        success: true,
        data: updatedAirline,
        message: 'Cập nhật hãng hàng không thành công'
      };
      res.json(response);
    } catch (error) {
      const errorResponse: IApiResponse<null> = {
        success: false,
        error: 'Lỗi khi cập nhật hãng hàng không',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
      res.status(500).json(errorResponse);
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const airline = await AirlineModel.getByName(name);

      if (!airline) {
        res.status(404).json({
          success: false,
          error: 'Không tìm thấy hãng hàng không',
          message: `Không tìm thấy hãng hàng không với tên ${name}`
        });
        return;
      }

      // Xóa file logo
      if (airline.logoUrl) {
        const filePath = path.join(process.cwd(), 'public', airline.logoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await AirlineModel.delete(name);

      res.json({
        success: true,
        message: 'Xóa hãng hàng không thành công'
      });
    } catch (error) {
      const errorResponse: IApiResponse<null> = {
        success: false,
        error: 'Lỗi khi xóa hãng hàng không',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
      res.status(500).json(errorResponse);
    }
  }

  public static async importAirlines(req: Request, res: Response): Promise<void> {
    try {
      const { airlines } = req.body as ImportAirlineData;

      if (!Array.isArray(airlines)) {
        res.status(400).json({
          success: false,
          error: "Dữ liệu không hợp lệ",
          message: "Dữ liệu import phải là một mảng các hãng hàng không",
        });
        return;
      }

      // Validate dữ liệu đầu vào
      const invalidData = airlines.some(airline => !airline.name || !airline.logoUrl);
      if (invalidData) {
        res.status(400).json({
          success: false,
          error: "Dữ liệu không hợp lệ",
          message: "Mỗi hãng hàng không phải có đầy đủ tên (name) và logo (logoUrl)",
        });
        return;
      }

      // Import hoặc cập nhật dữ liệu
      const results = await Promise.all(
        airlines.map(async airline => {
          const existing = await AirlineModel.getByName(airline.name);
          if (existing) {
            await AirlineModel.update({ name: airline.name, logoUrl: airline.logoUrl });
            return { name: airline.name, logoUrl: airline.logoUrl }; // Trả về object sau khi cập nhật
          } else {
            return AirlineModel.create(airline);
          }
        })
      );

      const importedAirlines = results.filter((result): result is IAirline => result !== null);

      const response: IApiResponse<{
        importedCount: number;
        airlines: IAirline[];
      }> = {
        success: true,
        data: {
          importedCount: importedAirlines.length,
          airlines: importedAirlines,
        },
        message: `Import thành công ${importedAirlines.length} hãng hàng không`,
      };
      res.status(200).json(response);

    } catch (error) {
      console.error("Lỗi khi import dữ liệu hãng hàng không:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi khi import dữ liệu",
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  public static async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      // Lấy tất cả các hãng hàng không để xóa file logo
      const airlines = await AirlineModel.getAll();

      // Xóa tất cả các file logo
      for (const airline of airlines) {
        if (airline.logoUrl) {
          const filePath = path.join(process.cwd(), 'public', airline.logoUrl);
          if (fs.existsSync(filePath)) {
            await fsPromises.unlink(filePath);
            console.log(`Đã xóa file logo: ${filePath}`);
          }
        }
      }

      // Xóa tất cả dữ liệu từ database
      await AirlineModel.deleteAll();

      const response: IApiResponse<null> = {
        success: true,
        message: 'Đã xóa tất cả hãng hàng không thành công'
      };
      res.json(response);
    } catch (error) {
      console.error('Lỗi khi xóa tất cả hãng hàng không:', error);
      const errorResponse: IApiResponse<null> = {
        success: false,
        error: 'Lỗi khi xóa tất cả hãng hàng không',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
      res.status(500).json(errorResponse);
    }
  }
}