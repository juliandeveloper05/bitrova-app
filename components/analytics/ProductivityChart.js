/**
 * ProductivityChart Component
 * TaskList App - Phase 4 Analytics
 * 
 * SVG-based bar chart for weekly productivity visualization
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const CHART_HEIGHT = 180;
const BAR_PADDING = 4;

const ProductivityChart = ({ 
  data = [], 
  title = 'Weekly Activity',
  valueKey = 'tasksCompleted',
  accentColor,
}) => {
  const { theme, isDarkMode } = useTheme();
  const chartWidth = Dimensions.get('window').width - 48;
  
  const color = accentColor || theme.primary;
  
  // Calculate max value for scaling
  const maxValue = Math.max(1, ...data.map(d => d[valueKey] || 0));
  
  // Bar dimensions
  const barCount = data.length || 7;
  const barWidth = (chartWidth - (barCount * BAR_PADDING * 2)) / barCount;
  const maxBarHeight = CHART_HEIGHT - 40; // Leave room for labels
  
  // Scale function
  const getBarHeight = (value) => {
    return (value / maxValue) * maxBarHeight;
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Grid lines */}
        <Line
          x1={0}
          y1={CHART_HEIGHT - 30}
          x2={chartWidth}
          y2={CHART_HEIGHT - 30}
          stroke={theme.border}
          strokeWidth={1}
        />
        
        {/* Bars and labels */}
        {data.map((item, index) => {
          const barHeight = getBarHeight(item[valueKey] || 0);
          const x = index * (barWidth + BAR_PADDING * 2) + BAR_PADDING;
          const y = CHART_HEIGHT - 30 - barHeight;
          
          return (
            <G key={item.date || index}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.isToday ? color : color + '80'}
              />
              
              {/* Value label */}
              {item[valueKey] > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize={10}
                  fill={theme.textSecondary}
                  textAnchor="middle"
                >
                  {item[valueKey]}
                </SvgText>
              )}
              
              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - 10}
                fontSize={11}
                fill={item.isToday ? color : theme.textSecondary}
                fontWeight={item.isToday ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {item.dayName || 'Day'}
              </SvgText>
            </G>
          );
        })}
      </Svg>
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
});

export default ProductivityChart;
