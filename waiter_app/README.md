# waiter_app

Waiter application for Pedido Feito 2.0.

## Run

From the `waiter_app` directory:

- `flutter pub get`
- `flutter run -d web-server --web-hostname=127.0.0.1 --web-port=3000`

The default Flutter entrypoint (`lib/main.dart`) now boots the waiter app.

## Notes

- The old customer digital menu flow was removed from this Flutter app.
- For production mobile targets, keep using the waiter entrypoint currently wired by `lib/main.dart`.
