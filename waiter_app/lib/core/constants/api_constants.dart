import 'package:flutter/foundation.dart';

class ApiConstants {
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      if (kReleaseMode && !_envBaseUrl.startsWith('https://')) {
        throw StateError('Production build requires HTTPS API_BASE_URL');
      }
      return _envBaseUrl;
    }

    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    }

    // Default to local network IP for physical mobile devices, fallback to emulator if needed
    return 'http://10.0.0.103:8000/api';
  }
}
