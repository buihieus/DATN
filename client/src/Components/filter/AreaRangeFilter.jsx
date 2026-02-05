import React, { useState } from 'react';
import { InputNumber, Space } from 'antd';

const AreaRangeFilter = ({ minArea, maxArea, onMinChange, onMaxChange }) => {
  const [minValue, setMinValue] = useState(minArea);
  const [maxValue, setMaxValue] = useState(maxArea);

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
        Diện tích (m²)
      </label>
      <Space>
        <InputNumber
          placeholder="Diện tích nhỏ nhất"
          value={minValue}
          onChange={handleMinChange}
          style={{ width: '110px' }}
          min={0}
          step={1}
          formatter={value => `${value} m²`}
          parser={value => value.replace(' m²', '')}
        />
        <span style={{ lineHeight: '32px' }}>-</span>
        <InputNumber
          placeholder="Diện tích lớn nhất"
          value={maxValue}
          onChange={handleMaxChange}
          style={{ width: '110px' }}
          min={0}
          step={1}
          formatter={value => `${value} m²`}
          parser={value => value.replace(' m²', '')}
        />
      </Space>
    </div>
  );
};

export default AreaRangeFilter;