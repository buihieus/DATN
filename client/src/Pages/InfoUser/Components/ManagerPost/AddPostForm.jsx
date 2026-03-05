// export default AddPostForm;
import React, { useState, useEffect, useRef } from 'react';
import {
    Form,
    Input,
    InputNumber,
    Select,
    Upload,
    Button,
    message,
    Row,
    Col,
    Checkbox,
    Divider,
    Typography,
    AutoComplete,
    Table,
    Statistic,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { Editor } from '@tinymce/tinymce-react';
import { requestCreatePost, requestUploadImages, requestGetLocations } from '../../../../config/request';

const { Option } = Select;
const { Title } = Typography;

import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

// Helper function for Upload component
const normFile = (e) => {
    if (Array.isArray(e)) {
        return e;
    }
    return e && e.fileList;
};

const dataSource = [
    // {
    //     key: '1',
    //     typeNews: 'Tin VIP',
    //     '3 ngày': 30000,
    //     '7 ngày': 70000,
    //     '30 ngày': 300000,
    // },
    {
        key: '2',
        typeNews: 'Tin thường',
        '3 ngày': 30000,
        '7 ngày': 70000,
        '30 ngày': 300000,
    },
];

const columns = [
    {
        title: 'Loại Tin',
        dataIndex: 'typeNews',
        key: 'typeNews',
    },
    {
        title: '3 ngày',
        dataIndex: '3 ngày',
        key: '3 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
    {
        title: '7 ngày',
        dataIndex: '7 ngày',
        key: '7 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
    {
        title: '30 ngày',
        dataIndex: '30 ngày',
        key: '30 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
];

// Checkbox options list (from ManagerPost.jsx for consistency, or define here)
const optionLabels = [
    'Đầy đủ nội thất',
    'Có gác',
    'Có kệ bếp',
    'Có máy lạnh',
    'Có máy giặt',
    'Có tủ lạnh',
    'Có thang máy',
    'Không chung chủ',
    'Giờ giấc tự do',
    'Có bảo vệ 24/24',
    'Có hầm để xe',
    'Có ban công'
];

// Example suggestions for AutoComplete

const durationOptions = [
    { label: '3 ngày', value: 3 },
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
];

function AddPostForm({ onFinish, onCancel, initialValues }) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [description, setDescription] = useState(initialValues?.description || '');
    const [valueSearch, setValueSearch] = useState('');
    const [dataSearch, setDataSearch] = useState([]);
    // State for the new address structure
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [mapCoordinates, setMapCoordinates] = useState({ lat: 21.028511, lng: 105.804817 }); // Default to Hanoi
    const debouncedSearch = useDebounce(valueSearch, 500);
    const [mapQuery, setMapQuery] = useState(initialValues?.address || 'Lăng Chủ tịch Hồ Chí Minh');
    const [dateEnd, setDateEnd] = useState(null);

    // Load provinces on component mount
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await requestGetLocations();
                setProvinces(response.metadata?.provinces || []);
            } catch (error) {
                console.error('Error fetching provinces:', error);
                message.error('Lỗi khi tải danh sách tỉnh/thành phố');
            }
        };

        fetchProvinces();
    }, []);

    // Load wards when province is selected
    useEffect(() => {
        console.log('Selected province changed:', selectedProvince); // Add logging

        if (selectedProvince) {
            const fetchWards = async () => {
                try {
                    console.log('Fetching wards for province:', selectedProvince); // Add logging
                    // Use the function signature that matches the requestGetLocations function
                    const response = await requestGetLocations(selectedProvince, null);
                    console.log('Wards response:', response); // Add logging
                    setWards(response.metadata?.wards || []);
                    console.log('Wards set in state:', response.metadata?.wards || []); // Add logging
                } catch (error) {
                    console.error('Error fetching wards:', error);
                    console.error('Error details:', error.response || error.message); // Add error details
                    message.error('Lỗi khi tải danh sách phường/xã');
                }
            };

            fetchWards();
        } else {
            setWards([]);
            console.log('Cleared wards as province is empty'); // Add logging
        }
    }, [selectedProvince]);

    // State for calculated cost
    const [estimatedCost, setEstimatedCost] = useState(0);

    // Ref for Editor
    const editorRef = useRef(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    // Get form values to watch for changes
    const selectedDuration = Form.useWatch('duration', form);
    const selectedTypeNews = Form.useWatch('typeNews', form);

    // Check if this is edit mode (has initialValues)
    const isEditMode = !!initialValues;

    // Effect to recalculate cost based on duration and typeNews
    useEffect(() => {
        let calculatedCost = 0;
        if (selectedDuration && selectedTypeNews) {
            // Corrected Find Logic:
            const selectedTier = dataSource.find((item) => {
                // Check if the item matches the selected type ('vip' or 'normal')
                const itemTypeKey = item.typeNews === 'Tin VIP' ? 'vip' : 'normal';
                return itemTypeKey === selectedTypeNews;
            });

            if (selectedTier) {
                const durationKey = `${selectedDuration} ngày`;
                setDateEnd(selectedDuration);
                calculatedCost = selectedTier[durationKey] || 0;
            }
        }
        setEstimatedCost(calculatedCost);
    }, [selectedDuration, selectedTypeNews]);

    useEffect(() => {
        const fetchData = async () => {
            if (debouncedSearch) {
                const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
                    params: {
                        input: debouncedSearch,
                        api_key: '3HcKy9jen6utmzxno4HwpkN1fJYll5EM90k53N4K',
                    },
                });
                setDataSearch(res.data.predictions);
            }
        };
        fetchData();
    }, [debouncedSearch]);

    useEffect(() => {
        if (initialValues) {
            // Handle new address structure vs old location structure
            let initialData = { ...initialValues };

            // Check if post uses the new address structure
            if (initialValues.address && typeof initialValues.address === 'object') {
                // Extract address components for form fields
                initialData = {
                    ...initialData,
                    provinceCode: initialValues.address.provinceCode,
                    wardCode: initialValues.address.wardCode,
                    street: initialValues.address.street,
                    fullAddress: initialValues.address.fullAddress,
                };
                // Set state for the address components
                setSelectedProvince(initialValues.address.provinceCode);
                setSelectedWard(initialValues.address.wardCode);
                setStreetAddress(initialValues.address.street);
                setMapCoordinates({
                    lat: initialValues.address.coordinates?.lat || 21.028511,
                    lng: initialValues.address.coordinates?.lng || 105.804817
                });
            } else {
                // Use old location field
                initialData.location = initialValues.location || initialValues.address;
            }

            initialData.options = Array.isArray(initialValues.options) ? initialValues.options : [];

            form.setFieldsValue(initialData);
            if (initialValues.description) {
                // Decode HTML entities trong mô tả
                let decodedDescription = initialValues.description
                    ? initialValues.description.replace(/<[^>]*>/g, '') // Loại bỏ HTML tags
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '\"')
                        .replace(/&#39;/g, "'")
                        .replace(/&Agrave;/g, 'À')
                        .replace(/&agrave;/g, 'à')
                        .replace(/&Egrave;/g, 'È')
                        .replace(/&egrave;/g, 'è')
                        .replace(/&Igrave;/g, 'Ì')
                        .replace(/&igrave;/g, 'ì')
                        .replace(/&Ograve;/g, 'Ò')
                        .replace(/&ograve;/g, 'ò')
                        .replace(/&Ugrave;/g, 'Ù')
                        .replace(/&ugrave;/g, 'ù')
                        .replace(/&Ygrave;/g, 'Ỳ')
                        .replace(/&ygrave;/g, 'ỳ')
                        .replace(/&Aacute;/g, 'Á')
                        .replace(/&aacute;/g, 'á')
                        .replace(/&Eacute;/g, 'É')
                        .replace(/&eacute;/g, 'é')
                        .replace(/&Iacute;/g, 'Í')
                        .replace(/&iacute;/g, 'í')
                        .replace(/&Oacute;/g, 'Ó')
                        .replace(/&oacute;/g, 'ó')
                        .replace(/&Uacute;/g, 'Ú')
                        .replace(/&uacute;/g, 'ú')
                        .replace(/&Yacute;/g, 'Ý')
                        .replace(/&yacute;/g, 'ý')
                        .replace(/&Acirc;/g, 'Â')
                        .replace(/&acirc;/g, 'â')
                        .replace(/&Ecirc;/g, 'Ê')
                        .replace(/&ecirc;/g, 'ê')
                        .replace(/&Icirc;/g, 'Î')
                        .replace(/&icirc;/g, 'î')
                        .replace(/&Ocirc;/g, 'Ô')
                        .replace(/&ocirc;/g, 'ô')
                        .replace(/&Ucirc;/g, 'Û')
                        .replace(/&ucirc;/g, 'û')
                        .replace(/&Agrave;/g, 'Ä')
                        .replace(/&agrave;/g, 'ä')
                        .replace(/&Ograve;/g, 'Ö')
                        .replace(/&ograve;/g, 'ö')
                        .replace(/&Ugrave;/g, 'Ü')
                        .replace(/&ugrave;/g, 'ü')
                        .replace(/&AElig;/g, 'Æ')
                        .replace(/&aelig;/g, 'æ')
                        .replace(/&szlig;/g, 'ß')
                        .replace(/&Ccedil;/g, 'Ç')
                        .replace(/&ccedil;/g, 'ç')
                        .replace(/&Ntilde;/g, 'Ñ')
                        .replace(/&ntilde;/g, 'ñ')
                    : '';
                setDescription(decodedDescription);

                // Cập nhật nội dung cho Editor nếu đã sẵn sàng
                if (editorRef.current) {
                    editorRef.current.setContent(decodedDescription);
                } else {
                    // Nếu editor chưa sẵn sàng, sẽ cập nhật sau qua useEffect
                }
            }
            // Set map query using the address components if available, otherwise fall back to old location
            setMapQuery(initialValues.address?.fullAddress || initialValues.location || initialValues.address || 'Lăng Chủ tịch Hồ Chí Minh');

            if (initialValues.images && Array.isArray(initialValues.images)) {
                setFileList(
                    initialValues.images.map((img, index) => {
                        // Tạo uid ổn định cho mỗi ảnh dựa trên nội dung ảnh để tránh flickering
                        let stableUid;
                        if (typeof img === 'string') {
                            // Dùng URL làm phần của uid để đảm bảo ổn định
                            stableUid = `-${index}-${img.substring(img.length - 10).replace(/[^a-zA-Z0-9]/g, '')}`;
                        } else if (img && typeof img === 'object' && (img.url || img.thumbUrl)) {
                            const url = img.url || img.thumbUrl;
                            stableUid = `-${index}-${url.substring(url.length - 10).replace(/[^a-zA-Z0-9]/g, '')}`;
                        } else {
                            stableUid = `-${index}-${Date.now()}`;
                        }

                        // Nếu img là object với các thuộc tính cần thiết, trả về nguyên bản với uid ổn định
                        if (img && typeof img === 'object' && (img.url || img.thumbUrl)) {
                            return {
                                ...img,
                                uid: img.uid || stableUid,
                                status: img.status || 'done',
                                // Đảm bảo thumbUrl tồn tại nếu chưa có
                                thumbUrl: img.thumbUrl || img.url || img,
                            };
                        }
                        // Nếu img là chuỗi URL, tạo object phù hợp cho Upload component
                        if (typeof img === 'string') {
                            const name = img.substring(img.lastIndexOf('/') + 1);
                            return {
                                uid: stableUid,
                                name: name || `image-${index + 1}.jpg`,
                                status: 'done',
                                url: img,
                                thumbUrl: img, // Thêm thumbUrl để hiển thị ảnh preview
                            };
                        }
                        // Trường hợp mặc định
                        return {
                            uid: stableUid,
                            name: `image-${index + 1}.png`,
                            status: 'done',
                        };
                    }),
                );
            } else {
                setFileList([]);
            }
        } else {
            form.resetFields();
            setFileList([]);
            setDescription('');
            setMapQuery('Lăng Chủ tịch Hồ Chí Minh');
            setEstimatedCost(0);
            // Reset address selection when creating new post
            setSelectedProvince('');
            setSelectedWard('');
            setStreetAddress('');
            setMapCoordinates({ lat: 21.028511, lng: 105.804817 });
        }
    }, [initialValues, form]);

    // Cập nhật nội dung cho Editor khi cả editor và mô tả đã sẵn sàng
    useEffect(() => {
        if (isEditorReady && initialValues?.description) {
            // Chỉ set nguyên HTML từ initialValues
            editorRef.current.setContent(initialValues.description);
            setDescription(initialValues.description); // đồng bộ state
        }
    }, [isEditorReady, initialValues]);

    // const handleFinish = async (values) => {
    //     const content = editorRef.current.getContent(); // HTML gốc
    //     const data = {
    //         ...values,
    //         description: content,
    //         images: fileList.map(f => f.url || f.thumbUrl),
    //     };
    //     // gửi data lên API
    // }
    const countWords = (htmlContent) => {
        if (!htmlContent) return 0;

        const plainText = htmlContent
            .replace(/<[^>]*>/g, '')   // bỏ HTML
            .replace(/&nbsp;/g, ' ')
            .trim();

        return plainText
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length;
    };

    const handleFinish = async (values) => {
        try {
            // Lấy HTML gốc từ editor
            const content = editorRef.current ? editorRef.current.getContent() : description || '';
            
            const wordCount = countWords(content);

            if (wordCount < 50) {
                message.error('Mô tả phải có ít nhất 50 từ');
                return;
            }


            console.log('FileList before processing:', fileList); // Debug log

            // Tách fileList thành 2 nhóm: existing urls và new files cần upload
            const existingUrls = [];
            const newFiles = [];

            (fileList || []).forEach(f => {
                console.log('Processing file:', f); // Debug log

                // Check if this is a base64 image or blob URL
                if ((f.url && f.url.startsWith('data:image')) || (f.url && f.url.startsWith('blob:'))) {
                    // This is a base64 or blob URL preview, check if it has the original file
                    if (f.originFileObj) {
                        // If it has originFileObj, use that for upload
                        console.log('Found file with originFileObj, adding to newFiles:', f.uid);
                        newFiles.push(f.originFileObj);
                    } else {
                        // This is just a preview, skip it
                        console.log('Skipping base64/blob preview without originFileObj:', f.uid);
                    }
                } else if (f.url && !f.url.startsWith('http')) {
                    // Local blob URL, use originFileObj if available
                    if (f.originFileObj) {
                        console.log('Found local URL with originFileObj, adding to newFiles:', f.uid);
                        newFiles.push(f.originFileObj);
                    } else {
                        console.log('Local URL without originFileObj, skipping:', f.url);
                    }
                } else if (f.url && f.url.startsWith('http')) {
                    // This is an existing HTTP URL, add to existingUrls
                    console.log('Adding existing HTTP URL:', f.url);
                    existingUrls.push(f.url);
                } else if (f.thumbUrl && f.thumbUrl.startsWith('http')) {
                    console.log('Adding existing thumb URL:', f.thumbUrl);
                    existingUrls.push(f.thumbUrl);
                } else if (f.originFileObj) {
                    // ảnh mới từ client cần upload
                    console.log('Adding new file from originFileObj:', f.originFileObj.name);
                    newFiles.push(f.originFileObj);
                } else {
                    console.log('Skipping file with no originFileObj and no valid URL:', f);
                }
            });

            console.log('New files to upload:', newFiles); // Debug log
            console.log('Existing URLs to keep:', existingUrls); // Debug log

            // Nếu có ảnh mới => upload lên server
            let uploadedUrls = [];
            if (newFiles.length > 0) {
                const formData = new FormData();
                newFiles.forEach(file => {
                    // Validate file before adding to form data
                    if (file instanceof File) {
                        console.log('Adding file to FormData:', file.name);
                        formData.append('images', file);
                    } else {
                        console.error('Invalid file object:', file);
                    }
                });

                if (formData.getAll('images').length > 0) {
                    console.log('Uploading', formData.getAll('images').length, 'files'); // Debug log
                    // requestUploadImages trả về object chứa mảng images (theo chuẩn bạn dùng ở admin)
                    const res = await requestUploadImages(formData);
                    console.log('Upload response:', res); // Debug log
                    // bảo đảm lấy mảng URL đúng key (thông thường res.images)
                    uploadedUrls = (res && (res.images || res.data?.images || res.urls || res.data?.urls)) || [];
                    console.log('Uploaded URLs:', uploadedUrls); // Debug log
                }
            }

            // Kết hợp url cũ + url mới (giữ thứ tự: existing trước, mới sau)
            const images = [...existingUrls, ...uploadedUrls];
            console.log('Final images array:', images); // Debug log

            // Build the address object according to the new schema
            const selectedProvinceData = provinces.find(p => p.Code === values.provinceCode);
            const selectedWardData = wards.find(w => w.Code === values.wardCode);

            // Construct full address
            const provinceName = selectedProvinceData ? selectedProvinceData.Name : '';
            const wardName = selectedWardData ? selectedWardData.Name : '';
            const fullAddress = `${values.street}, ${wardName}, ${provinceName}`;

            // Basic coordinates - in a real implementation you might want to use a geocoding service
            // For now, I'll use a default coordinate or you can integrate with Google Geocoding API
            const addressData = {
                provinceCode: values.provinceCode,
                wardCode: values.wardCode,
                street: values.street,
                fullAddress: fullAddress,
                coordinates: {
                    lat: 21.028511, // Default latitude (Hanoi), should be updated with real coordinates
                    lng: 105.804817 // Default longitude (Hanoi), should be updated with real coordinates
                }
            };

            // Build data gửi về parent (ManagerPost) with new address structure
            const data = {
                ...values,
                address: addressData, // Use the new address structure
                description: content,
                images,
            };

            // Remove the individual address fields as they're now part of the address object
            delete data.provinceCode;
            delete data.wardCode;
            delete data.street;

            // Khi chỉnh sửa bài viết, không gửi duration và dateEnd (chỉ dùng khi gia hạn)
            if (isEditMode) {
                delete data.duration;
                delete data.dateEnd;
            }

            // Gọi parent handler (ManagerPost sẽ phân biệt create/update)
            onFinish && onFinish(data);
        } catch (error) {
            console.error('Error in handleFinish:', error);
            message.error('Có lỗi khi xử lý ảnh hoặc gửi dữ liệu. Vui lòng thử lại.');
        }
    };


    const handleCancel = () => {
        form.resetFields();
        setFileList([]);
        setDescription('');
        setEstimatedCost(0);
        onCancel();
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        // Clean up previous object URLs to prevent memory leaks
        fileList.forEach(file => {
            if (file.preview && file.preview.startsWith('blob:')) {
                URL.revokeObjectURL(file.preview);
            }
        });

        // Filter out base64 images and only keep file objects or valid URLs
        const filteredFileList = newFileList.map(file => {
            // If the file has a base64 URL, try to preserve the original file object
            if (file.originFileObj) {
                return file; // Keep the original file object
            } else if (file.url && file.url.startsWith('data:image')) {
                // If it's a base64 URL without originFileObj, it might be preview only
                return file;
            }
            return file;
        });
        setFileList(filteredFileList);
    };

    // Handler for AutoComplete search input change
    const handleLocationSearch = (searchText) => {
        setValueSearch(searchText);
    };

    // Handler for selecting an item from AutoComplete
    const handleLocationSelect = (selectedValue) => {
        form.setFieldsValue({ location: selectedValue });
        setMapQuery(selectedValue);
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Title level={5}>Thông tin cơ bản</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Ví dụ: Phòng trọ giá rẻ gần DH Bách Khoa" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="price"
                        label="Giá (VNĐ/tháng)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Ví dụ: 2,500,000"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <div style={{ width: '100%' }}>
                <Editor
                    apiKey="s47q599oza76qz42dpdae87bi55j97jambw32j8opwh7ygrl"  // Free API key
                    init={{
                        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                        height: 400,
                        menubar: false,
                        branding: false,
                        image_dimensions: false,
                        image_caption: true,
                        image_advtab: true,
                        images_upload_url: '/api/upload-images',
                        images_upload_handler: async (blobInfo, progress) => new Promise((resolve, reject) => {
                            // Handle image upload manually
                            const formData = new FormData();
                            formData.append('images', blobInfo.blob(), 'image.png');

                            requestUploadImages(formData)
                                .then(response => {
                                    if (response.images && response.images.length > 0) {
                                        resolve(response.images[0]);
                                    } else {
                                        reject('Image upload failed');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error uploading image from editor:', error);
                                    reject('Image upload failed');
                                });
                        }),
                    }}
                    initialValue="Mô tả phòng trọ"
                    onEditorChange={(content, editor) => setDescription(content)}
                    onInit={(evt, editor) => {
                        editorRef.current = editor;
                        setIsEditorReady(true);
                    }}
                />
            </div>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Loại hình"
                        rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
                    >
                        <Select placeholder="Chọn loại hình">
                            <Option value="phong-tro">Phòng trọ</Option>
                            <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                            <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                            <Option value="can-ho-mini">Căn hộ mini</Option>
                            <Option value="o-ghep">Ở ghép</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="area"
                        label="Diện tích (m²)"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 25" />
                    </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin liên hệ</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="username"
                        label="Tên người đăng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đăng' }]}
                    >
                        <Input placeholder="Tên người cho thuê" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại liên hệ"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                    >
                        <Input placeholder="Số điện thoại người đăng" />
                    </Form.Item>
                </Col>
            </Row>

            <Title level={5} style={{ marginTop: 16 }}>Địa chỉ</Title>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="provinceCode"
                        label="Tỉnh/Thành phố"
                        rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                    >
                        <Select
                            placeholder="Chọn tỉnh/thành phố"
                            onChange={(value) => {
                                console.log('Province selected:', value); // Add logging
                                setSelectedProvince(value);
                                setSelectedWard(''); // Reset ward when province changes
                                setWards([]); // Clear wards when province changes
                                form.setFieldsValue({ wardCode: undefined });
                            }}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {provinces.map((province) => (
                                <Option key={province.Code} value={province.Code}>
                                    {province.Name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="wardCode"
                        label="Phường/Xã"
                        rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                    >
                        <Select
                            placeholder={selectedProvince ? "Chọn phường/xã" : "Vui lòng chọn tỉnh thành phố trước"}
                            disabled={!selectedProvince}
                            loading={selectedProvince && wards.length === 0} // Show loading when fetching wards
                            onChange={setSelectedWard}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {wards.map((ward) => (
                                <Option key={ward.Code} value={ward.Code}>
                                    {ward.Name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="street"
                        label="Số nhà và tên đường"
                        rules={[{ required: true, message: 'Vui lòng nhập số nhà và tên đường' }]}
                    >
                        <Input
                            placeholder="Ví dụ: 19 Ngõ Quan Thổ 1"
                            onChange={(e) => setStreetAddress(e.target.value)}
                        />
                    </Form.Item>
                </Col>
            </Row>

            {/* Hidden field to store the full address for the map */}
            <Form.Item name="fullAddress" noStyle>
                <Input style={{ display: 'none' }} />
            </Form.Item>

            <div>
                <h4 style={{ marginBottom: 16 }}>Vị trí & bản đồ</h4>
                <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(selectedProvince && selectedWard ? `${streetAddress}, ${wards.find(w => w.Code === selectedWard)?.Name}, ${provinces.find(p => p.Code === selectedProvince)?.Name}` : 'Vietnam')}&z=15&output=embed`}
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                />
            </div>

            <Divider />

            <Title level={5}>Hình ảnh</Title>
            <Form.Item name="images" >
                <Upload
                    listType="picture-card"
                    multiple
                    beforeUpload={(file) => {
                        // Validate file before adding to the list
                        const isImage = file.type.startsWith('image/');
                        if (!isImage) {
                            message.error('Bạn chỉ có thể upload file ảnh!');
                            return Upload.LIST_IGNORE; // This will prevent the file from being added
                        }

                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) {
                            message.error('Kích thước ảnh phải nhỏ hơn 5MB!');
                            return Upload.LIST_IGNORE; // This will prevent the file from being added
                        }

                        // Don't upload automatically, just add to the list
                        return false;
                    }}
                    fileList={fileList}
                    onChange={handleUploadChange}
                    accept="image/*"
                    maxCount={8}
                    itemRender={(originNode, file, fileList, actions) => {
                        // Ensure that we're not converting images to base64
                        if (file.originFileObj && !file.url && !file.thumbUrl) {
                            // Create a preview URL for the file
                            if (!file.preview && file.originFileObj) {
                                file.preview = URL.createObjectURL(file.originFileObj);
                                file.thumbUrl = file.preview;
                            }
                        }
                        return originNode;
                    }}
                >
                    {fileList.length >= 8 ? null : (
                        <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                        </div>
                    )}
                </Upload>
            </Form.Item>

            <Divider />

            <Title level={5}>Tiện nghi & Tùy chọn</Title>
            <Form.Item name="options">
                <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        {optionLabels.map((label) => (
                            <Col xs={24} sm={12} md={8} key={label}>
                                <Checkbox value={label}>{label}</Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>
            </Form.Item>

            <Divider />

            {/* Ẩn trường loại tin vì tất cả bài đăng đều là tin thường */}
            <Row gutter={24} align="bottom">
                <Col xs={24} md={8}>
                    <Form.Item
                        name="typeNews"
                        initialValue="normal"
                        hidden
                    >
                        <Input value="normal" />
                    </Form.Item>
                </Col>
                {/* Chỉ hiển thị chọn thời gian đăng khi tạo mới, ẩn khi chỉnh sửa */}
                {!isEditMode && (
                    <>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="duration"
                                label="Thời gian đăng"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian đăng' }]}
                            >
                                <Select placeholder="Chọn số ngày">
                                    {durationOptions.map((opt) => (
                                        <Option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8} style={{ paddingBottom: '24px' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Tạm tính (VNĐ)"
                                        value={estimatedCost > 0 ? estimatedCost : '-'}
                                        precision={0}
                                        formatter={(value) =>
                                            typeof value === 'number' ? value.toLocaleString('vi-VN') : value
                                        }
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </>
                )}
            </Row>

            {/* Chỉ hiển thị bảng giá khi tạo mới */}
            {!isEditMode && (
                <div style={{ marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 16 }}>Bảng giá dịch vụ</h4>
                    <Table dataSource={dataSource} columns={columns} pagination={false} size="small" bordered />
                </div>
            )}

            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                    {initialValues ? 'Cập nhật bài viết' : 'Thêm bài viết'}
                </Button>
            </Form.Item>
        </Form>
    );
}

export default AddPostForm;