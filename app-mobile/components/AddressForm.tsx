import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import SearchableDropdown from './SearchableDropdown';
import { postService } from '../services/roomService';

interface AddressFormProps {
  onAddressChange: (address: {
    provinceCode: string;
    wardCode: string;
    street: string;
    fullAddress: string;
  } | null) => void; // Can be null if not all fields are filled
  initialAddress?: {
    provinceCode: string;
    wardCode: string;
    street: string;
    fullAddress: string;
  };
}

const AddressForm: React.FC<AddressFormProps> = ({ onAddressChange, initialAddress }) => {
  const [provinces, setProvinces] = useState<{ Code: string; Name: string }[]>([]);
  const [wards, setWards] = useState<{ Code: string; Name: string }[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(true);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const response = await postService.getLocations();
        setProvinces(response.metadata?.provinces || []);

        // If we have initial address, set the values
        if (initialAddress) {
          setSelectedProvince(initialAddress.provinceCode);
          setStreetAddress(initialAddress.street);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại sau.');
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load wards when province is selected
  useEffect(() => {
    if (selectedProvince) {
      const loadWards = async () => {
        try {
          setLoadingWards(true);
          const response = await postService.getLocations(selectedProvince);
          setWards(response.metadata?.wards || []);

          // If we have initial address, set the ward
          if (initialAddress && initialAddress.provinceCode === selectedProvince) {
            setSelectedWard(initialAddress.wardCode);
          } else {
            // Reset ward when province changes
            setSelectedWard('');
          }
        } catch (error) {
          console.error('Error fetching wards:', error);
          Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã. Vui lòng thử lại sau.');
        } finally {
          setLoadingWards(false);
        }
      };

      loadWards();
    } else {
      setWards([]);
      setSelectedWard('');
    }
  }, [selectedProvince]);

  // Notify parent component when any address field changes
  useEffect(() => {
    if (selectedProvince && selectedWard && streetAddress) {
      const selectedProvinceData = provinces.find(p => p.Code === selectedProvince);
      const selectedWardData = wards.find(w => w.Code === selectedWard);

      const provinceName = selectedProvinceData ? selectedProvinceData.Name : '';
      const wardName = selectedWardData ? selectedWardData.Name : '';
      const fullAddress = `${streetAddress}, ${wardName}, ${provinceName}`;

      onAddressChange({
        provinceCode: selectedProvince,
        wardCode: selectedWard,
        street: streetAddress,
        fullAddress: fullAddress,
      });
    } else {
      // If any field is missing, send null
      onAddressChange(null);
    }
  }, [selectedProvince, selectedWard, streetAddress, provinces, wards]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Địa chỉ</Text>

      <SearchableDropdown
        data={provinces}
        placeholder="Chọn tỉnh/thành phố"
        selectedValue={selectedProvince}
        onValueChange={(value) => {
          setSelectedProvince(value);
          // Ward will be reset automatically due to useEffect
        }}
        label="Tỉnh/Thành phố *"
        disabled={loadingProvinces}
      />

      <SearchableDropdown
        data={wards}
        placeholder={selectedProvince ? "Chọn phường/xã" : "Vui lòng chọn tỉnh thành phố trước"}
        selectedValue={selectedWard}
        onValueChange={setSelectedWard}
        label="Phường/Xã *"
        disabled={!selectedProvince || loadingWards}
      />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Số nhà và tên đường *</Text>
        <TextInput
          style={styles.input}
          value={streetAddress}
          onChangeText={setStreetAddress}
          placeholder="Nhập số nhà và tên đường"
          editable={!!selectedWard}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
});

export default AddressForm;