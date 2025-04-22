import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom tab bar component to ensure proper centering with only three tabs
const CustomTabBar = ({ state, descriptors, navigation }) => {
  // Get safe area insets for proper padding at bottom
  const insets = useSafeAreaInsets();
  
  // Filter out any non-visible tabs (like genres_poll)
  const visibleRoutes = state.routes.filter((route, index) => {
    const { options } = descriptors[route.key];
    return options.tabBarButton !== null && route.name !== 'genres_poll';
  });

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }
    ]}>
      <View style={styles.tabContainer}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          // Find the actual index in the original state routes array
          const routeIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === routeIndex;
          
          // Get icon from descriptor options
          const getTabBarIcon = options.tabBarIcon;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tab}
            >
              {getTabBarIcon && 
                getTabBarIcon({ 
                  focused: isFocused, 
                  color: isFocused ? '#fff' : '#888', 
                  size: 24 
                })
              }
              <Text style={[
                styles.label,
                { color: isFocused ? '#fff' : '#888' }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    width: '100%',
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Precisely center the three tabs
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 30, // Add some padding on the sides
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    maxWidth: 100, // Limit width to ensure centered alignment
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default CustomTabBar;
