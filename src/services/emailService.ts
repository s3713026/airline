import { getSmtpConfig } from '@/helpers/configHelper';
import { CompanyModel } from '@/models/companyModel';
import nodemailer from 'nodemailer';

interface BankInfo {
    bankId: string;
    accountNo: string;
    accountName: string;
}

interface FlightInfo {
    flightCode: string;
    airline: string;
    departure: {
        airportCode: string;
        airportName: string;
        departureTime: string;
    };
    arrival: {
        airportCode: string;
        airportName: string;
        arrivalTime: string;
    };
    duration: string;
}

export class EmailService {
    private static async createTransporter(): Promise<nodemailer.Transporter> {
        const config = await getSmtpConfig();
        if (!config.from) {
            throw new Error('Thiếu cấu hình email người gửi');
        }
        return nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass
            }
        });
    }

    private static async generateVietQRUrl(bankInfo: BankInfo, amount: number, description: string): Promise<string> {
        const template = 'qr_only';
        const bankId = bankInfo.bankId;
        const encodedAccountName = encodeURIComponent(bankInfo.accountName);
        const encodedDescription = encodeURIComponent(description);
        return `https://img.vietqr.io/image/${bankId}-${bankInfo.accountNo}-${template}.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodedAccountName}`;
    }

    public static async sendBookingConfirmation(
        to: string,
        name: string,
        bookingCode: string,
        bankName: string,
        bankAccount: string,
        bankBranch: string,
        amount: number,
        departureFlight: FlightInfo,
        passengers: {
            adults: number;
            children: number;
            infants: number;
        },
        returnFlight?: FlightInfo
    ): Promise<boolean> {
        try {
            const transporter = await this.createTransporter();
            const config = await getSmtpConfig();
            const companyInfo = await CompanyModel.getCompanyInfo();
            const emailDomain = `https://${companyInfo.email.split('@')[1]}`;

            const bankInfo: BankInfo = {
                accountName: bankName.toUpperCase(),
                accountNo: bankAccount,
                bankId: bankBranch
            };
            const qrUrl = await this.generateVietQRUrl(bankInfo, amount, `${bookingCode}`);

            const flightInfoHtml = `
            <div class="flight-info">
                <h3>THÔNG TIN CHUYẾN BAY:</h3>
                <div class="flight-details">
                    <h4>Chuyến bay đi:</h4>
                    <p><strong>Mã chuyến bay:</strong> ${departureFlight.flightCode}</p>
                    <p><strong>Hãng bay:</strong> ${departureFlight.airline}</p>
                    <p><strong>Điểm khởi hành:</strong> ${departureFlight.departure.airportName} (${departureFlight.departure.airportCode})</p>
                    <p><strong>Thời gian khởi hành:</strong> ${new Date(departureFlight.departure.departureTime).toLocaleString('vi-VN')}</p>
                    <p><strong>Điểm đến:</strong> ${departureFlight.arrival.airportName} (${departureFlight.arrival.airportCode})</p>
                    <p><strong>Thời gian đến:</strong> ${new Date(departureFlight.arrival.arrivalTime).toLocaleString('vi-VN')}</p>
                    <p><strong>Thời gian bay:</strong> ${departureFlight.duration}</p>
                </div>
                ${
                    returnFlight
                        ? `
                <div class="flight-details">
                    <h4>Chuyến bay về:</h4>
                    <p><strong>Mã chuyến bay:</strong> ${returnFlight.flightCode}</p>
                    <p><strong>Hãng bay:</strong> ${returnFlight.airline}</p>
                    <p><strong>Điểm khởi hành:</strong> ${returnFlight.departure.airportName} (${returnFlight.departure.airportCode})</p>
                    <p><strong>Thời gian khởi hành:</strong> ${new Date(returnFlight.departure.departureTime).toLocaleString('vi-VN')}</p>
                    <p><strong>Điểm đến:</strong> ${returnFlight.arrival.airportName} (${returnFlight.arrival.airportCode})</p>
                    <p><strong>Thời gian đến:</strong> ${new Date(returnFlight.arrival.arrivalTime).toLocaleString('vi-VN')}</p>
                    <p><strong>Thời gian bay:</strong> ${returnFlight.duration}</p>
                </div>
                `
                        : ''
                }
                <div class="passenger-info">
                    <h4>Thông tin hành khách:</h4>
                    <p><strong>Người lớn:</strong> ${passengers.adults} người</p>
                    ${passengers.children ? `<p><strong>Trẻ em:</strong> ${passengers.children} người</p>` : ''}
                    ${passengers.infants ? `<p><strong>Em bé:</strong> ${passengers.infants} người</p>` : ''}
                </div>
            </div>`;

            const additionalStyles = `
                .flight-info {
                    background: #fff;
                    padding: 15px;
                    margin: 20px 0;
                    border: 1px solid #E31837;
                    border-radius: 5px;
                }
                .flight-details {
                    margin: 15px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .passenger-info {
                    margin-top: 15px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
            `;

            await transporter.sendMail({
                from: config.from ?? 'no-reply@ovfteam.com',
                to: to,
                subject: 'XÁC NHẬN ĐẶT VÉ THÀNH CÔNG',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: #E31837;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background: #fff;
                            padding: 20px;
                            border: 1px solid #E31837;
                        }
                        .booking-code {
                            background: #fff;
                            padding: 15px;
                            text-align: center;
                            font-size: 24px;
                            margin: 20px 0;
                            border: 2px solid #E31837;
                            border-radius: 5px;
                        }
                        .payment-info {
                            background: #fff;
                            padding: 15px;
                            margin: 20px 0;
                            border: 1px solid #E31837;
                            border-radius: 5px;
                        }
                        .payment-info h3 {
                            color: #E31837;
                            margin-top: 0;
                        }
                        .qr-code {
                            text-align: center;
                            margin: 20px 0;
                            padding: 10px;
                            background: #fff;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                            color: #E31837;
                        }
                        strong {
                            color: #E31837;
                        }
                        ${additionalStyles}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>XÁC NHẬN ĐẶT VÉ</h1>
                        </div>
                        <div class="content">
                            <p>Xin chào <strong>${name}</strong>,</p>
                            <p>Cảm ơn Quý khách đã đặt vé. Đơn đặt vé của Quý khách đã được xác nhận thành công.</p>

                            <div class="booking-code">
                                <strong>MÃ ĐẶT VÉ:</strong><br>
                                ${bookingCode}
                            </div>

                            ${flightInfoHtml}

                            <div class="payment-info">
                                <h3>THÔNG TIN THANH TOÁN:</h3>
                                <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VNĐ</p>
                                <p><strong>Tên ngân hàng:</strong> ${bankName}</p>
                                <p><strong>Số tài khoản:</strong> ${bankAccount}</p>
                                <div class="qr-code">
                                    <img src="${qrUrl}" alt="QR Code Thanh Toán" style="max-width: 300px;"/>
                                </div>
                            </div>

                            <p>Quý khách có thể tra cứu thông tin đặt vé tại đây:
                                <a href="${emailDomain}/tra-cuu-lich-su-dat-ve?bookingCode=${bookingCode}">Tra cứu đặt vé</a>
                            </p>

                            <p>Nếu Quý khách có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>

                            <p>Trân trọng,<br><strong>Đội ngũ VIETJET TRAVEL</strong></p>
                        </div>
                        <div class="footer">
                            © 2024 VIETJET TRAVEL. All rights reserved.
                        </div>
                    </div>
                </body>
                </html>
                `
            });

            console.log('Đã gửi email xác nhận đặt vé thành công đến:', to);
            return true;
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            throw error;
        }
    }

    public static async sendPaymentConfirmation(
        to: string,
        name: string,
        bookingCode: string,
        amount: number | undefined
    ): Promise<boolean> {
        try {
            const safeAmount = amount ?? 0;
            const companyInfo = await CompanyModel.getCompanyInfo();
            const emailDomain = `https://${companyInfo.email.split('@')[1]}`;

            const transporter = await this.createTransporter();
            const config = await getSmtpConfig();

            await transporter.sendMail({
                from: config.from ?? 'no-reply@ovfteam.com',
                to: to,
                subject: 'XÁC NHẬN THANH TOÁN THÀNH CÔNG',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: #E31837;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background: #fff;
                            padding: 20px;
                            border: 1px solid #E31837;
                        }
                        .success-icon {
                            text-align: center;
                            margin: 20px 0;
                            font-size: 48px;
                        }
                        .payment-details {
                            background: #f8f9fa;
                            padding: 20px;
                            margin: 20px 0;
                            border-radius: 5px;
                            border: 1px solid #E31837;
                        }
                        .amount {
                            font-size: 24px;
                            color: #E31837;
                            text-align: center;
                            margin: 20px 0;
                            padding: 10px;
                            background: #fff;
                            border: 2px dashed #E31837;
                            border-radius: 5px;
                        }
                        .booking-link {
                            text-align: center;
                            margin: 20px 0;
                        }
                        .booking-link a {
                            display: inline-block;
                            padding: 10px 20px;
                            background: #E31837;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                        .booking-link a:hover {
                            background: #c41230;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                            color: #666;
                            border-top: 1px solid #eee;
                        }
                        .thank-you {
                            text-align: center;
                            font-size: 20px;
                            color: #E31837;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>THANH TOÁN THÀNH CÔNG</h1>
                        </div>
                        <div class="content">
                            <div class="success-icon">
                                ✓
                            </div>

                            <p>Kính gửi <strong>${name}</strong>,</p>

                            <p>Chúng tôi xin thông báo rằng khoản thanh toán của Quý khách đã được xác nhận thành công.</p>

                            <div class="payment-details">
                                <h3 style="color: #E31837; margin-top: 0;">CHI TIẾT THANH TOÁN:</h3>
                                <p><strong>Mã đặt vé:</strong> ${bookingCode}</p>
                                <div class="amount">
                                    <strong>Số tiền đã thanh toán:</strong><br>
                                    ${safeAmount.toLocaleString('vi-VN')} VNĐ
                                </div>
                                <p><strong>Thời gian thanh toán:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                                <p><strong>Trạng thái:</strong> <span style="color: #28a745">Đã thanh toán</span></p>
                            </div>

                            <div class="booking-link">
                                <a href="${emailDomain}/tra-cuu-lich-su-dat-ve?bookingCode=${bookingCode}">
                                    XEM CHI TIẾT ĐẶT VÉ
                                </a>
                            </div>

                            <div class="thank-you">
                                Cảm ơn Quý khách đã sử dụng dịch vụ của chúng tôi!
                            </div>

                            <p>Nếu Quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua:</p>
                            <ul>
                                <li>Hotline: <strong>${companyInfo.hotline}</strong></li>
                                <li>Email: <strong>${companyInfo.email}</strong></li>
                                <li>Địa chỉ: <strong>${companyInfo.address}</strong></li>
                            </ul>

                            <p>Trân trọng,<br><strong>Đội ngũ ${companyInfo.company_name}</strong></p>
                        </div>
                        <div class="footer">
                            © ${new Date().getFullYear()} ${companyInfo.company_name}. All rights reserved.<br>
                            Email này được gửi tự động, vui lòng không trả lời.
                        </div>
                    </div>
                </body>
                </html>
                `
            });

            console.log('Đã gửi email xác nhận thanh toán thành công đến:', to);
            return true;
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            throw error;
        }
    }
}
