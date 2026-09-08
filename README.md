# EasyDay

One runner’s **this Week** of running, produced from one race **Goal** and an optional messy **Log** — shown as a **Board** on mobile-first web. See [CONTEXT.md](CONTEXT.md) for the domain language and [document/PRD.en.md](document/PRD.en.md) for the full PRD.

## Stack

- [Expo](https://expo.dev) SDK 54 · React Native 0.81 · expo-router v6 (file-based routing)
- TypeScript · ESLint (`eslint-config-expo`) · [pnpm](https://pnpm.io) workspaces

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   pnpm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction/).

## Reset to a fresh project

When you're ready, run:

```bash
pnpm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `pnpm start` | Start the Expo dev server |
| `pnpm run android` / `pnpm run ios` / `pnpm run web` | Launch on a platform |
| `pnpm run lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Typecheck |
