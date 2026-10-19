"""
Generate research figures from measured NaviSense benchmark CSV data.

Usage:
  python research/plot_benchmarks.py research/benchmark-results.csv --out research/figures

Only use real exported benchmark trials. The script refuses to create plots from
the empty template, and does not generate placeholder measurements.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt


REQUIRED = {
    "dataset", "graph_nodes", "algorithm", "trial", "runtime_ms",
    "expanded_nodes", "path_cost", "route_found",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", help="CSV containing measured benchmark trials")
    parser.add_argument("--out", default="research/figures", help="Output directory")
    args = parser.parse_args()

    source = Path(args.csv_path)
    data = pd.read_csv(source)
    missing = REQUIRED - set(data.columns)
    if missing:
        raise SystemExit(f"Missing required columns: {', '.join(sorted(missing))}")
    if data.empty or data["runtime_ms"].isna().all():
        raise SystemExit("No measured rows found. Run benchmarks and export actual results first.")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    data["runtime_ms"] = pd.to_numeric(data["runtime_ms"], errors="coerce")
    data["expanded_nodes"] = pd.to_numeric(data["expanded_nodes"], errors="coerce")
    data["graph_nodes"] = pd.to_numeric(data["graph_nodes"], errors="coerce")

    # Median runtime by graph size and algorithm.
    runtime = (
        data.dropna(subset=["runtime_ms", "graph_nodes"])
        .groupby(["graph_nodes", "algorithm"], as_index=False)["runtime_ms"]
        .median()
    )
    if not runtime.empty:
        fig, ax = plt.subplots()
        for name, group in runtime.groupby("algorithm"):
            group = group.sort_values("graph_nodes")
            ax.plot(group["graph_nodes"], group["runtime_ms"], marker="o", label=name)
        ax.set_xlabel("Graph nodes")
        ax.set_ylabel("Median runtime (ms)")
        ax.set_title("Route-planning runtime by graph size")
        ax.legend()
        fig.tight_layout()
        fig.savefig(out / "runtime_vs_graph_size.png", dpi=200)
        plt.close(fig)

    # Median expanded nodes by graph size and algorithm.
    expanded = (
        data.dropna(subset=["expanded_nodes", "graph_nodes"])
        .groupby(["graph_nodes", "algorithm"], as_index=False)["expanded_nodes"]
        .median()
    )
    if not expanded.empty:
        fig, ax = plt.subplots()
        for name, group in expanded.groupby("algorithm"):
            group = group.sort_values("graph_nodes")
            ax.plot(group["graph_nodes"], group["expanded_nodes"], marker="o", label=name)
        ax.set_xlabel("Graph nodes")
        ax.set_ylabel("Median expanded nodes")
        ax.set_title("Search effort by graph size")
        ax.legend()
        fig.tight_layout()
        fig.savefig(out / "expanded_nodes_vs_graph_size.png", dpi=200)
        plt.close(fig)

    # Route success counts. This is a test outcome, not an algorithm speed measure.
    if "route_found" in data.columns:
        outcomes = data.assign(
            route_found=data["route_found"].astype(str).str.lower().isin(["true", "1", "yes"])
        ).groupby(["algorithm", "route_found"]).size().unstack(fill_value=0)
        if not outcomes.empty:
            fig, ax = plt.subplots()
            outcomes.rename(columns={True: "Route found", False: "No route"}).plot(
                kind="bar", stacked=True, ax=ax
            )
            ax.set_xlabel("Algorithm")
            ax.set_ylabel("Query trials")
            ax.set_title("Route-found outcomes")
            fig.tight_layout()
            fig.savefig(out / "route_outcomes.png", dpi=200)
            plt.close(fig)

    # Permission-safety chart if the test harness records the relevant columns.
    safety_cols = {"unauthorized_destination_exposed", "forbidden_edge_count"}
    if safety_cols.issubset(data.columns):
        exposure = pd.to_numeric(data["unauthorized_destination_exposed"], errors="coerce").fillna(0)
        forbidden = pd.to_numeric(data["forbidden_edge_count"], errors="coerce").fillna(0)
        summary = pd.DataFrame({
            "Metric": ["Unauthorized destinations exposed", "Forbidden-edge route occurrences"],
            "Count": [int(exposure.sum()), int((forbidden > 0).sum())],
        })
        fig, ax = plt.subplots()
        ax.bar(summary["Metric"], summary["Count"])
        ax.set_ylabel("Observed count")
        ax.set_title("Access-policy violations (lower is better)")
        ax.tick_params(axis="x", rotation=15)
        fig.tight_layout()
        fig.savefig(out / "access_policy_violations.png", dpi=200)
        plt.close(fig)

    print(f"Figures saved to {out.resolve()}")
    print("Each plot is derived only from rows in the supplied measured-results CSV.")


if __name__ == "__main__":
    main()
