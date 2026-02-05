import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { requestGetLocations } from '../../config/request';

const { Option } = Select;

const LocationFilter = ({
  provinceValue,
  districtValue,
  wardValue,
  onProvinceChange,
  onDistrictChange,
  onWardChange
}) => {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]); // Direct wards from province
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    // Load provinces on component mount
    fetchProvinces();
  }, []);

  useEffect(() => {
    // Load wards when province is selected
    if (provinceValue) {
      fetchWards(provinceValue);
    } else {
      setWards([]);
      onWardChange('');
    }
  }, [provinceValue]);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await requestGetLocations();
      setProvinces(response.metadata?.provinces || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchWards = async (provinceCode) => {
    setLoadingWards(true);
    try {
      const response = await requestGetLocations(provinceCode);
      setWards(response.metadata?.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '150px', flex: 1 }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Tỉnh/Thành phố
        </label>
        <Select
          placeholder="Chọn tỉnh/thành"
          value={provinceValue}
          onChange={(value) => {
            onProvinceChange(value);
            onDistrictChange(''); // Reset district when province changes
          }}
          style={{ width: '100%' }}
          loading={loadingProvinces}
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {provinces.map(province => (
            <Option key={province.Code} value={province.Code}>
              {province.Name}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ minWidth: '150px', flex: 1 }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Phường/Xã
        </label>
        <Select
          placeholder="Chọn phường/xã"
          value={wardValue}
          onChange={onWardChange}
          style={{ width: '100%' }}
          loading={loadingWards}
          disabled={!provinceValue}
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {wards.map(ward => (
            <Option key={ward.Code} value={ward.Code}>
              {ward.Name}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default LocationFilter;