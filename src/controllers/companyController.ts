import { CompanyModel } from '@/models/companyModel';
import { IApiResponse, ICompanyInfo } from '@/types/interfaces';
import { Request, Response } from 'express';

export const CompanyController = {
  async getCompanyInfo(req: Request, res: Response): Promise<void> {
    try {
      const companyInfo = await CompanyModel.getCompanyInfo();
      const response: IApiResponse<ICompanyInfo> = {
        success: true,
        data: companyInfo
      };
      res.json(response);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin công ty:', error);
      const response: IApiResponse<null> = {
        success: false,
        message: 'Đã có lỗi xảy ra khi lấy thông tin công ty'
      };
      res.status(500).json(response);
    }
  },

  async updateCompanyInfo(req: Request, res: Response): Promise<void> {
    try {
      const { company_name, address, hotline, email } = req.body;

      if (!company_name || !address || !hotline || !email) {
        const response: IApiResponse<null> = {
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin công ty'
        };
        res.status(400).json(response);
        return;
      }

      await CompanyModel.updateCompanyInfo({
        company_name,
        address,
        hotline,
        email
      });

      const response: IApiResponse<null> = {
        success: true,
        message: 'Cập nhật thông tin công ty thành công'
      };
      res.json(response);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin công ty:', error);
      const response: IApiResponse<null> = {
        success: false,
        message: 'Đã có lỗi xảy ra khi cập nhật thông tin công ty'
      };
      res.status(500).json(response);
    }
  }
};