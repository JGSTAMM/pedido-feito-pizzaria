import 'package:flutter/material.dart';

class AppTheme {
  // Pizzeria Brand Colors
  static const Color primaryColor = Color(0xFF8B5CF6); // Electric Violet (Light)
  static const Color primaryColorDark = Color(0xFF8B5CF6); // Electric Violet (Dark)
  
  // Zinc Grays
  static const Color darkBackground = Color(0xFF0A0A0B);
  static const Color darkSurface = Color(0xFF18181B); // zinc-900
  static const Color darkSurfaceAlt = Color(0xFF111113);
  
  static const Color lightBackground = Color(0xFFF4F4F5); // zinc-100
  static const Color lightSurface = Color(0xFFFFFFFF);
  
  // Shared text theme overrides
  static const TextTheme _sharedTextTheme = TextTheme(
    headlineLarge: TextStyle(fontFamily: 'Work Sans', fontWeight: FontWeight.bold),
    headlineMedium: TextStyle(fontFamily: 'Work Sans', fontWeight: FontWeight.bold),
    titleLarge: TextStyle(fontFamily: 'Work Sans', fontWeight: FontWeight.w600),
  );

  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    fontFamily: 'Work Sans',
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      brightness: Brightness.light,
      primary: primaryColor,
      surface: lightSurface,
    ),
    scaffoldBackgroundColor: lightBackground,
    textTheme: _sharedTextTheme,
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
      },
    ),
    cardTheme: CardThemeData(
      color: lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE4E4E7)), // zinc-200
      ),
    ),
  );

  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    fontFamily: 'Work Sans',
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColorDark,
      brightness: Brightness.dark,
      primary: primaryColorDark,
      surface: darkSurface,
    ),
    scaffoldBackgroundColor: darkBackground,
    textTheme: _sharedTextTheme,
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
      },
    ),
    cardTheme: CardThemeData(
      color: darkSurfaceAlt,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Colors.white10),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkSurface,
      elevation: 0,
    ),
  );
}
