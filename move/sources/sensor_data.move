module trustchain::sensor_data {
    use sui::object::{UID};
    use sui::tx_context::{TxContext};
    use std::string::String;

    // Sensor reading structure
    public struct SensorReading has store, drop, copy {
        sensor_id: String,
        timestamp: u64,
        reading_type: String, // temperature, vibration, pressure, etc.
        value: u64,           // Scaled integer (e.g., temp * 100)
        unit: String,         // celsius, hz, psi, etc.
        is_anomaly: bool,     // Auto-flagged anomaly
    }

    // Create a new sensor reading
    public fun new_reading(
        sensor_id: String,
        timestamp: u64,
        reading_type: String,
        value: u64,
        unit: String,
        is_anomaly: bool,
    ): SensorReading {
        SensorReading {
            sensor_id,
            timestamp,
            reading_type,
            value,
            unit,
            is_anomaly,
        }
    }

    // Getters
    public fun sensor_id(reading: &SensorReading): String {
        reading.sensor_id
    }

    public fun timestamp(reading: &SensorReading): u64 {
        reading.timestamp
    }

    public fun reading_type(reading: &SensorReading): String {
        reading.reading_type
    }

    public fun value(reading: &SensorReading): u64 {
        reading.value
    }

    public fun unit(reading: &SensorReading): String {
        reading.unit
    }

    public fun is_anomaly(reading: &SensorReading): bool {
        reading.is_anomaly
    }

    // Check if reading exceeds threshold
    public fun exceeds_threshold(reading: &SensorReading, threshold: u64): bool {
        reading.value > threshold
    }
}
