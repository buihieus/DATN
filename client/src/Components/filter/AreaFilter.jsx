import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const areaRanges = [
  { value: '', label: 'Tất cả diện tích' },
  { value: 'duoi-20', label: 'Dưới 20m²' },
  { value: 'tu-20-30', label: '20 - 30m²' },
  { value: 'tu-30-50', label: '30 - 50m²' },
  { value: 'tu-50-70', label: '50 - 70m²' },
  { value: 'tu-70-90', label: '70 - 90m²' },
  { value: 'tren-90', label: 'Trên 90m²' }
];

const AreaFilter = ({ value, onChange }) => {
  return (
    <div style={{ minWidth: '200px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        Diện tích
      </label>
      <Select
        placeholder="Chọn diện tích"
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        allowClear
      >
        {areaRanges.map(area => (
          <Option key={area.value} value={area.value}>
            {area.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default AreaFilter;