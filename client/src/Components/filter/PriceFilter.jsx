import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const priceRanges = [
  { value: '', label: 'Tất cả giá' },
  { value: 'duoi-1-trieu', label: 'Dưới 1 triệu' },
  { value: 'tu-1-2-trieu', label: '1 - 2 triệu' },
  { value: 'tu-2-3-trieu', label: '2 - 3 triệu' },
  { value: 'tu-3-5-trieu', label: '3 - 5 triệu' },
  { value: 'tu-5-7-trieu', label: '5 - 7 triệu' },
  { value: 'tu-7-10-trieu', label: '7 - 10 triệu' },
  { value: 'tu-10-15-trieu', label: '10 - 15 triệu' },
  { value: 'tren-15-trieu', label: 'Trên 15 triệu' }
];

const PriceFilter = ({ value, onChange }) => {
  return (
    <div style={{ minWidth: '200px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        Khoảng giá
      </label>
      <Select
        placeholder="Chọn khoảng giá"
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        allowClear
      >
        {priceRanges.map(price => (
          <Option key={price.value} value={price.value}>
            {price.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default PriceFilter;