import { getTelegramConfig } from '@/helpers/configHelper';
import { IApiResponse } from '@/types/interfaces';
import axios from 'axios';
import { Request, Response } from 'express';

interface ContactFormData {
    fullName: string;
    email: string;
    phone: string;
    message: string;
}

export class ContactController {
    public static async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { fullName, email, phone, message }: ContactFormData = req.body;

            // Validate input
            if (!fullName || !email || !phone || !message) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Thiếu thông tin',
                    message: 'Vui lòng điền đầy đủ thông tin liên hệ'
                };
                res.status(400).json(response);
                return;
            }

            // Get Telegram config
            const { botToken, chatId } = await getTelegramConfig();

            if (!botToken || !chatId) {
                const response: IApiResponse<null> = {
                    success: false,
                    error: 'Cấu hình không hợp lệ',
                    message: 'Chưa cấu hình Telegram Bot'
                };
                res.status(500).json(response);
                return;
            }

            // Format message for Telegram
            const telegramMessage = `
<b>🌟 THÔNG BÁO LIÊN HỆ MỚI</b>
━━━━━━━━━━━━━━━━━━

<b>👤 Thông tin khách hàng</b>
• Họ và tên: <b>${fullName}</b>
• Email: <code>${email}</code>
• Số điện thoại: <code>${phone}</code>

<b>📝 Nội dung tin nhắn</b>
${message}

━━━━━━━━━━━━━━━━━━
⏰ Thời gian: <code>${new Date().toLocaleString('vi-VN')}</code>
🔍 ID: <code>#${Math.random().toString(36).substr(2, 8).toUpperCase()}</code>
`.trim();

            // Send to Telegram
            const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            await axios.post(telegramUrl, {
                chat_id: chatId,
                text: telegramMessage,
                parse_mode: 'HTML'
            });

            const response: IApiResponse<null> = {
                success: true,
                message: 'Gửi tin nhắn liên hệ thành công'
            };
            res.status(200).json(response);

        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn liên hệ:', error);
            const response: IApiResponse<null> = {
                success: false,
                error: 'Lỗi khi gửi tin nhắn',
                message: error instanceof Error ? error.message : 'Lỗi không xác định'
            };
            res.status(500).json(response);
        }
    }
}