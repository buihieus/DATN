import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const categories = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'phong-tro', label: 'Phòng trọ' },
  { value: 'nha-nguyen-can', label: 'Nhà nguyên căn' },
  { value: 'can-ho-chung-cu', label: 'Căn hộ chung cư' },
  { value: 'can-ho-mini', label: 'Căn hộ mini' },
  { value: 'o-ghep', label: 'Ở ghép' }
];

const CategoryFilter = ({ value, onChange }) => {
  return (
    <div style={{ minWidth: '200px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        Danh mục
      </label>
      <Select
        placeholder="Chọn danh mục"
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        allowClear
      >
        {categories.map(category => (
          <Option key={category.value} value={category.value}>
            {category.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default CategoryFilter;