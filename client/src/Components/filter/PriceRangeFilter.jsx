import React, { useState } from 'react';
import { InputNumber, Space } from 'antd';

const PriceRangeFilter = ({ minPrice, maxPrice, onMinChange, onMaxChange }) => {
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);

  const handleMinChange = (value) => {
    setMinValue(value);
    if (onMinChange) onMinChange(value);
  };

  const handleMaxChange = (value) => {
    setMaxValue(value);
    if (onMaxChange) onMaxChange(value);
  };

  return (
    <div style={{ minWidth: '250px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        Khoảng giá (VNĐ)
      </label>
      <Space>
        <InputNumber
          placeholder="Giá thấp nhất"
          value={minValue}
          onChange={handleMinChange}
          style={{ width: '110px' }}
          min={0}
          step={100000} // 100k increments
          formatter={value => `₫${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\₫|,/g, '')}
        />
        <span style={{ lineHeight: '32px' }}>-</span>
        <InputNumber
          placeholder="Giá cao nhất"
          value={maxValue}
          onChange={handleMaxChange}
          style={{ width: '110px' }}
          min={0}
          step={100000} // 100k increments
          formatter={value => `₫${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\₫|,/g, '')}
        />
      </Space>
    </div>
  );
};

export default PriceRangeFilter;