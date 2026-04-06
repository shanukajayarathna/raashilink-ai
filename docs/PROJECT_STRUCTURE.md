# Project Structure

This project is organized for long-term feature growth without changing the original product idea.

## Top-level frontend layout

- `src/app`
  Application shell and global store setup.
- `src/features`
  Business domains grouped by feature.
- `src/shared`
  Reusable cross-feature code such as layout, API clients, constants, hooks, and utilities.

## Feature domains

- `auth`
  Login, registration, auth services, auth state.
- `dashboard`
  User dashboard page.
- `marketing`
  Public landing page.
- `matchmaking`
  Match recommendation pages, components, and state.
- `horoscope`
  Horoscope views and compatibility components.
- `wedding`
  Wedding dashboard, wedding services, wedding state.
- `budget`
  Budget planner page and budget-specific UI.
- `vendors`
  Vendor marketplace, vendor detail page, vendor portal, vendor UI.
- `chat`
  AI chat page, chat widgets, and chat services.
- `honeymoon`
  Honeymoon listing and destination detail pages.
- `profile`
  User profile pages, photo upload, profile service.
- `admin`
  Admin dashboard and admin-specific components.

## Shared layer

- `src/shared/components`
  Cross-feature UI such as the main layout.
- `src/shared/config`
  Global Axios configuration and request/response behavior.
- `src/shared/hooks`
  Reusable hooks.
- `src/shared/lib`
  Utility functions and shared API client helpers.
- `src/shared/constants`
  Static lists and shared constants.

## Why this structure

- Keeps pages, components, services, and state close to the feature they belong to.
- Makes future implementations easier to scope feature-by-feature.
- Reduces coupling between unrelated modules.
- Fits well for university final project documentation, implementation phases, and team collaboration.
