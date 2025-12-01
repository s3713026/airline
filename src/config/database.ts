import sqlite3, { Database } from 'sqlite3';

class DatabaseConnection {
    private static instance: Database;

    public static getInstance(): Database {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new sqlite3.Database('database.sqlite', (err) => {
                if (err) {
                    console.error('Lỗi kết nối cơ sở dữ liệu:', err);
                } else {
                    console.log('Đã kết nối với cơ sở dữ liệu SQLite');
                    DatabaseConnection.initTables();
                }
            });
        }
        return DatabaseConnection.instance;
    }

    private static initTables(): void {
        const db = DatabaseConnection.getInstance();

        // Promisify db.run
        const runAsync = (sql: string, params: any[] = []): Promise<void> => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        const createTables = async () => {
            try {
                // Now use runAsync instead of db.run
                await runAsync(`
          CREATE TABLE IF NOT EXISTS account(
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
          )
        `);

                await runAsync(
                    `
          INSERT OR REPLACE INTO account(username, password)
          VALUES (?, ?)
        `,
                    ['admin', 'admin123']
                );

                // Create airports table
                await runAsync(`
          CREATE TABLE IF NOT EXISTS airports (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL
          )
        `);

                // Create airlines table
                await runAsync(`
          CREATE TABLE IF NOT EXISTS airlines (
            name TEXT PRIMARY KEY,
            logo_url TEXT NOT NULL
          )
        `);

                // Create flights table
                await runAsync(`
          CREATE TABLE IF NOT EXISTS flights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_code TEXT NOT NULL,
            airline TEXT NOT NULL,
            price REAL NOT NULL,
            duration INTEGER NOT NULL,
            departure_airport_code TEXT NOT NULL,
            departure_airport_name TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            arrival_airport_code TEXT NOT NULL,
            arrival_airport_name TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            FOREIGN KEY (departure_airport_code) REFERENCES airports(code),
            FOREIGN KEY (arrival_airport_code) REFERENCES airports(code),
            FOREIGN KEY (airline) REFERENCES airlines(name)
          )
        `);

                // Create pricing rules table
                await runAsync(`
          CREATE TABLE IF NOT EXISTS pricing_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_type TEXT NOT NULL,
            price_multiplier REAL NOT NULL,
            description TEXT,
            UNIQUE(passenger_type)
          )
        `);

                // Insert initial pricing rules
                const pricingRules = [
                    {
                        passenger_type: 'adult',
                        price_multiplier: 1.0
                    },
                    {
                        passenger_type: 'child',
                        price_multiplier: 0.75
                    },
                    {
                        passenger_type: 'infant',
                        price_multiplier: 0.1
                    }
                ];

                for (const rule of pricingRules) {
                    const percentage = Math.round(rule.price_multiplier * 100);
                    const description = `Giá vé ${rule.passenger_type === 'adult' ? 'người lớn' : rule.passenger_type === 'child' ? 'trẻ em' : 'em bé'} (${percentage}% giá gốc)`;

                    await runAsync(
                        `INSERT OR REPLACE INTO pricing_rules (passenger_type, price_multiplier, description)
            VALUES (?, ?, ?)`,
                        [rule.passenger_type, rule.price_multiplier, description]
                    );
                }

                // Tạo bảng system_configs
                await runAsync(`
          CREATE TABLE IF NOT EXISTS system_configs (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);

                // Kiểm tra xem bảng đã có dữ liệu chưa
                const checkExistingConfigs = await new Promise<boolean>((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM system_configs', (err, row: any) => {
                        if (err) reject(err);
                        else resolve(row.count > 0);
                    });
                });

                // Chỉ thêm cấu hình mặc định nếu bảng trống
                if (!checkExistingConfigs) {
                    const defaultConfigs = [
                        ['smtp_name', ''],
                        ['smtp_user', ''],
                        ['smtp_pass', ''],
                        ['telegram_bot_token', ''],
                        ['telegram_chat_id', ''],
                        ['bank_name', ''],
                        ['bank_account', ''],
                        ['bank_branch', '']
                    ];

                    for (const [key, value] of defaultConfigs) {
                        await runAsync(
                            `INSERT OR REPLACE INTO system_configs (key, value) VALUES (?, ?)`,
                            [key, value]
                        );
                    }
                }

                // Tạo bảng company_info
                await runAsync(`
          CREATE TABLE IF NOT EXISTS company_info (
            company_name TEXT NOT NULL,
            address TEXT NOT NULL,
            hotline TEXT NOT NULL,
            email TEXT NOT NULL
          )
        `);

                // Thêm thông tin công ty mặc định
                await runAsync(
                    `
          INSERT OR REPLACE INTO company_info (
            company_name,
            address,
            hotline,
            email
          ) VALUES (?, ?, ?, ?)
        `,
                    ['CÔNG TY CỔ PHẦN HÀNG KHÔNG VIETJET', '302/3 Phố Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, TP. Hà Nội, Việt Nam.', '1900 1886', 'contact@vietjetair.com']
                );

                // Tạo bảng booking_history
                await runAsync(`
          CREATE TABLE IF NOT EXISTS booking_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_code TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            gender TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            id_number TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,

            trip_type TEXT NOT NULL,
            total_amount REAL NOT NULL,
            booking_date TEXT NOT NULL,
            is_paid BOOLEAN NOT NULL DEFAULT 0,

            departure_flight_id INTEGER NOT NULL,
            departure_flight_code TEXT NOT NULL,
            departure_airline TEXT NOT NULL,
            departure_price REAL NOT NULL,
            departure_duration INTEGER NOT NULL,
            departure_from_code TEXT NOT NULL,
            departure_from_name TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            departure_to_code TEXT NOT NULL,
            departure_to_name TEXT NOT NULL,
            departure_arrival_time TEXT NOT NULL,

            return_flight_id INTEGER,
            return_flight_code TEXT,
            return_airline TEXT,
            return_price REAL,
            return_duration INTEGER,
            return_from_code TEXT,
            return_from_name TEXT,
            return_time TEXT,
            return_to_code TEXT,
            return_to_name TEXT,
            return_arrival_time TEXT,

            adult_count INTEGER NOT NULL DEFAULT 0,
            child_count INTEGER NOT NULL DEFAULT 0,
            infant_count INTEGER NOT NULL DEFAULT 0,

            adult_price REAL NOT NULL DEFAULT 0,
            child_price REAL NOT NULL DEFAULT 0,
            infant_price REAL NOT NULL DEFAULT 0,

            FOREIGN KEY (departure_flight_id) REFERENCES flights(id),
            FOREIGN KEY (return_flight_id) REFERENCES flights(id)
          )
        `);

                console.log('Đã khởi tạo cơ sở dữ liệu thành công');
            } catch (error) {
                console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
            }
        };

        createTables();
    }

    public static async initializeDatabase(): Promise<void> {
        try {
            console.log('Khởi tạo cơ sở dữ liệu thành công');
        } catch (error) {
            console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
            throw error;
        }
    }
}

export const db = DatabaseConnection.getInstance();

// import { Pool } from 'pg';

// class DatabaseConnection {
//     private static pool: Pool;

//     public static getInstance(): Pool {
//         if (!DatabaseConnection.pool) {
//             DatabaseConnection.pool = new Pool({
//                 host: process.env.DB_HOST || 'localhost',
//                 port: Number(process.env.DB_PORT) || 5432,
//                 user: process.env.DB_USER || 'postgres',
//                 password: process.env.DB_PASS || 'postgres',
//                 database: process.env.DB_NAME || 'vietjet',
//             });

//             DatabaseConnection.initTables();
//         }
//         return DatabaseConnection.pool;
//     }

//     private static async runQuery(sql: string, params: any[] = []) {
//         const pool = DatabaseConnection.getInstance();
//         try {
//             await pool.query(sql, params);
//         } catch (err) {
//             console.error('Query error:', err);
//             throw err;
//         }
//     }

//     private static async initTables() {
//         const createTables = async () => {
//             try {
//                 // account table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS account(
//                         username TEXT PRIMARY KEY,
//                         password TEXT NOT NULL
//                     );
//                 `);
//                 await DatabaseConnection.runQuery(`
//                     INSERT INTO account(username, password)
//                     VALUES ($1, $2)
//                     ON CONFLICT(username) DO UPDATE SET password = EXCLUDED.password;
//                 `, ['admin', 'admin123']);

//                 // airports table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS airports (
//                         code TEXT PRIMARY KEY,
//                         name TEXT NOT NULL
//                     );
//                 `);

//                 // airlines table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS airlines (
//                         name TEXT PRIMARY KEY,
//                         logo_url TEXT NOT NULL
//                     );
//                 `);

//                 // flights table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS flights (
//                         id SERIAL PRIMARY KEY,
//                         flight_code TEXT NOT NULL,
//                         airline TEXT NOT NULL,
//                         price REAL NOT NULL,
//                         duration INTEGER NOT NULL,
//                         departure_airport_code TEXT NOT NULL,
//                         departure_airport_name TEXT NOT NULL,
//                         departure_time TIMESTAMP NOT NULL,
//                         arrival_airport_code TEXT NOT NULL,
//                         arrival_airport_name TEXT NOT NULL,
//                         arrival_time TIMESTAMP NOT NULL,
//                         FOREIGN KEY (departure_airport_code) REFERENCES airports(code),
//                         FOREIGN KEY (arrival_airport_code) REFERENCES airports(code),
//                         FOREIGN KEY (airline) REFERENCES airlines(name)
//                     );
//                 `);

//                 // pricing_rules table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS pricing_rules (
//                         id SERIAL PRIMARY KEY,
//                         passenger_type TEXT NOT NULL UNIQUE,
//                         price_multiplier REAL NOT NULL,
//                         description TEXT
//                     );
//                 `);

//                 const pricingRules = [
//                     { passenger_type: 'adult', price_multiplier: 1.0 },
//                     { passenger_type: 'child', price_multiplier: 0.75 },
//                     { passenger_type: 'infant', price_multiplier: 0.1 }
//                 ];

//                 for (const rule of pricingRules) {
//                     const percentage = Math.round(rule.price_multiplier * 100);
//                     const description = `Giá vé ${rule.passenger_type === 'adult' ? 'người lớn' : rule.passenger_type === 'child' ? 'trẻ em' : 'em bé'} (${percentage}% giá gốc)`;

//                     await DatabaseConnection.runQuery(`
//                         INSERT INTO pricing_rules(passenger_type, price_multiplier, description)
//                         VALUES ($1, $2, $3)
//                         ON CONFLICT(passenger_type) DO UPDATE SET price_multiplier = EXCLUDED.price_multiplier, description = EXCLUDED.description;
//                     `, [rule.passenger_type, rule.price_multiplier, description]);
//                 }

//                 // system_configs table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS system_configs (
//                         key TEXT PRIMARY KEY,
//                         value TEXT NOT NULL
//                     );
//                 `);

//                 const defaultConfigs = [
//                     ['smtp_name', ''],
//                     ['smtp_user', ''],
//                     ['smtp_pass', ''],
//                     ['telegram_bot_token', ''],
//                     ['telegram_chat_id', ''],
//                     ['bank_name', ''],
//                     ['bank_account', ''],
//                     ['bank_branch', '']
//                 ];

//                 for (const [key, value] of defaultConfigs) {
//                     await DatabaseConnection.runQuery(`
//                         INSERT INTO system_configs(key, value)
//                         VALUES ($1, $2)
//                         ON CONFLICT(key) DO NOTHING;
//                     `, [key, value]);
//                 }

//                 // company_info table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS company_info (
//                         company_name TEXT NOT NULL,
//                         address TEXT NOT NULL,
//                         hotline TEXT NOT NULL,
//                         email TEXT NOT NULL
//                     );
//                 `);

//                 await DatabaseConnection.runQuery(`
//                     INSERT INTO company_info(company_name, address, hotline, email)
//                     VALUES ($1, $2, $3, $4)
//                     ON CONFLICT (company_name) DO NOTHING;
//                 `, ['CÔNG TY CỔ PHẦN HÀNG KHÔNG VIETJET', '302/3 Phố Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, TP. Hà Nội, Việt Nam.', '1900 1886', 'contact@vietjetair.com']);

//                 // booking_history table
//                 await DatabaseConnection.runQuery(`
//                     CREATE TABLE IF NOT EXISTS booking_history (
//                         id SERIAL PRIMARY KEY,
//                         booking_code TEXT NOT NULL UNIQUE,
//                         full_name TEXT NOT NULL,
//                         gender TEXT NOT NULL,
//                         date_of_birth DATE NOT NULL,
//                         id_number TEXT NOT NULL,
//                         phone TEXT NOT NULL,
//                         email TEXT NOT NULL,
//                         trip_type TEXT NOT NULL,
//                         total_amount REAL NOT NULL,
//                         booking_date TIMESTAMP NOT NULL,
//                         is_paid BOOLEAN NOT NULL DEFAULT FALSE,
//                         departure_flight_id INTEGER NOT NULL REFERENCES flights(id),
//                         departure_flight_code TEXT NOT NULL,
//                         departure_airline TEXT NOT NULL,
//                         departure_price REAL NOT NULL,
//                         departure_duration INTEGER NOT NULL,
//                         departure_from_code TEXT NOT NULL,
//                         departure_from_name TEXT NOT NULL,
//                         departure_time TIMESTAMP NOT NULL,
//                         departure_to_code TEXT NOT NULL,
//                         departure_to_name TEXT NOT NULL,
//                         departure_arrival_time TIMESTAMP NOT NULL,
//                         return_flight_id INTEGER REFERENCES flights(id),
//                         return_flight_code TEXT,
//                         return_airline TEXT,
//                         return_price REAL,
//                         return_duration INTEGER,
//                         return_from_code TEXT,
//                         return_from_name TEXT,
//                         return_time TIMESTAMP,
//                         return_to_code TEXT,
//                         return_to_name TEXT,
//                         return_arrival_time TIMESTAMP,
//                         adult_count INTEGER NOT NULL DEFAULT 0,
//                         child_count INTEGER NOT NULL DEFAULT 0,
//                         infant_count INTEGER NOT NULL DEFAULT 0,
//                         adult_price REAL NOT NULL DEFAULT 0,
//                         child_price REAL NOT NULL DEFAULT 0,
//                         infant_price REAL NOT NULL DEFAULT 0
//                     );
//                 `);

//                 console.log('✅ PostgreSQL database initialized successfully.');
//             } catch (error) {
//                 console.error('❌ Error initializing PostgreSQL database:', error);
//             }
//         };

//         createTables();
//     }

//     public static async initializeDatabase(): Promise<void> {
//         try {
//             console.log('✅ Database connection ready');
//         } catch (error) {
//             console.error('❌ Error initializing database:', error);
//             throw error;
//         }
//     }
// }

// export const db = DatabaseConnection.getInstance();
