#!/bin/bash

# Aviation Test Data Creation Script
# Creates aircraft, parts, and maintenance scenarios

PACKAGE_ID="0xd545d3b775a14ee9c53386859074f497c06196e1b931b93f1eb053dc272ea439"

echo "=== Creating Test Aircraft ==="

# Aircraft 1: Boeing 737-800
echo "Creating Boeing 737-800..."
AIRCRAFT1_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function create_aircraft \
  --args \
    "N12345" \
    "Boeing 737-800" \
    "Boeing" \
    $(date +%s)000 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::aircraft::Aircraft")) | .objectId')

echo "Boeing 737-800 created: $AIRCRAFT1_TX"

# Aircraft 2: Boeing 777-300ER
echo "Creating Boeing 777-300ER..."
AIRCRAFT2_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function create_aircraft \
  --args \
    "N67890" \
    "Boeing 777-300ER" \
    "Boeing" \
    $(date +%s)000 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::aircraft::Aircraft")) | .objectId')

echo "Boeing 777-300ER created: $AIRCRAFT2_TX"

# Aircraft 3: Airbus A320neo
echo "Creating Airbus A320neo..."
AIRCRAFT3_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function create_aircraft \
  --args \
    "N54321" \
    "Airbus A320neo" \
    "Airbus" \
    $(date +%s)000 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::aircraft::Aircraft")) | .objectId')

echo "Airbus A320neo created: $AIRCRAFT3_TX"

sleep 2

echo ""
echo "=== Creating Parts ==="

# Part 1: Hydraulic Pump (will be OVERDUE)
echo "Creating Hydraulic Pump..."
PART1_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function create_part \
  --args \
    "HYDRO-PUMP-001" \
    "Hydraulic Pump" \
    "Parker Hannifin" \
    $(date +%s)000 \
    500 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::part::Part")) | .objectId')

echo "Hydraulic Pump created: $PART1_TX"

# Part 2: Landing Gear (will be OVERDUE)
echo "Creating Landing Gear..."
PART2_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function create_part \
  --args \
    "GEAR-737-001" \
    "Landing Gear" \
    "Boeing" \
    $(date +%s)000 \
    1000 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::part::Part")) | .objectId')

echo "Landing Gear created: $PART2_TX"

# Part 3: Avionics Module (close to due)
echo "Creating Avionics Module..."
PART3_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function create_part \
  --args \
    "AVION-777-001" \
    "Avionics Module" \
    "Honeywell" \
    $(date +%s)000 \
    800 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::part::Part")) | .objectId')

echo "Avionics Module created: $PART3_TX"

# Part 4: Engine (will be OVERDUE)
echo "Creating CFM56 Engine..."
PART4_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function create_part \
  --args \
    "CFM56-7B27-001" \
    "Turbofan Engine" \
    "CFM International" \
    $(date +%s)000 \
    5000 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::part::Part")) | .objectId')

echo "CFM56 Engine created: $PART4_TX"

# Part 5: APU (good condition)
echo "Creating APU..."
PART5_TX=$(sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function create_part \
  --args \
    "APU-A320-001" \
    "Auxiliary Power Unit" \
    "Airbus" \
    $(date +%s)000 \
    1500 \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[] | select(.objectType | contains("::part::Part")) | .objectId')

echo "APU created: $PART5_TX"

sleep 2

echo ""
echo "=== Attaching Parts to Aircraft ==="

# Attach parts to Boeing 737
echo "Attaching Hydraulic Pump to Boeing 737..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function attach_to_parent \
  --args $PART1_TX $AIRCRAFT1_TX $AIRCRAFT1_TX \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Attached"

echo "Attaching Landing Gear to Boeing 737..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function attach_to_parent \
  --args $PART2_TX $AIRCRAFT1_TX $AIRCRAFT1_TX \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Attached"

# Attach parts to Boeing 777
echo "Attaching Avionics Module to Boeing 777..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function attach_to_parent \
  --args $PART3_TX $AIRCRAFT2_TX $AIRCRAFT2_TX \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Attached"

echo "Attaching Engine to Boeing 777..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function attach_to_parent \
  --args $PART4_TX $AIRCRAFT2_TX $AIRCRAFT2_TX \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Attached"

# Attach parts to Airbus A320
echo "Attaching APU to Airbus A320..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function attach_to_parent \
  --args $PART5_TX $AIRCRAFT3_TX $AIRCRAFT3_TX \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Attached"

sleep 2

echo ""
echo "=== Adding Flight Hours (to trigger maintenance alerts) ==="

# Add 600 hours to Hydraulic Pump (needs maintenance at 500) - OVERDUE
echo "Adding 600 hours to Hydraulic Pump (maintenance at 500 hrs)..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function update_flight_hours \
  --args $PART1_TX 600 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Hydraulic Pump: 600/500 hrs - MAINTENANCE OVERDUE!"

# Add 1200 hours to Landing Gear (needs maintenance at 1000) - OVERDUE
echo "Adding 1200 hours to Landing Gear (maintenance at 1000 hrs)..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function update_flight_hours \
  --args $PART2_TX 1200 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Landing Gear: 1200/1000 hrs - MAINTENANCE OVERDUE!"

# Add 750 hours to Avionics (needs maintenance at 800) - close but OK
echo "Adding 750 hours to Avionics Module (maintenance at 800 hrs)..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function update_flight_hours \
  --args $PART3_TX 750 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Avionics Module: 750/800 hrs - OK (50 hrs remaining)"

# Add 5500 hours to Engine (needs maintenance at 5000) - OVERDUE
echo "Adding 5500 hours to Engine (maintenance at 5000 hrs)..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function update_flight_hours \
  --args $PART4_TX 5500 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Engine: 5500/5000 hrs - MAINTENANCE OVERDUE!"

# Add 300 hours to APU (needs maintenance at 1500) - good condition
echo "Adding 300 hours to APU (maintenance at 1500 hrs)..."
sui client call \
  --package $PACKAGE_ID \
  --module part \
  --function update_flight_hours \
  --args $PART5_TX 300 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ APU: 300/1500 hrs - OK (1200 hrs remaining)"

sleep 2

echo ""
echo "=== Adding Flight Hours to Aircraft ==="

# Add 1200 hours to Boeing 737 (will update attached parts)
echo "Adding 1200 flight hours to Boeing 737..."
sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function complete_flight \
  --args $AIRCRAFT1_TX 1200 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Boeing 737: 1200 flight hours logged"

# Add 5500 hours to Boeing 777
echo "Adding 5500 flight hours to Boeing 777..."
sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function complete_flight \
  --args $AIRCRAFT2_TX 5500 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Boeing 777: 5500 flight hours logged"

# Add 300 hours to Airbus A320
echo "Adding 300 flight hours to Airbus A320..."
sui client call \
  --package $PACKAGE_ID \
  --module aircraft \
  --function complete_flight \
  --args $AIRCRAFT3_TX 300 \
  --gas-budget 10000000 > /dev/null 2>&1
echo "✓ Airbus A320: 300 flight hours logged"

echo ""
echo "=== Test Data Creation Complete ==="
echo ""
echo "Summary:"
echo "- 3 Aircraft created (Boeing 737, Boeing 777, Airbus A320)"
echo "- 5 Parts created with various maintenance status"
echo ""
echo "Maintenance Status:"
echo "  Hydraulic Pump:     600/500 hrs   ⚠️  OVERDUE"
echo "  Landing Gear:       1200/1000 hrs ⚠️  OVERDUE"
echo "  CFM56 Engine:       5500/5000 hrs ⚠️  OVERDUE"
echo "  Avionics Module:    750/800 hrs   ✓ OK"
echo "  APU:                300/1500 hrs  ✓ OK"
echo ""
echo "Aircraft IDs:"
echo "  Boeing 737:  $AIRCRAFT1_TX"
echo "  Boeing 777:  $AIRCRAFT2_TX"
echo "  Airbus A320: $AIRCRAFT3_TX"
echo ""
echo "Part IDs:"
echo "  Hydraulic Pump:  $PART1_TX"
echo "  Landing Gear:    $PART2_TX"
echo "  Avionics Module: $PART3_TX"
echo "  CFM56 Engine:    $PART4_TX"
echo "  APU:             $PART5_TX"
