import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;
  String? get userName => _user?.name;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.dio.post('/login', data: {
        'email': email,
        'password': password,
      });

      // Assuming API returns { "token": "...", "user": { ... } }
      // Adjust according to actual API response structure
      final token = response.data['token'];
      // Sometimes user data might be nested differently, e.g. response.data['data']['user']
      // For now assuming direct 'user' key or similar structure as per standard Laravel Sanctum examples often used
      // If Sanctum only returns token on simple token creation, we might need to fetch user separately.
      // But typically a login endpoint returns both.
      
      // Let's assume standard response for now.
      if (token != null) {
        await _storage.write(key: 'auth_token', value: token);
        
        // If user info is not in login response, we might need to fetch it.
        // For now, let's try to parse it if present, or fetch it.
        if (response.data['user'] != null) {
           _user = UserModel.fromJson(response.data['user']);
        } else {
           // Fetch user details
           try {
             final userResponse = await _apiService.dio.get('/user');
             _user = UserModel.fromJson(userResponse.data);
           } catch (e) {
             // If fetching user fails, we might still be logged in but without user data?
             // Or fail the login? Let's assume we need user data.
             _errorMessage = 'Failed to load user profile';
             _isLoading = false;
             notifyListeners();
             return false;
           }
        }
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        _errorMessage = 'Invalid credentials';
      } else {
        _errorMessage = e.message ?? 'An error occurred';
      }
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.dio.post('/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    await _storage.delete(key: 'auth_token');
    _user = null;
    notifyListeners();
  }

  Future<void> checkAuth() async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      try {
        final response = await _apiService.dio.get('/user');
        _user = UserModel.fromJson(response.data);
      } catch (e) {
        await _storage.delete(key: 'auth_token');
        _user = null;
      }
    }
    notifyListeners();
  }
}
