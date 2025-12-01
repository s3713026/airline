import { AdminModel } from '@/models/adminModel';
import { IApiResponse } from '@/types/interfaces';
import { Request, Response } from 'express';

export class AdminController {
    public static async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Thiếu thông tin đăng nhập',
                    message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu'
                });
                return;
            }

            const user = await AdminModel.login(username, password);
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Đăng nhập thất bại',
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
                return;
            }

            req.session.user = {
                username: user.username,
                isAuthenticated: true
            };

            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công'
            } as IApiResponse<{ username: string }>);
        } catch (error) {
            console.error('Lỗi khi đăng nhập:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi đăng nhập',
                message: error instanceof Error ? error.message : 'Lỗi không xác định'
            });
        }
    }

    public static async logout(req: Request, res: Response): Promise<void> {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({
                    success: false,
                    error: 'Lỗi khi đăng xuất',
                    message: 'Không thể kết thúc phiên làm việc'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công'
            });
        });
    }

    public static async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const username = req.session.user?.username;

            if (!username || !currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Thiếu thông tin',
                    message: 'Vui lòng cung cấp đầy đủ thông tin'
                });
                return;
            }
            const user = await AdminModel.login(username, currentPassword);
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Xác thực thất bại',
                    message: 'Mật khẩu hiện tại không đúng'
                });
                return;
            }
            await AdminModel.changePassword(username, newPassword);
            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            console.error('Lỗi khi đổi mật khẩu:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi đổi mật khẩu',
                message: error instanceof Error ? error.message : 'Lỗi không xác định'
            });
        }
    }

    public static async checkAuth(req: Request, res: Response): Promise<void> {
        try {
            const isAuthenticated = req.session.user?.isAuthenticated ?? false;
            if (!isAuthenticated) {
                res.status(401).json({
                    success: false,
                    error: 'Chưa xác thực',
                    message: 'Người dùng chưa đăng nhập'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    isAuthenticated
                },
                message: 'Kiểm tra xác thực thành công'
            } as IApiResponse<{
                isAuthenticated: boolean;
                username?: string;
            }>);
        } catch (error) {
            console.error('Lỗi khi kiểm tra xác thực:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi kiểm tra xác thực',
                message: error instanceof Error ? error.message : 'Lỗi không xác định'
            });
        }
    }
}
