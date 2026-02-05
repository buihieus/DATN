const modelPost = require('../models/post.model');

class PostExpirationService {
    /**
     * Kiểm tra và cập nhật trạng thái các bài đăng hết hạn
     */
    static async checkAndExpirePosts() {
        try {
            const currentDate = new Date();
            
            // Tìm các bài đăng có endDate < currentDate và status đang là 'active'
            const expiredPosts = await modelPost.find({
                endDate: { $lt: currentDate },
                status: 'active'
            });

            // Cập nhật trạng thái các bài đăng hết hạn thành 'expired'
            const updatePromises = expiredPosts.map(post => {
                return modelPost.findByIdAndUpdate(
                    post._id,
                    { status: 'expired' },
                    { new: true }
                );
            });

            if (updatePromises.length > 0) {
                const updatedPosts = await Promise.all(updatePromises);
                console.log(`Đã cập nhật ${updatedPosts.length} bài đăng hết hạn thành trạng thái 'inactive'`);
                return updatedPosts;
            } else {
                console.log('Không có bài đăng nào hết hạn để cập nhật');
                return [];
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra và cập nhật bài đăng hết hạn:', error);
            throw error;
        }
    }

    /**
     * Khởi động dịch vụ kiểm tra định kỳ
     */
    static startExpirationCheck(intervalMinutes = 60) {
        // Thực hiện kiểm tra lần đầu ngay khi khởi động
        this.checkAndExpirePosts().catch(error => {
            console.error('Lỗi khi kiểm tra bài đăng hết hạn lần đầu:', error);
        });

        // Sau đó kiểm tra định kỳ theo khoảng thời gian quy định (mặc định là 60 phút)
        const interval = setInterval(async () => {
            try {
                await this.checkAndExpirePosts();
            } catch (error) {
                console.error('Lỗi trong quá trình kiểm tra định kỳ bài đăng hết hạn:', error);
            }
        }, intervalMinutes * 60 * 1000); // Chuyển phút sang mili giây

        console.log(`Dịch vụ kiểm tra bài đăng hết hạn đã được khởi động, kiểm tra mỗi ${intervalMinutes} phút`);

        // Trả về hàm để có thể dừng dịch vụ nếu cần
        return {
            stop: () => {
                clearInterval(interval);
                console.log('Dịch vụ kiểm tra bài đăng hết hạn đã được dừng');
            }
        };
    }
}

module.exports = PostExpirationService;