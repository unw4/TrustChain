#!/bin/bash

# Seismic Test Data Creation Script
# Creates buildings, columns with sensors, and problematic seismic activities

PACKAGE_ID="0xd545d3b775a14ee9c53386859074f497c06196e1b931b93f1eb053dc272ea439"

echo "=== Creating Test Buildings ==="

# Building 1: High-risk seismic zone building
echo "Creating Building 1: Istanbul Plaza Tower A (High Risk Zone)..."
BUILDING1_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module building \
  --function create_building \
  --args \
    "Istanbul Plaza Tower A" \
    "Istanbul, Turkey" \
    2015 \
    "Residential" \
    25 \
    "High Risk" \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::building::Building")) | .objectId')

echo "Building 1 created: $BUILDING1_TX"

# Building 2: Medium-risk zone
echo "Creating Building 2: Ankara Business Center (Medium Risk Zone)..."
BUILDING2_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module building \
  --function create_building \
  --args \
    "Ankara Business Center" \
    "Ankara, Turkey" \
    2018 \
    "Commercial" \
    15 \
    "Medium Risk" \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::building::Building")) | .objectId')

echo "Building 2 created: $BUILDING2_TX"

echo ""
echo "=== Creating Structural Columns ==="

# Column 1: Ground floor load-bearing - will have CRITICAL tilt
echo "Creating Column A-01 (Ground Floor, Load Bearing)..."
COLUMN1_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function create_column \
  --args \
    "A-01" \
    0 \
    "Load Bearing" \
    "Reinforced Concrete" \
    $(date +%s)000 \
    15 \
    100 \
    50 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::column::Column")) | .objectId')

echo "Column A-01 created: $COLUMN1_TX"

# Column 2: First floor support - will have WARNING vibration
echo "Creating Column B-05 (First Floor, Support)..."
COLUMN2_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function create_column \
  --args \
    "B-05" \
    1 \
    "Support" \
    "Steel" \
    $(date +%s)000 \
    20 \
    150 \
    30 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::column::Column")) | .objectId')

echo "Column B-05 created: $COLUMN2_TX"

# Column 3: Fifth floor load-bearing - will have CRITICAL crack
echo "Creating Column C-12 (Fifth Floor, Load Bearing)..."
COLUMN3_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function create_column \
  --args \
    "C-12" \
    5 \
    "Load Bearing" \
    "Reinforced Concrete" \
    $(date +%s)000 \
    10 \
    80 \
    20 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::column::Column")) | .objectId')

echo "Column C-12 created: $COLUMN3_TX"

# Column 4: Healthy column for comparison
echo "Creating Column D-08 (Second Floor, Support - Healthy)..."
COLUMN4_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function create_column \
  --args \
    "D-08" \
    2 \
    "Support" \
    "Reinforced Concrete" \
    $(date +%s)000 \
    25 \
    200 \
    40 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::column::Column")) | .objectId')

echo "Column D-08 created: $COLUMN4_TX"

sleep 2

echo ""
echo "=== Attaching Columns to Buildings ==="

# Attach columns to Building 1
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function attach_to_building \
  --args $COLUMN1_TX $BUILDING1_TX \
  --gas-budget 10000000

sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function attach_to_building \
  --args $COLUMN2_TX $BUILDING1_TX \
  --gas-budget 10000000

# Attach columns to Building 2
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function attach_to_building \
  --args $COLUMN3_TX $BUILDING2_TX \
  --gas-budget 10000000

sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function attach_to_building \
  --args $COLUMN4_TX $BUILDING2_TX \
  --gas-budget 10000000

sleep 2

echo ""
echo "=== Adding Seismic Sensor Readings ==="
echo ""
echo "SCENARIO 1: Column A-01 - CRITICAL TILT (Earthquake damage)"
echo "Threshold: 1.5°, Reading: 3.5° -> CRITICAL"

# Critical tilt - 35 = 3.5 degrees (threshold is 15 = 1.5 degrees)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN1_TX \
    "TILT-SENSOR-A01" \
    $(date +%s)000 \
    "tilt" \
    35 \
    "degrees_x10" \
  --gas-budget 10000000

echo "✓ Critical tilt reading added to Column A-01"

sleep 1

echo ""
echo "SCENARIO 2: Column A-01 - HIGH VIBRATION (Aftershock)"
echo "Threshold: 10.0, Reading: 18.5 -> WARNING"

# High vibration - 185 (threshold is 100)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN1_TX \
    "VIB-SENSOR-A01" \
    $(date +%s)000 \
    "vibration" \
    185 \
    "units" \
  --gas-budget 10000000

echo "✓ High vibration reading added to Column A-01"

sleep 1

echo ""
echo "SCENARIO 3: Column B-05 - WARNING VIBRATION"
echo "Threshold: 15.0, Reading: 22.0 -> WARNING"

# Warning vibration - 220 (threshold is 150)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN2_TX \
    "VIB-SENSOR-B05" \
    $(date +%s)000 \
    "vibration" \
    220 \
    "units" \
  --gas-budget 10000000

echo "✓ Warning vibration reading added to Column B-05"

sleep 1

echo ""
echo "SCENARIO 4: Column C-12 - CRITICAL CRACK WIDTH"
echo "Threshold: 2.0mm, Reading: 4.5mm -> CRITICAL"

# Critical crack - 45 = 4.5mm (threshold is 20 = 2.0mm)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN3_TX \
    "CRACK-SENSOR-C12" \
    $(date +%s)000 \
    "crack_width" \
    45 \
    "mm_x10" \
  --gas-budget 10000000

echo "✓ Critical crack width reading added to Column C-12"

sleep 1

echo ""
echo "SCENARIO 5: Column C-12 - CRITICAL TILT (Multiple anomalies)"
echo "Threshold: 1.0°, Reading: 2.8° -> CRITICAL"

# Critical tilt - 28 = 2.8 degrees (threshold is 10 = 1.0 degrees)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN3_TX \
    "TILT-SENSOR-C12" \
    $(date +%s)000 \
    "tilt" \
    28 \
    "degrees_x10" \
  --gas-budget 10000000

echo "✓ Critical tilt reading added to Column C-12"

sleep 1

echo ""
echo "SCENARIO 6: Column D-08 - NORMAL READINGS (Healthy column)"
echo "All readings within thresholds"

# Normal tilt - 5 = 0.5 degrees (threshold is 25 = 2.5 degrees)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN4_TX \
    "TILT-SENSOR-D08" \
    $(date +%s)000 \
    "tilt" \
    5 \
    "degrees_x10" \
  --gas-budget 10000000

echo "✓ Normal tilt reading added to Column D-08"

sleep 1

# Normal vibration - 50 (threshold is 200)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN4_TX \
    "VIB-SENSOR-D08" \
    $(date +%s)000 \
    "vibration" \
    50 \
    "units" \
  --gas-budget 10000000

echo "✓ Normal vibration reading added to Column D-08"

sleep 1

# Normal crack width - 8 = 0.8mm (threshold is 40 = 4.0mm)
sui client call \
  --package $PACKAGE_ID \
  --module column \
  --function add_seismic_reading \
  --args \
    $COLUMN4_TX \
    "CRACK-SENSOR-D08" \
    $(date +%s)000 \
    "crack_width" \
    8 \
    "mm_x10" \
  --gas-budget 10000000

echo "✓ Normal crack width reading added to Column D-08"

sleep 2

echo ""
echo "=== Recording Seismic Events on Buildings ==="

# Record major earthquake on Building 1
echo "Recording major earthquake (6.8 magnitude) on Building 1..."
sui client call \
  --package $PACKAGE_ID \
  --module building \
  --function record_seismic_event \
  --args \
    $BUILDING1_TX \
    68 \
    $(date +%s)000 \
    true \
  --gas-budget 10000000

echo "✓ Major earthquake recorded on Building 1 (damage detected)"

sleep 1

# Record minor earthquake on Building 2
echo "Recording minor earthquake (4.2 magnitude) on Building 2..."
sui client call \
  --package $PACKAGE_ID \
  --module building \
  --function record_seismic_event \
  --args \
    $BUILDING2_TX \
    42 \
    $(date +%s)000 \
    false \
  --gas-budget 10000000

echo "✓ Minor earthquake recorded on Building 2 (no damage)"

echo ""
echo "=== Test Data Creation Complete ==="
echo ""
echo "Summary:"
echo "- 2 Buildings created (High Risk & Medium Risk zones)"
echo "- 4 Columns created with various sensor configurations"
echo ""
echo "Anomaly Status:"
echo "  Column A-01 (Ground Floor):    CRITICAL - Excessive tilt (3.5°) + High vibration"
echo "  Column B-05 (First Floor):     WARNING  - High vibration (22.0)"
echo "  Column C-12 (Fifth Floor):     CRITICAL - Crack detected (4.5mm) + Excessive tilt (2.8°)"
echo "  Column D-08 (Second Floor):    ACTIVE   - All readings normal"
echo ""
echo "Seismic Events:"
echo "  Building 1: 6.8 magnitude - Damage detected"
echo "  Building 2: 4.2 magnitude - No damage"
echo ""
echo "Building IDs:"
echo "  Building 1: $BUILDING1_TX"
echo "  Building 2: $BUILDING2_TX"
echo ""
echo "Column IDs:"
echo "  Column A-01: $COLUMN1_TX"
echo "  Column B-05: $COLUMN2_TX"
echo "  Column C-12: $COLUMN3_TX"
echo "  Column D-08: $COLUMN4_TX"
