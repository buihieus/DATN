import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { requestGetPosts, requestGetFilteredPosts } from './config/request';
import CardBody from './Components/CardBody/CardBody';
import { useSearchParams, useParams } from 'react-router-dom';

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const { province, district, ward } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        // Log all search params to see what's being passed
        console.log('All search params:', Object.fromEntries([...searchParams]));
        console.log('Route params:', { province, district, ward });

        // Build parameters for the advanced search endpoint
        const requestParams = {};

        // If we have route parameters, they take precedence over query parameters for location
        if (province) {
          requestParams.cityCode = province; // Use route params as primary location
        } else {
          // Otherwise, fall back to query params
          const queryProvince = searchParams.get('province');
          if (queryProvince && queryProvince !== '') {
            requestParams.cityCode = queryProvince;
          }
        }

        if (ward) {
          requestParams.wardCode = ward; // Use route params as primary location
        } else {
          // Otherwise, fall back to query params
          const queryWard = searchParams.get('ward');
          if (queryWard && queryWard !== '') {
            requestParams.wardCode = queryWard;
          }
        }

        // Category filter
        const category = searchParams.get('category');
        if (category && category !== '') {
          requestParams.category = category;
        }

        // Price range filter - convert to minPrice/maxPrice format for advanced search
        const priceRange = searchParams.get('priceRange') || searchParams.get('price'); // Keep original param names

        // Get direct price parameters (for URL-style format)
        const giaTuParam = searchParams.get('gia_tu');
        const giaDenParam = searchParams.get('gia_den');

        // Process direct price parameters first (they take precedence)
        let finalGiaTu = null;
        let finalGiaDen = null;

        if (giaTuParam !== null && !isNaN(giaTuParam) && Number(giaTuParam) >= 0) {
          finalGiaTu = Number(giaTuParam);
          requestParams.gia_tu = finalGiaTu;
        }

        if (giaDenParam !== null && !isNaN(giaDenParam) && Number(giaDenParam) >= 0) {
          finalGiaDen = Number(giaDenParam);
          requestParams.gia_den = finalGiaDen;
        }

        // If direct parameters are not provided, try to convert from range format
        if ((finalGiaTu === null || finalGiaDen === null) && priceRange && priceRange !== '') {
          // Convert price range to minPrice/maxPrice based on the priceRange value
          const priceRanges = {
            'duoi-1-trieu': { minPrice: 0, maxPrice: 1000000 },
            'tu-1-2-trieu': { minPrice: 1000000, maxPrice: 2000000 },
            'tu-2-3-trieu': { minPrice: 2000000, maxPrice: 3000000 },
            'tu-3-5-trieu': { minPrice: 3000000, maxPrice: 5000000 },
            'tu-5-7-trieu': { minPrice: 5000000, maxPrice: 7000000 },
            'tu-7-10-trieu': { minPrice: 7000000, maxPrice: 10000000 },
            'tu-10-15-trieu': { minPrice: 10000000, maxPrice: 15000000 },
            'tren-15-trieu': { minPrice: 15000000, maxPrice: undefined },
          };

          if (priceRanges[priceRange]) {
            const range = priceRanges[priceRange];
            // Only set if not already set by direct parameters
            if (finalGiaTu === null && range.minPrice !== undefined) {
              requestParams.minPrice = range.minPrice;
              requestParams.gia_tu = range.minPrice;
            }
            if (finalGiaDen === null && range.maxPrice !== undefined) {
              requestParams.maxPrice = range.maxPrice;
              requestParams.gia_den = range.maxPrice;
            }
          }
        }

        // Area range filter - convert to minArea/maxArea for advanced search
        const areaRange = searchParams.get('areaRange') || searchParams.get('area'); // Keep original param names

        // Get direct area parameters (for URL-style format)
        const dienTichTuParam = searchParams.get('dien_tich_tu');
        const dienTichDenParam = searchParams.get('dien_tich_den');

        // Process direct area parameters first (they take precedence)
        let finalDienTichTu = null;
        let finalDienTichDen = null;

        if (dienTichTuParam !== null && !isNaN(dienTichTuParam) && Number(dienTichTuParam) >= 0) {
          finalDienTichTu = Number(dienTichTuParam);
          requestParams.dien_tich_tu = finalDienTichTu;
        }

        if (dienTichDenParam !== null && !isNaN(dienTichDenParam) && Number(dienTichDenParam) >= 0) {
          finalDienTichDen = Number(dienTichDenParam);
          requestParams.dien_tich_den = finalDienTichDen;
        }

        // If direct parameters are not provided, try to convert from range format
        if ((finalDienTichTu === null || finalDienTichDen === null) && areaRange && areaRange !== '') {
          // Convert area range to minArea/maxArea based on the areaRange value
          const areaRanges = {
            'duoi-20': { minArea: 0, maxArea: 20 },
            'tu-20-30': { minArea: 20, maxArea: 30 },
            'tu-30-50': { minArea: 30, maxArea: 50 },
            'tu-50-70': { minArea: 50, maxArea: 70 },
            'tu-70-90': { minArea: 70, maxArea: 90 },
            'tren-90': { minArea: 90, maxArea: undefined },
          };

          if (areaRanges[areaRange]) {
            const range = areaRanges[areaRange];
            // Only set if not already set by direct parameters
            if (finalDienTichTu === null && range.minArea !== undefined) {
              requestParams.minArea = range.minArea;
              requestParams.dien_tich_tu = range.minArea;
            }
            if (finalDienTichDen === null && range.maxArea !== undefined) {
              requestParams.maxArea = range.maxArea;
              requestParams.dien_tich_den = range.maxArea;
            }
          }
        }

        // Amenities filter
        const optionsParam = searchParams.get('options');
        if (optionsParam && optionsParam !== '') {
          try {
            let optionsArray = JSON.parse(decodeURIComponent(optionsParam));
            if (Array.isArray(optionsArray) && optionsArray.length > 0) {
              requestParams.selectedAmenities = optionsArray.join(','); // Convert array to comma-separated string
            }
          } catch (e) {
            // If parsing fails, try as comma-separated string
            requestParams.selectedAmenities = optionsParam;
          }
        }

        // Handle features[] style parameters from URL (e.g., features[0]=value&features[1]=value2)
        const allParams = Object.fromEntries(searchParams);
        const featuresParams = Object.keys(allParams).filter(key =>
          key.startsWith('features[') && key.endsWith(']')
        );

        if (featuresParams.length > 0) {
          // We'll let the backend handle these directly
          featuresParams.forEach(key => {
            requestParams[key] = allParams[key];
          });
        }


        // Type news filter
        const typeNews = searchParams.get('typeNews');
        if (typeNews && typeNews !== '') {
          requestParams.typeNews = typeNews;
        }

        // Pagination
        requestParams.page = searchParams.get('page') || 1;
        requestParams.limit = 12;

        // Log the parameters being sent to the API endpoint
        console.log('Requesting params for advanced search:', requestParams);

        // Call the advanced search API endpoint instead of the original getPosts
        try {
          const response = await requestGetFilteredPosts(requestParams);
          console.log('Advanced search response:', response);

          // Extract posts from the response metadata
          setResults(response.metadata || []);
        } catch (advancedSearchError) {
          console.error('Error with advanced search, falling back to regular search:', advancedSearchError);

          // Fallback to regular search API if advanced search fails
          const fallbackParams = {};

          // Map back our advanced params to regular params
          if (requestParams.cityCode) fallbackParams.province = requestParams.cityCode;
          if (requestParams.wardCode) fallbackParams.ward = requestParams.wardCode;
          if (requestParams.category) fallbackParams.category = requestParams.category;
          if (requestParams.typeNews) fallbackParams.typeNews = requestParams.typeNews;

          // For price and area, we'll use the original format
          const originalPriceRange = searchParams.get('priceRange') || searchParams.get('price');
          if (originalPriceRange) fallbackParams.priceRange = originalPriceRange;

          const originalAreaRange = searchParams.get('areaRange') || searchParams.get('area');
          if (originalAreaRange) fallbackParams.areaRange = originalAreaRange;

          if (optionsParam) fallbackParams.options = optionsParam;

          fallbackParams.page = searchParams.get('page') || 1;
          fallbackParams.limit = 12;

          console.log('Falling back to regular search with params:', fallbackParams);

          const response = await requestGetPosts(fallbackParams);
          setResults(response.metadata.posts || response.metadata || []);
        }
      } catch (error) {
        console.error('Error fetching filtered results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams, province, district, ward]);

  return (
    <div style={{ padding: '100px 20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Kết quả tìm kiếm</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Đang tải kết quả...</p>
        </div>
      ) : (
        <div>
          <p>Có {results.length} kết quả phù hợp với bộ lọc của bạn</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {results.map(post => (
              <CardBody key={post._id} post={post} />
            ))}
          </div>
          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              <p>Không tìm thấy kết quả nào phù hợp với bộ lọc của bạn</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;