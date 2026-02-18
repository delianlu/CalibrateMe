#!/usr/bin/env python3
"""
Generate publication-quality figures for CalibrateMe midpoint report.
Reads simulation data from results/preliminary/ and outputs PNG figures.
"""

import json
import csv
import os
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
RESULTS_DIR = os.path.join(PROJECT_DIR, 'results', 'preliminary')
FIGURES_DIR = os.path.join(PROJECT_DIR, 'results', 'figures')
os.makedirs(FIGURES_DIR, exist_ok=True)

# Style
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 10,
    'axes.titlesize': 11,
    'axes.labelsize': 10,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 8,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'axes.spines.top': False,
    'axes.spines.right': False,
})

# Color palette
COLORS = {
    'CALIBRATEME': '#2563EB',  # blue
    'SM2': '#DC2626',          # red
    'BKT_ONLY': '#059669',     # green
    'DECAY_BASED': '#9333EA',  # purple
}
SCHEDULER_LABELS = {
    'CALIBRATEME': 'CalibrateMe',
    'SM2': 'SM-2',
    'BKT_ONLY': 'BKT-Only',
    'DECAY_BASED': 'Decay-Based',
}


def load_summary():
    """Load tuned_summary.csv into a list of dicts."""
    rows = []
    with open(os.path.join(RESULTS_DIR, 'tuned_summary.csv')) as f:
        reader = csv.DictReader(f)
        for row in reader:
            for k in row:
                if k not in ('profile', 'scheduler'):
                    row[k] = float(row[k])
            rows.append(row)
    return rows


def load_trajectories():
    """Load tuned_trajectories.csv."""
    rows = []
    with open(os.path.join(RESULTS_DIR, 'tuned_trajectories.csv')) as f:
        reader = csv.DictReader(f)
        for row in reader:
            for k in row:
                row[k] = float(row[k])
            rows.append(row)
    return rows


def load_full_results():
    """Load tuned_results.json."""
    with open(os.path.join(RESULTS_DIR, 'tuned_results.json')) as f:
        return json.load(f)


# =========================================================================
# Figure 1: K* Learning Trajectories
# =========================================================================
def fig1_learning_trajectories(results):
    """K* trajectories for key profiles: CalibrateMe vs SM-2."""
    profiles = ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over']
    fig, axes = plt.subplots(2, 2, figsize=(7, 5.5), sharex=True, sharey=True)
    axes = axes.flatten()

    sessions = np.arange(1, 31)

    for idx, profile in enumerate(profiles):
        ax = axes[idx]
        data = results[profile]

        for sched_key, label in [('CALIBRATEME', 'CalibrateMe'), ('SM2', 'SM-2')]:
            traj = data[sched_key]['K_star_trajectory']
            color = COLORS[sched_key]
            ax.plot(sessions, [v * 100 for v in traj], color=color, linewidth=1.5,
                    label=label, marker='o' if sched_key == 'CALIBRATEME' else 's',
                    markersize=2, markevery=3)

        ax.set_title(profile, fontweight='bold')
        ax.set_ylim(10, 70)
        if idx >= 2:
            ax.set_xlabel('Session')
        if idx % 2 == 0:
            ax.set_ylabel('K* (%)')

    axes[0].legend(loc='lower right', framealpha=0.9)
    fig.suptitle('Knowledge Trajectory (K*) Across Sessions', fontweight='bold', y=1.01)
    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig1_learning_trajectories.png'))
    plt.close(fig)
    print('  Saved fig1_learning_trajectories.png')


# =========================================================================
# Figure 2: ECE Calibration Error Trajectories
# =========================================================================
def fig2_ece_trajectories(results):
    """ECE trajectories showing calibration improvement for CalibrateMe."""
    profiles = ['Med-Over', 'Med-Under', 'Med-Well', 'High-Over']
    fig, axes = plt.subplots(2, 2, figsize=(7, 5.5), sharex=True, sharey=True)
    axes = axes.flatten()

    sessions = np.arange(1, 31)

    for idx, profile in enumerate(profiles):
        ax = axes[idx]
        data = results[profile]

        for sched_key, label in [('CALIBRATEME', 'CalibrateMe'), ('SM2', 'SM-2')]:
            traj = data[sched_key]['ece_trajectory']
            color = COLORS[sched_key]
            ax.plot(sessions, [v * 100 for v in traj], color=color, linewidth=1.5,
                    label=label, marker='o' if sched_key == 'CALIBRATEME' else 's',
                    markersize=2, markevery=3)

        ax.set_title(profile, fontweight='bold')
        ax.set_ylim(5, 35)
        if idx >= 2:
            ax.set_xlabel('Session')
        if idx % 2 == 0:
            ax.set_ylabel('ECE (%)')

    axes[0].legend(loc='upper right', framealpha=0.9)
    fig.suptitle('Expected Calibration Error (ECE) Across Sessions', fontweight='bold', y=1.01)
    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig2_ece_trajectories.png'))
    plt.close(fig)
    print('  Saved fig2_ece_trajectories.png')


# =========================================================================
# Figure 3: 7-Day Retention Comparison (Bar Chart)
# =========================================================================
def fig3_retention_comparison(summary):
    """Bar chart: 7-day retention by profile × scheduler."""
    profiles = ['Low-Over', 'Low-Under', 'Low-Well',
                'Med-Over', 'Med-Under', 'Med-Well',
                'High-Over', 'High-Under', 'High-Well']
    schedulers = ['CALIBRATEME', 'SM2', 'BKT_ONLY', 'DECAY_BASED']

    fig, ax = plt.subplots(figsize=(8, 4))

    x = np.arange(len(profiles))
    width = 0.18

    for i, sched in enumerate(schedulers):
        vals = []
        for p in profiles:
            row = next(r for r in summary if r['profile'] == p and r['scheduler'] == sched)
            vals.append(row['ret_7d'] * 100)
        offset = (i - 1.5) * width
        bars = ax.bar(x + offset, vals, width, label=SCHEDULER_LABELS[sched],
                      color=COLORS[sched], alpha=0.85, edgecolor='white', linewidth=0.5)

    ax.set_ylabel('7-Day Retention (%)')
    ax.set_xlabel('Learner Profile')
    ax.set_xticks(x)
    ax.set_xticklabels(profiles, rotation=45, ha='right', fontsize=8)
    ax.legend(loc='upper left', ncol=2, framealpha=0.9)
    ax.set_ylim(20, 60)
    ax.set_title('7-Day Retention by Learner Profile and Scheduler', fontweight='bold')

    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig3_retention_comparison.png'))
    plt.close(fig)
    print('  Saved fig3_retention_comparison.png')


# =========================================================================
# Figure 4: CalibrateMe vs SM-2 Improvement (Grouped by Calibration Type)
# =========================================================================
def fig4_improvement_analysis(summary):
    """Grouped bar chart showing CalibrateMe improvement over SM-2 by calibration type."""
    calib_types = ['Over', 'Under', 'Well']
    ability_levels = ['Low', 'Med', 'High']

    fig, axes = plt.subplots(1, 3, figsize=(8, 3.5), sharey=True)

    for c_idx, calib in enumerate(calib_types):
        ax = axes[c_idx]
        profiles = [f'{a}-{calib}' for a in ability_levels]

        cm_vals = []
        sm2_vals = []
        for p in profiles:
            cm = next(r for r in summary if r['profile'] == p and r['scheduler'] == 'CALIBRATEME')
            sm2 = next(r for r in summary if r['profile'] == p and r['scheduler'] == 'SM2')
            cm_vals.append(cm['ret_7d'] * 100)
            sm2_vals.append(sm2['ret_7d'] * 100)

        x = np.arange(len(profiles))
        width = 0.35
        ax.bar(x - width/2, cm_vals, width, label='CalibrateMe', color=COLORS['CALIBRATEME'], alpha=0.85)
        ax.bar(x + width/2, sm2_vals, width, label='SM-2', color=COLORS['SM2'], alpha=0.85)

        # Add delta annotations
        for i in range(len(profiles)):
            delta = cm_vals[i] - sm2_vals[i]
            y_pos = max(cm_vals[i], sm2_vals[i]) + 1
            ax.annotate(f'{delta:+.1f}%', xy=(x[i], y_pos), ha='center', fontsize=7,
                        color='green' if delta > 0 else 'red', fontweight='bold')

        ax.set_title(f'{calib}-calibrated', fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(ability_levels, fontsize=9)
        ax.set_xlabel('Ability Level')
        if c_idx == 0:
            ax.set_ylabel('7-Day Retention (%)')
            ax.legend(framealpha=0.9, fontsize=7)

    axes[0].set_ylim(20, 60)
    fig.suptitle('CalibrateMe vs SM-2: Retention by Calibration Type', fontweight='bold', y=1.02)
    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig4_improvement_analysis.png'))
    plt.close(fig)
    print('  Saved fig4_improvement_analysis.png')


# =========================================================================
# Figure 5: ECE Reduction (Final ECE comparison)
# =========================================================================
def fig5_ece_comparison(summary):
    """Bar chart showing final ECE by scheduler for overconfident profiles."""
    profiles_over = ['Low-Over', 'Med-Over', 'High-Over']
    schedulers = ['CALIBRATEME', 'SM2', 'BKT_ONLY', 'DECAY_BASED']

    fig, ax = plt.subplots(figsize=(6, 3.5))

    x = np.arange(len(profiles_over))
    width = 0.18

    for i, sched in enumerate(schedulers):
        vals = []
        for p in profiles_over:
            row = next(r for r in summary if r['profile'] == p and r['scheduler'] == sched)
            vals.append(row['final_ece'] * 100)
        offset = (i - 1.5) * width
        ax.bar(x + offset, vals, width, label=SCHEDULER_LABELS[sched],
               color=COLORS[sched], alpha=0.85, edgecolor='white', linewidth=0.5)

    ax.set_ylabel('Final ECE (%)')
    ax.set_xlabel('Overconfident Profile')
    ax.set_xticks(x)
    ax.set_xticklabels(profiles_over)
    ax.legend(framealpha=0.9, fontsize=8)
    ax.set_title('Final Calibration Error (ECE) — Overconfident Profiles', fontweight='bold')
    ax.set_ylim(0, 30)

    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig5_ece_comparison.png'))
    plt.close(fig)
    print('  Saved fig5_ece_comparison.png')


# =========================================================================
# Figure 6: System Architecture Diagram
# =========================================================================
def fig6_architecture():
    """System architecture diagram for CalibrateMe."""
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    box_style = dict(boxstyle='round,pad=0.4', facecolor='#E0E7FF', edgecolor='#4338CA', linewidth=1.5)
    core_style = dict(boxstyle='round,pad=0.5', facecolor='#DBEAFE', edgecolor='#2563EB', linewidth=2)
    input_style = dict(boxstyle='round,pad=0.4', facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.5)
    output_style = dict(boxstyle='round,pad=0.4', facecolor='#D1FAE5', edgecolor='#059669', linewidth=1.5)

    # Title
    ax.text(5, 6.6, 'CalibrateMe System Architecture', ha='center', fontsize=13,
            fontweight='bold', color='#1E3A5F')

    # Input layer
    ax.text(1.5, 5.8, 'Learner Response\n(correctness, confidence, RT)',
            ha='center', va='center', fontsize=8, bbox=input_style)

    # Core modules (row 1)
    ax.text(1.5, 4.2, 'BKT Belief\nUpdate Engine\n(Eq. 1-2)',
            ha='center', va='center', fontsize=7.5, bbox=box_style)
    ax.text(4.0, 4.2, 'Calibration\nScoring Module\n(ECE, Brier)',
            ha='center', va='center', fontsize=7.5, bbox=box_style)
    ax.text(6.5, 4.2, 'Dual-Process\nClassifier\n(Type 1/2)',
            ha='center', va='center', fontsize=7.5, bbox=box_style)

    # Core scheduler (center)
    ax.text(4.0, 2.5, 'Calibration-Aware\nScheduler',
            ha='center', va='center', fontsize=9, fontweight='bold', bbox=core_style)

    # Supporting modules (row 3)
    ax.text(1.5, 2.5, 'Forgetting\nModel\n(Eq. 3)',
            ha='center', va='center', fontsize=7.5, bbox=box_style)
    ax.text(6.5, 2.5, 'Adaptive\nScaffolding\n(Eq. 7)',
            ha='center', va='center', fontsize=7.5, bbox=box_style)

    # Output
    ax.text(4.0, 0.8, 'Scheduled Review\n+ Scaffolding Prompt',
            ha='center', va='center', fontsize=8, bbox=output_style)

    # Arrows
    arrow_props = dict(arrowstyle='->', color='#6366F1', linewidth=1.2)

    # Input to modules
    ax.annotate('', xy=(1.5, 4.8), xytext=(1.5, 5.3), arrowprops=arrow_props)
    ax.annotate('', xy=(4.0, 4.8), xytext=(2.5, 5.5), arrowprops=arrow_props)
    ax.annotate('', xy=(6.5, 4.8), xytext=(2.5, 5.5), arrowprops=arrow_props)

    # Modules to scheduler
    ax.annotate('', xy=(2.5, 3.0), xytext=(1.5, 3.6), arrowprops=arrow_props)
    ax.annotate('', xy=(4.0, 3.0), xytext=(4.0, 3.6), arrowprops=arrow_props)
    ax.annotate('', xy=(5.5, 3.0), xytext=(6.5, 3.6), arrowprops=arrow_props)

    # Forgetting model to scheduler
    ax.annotate('', xy=(2.8, 2.5), xytext=(2.2, 2.5), arrowprops=arrow_props)

    # Scaffolding to scheduler
    ax.annotate('', xy=(5.2, 2.5), xytext=(5.8, 2.5), arrowprops=arrow_props)

    # Scheduler to output
    ax.annotate('', xy=(4.0, 1.3), xytext=(4.0, 2.0), arrowprops=arrow_props)

    # Equation references on the side
    eq_text = (
        "Key Equations:\n"
        "1. BKT Posterior Update\n"
        "2. Learning Transition\n"
        "3. Forgetting Decay\n"
        "4. Response Generation\n"
        "5. Confidence w/ Bias\n"
        "6. Response Time Model\n"
        "7. Scaffolding Effect"
    )
    ax.text(8.8, 4.2, eq_text, ha='center', va='center', fontsize=6.5,
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#F3F4F6', edgecolor='#9CA3AF', linewidth=1))

    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig6_architecture.png'))
    plt.close(fig)
    print('  Saved fig6_architecture.png')


# =========================================================================
# Figure 7: K* vs K_hat (Knowledge vs Estimated Knowledge)
# =========================================================================
def fig7_knowledge_vs_estimated(results):
    """Show how K* (true) and K_hat (estimated) converge for CalibrateMe."""
    profiles = ['Med-Over', 'Med-Under', 'High-Over']
    fig, axes = plt.subplots(1, 3, figsize=(8, 3), sharey=True)

    sessions = np.arange(1, 31)

    for idx, profile in enumerate(profiles):
        ax = axes[idx]
        data = results[profile]['CALIBRATEME']

        k_star = [v * 100 for v in data['K_star_trajectory']]
        k_hat = [v * 100 for v in data['K_hat_trajectory']]

        ax.plot(sessions, k_star, color=COLORS['CALIBRATEME'], linewidth=1.5,
                label='K* (true)', linestyle='-')
        ax.plot(sessions, k_hat, color='#F59E0B', linewidth=1.5,
                label='K̂ (estimated)', linestyle='--')
        ax.fill_between(sessions, k_star, k_hat, alpha=0.15, color='gray')

        ax.set_title(profile, fontweight='bold')
        ax.set_xlabel('Session')
        if idx == 0:
            ax.set_ylabel('Knowledge (%)')
            ax.legend(framealpha=0.9, fontsize=7)

    fig.suptitle('True Knowledge (K*) vs System Estimate (K̂) — CalibrateMe',
                 fontweight='bold', y=1.03)
    plt.tight_layout()
    fig.savefig(os.path.join(FIGURES_DIR, 'fig7_knowledge_vs_estimated.png'))
    plt.close(fig)
    print('  Saved fig7_knowledge_vs_estimated.png')


# =========================================================================
# Main
# =========================================================================
def main():
    print('Loading simulation data...')
    summary = load_summary()
    results = load_full_results()

    print('Generating figures...')
    fig1_learning_trajectories(results)
    fig2_ece_trajectories(results)
    fig3_retention_comparison(summary)
    fig4_improvement_analysis(summary)
    fig5_ece_comparison(summary)
    fig6_architecture()
    fig7_knowledge_vs_estimated(results)

    print(f'\nAll figures saved to {FIGURES_DIR}/')


if __name__ == '__main__':
    main()
