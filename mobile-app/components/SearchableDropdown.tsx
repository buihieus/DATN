import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';

interface SearchableDropdownProps {
  data: Array<{ Code: string; Name: string }>;
  placeholder: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  data,
  placeholder,
  selectedValue,
  onValueChange,
  label,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const safeData = Array.isArray(data)
    ? data.filter(
      item =>
        typeof item?.Name === 'string' &&
        typeof item?.Code === 'string'
    )
    : [];

  // Filter data based on search query
  // const filteredData = data.filter(item =>
  //   item.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.Code.toLowerCase().includes(searchQuery.toLowerCase())
  // );
  const filteredData = safeData.filter(item =>
    item.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.Code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected item name
  const selectedItem = data.find(item => item.Code === selectedValue);
  const displayValue = selectedItem ? selectedItem.Name : placeholder;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, disabled && styles.disabledInput]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !selectedValue && styles.placeholderText]}>
          {String(displayValue ?? '')}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={`Tìm kiếm ${label.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.Code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.Code === selectedValue && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.Code);
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    item.Code === selectedValue && styles.selectedOptionText
                  ]}>
                    {String(item?.Name ?? '')}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              keyboardShouldPersistTaps="handled"
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
  },
  inputText: {
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsList: {
    flex: 1,
    marginBottom: 16,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedOptionText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  cancelButton: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '500',
  },
});

export default SearchableDropdown;