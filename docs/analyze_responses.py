import csv
from pathlib import Path
import statistics

csv_path = Path("docs/responses.csv")
with open(csv_path, encoding="utf-8") as f:
    reader = csv.reader(f)
    headers = next(reader)
    rows = list(reader)

print(f"Total responses: {len(rows)}")

# Print headers with index
for idx, h in enumerate(headers):
    print(f"{idx}: {h[:60]}")

roles = {}
devices = {}
for r in rows:
    role = r[10].strip()
    dev = r[9].strip()
    roles[role] = roles.get(role, 0) + 1
    devices[dev] = devices.get(dev, 0) + 1

print("\nRoles:", roles)
print("Devices:", devices)

# Let's map numerical columns
def get_col_stats(col_idx, name):
    vals = []
    for r in rows:
        val_str = r[col_idx].strip()
        if val_str and val_str.upper() != "N/A":
            try:
                vals.append(float(val_str))
            except ValueError:
                pass
    if vals:
        mean_val = statistics.mean(vals)
        sd_val = statistics.stdev(vals) if len(vals) > 1 else 0.0
        print(f"{name} (col {col_idx}): n={len(vals)}, Mean={mean_val:.2f}, SD={sd_val:.2f}")
        return mean_val, sd_val, len(vals)
    else:
        print(f"{name} (col {col_idx}): NO NUMERICAL VALUES")
        return 0, 0, 0

print("\n--- STATS ---")
stats = {}
stats["Q7_Familiarity"] = get_col_stats(12, "Q7 Familiarity")
stats["PU1"] = get_col_stats(13, "PU1 Sighting")
stats["PU2"] = get_col_stats(14, "PU2 Directory")
stats["PU3"] = get_col_stats(15, "PU3 RA 9482")
stats["PU4"] = get_col_stats(16, "PU4 Coordination")
stats["PU5"] = get_col_stats(17, "PU5 Overall Utility")

stats["PEOU1"] = get_col_stats(18, "PEOU1 Navigation")
stats["PEOU2"] = get_col_stats(19, "PEOU2 Form Efficiency")
stats["PEOU3"] = get_col_stats(20, "PEOU3 Aesthetics")
stats["PEOU4"] = get_col_stats(21, "PEOU4 Session")

stats["TECH1"] = get_col_stats(22, "TECH1 QR Scanner")
stats["TECH1-B"] = get_col_stats(23, "TECH1-B Public Passport")
stats["TECH2"] = get_col_stats(24, "TECH2 AI Trait")
stats["TECH3"] = get_col_stats(25, "TECH3 Responsive")

stats["PERF1"] = get_col_stats(26, "PERF1 Latency")
stats["PERF2"] = get_col_stats(27, "PERF2 Stability")

stats["SUS-B1"] = get_col_stats(28, "SUS-B1")
stats["SUS-B2"] = get_col_stats(29, "SUS-B2")
stats["SUS-B3"] = get_col_stats(30, "SUS-B3")
stats["SUS-B4"] = get_col_stats(31, "SUS-B4")

stats["STF1"] = get_col_stats(32, "STF1 Sighting Intake")
stats["STF2"] = get_col_stats(33, "STF2 Supply Dimensional")
stats["STF3"] = get_col_stats(34, "STF3 Collar Tag QR")

stats["SAT1"] = get_col_stats(35, "SAT1 Satisfaction")
stats["BI1"] = get_col_stats(36, "BI1 Intention")
stats["BI2"] = get_col_stats(37, "BI2 Recommend")

# Calculate SUS score
# SUS 4-item calculation:
# B1 (positive): val - 1
# B2 (negative): 5 - val
# B3 (positive): val - 1
# B4 (negative): 5 - val
# scaled: (sum of 4 items / 16) * 100
sus_scores = []
for r in rows:
    try:
        b1 = float(r[28])
        b2 = float(r[29])
        b3 = float(r[30])
        b4 = float(r[31])
        score = ((b1 - 1) + (5 - b2) + (b3 - 1) + (5 - b4)) * (100.0 / 16.0)
        sus_scores.append(score)
    except:
        pass

if sus_scores:
    print(f"\nComposite SUS Score (out of 100): Mean = {statistics.mean(sus_scores):.2f}, SD = {statistics.stdev(sus_scores):.2f}")

# Follow-up consent
consents = {}
for r in rows:
    c = r[41].strip()
    consents[c] = consents.get(c, 0) + 1
print("\nFollow-up agreement (Q18):", consents)
