# Datalytics AI — Turn Raw Data Into Smart Decisions

Datalytics AI is an enterprise-grade, modern web analytics platform. It empowers businesses and data teams to upload raw CSV spreadsheets, explore distributions, perform interactive visual analytics, automatically audit data quality, and converse with an AI Data Analyst grounded in mathematically verified calculations.

---

## 🌟 Key Features

1. **Executive KPI Dashboard**
   - Instant metrics: Total records, numeric columns count, missing cell counts, duplicate row detector, and dataset completeness.
   - Dynamic primary distribution previews and one-click quick actions.

2. **Secure Local CSV Parsing**
   - In-browser RFC-4180 parsing with Papa Parse.
   - Robust type inference (`number`, `string`, `date`, `boolean`).
   - Graceful handling of nulls, delimiters, and malformed files.
   - Strict sandbox: uploaded content is never evaluated as code.

3. **Searchable Data Explorer**
   - Paginated tabular browser with bidirectional column sorting.
   - Column visibility checkboxes and global search.
   - Detailed **Column Statistics Inspector** panel (Min, Max, Sum, Mean, Median, StdDev, IQR Outliers, Top Frequency distributions, and Date spans).

4. **Interactive Multi-Chart Visualizer**
   - Supports Bar Charts, Line Trends, Area Charts, Donut/Pie Charts, and Scatter Plots using Recharts.
   - Configurable dimension (X-axis) and metric (Y-axis).
   - Dynamic metric aggregations: `Sum`, `Average`, `Count`, `Min`, `Max`.
   - **Smart Recommendation Engine**: Recommends optimal chart representations based on column data types.

5. **AI Data Analyst (Grounded & Deterministic)**
   - Conversational chat powered by Google Gemini (`gemini-3.8-flash`).
   - Zero hallucination guarantee: aggregations and calculations are executed deterministically before passing structured metrics to Gemini for business interpretation.
   - Differentiates measured empirical facts from hypotheses.

6. **Automated Data Quality & Cleaning**
   - Dataset Health Score (0 - 100%).
   - Actionable cleaning recipes: Deduplicate records, Impute missing numbers (mean/median), Drop incomplete rows, Trim text whitespace, and Filter extreme outliers.
   - **Safe Transformation Previews**: Inspect exactly which rows will change before applying.
   - **Complete Undo/Reset**: Revert any or all transformations to preserve raw original data.

7. **AI Executive Insights & Briefing**
   - One-click synthesis of Executive Summary, Key Measured Findings, Segment Trends, Data Quality Risks, and Strategic Recommendations.
   - Export briefing as Markdown (`.md`) or copy to clipboard.

8. **Export Capabilities**
   - Download the cleaned, processed dataset as CSV.
   - Download complete statistical summary reports.

9. **Preloaded Synthetic Demo Sales Dataset**
   - Explore immediately with preloaded retail sales data (MacBooks, Phones, Furniture, Office Supplies across North, South, East, West regions).

---

## 🏗️ Architecture

```
├── server.ts                   # Express backend with Gemini API proxy & Vite middlewares
├── src/
│   ├── main.tsx                # Client React entrypoint
│   ├── App.tsx                 # Root layout & view controller
│   ├── types/
│   │   └── data.ts             # Data contracts, statistics, & cleaning types
│   ├── data/
│   │   └── sampleDataset.ts    # Synthetic retail demo dataset
│   ├── utils/
│   │   ├── dataProcessor.ts    # Deterministic calculation engine & CSV parser
│   │   └── cleaningOperations.ts # Previewable data transformations & undo stack
│   └── components/
│       ├── Sidebar.tsx         # Dark navy navigation sidebar
│       ├── Header.tsx          # Sticky navigation & action bar
│       ├── DashboardView.tsx   # KPI cards & health meter
│       ├── DataExplorerView.tsx# Paginated table & column inspector
│       ├── VisualizationsView.tsx # Interactive Recharts workspace
│       ├── AiAnalystView.tsx   # Grounded natural language Q&A
│       ├── DataQualityView.tsx # Health audit & cleaning tools
│       ├── AiInsightsView.tsx  # Executive briefing generator
│       ├── ExportView.tsx      # CSV & Markdown report exporter
│       ├── UploadModal.tsx     # Drag-and-drop CSV upload modal
│       └── CleaningPreviewModal.tsx # Transformation preview modal
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `GEMINI_API_KEY` configured in `.env` (automatically injected in AI Studio environment)

### Development
```bash
# Start server with Vite middleware on port 3000
npm run dev
```

### Production Build
```bash
# Build client assets into /dist
npm run build

# Start production Express server
npm run start
```
