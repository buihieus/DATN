import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface CategoryItemProps {
  category: Category;
  onPress: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={category.icon as any} size={24} color="#007AFF" />
      </View>
      <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
      <Text style={styles.count}>{category.count}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  count: {
    fontSize: 11,
    color: '#8E8E93',
  },
});

export default CategoryItem;