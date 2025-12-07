module trustchain::part {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::dynamic_field as df;
    use sui::vec_set::{Self, VecSet};
    use std::string::String;
    use trustchain::sensor_data::SensorReading;

    // Part object - represents any component (engine, turbine, bolt, etc.)
    public struct Part has key, store {
        id: UID,
        serial_number: String,
        part_type: String,        // engine, turbine, bolt, sensor, etc.
        manufacturer: String,
        manufacture_date: u64,
        parent_id: Option<ID>,    // ID of parent part (e.g., engine for turbine)
        aircraft_id: Option<ID>,  // Root aircraft ID
        status: String,           // active, maintenance, scrapped
        owner: address,
        authorized_signers: VecSet<address>, // Multi-sig for transfers
        total_flight_hours: u64,
        maintenance_due_hours: u64,
    }

    // Events
    public struct PartCreated has copy, drop {
        part_id: ID,
        serial_number: String,
        part_type: String,
        manufacturer: String,
        owner: address,
    }

    public struct SensorDataAdded has copy, drop {
        part_id: ID,
        sensor_id: String,
        timestamp: u64,
        is_anomaly: bool,
    }

    public struct PartTransferred has copy, drop {
        part_id: ID,
        from: address,
        to: address,
        timestamp: u64,
    }

    public struct MaintenancePerformed has copy, drop {
        part_id: ID,
        timestamp: u64,
        maintenance_type: String,
    }

    // Create a new part
    public entry fun create_part(
        serial_number: String,
        part_type: String,
        manufacturer: String,
        manufacture_date: u64,
        maintenance_interval: u64,
        ctx: &mut TxContext
    ) {
        let part_id = object::new(ctx);
        let part_id_copy = object::uid_to_inner(&part_id);

        let part = Part {
            id: part_id,
            serial_number,
            part_type,
            manufacturer,
            manufacture_date,
            parent_id: std::option::none(),
            aircraft_id: std::option::none(),
            status: std::string::utf8(b"active"),
            owner: sender(ctx),
            authorized_signers: vec_set::empty(),
            total_flight_hours: 0,
            maintenance_due_hours: maintenance_interval,
        };

        sui::event::emit(PartCreated {
            part_id: part_id_copy,
            serial_number: part.serial_number,
            part_type: part.part_type,
            manufacturer: part.manufacturer,
            owner: sender(ctx),
        });

        transfer::public_transfer(part, sender(ctx));
    }

    // Attach part to parent (e.g., bolt to turbine)
    public entry fun attach_to_parent(
        part: &mut Part,
        parent_id: ID,
        aircraft_id: ID,
        _ctx: &mut TxContext
    ) {
        part.parent_id = std::option::some(parent_id);
        part.aircraft_id = std::option::some(aircraft_id);
    }

    // Detach part from aircraft (for transfers between aircraft)
    public entry fun detach_from_aircraft(
        part: &mut Part,
        ctx: &mut TxContext
    ) {
        assert!(part.owner == sender(ctx), 0);
        part.parent_id = std::option::none();
        part.aircraft_id = std::option::none();
    }

    // Add sensor reading as dynamic field
    public entry fun add_sensor_reading(
        part: &mut Part,
        sensor_id: String,
        timestamp: u64,
        reading_type: String,
        value: u64,
        unit: String,
        is_anomaly: bool,
        _ctx: &mut TxContext
    ) {
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
        df::add(&mut part.id, timestamp, reading);

        sui::event::emit(SensorDataAdded {
            part_id: object::uid_to_inner(&part.id),
            sensor_id,
            timestamp,
            is_anomaly,
        });
    }

    // Update flight hours
    public entry fun update_flight_hours(
        part: &mut Part,
        additional_hours: u64,
        _ctx: &mut TxContext
    ) {
        part.total_flight_hours = part.total_flight_hours + additional_hours;
    }

    // Perform maintenance
    public entry fun perform_maintenance(
        part: &mut Part,
        maintenance_type: String,
        timestamp: u64,
        next_maintenance_hours: u64,
        _ctx: &mut TxContext
    ) {
        part.status = std::string::utf8(b"maintenance");
        part.maintenance_due_hours = part.total_flight_hours + next_maintenance_hours;

        sui::event::emit(MaintenancePerformed {
            part_id: object::uid_to_inner(&part.id),
            timestamp,
            maintenance_type,
        });
    }

    // Mark part as active after maintenance
    public entry fun mark_active(
        part: &mut Part,
        _ctx: &mut TxContext
    ) {
        part.status = std::string::utf8(b"active");
    }

    // Scrap part
    public entry fun scrap_part(
        part: &mut Part,
        _ctx: &mut TxContext
    ) {
        part.status = std::string::utf8(b"scrapped");
    }

    // Add authorized signer for multi-sig transfers
    public entry fun add_authorized_signer(
        part: &mut Part,
        signer: address,
        ctx: &mut TxContext
    ) {
        assert!(part.owner == sender(ctx), 0);
        vec_set::insert(&mut part.authorized_signers, signer);
    }

    // Transfer with multi-sig check
    public entry fun transfer_part(
        part: Part,
        recipient: address,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        let sender_addr = sender(ctx);
        assert!(
            part.owner == sender_addr || vec_set::contains(&part.authorized_signers, &sender_addr),
            1
        );

        sui::event::emit(PartTransferred {
            part_id: object::uid_to_inner(&part.id),
            from: part.owner,
            to: recipient,
            timestamp,
        });

        transfer::public_transfer(part, recipient);
    }

    // Getters
    public fun serial_number(part: &Part): String {
        part.serial_number
    }

    public fun part_type(part: &Part): String {
        part.part_type
    }

    public fun manufacturer(part: &Part): String {
        part.manufacturer
    }

    public fun status(part: &Part): String {
        part.status
    }

    public fun total_flight_hours(part: &Part): u64 {
        part.total_flight_hours
    }

    public fun maintenance_due_hours(part: &Part): u64 {
        part.maintenance_due_hours
    }

    public fun needs_maintenance(part: &Part): bool {
        part.total_flight_hours >= part.maintenance_due_hours
    }
}
