module trustchain::column {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::dynamic_field as df;
    use sui::vec_set::{Self, VecSet};
    use std::string::String;
    use trustchain::sensor_data::SensorReading;

    // Column object - represents structural column with sensors
    public struct Column has key, store {
        id: UID,
        column_id: String,           // "A-12", "B-05", etc.
        floor_level: u64,            // 0 = Ground, 1 = First floor, etc.
        column_type: String,         // "Load Bearing", "Support", etc.
        material: String,            // "Reinforced Concrete", "Steel", etc.
        installation_date: u64,
        building_id: Option<ID>,     // Parent building
        parent_id: Option<ID>,       // Parent column (if sub-component)
        status: String,              // active, warning, critical, failed
        owner: address,
        authorized_signers: VecSet<address>,
        // Seismic thresholds
        max_tilt_degrees: u64,       // Maximum safe tilt * 10 (e.g., 15 = 1.5°)
        max_vibration: u64,          // Maximum safe vibration level
        crack_width_threshold: u64,  // Maximum crack width in mm * 10
        // Current readings (cached for quick access)
        current_tilt: u64,
        current_vibration: u64,
        current_crack_width: u64,
        anomaly_count: u64,
    }

    // Events
    public struct ColumnCreated has copy, drop {
        column_id_str: String,
        floor_level: u64,
        column_type: String,
        owner: address,
    }

    public struct SeismicDataAdded has copy, drop {
        column_obj_id: ID,
        sensor_id: String,
        timestamp: u64,
        is_anomaly: bool,
        reading_type: String,
        value: u64,
    }

    public struct AnomalyDetected has copy, drop {
        column_obj_id: ID,
        anomaly_type: String,  // "excessive_tilt", "high_vibration", "crack_detected"
        severity: String,      // "warning", "critical"
        timestamp: u64,
    }

    public struct ColumnStatusChanged has copy, drop {
        column_obj_id: ID,
        old_status: String,
        new_status: String,
        timestamp: u64,
    }

    // Create new column
    public entry fun create_column(
        column_id: String,
        floor_level: u64,
        column_type: String,
        material: String,
        installation_date: u64,
        max_tilt_degrees: u64,
        max_vibration: u64,
        crack_width_threshold: u64,
        ctx: &mut TxContext
    ) {
        let column_obj_id = object::new(ctx);
        let column_obj_id_copy = object::uid_to_inner(&column_obj_id);

        let column = Column {
            id: column_obj_id,
            column_id,
            floor_level,
            column_type,
            material,
            installation_date,
            building_id: std::option::none(),
            parent_id: std::option::none(),
            status: std::string::utf8(b"active"),
            owner: sender(ctx),
            authorized_signers: vec_set::empty(),
            max_tilt_degrees,
            max_vibration,
            crack_width_threshold,
            current_tilt: 0,
            current_vibration: 0,
            current_crack_width: 0,
            anomaly_count: 0,
        };

        sui::event::emit(ColumnCreated {
            column_id_str: column.column_id,
            floor_level,
            column_type: column.column_type,
            owner: sender(ctx),
        });

        transfer::public_transfer(column, sender(ctx));
    }

    // Attach column to building
    public entry fun attach_to_building(
        column: &mut Column,
        building_id: ID,
        _ctx: &mut TxContext
    ) {
        column.building_id = std::option::some(building_id);
    }

    // Add seismic sensor reading
    public entry fun add_seismic_reading(
        column: &mut Column,
        sensor_id: String,
        timestamp: u64,
        reading_type: String,  // "tilt", "vibration", "crack_width", "temperature"
        value: u64,
        unit: String,
        ctx: &mut TxContext
    ) {
        let mut is_anomaly = false;
        let mut anomaly_type = std::string::utf8(b"");
        let mut severity = std::string::utf8(b"");

        // Check thresholds and detect anomalies
        if (reading_type == std::string::utf8(b"tilt")) {
            column.current_tilt = value;
            if (value > column.max_tilt_degrees) {
                is_anomaly = true;
                anomaly_type = std::string::utf8(b"excessive_tilt");
                severity = if (value > column.max_tilt_degrees * 2) {
                    std::string::utf8(b"critical")
                } else {
                    std::string::utf8(b"warning")
                };
            };
        } else if (reading_type == std::string::utf8(b"vibration")) {
            column.current_vibration = value;
            if (value > column.max_vibration) {
                is_anomaly = true;
                anomaly_type = std::string::utf8(b"high_vibration");
                severity = if (value > column.max_vibration * 2) {
                    std::string::utf8(b"critical")
                } else {
                    std::string::utf8(b"warning")
                };
            };
        } else if (reading_type == std::string::utf8(b"crack_width")) {
            column.current_crack_width = value;
            if (value > column.crack_width_threshold) {
                is_anomaly = true;
                anomaly_type = std::string::utf8(b"crack_detected");
                severity = if (value > column.crack_width_threshold * 2) {
                    std::string::utf8(b"critical")
                } else {
                    std::string::utf8(b"warning")
                };
            };
        };

        // Create sensor reading
        let reading = trustchain::sensor_data::new_reading(
            sensor_id,
            timestamp,
            reading_type,
            value,
            unit,
            is_anomaly,
        );

        // Store reading with timestamp as key
        df::add(&mut column.id, timestamp, reading);

        sui::event::emit(SeismicDataAdded {
            column_obj_id: object::uid_to_inner(&column.id),
            sensor_id,
            timestamp,
            is_anomaly,
            reading_type,
            value,
        });

        // Handle anomalies
        if (is_anomaly) {
            column.anomaly_count = column.anomaly_count + 1;

            sui::event::emit(AnomalyDetected {
                column_obj_id: object::uid_to_inner(&column.id),
                anomaly_type,
                severity,
                timestamp,
            });

            // Auto-update status based on severity
            let old_status = column.status;
            if (severity == std::string::utf8(b"critical") && column.status != std::string::utf8(b"failed")) {
                column.status = std::string::utf8(b"critical");

                sui::event::emit(ColumnStatusChanged {
                    column_obj_id: object::uid_to_inner(&column.id),
                    old_status,
                    new_status: column.status,
                    timestamp,
                });
            } else if (severity == std::string::utf8(b"warning") && column.status == std::string::utf8(b"active")) {
                column.status = std::string::utf8(b"warning");

                sui::event::emit(ColumnStatusChanged {
                    column_obj_id: object::uid_to_inner(&column.id),
                    old_status,
                    new_status: column.status,
                    timestamp,
                });
            };
        };
    }

    // Manual status change
    public entry fun change_status(
        column: &mut Column,
        new_status: String,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(column.owner == sender(ctx), 0);

        let old_status = column.status;
        column.status = new_status;

        sui::event::emit(ColumnStatusChanged {
            column_obj_id: object::uid_to_inner(&column.id),
            old_status,
            new_status: column.status,
            timestamp,
        });
    }

    // Getters
    public fun column_id(column: &Column): String {
        column.column_id
    }

    public fun status(column: &Column): String {
        column.status
    }

    public fun floor_level(column: &Column): u64 {
        column.floor_level
    }

    public fun anomaly_count(column: &Column): u64 {
        column.anomaly_count
    }

    public fun current_tilt(column: &Column): u64 {
        column.current_tilt
    }

    public fun current_vibration(column: &Column): u64 {
        column.current_vibration
    }

    public fun current_crack_width(column: &Column): u64 {
        column.current_crack_width
    }

    public fun has_anomalies(column: &Column): bool {
        column.anomaly_count > 0
    }

    public fun is_critical(column: &Column): bool {
        column.status == std::string::utf8(b"critical") || column.status == std::string::utf8(b"failed")
    }
}
