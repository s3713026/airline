import { db } from '@/config/database';

interface CompanyInfo {
  company_name: string;
  address: string;
  hotline: string;
  email: string;
}

export const CompanyModel = {
  async getCompanyInfo(): Promise<CompanyInfo> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM company_info LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row as CompanyInfo);
      });
    });
  },

  async updateCompanyInfo(info: CompanyInfo): Promise<void> {
    const { company_name, address, hotline, email } = info;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE company_info
         SET company_name = ?, address = ?, hotline = ?, email = ?`,
        [company_name, address, hotline, email],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
};