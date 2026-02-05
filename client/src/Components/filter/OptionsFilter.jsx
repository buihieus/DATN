import React from 'react';
import { Checkbox } from 'antd';

const options = [
  { value: 'co-gac', label: 'Có gác' },
  { value: 'co-may-lanh', label: 'Có máy lạnh' },
  { value: 'day-du-noi-that', label: 'Đầy đủ nội thất' },
  { value: 'khong-chung-chu', label: 'Không chung chủ' },
  { value: 'gio-giac-tu-do', label: 'Giờ giấc tự do' },
  { value: 'co-ban-cong', label: 'Có ban công' },
  { value: 'co-noi-that', label: 'Có nội thất' },
  { value: 'co-an-ninh', label: 'Có an ninh' },
  { value: 'co-thang-may', label: 'Có thang máy' },
  { value: 'co-ke-bep', label: 'Có kệ bếp' },
  { value: 'co-may-giat', label: 'Có máy giặt' },
  { value: 'co-ham-de-xe', label: 'Có hầm để xe' },
];

const OptionsFilter = ({ value, onChange }) => {
  const handleChange = (checkedValues) => {
    onChange(checkedValues);
  };

  return (
    <div style={{ width: '100%' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        Tiện nghi
      </label>
      <Checkbox.Group 
        value={value} 
        onChange={handleChange}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {options.map(option => (
          <Checkbox key={option.value} value={option.value}>
            {option.label}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </div>
  );
};

export default OptionsFilter;