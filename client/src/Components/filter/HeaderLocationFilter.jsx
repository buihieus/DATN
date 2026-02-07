import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { requestGetLocations } from '../../config/request';
import { EnvironmentOutlined } from '@ant-design/icons';

const { Option } = Select;

const HeaderLocationFilter = ({
  provinceValue,
  districtValue,
  wardValue,
  onProvinceChange,
  onDistrictChange,
  onWardChange
}) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    // Load provinces on component mount
    fetchProvinces();
  }, []);

  useEffect(() => {
    // Load districts when province is selected
    if (provinceValue) {
      fetchDistricts(provinceValue);
    } else {
      setDistricts([]);
      setWards([]);
      onDistrictChange('');
      onWardChange('');
    }
  }, [provinceValue]);

  useEffect(() => {
    // Load wards when district is selected
    if (districtValue) {
      fetchWards(provinceValue, districtValue);
    } else if (provinceValue) {
      // If district is cleared but province remains, load wards from province
      fetchWards(provinceValue);
    } else {
      setWards([]);
      onWardChange('');
    }
  }, [districtValue, provinceValue]);

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

  const fetchDistricts = async (provinceCode) => {
    setLoadingDistricts(true);
    try {
      const response = await requestGetLocations(provinceCode);
      setDistricts(response.metadata?.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchWards = async (provinceCode, districtCode = null) => {
    setLoadingWards(true);
    try {
      const response = await requestGetLocations(provinceCode, districtCode);
      setWards(response.metadata?.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0', width: '100%' }}>
      <div style={{ width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: '#bfbfbf' }}>
          <EnvironmentOutlined />
        </div>
        <Select
          placeholder="Tỉnh/Thành phố"
          value={provinceValue}
          onChange={(value) => {
            onProvinceChange(value);
            onDistrictChange(''); // Reset district when province changes
            onWardChange(''); // Reset ward when province changes
          }}
          style={{ 
            width: '100%', 
            height: '42px',
            borderRadius: '20px 0 0 20px',
            borderRight: 'none',
            paddingLeft: '40px'
          }}
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
      <div style={{ width: '100%' }}>
        <Select
          placeholder="Quận/Huyện"
          value={districtValue}
          onChange={(value) => {
            onDistrictChange(value);
            onWardChange(''); // Reset ward when district changes
          }}
          style={{ 
            width: '100%', 
            height: '42px'
          }}
          loading={loadingDistricts}
          disabled={!provinceValue}
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {districts.map(district => (
            <Option key={district.Code} value={district.Code}>
              {district.Name}
            </Option>
          ))}
        </Select>
      </div>
      <div style={{ width: '100%' }}>
        <Select
          placeholder="Phường/Xã"
          value={wardValue}
          onChange={onWardChange}
          style={{ 
            width: '100%', 
            height: '42px',
            borderRadius: '0 20px 20px 0',
            borderLeft: 'none'
          }}
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

export default HeaderLocationFilter;