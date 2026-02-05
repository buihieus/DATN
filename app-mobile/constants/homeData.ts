// Mock data for the home page

// Categories data
export const categories = [
  {
    id: '1',
    name: 'Phòng trọ',
    icon: 'home',
    count: 1200
  },
  {
    id: '2',
    name: 'Nhà nguyên căn',
    icon: 'home-outline',
    count: 450
  },
  {
    id: '3',
    name: 'Chung cư',
    icon: 'cube',
    count: 320
  },
  {
    id: '4',
    name: 'Ở ghép',
    icon: 'people',
    count: 280
  },
  {
    id: '5',
    name: 'Văn phòng',
    icon: 'briefcase',
    count: 150
  }
];

// Featured/Latest rooms data
export const featuredRooms = [
  {
    _id: '1',
    title: 'Phòng trọ sạch đẹp, đầy đủ tiện nghi, ngay trung tâm',
    price: 3500000,
    area: 25,
    address: '45 Nguyễn Văn Cừ',
    district: 'Quận 5',
    city: 'TP.HCM',
    images: ['https://placehold.co/300x200'],
    isFavorite: false,
    amenities: ['wifi', 'máy lạnh', 'ban công', 'nội thất'],
    type: 'phong-tro'
  },
  {
    _id: '2',
    title: 'Nhà nguyên căn 2PN, vị trí đắc địa, gần chợ Bến Thành',
    price: 8500000,
    area: 60,
    address: '78 Lê Lợi',
    district: 'Quận 1',
    city: 'TP.HCM',
    images: ['https://placehold.co/300x200'],
    isFavorite: true,
    amenities: ['wifi', 'ban công', 'nội thất', 'chỗ để xe'],
    type: 'nha-nguyen-can'
  },
  {
    _id: '3',
    title: 'Chung cư mini, an ninh, yên tĩnh, giá hợp lý',
    price: 4200000,
    area: 30,
    address: '123 Pasteur',
    district: 'Quận 3',
    city: 'TP.HCM',
    images: ['https://placehold.co/300x200'],
    isFavorite: false,
    amenities: ['máy lạnh', 'ban công', 'nội thất'],
    type: 'chung-cu'
  },
  {
    _id: '4',
    title: 'Phòng trọ cao cấp, view đẹp, nội thất hiện đại',
    price: 5500000,
    area: 35,
    address: '234 Cách Mạng Tháng 8',
    district: 'Quận 10',
    city: 'TP.HCM',
    images: ['https://placehold.co/300x200'],
    isFavorite: false,
    amenities: ['wifi', 'máy lạnh', 'ban công', 'nội thất', 'máy giặt'],
    type: 'phong-tro'
  },
  {
    _id: '5',
    title: 'Ở ghép tiện nghi, dân trí cao, an ninh tốt',
    price: 1800000,
    area: 15,
    address: '567 Điện Biên Phủ',
    district: 'Bình Thạnh',
    city: 'TP.HCM',
    images: ['https://placehold.co/300x200'],
    isFavorite: false,
    amenities: ['wifi', 'máy lạnh', 'nội thất'],
    type: 'o-ghep'
  }
];

// Popular locations data
export const popularLocations = [
  {
    id: '1',
    name: 'Quận 1',
    count: 320
  },
  {
    id: '2',
    name: 'Quận 3',
    count: 280
  },
  {
    id: '3',
    name: 'Quận 5',
    count: 250
  },
  {
    id: '4',
    name: 'Bình Thạnh',
    count: 210
  },
  {
    id: '5',
    name: 'Gò Vấp',
    count: 190
  }
];

// Filters data
export const filterOptions = {
  priceRanges: [
    { id: '1', label: 'Dưới 2 triệu', min: 0, max: 2000000 },
    { id: '2', label: '2 - 3 triệu', min: 2000000, max: 3000000 },
    { id: '3', label: '3 - 5 triệu', min: 3000000, max: 5000000 },
    { id: '4', label: '5 - 8 triệu', min: 5000000, max: 8000000 },
    { id: '5', label: 'Trên 8 triệu', min: 8000000, max: Infinity },
  ],
  areaRanges: [
    { id: '1', label: 'Dưới 20m²', min: 0, max: 20 },
    { id: '2', label: '20 - 30m²', min: 20, max: 30 },
    { id: '3', label: '30 - 50m²', min: 30, max: 50 },
    { id: '4', label: 'Trên 50m²', min: 50, max: Infinity },
  ],
  amenities: [
    'wifi', 'máy lạnh', 'ban công', 'nội thất', 'chỗ để xe', 'máy giặt', 'nấu ăn', 'tủ lạnh', 'wc riêng'
  ]
};