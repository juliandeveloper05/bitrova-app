/**
 * CategoryBreakdown Component
 * TaskList App - Phase 4 Analytics
 * 
 * Donut chart showing task distribution by category
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES } from '../../constants/categories';

const CHART_SIZE = 160;
const STROKE_WIDTH = 24;

const CategoryBreakdown = ({ tasks = [], title = 'By Category' }) => {
  const { theme } = useTheme();
  
  // Group tasks by category
  const categoryData = tasks.reduce((acc, task) => {
    const category = task.category || 'personal';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  // Convert to array with percentages
  const total = tasks.length || 1;
  const data = Object.entries(categoryData).map(([key, count]) => ({
    category: key,
    count,
    percentage: Math.round((count / total) * 100),
    color: CATEGORIES.find(c => c.id === key)?.color || '#6B7280',
    label: CATEGORIES.find(c => c.id === key)?.label || key,
  })).sort((a, b) => b.count - a.count);
  
  // SVG donut calculations
  const radius = (CHART_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = CHART_SIZE / 2;
  const centerY = CHART_SIZE / 2;
  
  // Calculate stroke dash arrays for each segment
  let currentOffset = 0;
  const segments = data.map((item) => {
    const strokeLength = (item.percentage / 100) * circumference;
    const segment = {
      ...item,
      strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
      strokeDashoffset: -currentOffset,
    };
    currentOffset += strokeLength;
    return segment;
  });
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      
      <View style={styles.chartRow}>
        {/* Donut Chart */}
        <View style={styles.chartContainer}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            {/* Background circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke={theme.border}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            
            {/* Segments */}
            <G rotation={-90} origin={`${centerX}, ${centerY}`}>
              {segments.map((segment, index) => (
                <Circle
                  key={segment.category}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="round"
                />
              ))}
            </G>
            
            {/* Center text */}
            <SvgText
              x={centerX}
              y={centerY - 8}
              fontSize={24}
              fontWeight="bold"
              fill={theme.text}
              textAnchor="middle"
            >
              {total}
            </SvgText>
            <SvgText
              x={centerX}
              y={centerY + 12}
              fontSize={12}
              fill={theme.textSecondary}
              textAnchor="middle"
            >
              tasks
            </SvgText>
          </Svg>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          {data.slice(0, 4).map((item) => (
            <View key={item.category} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text style={[styles.legendLabel, { color: theme.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.legendValue, { color: theme.textSecondary }]}>
                  {item.count} ({item.percentage}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    marginRight: 16,
  },
  legend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 12,
  },
});

export default CategoryBreakdown;
