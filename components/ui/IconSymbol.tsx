// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons and MaterialCommunityIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See MaterialCommunityIcons here: https://materialdesignicons.com/
  'house': { iconSet: 'MaterialCommunityIcons', name: 'home-outline' },
  'bookmark': { iconSet: 'MaterialIcons', name: 'bookmark-outline' },
  'person-outline': { iconSet: 'MaterialIcons', name: 'person-outline' },
  'chevron.left.forwardslash.chevron.right': { iconSet: 'MaterialIcons', name: 'code' },
  'chevron.right': { iconSet: 'MaterialIcons', name: 'chevron-right' },
  'account-circle': { iconSet: 'MaterialCommunityIcons', name: 'account-circle' },
  'settings': { iconSet: 'MaterialCommunityIcons', name: 'settings' },
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    { iconSet: 'MaterialIcons' | 'MaterialCommunityIcons'; name: string }
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons or MaterialCommunityIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons or MaterialCommunityIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const mapping = MAPPING[name];
  if (!mapping) {
    return null;
  }

  const { iconSet, name: iconName } = mapping;

  if (iconSet === 'MaterialIcons') {
    return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
  } else if (iconSet === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons color={color} size={size} name={iconName} style={style} />;
  }

  return null;
}
