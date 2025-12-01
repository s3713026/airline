import { db } from "@/config/database";
import { IUser } from "@/types/interfaces";

export class AdminModel {
  public static async login(
    username: string,
    password: string,
  ): Promise<IUser | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT username, password
        FROM account
        WHERE username = ? AND password = ?
      `;

      db.get(sql, [username, password], (err, row: IUser | undefined) => {
        if (err) {
          console.error("Lỗi truy vấn cơ sở dữ liệu:", err);
          reject(err);
          return;
        }

        resolve(row ?? null);
      });
    });
  }

  public static async changePassword(
    username: string,
    newPassword: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE account
        SET password = ?
        WHERE username = ?
      `;

      db.run(sql, [newPassword, username], (err) => {
        if (err) {
          console.error("Lỗi khi cập nhật mật khẩu:", err);
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
}
