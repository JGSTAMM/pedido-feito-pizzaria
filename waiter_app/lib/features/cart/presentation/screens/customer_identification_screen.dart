import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/features/cart/presentation/providers/customer_provider.dart';

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const _kPrimaryRed = Color(0xFFE53935);
const _kDarkText = Color(0xFF1A1A2E);
const _kSubtleText = Color(0xFF6B7280);
const _kBackground = Color(0xFFF5F5F5);

class CustomerIdentificationScreen extends ConsumerStatefulWidget {
  const CustomerIdentificationScreen({super.key});

  @override
  ConsumerState<CustomerIdentificationScreen> createState() => _CustomerIdentificationScreenState();
}

class _CustomerIdentificationScreenState extends ConsumerState<CustomerIdentificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
    final existing = ref.read(customerProvider);
    if (existing != null) {
      _phoneController.text = existing.phone;
      _nameController.text = existing.name;
      _validateForm();
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _validateForm() {
    final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    final name = _nameController.text.trim();
    setState(() {
      _isValid = phone.length >= 10 && name.length >= 3;
    });
  }

  void _proceed() {
    if (!_isValid) return;
    ref.read(customerProvider.notifier).setCustomer(
      _nameController.text.trim(),
      _phoneController.text,
    );
    context.push('/checkout');
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(translationsProvider);

    return Scaffold(
      backgroundColor: _kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _kDarkText),
          onPressed: () => context.pop(),
        ),
        title: Text(
          t['identify_title']!,
          style: const TextStyle(color: _kDarkText, fontWeight: FontWeight.bold),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),

                // Ícone WhatsApp
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF25D366).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone_android, size: 48, color: Color(0xFF25D366)),
                ),
                const SizedBox(height: 24),

                // Título WhatsApp
                Text(
                  '${t['identify_whatsapp']!}:',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _kDarkText,
                  ),
                ),
                const SizedBox(height: 8),

                // Campo telefone
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(11),
                    _PhoneMaskFormatter(),
                  ],
                  onChanged: (_) => _validateForm(),
                  decoration: InputDecoration(
                    hintText: t['identify_whatsapp_hint']!,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _kPrimaryRed, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  style: const TextStyle(fontSize: 18, letterSpacing: 1.2),
                ),

                const SizedBox(height: 24),

                // Nome
                Text(
                  '${t['identify_name']!}:',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _kDarkText,
                  ),
                ),
                const SizedBox(height: 8),

                TextFormField(
                  controller: _nameController,
                  keyboardType: TextInputType.name,
                  textCapitalization: TextCapitalization.words,
                  onChanged: (_) => _validateForm(),
                  decoration: InputDecoration(
                    hintText: t['identify_name_hint']!,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _kPrimaryRed, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  style: const TextStyle(fontSize: 16),
                ),

                const SizedBox(height: 32),

                // Botão Avançar
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isValid ? _proceed : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isValid ? _kPrimaryRed : Colors.grey[300],
                      foregroundColor: Colors.white,
                      disabledForegroundColor: Colors.grey[500],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: _isValid ? 2 : 0,
                    ),
                    child: Text(
                      t['identify_next']!,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Disclaimer
                Text(
                  t['identify_privacy']!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: _kSubtleText,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Formata telefone como (XX) XXXXX-XXXX
class _PhoneMaskFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final buffer = StringBuffer();

    for (int i = 0; i < digits.length && i < 11; i++) {
      if (i == 0) buffer.write('(');
      if (i == 2) buffer.write(') ');
      if (i == 7) buffer.write('-');
      buffer.write(digits[i]);
    }

    return TextEditingValue(
      text: buffer.toString(),
      selection: TextSelection.collapsed(offset: buffer.length),
    );
  }
}
