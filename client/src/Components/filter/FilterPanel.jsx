import React, { useState, useRef } from 'react';
import { Button, Space, Collapse } from 'antd';
import { FilterOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';

import CategoryFilter from './CategoryFilter';
import LocationFilter from './LocationFilter';
import PriceFilter from './PriceFilter';
import AreaFilter from './AreaFilter';
import OptionsFilter from './OptionsFilter';
import PriceRangeFilter from './PriceRangeFilter';
import AreaRangeFilter from './AreaRangeFilter';

import styles from './FilterPanel.module.scss';
import classNames from 'classnames/bind';

const { Panel } = Collapse;
const cx = classNames.bind(styles);

const FilterPanel = ({ onFilterChange, initialFilters = {}, applyImmediately = false }) => {
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    province: initialFilters.province || '',
    district: initialFilters.district || '',
    ward: initialFilters.ward || '',
    price: initialFilters.price || '',
    area: initialFilters.area || '',
    gia_tu: initialFilters.gia_tu || '',
    gia_den: initialFilters.gia_den || '',
    dien_tich_tu: initialFilters.dien_tich_tu || '',
    dien_tich_den: initialFilters.dien_tich_den || '',
    options: initialFilters.options || []
  });

  // Use ref to store current filter values to avoid stale closure in setTimeout
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [showFilters, setShowFilters] = useState(true);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };
      console.log('FilterPanel - Filter changed:', filterType, '=', value);
      console.log('FilterPanel - New filters state:', newFilters);
      return newFilters;
    });

    // Apply filters immediately if applyImmediately is true
    // Defer the state update to avoid updating parent component during render
    if (applyImmediately) {
      setTimeout(() => {
        // Use the ref to get the latest filter values
        const currentFilters = { ...filtersRef.current, [filterType]: value };
        // Remove empty values to clean up the request
        const cleanedFilters = { ...currentFilters };
        Object.keys(cleanedFilters).forEach(key => {
          if (cleanedFilters[key] === '' || cleanedFilters[key] === null || cleanedFilters[key] === undefined ||
              (Array.isArray(cleanedFilters[key]) && cleanedFilters[key].length === 0)) {
              delete cleanedFilters[key];
          }
        });

        // Only trigger onFilterChange if there are actual filters to apply
        if (Object.keys(cleanedFilters).length > 0) {
          console.log('FilterPanel - Applying filters immediately (cleaned):', cleanedFilters);
          onFilterChange(cleanedFilters);
        } else {
          console.log('FilterPanel - Skipping filter update (no filters to apply)');
        }
      }, 0);
    }
  };

  const handlePriceRangeChange = (minValue, maxValue) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        gia_tu: minValue,
        gia_den: maxValue
      };
      console.log('FilterPanel - Price range changed:', minValue, '-', maxValue);
      console.log('FilterPanel - New filters state:', newFilters);
      return newFilters;
    });

    // Apply filters immediately if applyImmediate is true
    // Defer the state update to avoid updating parent component during render
    if (applyImmediately) {
      setTimeout(() => {
        const newFilters = {
          ...filtersRef.current,
          gia_tu: minValue,
          gia_den: maxValue
        };
        // Remove empty values to clean up the request
        const cleanedFilters = { ...newFilters };
        Object.keys(cleanedFilters).forEach(key => {
          if (cleanedFilters[key] === '' || cleanedFilters[key] === null || cleanedFilters[key] === undefined ||
              (Array.isArray(cleanedFilters[key]) && cleanedFilters[key].length === 0)) {
              delete cleanedFilters[key];
          }
        });

        // Only trigger onFilterChange if there are actual filters to apply
        if (Object.keys(cleanedFilters).length > 0) {
          console.log('FilterPanel - Applying filters immediately (cleaned):', cleanedFilters);
          onFilterChange(cleanedFilters);
        } else {
          console.log('FilterPanel - Skipping filter update (no filters to apply)');
        }
      }, 0);
    }
  };

  const handleAreaRangeChange = (minValue, maxValue) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        dien_tich_tu: minValue,
        dien_tich_den: maxValue
      };
      console.log('FilterPanel - Area range changed:', minValue, '-', maxValue);
      console.log('FilterPanel - New filters state:', newFilters);
      return newFilters;
    });

    // Apply filters immediately if applyImmediately is true
    // Defer the state update to avoid updating parent component during render
    if (applyImmediately) {
      setTimeout(() => {
        const newFilters = {
          ...filtersRef.current,
          dien_tich_tu: minValue,
          dien_tich_den: maxValue
        };
        // Remove empty values to clean up the request
        const cleanedFilters = { ...newFilters };
        Object.keys(cleanedFilters).forEach(key => {
          if (cleanedFilters[key] === '' || cleanedFilters[key] === null || cleanedFilters[key] === undefined ||
              (Array.isArray(cleanedFilters[key]) && cleanedFilters[key].length === 0)) {
              delete cleanedFilters[key];
          }
        });
        // Only trigger onFilterChange if there are actual filters to apply
        if (Object.keys(cleanedFilters).length > 0) {
          console.log('FilterPanel - Applying filters immediately (cleaned):', cleanedFilters);
          onFilterChange(cleanedFilters);
        } else {
          console.log('FilterPanel - Skipping filter update (no filters to apply)');
        }
      }, 0);
    }
  };

  const handleApplyFilters = () => {
    // Remove empty values to clean up the request
    const cleanedFilters = { ...filters };
    Object.keys(cleanedFilters).forEach(key => {
      if (cleanedFilters[key] === '' || cleanedFilters[key] === null || cleanedFilters[key] === undefined ||
          (Array.isArray(cleanedFilters[key]) && cleanedFilters[key].length === 0)) {
          delete cleanedFilters[key];
      }
    });

    console.log('FilterPanel - Applying filters (cleaned):', cleanedFilters);

    // Notify parent with the filters
    onFilterChange(cleanedFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      category: '',
      province: '',
      district: '',
      ward: '',
      price: '',
      area: '',
      gia_tu: '',
      gia_den: '',
      dien_tich_tu: '',
      dien_tich_den: '',
      options: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className={cx('filter-panel')}>
      <div className={cx('filter-header')}>
        <h3 className={cx('filter-title')}>
          <FilterOutlined /> Bộ lọc tìm kiếm
        </h3>
        <Button
          type="link"
          onClick={() => setShowFilters(!showFilters)}
          className={cx('toggle-button')}
        >
          {showFilters ? 'Ẩn' : 'Hiện'} bộ lọc
        </Button>
      </div>

      {showFilters && (
        <div className={cx('filter-content')}>
          <div className={cx('filter-row')}>
            <CategoryFilter
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
            />
            <LocationFilter
              provinceValue={filters.province}
              districtValue={filters.district}
              wardValue={filters.ward}
              onProvinceChange={(value) => handleFilterChange('province', value)}
              onDistrictChange={(value) => handleFilterChange('district', value)}
              onWardChange={(value) => handleFilterChange('ward', value)}
            />
          </div>

          <div className={cx('filter-row')}>
            <PriceFilter
              value={filters.price}
              onChange={(value) => handleFilterChange('price', value)}
            />
            <AreaFilter
              value={filters.area}
              onChange={(value) => handleFilterChange('area', value)}
            />
          </div>

          {/* Advanced range filters - collapsible */}
          {/* <Collapse
            ghost
            items={[
              {
                key: '1',
                label: 'Lọc nâng cao (Giá & Diện tích)',
                children: (
                  <div className={cx('filter-row')}>
                    <PriceRangeFilter
                      minPrice={filters.gia_tu}
                      maxPrice={filters.gia_den}
                      onMinChange={(value) => handlePriceRangeChange(value, filters.gia_den)}
                      onMaxChange={(value) => handlePriceRangeChange(filters.gia_tu, value)}
                    />
                    <AreaRangeFilter
                      minArea={filters.dien_tich_tu}
                      maxArea={filters.dien_tich_den}
                      onMinChange={(value) => handleAreaRangeChange(value, filters.dien_tich_den)}
                      onMaxChange={(value) => handleAreaRangeChange(filters.dien_tich_tu, value)}
                    />
                  </div>
                ),
              },
            ]}
          /> */}

          <div className={cx('filter-row', 'options-row')}>
            <OptionsFilter
              value={filters.options}
              onChange={(value) => handleFilterChange('options', value)}
            />
          </div>

          <div className={cx('filter-actions')}>
            <Space>
              <Button type="primary" onClick={handleApplyFilters}>
                Áp dụng
              </Button>
              <Button onClick={handleResetFilters}>
                <ReloadOutlined /> Đặt lại
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;