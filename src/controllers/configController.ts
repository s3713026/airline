import { configModel, SystemConfig } from '@/models/configModel';
import { IApiResponse } from '@/types/interfaces';
import { Request, Response } from 'express';

export class ConfigController {
  public static async getConfigs(req: Request, res: Response<IApiResponse<SystemConfig>>) {
    try {
      const configs = await configModel.getAllConfigs();
      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy cấu hình hệ thống'
      });
    }
  }



  public static async updateConfigs(req: Request, res: Response<IApiResponse<void>>) {
    try {
      const updates: Partial<SystemConfig> = req.body;

      if (updates.smtp_user && !updates.smtp_user.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'Email Gmail không hợp lệ'
        });
        return;
      }

      await configModel.updateConfigs(updates);
      res.json({
        success: true,
        message: 'Cập nhật cấu hình thành công'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Lỗi khi cập nhật cấu hình hệ thống'
      });
    }
  }

  public static async getBankConfig(req: Request, res: Response<IApiResponse<any>>) {
    try {
      const bankConfig = await configModel.getBankConfig();
      res.json({
        success: true,
        data: bankConfig
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy thông tin cấu hình ngân hàng'
      });
    }
  }
}
