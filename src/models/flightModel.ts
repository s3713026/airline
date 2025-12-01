import { db } from "@/config/database";
import { IFlight, IPricingRule } from "@/types/interfaces";

interface IFlightRow {
  flightId: number;
  flightCode: string;
  airline: string;
  price: number;
  duration: number;
  departureAirportCode: string;
  departureAirportName: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalAirportName: string;
  arrivalTime: string;
}

export class FlightModel {
  private static mapFlightRow(row: IFlightRow): IFlight {
    return {
      flightId: row.flightId,
      flightCode: row.flightCode,
      departure: {
        airportCode: row.departureAirportCode,
        airportName: row.departureAirportName,
        departureTime: row.departureTime,
      },
      arrival: {
        airportCode: row.arrivalAirportCode,
        airportName: row.arrivalAirportName,
        arrivalTime: row.arrivalTime,
      },
      airline: row.airline,
      price: row.price,
      duration: row.duration,
    };
  }

  public static async getPricingRules(): Promise<IPricingRule> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          passenger_type,
          price_multiplier,
          description
        FROM pricing_rules
      `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("Lỗi khi lấy quy tắc tính giá:", err);
          reject(err);
          return;
        }

        const rules = FlightModel.getDefaultRules();

        rows.forEach((row: any) => {
          if (row.passenger_type in rules) {
            rules[row.passenger_type as keyof IPricingRule] = {
              price_multiplier: row.price_multiplier,
              description: row.description,
            };
          }
        });

        resolve(rules);
      });
    });
  }

  private static getDefaultRules(): IPricingRule {
    return {
      adult: {
        price_multiplier: 1.0,
        description: "Giá vé người lớn (100% giá gốc)",
      },
      child: {
        price_multiplier: 0.75,
        description: "Giá vé trẻ em (75% giá gốc)",
      },
      infant: {
        price_multiplier: 0.1,
        description: "Giá vé em bé (10% giá gốc)",
      },
    };
  }

  public static async updatePricingRules(
    data: Partial<IPricingRule>,
  ): Promise<IPricingRule> {
    const updateSql = `
      UPDATE pricing_rules
      SET price_multiplier = ?,
          description = ?
      WHERE passenger_type = ?
    `;

    const updates = Object.entries(data)
      .filter(([, rule]) => rule?.price_multiplier !== undefined)
      .map(([type, rule]) => {
        const percentage = Math.round(rule.price_multiplier * 100);
        const description = `Giá vé ${
          type === 'adult' ? 'người lớn' :
          type === 'child' ? 'trẻ em' : 'em bé'
        } (${percentage}% giá gốc)`;

        return db.run(updateSql, [rule.price_multiplier, description, type]);
      });

    await Promise.all(updates);
    return FlightModel.getPricingRules();
  }

  public static async isAirportInUse(airportCode: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 1
        FROM flights
        WHERE departure_airport_code = ?
           OR arrival_airport_code = ?
        LIMIT 1
      `;

      db.get(sql, [airportCode, airportCode], (err, row) => {
        if (err) {
          console.error("Lỗi khi kiểm tra sân bay đang được sử dụng:", err);
          reject(err);
          return;
        }
        resolve(!!row); // Trả về true nếu có kết quả, false nếu không
      });
    });
  }

  public static async createFlight(flight: Omit<IFlight, 'flightId'>): Promise<IFlight> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO flights (
          flight_code,
          airline,
          price,
          duration,
          departure_airport_code,
          departure_airport_name,
          departure_time,
          arrival_airport_code,
          arrival_airport_name,
          arrival_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        flight.flightCode,
        flight.airline,
        flight.price,
        flight.duration,
        flight.departure.airportCode,
        flight.departure.airportName,
        flight.departure.departureTime,
        flight.arrival.airportCode,
        flight.arrival.airportName,
        flight.arrival.arrivalTime
      ];

      db.run(sql, params, function(err) {
        if (err) {
          console.error("Lỗi khi tạo chuyến bay:", err);
          reject(err);
          return;
        }

        resolve({
          flightId: this.lastID,
          ...flight
        });
      });
    });
  }

  public static async getAllFlights(): Promise<IFlight[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          id as flightId,
          flight_code as flightCode,
          airline,
          price,
          duration,
          departure_airport_code as departureAirportCode,
          departure_airport_name as departureAirportName,
          departure_time as departureTime,
          arrival_airport_code as arrivalAirportCode,
          arrival_airport_name as arrivalAirportName,
          arrival_time as arrivalTime
        FROM flights
      `;

      db.all(sql, [], (err, rows: IFlightRow[]) => {
        if (err) {
          console.error("Lỗi khi lấy danh sách chuyến bay:", err);
          reject(err);
          return;
        }
        resolve(rows.map(row => FlightModel.mapFlightRow(row)));
      });
    });
  }

  public static async getFlightById(flightId: number): Promise<IFlight | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          id as flightId,
          flight_code as flightCode,
          airline,
          price,
          duration,
          departure_airport_code as departureAirportCode,
          departure_airport_name as departureAirportName,
          departure_time as departureTime,
          arrival_airport_code as arrivalAirportCode,
          arrival_airport_name as arrivalAirportName,
          arrival_time as arrivalTime
        FROM flights
        WHERE id = ?
      `;

      db.get(sql, [flightId], (err, row: IFlightRow) => {
        if (err) {
          console.error("Lỗi khi lấy thông tin chuyến bay:", err);
          reject(err);
          return;
        }
        resolve(row ? FlightModel.mapFlightRow(row) : null);
      });
    });
  }

  public static async updateFlight(flightId: number, flight: Partial<IFlight>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: any[] = [];

      if (flight.flightCode) {
        updates.push('flight_code = ?');
        params.push(flight.flightCode);
      }
      if (flight.airline) {
        updates.push('airline = ?');
        params.push(flight.airline);
      }
      if (flight.price) {
        updates.push('price = ?');
        params.push(flight.price);
      }
      if (flight.duration) {
        updates.push('duration = ?');
        params.push(flight.duration);
      }
      if (flight.departure) {
        if (flight.departure.airportCode) {
          updates.push('departure_airport_code = ?');
          params.push(flight.departure.airportCode);
        }
        if (flight.departure.airportName) {
          updates.push('departure_airport_name = ?');
          params.push(flight.departure.airportName);
        }
        if (flight.departure.departureTime) {
          updates.push('departure_time = ?');
          params.push(flight.departure.departureTime);
        }
      }
      if (flight.arrival) {
        if (flight.arrival.airportCode) {
          updates.push('arrival_airport_code = ?');
          params.push(flight.arrival.airportCode);
        }
        if (flight.arrival.airportName) {
          updates.push('arrival_airport_name = ?');
          params.push(flight.arrival.airportName);
        }
        if (flight.arrival.arrivalTime) {
          updates.push('arrival_time = ?');
          params.push(flight.arrival.arrivalTime);
        }
      }

      params.push(flightId);

      const sql = `
        UPDATE flights
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      db.run(sql, params, (err) => {
        if (err) {
          console.error("Lỗi khi cập nhật chuyến bay:", err);
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  public static async deleteFlight(flightId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM flights WHERE id = ?';

      db.run(sql, [flightId], (err) => {
        if (err) {
          console.error("Lỗi khi xóa chuyến bay:", err);
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Xóa tất cả chuyến bay
   */
  public static async deleteAllFlights(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM flights';

      db.run(sql, [], (err) => {
        if (err) {
          console.error("Lỗi khi xóa tất cả chuyến bay:", err);
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  private static async executeInsert(sql: string, flight: Omit<IFlight, 'flightId'>): Promise<IFlight> {
    return new Promise((resolve, reject) => {
      const params = [
        flight.flightCode,
        flight.airline,
        flight.price,
        flight.duration,
        flight.departure.airportCode,
        flight.departure.airportName,
        flight.departure.departureTime,
        flight.arrival.airportCode,
        flight.arrival.airportName,
        flight.arrival.arrivalTime
      ];

      db.run(sql, params, function(err) {
        if (err) reject(new Error(err.message));
        resolve({ flightId: this.lastID, ...flight });
      });
    });
  }

  private static async commitTransaction(results: IFlight[]): Promise<IFlight[]> {
    return new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(new Error(err.message));
          return;
        }
        resolve(results);
      });
    });
  }

  public static async importFlights(flights: Array<Omit<IFlight, 'flightId'>>): Promise<IFlight[]> {
    const sql = `INSERT INTO flights (
      flight_code, airline, price, duration,
      departure_airport_code, departure_airport_name, departure_time,
      arrival_airport_code, arrival_airport_name, arrival_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
      db.run('BEGIN TRANSACTION');
      const results = await Promise.all(flights.map(flight => this.executeInsert(sql, flight)));
      return await this.commitTransaction(results);
    } catch (error) {
      db.run('ROLLBACK');
      throw new Error(error instanceof Error ? error.message : 'Lỗi không xác định');
    }
  }
}
