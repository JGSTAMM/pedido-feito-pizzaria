
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/core/widgets/glass_card.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final t = ref.watch(translationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: Stack(
        children: [
          // Background Glows
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
              ),
            ),
          ),
          
          SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 2),

                // ─── Logo / Icon ───
                GlassCard(
                  borderRadius: BorderRadius.circular(32),
                  opacity: 0.1,
                  child: Container(
                    width: 120,
                    height: 120,
                    padding: const EdgeInsets.all(24),
                    child: const Center(
                      child: Text('🍕', style: TextStyle(fontSize: 56)),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // ─── Título ───
                Text(
                  t['welcome_title']!.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    color: const Color(0xFF8B5CF6),
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4.0,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  t['welcome_subtitle']!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1.5,
                    fontFamily: 'Outfit',
                    height: 0.9,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  t['welcome_tagline']!,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w400,
                    fontFamily: 'Inter',
                  ),
                ),

                const Spacer(flex: 2),

                // ─── Seletor de Idioma ───
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: GlassCard(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Text(
                            t['welcome_select_lang']!,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.6),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              // Português
                              Expanded(
                                child: _LangButton(
                                  label: t['welcome_btn_pt']!,
                                  isSelected: locale == AppLocale.pt,
                                  onTap: () => ref.read(localeProvider.notifier).state = AppLocale.pt,
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Español
                              Expanded(
                                child: _LangButton(
                                  label: t['welcome_btn_es']!,
                                  isSelected: locale == AppLocale.es,
                                  onTap: () => ref.read(localeProvider.notifier).state = AppLocale.es,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const Spacer(),

                // ─── Botão Entrar ───
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      height: 64,
                      child: ElevatedButton(
                        onPressed: () => context.go('/menu'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          t['welcome_enter']!,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // ─── Status aberto ───
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      t['welcome_open']!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.4),
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LangButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _LangButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B5CF6) : Colors.white.withValues(alpha: 0.1),
            width: 1.5,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 15,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.5),
            ),
          ),
        ),
      ),
    );
  }
}
