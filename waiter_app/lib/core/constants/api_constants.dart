import 'package:flutter/foundation.dart';

class ApiConstants {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    }
    // Para mobile (Android Emulator), usamos 10.0.2.2. 
    // Como não podemos importar dart:io no Web, usamos essa lógica simples.
    return 'http://127.0.0.1:8000/api';
  }
}
