# Codebase Export Index

Generated: 2026-03-06T13:27:55.057Z
Total files exported: 284
Parts: 17

## Incluido
- src/**
- public/**
- tests/**
- .storybook/**
- docs/** (excepto CODEBASE_EXPORT_*)
- package.json, package-lock.json
- vite.config.js, playwright.config.js
- eslint/prettier config
- capacitor.config.*
- supabase config y migrations
- .env.example

## Excluido
- node_modules, dist, storybook-static
- .git, quarantine
- ios/App/App/public/assets (build output)
- .env (secretos)
- archivos binarios (png, woff, etc.)

## Quarantine (solo listado)
```
quarantine/README.md
quarantine/components/ActiveAlertCard.jsx
quarantine/components/ErrorBoundary.jsx
quarantine/components/UserNotRegisteredError.jsx
quarantine/hooks/use-mobile.jsx
quarantine/hooks/useAlertsQuery.js
quarantine/hooks/useDebouncedSave.js
quarantine/hooks/useMapMatch.js
quarantine/lib/PageNotFound.jsx
quarantine/lib/logger.js
quarantine/lib/maps/carUtils.js
quarantine/lib/maps/mapConstants.js
quarantine/lib/maps/mapMarkers.js
quarantine/lib/query-client.js
quarantine/pages.config.js
quarantine/services/alertService.js
```

## File tree

```
.cursor/
  rules/
    waitme.md
.eslintrc.cjs
.github/
  dependabot.yml
  workflows/
    README.md
    ci.yml
  workflows_disabled/
    ci.yml
    codeql.yml
    supabase.yml
.husky/
  _/
    husky.sh
.lintstagedrc.json
.percy.yml
.storybook/
  main.js
  preview.js
  vitest.setup.ts
.vscode/
  launch.json
  settings.json
  tasks.json
CAPACITOR_DEV.md
MAPBOX_SETUP.md
README-FLUJO.md
README.md
capacitor.config.ts
components.json
docs/
  AGENT_ROLES_WAITME.md
  APLICAR_MIGRACION_PROFILES.md
  ARCHITECTURE_SNAPSHOT.md
  AUDITORIA_ARQUITECTURA.md
  AUDITORIA_EXHAUSTIVA_FINAL.md
  AUDITORIA_IMPLEMENTACION_UBER_LEVEL.md
  AUDITORIA_SUPABASE_MIGRACION_CI.md
  AUDITORIA_SUPABASE_PRODUCCION.md
  AUDITORIA_Y_PLAN_MIGRACION_SUPABASE.md
  AUDIT_REPORT.md
  CICD_AUDIT.md
  CI_SETUP.md
  CONTRACT_TESTS.md
  CREATE_MAP_FINAL_BLOCKER_AUDIT.md
  CURSOR_RULES_WAITME.md
  DATA_LAYER.md
  DB_SETUP.md
  ENVIRONMENTS.md
  FINAL_AUDIT.md
  FLUJO_AUTOMATIZADO.md
  MAPBOX_INTERACTION_ROOT_CAUSE.md
  MAPS_MIGRATION_PLAN.md
  MAP_CREATE_AND_SEARCH_INTERACTION_AUDIT.md
  MAP_CREATE_FIX_DELIVERABLE.md
  MAP_CREATE_SCREEN_FORENSIC_AUDIT.md
  MAP_CREATE_SEARCH_EXHAUSTIVE_AUDIT.md
  MAP_DEBUG_CHECKLIST.md
  MAP_INTERACTION_FINAL_FORENSIC_AUDIT.md
  MIGRATION_ALERTS.md
  MIGRATION_CHAT.md
  MIGRATION_NOTIFICATIONS.md
  MIGRATION_STATUS.md
  MIGRATION_TRANSACTIONS.md
  MIGRATION_UPLOADS.md
  OBSERVABILITY.md
  ONE_TIME_GITHUB_CLICKS.md
  PROD_READY.md
  PROJECT_DIAGNOSIS.md
  PROJECT_SOURCE_OF_TRUTH.md
  RENDER_AUDIT_REPORT.md
  REPO_AUDIT_EXHAUSTIVO.md
  SAFE_CHANGE_PROTOCOL.md
  SETUP_SUPABASE_GITHUB_SECRETS.md
  TECH_AUDIT.md
  WAITME_AGENT_CONTEXT.md
  WAITME_DEV_WORKFLOW.md
  WAITME_FAST_WORKFLOW.md
  WAITME_FULL_STABILITY_AUDIT.md
  WAITME_FULL_TECH_AUDIT.md
  WORKFLOWS_WAITME.md
eslint.config.js
force-sync.txt
functions/
  searchGooglePlaces.ts
index.html
ios/
  App/
    App/
      AppDelegate.swift
      Assets.xcassets/
        AppIcon.appiconset/
          Contents.json
        Contents.json
        Splash.imageset/
          Contents.json
      capacitor.config.json
      config.xml
      public/
        cordova.js
        cordova_plugins.js
        index.html
    CapApp-SPM/
      Package.swift
      README.md
      Sources/
        CapApp-SPM/
          CapApp-SPM.swift
jsconfig.json
knip.json
manifest.json
package-lock.json
package.json
playwright.config.js
postcss.config.js
scripts/
  check_migrations_safety.sh
  configure-supabase-secrets.sh
  diagnose-project.js
  export-codebase.js
  github_hardening.sh
  ios-reset.sh
  ios-run.sh
  run-profile-migration.mjs
  ship.sh
  supabase-migrate.sh
src/
  App.jsx
  Layout.jsx
  components/
    AddressAutocompleteInput.jsx
    BottomNav.jsx
    CenterPin.jsx
    CreateMapOverlay.jsx
    CreateMapOverlay.stories.jsx
    DemoFlowManager.jsx
    Header.jsx
    IncomingRequestModal.jsx
    Logo.jsx
    MapZoomControls.jsx
    MapZoomControls.stories.jsx
    MapboxMap.jsx
    SearchMapOverlay.jsx
    SellerLocationTracker.jsx
    StreetSearch.jsx
    WaitMeRequestScheduler.jsx
    cards/
      CreateAlertCard.jsx
      CreateAlertCard.stories.jsx
      MarcoCard.jsx
      UserAlertCard.jsx
    map/
      MapFilters.jsx
      ParkingMap.jsx
    ui/
      accordion.jsx
      alert-dialog.jsx
      alert.jsx
      aspect-ratio.jsx
      avatar.jsx
      badge.jsx
      breadcrumb.jsx
      button.jsx
      calendar.jsx
      card.jsx
      carousel.jsx
      chart.jsx
      checkbox.jsx
      collapsible.jsx
      command.jsx
      context-menu.jsx
      dialog.jsx
      drawer.jsx
      dropdown-menu.jsx
      form.jsx
      hover-card.jsx
      input-otp.jsx
      input.jsx
      label.jsx
      menubar.jsx
      navigation-menu.jsx
      pagination.jsx
      popover.jsx
      progress.jsx
      radio-group.jsx
      resizable.jsx
      scroll-area.jsx
      select.jsx
      separator.jsx
      sheet.jsx
      sidebar.jsx
      skeleton.jsx
      slider.jsx
      sonner.jsx
      switch.jsx
      table.jsx
      tabs.jsx
      textarea.jsx
      toast.jsx
      toaster.jsx
      toggle-group.jsx
      toggle.jsx
      tooltip.jsx
      use-toast.jsx
  config/
    alerts.js
  data/
    alerts.js
    chat.js
    notifications.js
    profiles.js
    transactions.js
    uploads.js
    userLocations.js
  diagnostics/
    MissingEnvScreen.jsx
    SafeModeShell.jsx
  globals.css
  hooks/
    useMyAlerts.js
    useProfileGuard.ts
    useRealtimeAlerts.js
  index.css
  lib/
    AuthContext.jsx
    LayoutContext.jsx
    alertSelectors.js
    alertsQueryKey.js
    finalizedAtStore.js
    geohash.js
    mockNearby.js
    mockOviedoAlerts.js
    profile.ts
    sentry.js
    supabaseClient.js
    transactionEngine.js
    utils.js
    vehicleIcons.js
    waitmeRequests.js
  main.jsx
  pages/
    Chat.jsx
    Chats.jsx
    DevDiagnostics.jsx
    History.jsx
    HistoryBuyerView.jsx
    HistorySellerView.jsx
    Home.jsx
    Login.jsx
    Navigate.jsx
    NotificationSettings.jsx
    Notifications.jsx
    Profile.jsx
    Settings.jsx
  services/
    alertsSupabase.js
    chatSupabase.js
    notificationsSupabase.js
    profilesSupabase.js
    realtime/
      alertsRealtime.js
    transactionsSupabase.js
    uploadsSupabase.js
    userLocationsSupabase.js
  state/
    appStore.js
  stories/
    Button.jsx
    Button.stories.js
    Configure.mdx
    Header.jsx
    Header.stories.js
    Page.jsx
    Page.stories.js
    button.css
    header.css
    page.css
  styles/
    no-zoom.css
  utils/
    carUtils.js
    index.ts
supabase/
  README.md
  config.toml
  functions/
    map-match/
      index.ts
  migrations/
    20260304134200_create_profiles.sql
    20260304150000_create_parking_alerts.sql
    20260304160000_enable_realtime_parking_alerts.sql
    20260304170000_add_geohash_parking_alerts.sql
    20260305120000_fix_profiles_rls_and_trigger.sql
    20260305155000_migrate_parking_alerts_to_core.sql
    20260305160000_core_schema.sql
    20260305170000_add_geohash_and_reservation_trigger.sql
    20260305180000_conversations_last_message.sql
    20260305190000_transactions.sql
    20260305200000_storage_uploads_bucket.sql
    20260305210000_notifications.sql
    20260305220000_profiles_notify_columns.sql
    20260305230000_user_location_updates.sql
    20260306000000_add_vehicle_color_parking_alerts.sql
    20260306100000_add_reserve_policy.sql
    20260306110000_add_reservation_timeout.sql
  seed.sql
tailwind.config.js
tests/
  app.spec.js
  contracts/
    alerts.test.js
    chat.test.js
    notifications.test.js
    transactions.test.js
    uploads.test.js
    userLocations.test.js
  map.spec.js
  profile.spec.js
  smoke/
    create.spec.js
    diagnostics.spec.js
    load.spec.js
    safe-mode.spec.js
tsconfig.json
vercel.json
vite.config.js
vitest.shims.d.ts

```

## Snapshot parts

- [CODEBASE_EXPORT_PART_01.md](docs/CODEBASE_EXPORT_PART_01.md)
- [CODEBASE_EXPORT_PART_02.md](docs/CODEBASE_EXPORT_PART_02.md)
- [CODEBASE_EXPORT_PART_03.md](docs/CODEBASE_EXPORT_PART_03.md)
- [CODEBASE_EXPORT_PART_04.md](docs/CODEBASE_EXPORT_PART_04.md)
- [CODEBASE_EXPORT_PART_05.md](docs/CODEBASE_EXPORT_PART_05.md)
- [CODEBASE_EXPORT_PART_06.md](docs/CODEBASE_EXPORT_PART_06.md)
- [CODEBASE_EXPORT_PART_07.md](docs/CODEBASE_EXPORT_PART_07.md)
- [CODEBASE_EXPORT_PART_08.md](docs/CODEBASE_EXPORT_PART_08.md)
- [CODEBASE_EXPORT_PART_09.md](docs/CODEBASE_EXPORT_PART_09.md)
- [CODEBASE_EXPORT_PART_10.md](docs/CODEBASE_EXPORT_PART_10.md)
- [CODEBASE_EXPORT_PART_11.md](docs/CODEBASE_EXPORT_PART_11.md)
- [CODEBASE_EXPORT_PART_12.md](docs/CODEBASE_EXPORT_PART_12.md)
- [CODEBASE_EXPORT_PART_13.md](docs/CODEBASE_EXPORT_PART_13.md)
- [CODEBASE_EXPORT_PART_14.md](docs/CODEBASE_EXPORT_PART_14.md)
- [CODEBASE_EXPORT_PART_15.md](docs/CODEBASE_EXPORT_PART_15.md)
- [CODEBASE_EXPORT_PART_16.md](docs/CODEBASE_EXPORT_PART_16.md)
- [CODEBASE_EXPORT_PART_17.md](docs/CODEBASE_EXPORT_PART_17.md)
