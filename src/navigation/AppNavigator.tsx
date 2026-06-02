import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MatchSheetScreen } from '../screens/MatchSheetScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Matches"
          component={MatchesScreen}
          options={({ route }) => ({ title: `${route.params.sport} Matches` })}
        />
        <Stack.Screen
          name="MatchSheet"
          component={MatchSheetScreen}
          options={{ title: 'Match Sheet' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
