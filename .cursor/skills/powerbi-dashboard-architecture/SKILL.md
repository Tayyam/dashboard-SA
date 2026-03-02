This project is a production-grade interactive analytics dashboard.

Data Source:
- Data comes from a local file (data.ts or data.json).
- Data is imported once at app startup.
- No backend calls.
- Architecture must allow easy migration to API later.

1) Global Filtering Engine
- Use Zustand for global filter state.
- All filters must be centralized.
- No component-level filtering allowed.
- All charts derive from the same filtered dataset.

2) Raw Data Rules
- Raw data must never be mutated.
- Always keep original dataset intact.
- Create derived datasets using memoized selectors.

3) Analytics Engine Layer
Build a small client-side analytics engine with:

- applyFilters(data, filters)
- groupBy(data, dimension)
- aggregate(groupedData, metric)
- support dynamic dimensions

Do NOT hardcode chart-specific aggregations.

4) Cross Filtering Behavior
- Clicking on any chart segment updates global filters.
- Clicking again toggles off.
- Multiple filters combine with AND logic.
- Add “Clear All Filters”.

5) Drill-down
- Charts must support hierarchical dimensions.
- Double-click to drill down.
- Add breadcrumb navigation.

6) Performance
- Use useMemo for derived data.
- Avoid unnecessary re-renders.
- Charts re-render only if relevant filter changes.

7) Clean Structure

/core
  filterEngine.ts
  aggregationEngine.ts
  dimensions.ts
  metrics.ts

/store
  useFilters.ts
  useDashboardData.ts

/data
  data.ts

/charts
  ChartWrapper.tsx
  BarChart.tsx
  PieChart.tsx

/dashboard
  KPICards.tsx
  SidebarFilters.tsx

8) UI Behavior
- Selected chart segments must highlight.
- Non-selected values should fade.
- Visual feedback must reflect active filters.

Never duplicate filtering logic.
Never filter inside chart components.
All charts must use the same filtered dataset.