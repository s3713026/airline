import { db } from "@/config/database";
import { IAirport } from "@/types/interfaces";

export class AirportModel {
  public static async findAll(): Promise<IAirport[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, name
        FROM airports
        ORDER BY code ASC
      `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("Lỗi truy vấn cơ sở dữ liệu:", err);
          reject(err);
          return;
        }
        resolve(rows as IAirport[]);
      });
    });
  }

  public static async findByCode(code: string): Promise<IAirport | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, name
        FROM airports
        WHERE code = ?
      `;

      db.get(sql, [code], (err, row) => {
        if (err) {
          console.error("Lỗi truy vấn cơ sở dữ liệu:", err);
          reject(err);
          return;
        }
        resolve(row ? (row as IAirport) : null);
      });
    });
  }

  public static async create(data: IAirport): Promise<IAirport> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO airports (code, name)
        VALUES (?, ?)
        RETURNING code, name
      `;

      db.get(sql, [data.code, data.name], (err, row) => {
        if (err) {
          console.error("Lỗi khi thêm sân bay:", err);
          reject(err);
          return;
        }
        resolve(row as IAirport);
      });
    });
  }

  public static async update(
    code: string,
    data: Partial<IAirport>,
  ): Promise<IAirport | null> {
    return new Promise((resolve, reject) => {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updateFields.push("name = ?");
        values.push(data.name);
      }
      if (updateFields.length === 0) {
        resolve(null);
        return;
      }

      values.push(code);

      const sql = `
        UPDATE airports
        SET ${updateFields.join(", ")}
        WHERE code = ?
        RETURNING code, name
      `;

      db.get(sql, values, (err, row) => {
        if (err) {
          console.error("Lỗi khi cập nhật sân bay:", err);
          reject(err);
          return;
        }
        resolve(row ? (row as IAirport) : null);
      });
    });
  }

  public static async delete(code: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM airports WHERE code = ?`;

      db.run(sql, [code], function (err) {
        if (err) {
          console.error("Lỗi khi xóa sân bay:", err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  public static async deleteAll(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM airports`;

      db.run(sql, [], function (err) {
        if (err) {
          console.error("Lỗi khi xóa tất cả sân bay:", err);
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }
}
