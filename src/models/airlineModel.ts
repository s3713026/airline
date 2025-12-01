import { db } from '@/config/database';
import { IAirline } from '@/types/interfaces';


export class AirlineModel {
  static async getAll(): Promise<IAirline[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM airlines', (err, rows) => {
        if (err) reject(err);
        resolve(rows as IAirline[]);
      });
    });
  }

  static async getByName(name: string): Promise<IAirline | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM airlines WHERE name = ?', [name], (err, row) => {
        if (err) reject(err);
        resolve(row as IAirline || null);
      });
    });
  }

  static async create(airline: IAirline): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO airlines (name, logo_url) VALUES (?, ?)',
        [airline.name, airline.logoUrl],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  static async update(airline: IAirline): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE airlines SET logo_url = ? WHERE name = ?',
        [airline.logoUrl, airline.name],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  static async delete(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM airlines WHERE name = ?', [name], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  static async deleteAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM airlines', (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}